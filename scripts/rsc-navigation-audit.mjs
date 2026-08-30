/**
 * Auditoria de navegação RSC — reproduz a matriz de navegação do site e
 * falha se em algum momento o DOCUMENTO mostrado ao usuário for um payload
 * Flight (text/x-component) em vez de HTML.
 *
 *   node scripts/rsc-navigation-audit.mjs [--base http://localhost:3000]
 *        [--browsers chromium,webkit,firefox] [--viewports 390x844,1440x900]
 *        [--cycles 0] [--tag baseline] [--only nav|dwell|direct|history|locale|stress]
 *
 * Para cada navegação registra: URL clicada, URL final, status e Content-Type
 * do último document response, se houve hard navigation (token de window
 * perdido), requests `_rsc`/`RSC: 1`, redirect chain, erros de console e se
 * o texto visível parece Flight. Relatório JSON em scripts/.rsc-audit/<tag>.json.
 */
import { chromium, webkit, firefox } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const args = Object.fromEntries(
  process.argv.slice(2).map((a, i, all) => (a.startsWith("--") ? [a.slice(2), all[i + 1]?.startsWith("--") || all[i + 1] === undefined ? true : all[i + 1]] : [])).filter((x) => x.length),
);
const BASE = (args.base ?? "http://localhost:3000").replace(/\/$/, "");
const BROWSERS = String(args.browsers ?? "chromium,webkit").split(",");
const VIEWPORTS = String(args.viewports ?? "390x844,1440x900").split(",").map((v) => v.split("x").map(Number));
const CYCLES = Number(args.cycles ?? 0);
const TAG = String(args.tag ?? "run");
const ONLY = args.only ? String(args.only).split(",") : null;
const HEADED = !!args.headed;

const FLIGHT_RE = /(^|\n)\s*\d+:\s*(\[|"\$|I\[|\{|null|"[A-Za-z$])/;
const FLIGHT_TOKENS = ["$L", "$Sreact", "react.fragment", '"$"', "$I"];
const CONSOLE_FAIL = /NotFoundError|removeChild|Hydration failed|Server Components|Failed to fetch RSC payload|Unexpected response|ChunkLoadError|Minified React error|NEXT_REDIRECT|NEXT_NOT_FOUND|hydrat/i;

const CASE_A = "terral";
const CASE_B = "one-piece";

/** Matriz de navegação (URLs públicas). `via` = href clicado. */
const NAV_MATRIX = [
  ["/", "/projetos"],
  ["/", "/estudio"],
  ["/", "/servicos"],
  ["/", "/contato"],
  ["/", "/lab"],
  ["/projetos", `/projetos/${CASE_A}`],
  [`/projetos/${CASE_A}`, "NEXT_CASE"],
  [`/projetos/${CASE_A}`, "/projetos"],
  ["/projetos", "/estudio"],
  ["/estudio", "/servicos"],
  ["/servicos", "/contato"],
  ["/contato", "/"],
  ["/en/work", `/en/work/${CASE_B}`],
  ["/es/proyectos", `/es/proyectos/${CASE_A}`],
];
/**
 * Caso que reproduz o bug: aterrissar na Home, deixar o Boot terminar
 * (primeira visita ≈ 6 s) e só então navegar. [origem, destino, espera em ms].
 */
const DWELL_MATRIX = [
  ["/", "/projetos", 7500],
  ["/", "LANG:en", 7500],
  ["/en", "/en/studio", 7500],
  ["/es", "LANG:pt", 7500],
];
const LOCALE_MATRIX = [
  ["/", "en"],
  ["/en", "es"],
  ["/es", "pt"],
  ["/projetos", "en"],
  ["/en/studio", "es"],
  ["/es/servicios", "pt"],
  [`/projetos/${CASE_A}`, "en"],
  [`/en/work/${CASE_A}`, "es"],
  [`/es/proyectos/${CASE_A}`, "pt"],
];
const DIRECT = ["/", "/projetos", "/estudio", "/servicos", "/contato", "/lab", `/projetos/${CASE_A}`, "/en", "/en/work", "/en/studio", "/en/services", "/en/contact", `/en/work/${CASE_A}`, "/es", "/es/proyectos", "/es/estudio", "/es/servicios", "/es/contacto", `/es/proyectos/${CASE_A}`, "/pt", "/work", "/en/projetos", "/nao-existe"];
const STRESS = ["/", "/projetos", `/projetos/${CASE_A}`, "NEXT_CASE", "/estudio", "/servicos", "/contato", "/"];

const engines = { chromium, webkit, firefox };
const report = { base: BASE, tag: TAG, startedAt: new Date().toISOString(), runs: [] };
let failures = 0;

function stripQuery(u) {
  return u.replace(/\?.*$/, "");
}

async function makePage(browser, [w, h]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: false, hasTouch: w < 800 });
  const page = await ctx.newPage();
  const log = { docs: [], rsc: [], console: [], errors: [] };
  page.on("response", async (res) => {
    const req = res.request();
    const ct = res.headers()["content-type"] ?? "";
    const url = res.url();
    const isDoc = req.resourceType() === "document";
    const hasRsc = url.includes("_rsc=") || req.headers()["rsc"] === "1";
    if (!isDoc && !hasRsc) return;
    const entry = {
      url: url.replace(BASE, ""),
      status: res.status(),
      contentType: ct,
      resourceType: req.resourceType(),
      reqHeaders: pick(req.headers(), ["rsc", "next-router-state-tree", "next-router-prefetch", "next-url", "accept"]),
      resHeaders: pick(res.headers(), ["vary", "cache-control", "x-matched-path", "x-nextjs-cache", "x-middleware-rewrite", "location", "x-nextjs-rewrite"]),
      redirectedFrom: req.redirectedFrom()?.url().replace(BASE, "") ?? null,
      t: Date.now(),
    };
    (isDoc ? log.docs : log.rsc).push(entry);
  });
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") log.console.push({ type: m.type(), text: m.text().slice(0, 300) });
  });
  page.on("pageerror", (e) => log.errors.push(String(e).slice(0, 300)));
  return { ctx, page, log };
}

