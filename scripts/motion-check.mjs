/**
 * Verificação dos loops da galeria (MilWeb System, Sprint 02).
 *
 *   node scripts/motion-check.mjs [http://localhost:3005]
 *
 * Desktop: sem gesto nenhum <video> tem <source>; hover no Terral toca; sair
 * pausa e volta a 0; hover no Vertex pausa o Terral (um por vez).
 * Mobile: ao rolar até o card, só um <video> toca por vez.
 * Reduced motion: nenhum <video> recebe <source>, mesmo com hover.
 * Sai com código 1 em qualquer falha.
 */
import { chromium } from "playwright";

const BASE = (process.argv[2] ?? "http://localhost:3005").replace(/\/$/, "");
const failures = [];
const ok = (cond, msg) => {
  if (!cond) failures.push(msg);
  console.log(`${cond ? "ok " : "FAIL"} ${msg}`);
};
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--autoplay-policy=no-user-gesture-required"] });

async function open(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
  await ctx.addInitScript(() => sessionStorage.setItem("mw:booted", "1"));
  const p = await ctx.newPage();
  await p.goto(BASE + "/", { waitUntil: "networkidle" });
  await p.waitForTimeout(500);
  return { ctx, p };
}
const videoState = (p) => p.$$eval("video[data-motion]", (vs) => vs.map((v) => ({ slug: v.closest("[data-project]")?.dataset.project, sources: v.querySelectorAll("source").length, paused: v.paused, t: v.currentTime, playing: v.getAttribute("data-playing") })));
const scrollToCard = (p, slug) => p.evaluate((s) => { const el = document.querySelector(`[data-project="${s}"]`); el.scrollIntoView({ block: "center", behavior: "instant" }); }, slug);

/* ---- desktop ---- */
{
  const { ctx, p } = await open();
  let s = await videoState(p);
  ok(s.length === 2 && s.every((v) => v.sources === 0), `desktop: 2 vídeos, 0 <source> antes do gesto (${JSON.stringify(s.map((v) => v.sources))})`);
  const requests = [];
  p.on("request", (r) => { if (r.url().includes("/motion/")) requests.push(r.url()); });

  await scrollToCard(p, "terral");
  await p.waitForTimeout(300);
  await p.hover('[data-project="terral"] a');
  await p.waitForTimeout(1500);
  s = await videoState(p);
  const terral = s.find((v) => v.slug === "terral");
  ok(terral.sources === 2 && !terral.paused, `desktop: hover no Terral toca (sources=${terral.sources}, paused=${terral.paused})`);
  ok(requests.length > 0, `desktop: o vídeo só foi pedido depois do hover (${requests.length} req)`);

  await p.mouse.move(5, 5);
  await p.waitForTimeout(400);
  s = await videoState(p);
  const t2 = s.find((v) => v.slug === "terral");
  ok(t2.paused && t2.t === 0, `desktop: sair pausa e volta a 0 (paused=${t2.paused}, t=${t2.t})`);

  await scrollToCard(p, "atelier-vertex");
  await p.waitForTimeout(300);
  await p.hover('[data-project="atelier-vertex"] a');
  await p.waitForTimeout(1500);
  s = await videoState(p);
  ok(s.filter((v) => !v.paused).length === 1 && !s.find((v) => v.slug === "atelier-vertex").paused, `desktop: só o Vertex toca (${JSON.stringify(s.map((v) => [v.slug, v.paused]))})`);

  // Teclado: focus no link também toca.
  await p.mouse.move(5, 5);
  await p.focus('[data-project="terral"] a');
  await p.waitForTimeout(1200);
  s = await videoState(p);
  ok(!s.find((v) => v.slug === "terral").paused, "desktop: focus no link toca (teclado)");
  await ctx.close();
}

/* ---- mobile ---- */
{
  const { ctx, p } = await open({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  let s = await videoState(p);
  ok(s.every((v) => v.sources === 0), `mobile: nenhum vídeo armado antes de entrar na tela (${JSON.stringify(s.map((v) => v.sources))})`);

  await scrollToCard(p, "terral");
  await p.waitForTimeout(2500);
  s = await videoState(p);
  ok(s.filter((v) => !v.paused).length <= 1, `mobile: no máximo um vídeo ativo (${JSON.stringify(s.map((v) => [v.slug, v.paused]))})`);
  ok(!s.find((v) => v.slug === "terral").paused, "mobile: o Terral centralizado toca sozinho");
  // Só o card dominante baixa: o Vertex, quase fora da tela, não pode ter sido armado.
  ok(s.find((v) => v.slug === "atelier-vertex").sources === 0, `mobile: o card fora da tela não baixa vídeo (sources=${s.find((v) => v.slug === "atelier-vertex").sources})`);

  await scrollToCard(p, "atelier-vertex");
  await p.waitForTimeout(2500);
  s = await videoState(p);
  ok(s.find((v) => v.slug === "terral").paused && !s.find((v) => v.slug === "atelier-vertex").paused, `mobile: rolar até o Vertex troca o ativo (${JSON.stringify(s.map((v) => [v.slug, v.paused]))})`);

  // Sair da galeria para o topo pausa tudo.
  await p.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await p.waitForTimeout(1200);
  s = await videoState(p);
  ok(s.every((v) => v.paused), `mobile: fora da galeria nada toca (${JSON.stringify(s.map((v) => [v.slug, v.paused]))})`);
  await ctx.close();
}

/* ---- reduced motion ---- */
{
  const { ctx, p } = await open({ reducedMotion: "reduce" });
  await scrollToCard(p, "terral");
  await p.hover('[data-project="terral"] a');
  await p.waitForTimeout(800);
  const s = await videoState(p);
  ok(s.every((v) => v.sources === 0 && v.paused), `reduce: nenhum vídeo recebe <source> (${JSON.stringify(s.map((v) => v.sources))})`);
  await ctx.close();
}

await browser.close();
console.log(failures.length ? `\n${failures.length} falha(s)` : "\ntudo ok");
process.exit(failures.length ? 1 : 0);
