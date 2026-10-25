/**
 * Imagens estáticas do fundo do MilWeb OS — geradas pelos MESMOS shaders do
 * canvas (features/os/scene), no instante zero, sem paralaxe e sem véus: o
 * canvas entra por cima delas sem salto, e quem tem movimento reduzido, sem
 * WebGL ou com GPU fraca vê o mesmo universo. Uma imagem por universo e por
 * enquadramento; o CSS as posiciona pelo centro e raio do palco.
 *
 *   node scripts/scene-still.mjs                      → public/art/scene-{tsukuyomi,void}[-mobile].webp
 *   node scripts/scene-still.mjs --review [--t 12]    → quadros de revisão (PNG) em .audit/scene-review/:
 *        os dois universos no enquadramento do desktop (1440 × 864) e do telefone (390 × 844) e as duas
 *        travessias (escuro → claro, claro → escuro) em vários pontos do progresso
 *
 * Rode de novo sempre que um shader, a textura de ruído ou SCENE_STILL mudarem.
 */
import { chromium } from "playwright";
import ts from "typescript";
import { readFileSync, writeFileSync, statSync, mkdirSync } from "node:fs";

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const review = args.includes("--review");
const T = Number(opt("--t", "0"));
const root = new URL("../", import.meta.url);

const transpile = (p) =>
  ts
    .transpileModule(readFileSync(new URL(p, root), "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } })
    .outputText.replace(/from "\.\/([\w.-]+)"/g, 'from "./$1.js"');
const files = {
  "/renderer.js": transpile("src/webgl/renderer.ts"),
  "/scene.config.js": transpile("src/features/os/scene/scene.config.ts"),
  "/glsl-common.js": transpile("src/features/os/scene/glsl-common.ts"),
  "/tsukuyomi-frag.js": transpile("src/features/os/scene/tsukuyomi-frag.ts"),
  "/void-frag.js": transpile("src/features/os/scene/void-frag.ts"),
  "/noise.js": transpile("src/features/os/scene/noise.ts"),
  "/index.html": `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#000">
<script type="module">
import { createRenderer } from "./renderer.js";
import { TSUKUYOMI_FRAG } from "./tsukuyomi-frag.js";
import { VOID_FRAG } from "./void-frag.js";
import { uploadNoise } from "./noise.js";
const FRAG = { tsukuyomi: TSUKUYOMI_FRAG, void: VOID_FRAG };
const easeOut = (u) => 1 - Math.pow(1 - Math.max(0, Math.min(1, u)), 3);
// job: { w, h, cx, cy, r, t, from, to, p, ox, oy, type }   (cx, cy em px da imagem, y para baixo)
window.render = (job) => new Promise((resolve, reject) => {
  const c = document.createElement("canvas");
  document.body.replaceChildren(c);
  c.style.width = job.w + "px"; c.style.height = job.h + "px";
  const r = createRenderer(c, { dpr: 1, alpha: false });
  if (!r) return reject(new Error("sem WebGL"));
  try { r.addProgram("tsukuyomi", FRAG.tsukuyomi); r.addProgram("void", FRAG.void); } catch (e) { return reject(e); }
  const noise = uploadNoise(r.gl);
  r.onFrame(() => {
    const W = c.width, H = c.height;
    const base = { uRes: [W, H], uC: [job.cx, H - job.cy], uR: job.r, uTime: job.t, uPar: [0, 0] };
    const tex = [{ name: "uNoise", tex: noise, unit: 0 }];
    r.clear();
    if (job.to == null) r.draw(job.from, { ...base, uLeave: 0, uEnter: 1, uWave: [0, 0, -1] }, tex);
    else {
      const wu = (job.p - 0.02) / 0.40;
      const wave = [job.ox, H - job.oy, easeOut(wu)];
      if (job.p < 0.97) r.draw(job.from, { ...base, uLeave: job.p, uEnter: 1, uWave: wave }, tex);
      if (job.p > 0.33) r.draw(job.to, { ...base, uLeave: 0, uEnter: job.p, uWave: wave }, tex);
    }
    const px = new Uint8Array(W * H * 4);
    r.gl.readPixels(0, 0, W, H, r.gl.RGBA, r.gl.UNSIGNED_BYTE, px);
    const out = document.createElement("canvas"); out.width = W; out.height = H;
    const g = out.getContext("2d"); const img = g.createImageData(W, H);
    for (let y = 0; y < H; y++) img.data.set(px.subarray((H - 1 - y) * W * 4, (H - y) * W * 4), y * W * 4);
    for (let i = 3; i < img.data.length; i += 4) img.data[i] = 255;
    g.putImageData(img, 0, 0);
    // cor média da borda (fundo CSS para o que a imagem não cobrir)
    let sr = 0, sg = 0, sb = 0, n = 0;
    const edge = (x, y) => { const i = (y * W + x) * 4; sr += img.data[i]; sg += img.data[i + 1]; sb += img.data[i + 2]; n++; };
    for (let x = 0; x < W; x += 8) { edge(x, 0); edge(x, H - 1); }
    for (let y = 0; y < H; y += 8) { edge(0, y); edge(W - 1, y); }
    r.destroy();
    resolve({ url: out.toDataURL(job.type, 0.9), edge: [sr / n, sg / n, sb / n].map(Math.round) });
  });
  r.invalidate();
});
</script>`,
};

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1900, height: 1600 } });
page.on("console", (m) => m.type() === "error" && console.error("console:", m.text()));
page.on("pageerror", (e) => console.error("pageerror:", e.message));
await page.route("http://scene.local/**", (route) => {
  const p = new URL(route.request().url()).pathname;
  const body = files[p];
  if (body == null) return route.fulfill({ status: 404, body: "" });
  return route.fulfill({ status: 200, contentType: p.endsWith(".html") ? "text/html" : "text/javascript", body });
});
await page.goto("http://scene.local/index.html");
await page.waitForFunction(() => typeof window.render === "function");

