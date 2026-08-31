/**
 * Reversibilidade e robustez: a cena é função pura do progresso, então ida e
 * volta têm que dar exatamente o mesmo estado. Também testa salto direto,
 * resize no meio da cena e as três línguas (posição do glifo do globo).
 */
import { chromium } from "playwright";
const base = process.argv[2] ?? "http://127.0.0.1:3100";
const read = (page) => page.evaluate(() => {
  const g = window.__mwGlobe, f = g.frame, o = g.orb;
  return { morph: +f.morph.toFixed(4), depth: +f.depth.toFixed(4), land: +f.land.toFixed(4), mesh: +f.mesh.toFixed(4), mark: +f.mark.toFixed(4), fade: +f.fade.toFixed(4), glyph: +f.glyph.toFixed(4), migrate: +f.migrate.toFixed(4), cx: Math.round(o.cx), cy: Math.round(o.cy) };
});
const b = await chromium.launch({ headless: false });

for (const lang of ["pt", "en", "es"]) {
  const page = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  const bad = [];
  page.on("console", (m) => ["error", "warning"].includes(m.type()) && bad.push(`${m.type()}: ${m.text().slice(0, 120)}`));
  page.on("pageerror", (e) => bad.push(`pageerror: ${String(e).slice(0, 160)}`));
  await page.goto(`${base}/${lang}?quality=high`, { waitUntil: "load" });
  await page.waitForTimeout(500); await page.keyboard.press("Escape"); await page.waitForTimeout(900);
  await page.mouse.move(900, 500); await page.mouse.move(910, 510);
  await page.waitForFunction(() => document.documentElement.dataset.globe === "on", null, { timeout: 15000 });
  const S = (p) => page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), p * 3.2 * 1080);

  // varredura ida
  const ida = {};
  for (const p of [0.3, 0.62, 0.8, 0.95]) { await S(p); await page.waitForTimeout(1100); ida[p] = await read(page); }
  // volta pelos mesmos pontos
  const volta = {};
  for (const p of [0.95, 0.8, 0.62, 0.3]) { await S(p); await page.waitForTimeout(1100); volta[p] = await read(page); }
  // cx/cy do orb ficam com o ÚLTIMO valor medido quando o globo está apagado
  // (o frame nem mede: sai antes). Não é estado de cena — a comparação de
  // reversibilidade olha só o que a timeline escreve.
  const cena = (o) => { const { cx, cy, ...rest } = o; return JSON.stringify(rest); };
  const dif = Object.keys(ida).filter((p) => cena(ida[p]) !== cena(volta[p]));
  const difDetalhe = dif.map((p) => `${p}: ida=${cena(ida[p])} volta=${cena(volta[p])}`).join(" || ");
  // salto direto do topo para o fim
  await S(0); await page.waitForTimeout(1200);
  await S(0.95); await page.waitForTimeout(1400);
  const salto = await read(page);
  const igualSalto = cena(salto) === cena(ida[0.95]);
  // resize no meio da cena
  await S(0.7); await page.waitForTimeout(900);
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.waitForTimeout(1400);
  const posResize = await page.evaluate(() => ({ ok: window.__mwGlobe.orb.ok, ovfX: Math.max(0, document.documentElement.scrollWidth - innerWidth) }));
  const glifo = await page.evaluate(() => document.querySelector("[data-orb]").textContent.trim()[0]);
  console.log(`${lang}: reversível=${dif.length === 0 ? "sim" : "NÃO — " + difDetalhe} · salto==varredura=${igualSalto} · pós-resize orb.ok=${posResize.ok} ovfX=${posResize.ovfX} · glifo="${glifo}" · console=${bad.length ? bad.join(" | ") : "limpo"}`);
  await page.close();
}
await b.close();
