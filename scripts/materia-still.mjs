/**
 * Imagens estáticas da Matéria, tiradas da PRÓPRIA escultura (o mesmo motor e as mesmas moléculas):
 * public/art/materia-{dark,light}.webp (busto em repouso) e materia-brain-{dark,light}.webp (cérebro).
 * Valem na primeira pintura, com movimento reduzido e sem WebGL (styles/materia.css).
 *
 *   node scripts/materia-still.mjs [--base http://127.0.0.1:3100]
 *
 * Precisa do site rodando e de GPU real (ANGLE/D3D11). Fundo transparente; o tamanho e o ponto de
 * referência estão em features/os/materia/config.ts › MATERIA_STILL.
 */
import { writeFileSync } from "node:fs";
import { chromium } from "playwright";

const i = process.argv.indexOf("--base");
const BASE = (i > 0 ? process.argv[i + 1] : "http://127.0.0.1:3100").replace(/\/$/, "");

const browser = await chromium.launch({ args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${BASE}/en?scene-debug`, { waitUntil: "load" });
await page.waitForFunction(() => document.querySelector(".os-materia")?.dataset.state === "live" && window.__mwMateria, null, { timeout: 40000 });
for (const [name, mood, morph] of [["materia-dark", "dark", 0], ["materia-light", "light", 0], ["materia-brain-dark", "dark", 1], ["materia-brain-light", "light", 1]]) {
  const url = await page.evaluate(([m, k]) => window.__mwMateria.still(m, k), [mood, morph]);
  if (!url) throw new Error(`sem imagem para ${name}`);
  const out = `public/art/${name}.webp`;
  if (!url.startsWith("data:image/webp")) throw new Error("o navegador não codificou WebP");
  const bytes = Buffer.from(url.split(",")[1], "base64");
  writeFileSync(out, bytes);
  console.log(`${out} · ${(bytes.length / 1024).toFixed(0)} KB`);
}
await browser.close();
