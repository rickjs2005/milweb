import { chromium } from "playwright";
const b = await chromium.launch({ headless: false });
const page = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto("http://127.0.0.1:3100/pt?quality=high", { waitUntil: "load" });
await page.waitForTimeout(500); await page.keyboard.press("Escape"); await page.waitForTimeout(900);
await page.evaluate(() => window.scrollTo({ top: innerHeight * 2, behavior: "instant" }));
await page.waitForFunction(() => !!window.__mwWork, null, { timeout: 15000 });
const geo = await page.evaluate(() => {
  const a = [...document.querySelectorAll("#work [data-panel]")];
  return { offsetH: a.map((x) => x.offsetHeight), top: a.map((x) => Math.round(x.getBoundingClientRect().top + scrollY)), scrollY: Math.round(scrollY), vh: innerHeight };
});
console.log("geometria", geo);
// alvo pela própria trigger
await page.evaluate(() => window.__mwWork.seek(0, 0.5));
await page.waitForTimeout(1400);
const snap = () => page.evaluate(() => ({ acts: window.__mwWork.acts.map((a) => ({ w: a.world, p: a.p, start: a.start, end: a.end, top: a.top })), scrollY: Math.round(scrollY), max: Math.round(document.body.scrollHeight - innerHeight) }));
console.log("apos seek(0,0.5):", JSON.stringify(await snap(), null, 1));
await page.evaluate(() => window.__mwWork.refresh());
await page.waitForTimeout(900);
console.log("apos refresh():", JSON.stringify(await snap(), null, 1));
console.log("triggers:", JSON.stringify(await page.evaluate(() => window.__mwWork.all()), null, 1));
await b.close();
