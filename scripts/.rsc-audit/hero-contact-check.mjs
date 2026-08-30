// Validação da distância mão-ativa ↔ extremidade da frase durante o empurrão, nos 6 viewports
// de referência + reverso + salto rápido + resize + overflow + FPS. Roda contra um dev server
// na variante milo (NEXT_PUBLIC_HERO_VISUAL=milo).
//   node scripts/.rsc-audit/hero-contact-check.mjs [base]
import { chromium } from "playwright";
const base = process.argv[2] ?? "http://127.0.0.1:3001";
const b = await chromium.launch({ headless: false });
const go = (page, p, wait = 800) => page.evaluate(([p, wait]) => new Promise((r) => { const st = window.__miloHero.st(); window.scrollTo({ top: st.start + p * (st.end - st.start), behavior: "instant" }); setTimeout(r, wait); }), [p, wait]);
const readHand = (page) => page.evaluate(() => {
  const h = window.__miloHero; const f = h.frame; const hero = document.getElementById("top"); const bx = hero.getBoundingClientRect();
  const ax = bx.left + f.panel.x * bx.width, ay = bx.top + (1 - f.panel.y) * bx.height;
  const hx = bx.left + f.hand.x * bx.width, hy = bx.top + (1 - f.hand.y) * bx.height;
  return { dist: +Math.hypot(hx - ax, hy - ay).toFixed(1), hand: [Math.round(hx), Math.round(hy)], anchor: [Math.round(ax), Math.round(ay)], touch: +f.touch.toFixed(2) };
});

for (const [w, h, mobile] of [[1920, 1080, false], [1440, 900, false], [1366, 768, false], [768, 1024, true], [390, 844, true], [360, 800, true]]) {
  const ctx = await b.newContext(mobile ? { viewport: { width: w, height: h }, hasTouch: true, isMobile: true } : { viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  const msgs = [];
  page.on("console", (m) => { if (["error", "warning"].includes(m.type()) && !/_vercel|404|THREE\.Clock|React DevTools|X3595/.test(m.text())) msgs.push(m.text().slice(0, 160)); });
  page.on("pageerror", (e) => msgs.push("PAGEERROR: " + String(e).slice(0, 200)));
  await page.goto(base + "/"); await page.waitForTimeout(1200); await page.keyboard.press("Escape"); await page.waitForTimeout(1000);
  if (mobile) await page.touchscreen.tap(w / 2, h * 0.3); else { await page.mouse.move(w * 0.3, h * 0.4); await page.mouse.move(w * 0.31, h * 0.41); }
  await page.waitForTimeout(5000);
  const rows = [];
  for (const p of [0.60, 0.65, 0.68, 0.72, 0.76]) { await go(page, p, 900); rows.push([p, await readHand(page)]); }
  const overflow = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
  console.log(`\n== ${w}x${h}${mobile ? " touch" : ""} — overflow ${JSON.stringify(overflow)} — console ${msgs.length ? JSON.stringify(msgs) : "clean"}`);
  for (const [p, r] of rows) console.log(`  p=${p}`, JSON.stringify(r));
  await ctx.close();
}
await b.close();
