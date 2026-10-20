/**
 * Capa de compartilhamento do site — public/og/cover-{pt,en,es}.jpg (1200×630).
 *
 * Renderiza um HTML com a identidade do MilWeb OS (carvão, pontilhado vermelho
 * discreto, Archivo + JetBrains Mono — as fontes do site, via Google Fonts —
 * janelas de sistema com as capturas REAIS de public/shots e o olho do Obito
 * como detalhe) no Chromium do Playwright e exporta JPEG otimizado. Textos e
 * projetos vêm de src/lib/share-cover.ts (a mesma fonte do metadata).
 *
 *   node scripts/og-cover.mjs [--preview]   → --preview também grava .audit/og/ com a capa
 *                                             em tamanho real (PNG) e a miniatura de 300 px
 *
 * Precisa de rede para as fontes do Google; sem rede o Chromium cai nas fontes
 * do sistema e a capa sai diferente — o script avisa.
 */
import { chromium } from "playwright";
import ts from "typescript";
import { mkdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const preview = process.argv.includes("--preview");
const mod = ts.transpileModule(readFileSync(new URL("src/lib/share-cover.ts", root), "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
const { SHARE_COVER } = await import("data:text/javascript;base64," + Buffer.from(mod).toString("base64"));

const data = (p, mime) => `data:${mime};base64,${readFileSync(new URL(p, root)).toString("base64")}`;
const shots = Object.fromEntries(SHARE_COVER.projects.map((p) => [p.slug, data("public" + p.shot, "image/webp")]));
const eye = data("public/art/eye-obito.webp", "image/webp");
const FONTS = "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=JetBrains+Mono:wght@400;700&display=block";

const html = (locale) => {
  const t = SHARE_COVER.text[locale];
  const [a, b] = SHARE_COVER.projects;
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${FONTS}" rel="stylesheet">
<style>
  :root { --bg: #0A0A0C; --fg: #F2F0EA; --red: #E63946; --disp: 'Archivo', system-ui, sans-serif; --mono: 'JetBrains Mono', ui-monospace, monospace; }
  html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: var(--bg); color: var(--fg); font-family: var(--disp); -webkit-font-smoothing: antialiased; }
  .cover { position: relative; width: 1200px; height: 630px; overflow: hidden;
    background:
      radial-gradient(58% 52% at 80% 46%, rgb(30 20 22) 0%, rgb(30 20 22 / 0) 100%),
      radial-gradient(46% 38% at 80% 48%, rgb(196 28 40 / .14), transparent 100%),
      radial-gradient(120% 90% at 50% 100%, rgb(0 0 0 / .35), transparent 60%),
      radial-gradient(circle at 1px 1px, rgb(196 28 40 / .14) 1px, transparent 1.5px) 0 0 / 24px 24px,
      var(--bg); }
  /* o olho do Obito como detalhe: atrás das janelas, no alto à direita, meio velado */
  .eye { position: absolute; left: 690px; top: -48px; width: 620px; height: 310px; background: url("${eye}") center / 100% 100% no-repeat; opacity: .62;
    -webkit-mask-image: radial-gradient(55% 55% at 50% 50%, #000 35%, transparent 75%); mask-image: radial-gradient(55% 55% at 50% 50%, #000 35%, transparent 75%); }
  .logo { position: absolute; left: 64px; top: 50px; display: flex; align-items: center; gap: 12px; font: 900 26px/1 var(--disp); font-variation-settings: 'wdth' 125; letter-spacing: -.02em; }
  .logo i { width: 8px; height: 8px; background: var(--red); }
  .tag { position: absolute; left: 64px; top: 86px; font: 400 12px/1 var(--mono); letter-spacing: .2em; text-transform: uppercase; color: rgb(242 240 234 / .5); }
  .name { position: absolute; left: 61px; top: 214px; font: 900 68px/1 var(--disp); font-variation-settings: 'wdth' 110; letter-spacing: -.035em; white-space: nowrap; }
  .role { position: absolute; left: 64px; top: 306px; display: flex; align-items: center; gap: 14px; font: 700 21px/1 var(--mono); letter-spacing: .12em; text-transform: uppercase; color: var(--red); white-space: nowrap; }
  .role i { width: 10px; height: 10px; background: var(--red); }
  .line { position: absolute; left: 64px; top: 356px; width: 470px; font: 400 27px/1.3 var(--disp); color: rgb(242 240 234 / .82); }
  .rule { position: absolute; left: 64px; bottom: 80px; width: 180px; height: 1px; background: rgb(230 57 70 / .7); }
  .foot { position: absolute; left: 64px; bottom: 46px; font: 400 15px/1 var(--mono); letter-spacing: .14em; color: rgb(242 240 234 / .55); }
  .foot b { font-weight: 400; color: rgb(242 240 234 / .9); }
  /* janelas do sistema com as capturas reais */
  .win { position: absolute; border-radius: 12px; overflow: hidden; background: #15131a; box-shadow: 0 34px 70px rgb(0 0 0 / .62), 0 0 0 1px rgb(242 240 234 / .13); }
  .win .bar { height: 32px; display: flex; align-items: center; gap: 6px; padding: 0 12px; background: #1c191f; border-bottom: 1px solid rgb(242 240 234 / .08); font: 400 11px/1 var(--mono); letter-spacing: .14em; text-transform: uppercase; color: rgb(242 240 234 / .62); white-space: nowrap; }
  .win .bar i { width: 9px; height: 9px; border-radius: 50%; } .r { background: #ff5f57; } .y { background: #febc2e; } .g { background: #28c840; }
  .win .bar span { margin-left: 10px; } .win .bar em { font-style: normal; color: rgb(242 240 234 / .38); margin-left: 8px; }
  .win img { display: block; width: 100%; height: calc(100% - 32px); object-fit: cover; object-position: top; }
  .w1 { left: 612px; top: 78px; width: 504px; height: 302px; }
  .w2 { left: 672px; top: 316px; width: 466px; height: 262px; }
</style></head><body><div class="cover">
  <div class="eye"></div>
  <div class="logo">MILWEB®<i></i></div>
  <div class="tag">${esc(t.tag)} · MW/OS</div>
  <div class="name">${esc(t.name)}</div>
  <div class="role"><i></i>${esc(t.role)}</div>
  <div class="line">${esc(t.line)}</div>
  <div class="win w1"><div class="bar"><i class="r"></i><i class="y"></i><i class="g"></i><span>${esc(a.label)}</span><em>${esc(a.kind)}</em></div><img src="${shots[a.slug]}" alt=""></div>
  <div class="win w2"><div class="bar"><i class="r"></i><i class="y"></i><i class="g"></i><span>${esc(b.label)}</span><em>${esc(b.kind)}</em></div><img src="${shots[b.slug]}" alt=""></div>
  <div class="rule"></div>
  <div class="foot"><b>milweb.com.br</b></div>
</div></body></html>`;
};

mkdirSync(new URL("public/og/", root), { recursive: true });
if (preview) mkdirSync(new URL(".audit/og/", root), { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: SHARE_COVER.width, height: SHARE_COVER.height }, deviceScaleFactor: 1 });
for (const locale of ["pt", "en", "es"]) {
  await page.setContent(html(locale), { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const ok = await page.evaluate(() => document.fonts.check("900 26px Archivo") && document.fonts.check("400 12px 'JetBrains Mono'"));
  if (!ok) console.warn(`aviso: fontes do Google indisponíveis (${locale}) — a capa saiu com fontes do sistema`);
  await page.waitForTimeout(150);
  const out = fileURLToPath(new URL(`public/og/cover-${locale}.jpg`, root));
  await page.screenshot({ path: out, type: "jpeg", quality: 86 });
  console.log(`public/og/cover-${locale}.jpg · ${(statSync(out).size / 1024).toFixed(0)} KB`);
  if (preview) {
    await page.screenshot({ path: fileURLToPath(new URL(`.audit/og/cover-${locale}.png`, root)), type: "png" });
    // miniatura de 300 px (como aparece numa lista do LinkedIn/WhatsApp)
    const thumb = await browser.newPage({ viewport: { width: 300, height: 158 }, deviceScaleFactor: 2 });
    await thumb.setContent(`<body style="margin:0;background:#222"><img src="data:image/jpeg;base64,${readFileSync(out).toString("base64")}" style="width:300px;height:158px;display:block"></body>`);
    await thumb.waitForTimeout(300);
    await thumb.screenshot({ path: fileURLToPath(new URL(`.audit/og/cover-${locale}-thumb.png`, root)) });
    await thumb.close();
  }
}
await browser.close();
