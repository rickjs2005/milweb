/**
 * Gera public/og/<slug>.png (720×450) a partir do frame real de cada
 * projeto (WebP) — o gerador de OG (Satori) não lê WebP. Roda com o
 * Edge/Chrome instalado via puppeteer-core; não depende de sharp.
 * A origem entra como data: URL (página about:blank não carrega file://).
 *
 *   node scripts/og-assets.mjs
 */
import puppeteer from "puppeteer-core";
import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const EXE = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(existsSync);
const OUT = join(process.cwd(), "public", "og");
mkdirSync(OUT, { recursive: true });

const shots = readdirSync(join(process.cwd(), "public", "shots")).filter((f) => /\.(webp|jpg|png)$/.test(f));
const browser = await puppeteer.launch({ executablePath: EXE, headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 720, height: 450, deviceScaleFactor: 1 });
for (const f of shots) {
  const slug = f.replace(/\.(webp|jpg|png)$/, "");
  const ext = f.endsWith(".jpg") ? "jpeg" : f.split(".").pop();
  const src = `data:image/${ext};base64,${readFileSync(join(process.cwd(), "public", "shots", f)).toString("base64")}`;
  await page.setContent(`<html><body style="margin:0;background:#DAD8D1"><img id="i" style="width:720px;height:450px;object-fit:cover;object-position:top;display:block"></body></html>`);
  await page.evaluate((s) => new Promise((r) => { const i = document.getElementById("i"); i.onload = r; i.onerror = r; i.src = s; }), src);
  await page.screenshot({ path: join(OUT, `${slug}.png`), type: "png" });
  console.log("og", slug);
}
await browser.close();