function pick(h, keys) {
  const o = {};
  for (const k of keys) if (h[k] !== undefined) o[k] = h[k];
  return o;
}

async function settle(page) {
  try {
    await page.waitForLoadState("domcontentloaded", { timeout: 8000 });
  } catch {}
  await page.waitForTimeout(500);
}

/** Inspeciona o documento visível e devolve diagnóstico. */
async function inspect(page) {
  return page.evaluate(() => {
    const text = (document.body?.innerText ?? document.documentElement.textContent ?? "").slice(0, 4000);
    return {
      href: location.href,
      contentType: document.contentType,
      hasNav: !!document.querySelector("[data-nav-root]"),
      hasHtmlLang: document.documentElement.lang,
      token: window.__rscAuditToken ?? null,
      isPre: document.body?.firstElementChild?.tagName === "PRE" && document.body.children.length === 1,
      textHead: text.slice(0, 300),
      hasStyles: !!document.querySelector('link[rel="stylesheet"], style'),
    };
  });
}

function judge(step, before, after, log, sliceFrom) {
  const problems = [];
  const docs = log.docs.filter((d) => d.t >= sliceFrom);
  const lastDoc = docs[docs.length - 1];
  const hard = before?.token && after.token !== before.token;
  if (after.contentType !== "text/html") problems.push(`document.contentType=${after.contentType}`);
  if (lastDoc && !/text\/html/.test(lastDoc.contentType)) problems.push(`document response Content-Type=${lastDoc.contentType} (${lastDoc.url})`);
  if (after.isPre) problems.push("body é um único <pre> (payload bruto)");
  if (FLIGHT_RE.test(after.textHead) || FLIGHT_TOKENS.filter((t) => after.textHead.includes(t)).length >= 2) problems.push(`texto visível parece Flight: ${JSON.stringify(after.textHead.slice(0, 120))}`);
  if (!after.hasNav) problems.push("nav ausente (layout não renderizou?)");
  if (/Application error: a client-side exception/.test(after.textHead)) problems.push("página de erro global do Next (crash client-side)");
  if (!after.hasStyles) problems.push("sem CSS");
  const cons = log.console.filter((c) => CONSOLE_FAIL.test(c.text));
  if (cons.length) problems.push(`console: ${cons.map((c) => c.text.slice(0, 120)).join(" | ")}`);
  if (log.errors.length) problems.push(`pageerror: ${log.errors.join(" | ")}`);
  const expected = step.expect;
  if (expected && stripQuery(new URL(after.href).pathname) !== expected) problems.push(`URL final ${new URL(after.href).pathname} ≠ esperado ${expected}`);
  return { ...step, hard: !!hard, finalUrl: after.href.replace(BASE, ""), lastDoc, rsc: log.rsc.filter((r) => r.t >= sliceFrom), problems, ok: problems.length === 0 };
}

