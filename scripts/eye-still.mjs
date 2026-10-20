/**
 * Imagens estáticas do olho do MilWeb OS — geradas pelo MESMO shader do
 * canvas (olho aberto, olhar ao centro, sem brilho), para que a troca
 * imagem → canvas seja invisível e quem não tem WebGL veja o mesmo olho.
 * Uma imagem por identidade (Gojo / Obito) e por enquadramento (desktop / celular).
 *
 *   node scripts/eye-still.mjs [--theme gojo|obito|both] [--blink 0.5] [--glow 0.6] [--review]
 *
 * Sem argumentos escreve public/art/eye-{gojo,obito}.webp (desktop, 1600×800)
 * e eye-{gojo,obito}-mobile.webp (celular, 1040×800). Com `--blink`, `--glow`
 * ou `--review` gera quadros de revisão em .audit/eye-review/ (PNG, compostos
 * sobre a cor do papel de parede do tema — não vão para public/). Rode de novo
 * sempre que o shader ou a config mudarem.
 */
import { chromium } from "playwright";
import ts from "typescript";
import { readFileSync, writeFileSync, statSync, mkdirSync } from "node:fs";

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const blink = Number(opt("--blink") ?? 0);
const glow = Number(opt("--glow") ?? 0);
const review = blink > 0 || glow > 0 || args.includes("--review");
const themeArg = opt("--theme") ?? "both";
const THEMES = themeArg === "both" ? ["gojo", "obito"] : [themeArg];
/** Cor do papel de parede de cada tema (styles/os.css › --os-bg), só para os quadros de revisão. */
const WALL = { gojo: "#F3F5F8", obito: "#0A0A0C" };

const root = new URL("../", import.meta.url);
const transpile = (p) =>
  ts.transpileModule(readFileSync(new URL(p, root), "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
const files = {
  "/renderer.js": transpile("src/webgl/renderer.ts"),
  "/theme.js": transpile("src/features/os/theme.ts"),
  "/eye.config.js": transpile("src/features/os/eye/eye.config.ts").replace('from "../theme"', 'from "./theme.js"'),
  "/eye-frag.js": transpile("src/features/os/eye/eye-frag.ts"),
  "/index.html": `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#0F1318">
<script type="module">
import { createRenderer } from "./renderer.js";
import { OS_EYE, EYE_THEME_UNIFORM } from "./eye.config.js";
import { OS_EYE_FRAG } from "./eye-frag.js";
window.renderStill = (w, h, scale, edge, blink, glow, theme, wall) => new Promise((resolve, reject) => {
  const c = document.createElement("canvas");
  document.body.replaceChildren(c);
  c.style.width = w + "px"; c.style.height = h + "px";
  const r = createRenderer(c, { dpr: 1, alpha: true });
  if (!r) return reject(new Error("sem WebGL"));
  r.addProgram("eye", OS_EYE_FRAG);
  r.onFrame(() => {
    r.clear();
    r.draw("eye", { uRes: [c.width, c.height], uAspect: c.width / c.height, uScale: scale, uTime: 2.0, uBlink: blink, uGaze: [0, 0], uGlow: glow, uDilate: 0, uFade: 1, uEdge: edge, uTheme: EYE_THEME_UNIFORM[theme] });
    const gl = r.gl, W = c.width, H = c.height;
    const px = new Uint8Array(W * H * 4);
    gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const out = document.createElement("canvas"); out.width = W; out.height = H;
    const g = out.getContext("2d"); const img = g.createImageData(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const si = ((H - 1 - y) * W + x) * 4, di = (y * W + x) * 4, a = px[si + 3];
      if (a) { img.data[di] = Math.min(255, Math.round(px[si] * 255 / a)); img.data[di + 1] = Math.min(255, Math.round(px[si + 1] * 255 / a)); img.data[di + 2] = Math.min(255, Math.round(px[si + 2] * 255 / a)); }
      img.data[di + 3] = a;
    }
    g.putImageData(img, 0, 0);
    r.destroy();
    if (wall) {
      // quadro de revisão: composto sobre a cor do papel de parede, PNG
      const bg = document.createElement("canvas"); bg.width = W; bg.height = H;
      const gb = bg.getContext("2d"); gb.fillStyle = wall; gb.fillRect(0, 0, W, H); gb.drawImage(out, 0, 0);
      resolve(bg.toDataURL("image/png"));
    } else resolve(out.toDataURL("image/webp", 0.9));
  });
  r.invalidate();
});
</script>`,
};

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1700, height: 900 } });
page.on("console", (m) => m.type() === "error" && console.error("console:", m.text()));
page.on("pageerror", (e) => console.error("pageerror:", e.message));
await page.route("http://eye.local/**", (route) => {
  const p = new URL(route.request().url()).pathname;
  const body = files[p];
  if (body == null) return route.fulfill({ status: 404, body: "" });
  return route.fulfill({ status: 200, contentType: p.endsWith(".html") ? "text/html" : "text/javascript", body });
});
await page.goto("http://eye.local/index.html");
const FRAMES = [["desktop", 1600, 800, 0.8, 0.92], ["mobile", 1040, 800, 1.12, 0.7]];
if (review) mkdirSync(new URL(".audit/eye-review/", root), { recursive: true });
for (const theme of THEMES) {
  for (const [frame, w, h, scale, edge] of FRAMES) {
    const name = review ? `.audit/eye-review/${theme}-${frame}-b${blink}-g${glow}.png` : `public/art/eye-${theme}${frame === "mobile" ? "-mobile" : ""}.webp`;
    const dataUrl = await page.evaluate(([w, h, s, e, b, g, t, wall]) => window.renderStill(w, h, s, e, b, g, t, wall), [w, h, scale, edge, blink, glow, theme, review ? WALL[theme] : null]);
    const out = new URL(name, root);
    writeFileSync(out, Buffer.from(dataUrl.split(",")[1], "base64"));
    console.log(`${name}: ${w}×${h}, ${(statSync(out).size / 1024).toFixed(0)} KB`);
  }
}
await browser.close();
