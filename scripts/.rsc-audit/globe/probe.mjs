import { chromium } from "playwright";
const base = process.argv[2] ?? "http://127.0.0.1:3100";
const b = await chromium.launch({ headless: false });
const page = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(`${base}/pt?quality=high`, { waitUntil: "load" });
await page.waitForTimeout(600);
await page.keyboard.press("Escape");
await page.waitForTimeout(1400);
await page.mouse.move(900, 500);
await page.mouse.move(910, 510);
await page.waitForFunction(() => document.documentElement.dataset.globe === "on", null, { timeout: 15000 });
await page.waitForTimeout(400);
await page.evaluate(() => window.scrollTo({ top: 0.62 * 3.2 * innerHeight, behavior: "instant" }));
await page.waitForTimeout(1500);
const g1 = await page.evaluate(() => {
  const g = window.__mwGlobe;
  const f = g.frame, o = g.orb;
  return { frame: { morph: +f.morph.toFixed(3), depth: +f.depth.toFixed(3), land: +f.land.toFixed(3), mesh: +f.mesh.toFixed(3), mark: +f.mark.toFixed(3), fade: +f.fade.toFixed(3), migrate: +f.migrate.toFixed(3) }, orb: { cx: Math.round(o.cx), cy: Math.round(o.cy), rx: +o.rx.toFixed(1), ry: +o.ry.toFixed(1), ok: o.ok }, frames: g.frames, held: g.held, hidden: g.hidden, dpr: g.dpr };
});
await page.waitForTimeout(1200);
const g2 = await page.evaluate(() => window.__mwGlobe.frames);
await page.evaluate(() => window.__mwGlobe.api.sync());
await page.waitForTimeout(800);
console.log("depois de sync() manual:", await page.evaluate(() => ({ frames: window.__mwGlobe.frames, held: window.__mwGlobe.held, orbOk: window.__mwGlobe.orb.ok })));
console.log("globe@0.62", g1, "frames depois de 1,2s:", g2);
console.log("hero", await page.evaluate(() => {
  const h = window.__mwHero, g = window.__mwGlobe;
  return { p: +h.p.toFixed(3), tlp: +h.tlp.toFixed(3), sameObject: h.frame === g.frame, heroFade: h.frame.fade, globeFade: g.frame.fade };
}));
console.log(
  await page.evaluate(() => {
    const h1 = document.querySelector("h1");
    const out = { text: h1.textContent, html: h1.innerHTML.slice(0, 900) };
    const orb = document.querySelector("[data-orb]");
    if (orb) {
      const g = orb.getBoundingClientRect();
      const c = orb.querySelector("[data-orb-cap]").getBoundingClientRect();
      out.orb = { left: Math.round(g.left), width: +g.width.toFixed(1), gTop: Math.round(g.top), gBottom: Math.round(g.bottom), capTop: Math.round(c.top), capBottom: Math.round(c.bottom), capH: +c.height.toFixed(1) };
      out.fontSize = getComputedStyle(h1).fontSize;
    }
    const mask = document.querySelector("h1 [data-word] > *");
    if (mask) {
      const cs = getComputedStyle(mask);
      out.mask = { tag: mask.tagName, cls: mask.className, overflow: cs.overflow, h: cs.height, display: cs.display, inner: mask.innerHTML.slice(0, 120) };
    }
    return out;
  }),
);
await b.close();
