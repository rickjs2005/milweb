/**
 * Captura os quatro atos do Selected Work + os instantes de transição entre
 * eles, e reporta o que a imagem não mostra: overflow, headline cortada,
 * elementos fora da viewport e console.
 *
 *   node scripts/.rsc-audit/work/acts.mjs [base] [viewport...] [--tag nome]
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const argv = process.argv.slice(2);
const tagIdx = argv.indexOf("--tag");
const TAG = tagIdx >= 0 ? argv[tagIdx + 1] : "act";
const rest = tagIdx >= 0 ? argv.filter((_, i) => i !== tagIdx && i !== tagIdx + 1) : argv;
const base = rest[0] ?? "http://127.0.0.1:3100";
const sizes = (rest.slice(1).length ? rest.slice(1) : ["1920x1080"]).map((s) => {
  const [width, height] = s.split("x").map(Number);
  return { width, height };
});
const OUT = "scripts/.rsc-audit/work";
mkdirSync(OUT, { recursive: true });

// progresso DENTRO do ato (as faixas de act-config): construção, experiência,
// preparação e transição. Não é fração de viewport — é o progresso da trigger.
const MARKS = (process.env.MARKS ?? "0.22,0.5,0.78,0.94").split(",").map(Number);

const b = await chromium.launch({ headless: false });
for (const vp of sizes) {
  const tag = `${vp.width}x${vp.height}`;
  const page = await b.newPage({ viewport: vp, isMobile: vp.width < 720, hasTouch: vp.width < 720, deviceScaleFactor: 1 });
  const bad = [];
  page.on("console", (m) => ["error", "warning"].includes(m.type()) && bad.push(`${m.type()}: ${m.text().slice(0, 140)}`));
  page.on("pageerror", (e) => bad.push(`pageerror: ${String(e).slice(0, 180)}`));

  await page.goto(`${base}/pt?quality=high`, { waitUntil: "load" });
  await page.waitForTimeout(500);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(1000);
  // desce até a seção para o setup no idle rodar
  await page.evaluate(() => window.scrollTo({ top: innerHeight * 2, behavior: "instant" }));
  await page.waitForTimeout(1500);

  const panels = await page.evaluate(() => document.querySelectorAll("#work [data-panel]").length);

  // A trigger de cada ato vai de `top bottom` a `bottom top`: o percurso é
  // (altura do trilho + 1 viewport). Mede-se ao vivo, logo antes de cada salto —
  // o Hero é pinado e a altura acima da seção muda depois do refresh.
  const goTo = (i, p) =>
    page.evaluate(
      ([idx, prog]) => {
        const a = document.querySelectorAll("#work [data-panel]")[idx];
        const top = a.getBoundingClientRect().top + scrollY;
        const travel = a.offsetHeight + innerHeight;
        window.scrollTo({ top: top - innerHeight + prog * travel, behavior: "instant" });
      },
      [i, p],
    );

  for (let i = 0; i < panels; i++) {
    for (const m of MARKS) {
      await goTo(i, m);
      await page.waitForTimeout(400);
      await goTo(i, m); // segunda passada: o pin do Hero pode ter deslocado a origem
      await page.waitForTimeout(600);
      // o otimizador de imagem do next em dev leva segundos: sem esperar, a
      // captura sai com a moldura da mídia vazia e parece bug de layout
      await page
        .waitForFunction(() => [...document.querySelectorAll("#work img")].every((im) => im.complete && im.naturalWidth > 0), null, { timeout: 25000 })
        .catch(() => {});
      await page.waitForTimeout(700);
      await page.screenshot({ path: `${OUT}/${TAG}-${tag}-${i + 1}-${String(Math.round(m * 100))}.png` });
    }
  }
  await goTo(0, 0.5);
  await page.waitForTimeout(900);

  const report = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll("#work [data-panel]").forEach((p, i) => {
      const h2 = p.querySelector("h2");
      // a tinta real: Range sobre os NÓS DE TEXTO (um Range sobre um bloco
      // devolve a caixa do bloco, que é a largura toda da coluna)
      const rg = document.createRange();
      const lines = [...h2.querySelectorAll("span")].map((sp) => {
        const r2 = document.createRange();
        r2.selectNodeContents(sp.firstChild ?? sp);
        return r2.getBoundingClientRect();
      });
      const ink = lines.length
        ? { left: Math.min(...lines.map((b) => b.left)), right: Math.max(...lines.map((b) => b.right)), top: Math.min(...lines.map((b) => b.top)), bottom: Math.max(...lines.map((b) => b.bottom)) }
        : (rg.selectNodeContents(h2), rg.getBoundingClientRect());
      const pr = (p.querySelector(".act") ?? p).getBoundingClientRect();
      const cta = p.querySelector("a[data-cta], a[href*='/work/'], a[href*='/projetos/']");
      out.push({
        i: i + 1,
        world: p.dataset.world,
        h2: { l: Math.round(ink.left), r: Math.round(ink.right), t: Math.round(ink.top - pr.top), b: Math.round(ink.bottom - pr.top), fs: Math.round(parseFloat(getComputedStyle(h2).fontSize)) },
        estouraDireita: Math.round(Math.max(0, ink.right - innerWidth)),
        cta: cta ? { txt: cta.textContent.trim().slice(0, 40), t: Math.round(cta.getBoundingClientRect().top - pr.top) } : null,
      });
    });
    return { linhas: out, ovfX: Math.max(0, document.documentElement.scrollWidth - innerWidth) };
  });
  console.log(`\n=== ${tag} · painéis=${panels} · ovfX=${report.ovfX} · console=${bad.length ? bad.join(" | ") : "limpo"}`);
  for (const l of report.linhas) console.log(`  ${l.i} ${String(l.world).padEnd(18)} h2 ${l.h2.fs}px [${l.h2.l}→${l.h2.r}] y ${l.h2.t}→${l.h2.b} ${l.estouraDireita ? "ESTOURA " + l.estouraDireita : ""} cta=${l.cta ? `"${l.cta.txt}" y${l.cta.t}` : "—"}`);
  await page.close();
}
await b.close();
