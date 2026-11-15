/**
 * Imagens estáticas do personagem do MilWeb OS — geradas pelo MESMO motor do canvas
 * (features/os/scene: Three.js, o mesmo GLB, as mesmas luzes), em repouso, no instante zero e com
 * fundo transparente: o CSS as desenha sobre o ambiente do tema (styles/os.css › .os-scene__still)
 * e o canvas entra por cima sem salto. É o que vê quem tem movimento reduzido, não tem WebGL 2,
 * usa GPU por software ou enquanto o modelo carrega.
 *
 *   node scripts/entity-still.mjs            → public/art/entity-{dark,light}.webp
 *   node scripts/entity-still.mjs --review   → .audit/entity/review/*.png (frente, com o ambiente, nos dois temas)
 *
 * GPU por software (SwiftShader) de propósito: a saída não depende da máquina.
 * Rode de novo sempre que o GLB, um material, as luzes ou SCENE_STILL mudarem.
 */
import { chromium } from "playwright";
import ts from "typescript";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const review = args.includes("--review");
const root = new URL("../", import.meta.url);

const transpile = (p) =>
  ts
    .transpileModule(readFileSync(new URL(p, root), "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } })
    .outputText.replace(/from "\.\/([\w.-]+)"/g, 'from "./$1.js"');
const SCENE = ["engine", "backdrop", "director", "entity", "rig", "scene.config"];
const files = Object.fromEntries(SCENE.map((m) => [`/${m}.js`, transpile(`src/features/os/scene/${m}.ts`)]));
// O motor anda no ticker do GSAP; um quadro parado não precisa dele.
files["/gsap-stub.js"] = `const tw = () => ({ kill() {}, play() {}, reverse() {} });
export const gsap = { to: tw, fromTo: tw, ticker: { add() {}, remove() {} } };`;
files["/index.html"] = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:transparent">
<script>window.process = { env: { NODE_ENV: "production" } }; // o motor lê process.env.NODE_ENV (o Next o embute no build)</script>
<script type="importmap">{ "imports": { "three": "/three/build/three.module.js", "three/examples/jsm/": "/three/examples/jsm/", "@/animations/gsap": "/gsap-stub.js" } }</script>
<script type="module">
import { createEngine } from "./engine.js";
// job: { w, h, cx, cy, k, mood, type, env }   (px da imagem, y para baixo)
window.render = async (job) => {
  const c = document.createElement("canvas");
  document.body.replaceChildren(c);
  c.style.width = job.w + "px"; c.style.height = job.h + "px";
  const e = createEngine({ canvas: c, mood: job.mood, lite: false, still: !job.env, resolve: () => null, onTouch() {} });
  if (!e) throw new Error("sem WebGL 2");
  e.setLayout({ w: job.w, h: job.h, k: job.k, home: { x: job.cx, y: job.cy }, present: null, bounds: { x0: 0, x1: job.w, y0: 0, y1: job.h } });
  e.setDpr(job.dpr ?? 1);
  if (!(await e.load("/models/entity.glb"))) throw new Error("o modelo não carregou");
  e.still(job.mood, { t: job.t ?? 0 });
  const url = c.toDataURL(job.type, 0.92);
  e.dispose();
  return url;
};
</script>`;

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
page.on("console", (m) => m.type() === "error" && console.error("console:", m.text()));
page.on("pageerror", (e) => console.error("pageerror:", e.message));
await page.route("http://scene.local/**", (route) => {
  const p = new URL(route.request().url()).pathname;
  if (files[p] != null) return route.fulfill({ status: 200, contentType: p.endsWith(".html") ? "text/html" : "text/javascript", body: files[p] });
  // three (módulo e exemplos) e o GLB vêm do disco
  const disk = p.startsWith("/three/") ? new URL(`node_modules${p}`, root) : p.startsWith("/models/") ? new URL(`public${p}`, root) : null;
  if (disk && existsSync(disk)) return route.fulfill({ status: 200, contentType: p.endsWith(".glb") ? "model/gltf-binary" : "text/javascript", body: readFileSync(disk) });
  return route.fulfill({ status: 404, body: "" });
});
await page.goto("http://scene.local/index.html");
await page.waitForFunction(() => typeof window.render === "function");

const save = async (job, name) => {
  const t0 = Date.now();
  const url = await page.evaluate((j) => window.render(j), job);
  const out = new URL(name, root);
  writeFileSync(out, Buffer.from(url.split(",")[1], "base64"));
  console.log(`${name}: ${job.w}×${job.h}, ${(statSync(out).size / 1024).toFixed(0)} KB, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
};

// o mesmo enquadramento do CSS/config (SCENE_STILL)
const cfg = readFileSync(new URL("src/features/os/scene/scene.config.ts", root), "utf8");
const m = cfg.match(/SCENE_STILL = \{ w: (\d+), h: (\d+), cx: (\d+), cy: (\d+), k: (\d+) \}/);
if (!m) throw new Error("SCENE_STILL não encontrado em scene.config.ts");
const [w, h, cx, cy, k] = m.slice(1).map(Number);

if (!review) {
  for (const mood of ["dark", "light"]) await save({ w, h, cx, cy, k, mood, type: "image/webp" }, `public/art/entity-${mood}.webp`);
} else {
  mkdirSync(new URL(".audit/entity/review/", root), { recursive: true });
  for (const mood of ["dark", "light"]) {
    await save({ w: 1100, h: 1240, cx: 550, cy: 640, k: 520, mood, type: "image/png", env: true }, `.audit/entity/review/${mood}-full.png`);
    await save({ w: 1100, h: 900, cx: 550, cy: 1300, k: 1100, mood, type: "image/png", env: true }, `.audit/entity/review/${mood}-bust.png`);
  }
}
await browser.close();
