import { chromium } from "playwright";
const b = await chromium.launch({ headless: false });
const page = await b.newPage({ viewport: { width: 1920, height: 1080 }, reducedMotion: "reduce" });
const bad = [];
page.on("pageerror", (e) => bad.push(String(e).slice(0, 160)));
await page.goto("http://127.0.0.1:3100/pt", { waitUntil: "load" });
await page.waitForTimeout(2500);
const geo = await page.evaluate(() => [...document.querySelectorAll("#work [data-panel]")].map((a) => a.getBoundingClientRect().top + scrollY));
for (let i = 0; i < geo.length; i++) {
  await page.evaluate((y) => window.scrollTo({ top: y + innerHeight * 0.35, behavior: "instant" }), geo[i]);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `scripts/.rsc-audit/work/reduced-${i + 1}.png` });
}
console.log(await page.evaluate(() => {
  const out = [];
  document.querySelectorAll("#work [data-panel]").forEach((p, i) => {
    const vis = (sel) => { const e = p.querySelector(sel); return e ? +getComputedStyle(e).opacity : null; };
    out.push({ i: i + 1, w: p.dataset.world, media: vis("[data-media]"), extra: vis("[data-coord], [data-anchor], [data-plan-label], [data-part-label]"), cta: !!p.querySelector("a[data-cta]") });
  });
  return { out, ovfX: Math.max(0, document.documentElement.scrollWidth - innerWidth) };
}));
console.log("erros:", bad);
await b.close();
