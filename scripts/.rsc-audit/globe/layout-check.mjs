/**
 * Verificação de composição do Hero com o globo, por viewport e por checkpoint
 * de progresso. Reporta o que as capturas não medem: sobreposição real entre o
 * globo e a manchete/sub/CTA, overflow horizontal, elementos fora da viewport,
 * posição do CTA e console limpo.
 *
 *   node scripts/.rsc-audit/globe/layout-check.mjs [base] [viewport...]
 */
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://127.0.0.1:3100";
const list = process.argv.slice(3).length ? process.argv.slice(3) : ["1920x1080", "1600x900", "1440x900", "1366x768", "430x932", "412x915", "393x852", "390x844", "375x667", "360x800", "320x568"];
const STEPS = [0, 0.4, 0.6, 0.75, 0.9, 1];

const b = await chromium.launch({ headless: false });
let fails = 0;
for (const s of list) {
  const [width, height] = s.split("x").map(Number);
  const small = width < 720;
  const page = await b.newPage({ viewport: { width, height }, isMobile: small, hasTouch: small, deviceScaleFactor: 1 });
  const bad = [];
  page.on("console", (m) => ["error", "warning"].includes(m.type()) && bad.push(`${m.type()}: ${m.text().slice(0, 120)}`));
  page.on("pageerror", (e) => bad.push(`pageerror: ${String(e).slice(0, 160)}`));
  await page.goto(`${base}/pt?quality=high`, { waitUntil: "load" });
  await page.waitForTimeout(500);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(800);
  await page.mouse.move(width * 0.5, height * 0.4);
  await page.mouse.move(width * 0.5 + 9, height * 0.4 + 6);
  await page.mouse.wheel(0, 1);
  let mounted = false;
  try {
    await page.waitForFunction(() => document.documentElement.dataset.globe === "on", null, { timeout: 15000 });
    mounted = true;
  } catch {}
  const pin = small ? 2.2 : 3.2;
  const rows = [];
  for (const p of STEPS) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), p * pin * height);
    await page.waitForTimeout(1100);
    rows.push(
      await page.evaluate(
        ([prog, mounted]) => {
          const r = (el) => (el ? el.getBoundingClientRect() : null);
          const vis = (el) => el && +getComputedStyle(el).opacity > 0.05;
          // A caixa do <h1> é do bloco (largura toda). O que importa é a TINTA:
          // um Range sobre cada linha devolve a extensão real do texto.
          const inkBox = (el) => {
            if (!el) return null;
            const rg = document.createRange();
            rg.selectNodeContents(el);
            const b = rg.getBoundingClientRect();
            rg.detach?.();
            return b;
          };
          const lines = [...document.querySelectorAll("h1 [data-line]")].map(inkBox);
          const h1 = lines.length
            ? { left: Math.min(...lines.map((b) => b.left)), right: Math.max(...lines.map((b) => b.right)), top: Math.min(...lines.map((b) => b.top)), bottom: Math.max(...lines.map((b) => b.bottom)) }
            : r(document.querySelector("h1"));
          const sub = document.querySelector("[data-outro]");
          const cta = document.querySelectorAll("[data-outro]")[1];
          const ship = r(document.querySelector("[data-ship]"));
          const g = window.__mwGlobe;
          let globe = null;
          if (mounted && g && g.frame.fade > 0.02 && g.orb.ok) {
            const f = g.frame,
              o = g.orb,
              canvas = document.querySelector(".hero-globe-canvas").getBoundingClientRect();
            const tiny = innerWidth < 768;
            const P = tiny ? { cx: 0.62, cy: 0.62, rw: 0.21, rh: 0.17 } : { cx: 0.77, cy: 0.37, rw: 0.145, rh: 0.25 };
            const EX = tiny ? { s: 1.22, dx: 0.13, dy: 0.04 } : { s: 1.42, dx: 0.16, dy: -0.1 };
            let tR = Math.min(canvas.width * P.rw, canvas.height * P.rh);
            let tCy = canvas.height * P.cy;
            if (tiny) {
              const hero = document.getElementById("top");
              const ob = document.querySelector("[data-outro]").parentElement.getBoundingClientRect();
              const sb = document.querySelector("[data-ship]").getBoundingClientRect();
              const hb = document.querySelector("h1").getBoundingClientRect();
              const padTop = parseFloat(getComputedStyle(hero).paddingTop) || 0;
              const below = { a: ob.bottom - canvas.top + 16, b: sb.top - canvas.top - 16 };
              const above = { a: padTop + 16, b: hb.top - canvas.top - 16 };
              const minR = canvas.width * 0.16;
              const band = below.b - below.a >= 2 * minR || above.b - above.a <= below.b - below.a ? below : above;
              const span = Math.max(72, band.b - band.a);
              tR = Math.min(tR, span / 2);
              tCy = Math.max(band.a + tR, Math.min(band.b - tR, (band.a + band.b) / 2));
            }
            const m = Math.min(1, f.migrate),
              out = Math.max(0, f.migrate - 1);
            const rad = (o.ry + (tR - o.ry) * (m * m * (3 - 2 * m))) * (1 + (EX.s - 1) * out);
            const cx = o.cx + (canvas.width * P.cx - o.cx) * (1 - Math.pow(1 - m, 2.4)) + canvas.width * EX.dx * out;
            const dyS = tCy < canvas.height * 0.45 ? -Math.abs(EX.dy) : EX.dy;
            const cy = o.cy + (tCy - o.cy) * (1 - Math.pow(1 - m, 1.5)) + canvas.height * dyS * out;
            globe = { cx: Math.round(cx + canvas.left), cy: Math.round(cy + canvas.top), r: Math.round(rad), fade: +f.fade.toFixed(2) };
          }
          const hit = (box) => {
            if (!globe || !box) return 0;
            // aproximação: distância do centro do globo à caixa
            const dx = Math.max(box.left - globe.cx, 0, globe.cx - box.right);
            const dy = Math.max(box.top - globe.cy, 0, globe.cy - box.bottom);
            return Math.round(Math.max(0, globe.r - Math.hypot(dx, dy)));
          };
          const off = [];
          for (const [name, box] of [["h1", h1], ["ship", ship], ["sub", vis(sub) ? r(sub) : null], ["cta", vis(cta) ? r(cta) : null]]) {
            if (!box) continue;
            if (box.left < -1 || box.right > innerWidth + 1 || box.bottom > innerHeight + 1 || box.top < -1) off.push(`${name}(${Math.round(box.left)},${Math.round(box.top)},${Math.round(box.right)},${Math.round(box.bottom)})`);
          }
          return {
            p: prog,
            stage: [...document.querySelectorAll("[data-stage]")].findIndex((n) => n.classList.contains("is-active")) + 1,
            h1: h1 && { l: Math.round(h1.left), r: Math.round(h1.right), t: Math.round(h1.top), b: Math.round(h1.bottom) },
            globe,
            over: { h1: hit(h1), sub: vis(sub) ? hit(r(sub)) : "-", cta: vis(cta) ? hit(r(cta)) : "-", ship: hit(ship) },
            cta: vis(cta) ? { l: Math.round(r(cta).left), t: Math.round(r(cta).top), col: getComputedStyle(cta).gridColumnStart } : "oculto",
            sub: vis(sub) ? { l: Math.round(r(sub).left), t: Math.round(r(sub).top), w: Math.round(r(sub).width), col: getComputedStyle(sub).gridColumnStart } : "oculto",
            overflowX: Math.max(0, document.documentElement.scrollWidth - innerWidth),
            off: off.join(" "),
          };
        },
        [p, mounted],
      ),
    );
  }
  // Invadir a manchete ANTES da migração é a cena: o globo nasce dentro dela.
  // Só é defeito depois que ele já deveria estar no destino (p ≥ 0.85).
  const problems = rows.filter((x) => x.overflowX > 0 || x.off || (x.p >= 0.85 && x.over.h1 > 0) || x.over.sub > 0 || x.over.cta > 0);
  if (problems.length || bad.length || !mounted) fails++;
  console.log(`\n=== ${s} ${small ? "(mobile)" : ""} · canvas=${mounted ? "on" : "OFF"} · console=${bad.length ? bad.join(" | ") : "limpo"}`);
  for (const x of rows) console.log(`  p=${String(x.p).padEnd(4)} est=${x.stage} h1=[${x.h1.l},${x.h1.t}→${x.h1.r},${x.h1.b}] globo=${x.globe ? `(${x.globe.cx},${x.globe.cy}) r${x.globe.r} f${x.globe.fade}` : "—"} invade{h1:${x.over.h1} sub:${x.over.sub} cta:${x.over.cta} ship:${x.over.ship}} cta=${JSON.stringify(x.cta)} sub=${JSON.stringify(x.sub)} ovfX=${x.overflowX} ${x.off ? "FORA:" + x.off : ""}`);
  await page.close();
}
await b.close();
console.log(`\n${fails ? `⚠ ${fails} viewport(s) com apontamento` : "✓ todos os viewports limpos"}`);
