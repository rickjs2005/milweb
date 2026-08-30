// resize durante a cena + console completo (erros e warnings relevantes)
import { chromium } from "playwright";
const b = await chromium.launch({ headless: false });
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();
const msgs = [];
page.on("console", (m) => { if (["error", "warning"].includes(m.type()) && !/_vercel|404|THREE\.Clock|Download the React DevTools/.test(m.text())) msgs.push(m.type() + ": " + m.text().slice(0, 160)); });
page.on("pageerror", (e) => msgs.push("pageerror: " + String(e).slice(0, 160)));
await page.goto("http://127.0.0.1:3001/"); await page.waitForTimeout(1200); await page.keyboard.press("Escape"); await page.waitForTimeout(1200);
await page.mouse.move(600, 400); await page.mouse.move(610, 410); await page.waitForTimeout(5500);
const go = async (p, w = 900) => { await page.evaluate((p) => { const st = window.__miloHero.st(); window.scrollTo({ top: st.start + p * (st.end - st.start), behavior: "instant" }); }, p); await page.waitForTimeout(w); };
const read = () => page.evaluate(() => { const h = window.__miloHero; const f = h.frame; const hero = document.getElementById("top"); const w = hero.querySelector("[data-headline-word=last]"); const r = w.getBoundingClientRect(); const bx = hero.getBoundingClientRect(); return { p: +f.scroll.toFixed(2), x: +h.placement.x.toFixed(2), hand: [Math.round(bx.left + f.hand.x * bx.width), Math.round(bx.top + (1 - f.hand.y) * bx.height)], word: [Math.round(r.right), Math.round(r.top + r.height / 2)], overflow: document.documentElement.scrollWidth > innerWidth, vw: innerWidth }; });
await go(0.68); console.log("1920 mid-pull", JSON.stringify(await read()));
await page.setViewportSize({ width: 1366, height: 768 }); await page.waitForTimeout(1500); await go(0.68); console.log("→1366 mid-pull", JSON.stringify(await read()));
await go(0.3); console.log("→1366 walk", JSON.stringify(await read()));
await page.setViewportSize({ width: 1920, height: 1080 }); await page.waitForTimeout(1500); await go(0.68); console.log("→1920 mid-pull", JSON.stringify(await read()));
// scroll rápido: salto direto do início ao fim e volta
await go(0.0, 300); await go(0.985, 300); const fast = await read(); await go(0.0, 900); const back = await read();
console.log("fast end", JSON.stringify(fast), "fast back", JSON.stringify(back));
console.log("console:", msgs.length ? msgs : "clean");
await b.close();
