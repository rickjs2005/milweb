/**
 * Estados que a captura normal não cobre: reduced-motion, sem WebGL
 * (data-globe="off" → SVG estático) e as três línguas com a manchete nova.
 *   node scripts/.rsc-audit/globe/states.mjs [base]
 */
import { chromium } from "playwright";
const base = process.argv[2] ?? "http://127.0.0.1:3100";
const b = await chromium.launch({ headless: false });

// ---- reduced-motion (desktop e mobile) --------------------------------
for (const [w, h] of [[1920, 1080], [390, 844]]) {
  const page = await b.newPage({ viewport: { width: w, height: h }, reducedMotion: "reduce", isMobile: w < 720 });
  const bad = [];
  page.on("pageerror", (e) => bad.push(String(e).slice(0, 140)));
  await page.goto(`${base}/pt`, { waitUntil: "load" });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `scripts/.rsc-audit/globe/reduced-${w}.png` });
  const r = await page.evaluate(() => ({
    headline: document.querySelector("h1").textContent,
    orbVisivel: +getComputedStyle(document.querySelector("[data-orb]")).opacity,
    svg: +getComputedStyle(document.querySelector(".hero-globe-fallback")).opacity,
    globeAttr: document.documentElement.dataset.globe ?? "(nenhum)",
    ovfX: Math.max(0, document.documentElement.scrollWidth - innerWidth),
  }));
  console.log(`reduced ${w}x${h}:`, r, bad.length ? bad : "");
  await page.close();
}

// ---- sem WebGL (quality=low força o SVG) -------------------------------
{
  const page = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(`${base}/pt?quality=low`, { waitUntil: "load" });
  await page.waitForTimeout(500);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(1200);
  await page.mouse.move(900, 500);
  await page.mouse.move(910, 510);
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo({ top: 0.9 * 3.2 * innerHeight, behavior: "instant" }));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "scripts/.rsc-audit/globe/nowebgl-1920.png" });
  console.log(
    "sem webgl:",
    await page.evaluate(() => ({ globeAttr: document.documentElement.dataset.globe ?? "(nenhum)", svg: +getComputedStyle(document.querySelector(".hero-globe-fallback")).opacity, orb: +getComputedStyle(document.querySelector("[data-orb]")).opacity, headline: document.querySelector("h1").textContent })),
  );
  await page.close();
}

// ---- três línguas: a manchete cabe? -----------------------------------
for (const lang of ["pt", "en", "es"]) {
  for (const [w, h] of [[1920, 1080], [1366, 768], [320, 568], [430, 932]]) {
    const page = await b.newPage({ viewport: { width: w, height: h }, isMobile: w < 720 });
    await page.goto(`${base}/${lang}`, { waitUntil: "load" });
    await page.waitForTimeout(400);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(1200);
    const r = await page.evaluate(() => {
      const ink = (el) => { const rg = document.createRange(); rg.selectNodeContents(el); return rg.getBoundingClientRect(); };
      const lines = [...document.querySelectorAll("h1 [data-line]")].map(ink);
      const m = parseFloat(getComputedStyle(document.getElementById("top")).paddingLeft);
      const orb = document.querySelector("[data-orb]");
      return {
        maxRight: Math.round(Math.max(...lines.map((b) => b.right))),
        limite: Math.round(innerWidth - m),
        letra: orb?.textContent?.trim()[0] ?? "?",
        ovfX: Math.max(0, document.documentElement.scrollWidth - innerWidth),
      };
    });
    const ok = r.maxRight <= r.limite + 1 && r.ovfX === 0 && r.letra === "O";
    console.log(`${ok ? "ok " : "FALHA"} ${lang} ${w}x${h}: tinta até ${r.maxRight} (limite ${r.limite}) · glifo="${r.letra}" · ovfX=${r.ovfX}`);
    await page.close();
  }
}
await b.close();
