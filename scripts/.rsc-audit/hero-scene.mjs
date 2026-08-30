// Cena do Hero (Milo entra andando → segura "PESSOAS." → arrasta → composição final).
// Captura os estados, testa reversibilidade, deslizamento dos pés, overflow e FPS.
//   node scripts/.rsc-audit/hero-scene.mjs [base] [tag]
import { chromium, devices } from "playwright";
import { writeFileSync } from "node:fs";
const base = process.argv[2] ?? "http://127.0.0.1:3001";
const tag0 = process.argv[3] ?? "scene";
let tag = tag0;
const browser = await chromium.launch({ headless: false });

const toProgress = async (page, p, wait = 900) => {
  await page.evaluate((p) => {
    const st = window.__miloHero?.st?.() ?? null;
    const len = st ? st.end - st.start : 3.5 * innerHeight;
    const start = st ? st.start : 0;
    window.scrollTo({ top: start + p * len, behavior: "instant" });
  }, p);
  await page.waitForTimeout(wait);
};
const read = (page) =>
  page.evaluate(() => {
    const h = window.__miloHero;
    const f = h.frame;
    const hero = document.getElementById("top");
    const line = hero.querySelector("[data-headline-word=last]");
    const rg = document.createRange();
    rg.selectNodeContents(line);
    const r = rg.getBoundingClientRect();
    const h1 = hero.querySelector("h1");
    return {
      p: +f.scroll.toFixed(3),
      st: h.store.getState().state,
      stage: [...hero.querySelectorAll("[data-stage]")].findIndex((n) => n.classList.contains("is-active")),
      x: +h.placement.x.toFixed(2),
      phase: +f.walk.phase.toFixed(2),
      amount: +f.walk.amount.toFixed(2),
      wdth: +h.heroFrame.fontWidth.toFixed(2),
      touch: +f.touch.toFixed(2),
      contact: +h.heroFrame.contact.toFixed(2),
      hand: (() => { const b = hero.getBoundingClientRect(); return [+(b.left + f.hand.x * b.width).toFixed(0), +(b.top + (1 - f.hand.y) * b.height).toFixed(0)]; })(),
      word: [+r.right.toFixed(0), +(r.top + r.height / 2).toFixed(0)],
      h1Right: +h1.getBoundingClientRect().right.toFixed(0),
      overflow: document.documentElement.scrollWidth > innerWidth,
      canvas: !!document.querySelector("[data-milo-canvas][data-ready]"),
    };
  });
const fps = (page) => page.evaluate(() => new Promise((r) => { let f = 0; const t0 = performance.now(); const loop = () => { f++; performance.now() - t0 < 2000 ? requestAnimationFrame(loop) : r(f / 2); }; requestAnimationFrame(loop); }));

async function run(w, h, opts = {}) {
  const ctx = await browser.newContext(opts.mobile ? { ...devices["iPhone 13"], viewport: { width: w, height: h } } : { viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  const errs = [];
  page.on("console", (m) => { if (m.type() === "error" && !/_vercel|404/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  page.on("pageerror", (e) => errs.push(String(e).slice(0, 200)));
  await page.goto(base + "/");
  await page.waitForTimeout(1200);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(1200);
  if (opts.mobile) { await page.touchscreen.tap(w / 2, h * 0.3); } else { await page.mouse.move(w * 0.3, h * 0.4); await page.mouse.move(w * 0.31, h * 0.41); }
  await page.waitForTimeout(5500); // montagem + SplitText + ScrollTrigger + probe
  const L = await page.evaluate(() => window.__miloHero.labels());
  const seq = [["00-initial", 0.0], ["10-design", 0.14], ["30-walk-a", 0.3], ["40-walk-b", 0.42], ["55-stop", L.walkEnd], ["63-reach", (L.armStart + L.contact) / 2], ["68-contact", L.contact + 0.004], ["76-pull", (L.contact + L.pullEnd) / 2], ["84-pull-end", L.pullEnd], ["88-impact", L.pullEnd + 0.035], ["100-final", 0.985]];
  const log = [];
  for (const [name, p] of seq) {
    await toProgress(page, p);
    if (opts.shoot) await page.screenshot({ path: `scripts/.rsc-audit/${tag}-${name}.png` });
    log.push([name, await read(page)]);
  }
  // deslizamento dos pés: durante a caminhada, o pé de apoio deve ficar (quase) parado na tela
  const slide = [];
  for (let p = 0.26; p <= 0.5; p += 0.01) {
    await toProgress(page, p, 120);
    slide.push(await page.evaluate(() => { const f = window.__miloHero.frame; return [f.scroll, f.walk.phase, window.__miloHero.placement.x]; }));
  }
  // reverso
  const rev = [];
  for (let p = 0.985; p >= 0.15; p -= 0.02) { await toProgress(page, p, 200); rev.push([+p.toFixed(3), (await read(page)).hand, (await read(page)).x]); }
  await toProgress(page, L.contact + 0.004, 900);
  if (opts.shoot) await page.screenshot({ path: `scripts/.rsc-audit/${tag}-reverse-contact.png` });
  const revContact = await read(page);
  await toProgress(page, 0.0, 900);
  const revInitial = await read(page);
  let maxJump = 0;
  for (let i = 1; i < rev.length; i++) maxJump = Math.max(maxJump, Math.hypot(rev[i][1][0] - rev[i - 1][1][0], rev[i][1][1] - rev[i - 1][1][1]));
  await toProgress(page, (L.contact + L.pullEnd) / 2);
  const f = await fps(page);
  await toProgress(page, 0.35);
  const f2 = await fps(page);
  console.log(`\n== ${w}x${h}${opts.mobile ? " (touch)" : ""} labels ${JSON.stringify(L)}\n   fps pull ${f} · walk ${f2} · errors ${errs.length ? JSON.stringify(errs) : "none"}`);
  for (const [n, s] of log) console.log("  ", n.padEnd(12), JSON.stringify(s));
  console.log("   reverse→contact", JSON.stringify(revContact));
  console.log("   reverse→initial", JSON.stringify(revInitial), "| maior salto da mão no reverso:", maxJump.toFixed(1), "px/passo");
  console.log("   walk samples (p, phase, x):", JSON.stringify(slide.map((s) => [+s[0].toFixed(2), +s[1].toFixed(2), +s[2].toFixed(2)])));
  await ctx.close();
  return log;
}
const d = await run(1920, 1080, { shoot: true });
tag = tag0 + "-m";
await run(1440, 900, { shoot: false });
await run(1366, 768, { shoot: false });
await run(390, 844, { shoot: true, mobile: true });
writeFileSync(`scripts/.rsc-audit/${tag}.json`, JSON.stringify(d, null, 1));
await browser.close();
