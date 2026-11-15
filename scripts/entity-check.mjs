/**
 * Verificação do personagem do MilWeb OS (features/os/scene) num navegador de verdade.
 *
 *   node scripts/entity-check.mjs [--base http://localhost:3120] [--only desktop,notebook,…] [--out .audit/entity/check] [--software]
 *   node scripts/entity-check.mjs --video        → grava a demonstração (.audit/entity/demo/*.webm; converta com ffmpeg)
 *
 * O que mede e confere:
 *   · os seis aplicativos abrem com mouse, toque e teclado, e a janela em foco é a do app ativado;
 *   · erro entre a ponta do indicador projetada e o ponto de contato do ícone no DOM (px CSS) no
 *     instante do toque, em quatro viewports, dois temas e três idiomas, e depois de redimensionar;
 *   · o braço não estica além do limite (`short` = 0) e não há salto de articulação (`joints.jumps`);
 *   · cliques rápidos A → B → C terminam em C, sem toque atrasado nem janela errada;
 *   · a navegação funciona enquanto o modelo carrega, sem o modelo, sem WebGL e com movimento reduzido;
 *   · a URL do modelo leva a revisão do arquivo, e um GLB de outra revisão (cache antigo) cai na imagem e avisa;
 *   · o fundo não intercepta o ponteiro; quadros por segundo reais em repouso e num gesto;
 *   · a apresentação (surgir, giro, reverência) e a sua interrupção; os atalhos sociais em 3D: links e
 *     atributos intactos, hover/pressão/foco, render sob demanda, e os ícones SVG de volta sem WebGL.
 *
 * A página expõe o estado da cena em `window.__mwOsScene` (sempre em desenvolvimento; em produção,
 * só com `?scene-debug`). GPU: a real da máquina (ANGLE/D3D11) por padrão; `--software` usa SwiftShader
 * e força a cena com `?quality=high`. Emulação de telefone NÃO é medição em aparelho físico.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const argv = process.argv.slice(2);
const arg = (k, d) => {
  const i = argv.indexOf(k);
  return i >= 0 ? argv[i + 1] : d;
};
const BASE = arg("--base", "http://localhost:3120");
const OUT = arg("--out", ".audit/entity/check");
const ONLY = (arg("--only", "") || "").split(",").filter(Boolean);
const SOFTWARE = argv.includes("--software");
const VIDEO = argv.includes("--video");
const APPS = ["projects", "services", "studio", "lab", "profile", "contact"];
const ERR_MAX = 12; // px CSS — meta do briefing: 8–12
fs.mkdirSync(OUT, { recursive: true });

const launchArgs = SOFTWARE ? ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] : ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"];
const browser = await chromium.launch({ args: launchArgs });
const want = (g) => ONLY.length === 0 || ONLY.includes(g);

const results = [];
const measures = [];
let failed = 0;
const check = (name, ok, detail = "") => {
  results.push({ name, ok: !!ok, detail });
  if (!ok) failed++;
  console.log(`${ok ? "  ok  " : " FALHA"} ${name}${detail ? "  — " + detail : ""}`);
};

const langPath = { pt: "", en: "/en", es: "/es" };
/** Abre a raiz num contexto novo. `query` extra; `route` instala rotas antes de navegar. */
async function open({ w, h, mobile = false, theme = "obito", lang = "pt", query = "", reduced = false, route = null, wait = true, video = null }) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: 1,
    isMobile: mobile,
    hasTouch: mobile,
    colorScheme: theme === "obito" ? "dark" : "light",
    reducedMotion: reduced ? "reduce" : "no-preference",
    ...(video ? { recordVideo: { dir: video, size: { width: w, height: h } } } : {}),
  });
  await ctx.addInitScript((t) => {
    try {
      sessionStorage.setItem("milweb-os:booted", "1");
      localStorage.setItem("milweb-os:prefs", JSON.stringify({ theme: t }));
    } catch {}
  }, theme);
  const page = await ctx.newPage();
  const errors = [];
  // Fora da Vercel, /_vercel/insights (Analytics) não existe: esse 404 é do ambiente local, não do site.
  page.on("console", (m) => m.type() === "error" && !/_vercel\/|Failed to load resource/.test(m.text()) && errors.push(m.text().slice(0, 240)));
  page.on("response", (r) => r.status() >= 400 && !/_vercel\//.test(r.url()) && !/models\/entity\.glb/.test(r.url()) && errors.push(`HTTP ${r.status()} ${r.url().slice(0, 160)}`));
  page.on("pageerror", (e) => errors.push("pageerror: " + String(e).slice(0, 240)));
  if (route) await route(page);
  const q = ["scene-debug", SOFTWARE && !/quality=/.test(query) ? "quality=high" : "", query].filter(Boolean).join("&");
  await page.goto(`${BASE}${langPath[lang]}/?${q}`, { waitUntil: "domcontentloaded" });
  let live = false;
  if (wait) live = await page.waitForSelector('.os-scene[data-state="live"]', { timeout: 60000 }).then(() => true).catch(() => false);
  return { ctx, page, errors, live };
}