async function tagWindow(page) {
  const token = Math.random().toString(36).slice(2);
  await page.evaluate((t) => (window.__rscAuditToken = t), token);
  return token;
}

/** Clica num link real (abre o menu mobile se preciso). */
async function clickHref(page, href, vw) {
  const sel = href === "NEXT_CASE" ? '[data-inspect="CTA / NEXT"]' : `a[href="${href}"]`;
  return clickLocator(page, await findLink(page, sel, vw), sel);
}

/**
 * Localiza o link clicável. No mobile os links de rota vivem no overlay
 * (#nav-overlay, fechado por clip-path — o Playwright ainda os considera
 * "visíveis"): se o único candidato estiver lá, abre o menu antes.
 */
async function findLink(page, sel, vw) {
  const outside = page.locator(`${sel}:not(#nav-overlay *):not([data-nav-root] *)`).filter({ visible: true }).first();
  if (await outside.count()) return outside;
  const header = page.locator(`[data-nav-root] ${sel}`).filter({ visible: true }).first();
  if (await header.count()) return header; // wordmark e links desktop vivem no header
  const inOverlay = page.locator(`#nav-overlay ${sel}`).first();
  if (await inOverlay.count()) {
    await page.locator('button[aria-controls="nav-overlay"]').click();
    await page.waitForTimeout(1200);
    return inOverlay;
  }
  throw new Error(`link não encontrado: ${sel}`);
}

/** Scroll instantâneo + clique forçado no centro; falha se algo cobre o link. */
async function clickLocator(page, target, sel) {
  const resolved = await target.getAttribute("href");
  // Scroll instantâneo (Lenis/GSAP mantêm o layout em movimento; a checagem de
  // estabilidade do Playwright nunca fecha) e clique forçado no centro do link.
  await target.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
  await page.waitForTimeout(400);
  // Boot/overlays podem cobrir o link por alguns segundos: tenta até 6×.
  for (let attempt = 0; ; attempt++) {
    const box = await target.boundingBox();
    if (!box) throw new Error(`link sem caixa: ${sel}`);
    const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
    const hit = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest("a")?.getAttribute("href") ?? null, [cx, cy]);
    if (hit === resolved) {
      await page.mouse.click(cx, cy);
      return resolved;
    }
    if (attempt >= 5) throw new Error(`clique cairia em ${hit} e não em ${resolved} (elemento coberto)`);
    await page.waitForTimeout(1000);
    await target.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
  }
}

async function waitUrl(page, expected) {
  try {
    await page.waitForURL((u) => stripQuery(u.pathname) === expected, { timeout: 10000 });
  } catch {}
  await page.waitForTimeout(900);
}

