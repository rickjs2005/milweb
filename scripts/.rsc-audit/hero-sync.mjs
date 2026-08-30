// Validação temporal da cena: sincronização braço ↔ frase em torno do contato, reverso, salto
// rápido, resize perto do contato, console, mão passiva no final, overflow animado do Selected
// Work a 360 px, folha de contato e vídeos curtos (desktop e mobile).
//   node scripts/.rsc-audit/hero-sync.mjs [base]
import { chromium, devices } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
const base = process.argv[2] ?? "http://127.0.0.1:3001";
const OUT = "scripts/.rsc-audit";
mkdirSync(`${OUT}/video`, { recursive: true });
const browser = await chromium.launch({ headless: false });

const boot = async (page, w, h, mobile) => {
  await page.goto(base + "/");
  await page.waitForTimeout(1200);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(1200);
  if (mobile) await page.touchscreen.tap(w / 2, h * 0.3);
  else { await page.mouse.move(w * 0.3, h * 0.4); await page.mouse.move(w * 0.31, h * 0.41); }
  await page.waitForTimeout(5500);
};
const go = (page, p, wait = 700) => page.evaluate(([p, wait]) => new Promise((r) => { const st = window.__miloHero.st(); window.scrollTo({ top: st.start + p * (st.end - st.start), behavior: "instant" }); setTimeout(r, wait); }), [p, wait]);
const read = (page) =>
  page.evaluate(() => {
    const h = window.__miloHero; const f = h.frame; const hero = document.getElementById("top");
    const bx = hero.getBoundingClientRect();
    const w = hero.querySelector("[data-headline-word=last]"); const rg = document.createRange(); rg.selectNodeContents(w); const r = rg.getBoundingClientRect();
    const h1 = hero.querySelector("h1");
    return { p: +f.scroll.toFixed(3), push: +h.heroFrame.push.toFixed(3), touch: +f.touch.toFixed(3), contact: +h.heroFrame.contact.toFixed(3), wdth: h1.style.getPropertyValue("--wdth"),
      hand: [+(bx.left + f.hand.x * bx.width).toFixed(1), +(bx.top + (1 - f.hand.y) * bx.height).toFixed(1)], word: [+r.right.toFixed(1), +(r.top + r.height / 2).toFixed(1)], wordLeft: +r.left.toFixed(1), bodyX: +h.placement.x.toFixed(3), bend: +h.heroFrame.bendMul.toFixed(3), particles: +f.particles.toFixed(3), overflow: document.documentElement.scrollWidth > innerWidth };
  });
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

async function desktop() {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: { dir: `${OUT}/video`, size: { width: 960, height: 540 } } });
  const page = await ctx.newPage();
  const msgs = [];
  page.on("console", (m) => { if (["error", "warning"].includes(m.type()) && !/_vercel|404|THREE\.Clock|React DevTools/.test(m.text())) msgs.push(m.type() + ": " + m.text().slice(0, 160)); });
  page.on("pageerror", (e) => msgs.push("pageerror: " + String(e).slice(0, 160)));
  await boot(page, 1920, 1080, false);
  // ---- passagem contínua (vídeo): 0 → 1 em passos pequenos, depois volta
  for (let p = 0; p <= 1.0001; p += 0.01) await go(page, p, 60);
  for (let p = 1; p >= -0.0001; p -= 0.02) await go(page, p, 40);
  // ---- sequência fina 0.54 → 0.64 (+ 0.68, 0.76, final)
  const seq = [0.54, 0.55, 0.56, 0.57, 0.58, 0.59, 0.595, 0.6, 0.605, 0.61, 0.62, 0.63, 0.64, 0.68, 0.76, 0.985];
  const rest = await (await go(page, 0.56, 900), read(page));
  const rows = [];
  for (const p of seq) { await go(page, p, 800); const r = await read(page); rows.push({ ...r, handDisp: +dist(r.hand, rest.hand).toFixed(1), wordDisp: +(r.word[0] - rest.word[0]).toFixed(1), handWord: +dist(r.hand, r.word).toFixed(1) }); }
  // folha de contato
  const shots = [["1-antecipacao", 0.56], ["2-mao-parada", 0.59], ["3-inicio-simultaneo", 0.6], ["4-reagindo", 0.61], ["5-empurrao", 0.68], ["6-assentamento", 0.76], ["7-final", 0.985]];
  for (const [n, p] of shots) { await go(page, p, 900); await page.screenshot({ path: `${OUT}/sync-${n}.png`, clip: { x: 0, y: 160, width: 1920, height: 920 } }); }
  // ---- reverso fino
  const rev = [];
  for (const p of [...seq].reverse()) { await go(page, p, 500); const r = await read(page); rev.push({ p: r.p, hand: r.hand, word: r.word[0], touch: r.touch }); }
  // ---- salto rápido
  await go(page, 0, 300); await go(page, 0.985, 300); const jumpEnd = await read(page); await go(page, 0.6, 300); const jumpContact = await read(page); await go(page, 0, 900); const jumpBack = await read(page);
  const hint = await page.evaluate(() => getComputedStyle(document.querySelector("[data-hint]")).opacity);
  // ---- resize perto do contato
  await go(page, 0.62, 800); const r0 = await read(page);
  await page.setViewportSize({ width: 1366, height: 768 }); await page.waitForTimeout(1500); await go(page, 0.62, 800); const r1 = await read(page);
  await page.setViewportSize({ width: 1920, height: 1080 }); await page.waitForTimeout(1500); await go(page, 0.62, 800); const r2 = await read(page);
  // ---- fps na puxada
  await go(page, 0.68, 600);
  const fps = await page.evaluate(() => new Promise((r) => { let f = 0; const t0 = performance.now(); const loop = () => { f++; performance.now() - t0 < 2000 ? requestAnimationFrame(loop) : r(f / 2); }; requestAnimationFrame(loop); }));
  await ctx.close();
  return { rows, rev, jumpEnd, jumpContact, jumpBack, hint, resize: [r0, r1, r2], fps, msgs };
}

