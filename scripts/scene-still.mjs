/**
 * Imagens estáticas do fundo do MilWeb OS — geradas pelo MESMO motor do
 * canvas (features/os/scene: Three.js, as mesmas texturas assadas e os
 * mesmos materiais), no instante zero, sem paralaxe e sem grão: o canvas
 * entra por cima delas sem salto, e quem tem movimento reduzido, sem WebGL 2
 * ou com GPU por software vê o mesmo universo. Uma imagem por universo e por
 * enquadramento (o do telefone com a qualidade leve, como o canvas dele); o
 * CSS as posiciona pelo centro e raio do palco.
 *
 *   node scripts/scene-still.mjs                      → public/art/scene-{tsukuyomi,void}[-mobile].webp
 *   node scripts/scene-still.mjs --review [--t 12]    → quadros de revisão (PNG) em .audit/scene-review/:
 *        os dois universos no enquadramento do desktop (1440 × 864) e do telefone (390 × 844) e as duas
 *        travessias (escuro → claro, claro → escuro) em vários pontos do progresso (--ps 0.3,0.6)
 *
 * GPU por software (SwiftShader) de propósito: a saída não depende da máquina.
 * Rode de novo sempre que um material, as texturas assadas, a cena ou SCENE_STILL mudarem.
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
    .transpileModule(readFileSync(new URL(p, root), "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } })
    .outputText.replace(/from "\.\/([\w.-]+)"/g, 'from "./$1.js"');
const SCENE = ["engine", "bake", "composite", "glsl", "noise", "scene.config", "tsukuyomi", "void", "world"];
const files = Object.fromEntries(SCENE.map((m) => [`/${m}.js`, transpile(`src/features/os/scene/${m}.ts`)]));
files["/three.module.js"] = readFileSync(new URL("node_modules/three/build/three.module.js", root), "utf8");
files["/three.core.js"] = readFileSync(new URL("node_modules/three/build/three.core.js", root), "utf8");
// O motor anda no ticker do GSAP; um quadro parado não precisa dele.
files["/gsap-stub.js"] = `const tw = () => ({ kill() {}, play() {}, reverse() {} });
export const gsap = { to: tw, fromTo: tw, ticker: { add() {}, remove() {} } };`;
files["/index.html"] = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#000">
<script type="importmap">{ "imports": { "three": "/three.module.js", "@/animations/gsap": "/gsap-stub.js" } }</script>
<script type="module">
import { createEngine } from "./engine.js";
// job: { w, h, cx, cy, r, t, from, to, p, ox, oy, lite, type }   (px da imagem, y para baixo)
window.render = async (job) => {
  const c = document.createElement("canvas");
  document.body.replaceChildren(c);
  c.style.width = job.w + "px"; c.style.height = job.h + "px";
  const e = createEngine({ canvas: c, world: job.from, lite: !!job.lite, still: true });
  if (!e) throw new Error("sem WebGL 2");
  e.setStage({ x: job.cx, y: job.cy, r: job.r }, job.w, job.h);
  e.setDpr(1);
  await e.warm();
  e.still(job.from, { t: job.t, to: job.to ?? undefined, p: job.p, ox: job.ox, oy: job.oy });
  const url = c.toDataURL(job.type, 0.9);
  // cor média da borda (fundo CSS para o que a imagem não cobrir)
  const W = c.width, H = c.height;
  const k = document.createElement("canvas"); k.width = W; k.height = H;
  const g = k.getContext("2d", { willReadFrequently: true });
  g.drawImage(c, 0, 0);
  const d = g.getImageData(0, 0, W, H).data;
  let sr = 0, sg = 0, sb = 0, n = 0;
  const edge = (x, y) => { const i = (y * W + x) * 4; sr += d[i]; sg += d[i + 1]; sb += d[i + 2]; n++; };
  for (let x = 0; x < W; x += 8) { edge(x, 0); edge(x, H - 1); }
  for (let y = 0; y < H; y += 8) { edge(0, y); edge(W - 1, y); }
  e.dispose();
  return { url, edge: [sr / n, sg / n, sb / n].map(Math.round) };
};
</script>`;

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
      await save({ ...still(frame), t: 0, from: world, to: null, lite: frame === "mobile", type: "image/webp" }, `public/art/scene-${world}${frame === "mobile" ? "-mobile" : ""}.webp`);
    }
  }
} else {
  mkdirSync(new URL(".audit/scene-review/", root), { recursive: true });
  // desktop 1440 × 900: área de 864 px, palco centrado a 46 %, R = 0,6 × 864; controle de tema na dock (~934, 853 da tela)
  const D = { w: 1440, h: 864, cx: 720, cy: 397, r: 518, ox: 934, oy: 817 };
  // telefone 390 × 844: palco entre o status e a grade (centro ~297), R = 0,62 × 390; controle no fim da dock
  const M = { w: 390, h: 844, cx: 195, cy: 297, r: 242, ox: 336, oy: 790, lite: true };
  const only = opt("--only", "");
  for (const world of ["tsukuyomi", "void"]) {
    if (only && !only.split(",").includes(world)) continue;
    await save({ ...D, t: T, from: world, to: null, type: "image/png" }, `.audit/scene-review/${world}-desktop-t${T}.png`);
    await save({ ...M, t: T, from: world, to: null, type: "image/png" }, `.audit/scene-review/${world}-mobile-t${T}.png`);
  }
  if (!only || only.includes("trans")) {
    for (const [from, to] of [["tsukuyomi", "void"], ["void", "tsukuyomi"]]) {
      for (const p of opt("--ps", "0.12,0.3,0.45,0.55,0.65,0.8,0.92").split(",").map(Number)) {
        await save({ ...D, t: T + p * 2.2, from, to, p, type: "image/png" }, `.audit/scene-review/${from}-to-${to}-p${p}.png`);
      }
    }
  }
}
await browser.close();
