// Cenário #79346 aplicado à MilWeb: cookie milweb_locale=en, usuário em /en clica "PT" (href "/").
// RSC fetch /?_rsc=x → 307 /en (sem _rsc) → x-component armazenado sob /en?
import { chromium } from "playwright";
const BASE = process.argv[2] ?? "https://milweb.com.br";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const host = new URL(BASE).hostname;
await ctx.addCookies([{ name: "milweb_locale", value: "en", domain: host, path: "/" }]);
const page = await ctx.newPage();
page.on("response", (r) => {
  const u = r.url();
  if (!u.startsWith(BASE)) return;
  const rt = r.request().resourceType();
  if (rt === "document" || rt === "fetch" || u.includes("_rsc"))
    console.log(`[res] ${rt.padEnd(8)} ${String(r.status()).padEnd(3)} ${(r.headers()["content-type"] ?? "").padEnd(24)} cc=${r.headers()["cache-control"] ?? "-"} from=${r.request().redirectedFrom()?.url().replace(BASE, "") ?? "-"} ${u.replace(BASE, "")}`);
});
page.on("console", (m) => { if (/RSC|hydrat|Failed/i.test(m.text())) console.log("[console]", m.text().slice(0, 160)); });

console.log("1) abre /en (cookie=en)");
await page.goto(BASE + "/en");
await page.waitForTimeout(2500);
console.log("2) clica PT");
const pt = page.locator('a[lang="pt-BR"]').first();
await pt.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
const b = await pt.boundingBox();
await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
await page.waitForTimeout(3000);
console.log("   url após clique:", page.url(), "| html lang =", await page.evaluate(() => document.documentElement.lang), "| cookie =", (await ctx.cookies()).find((c) => c.name === "milweb_locale")?.value);
console.log("3) navegação de documento para /en (como voltar/reabrir aba)");
await page.goto(BASE + "/en");
await page.waitForTimeout(1500);
console.log("   contentType:", await page.evaluate(() => document.contentType), "| texto:", (await page.evaluate(() => document.body.innerText.slice(0, 80))).replace(/\n/g, " "));
console.log("4) back()");
await page.goBack().catch(() => {});
await page.waitForTimeout(1500);
console.log("   url:", page.url(), "contentType:", await page.evaluate(() => document.contentType), "| texto:", (await page.evaluate(() => document.body.innerText.slice(0, 80))).replace(/\n/g, " "));
await browser.close();
