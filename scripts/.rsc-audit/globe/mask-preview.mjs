// Pré-visualização da máscara de terra: roda o MESMO código de src/webgl/earth-mask.ts
// num browser real e salva um PNG ampliado, para conferir os continentes a olho.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const src = readFileSync("src/webgl/earth-mask.ts", "utf8")
  .replace(/^type Ring[\s\S]*?;$/m, "")
  .replace(/: Ring\[\]/g, "")
  .replace(/: HTMLCanvasElement/g, "")
  .replace(/\(lon: number\)/g, "(lon)")
  .replace(/\(lat: number\)/g, "(lat)")
  .replace(/\(ring: Ring\)/g, "(ring)")
  .replace(/ as const/g, "")
  .replace(/^export /gm, "")
  .replace(/!/g, "");

const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1040, height: 560 } });
await page.setContent(`<body style="margin:0;background:#F2F0EA"><div id="o"></div></body>`);
await page.evaluate(
  ([code]) => {
    eval(code);
    // eslint-disable-next-line no-undef
    const m = createEarthMask();
    const big = document.createElement("canvas");
    big.width = 1024;
    big.height = 512;
    const g = big.getContext("2d");
    g.imageSmoothingEnabled = false;
    g.drawImage(m, 0, 0, 1024, 512);
    // grade de referência a cada 30°
    g.strokeStyle = "rgba(183,255,55,.55)";
    g.lineWidth = 1;
    for (let lon = -180; lon <= 180; lon += 30) { const x = ((lon + 180) / 360) * 1024; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 512); g.stroke(); }
    for (let lat = -90; lat <= 90; lat += 30) { const y = ((90 - lat) / 180) * 512; g.beginPath(); g.moveTo(0, y); g.lineTo(1024, y); g.stroke(); }
    // marcador do Brasil
    g.fillStyle = "#ff2d2d";
    g.fillRect(((-47.9 + 180) / 360) * 1024 - 4, ((90 - -15.8) / 180) * 512 - 4, 8, 8);
    document.getElementById("o").appendChild(big);
  },
  [src],
);
await page.locator("canvas").screenshot({ path: "scripts/.rsc-audit/globe/mask-preview.png" });
await b.close();
console.log("ok → scripts/.rsc-audit/globe/mask-preview.png");
