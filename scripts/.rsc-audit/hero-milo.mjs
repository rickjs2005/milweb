// Validação do Hero: estágios, canvas/contextos, reversibilidade, saída do Hero, mobile, reduced, perf.
//   node scripts/.rsc-audit/hero-milo.mjs <tag> [base]
import { chromium } from "playwright";
const tag = process.argv[2] ?? "milo-hero";
const base = process.argv[3] ?? "http://127.0.0.1:3001";
const browser = await chromium.launch({ headless: false });
const initScript = () => {
  window.__glContexts = 0;
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...a) {
    const ctx = orig.call(this, type, ...a);
    if (ctx && /webgl/.test(String(type)) && !this.__counted) { this.__counted = true; window.__glContexts++; }
    return ctx;
  };
  window.__lt = 0; window.__cls = 0; window.__lcp = null;
  try {
    new PerformanceObserver((l) => l.getEntries().forEach((e) => (window.__lt += e.duration))).observe({ type: "longtask", buffered: true });
    new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__cls += e.value; })).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((l) => { const es = l.getEntries(); const e = es[es.length - 1]; window.__lcp = { t: e.startTime, el: e.element?.tagName + (e.element?.className ? "." + String(e.element.className).slice(0, 30) : "") }; }).observe({ type: "largest-contentful-paint", buffered: true });
  } catch {}
};
const counts = (page) => page.evaluate(() => ({ canvases: document.querySelectorAll("canvas").length, contexts: window.__glContexts, milo: document.documentElement.dataset.milo ?? null, compiler: document.documentElement.dataset.compiler ?? null, fallback: !!document.querySelector(".milo-hero-fallback, .compiler-fallback") }));
const fps = (page) => page.evaluate(() => new Promise((r) => { let f = 0; const t0 = performance.now(); const loop = () => { f++; performance.now() - t0 < 2000 ? requestAnimationFrame(loop) : r(f / 2); }; requestAnimationFrame(loop); }));
const toProgress = async (page, p) => { await page.evaluate((p) => window.scrollTo({ top: p * 3.5 * innerHeight, behavior: "instant" }), p); await page.waitForTimeout(1100); };
const state = (page) => page.evaluate(() => { const h = window.__miloHero; return h ? { st: h.store.getState().state, vis: +h.frame.visibility.toFixed(2), en: +h.frame.energy.toFixed(2), touch: +h.frame.touch.toFixed(2), grid: +h.heroFrame.gridOpacity.toFixed(2), heroVisible: h.heroStore.getState().heroVisible } : null; });

async function desktop(w, h) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  await ctx.addInitScript(initScript);
  const page = await ctx.newPage();
  const errs = [];
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 160)); });
  page.on("pageerror", (e) => errs.push(String(e).slice(0, 160)));
  const t0 = Date.now();
  await page.goto(base + "/");
  await page.waitForTimeout(1200);
  if (w === 1920) await page.screenshot({ path: `scripts/.rsc-audit/${tag}-boot.png` });
  await page.keyboard.press("Escape"); // pula o Boot
  await page.waitForTimeout(1200);
  await page.mouse.move(w * 0.3, h * 0.4); // primeira interação → montagem
  await page.mouse.move(w * 0.32, h * 0.42);
  let mountMs = null;
  for (let i = 0; i < 40; i++) { await page.waitForTimeout(250); const c = await counts(page); if (c.canvases > 0 && (c.milo === "on" || c.compiler === "on" || c.milo === "off")) { mountMs = Date.now() - t0; break; } }
  const after = await counts(page);
  await page.waitForTimeout(3500); // SplitText + ScrollTrigger do hero
  const stages = [["stage-0-structure", 0.06], ["stage-1-grid", 0.24], ["stage-2-type", 0.42], ["stage-3-images", 0.58], ["stage-4-scan", 0.73], ["stage-5-full", 0.88], ["stage-5-dissolve", 0.975]];
  const log = [];
  for (const [name, p] of stages) {
    await toProgress(page, p);
    if (w === 1920) await page.screenshot({ path: `scripts/.rsc-audit/${tag}-${name}.png` });
    log.push([name, await state(page)]);
  }
  const fpsStage2 = await (async () => { await toProgress(page, 0.42); return fps(page); })();
  // reversibilidade
  await toProgress(page, 0.975); const a = await state(page);
  await toProgress(page, 0.42); const b = await state(page);
  await toProgress(page, 0.975); const c2 = await state(page);
  await page.evaluate(() => window.scrollTo({ top: 5.2 * innerHeight, behavior: "instant" })); await page.waitForTimeout(900);
  const out = await state(page); const outCanvas = await page.evaluate(() => { const el = document.querySelector(".milo-hero-canvas"); return el ? getComputedStyle(el).opacity : null; });
  await toProgress(page, 0.42); const back = await state(page);
  const perf = await page.evaluate(() => ({ lcp: window.__lcp, cls: +window.__cls.toFixed(4), longTasksMs: Math.round(window.__lt), mem: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null }));
  console.log(`\n== ${w}x${h}`, JSON.stringify({ mountMs, ...after, fpsStage2, perf, errors: errs.length ? errs : "none" }));
  for (const [n, s] of log) console.log("  ", n.padEnd(20), JSON.stringify(s));
  console.log("   reversível:", JSON.stringify({ dissolve: a, back2: b, dissolveAgain: c2, outOfHero: out, outCanvasOpacity: outCanvas, backInHero: back }));
  await ctx.close();
}
await desktop(1920, 1080);
await desktop(1440, 900);
await desktop(1366, 768);

// mobile: fallback, sem canvas
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  await ctx.addInitScript(initScript);
  const page = await ctx.newPage();
  await page.goto(base + "/"); await page.waitForTimeout(1200); await page.keyboard.press("Escape"); await page.waitForTimeout(1200);
  await page.touchscreen.tap(200, 500); await page.mouse.wheel(0, 40); await page.waitForTimeout(2500);
  console.log("\n== mobile", JSON.stringify(await counts(page)));
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(500);
  await page.screenshot({ path: `scripts/.rsc-audit/${tag}-mobile-fallback.png` });
  await ctx.close();
}
// reduced motion: fallback, sem canvas
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  await ctx.addInitScript(initScript);
  const page = await ctx.newPage();
  await page.goto(base + "/"); await page.waitForTimeout(1500);
  await page.mouse.move(400, 400); await page.mouse.wheel(0, 20); await page.waitForTimeout(2500);
  console.log("== reduced", JSON.stringify(await counts(page)));
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(500);
  await page.screenshot({ path: `scripts/.rsc-audit/${tag}-reduced-motion.png` });
  await ctx.close();
}
await browser.close();
