/**
 * Imagens estáticas da Matéria, tiradas da PRÓPRIA cena (o mesmo motor, as mesmas esculturas e moléculas):
 *
 *   public/art/materia-home-{dark,light}.webp      a escultura em repouso no ateliê, sobre a parede na cor do tema
 *   public/art/materia-home-{dark,light}-s.webp    a mesma, na metade do tamanho (telefone)
 *   public/art/materia-brain-{dark,light}.webp     o cérebro da conversa, sobre transparente
 *
 * Valem na primeira pintura, com movimento reduzido e sem WebGL (styles/materia.css).
 *
 *   node scripts/materia-still.mjs [--base http://127.0.0.1:3100] [--figures pasta] [--silhouettes pasta]
 *
 * `--figures`: grava também o instante decisivo do gesto de cada uma das seis figuras (nos dois temas), no mesmo
 * enquadramento, para comparar. `--silhouettes`: a prova de leitura — as sete poses em preto, do mesmo tamanho,
 * sem texto. Precisa do site rodando e de GPU real (ANGLE/D3D11). Tamanhos e pontos de referência:
 * features/os/materia/config.ts › HERO_STILL e MATERIA_STILL.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const opt = (k) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : null);
const BASE = (opt("--base") ?? "http://127.0.0.1:3100").replace(/\/$/, "");
const FIGURES = opt("--figures");
const SILHOUETTES = opt("--silhouettes");
const IDS = ["projects", "profile", "services", "studio", "lab", "contact"];

const browser = await chromium.launch({ args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, locale: "pt-BR" });
page.on("pageerror", (e) => console.log("[pageerror]", e.message.slice(0, 300)));
await page.goto(`${BASE}/?scene-debug`, { waitUntil: "load" });
await page.waitForFunction(() => document.querySelector(".os-materia")?.dataset.state === "live" && window.__mwMateria, null, { timeout: 60000 });
const shot = async (mood, kind) => {
  const url = await page.evaluate(([m, k]) => window.__mwMateria.still(m, k), [mood, kind]);
  if (!url) throw new Error(`sem imagem para ${kind} (${mood})`);
  if (!url.startsWith("data:image/webp")) throw new Error("o navegador não codificou WebP");
  return url;
};
const save = (out, url) => {
  const bytes = Buffer.from(url.split(",")[1], "base64");
  writeFileSync(out, bytes);
  console.log(`${out} · ${(bytes.length / 1024).toFixed(0)} KB`);
};
/** A mesma imagem na metade do tamanho (recodificada pelo navegador). */
const half = (url) =>
  page.evaluate(async (src) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth / 2);
    c.height = Math.round(img.naturalHeight / 2);
    const g = c.getContext("2d");
    g.imageSmoothingQuality = "high";
    g.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/webp", 0.9);
  }, url);

for (const mood of ["dark", "light"]) {
  const home = await shot(mood, "home");
  save(`public/art/materia-home-${mood}.webp`, home);
  save(`public/art/materia-home-${mood}-s.webp`, await half(home));
  save(`public/art/materia-brain-${mood}.webp`, await shot(mood, "brain"));
}
if (FIGURES) {
  mkdirSync(FIGURES, { recursive: true });
  for (const mood of ["dark", "light"]) for (const id of IDS) save(join(FIGURES, `figura-${id}-${mood}.webp`), await shot(mood, id));
}
if (SILHOUETTES) {
  mkdirSync(SILHOUETTES, { recursive: true });
  // do próprio motor: a pedra em preto sobre branco, sem ateliê, sem grãos e sem texto; recortada no quadro da figura
  for (const id of ["home", ...IDS]) {
    const url = await page.evaluate(async (kind) => {
      const src = await window.__mwMateria.still("light", kind, { silhouette: true });
      if (!src) return null;
      const img = new Image();
      img.src = src;
      await img.decode();
      const W = 900;
      const H = 1100;
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      const g = c.getContext("2d");
      g.fillStyle = "#fff";
      g.fillRect(0, 0, W, H);
      // o quadro da figura: 1000 px de altura em volta do centro (1050, 625) da imagem estática, com uma margem
      const fh = 1100;
      g.drawImage(img, 1050 - (W / H) * fh / 2, 625 - fh / 2, (W / H) * fh, fh, 0, 0, W, H);
      return c.toDataURL("image/png");
    }, id);
    if (!url) throw new Error(`sem silhueta para ${id}`);
    const bytes = Buffer.from(url.split(",")[1], "base64");
    writeFileSync(join(SILHOUETTES, `silhueta-${id === "home" ? "repouso" : id}.png`), bytes);
    console.log(`silhueta ${id} · ${(bytes.length / 1024).toFixed(0)} KB`);
  }
}
await browser.close();
