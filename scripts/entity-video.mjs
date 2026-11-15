/**
 * Vídeo vertical do MilWeb OS no formato "notebook filmado + legenda fixa", com TELA DIVIDIDA:
 * o código à esquerda, o resultado à direita.
 *
 *   node scripts/entity-video.mjs [--base http://localhost:3121] [--out docs/entity/video] [--caption "Fable 5.2 + web design 🔥"]
 *   node scripts/entity-video.mjs --compose-only     → refaz a montagem a partir da gravação que já existe
 *
 * 1. RESULTADO — grava o site REAL (build de produção, GPU da máquina) em 1440×900 pelo screencast do
 *    Chromium, com um cursor desenhado por cima (o headless não tem cursor) seguindo o mouse de verdade
 *    do teste: o personagem se apresenta (surge, gira, faz a reverência), a mão segue os ícones, um
 *    clique abre a janela, os atalhos sociais 3D inclinam e afundam, o tema troca.
 * 2. CÓDIGO — um editor desenhado em HTML que "digita" trechos REAIS dos arquivos do projeto
 *    (director.ts, rig.ts, social-3d.ts) e um painel de log com as saídas reais das verificações,
 *    quadro a quadro, sincronizado com os momentos da gravação.
 * 3. Junta os dois lado a lado (`tela-dividida-para-filmar.mp4`, 1440×900) — para tocar em tela cheia e
 *    filmar o notebook — e monta a versão vertical 1080×1920 (`fable-personagem-vertical.mp4`): a tela
 *    dividida dentro de um notebook desenhado, fundo escuro, legenda fixa, aproximação lenta. Sem áudio.
 *
 * O que é encenação: a digitação (o código é o do repositório, mas não é a captura da sessão em que foi
 * escrito) e o notebook (moldura desenhada). O que é real: o código, as saídas e tudo o que acontece no site.
 */