async function mobileVideo() {
  const ctx = await browser.newContext({ ...devices["iPhone 13"], viewport: { width: 390, height: 844 }, recordVideo: { dir: `${OUT}/video`, size: { width: 390, height: 844 } } });
  const page = await ctx.newPage();
  await boot(page, 390, 844, true);
  for (let p = 0; p <= 1.0001; p += 0.01) await go(page, p, 60);
  for (let p = 1; p >= -0.0001; p -= 0.02) await go(page, p, 40);
  await go(page, 0.985, 900);
  const fin = await read(page);
  await ctx.close();
  return fin;
}

/** Mão ativa no final vs "AS." (os 3 últimos caracteres) em cada viewport. */
async function passiveHand(w, h, mobile) {
  const ctx = await browser.newContext(mobile ? { ...devices["iPhone 13"], viewport: { width: w, height: h } } : { viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  await boot(page, w, h, mobile);
  const out = {};
  for (const [n, p] of [["walk", 0.3], ["stop", 0.5], ["contact", 0.61], ["pull", 0.7], ["final", 0.985]]) {
    await go(page, p, 800);
    out[n] = await page.evaluate(() => {
      const h = window.__miloHero; const f = h.frame; const hero = document.getElementById("top"); const bx = hero.getBoundingClientRect();
      const hand = [bx.left + f.hand.x * bx.width, bx.top + (1 - f.hand.y) * bx.height];
      const word = hero.querySelector("[data-headline-word=last]"); const rg = document.createRange(); rg.selectNodeContents(word); const r = rg.getBoundingClientRect();
      const inside = hand[0] >= r.left && hand[0] <= r.right && hand[1] >= r.top && hand[1] <= r.bottom;
      return { hand: hand.map(Math.round), wordBox: [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)], overWord: inside, touch: +f.touch.toFixed(2) };
    });
  }
  await ctx.close();
  return out;
}

/** Overflow do Selected Work a 360 px ao longo da entrada (várias posições de scroll). */
async function sw360() {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(base + "/"); await page.waitForTimeout(1200); await page.keyboard.press("Escape"); await page.waitForTimeout(2500);
  const res = await page.evaluate(() => new Promise(async (r) => {
    const work = document.getElementById("work"); const top = work.getBoundingClientRect().top + scrollY;
    const out = [];
    // entrada do 1º painel: de "top 80%" a "top 20%" → e depois os próximos painéis
    const points = [-0.8 * innerHeight, -0.6 * innerHeight, -0.4 * innerHeight, -0.2 * innerHeight, 0, innerHeight * 0.5, innerHeight * 1.2, innerHeight * 2.2, innerHeight * 3.2];
    for (const off of points) { window.scrollTo({ top: top + off, behavior: "instant" }); await new Promise((r2) => setTimeout(r2, 500)); out.push([Math.round(off / innerHeight * 100) / 100, document.documentElement.scrollWidth, document.body.scrollWidth, innerWidth]); }
    r(out);
  }));
  await ctx.close();
  return res;
}

const d = await desktop();
console.log("\n== SINCRONIA (1920) — hand/word em px; disp = deslocamento desde o repouso em 0.56");
for (const r of d.rows) console.log(`  p ${r.p.toFixed(3)} push ${r.push} touch ${r.touch} contact ${r.contact} wdth ${(+r.wdth).toFixed(1)} | hand ${r.hand} disp ${r.handDisp} | word ${r.word[0]} disp ${r.wordDisp} | hand↔word ${r.handWord} | bend ${r.bend} particles ${r.particles}`);
console.log("== REVERSO"); for (const r of d.rev) console.log(`  p ${r.p.toFixed(3)} touch ${r.touch} hand ${r.hand} word ${r.word}`);
console.log("== SALTO RÁPIDO", JSON.stringify({ end: [d.jumpEnd.hand, d.jumpEnd.word[0]], contact: [d.jumpContact.hand, d.jumpContact.word[0], d.jumpContact.touch], back: [d.jumpBack.hand, d.jumpBack.word[0], d.jumpBack.touch], hintOpacityAtStart: d.hint }));
console.log("== RESIZE 1920→1366→1920 @0.62", JSON.stringify(d.resize.map((r) => ({ hand: r.hand, word: r.word, d: +dist(r.hand, r.word).toFixed(1) }))));
console.log("== FPS puxada", d.fps, "· console:", d.msgs.length ? d.msgs : "clean");
console.log("\n== MÃO ATIVA vs \"AS.\" (overWord = ponta da mão dentro da caixa da palavra)");
for (const [w, h, m] of [[1920, 1080, false], [1440, 900, false], [1366, 768, false], [768, 1024, true], [390, 844, true], [360, 800, true]]) console.log(`  ${w}x${h}`, JSON.stringify(await passiveHand(w, h, m)));
console.log("\n== SELECTED WORK @360 (offset em vh, html.scrollWidth, body.scrollWidth, innerWidth)", JSON.stringify(await sw360()));
console.log("\n== MOBILE vídeo · final", JSON.stringify(await mobileVideo()));
writeFileSync(`${OUT}/sync.json`, JSON.stringify(d, null, 1));
await browser.close();
