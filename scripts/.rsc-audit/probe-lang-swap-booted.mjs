// Igual ao probe-lang-swap, mas com sessionStorage mw:booted=1 (Boot não roda) — isola o #mw-boot.
import { chromium } from "playwright";
const BASE = process.argv[2] ?? "http://127.0.0.1:3000";
const seq = (process.argv[3] ?? "/,en,pt,en").split(",");
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => { try { sessionStorage.setItem("mw:booted", "1"); } catch {} });
const page = await ctx.newPage();
page.on("console", (m) => { if (m.type() === "error" && /NotFound|removeChild|React/i.test(m.text())) console.log("  [console]", m.text().slice(0, 200)); });
const snap = () => page.evaluate(() => ({ url: location.pathname, lang: document.documentElement.lang, nav: !!document.querySelector("[data-nav-root]"), boot: !!document.getElementById("mw-boot"), canvas: document.querySelectorAll("body > canvas").length, text: document.body.innerText.slice(0, 40).replace(/\n/g, " ") }));
await page.goto(BASE + seq[0]); await page.waitForTimeout(2500);
console.log("start", JSON.stringify(await snap()));
for (const step of seq.slice(1)) {
  const sel = step.startsWith("/") ? `a[href="${step}"]` : `a[lang="${step === "pt" ? "pt-BR" : step}"]`;
  const l = page.locator(sel).first(); if (!(await l.count())) { console.log("NO LINK", sel); break; }
  await l.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" })); await page.waitForTimeout(300);
  const b = await l.boundingBox(); await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(3000);
  console.log("→", step, JSON.stringify(await snap()));
}
await browser.close();