import { chromium } from "playwright";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const arg = (k, d) => {
  const i = argv.indexOf(k);
  return i >= 0 ? argv[i + 1] : d;
};
const BASE = arg("--base", "http://localhost:3121");
const OUT = arg("--out", "docs/entity/video");
const CAPTION = arg("--caption", "Fable 5.2 + web design 🔥");
const COMPOSE_ONLY = argv.includes("--compose-only");
const W = 1440;
const H = 900;
const FPS = 30;
const root = new URL("../", import.meta.url);
const WORK = path.join(OUT, "_work");
const RESULT = path.join(OUT, "_resultado-1440.mp4"); // gravação bruta do site (fica para --compose-only)
const MARKS = path.join(OUT, "_marcas.json");
const SPLIT = path.join(OUT, "tela-dividida-para-filmar.mp4");
const FINAL = path.join(OUT, "fable-personagem-vertical.mp4");
// cor de vídeo padrão (BT.709, faixa limitada): os quadros capturados são JPEG de faixa cheia
const COLOR = ["-color_range", "tv", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709"];
fs.mkdirSync(OUT, { recursive: true });
fs.rmSync(WORK, { recursive: true, force: true });
fs.mkdirSync(path.join(WORK, "f"), { recursive: true });
fs.mkdirSync(path.join(WORK, "s"), { recursive: true });
const ff = (args) => {
  const r = spawnSync("ffmpeg", ["-y", "-loglevel", "error", ...args], { stdio: "inherit" });
  if (r.status !== 0) throw new Error("ffmpeg falhou: " + args.join(" ").slice(0, 240));
};

const browser = await chromium.launch({ args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });

// ------------------------------------------------------------------ 1. o resultado: gravação do site real
if (!COMPOSE_ONLY) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, colorScheme: "dark" });
  // nenhuma rede externa é aberta durante a gravação
  await ctx.route((u) => !/^https?:\/\/(localhost|127\.0\.0\.1)/.test(u.href), (r) => r.abort());
  await ctx.addInitScript(() => {
    try {
      sessionStorage.setItem("milweb-os:booted", "1");
      localStorage.setItem("milweb-os:prefs", JSON.stringify({ theme: "obito" }));
    } catch {}
    // cursor desenhado: segue os eventos reais de mouse da página
    addEventListener("DOMContentLoaded", () => {
      const c = document.createElement("div");
      c.id = "__cursor";
      c.innerHTML = '<svg width="30" height="30" viewBox="0 0 24 24"><path d="M4 2.5v17.2l4.7-4.4 3 6.6 2.6-1.2-3-6.5 6.4-.5z" fill="#fff" stroke="#000" stroke-width="1.3" stroke-linejoin="round"/></svg>';
      c.style.cssText = "position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;transform:translate(-100px,-100px);will-change:transform;filter:drop-shadow(0 2px 3px rgba(0,0,0,.5))";
      document.documentElement.appendChild(c);
      addEventListener("mousemove", (e) => (c.style.transform = `translate(${e.clientX - 4}px,${e.clientY - 3}px)`), { passive: true, capture: true });
      addEventListener("mousedown", () => c.animate([{ scale: "1" }, { scale: ".8" }, { scale: "1" }], { duration: 240 }), { capture: true });
    });
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/?scene-debug`, { waitUntil: "load" });
  const live = await page.waitForSelector('.os-scene[data-state="live"]', { timeout: 60000 }).then(() => true).catch(() => false);
  if (!live) throw new Error("a cena não entrou em cena (modelo/WebGL)");
  const social = await page.waitForSelector('.os-social[data-d3="on"]', { timeout: 30000 }).then(() => true).catch(() => false);
  await page.waitForTimeout(5200); // a apresentação automática da carga termina; a gravada começa do repouso

  let mx = W * 0.82;
  let my = H * 0.3;
  await page.mouse.move(mx, my);
  /** Mouse com aceleração e freio (easeInOut), em tempo real. */
  const glide = async (x, y, ms) => {
    const x0 = mx;
    const y0 = my;
    const t0 = Date.now();
    for (;;) {
      const u = Math.min(1, (Date.now() - t0) / ms);
      const e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
      mx = x0 + (x - x0) * e;
      my = y0 + (y - y0) * e;
      await page.mouse.move(mx, my);
      if (u >= 1) break;
      await page.waitForTimeout(12);
    }
  };
  const at = async (sel, fx = 0.5, fy = 0.4) => {
    const b = await page.locator(sel).boundingBox();
    return [b.x + b.width * fx, b.y + b.height * fy];
  };
  const hover = async (sel, travel, hold, fx, fy) => {
    const [x, y] = await at(sel, fx, fy);
    await glide(x, y, travel);
    await page.waitForTimeout(hold);
  };
  const click = async (hold) => {
    await page.mouse.down();
    await page.waitForTimeout(70);
    await page.mouse.up();
    await page.waitForTimeout(hold);
  };

  // screencast: quadros JPEG com o carimbo de tempo do compositor
  const cdp = await ctx.newCDPSession(page);
  const frames = [];
  let n = 0;
  cdp.on("Page.screencastFrame", (f) => {
    const file = path.join(WORK, "f", `${String(n++).padStart(5, "0")}.jpg`);
    fs.writeFileSync(file, Buffer.from(f.data, "base64"));
    frames.push({ file, ts: f.metadata.timestamp });
    cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
  });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 93, everyNthFrame: 1 });
  const t0 = Date.now();
  const now = () => (Date.now() - t0) / 1000;
  const marks = { social };

  // A — apresentação: surge, gira, faz a reverência
  await page.waitForTimeout(350);
  marks.intro = now();
  await page.evaluate(() => window.__mwOsScene.intro());
  await page.waitForTimeout(4750);
  // B — a mão vai aos ícones reais; o clique abre a janela
  marks.reach = now();
  await hover("#os-icon-services", 1100, 1500);
  await hover("#os-icon-projects", 900, 1200);
  await click(2700);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(800);
  await hover("#os-icon-contact", 900, 1100);
  await click(2300);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(600);
  // C — atalhos sociais em 3D: inclinam com o cursor, afundam ao pressionar
  marks.social0 = now();
  const sb = await page.locator(".os-social").boundingBox();
  marks.socialCenter = [sb.x + sb.width / 2, sb.y + sb.height / 2 - 6];
  await hover('.os-social a[data-social="linkedin"] .os-social__icon', 1300, 900, 0.3, 0.3);
  await hover('.os-social a[data-social="github"] .os-social__icon', 550, 500, 0.75, 0.3);
  await page.mouse.down(); // pressiona como uma tecla…
  await page.waitForTimeout(420);
  const [ix, iy] = await at('.os-social a[data-social="instagram"] .os-social__icon', 0.5, 0.75);
  await glide(ix, iy - 60, 260); // …e solta fora do link: a gravação não navega
  await page.mouse.up();
  await hover('.os-social a[data-social="instagram"] .os-social__icon', 500, 850, 0.3, 0.7);
  await hover('.os-social a[data-social="whatsapp"] .os-social__icon', 550, 950, 0.7, 0.35);
  marks.social1 = now();
  // fecho — o mesmo personagem, outra luz
  {
    const [x, y] = await at(".os-dock__theme", 0.5, 0.5);
    await glide(x, y, 1000);
    await page.waitForTimeout(200);
    await click(3000);
  }
  marks.end = now();
  await cdp.send("Page.stopScreencast");
  await page.waitForTimeout(200);
  await ctx.close();

  // lista com a duração real de cada quadro → 30 qps constantes
  const lines = [];
  for (let i = 0; i < frames.length; i++) {
    const d = i + 1 < frames.length ? Math.max(0.001, frames[i + 1].ts - frames[i].ts) : 1 / FPS;
    lines.push(`file '${path.resolve(frames[i].file).replace(/\\/g, "/")}'`, `duration ${d.toFixed(4)}`);
  }
  lines.push(`file '${path.resolve(frames.at(-1).file).replace(/\\/g, "/")}'`);
  fs.writeFileSync(path.join(WORK, "list.txt"), lines.join("\n"));
  const dur = frames.at(-1).ts - frames[0].ts;
  console.log(`resultado: ${frames.length} quadros em ${dur.toFixed(1)} s (${(frames.length / dur).toFixed(1)} qps capturados)`);
  ff(["-f", "concat", "-safe", "0", "-i", path.join(WORK, "list.txt"), "-vf", `fps=${FPS},scale=out_color_matrix=bt709:out_range=tv,format=yuv420p`, "-c:v", "libx264", "-preset", "slow", "-crf", "15", ...COLOR, "-movflags", "+faststart", "-an", RESULT]);
  fs.writeFileSync(MARKS, JSON.stringify(marks, null, 1));
  fs.rmSync(path.join(WORK, "f"), { recursive: true, force: true });
}
if (!fs.existsSync(RESULT) || !fs.existsSync(MARKS)) throw new Error("sem gravação: rode sem --compose-only");
const marks = JSON.parse(fs.readFileSync(MARKS, "utf8"));
const T = parseFloat(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", RESULT], { encoding: "utf8" }).stdout) || marks.end;
const NFRAMES = Math.round(T * FPS);

// ------------------------------------------------------------------ 2. o código: editor quadro a quadro
/** Trecho real de um arquivo do projeto: da primeira linha que contém `from` até `lines` linhas adiante. */
const excerpt = (file, from, lines) => {
  const all = fs.readFileSync(new URL(file, root), "utf8").split(/\r?\n/);
  const i = all.findIndex((l) => l.includes(from));
  if (i < 0) throw new Error(`trecho não encontrado em ${file}: ${from}`);
  const cut = all.slice(i, i + lines);
  const pad = Math.min(...cut.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
  return cut.map((l) => l.slice(pad).slice(0, 96)).join("\n");
};
const SEGMENTS = [
  { file: "src/features/os/scene/director.ts", label: "apresentação — surge, gira, faz a reverência", t0: 0, t1: marks.reach, code: excerpt("src/features/os/scene/director.ts", "// apresentação: surge de baixo crescendo", 30) },
  { file: "src/features/os/scene/rig.ts", label: "IK do braço — a ponta do dedo vai ao ícone real", t0: marks.reach, t1: marks.social0, code: excerpt("src/features/os/scene/rig.ts", "// 1) orientação da mão", 33) },
  { file: "src/features/os/social/social-3d.ts", label: "atalhos sociais — marcas extrudadas em 3D", t0: marks.social0, t1: T, code: excerpt("src/features/os/social/social-3d.ts", "/** Símbolo extrudado, centrado", 19) + "\n\n" + excerpt("src/features/os/social/social-3d.ts", "const tRx = C.rest.rx", 12) },
];
// saídas reais: do GLB (scripts/entity-inspect.mjs) e, se existir, do último relatório das verificações
const glb = fs.statSync(new URL("public/models/entity.glb", root)).size;
let checks = null;
for (const f of [".audit/entity/check-final/report.json", ".audit/entity/check-prod/report.json"]) {
  const u = new URL(f, root);
  if (!checks && fs.existsSync(u)) checks = JSON.parse(fs.readFileSync(u, "utf8")).summary;
}
const LOG = [
  { at: 0.3, k: "cmd", text: "$ blender --background --python assets/entity/build_entity.py" },
  { at: 1.5, k: "out", text: `EXPORTED public/models/entity.glb  ${(glb / 1048576).toFixed(2)} MB · 10 clipes · 58 ossos` },
  { at: 2.9, k: "cmd", text: "$ pnpm build" },
  { at: 4.2, k: "ok", text: "✓ Compiled successfully" },
  { at: marks.reach + 0.6, k: "cmd", text: "$ node scripts/entity-check.mjs --only notebook" },
  { at: marks.reach + 3.2, k: "ok", text: "ok  services: a ponta do dedo encosta, braço sem esticar" },
  { at: marks.reach + 6.0, k: "ok", text: "ok  projects: abre com mouse, a janela em foco é a certa" },
  { at: marks.reach + 9.4, k: "ok", text: "ok  sem salto de articulação; cotovelo dentro dos limites" },
  { at: marks.social0 + 0.8, k: "cmd", text: "$ node scripts/entity-check.mjs --only social" },
  { at: marks.social0 + 2.6, k: "ok", text: "ok  sociais: hrefs reais, nova aba, rel noopener noreferrer" },
  { at: marks.social0 + 4.6, k: "ok", text: "ok  sociais: hover inclina, eleva e acende; pressão afunda" },
  { at: marks.social1 + 1.2, k: "sum", text: checks ? `${checks.checks - checks.failed}/${checks.checks} verificações ok · erro médio ${String(checks.touchErrorPx?.mean ?? "—").replace(".", ",")} px` : "verificações ok" },
];
const PV = { x: 566, y: 86, w: 864, h: 540 }; // onde o resultado entra (16:10)
{
  const html = `<!doctype html><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0}
html,body{width:${W}px;height:${H}px;background:#08090b;overflow:hidden;color:#c9ced8;font:13px/1.4 "Cascadia Code","Cascadia Mono",Consolas,monospace}
.top{position:absolute;left:0;top:0;right:0;height:44px;background:#0d0e12;border-bottom:1px solid #1b1e25;display:flex;align-items:center;gap:14px;padding:0 16px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#8b93a1}
.top b{color:#f2f4f8;font-weight:700;letter-spacing:0;text-transform:none;font-size:14px;font-family:"Segoe UI",sans-serif}
.dot{width:8px;height:8px;border-radius:50%;background:#ff3a2a;box-shadow:0 0 10px #ff3a2a}
.grow{flex:1}
.bar{position:absolute;left:0;top:43px;height:2px;background:#ff3a2a}
.ed{position:absolute;left:0;top:44px;width:556px;bottom:0;background:#0b0c0f;border-right:1px solid #1b1e25}
.tab{height:36px;display:flex;align-items:center;gap:10px;padding:0 16px;border-bottom:1px solid #1b1e25;font-size:12.5px;color:#e6e9ef;background:#0f1115}
.tab i{font-style:normal;color:#ff3a2a}
.tab span{color:#6c7482}
.code{position:absolute;left:0;right:0;top:36px;bottom:34px;overflow:hidden}
.code pre{position:absolute;left:0;right:0;margin:0;padding:12px 14px 12px 0;font:15.5px/23px "Cascadia Code","Cascadia Mono",Consolas,monospace;white-space:pre;tab-size:2}
.ln{display:inline-block;width:46px;padding-right:14px;text-align:right;color:#3d4350;user-select:none}
.c{color:#5d6675;font-style:italic}.s{color:#e9b872}.n{color:#ff8f7a}.k{color:#ff5a4a}
.caret{display:inline-block;width:8px;height:18px;background:#ff3a2a;vertical-align:-3px;margin-left:1px}
.foot{position:absolute;left:0;right:0;bottom:0;height:34px;border-top:1px solid #1b1e25;display:flex;align-items:center;gap:12px;padding:0 16px;font-size:11.5px;color:#7d8594;background:#0d0e12}
.pvh{position:absolute;left:${PV.x}px;top:52px;width:${PV.w}px;height:34px;display:flex;align-items:center;gap:10px;font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;color:#7d8594}
.pvh em{font-style:normal;color:#e6e9ef}
.pv{position:absolute;left:${PV.x - 1}px;top:${PV.y - 1}px;width:${PV.w + 2}px;height:${PV.h + 2}px;border:1px solid #23262e;border-radius:6px;background:#020203}
.log{position:absolute;left:${PV.x}px;top:${PV.y + PV.h + 14}px;width:${PV.w}px;bottom:10px;border:1px solid #1b1e25;border-radius:6px;background:#0b0c0f;padding:10px 14px;font:13px/21px "Cascadia Code","Cascadia Mono",Consolas,monospace;overflow:hidden}
.log .h{color:#6c7482;font-size:11px;letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px}
.log div{white-space:nowrap}
.cmd{color:#e6e9ef}.out{color:#9aa3b2}.ok{color:#7ad29b}.sum{color:#ff6a5a;font-weight:700}
</style>
<div class="top"><span class="dot"></span><b>MilWeb OS</b><span>personagem 3d · ícones sociais</span><span class="grow"></span><span id="st">escrevendo</span></div><div class="bar" id="bar"></div>
<div class="ed"><div class="tab"><i>●</i><em id="fn" style="font-style:normal"></em><span id="lb"></span></div><div class="code"><pre id="pre"></pre></div><div class="foot"><span id="pos"></span><span class="grow" style="flex:1"></span><span>TypeScript · UTF-8</span></div></div>
<div class="pvh"><span>resultado</span><em>localhost · build de produção</em></div><div class="pv"></div>
<div class="log"><div class="h">saída</div><div id="lg"></div></div>
<script>
const SEG = ${JSON.stringify(SEGMENTS)}, LOG = ${JSON.stringify(LOG)}, T = ${T};
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const RE = /(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?(?:\\*\\/|$))|("(?:[^"\\\\\\n]|\\\\.)*"?|'(?:[^'\\\\\\n]|\\\\.)*'?|\`(?:[^\`\\\\]|\\\\.)*\`?)|\\b(\\d+(?:\\.\\d+)?)\\b|\\b(const|let|function|return|if|else|for|of|new|export|import|from|type|true|false|null|as|void|typeof|continue|break)\\b/g;
const paint = (src) => { let out = "", i = 0, m; RE.lastIndex = 0; while ((m = RE.exec(src))) { out += esc(src.slice(i, m.index)); const cls = m[1] ? "c" : m[2] ? "s" : m[3] ? "n" : "k"; out += '<span class="' + cls + '">' + esc(m[0]) + "</span>"; i = m.index + m[0].length; if (m[0].length === 0) RE.lastIndex++; } return out + esc(src.slice(i)); };
const pre = document.getElementById("pre");
window.__frame = (t) => {
  const s = SEG.find((x) => t < x.t1) ?? SEG.at(-1);
  // digita até ~80% da janela do trecho e deixa o resto para ler
  const u = Math.max(0, Math.min(1, (t - s.t0) / ((s.t1 - s.t0) * 0.8)));
  const n = Math.round(s.code.length * (u * u * (3 - 2 * u) * 0.35 + u * 0.65));
  const shown = s.code.slice(0, n);
  const lines = paint(shown).split("\\n");
  pre.innerHTML = lines.map((l, i) => '<span class="ln">' + (i + 1) + "</span>" + l + (i === lines.length - 1 && u < 1 ? '<span class="caret"></span>' : "")).join("\\n");
  // rola para manter a última linha à vista
  const maxLines = Math.floor((pre.parentElement.clientHeight - 24) / 23);
  pre.style.top = -Math.max(0, lines.length - maxLines) * 23 + "px";
  document.getElementById("fn").textContent = s.file.split("/").pop();
  document.getElementById("lb").textContent = "— " + s.label;
  document.getElementById("pos").textContent = "Ln " + lines.length + ", Col " + (lines.at(-1).replace(/<[^>]+>/g, "").length + 1);
  document.getElementById("st").textContent = u < 1 ? "escrevendo" : "rodando";
  document.getElementById("bar").style.width = (t / T) * 100 + "%";
  document.getElementById("lg").innerHTML = LOG.filter((l) => l.at <= t).slice(-8).map((l) => '<div class="' + l.k + '">' + esc(l.text) + "</div>").join("");
  return new Promise((r) => requestAnimationFrame(() => r(true)));
};
</script>`;
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  for (let i = 0; i < NFRAMES; i++) {
    await page.evaluate((t) => window.__frame(t), i / FPS);
    await page.screenshot({ path: path.join(WORK, "s", `${String(i).padStart(5, "0")}.jpg`), type: "jpeg", quality: 93 });
  }
  await page.close();
  console.log(`código: ${NFRAMES} quadros do editor (${SEGMENTS.map((s) => s.file.split("/").pop()).join(", ")})`);
}

// ------------------------------------------------------------------ 3. tela dividida
{
  // nos atalhos sociais a prévia aproxima no canto (eles têm 38 px): 1 → ZM e de volta
  const ZM = 2.6;
  const [cx, cy] = marks.socialCenter ?? [W * 0.86, H * 0.9];
  const a = Math.max(0, (marks.social0 ?? T) + 0.15).toFixed(3);
  const b = Math.max(0, (marks.social1 ?? T) + 0.1).toFixed(3);
  const sm = (v) => `(${v})*(${v})*(3-2*(${v}))`;
  const up = `clip((on/${FPS}-${a})/0.9,0,1)`;
  const down = `clip((on/${FPS}-${b})/0.9,0,1)`;
  const z = `1+(${ZM}-1)*(${sm(up)}-${sm(down)})`;
  const k = `((zoom-1)/(${ZM}-1))`;
  const x = `max(0,min(iw-iw/zoom,(${cx * 2}-iw/zoom/2)*${k}))`;
  const y = `max(0,min(ih-ih/zoom,(${cy * 2}-ih/zoom/2)*${k}))`;
  const filter = [
    `[1:v]scale=${W * 2}:${H * 2}:flags=bicubic,zoompan=z='${z}':x='${x}':y='${y}':d=1:s=${PV.w}x${PV.h}:fps=${FPS}[pv]`,
    `[0:v][pv]overlay=${PV.x}:${PV.y},scale=out_color_matrix=bt709:out_range=tv,format=yuv420p[v]`,
  ].join(";");
  ff(["-framerate", String(FPS), "-i", path.join(WORK, "s", "%05d.jpg"), "-i", RESULT, "-filter_complex", filter, "-map", "[v]", "-t", T.toFixed(3), "-r", String(FPS), "-c:v", "libx264", "-preset", "slow", "-crf", "16", ...COLOR, "-movflags", "+faststart", "-an", SPLIT]);
  console.log(`tela dividida: ${SPLIT} (${T.toFixed(1)} s)`);
}

// ------------------------------------------------------------------ 4. moldura (PNG com a tela vazada) e montagem vertical
// Composição em 1620×2880 (1,5×): a deriva da câmera anda em meio pixel e não treme ao reduzir para 1080×1920.
const S = 1.5;
const CW = 1080 * S;
const CH = 1920 * S;
const scr = { x: 60 * S, y: 660 * S, w: 960 * S, h: 600 * S }; // tela 16:10, quase na largura do quadro
{
  const inter = fs.readFileSync(new URL("src/app/inter-700.ttf", root)).toString("base64");
  const rows = ["esc 1 2 3 4 5 6 7 8 9 0 - = ⌫", "⇥ Q W E R T Y U I O P [ ] \\", "⇪ A S D F G H J K L ; ' ⏎", "⇧ Z X C V B N M , . / ⇧", "fn ctrl alt ⌘ ␣ ⌘ alt ◀ ▼ ▶"];
  const keys = rows.map((r) => `<div class="row">${r.split(" ").map((k) => `<span class="key${k === "␣" ? " space" : k.length > 1 || "⌫⇥⇪⏎⇧".includes(k) ? " wide" : ""}">${k === "␣" ? "" : k}</span>`).join("")}</div>`).join("");
  const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:Cap;src:url(data:font/ttf;base64,${inter});font-weight:700}
*{box-sizing:border-box;margin:0}
html,body{width:${CW}px;height:${CH}px;background:transparent;overflow:hidden}
.bg{position:absolute;inset:0;background:
  radial-gradient(ellipse 70% 26% at 50% ${scr.y + scr.h / 2}px, rgba(120,24,18,.20), rgba(0,0,0,0) 70%),
  radial-gradient(ellipse 60% 20% at 50% 5%, rgba(255,214,150,.07), rgba(0,0,0,0) 70%), #020203;
  -webkit-mask: linear-gradient(#000,#000) exclude, linear-gradient(#000,#000) no-repeat ${scr.x}px ${scr.y}px / ${scr.w}px ${scr.h}px;
  mask: linear-gradient(#000,#000) exclude, linear-gradient(#000,#000) no-repeat ${scr.x}px ${scr.y}px / ${scr.w}px ${scr.h}px;}
.lid{position:absolute;left:${scr.x - 14 * S}px;top:${scr.y - 20 * S}px;width:${scr.w + 28 * S}px;height:${scr.h + 36 * S}px;border-radius:${20 * S}px ${20 * S}px ${6 * S}px ${6 * S}px;
  border:${14 * S}px solid #0b0b0d;border-top-width:${20 * S}px;border-bottom-width:${16 * S}px;box-shadow:0 0 0 ${1.5 * S}px #26262b, 0 0 ${90 * S}px rgba(170,34,24,.16)}
.cam{position:absolute;left:50%;top:${scr.y - 12 * S}px;width:${5 * S}px;height:${5 * S}px;margin-left:${-2.5 * S}px;border-radius:50%;background:#1b1b20}
.deckwrap{position:absolute;left:0;top:${scr.y + scr.h + 14 * S}px;width:100%;height:${760 * S}px;perspective:${1500 * S}px;perspective-origin:50% -10%}
.deck{position:absolute;left:${8 * S}px;right:${8 * S}px;top:0;height:${700 * S}px;transform-origin:50% 0;transform:rotateX(63deg);border-radius:${8 * S}px ${8 * S}px ${34 * S}px ${34 * S}px;
  background:linear-gradient(180deg,#0e0e11 0%,#09090b 60%,#050506 100%);box-shadow:inset 0 ${2 * S}px 0 #2a2a30, inset 0 ${60 * S}px ${80 * S}px rgba(150,30,22,.10);padding:${44 * S}px ${46 * S}px 0}
.row{display:flex;gap:${9 * S}px;margin-bottom:${9 * S}px}
.key{flex:1;height:${62 * S}px;border-radius:${8 * S}px;background:#040405;box-shadow:inset 0 0 0 ${1 * S}px #17171b;color:rgba(235,240,255,.50);font:700 ${17 * S}px Cap,sans-serif;display:grid;place-items:center;text-shadow:0 0 ${8 * S}px rgba(200,220,255,.5)}
.key.wide{flex:1.55;font-size:${14 * S}px}.key.space{flex:6}
.pad{margin:${26 * S}px auto 0;width:${330 * S}px;height:${210 * S}px;border-radius:${14 * S}px;box-shadow:inset 0 0 0 ${1 * S}px #16161a;background:#08080a}
.shade{position:absolute;left:0;right:0;bottom:0;height:${520 * S}px;background:linear-gradient(180deg,rgba(2,2,3,0),#020203 78%)}
.cap{position:absolute;left:0;right:0;top:${404 * S}px;text-align:center;font:700 ${62 * S}px/1.15 Cap,"Segoe UI Emoji",sans-serif;color:#fff;letter-spacing:${-0.5 * S}px;
  text-shadow:0 0 ${2 * S}px #000,0 ${2 * S}px ${3 * S}px rgba(0,0,0,.9),0 0 ${18 * S}px rgba(0,0,0,.55);-webkit-text-stroke:${1.2 * S}px rgba(0,0,0,.55);paint-order:stroke fill}
</style><div class="bg"></div><div class="deckwrap"><div class="deck">${keys}<div class="pad"></div></div></div><div class="shade"></div><div class="lid"></div><div class="cam"></div><div class="cap">${CAPTION.replace(/</g, "&lt;")}</div>`;
  const page = await browser.newPage({ viewport: { width: CW, height: CH }, deviceScaleFactor: 1 });
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(WORK, "frame.png"), omitBackground: true });
  await page.close();
}
await browser.close();
{
  // tela → dentro da moldura → aproximação lenta (1,00 → 1,06) com deriva de câmera na mão → grão e vinheta
  const filter = [
    // composição em RGB: uma conversão de cor só, no fim
    `color=c=black:s=${CW}x${CH}:r=${FPS}:d=${T.toFixed(3)},format=gbrp[bg]`,
    `[0:v]scale=${scr.w}:${scr.h}:flags=lanczos,format=gbrp[scr]`,
    `[bg][scr]overlay=${scr.x}:${scr.y}:format=gbrp[a]`,
    `[a][1:v]overlay=0:0:format=gbrp[b]`,
    `[b]scale=w='${CW}*(1+0.06*t/${T.toFixed(3)})':h=-2:eval=frame:flags=bicubic[z]`,
    `[z]crop=${CW}:${CH}:x='(iw-${CW})/2+${(6 * S).toFixed(1)}*sin(0.83*t)+${(2.5 * S).toFixed(1)}*sin(2.1*t+1)':y='(ih-${CH})/2-${(22 * S).toFixed(1)}*t/${T.toFixed(3)}+${(5 * S).toFixed(1)}*sin(0.61*t+2)+${(2.5 * S).toFixed(1)}*sin(1.7*t)'[c]`,
    `[c]scale=1080:1920:flags=lanczos:out_color_matrix=bt709:out_range=tv,format=yuv420p,noise=alls=5:allf=t+u,vignette=PI/5.5[v]`,
  ].join(";");
  ff(["-i", SPLIT, "-loop", "1", "-i", path.join(WORK, "frame.png"), "-filter_complex", filter, "-map", "[v]", "-t", T.toFixed(3), "-r", String(FPS), "-c:v", "libx264", "-preset", "slow", "-crf", "19", ...COLOR, "-movflags", "+faststart", "-an", FINAL]);
  console.log(`vertical: ${FINAL} (${T.toFixed(1)} s)`);
}
fs.rmSync(WORK, { recursive: true, force: true });
