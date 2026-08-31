/**
 * Captura do Hero em 0 / 20 / 40 / 60 / 75 / 90 / 100 % do pin, desktop e
 * mobile, com o console vigiado. Uso:
 *   node scripts/.rsc-audit/globe/hero-frames.mjs [base] [viewport...]
 * Ex.: node scripts/.rsc-audit/globe/hero-frames.mjs http://127.0.0.1:3100 1920x1080 390x844
 *
 * Roda com janela real (headless usa SwiftShader e a sonda de GPU reprova o
 * canvas de propósito) e com ?quality=high, que é palavra final no perfil.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const base = process.argv[2] ?? "http://127.0.0.1:3100";
const sizes = (process.argv.slice(3).length ? process.argv.slice(3) : ["1920x1080", "390x844"]).map((s) => {
  const [width, height] = s.split("x").map(Number);
  return { width, height };
});
const STEPS = [0, 0.2, 0.4, 0.6, 0.75, 0.9, 1];
const OUT = "scripts/.rsc-audit/globe";
mkdirSync(OUT, { recursive: true });

const b = await chromium.launch({ headless: false });
for (const vp of sizes) {
  const tag = `${vp.width}x${vp.height}`;
  const page = await b.newPage({ viewport: vp, deviceScaleFactor: 1, isMobile: vp.width < 720, hasTouch: vp.width < 720 });
  const bad = [];
  page.on("console", (m) => ["error", "warning"].includes(m.type()) && bad.push(`${m.type()}: ${m.text().slice(0, 160)}`));
  page.on("pageerror", (e) => bad.push(`pageerror: ${String(e).slice(0, 200)}`));

  await page.goto(`${base}/pt?quality=high`, { waitUntil: "load" });
  await page.waitForTimeout(600);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(900);
  // arma o canvas (primeira interação) e espera a montagem
  await page.mouse.move(vp.width * 0.5, vp.height * 0.5);
  await page.mouse.move(vp.width * 0.5 + 12, vp.height * 0.5 + 8);
  await page.mouse.wheel(0, 1);
  let state = "?";
  try {
    await page.waitForFunction(() => document.documentElement.dataset.globe === "on", null, { timeout: 8000 });
    state = "on";
  } catch {
    state = await page.evaluate(() => document.documentElement.dataset.globe ?? "(nenhum)");
  }

  const span = await page.evaluate(() => 3.2 * window.innerHeight);
  const pinned = vp.width < 720 ? 2.2 : 3.2;
  for (const p of STEPS) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), p * pinned * vp.height);
    await page.waitForTimeout(950);
    await page.screenshot({ path: `${OUT}/${process.env.TAG ?? "hero"}-${tag}-${String(Math.round(p * 100)).padStart(3, "0")}.png` });
  }
  const overflow = await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - window.innerWidth));
  console.log(`${tag} · data-globe=${state} · span=${Math.round(span)} · overflow-x=${overflow}px · console=${bad.length ? bad.join(" | ") : "limpo"}`);
  await page.close();
}
await b.close();
