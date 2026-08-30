// Captura do Milo Null: estados, modos de validação, viewports e detalhes, sem debug.
// Requer `pnpm dev -p 3001` (ganchos window.__milo / window.__miloFrame só existem em desenvolvimento).
//   node scripts/.rsc-audit/states-milo.mjs v7
import { chromium } from "playwright";
const base = "http://127.0.0.1:3001/lab/milo-null";
const tag = process.argv[2] ?? "v7";
const browser = await chromium.launch({ headless: false });
const VP = {
  desktop: { viewport: { width: 1920, height: 1080 } },
  notebook: { viewport: { width: 1440, height: 900 } },
  mobile: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 },
};
const shots = [
  ["desktop", "dormant", 0],
  ["desktop", "observe", 0],
  ["desktop", "touch", 0],
  ["desktop", "full", 0],
  ["desktop", "dissolve", 0],
  ["desktop", "observe", 1, "distortion-only"],
  ["desktop", "observe", 2, "wireframe-only"],
  ["notebook", "observe", 0, "composite"],
  ["mobile", "observe", 0, "composite"],
  ["mobile", "touch", 0],
];
for (const vpName of ["desktop", "notebook", "mobile"]) {
  const vp = VP[vpName];
  const ctx = await browser.newContext(vp);
  const page = await ctx.newPage();
  const errs = [];
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 200)); });
  page.on("pageerror", (e) => errs.push(String(e).slice(0, 200)));
  await page.goto(base);
  await page.waitForTimeout(3500);
  for (const [v, state, view, name] of shots.filter((s) => s[0] === vpName)) {
    await page.evaluate(([st, vw]) => { window.__miloFrame.params.view = vw; window.__milo.getState().setState(st); }, [state, view]);
    if (state === "observe") await page.mouse.move(vp.viewport.width * 0.3, vp.viewport.height * 0.35);
    if (state === "touch" || state === "full") await page.mouse.move(vp.viewport.width * 0.5, vp.viewport.height * 0.5);
    await page.waitForTimeout(state === "dissolve" ? 1100 : 3200);
    await page.screenshot({ path: `scripts/.rsc-audit/milo-${tag}-${v}-${name ?? state}.png` });
    if (v === "desktop" && state === "observe" && view === 0) {
      // detalhes: pélvis e cabeça (recortes do mesmo frame, em resolução nativa)
      await page.screenshot({ path: `scripts/.rsc-audit/milo-${tag}-desktop-pelvis-detail.png`, clip: { x: 1120, y: 480, width: 560, height: 360 } });
      await page.screenshot({ path: `scripts/.rsc-audit/milo-${tag}-desktop-head-detail.png`, clip: { x: 1180, y: 110, width: 420, height: 300 } });
    }
  }
  await page.evaluate(() => { window.__miloFrame.params.view = 0; window.__milo.getState().setState("observe"); });
  await page.waitForTimeout(2500);
  const back = await page.evaluate(() => ({ nav: !!document.querySelector("[data-nav-root]"), state: window.__milo.getState().state }));
  const fps = await page.evaluate(() => new Promise((r) => { let f = 0; const t0 = performance.now(); const loop = () => { f++; performance.now() - t0 < 2000 ? requestAnimationFrame(loop) : r(f / 2); }; requestAnimationFrame(loop); }));
  console.log(vpName, "fps", fps, "errors", errs.length ? errs : "none", "after dissolve→observe:", JSON.stringify(back));
  await ctx.close();
}
await browser.close();
