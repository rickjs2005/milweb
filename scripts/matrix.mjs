/**
 * Matriz cross-browser (Playwright): Chromium · Firefox · WebKit ×
 * 1920/1440/1366 desktop · 430/390 mobile (touch) × Home / Work / Case.
 * Para cada célula: console (errors + warnings), pageerror, requests
 * falhas, overflow horizontal, screenshots em 2 posições; mais um teste de
 * resize (scroll ao meio → 3 resizes) e de orientação no mobile.
 *
 *   node scripts/matrix.mjs [baseUrl] [--browsers=chromium,firefox,webkit] [--pages=/,/work,/work/kavita-drones]
 */
import { chromium, firefox, webkit } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const base = process.argv[2]?.startsWith("http") ? process.argv[2] : "http://localhost:3111";
const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) ?? `--${k}=${d}`).split("=")[1];
const BROWSERS = arg("browsers", "chromium,firefox,webkit").split(",");
const PAGES = arg("pages", "/,/work,/work/kavita-drones").split(",");
const VIEWPORTS = [
  { name: "1920", width: 1920, height: 1080 },
  { name: "1440", width: 1440, height: 900 },
  { name: "1366", width: 1366, height: 768 },
  { name: "430m", width: 430, height: 932, mobile: true },
  { name: "390m", width: 390, height: 844, mobile: true },
];
const OUT = ".audit/matrix";
mkdirSync(OUT, { recursive: true });
const report = [];
const IGNORE = /_vercel\/(speed-)?insights|favicon|manifest/;

for (const name of BROWSERS) {
  const engine = { chromium, firefox, webkit }[name];
  const browser = await engine.launch();
  for (const vp of VIEWPORTS) {
    // Firefox não suporta isMobile/hasTouch no contexto.
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      ...(vp.mobile && name !== "firefox" ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}),
      userAgent: vp.mobile ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" : undefined,
    });
    await ctx.addInitScript(() => {
      try {
        sessionStorage.setItem("mw:booted", "1");
      } catch {}
    });
    for (const path of PAGES) {
      const page = await ctx.newPage();
      const issues = [];
      page.on("console", (m) => {
        if ((m.type() === "error" || m.type() === "warning") && !IGNORE.test(m.text())) issues.push(`${m.type()}: ${m.text().slice(0, 160)}`);
      });
      page.on("pageerror", (e) => issues.push(`pageerror: ${e.message.slice(0, 160)}`));
      page.on("requestfailed", (r) => !IGNORE.test(r.url()) && issues.push(`requestfailed: ${r.url().slice(0, 100)}`));
      page.on("response", (r) => r.status() >= 400 && !IGNORE.test(r.url()) && issues.push(`http ${r.status()}: ${r.url().slice(0, 100)}`));
      try {
        await page.goto(base + path, { waitUntil: "networkidle", timeout: 60000 });
        await page.waitForTimeout(800);
        const tag = `${name}-${vp.name}-${path.replace(/\//g, "_") || "_home"}`;
        await page.screenshot({ path: `${OUT}/${tag}-top.png` });
        const docH = await page.evaluate(() => document.documentElement.scrollHeight);
        // scroll suave em passos (deixa scrub/sticky trabalhar), meio e fim
        for (let y = 0; y < docH; y += vp.height * 0.6) {
          await page.evaluate((yy) => window.scrollTo(0, yy), y);
          await page.waitForTimeout(90);
        }
        await page.evaluate((h) => window.scrollTo(0, h * 0.42), docH);
        await page.waitForTimeout(900);
        await page.screenshot({ path: `${OUT}/${tag}-mid.png` });
        // reverse
        await page.evaluate((h) => window.scrollTo(0, h * 0.15), docH);
        await page.waitForTimeout(600);
        const overflow = await page.evaluate(() => ({ doc: document.documentElement.scrollWidth, inner: innerWidth }));
        if (overflow.doc > overflow.inner + 1) issues.push(`overflow: ${overflow.doc} > ${overflow.inner}`);
        // resize test (desktop) / orientation (mobile)
        if (vp.mobile) {
          await page.setViewportSize({ width: vp.height, height: vp.width });
          await page.waitForTimeout(700);
          await page.setViewportSize({ width: vp.width, height: vp.height });
          await page.waitForTimeout(700);
        } else {
          for (const w of [vp.width - 300, vp.width + 200, vp.width]) {
            await page.setViewportSize({ width: w, height: vp.height });
            await page.waitForTimeout(400);
          }
        }
        const after = await page.evaluate(() => ({ doc: document.documentElement.scrollWidth, inner: innerWidth, pins: document.querySelectorAll(".pin-spacer").length }));
        if (after.doc > after.inner + 1) issues.push(`overflow-after-resize: ${after.doc} > ${after.inner}`);
        await page.screenshot({ path: `${OUT}/${tag}-resized.png` });
        const vt = await page.evaluate(() => "startViewTransition" in document);
        report.push({ browser: name, viewport: vp.name, path, vt, issues: [...new Set(issues)] });
      } catch (e) {
        report.push({ browser: name, viewport: vp.name, path, issues: [`FATAL: ${e.message.slice(0, 200)}`] });
      }
      await page.close();
    }
    await ctx.close();
  }
  await browser.close();
}
writeFileSync(`${OUT}/report-${BROWSERS.join("-")}.json`, JSON.stringify(report, null, 2));
for (const r of report) console.log(`${r.browser.padEnd(8)} ${r.viewport.padEnd(5)} ${r.path.padEnd(22)} vt=${r.vt ? "y" : "n"} ${r.issues.length ? "ISSUES:\n    " + r.issues.join("\n    ") : "PASS"}`);