const scene = (page) =>
  page.evaluate(() => {
    const s = window.__mwOsScene;
    if (!s) return null;
    return { ...s.entity, fps: s.fps, dpr: s.dpr, stats: s.stats, frames: s.frames, mood: s.mood };
  });
const icon = (id, mobile) => (mobile ? `#os-launch-${id}` : `#os-icon-${id}`);
const focusedApp = (page) => page.evaluate(() => document.querySelector('.os-window[data-focused="1"]')?.getAttribute("data-app") ?? null);
const openApps = (page) => page.evaluate(() => [...document.querySelectorAll(".os-window")].map((w) => w.getAttribute("data-app")));

/** Grava o estado da cena a cada quadro do navegador (rAF) até `stop()`. */
async function record(page) {
  await page.evaluate(() => {
    const rec = (window.__rec = { on: true, rows: [] });
    const tick = () => {
      if (!rec.on) return;
      const s = window.__mwOsScene;
      if (s) {
        const e = s.entity;
        rec.rows.push({ t: performance.now(), phase: e.phase, err: e.err, short: e.short, ik: e.ik, target: e.target, touches: e.touches });
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  return () =>
    page.evaluate(() => {
      window.__rec.on = false;
      return window.__rec.rows;
    });
}

/**
 * Um gesto completo num app: destaca (mouse), ativa (clique/toque/Enter), espera o toque e mede.
 * Devolve { opened, touched, ms (ativação → toque), err (no toque), errMin/errMax (durante o toque), gap (na atenção), short }.
 */
async function gesture(page, id, { mobile = false, how = "mouse", shot = null } = {}) {
  const sel = icon(id, mobile);
  const before = (await scene(page))?.touches ?? 0;
  let gap = null;
  if (how === "mouse") {
    await page.hover(sel);
    await page.waitForTimeout(650);
    gap = (await scene(page))?.err ?? null;
  } else if (how === "keyboard") {
    await page.focus(sel);
    await page.waitForTimeout(650);
    gap = (await scene(page))?.err ?? null;
  }
  const stop = await record(page);
  const t0 = await page.evaluate(() => performance.now());
  if (how === "keyboard") await page.keyboard.press("Enter");
  else if (mobile) await page.tap(sel);
  else await page.click(sel);
  const touched = await page.waitForFunction((n) => (window.__mwOsScene?.entity.touches ?? 0) > n, before, { timeout: 2500 }).then(() => true).catch(() => false);
  if (touched && shot) await page.screenshot({ path: shot });
  await page.waitForTimeout(450);
  const rows = await stop();
  const hit = rows.find((r) => r.touches > before);
  const during = rows.filter((r) => r.phase === "touching" && r.err != null);
  const moving = rows.filter((r) => r.phase === "reaching" || r.phase === "touching");
  const opened = mobile ? await page.evaluate((app) => !!document.querySelector(`.os-window[data-app="${app}"]`), id) : (await focusedApp(page)) === id;
  return {
    id,
    opened,
    touched,
    ms: hit ? Math.round(hit.t - t0) : null,
    err: hit?.err ?? null,
    errMin: during.length ? Math.min(...during.map((r) => r.err)) : null,
    errMax: during.length ? Math.max(...during.map((r) => r.err)) : null,
    gap,
    short: moving.length ? Math.max(...moving.map((r) => r.short)) : 0,
  };
}

const closeDesktop = async (page) => {
  await page.keyboard.press("Escape");
  await page.waitForTimeout(350);
};
const fmt = (v, d = 1) => (v == null ? "—" : v.toFixed(d));

/** Os seis apps num viewport: abre, mede, fecha. */
async function sweep(group, opts, { how = "mouse", apps = APPS } = {}) {
  const { ctx, page, errors, live } = await open(opts);
  check(`${group}: cena viva (modelo carregado, canvas em cena)`, live);
  if (!live) return void (await ctx.close());
  await page.waitForTimeout(600);
  await page.evaluate(() => window.__mwOsScene.resetJoints());
  for (const id of apps) {
    const g = await gesture(page, id, { mobile: !!opts.mobile, how, shot: path.join(OUT, `${group}-${id}.png`) });
    measures.push({ group, how, ...g });
    const okErr = g.err != null && g.err <= ERR_MAX;
    check(`${group} · ${id}: abre${how === "mouse" ? " com mouse" : how === "keyboard" ? " com Enter" : " com toque"}, a ponta do dedo encosta (erro ${fmt(g.err)} px ≤ ${ERR_MAX}), braço sem esticar`, g.opened && g.touched && okErr && g.short < 0.012, JSON.stringify({ ms: g.ms, err: g.err && +g.err.toFixed(2), errMax: g.errMax && +g.errMax.toFixed(2), gap: g.gap && +g.gap.toFixed(1), short: +g.short.toFixed(4), opened: g.opened }));
    if (opts.mobile) {
      await page.goBack();
      await page.waitForTimeout(900);
    } else await closeDesktop(page);
  }
  if (!opts.mobile) await page.mouse.move(opts.w * 0.75, opts.h * 0.45);
  await page.waitForTimeout(1500);
  const s = await scene(page);
  check(`${group}: sem salto de articulação; cotovelo dentro dos limites (6°–150°)`, s.joints.jumps === 0 && s.joints.elbowMin >= 5.5 && s.joints.elbowMax <= 150.5, JSON.stringify({ maxStep: +s.joints.maxStep.toFixed(1), jumps: s.joints.jumps, elbow: [+s.joints.elbowMin.toFixed(1), +s.joints.elbowMax.toFixed(1)] }));
  check(`${group}: depois de fechar tudo, o personagem volta ao repouso e nenhuma janela fica aberta`, (s.phase === "idle" || s.phase === "returning") && (await openApps(page)).length === 0, s.phase);
  check(`${group}: o fundo não intercepta o ponteiro`, await page.evaluate(() => getComputedStyle(document.querySelector(".os-scene")).pointerEvents === "none" && getComputedStyle(document.querySelector(".os-scene__canvas")).pointerEvents === "none"));
  check(`${group}: console sem erros`, errors.length === 0, errors.slice(0, 3).join(" | "));
  await ctx.close();
}

if (!VIDEO) {
  const D = { w: 1920, h: 1080 };
  const N = { w: 1366, h: 768 };
  const T = { w: 900, h: 1100 };
  const P = { w: 390, h: 844, mobile: true };

  if (want("desktop")) await sweep("desktop 1920×1080", D);
  if (want("notebook")) await sweep("notebook 1366×768", N);
  if (want("tablet")) await sweep("tablet 900×1100", T);
  if (want("theme")) await sweep("notebook · tema claro", { ...N, theme: "gojo" }, { apps: ["projects", "lab", "contact"] });
  if (want("lang")) {
    await sweep("notebook · inglês", { ...N, lang: "en" }, { apps: ["projects", "contact"] });
    await sweep("notebook · espanhol", { ...N, lang: "es" }, { apps: ["services", "profile"] });
  }
  if (want("keyboard")) await sweep("notebook · teclado", N, { how: "keyboard", apps: ["projects", "lab", "contact"] });

  // ---- telefone: toque. O app cobre a tela e o laço para em seguida — o toque do personagem tem de acontecer antes
  //      ou ser largado; nunca pode disparar atrasado quando a tela volta.
  if (want("phone")) {
    const { ctx, page, errors, live } = await open(P);
    check("telefone 390×844: cena viva", live);
    if (live) {
      await page.waitForTimeout(600);
      await page.evaluate(() => window.__mwOsScene.resetJoints());
      for (const id of APPS) {
        const before = (await scene(page)).touches;
        const stop = await record(page);
        const t0 = await page.evaluate(() => performance.now());
        await page.tap(icon(id, true));
        await page.waitForTimeout(900);
        const rows = await stop();
        const opened = await page.evaluate((app) => !!document.querySelector(`.os-window[data-app="${app}"]`), id);
        const hit = rows.find((r) => r.touches > before);
        if (hit && id === "projects") await page.screenshot({ path: path.join(OUT, `telefone-${id}.png`) });
        measures.push({ group: "telefone 390×844", how: "touch", id, opened, touched: !!hit, ms: hit ? Math.round(hit.t - t0) : null, err: hit?.err ?? null, short: Math.max(0, ...rows.filter((r) => r.phase === "touching").map((r) => r.short)) });
        await page.goBack();
        await page.waitForTimeout(1300);
        const after = await scene(page);
        check(`telefone · ${id}: abre com toque${hit ? ` e a ponta do dedo encosta (erro ${fmt(hit.err)} px)` : " (a tela cobriu antes do toque: gesto largado)"}; ao voltar, nada dispara atrasado`, opened && (!hit || hit.err <= ERR_MAX) && after.touches === before + (hit ? 1 : 0) && (after.phase === "idle" || after.phase === "returning"), JSON.stringify({ ms: hit ? Math.round(hit.t - t0) : null, err: hit?.err && +hit.err.toFixed(2), phase: after.phase }));
      }
      const s = await scene(page);
      check("telefone: sem salto de articulação", s.joints.jumps === 0, JSON.stringify(s.joints));
      check("telefone: console sem erros", errors.length === 0, errors.slice(0, 3).join(" | "));
    }
    await ctx.close();
  }

  // ---- cliques rápidos A → B → C: termina em C, sem fila ----
  if (want("rapid")) {
    const { ctx, page, errors, live } = await open(N);
    if (live) {
      await page.waitForTimeout(600);
      const seq = ["projects", "services", "contact"];
      const before = (await scene(page)).touches;
      for (const id of seq) await page.evaluate((sel) => document.querySelector(sel).click(), icon(id));
      await page.waitForTimeout(250);
      const mid = await scene(page);
      await page.waitForTimeout(2200);
      const end = await scene(page);
      const openedNow = await openApps(page);
      check("cliques rápidos (Projetos → Serviços → Contato): a janela em foco é a do último e as três abriram na hora", (await focusedApp(page)) === "contact" && seq.every((id) => openedNow.includes(id)), JSON.stringify(openedNow));
      check("cliques rápidos: o personagem foi direto ao último alvo (um toque só) e não sobrou gesto na fila", mid.target === "contact" && end.touches - before <= 1 && end.phase === "presenting", JSON.stringify({ mid: mid.phase, midTarget: mid.target, touches: end.touches - before, end: end.phase }));
      // ida e volta com janelas abertas: o ícone ainda responde e a janela certa vem para a frente
      await page.click(icon("projects"));
      await page.waitForTimeout(900);
      check("com janelas abertas, clicar num ícone traz a janela dele para a frente", (await focusedApp(page)) === "projects");
      for (let i = 0; i < 3; i++) await closeDesktop(page);
      await page.mouse.move(N.w * 0.75, N.h * 0.4);
      await page.waitForTimeout(3200);
      const done = await scene(page);
      check("fechadas as janelas, o personagem volta sozinho ao repouso", done.phase === "idle" && (await openApps(page)).length === 0, done.phase);
      check("cliques rápidos: console sem erros", errors.length === 0, errors.slice(0, 3).join(" | "));
    } else check("cliques rápidos: cena viva", false);
    await ctx.close();
  }

  // ---- redimensionar com a página aberta: o alvo é remedido ----
  if (want("resize")) {
    const { ctx, page, live } = await open(D);
    if (live) {
      for (const [w, h] of [[1366, 768], [1100, 720], [1600, 900]]) {
        await page.setViewportSize({ width: w, height: h });
        await page.waitForTimeout(700);
        const g = await gesture(page, "studio", { shot: path.join(OUT, `resize-${w}x${h}.png`) });
        measures.push({ group: `redimensionado ${w}×${h}`, how: "mouse", ...g });
        check(`redimensionado para ${w}×${h}: a ponta do dedo encosta no ícone na posição nova (erro ${fmt(g.err)} px)`, g.opened && g.touched && g.err <= ERR_MAX && g.short < 0.012, JSON.stringify({ ms: g.ms, err: g.err && +g.err.toFixed(2) }));
        await closeDesktop(page);
      }
    } else check("redimensionar: cena viva", false);
    await ctx.close();
  }

  // ---- desempenho: quadros por segundo reais em repouso e durante gestos ----
  if (want("perf")) {
    for (const [name, o] of [["desktop 1920×1080", D], ["notebook 1366×768", N], ["telefone 390×844 (emulado)", P]]) {
      const { ctx, page, live } = await open(o);
      if (live) {
        // a apresentação (4,6 s) e a folga de `fps.calm` acabam antes de medir o repouso
        await page.waitForTimeout(8500);
        const a = await scene(page);
        await page.waitForTimeout(3000);
        const b = await scene(page);
        const idleFps = (b.frames - a.frames) / 3;
        let gestFps = null;
        if (!o.mobile) {
          const c = await scene(page);
          const t0 = Date.now();
          for (const id of ["projects", "lab", "contact", "services", "studio", "profile"]) {
            await page.hover(icon(id));
            await page.waitForTimeout(450);
          }
          const d = await scene(page);
          gestFps = (d.frames - c.frames) / ((Date.now() - t0) / 1000);
        }
        const gpu = await page.evaluate(() => {
          const gl = document.createElement("canvas").getContext("webgl2");
          const ext = gl?.getExtension("WEBGL_debug_renderer_info");
          return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "?";
        });
        const row = { view: name, gpu, idleFps: +idleFps.toFixed(1), gestureFps: gestFps && +gestFps.toFixed(1), dpr: +b.dpr.toFixed(2), drawCalls: b.stats.calls, triangles: b.stats.triangles, cpuMs: +b.stats.ms.toFixed(2) };
        measures.push({ group: "desempenho", ...row });
        check(`desempenho · ${name}: laço vivo em repouso (teto 30 qps) e nos gestos (teto 60)`, idleFps > 12 && (gestFps == null || gestFps > 20), JSON.stringify(row));
      }
      await ctx.close();
    }
  }

  // ---- a navegação não depende do personagem ----
  if (want("loading")) {
    const { ctx, page } = await open({ ...N, wait: false, route: (p) => p.route("**/models/entity.glb*", async (r) => (await new Promise((res) => setTimeout(res, 4000)), r.continue())) });
    await page.waitForSelector("#os-icon-projects");
    await page.waitForTimeout(1500);
    const still = await page.getAttribute(".os-scene", "data-state");
    const img = await page.evaluate(() => /entity-(dark|light)\.webp/.test(getComputedStyle(document.querySelector(".os-scene__still")).backgroundImage));
    await page.click(icon("projects"));
    await page.waitForTimeout(500);
    check("modelo ainda carregando (4 s de atraso): imagem estática no fundo e o app abre na hora", still === "still" && img && (await focusedApp(page)) === "projects");
    await closeDesktop(page);
    const live = await page.waitForSelector('.os-scene[data-state="live"]', { timeout: 30000 }).then(() => true).catch(() => false);
    check("…e o personagem entra em cena quando o modelo chega", live);
    await ctx.close();
  }
  if (want("missing")) {
    const { ctx, page, errors } = await open({ ...N, wait: false, route: (p) => p.route("**/models/entity.glb*", (r) => r.fulfill({ status: 404, body: "" })) });
    await page.waitForSelector("#os-icon-contact");
    await page.waitForTimeout(3500);
    await page.click(icon("contact"));
    await page.waitForTimeout(500);
    const pageErrors = errors.filter((e) => e.startsWith("pageerror"));
    check("modelo ausente (404): fica a imagem estática, o app abre e nenhuma exceção escapa", (await page.getAttribute(".os-scene", "data-state")) === "still" && (await focusedApp(page)) === "contact" && pageErrors.length === 0, pageErrors.join(" | "));
    await ctx.close();
  }
  // ---- código e modelo em par: a URL leva a revisão do arquivo; um GLB de outra revisão não quebra nada e avisa ----
  if (want("model")) {
    let seen = null;
    const a = await open({ ...N, route: (p) => p.on("request", (r) => /\/models\/entity\.glb/.test(r.url()) && (seen = r.url())) });
    const rev = seen ? new URL(seen).searchParams.get("v") : null;
    const glb = seen ? Buffer.from(await (await fetch(seen)).arrayBuffer()) : null;
    const sha = glb ? createHash("sha256").update(glb).digest("hex").slice(0, 10) : null;
    check("o endereço do modelo leva a revisão do próprio arquivo (um GLB antigo no cache não encontra o código novo)", a.live && !!rev && rev === sha, `${seen} · sha256 ${sha}`);
    await a.ctx.close();
    if (glb) {
      // o mesmo arquivo sem o clipe da reverência: é o que um navegador com o modelo anterior no cache entregava
      const jsonLen = glb.readUInt32LE(12);
      const json = JSON.parse(glb.subarray(20, 20 + jsonLen).toString("utf8"));
      json.animations = json.animations.filter((c) => c.name !== "Bow");
      let body = Buffer.from(JSON.stringify(json), "utf8");
      body = Buffer.concat([body, Buffer.alloc((4 - (body.length % 4)) % 4, 0x20)]);
      const rest = glb.subarray(20 + jsonLen);
      const head = Buffer.alloc(20);
      head.writeUInt32LE(0x46546c67, 0);
      head.writeUInt32LE(2, 4);
      head.writeUInt32LE(20 + body.length + rest.length, 8);
      head.writeUInt32LE(body.length, 12);
      head.writeUInt32LE(0x4e4f534a, 16);
      const old = Buffer.concat([head, body, rest]);
      const warns = [];
      const b = await open({
        ...N,
        wait: false,
        route: (p) => {
          p.on("console", (m) => m.type() === "warning" && warns.push(m.text()));
          return p.route("**/models/entity.glb*", (r) => r.fulfill({ status: 200, contentType: "model/gltf-binary", body: old }));
        },
      });
      await b.page.waitForSelector("#os-icon-studio");
      await b.page.waitForTimeout(3500);
      await b.page.click(icon("studio"));
      await b.page.waitForTimeout(500);
      const pageErrors = b.errors.filter((e) => e.startsWith("pageerror"));
      const said = warns.find((w) => /personagem indisponível/.test(w) && /Bow/.test(w));
      check("modelo de outra revisão (sem o clipe Bow): imagem estática, o app abre, nenhuma exceção e o motivo vai para o console", (await b.page.getAttribute(".os-scene", "data-state")) === "still" && (await focusedApp(b.page)) === "studio" && pageErrors.length === 0 && !!said, said ?? `sem aviso · ${pageErrors.join(" | ")}`);
      await b.ctx.close();
    }
  }
  if (want("nowebgl")) {
    const { ctx, page, errors } = await open({ ...N, wait: false, query: "quality=low" });
    await page.waitForSelector("#os-icon-services");
    await page.waitForTimeout(2500);
    await page.hover(icon("services"));
    await page.click(icon("services"));
    await page.waitForTimeout(500);
    check("sem WebGL (perfil baixo): imagem estática, nenhum motor montado, o app abre", (await page.getAttribute(".os-scene", "data-state")) === "still" && (await page.evaluate(() => typeof window.__mwOsScene === "undefined")) && (await focusedApp(page)) === "services" && errors.length === 0, errors.join(" | "));
    await ctx.close();
  }
  if (want("reduced")) {
    const { ctx, page, errors } = await open({ ...N, wait: false, reduced: true });
    await page.waitForSelector("#os-icon-lab");
    await page.waitForTimeout(2500);
    await page.focus(icon("lab"));
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);
    check("movimento reduzido: personagem parado (imagem), foco e Enter abrem o app", (await page.getAttribute(".os-scene", "data-state")) === "still" && (await page.evaluate(() => typeof window.__mwOsScene === "undefined")) && (await focusedApp(page)) === "lab" && errors.length === 0, errors.join(" | "));
    await ctx.close();

    // Ajustes › Reduzir movimento e de volta, na mesma página: o personagem para e depois volta ao vivo sem recarregar
    const t = await open({ ...N });
    await t.page.click('[data-dock-id="settings"]');
    const chips = t.page.locator('.os-window[data-app="settings"] section[aria-labelledby="os-set-motion"] .os-chip');
    await chips.nth(1).click();
    await t.page.waitForTimeout(800);
    const stopped = (await t.page.getAttribute(".os-scene", "data-state")) === "still";
    await chips.nth(0).click();
    await t.page.keyboard.press("Escape");
    const back = await t.page.waitForSelector('.os-scene[data-state="live"]', { timeout: 20000 }).then(() => true).catch(() => false);
    const f0 = back ? (await scene(t.page))?.frames ?? 0 : 0;
    await t.page.waitForTimeout(1200);
    const f1 = back ? (await scene(t.page))?.frames ?? 0 : 0;
    check("Ajustes › Reduzir movimento e voltar: o personagem para e depois volta ao vivo, sem recarregar a página", t.live && stopped && back && f1 > f0 && t.errors.length === 0, `parou ${stopped} · voltou ${back} · quadros ${f0}→${f1} ${t.errors.join(" | ")}`);
    await t.ctx.close();
  }


  // ---- apresentação: surge, gira, faz a reverência; uma interação a interrompe sem tranco ----
  if (want("intro")) {
    const { ctx, page, errors, live } = await open(N);
    if (live) {
      await page.waitForTimeout(350);
      const a = await scene(page);
      await page.waitForTimeout(5200);
      const b = await scene(page);
      check("apresentação: ao entrar em cena o personagem se apresenta (fase intro) e termina em repouso", a.phase === "intro" && b.phase === "idle", `${a.phase} → ${b.phase}`);
      await page.evaluate(() => (window.__mwOsScene.resetJoints(), window.__mwOsScene.intro()));
      await page.waitForTimeout(1250); // no meio do giro
      await page.hover(icon("lab"));
      await page.waitForTimeout(1500);
      const c = await scene(page);
      await page.mouse.move(N.w * 0.75, N.h * 0.4);
      await page.waitForTimeout(2600);
      const d = await scene(page);
      check("apresentação interrompida no meio do giro: o personagem atende o app, volta ao repouso e nenhuma junta salta", c.phase === "attention" && c.target === "lab" && d.phase === "idle" && d.joints.jumps === 0, JSON.stringify({ mid: c.phase, end: d.phase, maxStep: +d.joints.maxStep.toFixed(1), jumps: d.joints.jumps }));
      check("apresentação: console sem erros", errors.length === 0, errors.slice(0, 3).join(" | "));
    } else check("apresentação: cena viva", false);
    await ctx.close();
  }

  // ---- atalhos sociais em 3D: os links são os de sempre; a peça só os representa ----
  if (want("social")) {
    const SOC = ["linkedin", "github", "instagram", "whatsapp"];
    const HOST = { linkedin: /^https:\/\/(www\.)?linkedin\.com\//, github: /^https:\/\/github\.com\//, instagram: /^https:\/\/(www\.)?instagram\.com\//, whatsapp: /^https:\/\/wa\.me\/\d+/ };
    const { ctx, page, errors, live } = await open(N);
    // nenhuma rede externa é visitada de verdade no teste
    await ctx.route((u) => !/^https?:\/\/(localhost|127\.0\.0\.1)/.test(u.href), (r) => r.abort());
    const on = await page.waitForSelector('.os-social[data-d3="on"]', { timeout: 30000 }).then(() => true).catch(() => false);
    check("sociais: as quatro peças 3D entram em cena num canvas só, que não recebe ponteiro", on && live && (await page.evaluate(() => document.querySelectorAll(".os-social canvas").length === 1 && getComputedStyle(document.querySelector(".os-social__canvas")).pointerEvents === "none")));
    if (on) {
      const links = await page.evaluate(() => [...document.querySelectorAll(".os-social a")].map((a) => ({ key: a.dataset.social, href: a.getAttribute("href"), target: a.target, rel: a.rel, name: a.querySelector(".os-social__name")?.textContent, w: a.getBoundingClientRect().width, h: a.getBoundingClientRect().height })));
      check("sociais: ordem LinkedIn, GitHub, Instagram, WhatsApp; hrefs reais, nova aba, rel noopener noreferrer; um link focável por rede", links.map((l) => l.key).join() === SOC.join() && links.every((l) => HOST[l.key].test(l.href) && l.target === "_blank" && /noopener/.test(l.rel) && /noreferrer/.test(l.rel)) && (await page.evaluate(() => document.querySelectorAll(".os-social a, .os-social button, .os-social [tabindex]").length)) === 4, JSON.stringify(links.map((l) => [l.key, l.href])));
      check("sociais: área de toque de cada link ≥ 44 × 44 px", links.every((l) => l.w >= 44 && l.h >= 44), JSON.stringify(links.map((l) => [Math.round(l.w), Math.round(l.h)])));
      const st = await page.evaluate(() => window.__mwSocial3d.stats);
      check(`sociais: ${st.tris} triângulos nas quatro peças (referência: até ~20 mil)`, st.tris > 2000 && st.tris <= 20000, JSON.stringify(st));
      const sel = (k) => `.os-social a[data-social="${k}"]`;
      const rectOf = (k) => page.evaluate((q) => { const r = document.querySelector(q).getBoundingClientRect(); const i = document.querySelector(q + " .os-social__icon").getBoundingClientRect(); const n = document.querySelector(q + " .os-social__name").getBoundingClientRect(); return [r.x, r.y, r.width, r.height, i.x, i.y, n.x, n.y].map((v) => Math.round(v * 10) / 10).join(); }, sel(k));
      const state = (k) => page.evaluate((key) => window.__mwSocial3d.state(key), k);
      await page.mouse.move(N.w * 0.5, N.h * 0.4);
      await page.waitForTimeout(500);
      const f0 = (await page.evaluate(() => window.__mwSocial3d.stats.frames));
      await page.waitForTimeout(1500);
      const f1 = (await page.evaluate(() => window.__mwSocial3d.stats.frames));
      check("sociais: parado, nenhum quadro é desenhado (render sob demanda)", f1 === f0, `${f0} → ${f1}`);
      for (const k of SOC) {
        const r0 = await rectOf(k);
        const box = await page.locator(sel(k) + " .os-social__icon").boundingBox();
        await page.mouse.move(box.x + box.width * 0.85, box.y + box.height * 0.2, { steps: 6 });
        await page.waitForTimeout(550);
        const h = await state(k);
        const r1 = await rectOf(k);
        const top = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest("a")?.dataset.social ?? null, [box.x + box.width / 2, box.y + box.height / 2]);
        await page.mouse.down();
        await page.waitForTimeout(200);
        const pr = await state(k);
        await page.mouse.move(N.w * 0.5, N.h * 0.4, { steps: 4 }); // solta fora: sem navegar
        await page.mouse.up();
        await page.waitForTimeout(450);
        const out = await state(k);
        const tilt = Math.hypot(h.rx - -11, h.ry - 9);
        check(`sociais · ${k}: hover inclina (${tilt.toFixed(1)}° ≤ 12), eleva e acende; o link e o rótulo não saem do lugar; pressão afunda e volta`, tilt > 2 && tilt <= 12 && h.lift > 3 && h.glow > 0.8 && r0 === r1 && top === k && pr.press > 0.6 && out.press < 0.08 && out.lift < 0.3 && out.glow < 0.1, JSON.stringify({ tilt: +tilt.toFixed(1), lift: +h.lift.toFixed(2), glow: +h.glow.toFixed(2), press: +pr.press.toFixed(2), moved: r0 !== r1 }));
      }
      // teclado: o foco pesa o mesmo que o hover, e Enter abre o link de verdade
      await page.keyboard.press("Tab");
      await page.focus(sel("instagram"));
      await page.waitForTimeout(500);
      const fs2 = await state("instagram");
      check("sociais: foco de teclado acende e eleva a peça, com contorno visível no link", fs2.glow > 0.8 && fs2.lift > 3 && (await page.evaluate((q) => { const a = document.querySelector(q); return a.matches(":focus-visible") && getComputedStyle(a).outlineStyle !== "none"; }, sel("instagram"))), JSON.stringify(fs2));
      const reqs = [];
      ctx.on("request", (r) => reqs.push(r.url()));
      const [popup] = await Promise.all([ctx.waitForEvent("page", { timeout: 5000 }).catch(() => null), page.keyboard.press("Enter")]);
      await page.waitForTimeout(600);
      check("sociais: Enter no link abre a rede em nova aba (navegação nativa) e a página do portfólio continua onde estava", !!popup && reqs.some((u) => HOST.instagram.test(u)) && new URL(page.url()).pathname === "/", JSON.stringify({ popup: !!popup, req: reqs.filter((u) => /instagram/.test(u)).slice(0, 1) }));
      await popup?.close().catch(() => {});
      const reqs2 = [];
      ctx.on("request", (r) => reqs2.push(r.url()));
      const [popup2] = await Promise.all([ctx.waitForEvent("page", { timeout: 5000 }).catch(() => null), page.click(sel("github"))]);
      await page.waitForTimeout(500);
      check("sociais: clique abre o GitHub em nova aba, sem atraso de animação", !!popup2 && reqs2.some((u) => HOST.github.test(u)), JSON.stringify({ popup: !!popup2 }));
      await popup2?.close().catch(() => {});
      // o personagem continua inteiro com as peças em cena
      const g = await gesture(page, "services");
      check("sociais: nenhuma regressão no personagem (o dedo ainda encosta no app)", g.opened && g.touched && g.err <= ERR_MAX, JSON.stringify({ err: g.err && +g.err.toFixed(2) }));
      check("sociais: console sem erros", errors.length === 0, errors.slice(0, 3).join(" | "));
    }
    await ctx.close();
    // tema claro: mesmas peças, luz azul
    {
      const { ctx, page } = await open({ ...N, theme: "gojo" });
      const ok = await page.waitForSelector('.os-social[data-d3="on"]', { timeout: 30000 }).then(() => true).catch(() => false);
      if (ok) await page.screenshot({ path: path.join(OUT, "sociais-tema-claro.png"), clip: { x: N.w - 360, y: N.h - 130, width: 360, height: 130 } });
      check("sociais: no tema claro as peças também entram", ok);
      await ctx.close();
    }
    // sem WebGL e com movimento reduzido: ficam os ícones SVG, os links são os mesmos
    for (const [name, o] of [["sem WebGL (perfil baixo)", { ...N, wait: false, query: "quality=low" }], ["movimento reduzido", { ...N, wait: false, reduced: true }]]) {
      const { ctx, page, errors } = await open(o);
      await page.waitForSelector(".os-social a");
      await page.waitForTimeout(3200);
      const v = await page.evaluate(() => ({ d3: document.querySelector(".os-social").dataset.d3 ?? null, canvas: document.querySelectorAll(".os-social canvas").length, svg: [...document.querySelectorAll(".os-social__icon")].every((i) => getComputedStyle(i).opacity === "1" && !!i.querySelector("svg")), hrefs: [...document.querySelectorAll(".os-social a")].map((a) => a.href).length }));
      check(`sociais · ${name}: ícones SVG no lugar, nenhum canvas, quatro links`, v.d3 === null && v.canvas === 0 && v.svg && v.hrefs === 4 && errors.length === 0, JSON.stringify(v));
      await ctx.close();
    }
    // telefone e tablet: este grupo não existe ali; a dock de redes e o HUD continuam como eram
    {
      const { ctx, page } = await open({ ...P, wait: false });
      await page.waitForSelector(".os-mdock");
      await page.waitForTimeout(2500);
      const v = await page.evaluate(() => ({ visible: getComputedStyle(document.querySelector(".os-social") ?? document.body).display, canvas: document.querySelectorAll(".os-social canvas").length, dock: [...document.querySelectorAll(".os-mdock a[href]")].filter((a) => a.getClientRects().length).length }));
      check("sociais · telefone: o grupo 3D não é montado; as redes continuam na dock, acessíveis", v.canvas === 0 && v.dock >= 4, JSON.stringify(v));
      await ctx.close();
    }
  }

  // ---- relatório ----
  const errs = measures.filter((m) => typeof m.err === "number").map((m) => m.err);
  const summary = { base: BASE, gpu: SOFTWARE ? "SwiftShader (software)" : "GPU da máquina (ANGLE/D3D11)", checks: results.length, failed, touchErrorPx: errs.length ? { n: errs.length, mean: +(errs.reduce((a, b) => a + b, 0) / errs.length).toFixed(2), max: +Math.max(...errs).toFixed(2) } : null, touchMs: (() => { const v = measures.filter((m) => typeof m.ms === "number").map((m) => m.ms); return v.length ? { n: v.length, mean: Math.round(v.reduce((a, b) => a + b, 0) / v.length), min: Math.min(...v), max: Math.max(...v) } : null; })() };
  fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify({ summary, results, measures }, null, 1));
  console.log("\n" + JSON.stringify(summary));
  console.log(`${results.length - failed}/${results.length} verificações ok — relatório em ${path.join(OUT, "report.json")}`);
} else {
  // ---- demonstração gravada: as interações reais, na ordem em que um visitante as faria ----
  const dir = arg("--out", ".audit/entity/demo");
  fs.mkdirSync(dir, { recursive: true });
  const W = Number(arg("--w", "1366"));
  const H = Number(arg("--h", "768"));
  const { ctx, page } = await open({ w: W, h: H, theme: arg("--theme", "obito"), video: dir });
  const glide = async (sel, steps = 22) => {
    const b = await page.locator(sel).boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height * 0.4, { steps });
  };
  await page.mouse.move(W * 0.8, H * 0.35);
  await page.waitForTimeout(2600);
  await page.mouse.move(W * 0.62, H * 0.6, { steps: 30 });
  await page.waitForTimeout(900);
  for (const id of ["services", "lab", "contact", "profile", "studio", "projects"]) {
    await glide(icon(id));
    await page.waitForTimeout(950);
  }
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(2600);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(700);
  await page.mouse.move(W * 0.7, H * 0.5, { steps: 30 });
  await page.waitForTimeout(1500);
  await glide(icon("contact"), 26);
  await page.waitForTimeout(700);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(2400);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
  // sequência rápida: Estúdio → Lab → Serviços
  for (const id of ["studio", "lab", "services"]) {
    await glide(icon(id), 8);
    await page.mouse.down();
    await page.mouse.up();
    await page.waitForTimeout(170);
  }
  await page.waitForTimeout(2300);
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(380);
  }
  await page.mouse.move(W * 0.72, H * 0.42, { steps: 30 });
  await page.waitForTimeout(1600);
  // troca de tema: o mesmo personagem, outra luz
  const theme = page.locator(".os-dock__theme");
  if (await theme.count()) {
    await theme.hover();
    await page.waitForTimeout(400);
    await theme.click();
    await page.waitForTimeout(2600);
    await glide(icon("lab"), 26);
    await page.waitForTimeout(1100);
    await page.mouse.down();
    await page.mouse.up();
    await page.waitForTimeout(2200);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(1200);
  }
  await ctx.close();
  console.log("vídeo em", dir);
}
await browser.close();
process.exit(failed ? 1 : 0);
