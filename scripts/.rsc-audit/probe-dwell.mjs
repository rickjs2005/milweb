// Landa em /, espera o Boot terminar (el.remove()), clica um link qualquer.
import { chromium, webkit } from "playwright";
const BASE = process.argv[2] ?? "http://127.0.0.1:3000";
const engine = process.argv[3] === "webkit" ? webkit : chromium;
const to = process.argv[4] ?? "/projetos";
const dwell = Number(process.argv[5] ?? 8000);
const browser = await engine.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
let err = null;
page.on("console", (m) => { if (/NotFound|removeChild/.test(m.text())) err = m.text().split("\n")[0]; });
await page.goto(BASE + "/");
await page.waitForTimeout(dwell);
const bootPresent = await page.evaluate(() => !!document.getElementById("mw-boot"));
const sel = to.startsWith("/") ? `a[href="${to}"]` : `a[lang="${to}"]`;
const l = page.locator(sel).first();
await l.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" })); await page.waitForTimeout(300);
const b = await l.boundingBox(); await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(3000);
console.log(JSON.stringify({ base: BASE, engine: process.argv[3] ?? "chromium", dwell, bootPresentBeforeClick: bootPresent, to, url: await page.evaluate(() => location.pathname), nav: await page.evaluate(() => !!document.querySelector("[data-nav-root]")), text: await page.evaluate(() => document.body.innerText.slice(0, 50).replace(/\n/g, " ")), err }));
await browser.close();
