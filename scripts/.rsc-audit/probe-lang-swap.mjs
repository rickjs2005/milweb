// Sequência que quebrou em produção: / → EN → ES (dois swaps consecutivos do segmento [lang]).
import { chromium, webkit } from "playwright";
const BASE = process.argv[2] ?? "http://127.0.0.1:3000";
const engine = process.argv[3] === "webkit" ? webkit : chromium;
const seq = (process.argv[4] ?? "/,en,es,pt,en").split(",");
const browser = await engine.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.on("console", (m) => { if (m.type() === "error" || /hydrat|RSC|React/i.test(m.text())) console.log("  [console]", m.type(), m.text().slice(0, 400)); });
page.on("pageerror", (e) => console.log("  [pageerror]", String(e).slice(0, 400)));
page.on("response", (r) => { if (r.url().includes("_rsc")) console.log("  [rsc]", r.status(), r.headers()["content-type"], r.url().replace(BASE, "")); });
const snap = () => page.evaluate(() => ({
  url: location.pathname, lang: document.documentElement.lang, ct: document.contentType,
  htmlChildren: [...document.documentElement.children].map((e) => e.tagName + (e.id ? "#" + e.id : "")),
  bodyChildren: [...document.body.children].map((e) => e.tagName + (e.id ? "#" + e.id : "") + (e.getAttribute("data-nav-root") !== null ? "[nav]" : "")).slice(0, 12),
  bodyCount: document.body.children.length, headCount: document.head.children.length,
  nav: !!document.querySelector("[data-nav-root]"), main: !!document.querySelector("main"),
  text: document.body.innerText.slice(0, 80).replace(/\n/g, " "),
  bodyIsDocBody: document.body === document.querySelector("body"),
  bodies: document.querySelectorAll("body").length, htmls: document.querySelectorAll("html").length,
}));
await page.goto(BASE + seq[0]);
await page.waitForTimeout(2500);
console.log("start", JSON.stringify(await snap()));
for (const step of seq.slice(1)) {
  const sel = step.startsWith("/") ? `a[href="${step}"]` : `a[lang="${step === "pt" ? "pt-BR" : step}"]`;
  const l = page.locator(sel).first();
  if (!(await l.count())) { console.log("NO LINK", sel); break; }
  await l.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
  await page.waitForTimeout(300);
  const b = await l.boundingBox();
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  await page.waitForTimeout(3000);
  console.log("→", step, JSON.stringify(await snap()));
}
await page.screenshot({ path: `scripts/.rsc-audit/crash-${process.argv[3] ?? "chromium"}.png` });
console.log("html:", (await page.evaluate(() => document.documentElement.outerHTML)).slice(0, 1500).replace(/\r?\n/g, " "));
await browser.close();
