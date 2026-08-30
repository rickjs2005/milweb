// capturas rápidas de estados (desktop 1920 + mobile 390)
import { chromium, devices } from "playwright";
const base = process.argv[2] ?? "http://127.0.0.1:3001";
const b = await chromium.launch({ headless: false });
async function shots(w, h, mobile, tag, states) {
  const ctx = await b.newContext(mobile ? { ...devices["iPhone 13"], viewport: { width: w, height: h } } : { viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  await page.goto(base + "/"); await page.waitForTimeout(1200); await page.keyboard.press("Escape"); await page.waitForTimeout(1200);
  if (mobile) await page.touchscreen.tap(w / 2, h * 0.3); else { await page.mouse.move(w * 0.3, h * 0.4); await page.mouse.move(w * 0.31, h * 0.41); }
  await page.waitForTimeout(5500);
  for (const [name, p] of states) {
    await page.evaluate((p) => { const st = window.__miloHero.st(); window.scrollTo({ top: st.start + p * (st.end - st.start), behavior: "instant" }); }, p);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `scripts/.rsc-audit/${tag}-${name}.png` });
  }
  // depois do pin: o canvas deve sair com o Hero (nada do Milo sobre a próxima seção)
  await page.evaluate(() => { const st = window.__miloHero.st(); window.scrollTo({ top: st.end + innerHeight * 0.9, behavior: "instant" }); });
  await page.waitForTimeout(1000);
  const after = await page.evaluate(() => { const c = document.querySelector("[data-milo-canvas]"); const r = c.getBoundingClientRect(); return { canvasBottom: +r.bottom.toFixed(0), frameloopOff: !window.__miloHero.heroStore.getState().heroVisible }; });
  await page.screenshot({ path: `scripts/.rsc-audit/${tag}-after-pin.png` });
  console.log(tag, JSON.stringify(after));
  await ctx.close();
}
await shots(1920, 1080, false, "final", [["00-initial", 0], ["30-walk", 0.3], ["61-contact", 0.61], ["100-final", 0.985]]);
await shots(1366, 768, false, "final-nb", [["100-final", 0.985]]);
await shots(390, 844, true, "final-m", [["00-initial", 0], ["30-walk", 0.3], ["61-contact", 0.61], ["100-final", 0.985]]);
await b.close();
