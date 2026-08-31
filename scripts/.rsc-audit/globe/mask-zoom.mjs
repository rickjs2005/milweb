import { chromium } from "playwright";
import { readFileSync } from "node:fs";
const src = readFileSync("src/webgl/earth-mask.ts", "utf8")
  .replace(/^type Ring[\s\S]*?;$/m, "").replace(/: Ring\[\]/g, "").replace(/: HTMLCanvasElement/g, "")
  .replace(/\(lon: number\)/g, "(lon)").replace(/\(lat: number\)/g, "(lat)").replace(/\(ring: Ring\)/g, "(ring)")
  .replace(/ as const/g, "").replace(/^export /gm, "").replace(/!/g, "");
const [lon0, lon1, lat0, lat1] = process.argv.slice(2).map(Number);
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1100, height: 700 } });
await page.setContent(`<body style="margin:0"><div id="o"></div></body>`);
await page.evaluate(([code, L0, L1, A0, A1]) => {
  eval(code);
  const m = createEarthMask();
  const W = 1024, H = 640;
  const big = document.createElement("canvas"); big.width = W; big.height = H;
  const g = big.getContext("2d"); g.imageSmoothingEnabled = false;
  const sx = ((L0 + 180) / 360) * m.width, sw = ((L1 - L0) / 360) * m.width;
  const sy = ((90 - A1) / 180) * m.height, sh = ((A1 - A0) / 180) * m.height;
  g.drawImage(m, sx, sy, sw, sh, 0, 0, W, H);
  g.strokeStyle = "rgba(255,60,60,.5)";
  for (let lon = Math.ceil(L0 / 10) * 10; lon <= L1; lon += 10) { const x = ((lon - L0) / (L1 - L0)) * W; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  for (let lat = Math.ceil(A0 / 10) * 10; lat <= A1; lat += 10) { const y = ((A1 - lat) / (A1 - A0)) * H; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  document.getElementById("o").appendChild(big);
}, [src, lon0, lon1, lat0, lat1]);
await page.locator("canvas").screenshot({ path: "scripts/.rsc-audit/globe/mask-zoom.png" });
await b.close();
console.log("ok");