const save = async (job, name) => {
  const t0 = Date.now();
  const { url, edge } = await page.evaluate((j) => window.render(j), job);
  const out = new URL(name, root);
  writeFileSync(out, Buffer.from(url.split(",")[1], "base64"));
  const hex = "#" + edge.map((v) => v.toString(16).padStart(2, "0")).join("");
  console.log(`${name}: ${job.w}×${job.h}, ${(statSync(out).size / 1024).toFixed(0)} KB, borda ${hex}, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
};

// o mesmo enquadramento do CSS/config (SCENE_STILL)
const cfg = readFileSync(new URL("src/features/os/scene/scene.config.ts", root), "utf8");
const still = (k) => {
  const m = cfg.match(new RegExp(`${k}: \\{ w: (\\d+), h: (\\d+), cx: (\\d+), cy: (\\d+), r: (\\d+) \\}`));
  const [w, h, cx, cy, r] = m.slice(1).map(Number);
  return { w, h, cx, cy, r };
};

if (!review) {
  for (const world of ["tsukuyomi", "void"]) {
    for (const frame of ["desktop", "mobile"]) {
      await save({ ...still(frame), t: 0, from: world, to: null, type: "image/webp" }, `public/art/scene-${world}${frame === "mobile" ? "-mobile" : ""}.webp`);
    }
  }
} else {
  mkdirSync(new URL(".audit/scene-review/", root), { recursive: true });
  // desktop 1440 × 900: área de 864 px, palco centrado a 46 %, R = 0,6 × 864; controle de tema na dock (~934, 853 da tela)
  const D = { w: 1440, h: 864, cx: 720, cy: 397, r: 518, ox: 934, oy: 817 };
  // telefone 390 × 844: palco entre o status e a grade (centro ~297), R = 0,62 × 390; controle no fim da dock
  const M = { w: 390, h: 844, cx: 195, cy: 297, r: 242, ox: 336, oy: 790 };
  const only = opt("--only", "");
  for (const world of ["tsukuyomi", "void"]) {
    if (only && !only.split(",").includes(world)) continue;
    await save({ ...D, t: T, from: world, to: null, type: "image/png" }, `.audit/scene-review/${world}-desktop-t${T}.png`);
    await save({ ...M, t: T, from: world, to: null, type: "image/png" }, `.audit/scene-review/${world}-mobile-t${T}.png`);
  }
  if (!only || only.includes("trans")) {
    for (const [from, to] of [["tsukuyomi", "void"], ["void", "tsukuyomi"]]) {
      for (const p of (opt("--ps", "0.12,0.3,0.45,0.55,0.65,0.8,0.92")).split(",").map(Number)) {
        await save({ ...D, t: T + p * 2.2, from, to, p, type: "image/png" }, `.audit/scene-review/${from}-to-${to}-p${p}.png`);
      }
    }
  }
}
await browser.close();
