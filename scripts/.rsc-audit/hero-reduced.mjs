// reduced-motion: composição final estática, Milo (SVG) em cena, headline completa, sem pin
import { chromium } from "playwright";
const base = process.argv[2] ?? "http://127.0.0.1:3001";
const b = await chromium.launch({ headless: false });
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e).slice(0, 160)));
  await page.goto(base + "/"); await page.waitForTimeout(1500); await page.keyboard.press("Escape"); await page.waitForTimeout(3000);
  await page.mouse.move(300, 300); await page.waitForTimeout(2500);
  const r = await page.evaluate(() => { const h1 = document.querySelector("#top h1"); const fb = document.querySelector(".milo-hero-fallback"); const fr = fb.getBoundingClientRect(); const cs = getComputedStyle(fb); return { wdth: getComputedStyle(h1).fontVariationSettings, fallbackVisible: cs.opacity !== "0" && fr.width > 0 && fr.right <= innerWidth + 1 && fr.left >= 0, canvas: !!document.querySelector("[data-milo-canvas]"), pinned: !!document.querySelector(".pin-spacer"), stage: [...document.querySelectorAll("[data-stage]")].findIndex((n) => n.classList.contains("is-active")), h1Right: h1.getBoundingClientRect().right, overflow: document.documentElement.scrollWidth > innerWidth }; });
  await page.screenshot({ path: `scripts/.rsc-audit/scene-reduced-${w}.png` });
  console.log(`${w}x${h}`, JSON.stringify(r), errs.length ? errs : "no errors");
  await ctx.close();
}
await b.close();