async function run(browserName, vp) {
  const browser = await engines[browserName].launch({ headless: !HEADED });
  const steps = [];
  const pushResult = (r) => {
    steps.push(r);
    if (!r.ok) failures++;
    const mark = r.ok ? "PASS" : "FAIL";
    console.log(`  ${mark} [${r.kind}] ${r.from ?? ""} → ${r.to ?? r.expect} ${r.hard ? "(HARD)" : "(soft)"}${r.problems.length ? "\n        " + r.problems.join("\n        ") : ""}`);
  };

  const want = (k) => !ONLY || ONLY.includes(k);

  // 1) Navegação por clique
  if (want("nav")) {
    for (const [from, to] of NAV_MATRIX) {
      const { ctx, page, log } = await makePage(browser, vp);
      try {
        await page.goto(BASE + from);
        await settle(page);
        const before = await inspect(page);
        await tagWindow(page);
        const before2 = await inspect(page);
        const t0 = Date.now();
        const href = await clickHref(page, to, vp[0]);
        const expect = to === "NEXT_CASE" ? href : to;
        await waitUrl(page, expect);
        const after = await inspect(page);
        pushResult(judge({ kind: "nav", from, to: href, expect }, before2, after, log, t0));
      } catch (e) {
        pushResult({ kind: "nav", from, to, problems: [`exceção: ${e.message.slice(0, 200)}`], ok: false, rsc: [] });
      }
      await ctx.close();
    }
  }

  // 1b) Home com espera (Boot concluído) → navegação
  if (want("dwell")) {
    for (const [from, to, ms] of DWELL_MATRIX) {
      const { ctx, page, log } = await makePage(browser, vp);
      try {
        await page.goto(BASE + from);
        await page.waitForTimeout(ms);
        const bootGone = !(await page.evaluate(() => !!document.getElementById("mw-boot")));
        await tagWindow(page);
        const before = await inspect(page);
        const t0 = Date.now();
        const sel = to.startsWith("LANG:") ? `a[lang="${to.slice(5) === "pt" ? "pt-BR" : to.slice(5)}"]` : `a[href="${to}"]`;
        const href = await clickLocator(page, await findLink(page, sel, vp[0]), sel);
        await waitUrl(page, href);
        const after = await inspect(page);
        pushResult(judge({ kind: `dwell${ms}${bootGone ? "" : "(boot ainda presente)"}`, from, to: href, expect: href }, before, after, log, t0));
      } catch (e) {
        pushResult({ kind: `dwell${ms}`, from, to, problems: [`exceção: ${e.message.slice(0, 200)}`], ok: false, rsc: [] });
      }
      await ctx.close();
    }
  }

  // 2) Troca de idioma
  if (want("locale")) {
    for (const [from, lang] of LOCALE_MATRIX) {
      const { ctx, page, log } = await makePage(browser, vp);
      try {
        await page.goto(BASE + from);
        await settle(page);
        await tagWindow(page);
        const before = await inspect(page);
        const t0 = Date.now();
        const href = await clickHref(page, `LANG:${lang}`, vp[0]).catch(async () => {
          // seletor de idioma: a[hreflang]
          const l = await findLink(page, `a[lang="${lang === "pt" ? "pt-BR" : lang}"]`, vp[0]);
          return clickLocator(page, l, `a[lang=${lang}]`);
        });
        await waitUrl(page, href);
        const after = await inspect(page);
        pushResult(judge({ kind: "locale", from, to: href, expect: href }, before, after, log, t0));
      } catch (e) {
        pushResult({ kind: "locale", from, to: lang, problems: [`exceção: ${e.message.slice(0, 200)}`], ok: false, rsc: [] });
      }
      await ctx.close();
    }
  }

  // 3) Histórico: back / forward / reload numa sequência
  if (want("history")) {
    const { ctx, page, log } = await makePage(browser, vp);
    try {
      await page.goto(BASE + "/");
      await settle(page);
      const seq = ["/projetos", `/projetos/${CASE_A}`, "/estudio"];
      for (const to of seq) {
        await clickHref(page, to, vp[0]);
        await waitUrl(page, to);
      }
      const ops = [
        ["back", "/projetos/" + CASE_A],
        ["back", "/projetos"],
        ["forward", "/projetos/" + CASE_A],
        ["reload", "/projetos/" + CASE_A],
        ["back", "/projetos"],
        ["back", "/"],
        ["forward", "/projetos"],
      ];
      for (const [op, expect] of ops) {
        await tagWindow(page);
        const before = await inspect(page);
        const t0 = Date.now();
        if (op === "back") await page.goBack({ waitUntil: "commit" }).catch(() => {});
        else if (op === "forward") await page.goForward({ waitUntil: "commit" }).catch(() => {});
        else await page.reload({ waitUntil: "commit" }).catch(() => {});
        await waitUrl(page, expect);
        await settle(page);
        const after = await inspect(page);
        pushResult(judge({ kind: "history", from: op, expect }, before, after, log, t0));
      }
    } catch (e) {
      pushResult({ kind: "history", problems: [`exceção: ${e.message.slice(0, 200)}`], ok: false, rsc: [] });
    }
    await ctx.close();
  }

  // 4) Abertura direta
  if (want("direct")) {
    for (const u of DIRECT) {
      const { ctx, page, log } = await makePage(browser, vp);
      try {
        const t0 = Date.now();
        await page.goto(BASE + u);
        await settle(page);
        const after = await inspect(page);
        const r = judge({ kind: "direct", from: "(direto)", to: u }, null, after, log, t0);
        // 404 esperado: sem nav é aceitável; status precisa ser 404 e HTML.
        if (u === "/nao-existe") {
          r.problems = r.problems.filter((p) => !p.startsWith("nav ausente"));
          if (r.lastDoc?.status !== 404) r.problems.push(`status ${r.lastDoc?.status} ≠ 404`);
          r.ok = r.problems.length === 0;
        }
        pushResult(r);
      } catch (e) {
        pushResult({ kind: "direct", to: u, problems: [`exceção: ${e.message.slice(0, 200)}`], ok: false, rsc: [] });
      }
      await ctx.close();
    }
  }

  // 5) Estresse: N ciclos numa única aba
  if (want("stress") && CYCLES > 0) {
    const { ctx, page, log } = await makePage(browser, vp);
    await page.goto(BASE + "/");
    await settle(page);
    let cycleFails = 0;
    for (let c = 0; c < CYCLES; c++) {
      for (const to of STRESS.slice(1)) {
        try {
          await tagWindow(page);
          const before = await inspect(page);
          const t0 = Date.now();
          const href = await clickHref(page, to, vp[0]);
          const expect = to === "NEXT_CASE" ? href : to;
          await waitUrl(page, expect);
          const after = await inspect(page);
          const r = judge({ kind: `stress#${c + 1}`, from: before.href.replace(BASE, ""), to: href, expect }, before, after, log, t0);
          if (!r.ok || r.hard) {
            pushResult(r);
            if (!r.ok) cycleFails++;
          } else steps.push(r);
        } catch (e) {
          cycleFails++;
          pushResult({ kind: `stress#${c + 1}`, to, problems: [`exceção: ${e.message.slice(0, 200)}`], ok: false, rsc: [] });
        }
      }
      const langs = ["en", "es", "pt"];
      for (const lang of langs) {
        try {
          await tagWindow(page);
          const before = await inspect(page);
          const t0 = Date.now();
          const l = await findLink(page, `a[lang="${lang === "pt" ? "pt-BR" : lang}"]`, vp[0]);
          const href = await clickLocator(page, l, `a[lang=${lang}]`);
          await waitUrl(page, href);
          const after = await inspect(page);
          const r = judge({ kind: `stress#${c + 1}`, from: before.href.replace(BASE, ""), to: href, expect: href }, before, after, log, t0);
          if (!r.ok || r.hard) {
            pushResult(r);
            if (!r.ok) cycleFails++;
          } else steps.push(r);
        } catch (e) {
          cycleFails++;
          pushResult({ kind: `stress#${c + 1}`, to: lang, problems: [`exceção: ${e.message.slice(0, 200)}`], ok: false, rsc: [] });
        }
      }
    }
    console.log(`  stress: ${CYCLES} ciclos, ${steps.filter((s) => s.kind.startsWith("stress")).length} navegações, ${cycleFails} falhas, ${steps.filter((s) => s.kind.startsWith("stress") && s.hard).length} hard navs`);
    await ctx.close();
  }

  await browser.close();
  return steps;
}

