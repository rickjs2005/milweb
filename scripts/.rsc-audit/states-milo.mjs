// Captura do Milo Null: 5 estados × 3 viewports, sem o painel de debug (recolhido por padrão).
// Requer `pnpm dev -p 3001` (o gancho window.__milo só existe em desenvolvimento).
import { chromium } from "playwright";
const base = "http://127.0.0.1:3001/lab/milo-null";
const tag = process.argv[2] ?? "v2";
const browser = await chromium.launch({ headless: false });
const VIEWPORTS = [
  { name: "desktop", viewport: { width: 1920, height: 1080 } },
  { name: "notebook", viewport: { width: 1440, height: 900 } },
  { name: "mobile", viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 },
];
const STATES = ["dormant", "observe", "touch", "full", "dissolve"];
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext(vp);
  const page = await ctx.newPage();
  const errs = [];
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 200)); });
  page.on("pageerror", (e) => errs.push(String(e).slice(0, 200)));
  await page.goto(base);
  await page.waitForTimeout(3500);
  for (const s of STATES) {
    await page.evaluate((st) => window.__milo.getState().setState(st), s);
    if (s === "observe") await page.mouse.move(vp.viewport.width * 0.3, vp.viewport.height * 0.35);
    if (s === "touch" || s === "full") await page.mouse.move(vp.viewport.width * 0.5, vp.viewport.height * 0.5);
    await page.waitForTimeout(s === "dissolve" ? 1100 : 3200);
    await page.screenshot({ path: `scripts/.rsc-audit/milo-${tag}-${vp.name}-${s}.png` });
  }
  await page.evaluate(() => window.__milo.getState().setState("observe"));
  await page.waitForTimeout(2500);
  const back = await page.evaluate(() => ({ nav: !!document.querySelector("[data-nav-root]"), state: window.__milo.getState().state }));
  const fps = await page.evaluate(() => new Promise((r) => { let f = 0; const t0 = performance.now(); const loop = () => { f++; performance.now() - t0 < 2000 ? requestAnimationFrame(loop) : r(f / 2); }; requestAnimationFrame(loop); }));
  console.log(vp.name, "fps", fps, "errors", errs.length ? errs : "none", "after dissolve→observe:", JSON.stringify(back));
  await ctx.close();
}
await browser.close();
