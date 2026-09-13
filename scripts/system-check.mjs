/**
 * Verificação do MilWeb System (Sprint 01).
 *
 *   node scripts/system-check.mjs [http://localhost:3005]
 *
 * Para cada rota, rola até cada [data-node] e confere que a HUD mostra o mesmo
 * id; confere os atributos de mídia em <html>; confere o formato curto no
 * mobile; confere que sob reduced-motion a HUD existe sem animação. Sai com
 * código 1 em qualquer falha. Usa o Chromium do Playwright já presente nas
 * devDependencies (mesmo runner de .audit/qa-phase7.mjs).
 */
import { chromium } from "playwright";

const BASE = (process.argv[2] ?? "http://localhost:3005").replace(/\/$/, "");
const failures = [];
const ok = (cond, msg) => {
  if (!cond) failures.push(msg);
  console.log(`${cond ? "ok " : "FAIL"} ${msg}`);
};

const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });

async function page(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
  await ctx.addInitScript(() => sessionStorage.setItem("mw:booted", "1"));
  return { ctx, p: await ctx.newPage() };
}

const hudText = (p) => p.locator("[data-hud]").evaluate((el) => ({ long: el.querySelector(".mw-hud__long")?.textContent?.trim() ?? "", short: el.querySelector(".mw-hud__short")?.textContent?.trim() ?? "", progress: el.querySelector(".mw-hud__progress")?.textContent ?? "" }));

/* ---- 1. Home: cada nó vira o nó atual da HUD ao dominar a viewport ------ */
for (const path of ["/", "/en", "/es"]) {
  const { ctx, p } = await page();
  await p.goto(BASE + path, { waitUntil: "networkidle" });
  await p.waitForTimeout(600);
  const html = await p.evaluate(() => ({ bp: document.documentElement.dataset.bp, pointer: document.documentElement.dataset.pointer, reduce: document.documentElement.dataset.reduce ?? null }));
  ok(html.bp === "desktop" && html.pointer === "fine" && html.reduce === null, `${path}: <html data-bp=${html.bp} data-pointer=${html.pointer} data-reduce=${html.reduce}>`);

  const nodes = await p.$$eval("[data-node]", (els) => els.map((el) => ({ id: el.dataset.node, key: el.dataset.nodeKey, index: Number(el.dataset.nodeIndex) })));
  const ids = nodes.map((n) => n.index);
  ok(ids.length === 13 && ids.every((v, i) => v === i + 1), `${path}: 13 nós contíguos MW/001..013 (${ids.join(",")})`);

  const first = await hudText(p);
  ok(first.long.startsWith("MW/001"), `${path}: HUD abre em MW/001 (${first.long})`);
  ok(first.progress === "000", `${path}: progresso inicial 000 (${first.progress})`);

  if (path === "/") {
    // Contraste garantido: fundo próprio, não difference-blend contra o que estiver atrás
    // (a especificidade de .mw-hud.t-mono também precisa vencer .t-mono, testada aqui).
    const style = await p.evaluate(() => {
      const cs = getComputedStyle(document.querySelector("[data-hud]"));
      return { mixBlend: cs.mixBlendMode, bg: cs.backgroundImage, fontSize: cs.fontSize };
    });
    ok(style.mixBlend === "normal", `HUD sem mix-blend-mode (era difference): ${style.mixBlend}`);
    ok(style.bg.includes("gradient"), `HUD tem fundo próprio garantindo contraste: ${style.bg.slice(0, 40)}`);
    ok(style.fontSize === "11px", `HUD com o próprio tamanho de fonte, não o de .t-mono: ${style.fontSize}`);
  }

  for (const n of nodes) {
    // Coloca o centro do nó no centro da viewport: ele domina a sobreposição.
    await p.evaluate((key) => {
      const el = document.querySelector(`[data-node-key="${key}"]`);
      const r = el.getBoundingClientRect();
      const target = window.scrollY + r.top + Math.min(r.height, window.innerHeight) / 2 - window.innerHeight / 2;
      window.scrollTo({ top: Math.max(0, target), behavior: "instant" });
    }, n.key);
    await p.waitForTimeout(250);
    const t = await hudText(p);
    ok(t.long.startsWith(n.id), `${path}: em ${n.key} a HUD diz ${t.long.slice(0, 40)}`);
  }
  await ctx.close();
}

/* ---- 2. Rotas internas: nó estampado e fallback raiz --------------------- */
const routes = [
  ["/projetos/terral", "MW/003"],
  ["/projetos/aurex-timepieces", "MW/005"],
  ["/lab", "MW/009"],
  ["/estudio", "MW/011"],
  ["/contato", "MW/013"],
  ["/projetos", "MW/001"],
  ["/servicos", "MW/001"],
];
{
  const { ctx, p } = await page();
  for (const [path, id] of routes) {
    await p.goto(BASE + path, { waitUntil: "networkidle" });
    await p.waitForTimeout(400);
    const t = await hudText(p);
    ok(t.long.startsWith(id), `${path}: HUD ${t.long.slice(0, 40)} (esperado ${id})`);
    const nav = await p.locator("header[data-nav-root] > span[aria-hidden]").textContent().catch(() => "");
    ok((nav ?? "").includes(id), `${path}: nav mostra ${(nav ?? "").trim()}`);
  }
  await ctx.close();
}

/* ---- 3. Mobile: formato curto e área segura ------------------------------ */
{
  const { ctx, p } = await page({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await p.goto(BASE + "/", { waitUntil: "networkidle" });
  await p.waitForTimeout(600);
  const html = await p.evaluate(() => ({ bp: document.documentElement.dataset.bp, pointer: document.documentElement.dataset.pointer }));
  ok(html.bp === "mobile" && html.pointer === "coarse", `mobile: <html data-bp=${html.bp} data-pointer=${html.pointer}>`);
  const vis = await p.evaluate(() => {
    const long = document.querySelector(".mw-hud__long");
    const short = document.querySelector(".mw-hud__short");
    const r = document.querySelector("[data-hud]").getBoundingClientRect();
    return { long: getComputedStyle(long).display, short: getComputedStyle(short).display, shortText: short.textContent.trim(), bottom: window.innerHeight - r.bottom, overflowX: document.documentElement.scrollWidth > window.innerWidth };
  });
  ok(vis.long === "none" && vis.short !== "none", `mobile: só o formato curto visível (${vis.shortText})`);
  ok(/^001 \/ /.test(vis.shortText), `mobile: formato "001 / TÍTULO" (${vis.shortText})`);
  ok(!vis.overflowX, "mobile: sem overflow horizontal");
  await ctx.close();
}

/* ---- 4. Reduced motion: HUD presente, sem animação, atributo no <html> --- */
{
  const { ctx, p } = await page({ reducedMotion: "reduce" });
  await p.goto(BASE + "/", { waitUntil: "networkidle" });
  await p.waitForTimeout(600);
  const r = await p.evaluate(() => ({ reduce: document.documentElement.dataset.reduce, anim: getComputedStyle(document.querySelector(".mw-hud__long")).animationName, text: document.querySelector(".mw-hud__long").textContent.trim() }));
  ok(r.reduce === "1", `reduce: <html data-reduce=${r.reduce}>`);
  ok(r.anim === "none", `reduce: rótulo sem animação (${r.anim})`);
  ok(r.text.startsWith("MW/001"), `reduce: HUD continua informando (${r.text.slice(0, 30)})`);
  await ctx.close();
}

await browser.close();
console.log(failures.length ? `\n${failures.length} falha(s)` : "\ntudo ok");
process.exit(failures.length ? 1 : 0);
