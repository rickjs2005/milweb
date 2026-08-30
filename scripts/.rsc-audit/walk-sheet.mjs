// folha de contato da caminhada (1920): 8 frames entre walkStart e walkEnd
import { chromium } from "playwright";
const b = await chromium.launch({ headless: false });
const page = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto("http://127.0.0.1:3001/"); await page.waitForTimeout(1200); await page.keyboard.press("Escape"); await page.waitForTimeout(1200);
await page.mouse.move(600, 400); await page.mouse.move(610, 410); await page.waitForTimeout(5500);
const L = await page.evaluate(() => window.__miloHero.labels());
const ps = [0.2, 0.24, 0.28, 0.31, 0.34, 0.37, 0.4, 0.43];
const info = [];
for (let i = 0; i < ps.length; i++) {
  await page.evaluate((p) => { const st = window.__miloHero.st(); window.scrollTo({ top: st.start + p * (st.end - st.start), behavior: "instant" }); }, ps[i]);
  await page.waitForTimeout(900);
  info.push(await page.evaluate(() => { const h = window.__miloHero; return { p: +h.frame.scroll.toFixed(2), phase: +h.frame.walk.phase.toFixed(2), amount: +h.frame.walk.amount.toFixed(2), x: +h.placement.x.toFixed(2), stride: +h.geom.stride.toFixed(2) }; }));
  await page.screenshot({ path: `scripts/.rsc-audit/walk-${i}.png`, clip: { x: 700, y: 120, width: 1220, height: 960 } });
}
console.log(JSON.stringify(info));
await b.close();
