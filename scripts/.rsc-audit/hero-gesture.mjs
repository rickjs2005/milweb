// Coreografia da headline: captura a sequência do gesto, testa reversibilidade (sem saltos) e FPS.
//   node scripts/.rsc-audit/hero-gesture.mjs [base]
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
const base = process.argv[2] ?? "http://127.0.0.1:3001";
const browser = await chromium.launch({ headless: false });
const toProgress = async (page, p, wait = 900) => { await page.evaluate((p) => window.scrollTo({ top: p * 3.5 * innerHeight, behavior: "instant" }), p); await page.waitForTimeout(wait); };
const read = (page) => page.evaluate(() => { const h = window.__miloHero; const f = h.frame; return { st: h.store.getState().state, g: +h.heroFrame.gesture.toFixed(2), wdth: +h.heroFrame.fontWidth.toFixed(2), contact: +h.heroFrame.contact.toFixed(2), touch: +f.touch.toFixed(2), hand: [+(f.hand.x * innerWidth).toFixed(0), +((1 - f.hand.y) * innerHeight).toFixed(0)], anchor: [+(f.panel.x * innerWidth).toFixed(0), +((1 - f.panel.y) * innerHeight).toFixed(0)] }; });
const fps = (page) => page.evaluate(() => new Promise((r) => { let f = 0; const t0 = performance.now(); const loop = () => { f++; performance.now() - t0 < 2000 ? requestAnimationFrame(loop) : r(f / 2); }; requestAnimationFrame(loop); }));

async function run(w, h, shoot) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  const errs = [];
  page.on("console", (m) => { if (m.type() === "error" && !/_vercel|404/.test(m.text())) errs.push(m.text().slice(0, 160)); });
  page.on("pageerror", (e) => errs.push(String(e).slice(0, 160)));
  await page.goto(base + "/");
  await page.waitForTimeout(1200);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(1200);
  await page.mouse.move(w * 0.3, h * 0.4); await page.mouse.move(w * 0.31, h * 0.41);
  await page.waitForTimeout(5000); // montagem + SplitText + ScrollTrigger
  const L = await page.evaluate(() => window.__miloHero.labels());
  const g = (t) => L.typeAnticipate + t * (L.typeSettle - L.typeAnticipate);
  const seq = [["00-rest", 0.2], ["15-anticipation", g(0.15)], ["35-contact", L.typeContact + 0.002], ["55-pulling", (L.typeContact + L.typePullEnd) / 2], ["80-expanded", L.typePullEnd], ["90-release", L.typeRelease], ["100-rest", L.typeSettle + 0.02]];
  const log = [];
  for (const [name, p] of seq) {
    await toProgress(page, p);
    if (shoot) await page.screenshot({ path: `scripts/.rsc-audit/milo-type-${name}.png` });
    log.push([name, +p.toFixed(3), await read(page)]);
  }
  // reverso: descanso → contato, e trajetórias sem salto
  await toProgress(page, L.typeSettle + 0.02);
  const rev = [];
  for (let p = L.typeSettle + 0.02; p >= L.typeContact - 0.02; p -= 0.02) { await toProgress(page, p, 250); rev.push([+p.toFixed(3), (await read(page)).hand]); }
  await toProgress(page, L.typeContact + 0.002, 900);
  if (shoot) await page.screenshot({ path: `scripts/.rsc-audit/milo-type-reverse-contact.png` });
  const revContact = await read(page);
  let maxJump = 0;
  for (let i = 1; i < rev.length; i++) maxJump = Math.max(maxJump, Math.hypot(rev[i][1][0] - rev[i - 1][1][0], rev[i][1][1] - rev[i - 1][1][1]));
  // meio → fim → meio · meio → início → meio
  const mid = (L.typeContact + L.typePullEnd) / 2;
  await toProgress(page, mid); const m1 = await read(page);
  await toProgress(page, L.typeSettle + 0.05); await toProgress(page, mid); const m2 = await read(page);
  await toProgress(page, L.typeAnticipate - 0.05); await toProgress(page, mid); const m3 = await read(page);
  // braço em descanso nos outros estágios
  const rest = {};
  for (const [n, p] of [["images", 0.7], ["scan", 0.75], ["ship", 0.87]]) { await toProgress(page, p); rest[n] = (await read(page)).touch; }
  await toProgress(page, mid);
  const f = await fps(page);
  console.log(`\n== ${w}x${h} labels ${JSON.stringify(L)} fps@pull ${f} errors ${errs.length ? JSON.stringify(errs) : "none"}`);
  for (const [n, p, s] of log) console.log("  ", n.padEnd(16), p, JSON.stringify(s));
  console.log("   reverse-contact", JSON.stringify(revContact), "| maior salto da mão no reverso:", maxJump.toFixed(1), "px/passo");
  console.log("   meio→fim→meio", JSON.stringify(m1.hand), "→", JSON.stringify(m2.hand), "| meio→início→meio →", JSON.stringify(m3.hand));
  console.log("   braço em descanso (touch):", JSON.stringify(rest));
  await ctx.close();
  return log;
}
const d = await run(1920, 1080, true);
await run(1440, 900, false);
await run(1366, 768, false);
writeFileSync("scripts/.rsc-audit/milo-type-sequence.json", JSON.stringify(d, null, 1));
await browser.close();
