/**
 * A passagem do Hero para o Selected Work: capturas logo DEPOIS do pin soltar
 * (o globo tem que sair junto com a section, sem corte) + custo de frame médio
 * durante a formação do globo.
 */
import { chromium } from "playwright";
const base = process.argv[2] ?? "http://127.0.0.1:3100";
const b = await chromium.launch({ headless: false });
for (const [w, h] of [[1920, 1080], [390, 844]]) {
  const page = await b.newPage({ viewport: { width: w, height: h }, isMobile: w < 720, hasTouch: w < 720 });
  await page.goto(`${base}/pt?quality=high`, { waitUntil: "load" });
  await page.waitForTimeout(500); await page.keyboard.press("Escape"); await page.waitForTimeout(900);
  await page.mouse.move(w * 0.5, h * 0.4); await page.mouse.move(w * 0.5 + 8, h * 0.4 + 5);
  await page.waitForFunction(() => document.documentElement.dataset.globe === "on", null, { timeout: 15000 });
  const pin = w < 720 ? 2.2 : 3.2;
  for (const k of [0.96, 1.0, 1.06, 1.14, 1.3]) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), k * pin * h);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `scripts/.rsc-audit/globe/handoff-${w}-${String(Math.round(k * 100))}.png` });
  }
  // custo real: quantos frames o renderer entrega em 3 s enquanto o globo está formado
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), 0.88 * pin * h);
  await page.waitForTimeout(1200);
  const f0 = await page.evaluate(() => window.__mwGlobe.frames);
  const t0 = Date.now();
  await page.waitForTimeout(3000);
  const f1 = await page.evaluate(() => window.__mwGlobe.frames);
  const seg = (Date.now() - t0) / 1000;
  console.log(`${w}x${h} · ${((f1 - f0) / seg).toFixed(1)} fps do canvas (teto ${w < 720 ? 30 : "30–40"}) · dpr=${await page.evaluate(() => window.__mwGlobe.dpr)}`);
  // e o rAF continua depois que a section sai da tela?
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight * 0.7, behavior: "instant" }));
  await page.waitForTimeout(1200);
  const a = await page.evaluate(() => window.__mwGlobe.frames);
  await page.waitForTimeout(2000);
  const c = await page.evaluate(() => ({ f: window.__mwGlobe.frames, held: window.__mwGlobe.held, onScreen: window.__mwGlobe.onScreen }));
  console.log(`   fora da tela: +${c.f - a} frames em 2 s · held=${c.held} onScreen=${c.onScreen}`);
  await page.close();
}
await b.close();
