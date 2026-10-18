/**
 * Imagem estática do globo do MilWeb OS — gerada pelo MESMO shader do canvas,
 * na pose de repouso (Brasil de frente, sem pulso), para que a troca
 * imagem → canvas no desktop seja invisível e o celular (que nunca monta
 * WebGL) veja exatamente o mesmo objeto.
 *
 *   node scripts/globe-still.mjs
 *
 * Escreve public/art/globe-still.webp (1600 px) e globe-still-800.webp.
 * Rode de novo sempre que o shader, a máscara de terra ou a config mudarem.
 */
import { chromium } from "playwright";
import ts from "typescript";
import { readFileSync, writeFileSync, statSync } from "node:fs";

const root = new URL("../", import.meta.url);
const transpile = (p) =>
  ts.transpileModule(readFileSync(new URL(p, root), "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
const files = {
  "/renderer.js": transpile("src/webgl/renderer.ts"),
  "/earth-mask.js": transpile("src/webgl/earth-mask.ts"),
  "/globe.config.js": transpile("src/features/os/globe/globe.config.ts"),
  "/globe-frag.js": transpile("src/features/os/globe/globe-frag.ts").replace(/from "\.\/globe\.config"/, 'from "./globe.config.js"'),
  "/index.html": `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#0F1318">
<script type="module">
import { createRenderer } from "./renderer.js";
import { createEarthMask } from "./earth-mask.js";
import { OS_GLOBE } from "./globe.config.js";
import { OS_GLOBE_FRAG } from "./globe-frag.js";
window.renderStill = (size) => new Promise((resolve, reject) => {
  // Um canvas novo por imagem: destroy() perde o contexto do anterior de propósito.
  const c = document.createElement("canvas");
  document.body.replaceChildren(c);
  c.style.width = size + "px"; c.style.height = size + "px";
  const r = createRenderer(c, { dpr: 1, alpha: true });
  if (!r) return reject(new Error("sem WebGL"));
  r.addProgram("globe", OS_GLOBE_FRAG);
  const mask = createEarthMask(2);
  r.texture("earth", mask);
  r.onFrame(() => {
    r.clear();
    r.draw("globe", {
      uRes: [c.width, c.height], uCenter: [c.width / 2, c.height / 2], uRadius: c.width / 2 * OS_GLOBE.fill,
      uSpin: OS_GLOBE.spinHome, uTilt: OS_GLOBE.tilt, uTime: 0, uFade: 1, uLive: 0, uTexel: [1 / mask.width, 1 / mask.height],
    }, [{ name: "uTex", tex: r.getTexture("earth"), unit: 0 }]);
    const gl = r.gl, w = c.width, h = c.height;
    const px = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
    // O framebuffer é premultiplicado e nasce de cabeça para baixo; o ImageData quer alfa direto.
    const out = document.createElement("canvas"); out.width = w; out.height = h;
    const g = out.getContext("2d"); const img = g.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const si = ((h - 1 - y) * w + x) * 4, di = (y * w + x) * 4, a = px[si + 3];
      if (a) { img.data[di] = Math.min(255, Math.round(px[si] * 255 / a)); img.data[di + 1] = Math.min(255, Math.round(px[si + 1] * 255 / a)); img.data[di + 2] = Math.min(255, Math.round(px[si + 2] * 255 / a)); }
      img.data[di + 3] = a;
    }
    g.putImageData(img, 0, 0);
    r.destroy();
    resolve(out.toDataURL("image/webp", 0.88));
  });
  r.invalidate();
});
</script>`,
};

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1700, height: 1700 } });
page.on("console", (m) => m.type() === "error" && console.error("console:", m.text()));
page.on("pageerror", (e) => console.error("pageerror:", e.message));
await page.route("http://globe.local/**", (route) => {
  const p = new URL(route.request().url()).pathname;
  const body = files[p];
  if (body == null) return route.fulfill({ status: 404, body: "" });
  return route.fulfill({ status: 200, contentType: p.endsWith(".html") ? "text/html" : "text/javascript", body });
});
await page.goto("http://globe.local/index.html");
for (const [size, name] of [
  [1600, "globe-still.webp"],
  [800, "globe-still-800.webp"],
]) {
  const dataUrl = await page.evaluate((s) => window.renderStill(s), size);
  const out = new URL(`public/art/${name}`, root);
  writeFileSync(out, Buffer.from(dataUrl.split(",")[1], "base64"));
  console.log(`${name}: ${size}px, ${(statSync(out).size / 1024).toFixed(0)} KB`);
}
await browser.close();