const outDir = join(dirname(fileURLToPath(import.meta.url)), ".rsc-audit");
mkdirSync(outDir, { recursive: true });

for (const b of BROWSERS) {
  for (const vp of VIEWPORTS) {
    console.log(`\n=== ${b} ${vp.join("x")} ===`);
    try {
      const steps = await run(b, vp);
      report.runs.push({ browser: b, viewport: vp.join("x"), steps });
    } catch (e) {
      console.log(`  !! ${b} indisponível: ${e.message.slice(0, 200)}`);
      report.runs.push({ browser: b, viewport: vp.join("x"), error: String(e) });
    }
  }
}

report.failures = failures;
report.finishedAt = new Date().toISOString();
const out = join(outDir, `${TAG}.json`);
writeFileSync(out, JSON.stringify(report, null, 2));

const total = report.runs.reduce((n, r) => n + (r.steps?.length ?? 0), 0);
const hard = report.runs.reduce((n, r) => n + (r.steps?.filter((s) => s.hard && !s.kind.startsWith("direct") && s.from !== "reload").length ?? 0), 0);
console.log(`\n${failures === 0 ? "PASS" : "FAIL"} — ${total} passos, ${failures} falhas, ${hard} hard navigations inesperadas. Relatório: ${out}`);
process.exit(failures ? 1 : 0);
