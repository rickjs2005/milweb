/**
 * Métricas EXATAS do glifo "O" da manchete: caixa de tinta real (measureText
 * com actualBoundingBox*) comparada com a caixa de layout do <span data-orb> e
 * com a régua de linha de base. Daí saem GLOBE_GLYPH.widthRatio/overshoot.
 */
import { chromium } from "playwright";
const b = await chromium.launch({ headless: false });
for (const [w, h] of [[1920, 1080], [1366, 768], [390, 844]]) {
  const page = await b.newPage({ viewport: { width: w, height: h }, isMobile: w < 720 });
  await page.goto("http://127.0.0.1:3100/pt", { waitUntil: "load" });
  await page.waitForTimeout(400); await page.keyboard.press("Escape"); await page.waitForTimeout(1500);
  console.log(`${w}x${h}`, await page.evaluate(async () => {
    await document.fonts.ready;
    const h1 = document.querySelector("h1");
    const cs = getComputedStyle(h1);
    const orb = document.querySelector("[data-orb]");
    const g = orb.getBoundingClientRect();
    const cap = orb.querySelector("[data-orb-cap]").getBoundingClientRect();
    const c = document.createElement("canvas").getContext("2d");
    // mesma família/peso/eixos que o h1
    c.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    c.fontStretch = cs.fontStretch;
    const m = c.measureText("O");
    // espessura da haste: rasteriza o "O" grande e varre a linha horizontal do
    // meio contando as corridas de tinta (haste · contra-forma · haste)
    const S = 400;
    const cv = document.createElement("canvas"); cv.width = S; cv.height = S;
    const x = cv.getContext("2d");
    x.fillStyle = "#fff"; x.fillRect(0, 0, S, S);
    x.font = `${cs.fontStyle} ${cs.fontWeight} 300px ${cs.fontFamily}`;
    x.fontStretch = cs.fontStretch;
    x.fillStyle = "#000"; x.textBaseline = "alphabetic";
    const mm = x.measureText("O");
    x.fillText("O", (S - mm.width) / 2, S / 2 + (mm.actualBoundingBoxAscent - mm.actualBoundingBoxDescent) / 2);
    const px = x.getImageData(0, Math.round(S / 2), S, 1).data;
    const runs = []; let inRun = false, start = 0;
    for (let i = 0; i < S; i++) { const dark = px[i * 4] < 128; if (dark && !inRun) { inRun = true; start = i; } else if (!dark && inRun) { inRun = false; runs.push([start, i - start]); } }
    const inkW = mm.actualBoundingBoxLeft + mm.actualBoundingBoxRight;
    const haste = runs.length === 2 ? (runs[0][1] + runs[1][1]) / 2 : null;
    const strokeRatio = haste ? +(haste / (inkW / 2)).toFixed(4) : null;
    const tinta = { w: m.actualBoundingBoxLeft + m.actualBoundingBoxRight, h: m.actualBoundingBoxAscent + m.actualBoundingBoxDescent, asc: m.actualBoundingBoxAscent, desc: m.actualBoundingBoxDescent, avanco: m.width };
    return {
      fontSize: +parseFloat(cs.fontSize).toFixed(2),
      capPx: +cap.height.toFixed(2),
      spanW: +g.width.toFixed(2),
      tinta: { w: +tinta.w.toFixed(2), h: +tinta.h.toFixed(2), asc: +tinta.asc.toFixed(2), desc: +tinta.desc.toFixed(2), avanco: +tinta.avanco.toFixed(2) },
      // o que o shader precisa
      widthRatio: +(tinta.w / g.width).toFixed(4),
      overshoot: +(tinta.h / cap.height).toFixed(4),
      // centro vertical da tinta em relação à linha de base (cap.bottom)
      centroAcimaDaBase: +((tinta.asc - tinta.desc) / 2 / cap.height).toFixed(4),
      hastes: runs.map((r) => r[1]),
      strokeRatio,
    };
  }));
  await page.close();
}
await b.close();
