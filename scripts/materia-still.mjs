/**
 * Imagens estáticas da Matéria, tiradas da PRÓPRIA cena (o mesmo motor, a mesma malha e as mesmas moléculas):
 * public/art/materia-home-{dark,light}.webp (a home: a figura segurando a dobra aberta, sobre a página lisa na
 * cor do tema) e materia-brain-{dark,light}.webp (o cérebro, sobre transparente).
 * Valem na primeira pintura, com movimento reduzido e sem WebGL (styles/materia.css).
 *
 *   node scripts/materia-still.mjs [--base http://127.0.0.1:3100]
 *
 * Precisa do site rodando e de GPU real (ANGLE/D3D11). Tamanhos e pontos de referência:
 * features/os/materia/config.ts › HERO_STILL e MATERIA_STILL. A home sai em português ("mundo" no reflexo).
 */
import { writeFileSync } from "node:fs";
import { chromium } from "playwright";

const i = process.argv.indexOf("--base");
const BASE = (i > 0 ? process.argv[i + 1] : "http://127.0.0.1:3100").replace(/\/$/, "");

const browser = await chromium.launch({ args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, locale: "pt-BR" });
await page.goto(`${BASE}/?scene-debug`, { waitUntil: "load" });
await page.waitForFunction(() => document.querySelector(".os-materia")?.dataset.state === "live" && window.__mwMateria, null, { timeout: 60000 });
// a capa do projeto e o lema precisam estar prontos: são parte da imagem
await page.waitForFunction(() => window.__mwMateria.state.cover && window.__mwMateria.state.word, null, { timeout: 20000 });
for (const [name, mood, kind] of [["materia-home-dark", "dark", "home"], ["materia-home-light", "light", "home"], ["materia-brain-dark", "dark", "brain"], ["materia-brain-light", "light", "brain"]]) {
  const url = await page.evaluate(([m, k]) => window.__mwMateria.still(m, k), [mood, kind]);
  if (!url) throw new Error(`sem imagem para ${name}`);
  const out = `public/art/${name}.webp`;
  if (!url.startsWith("data:image/webp")) throw new Error("o navegador não codificou WebP");
  const bytes = Buffer.from(url.split(",")[1], "base64");
  writeFileSync(out, bytes);
  console.log(`${out} · ${(bytes.length / 1024).toFixed(0)} KB`);
}
await browser.close();
