/**
 * QA visual/comportamental do i18n com Playwright (Chromium).
 *
 *   node scripts/i18n-visual.mjs [baseUrl]
 *
 * - Para cada idioma × viewport (320, 390, 1440, 2560): abre as páginas-chave,
 *   confere overflow horizontal (body.scrollWidth > innerWidth), erros de
 *   console e salva screenshot em .audit/shots/.
 * - Seletor de idioma: desktop (header) e mobile (menu), mantendo a página
 *   equivalente; cookie milweb_locale persiste e "/" honra a preferência.
 * Sai com 1 se algo falhar.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = (process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:3005").replace(/\/$/, "");
mkdirSync(".audit/shots", { recursive: true });

const PAGES = {
  pt: ["/", "/projetos", "/projetos/terral", "/projetos/aurex-timepieces", "/servicos", "/contato", "/diagnostico", "/lab", "/estudio", "/criacao-de-sites", "/pagina-inexistente"],
  en: ["/en", "/en/work", "/en/work/terral", "/en/work/aurex-timepieces", "/en/services", "/en/contact", "/en/business-audit", "/en/lab", "/en/studio", "/en/website-development", "/en/missing-page"],
  es: ["/es", "/es/proyectos", "/es/proyectos/terral", "/es/proyectos/aurex-timepieces", "/es/servicios", "/es/contacto", "/es/diagnostico", "/es/lab", "/es/estudio", "/es/desarrollo-web", "/es/pagina-inexistente"],
};
const VIEWPORTS = [
  { name: "320", width: 320, height: 640, mobile: true },
  { name: "390", width: 390, height: 844, mobile: true },
  { name: "1440", width: 1440, height: 900, mobile: false },
  { name: "2560", width: 2560, height: 1080, mobile: false },
];

const failures = [];
const browser = await chromium.launch();

async function open(page, path) {
  const errors = [];
  const onConsole = (m) => m.type() === "error" && !/favicon|_vercel\/insights|speed-insights|vitals|404 \(Not Found\)/.test(m.text()) && errors.push(m.text());
  const onError = (e) => errors.push(`pageerror: ${e.message}`);
  page.on("console", onConsole);
  page.on("pageerror", onError);
  const res = await page.goto(`${BASE}${path}`, { waitUntil: "load", timeout: 45000 });
  // pula o preloader (Boot) se existir
  await page.evaluate(() => document.querySelector("[data-boot-skip]")?.click());
  await page.waitForTimeout(600);
  page.off("console", onConsole);
  page.off("pageerror", onError);
  return { status: res?.status() ?? 0, errors };
}

// 1) Overflow + console por idioma × viewport (pule com --skip-shots)
for (const vp of process.argv.includes("--skip-shots") ? [] : VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.mobile, hasTouch: vp.mobile, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  for (const locale of Object.keys(PAGES)) {
    for (const path of PAGES[locale]) {
      const { status, errors } = await open(page, path);
      const lang = await page.evaluate(() => document.documentElement.lang);
      const overflow = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth);
      const expectStatus = /inexistente|missing/.test(path) ? 404 : 200;
      const tag = `${vp.name} ${locale} ${path}`;
      if (status !== expectStatus) failures.push(`${tag}: status ${status}`);
      if (lang !== { pt: "pt-BR", en: "en", es: "es" }[locale]) failures.push(`${tag}: <html lang>=${lang}`);
      if (overflow > 1) failures.push(`${tag}: overflow horizontal +${overflow}px`);
      for (const e of errors) failures.push(`${tag}: console ${e.slice(0, 160)}`);
      await page.screenshot({ path: `.audit/shots/${vp.name}-${locale}-${path.replace(/[^a-z0-9]+/gi, "_") || "home"}.png`, fullPage: vp.mobile && path.length < 6 });
      process.stdout.write(`${overflow > 1 || status !== expectStatus ? "FAIL" : "ok  "} ${tag} (${status}, +${overflow}px)\n`);
    }
  }
  await ctx.close();
}

// 2) Seletor de idioma — desktop: página equivalente + cookie + raiz honra cookie
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await open(page, "/projetos/terral");
  const sw = page.locator("header nav[aria-label]").last();
  const es = page.locator('header a[hreflang="es"]').first();
  if (!(await es.isVisible())) failures.push("desktop: link ES do seletor não visível no header");
  await es.click();
  await page.waitForURL(`${BASE}/es/proyectos/terral`);
  const cookie = (await ctx.cookies()).find((c) => c.name === "milweb_locale");
  if (cookie?.value !== "es") failures.push(`cookie milweb_locale=${cookie?.value} (esperado es)`);
  const cur = await page.locator('header a[hreflang][aria-current="page"]').first().textContent();
  if (cur?.trim().toLowerCase() !== "es") failures.push(`aria-current no seletor = ${cur}`);
  await page.locator('header a[hreflang="en"]').first().click();
  await page.waitForURL(`${BASE}/en/work/terral`);
  await page.locator('header a[hreflang="pt-BR"]').first().click();
  await page.waitForURL(`${BASE}/projetos/terral`);
  // troca em página de serviço
  await open(page, "/servicos");
  await page.locator('header a[hreflang="es"]').first().click();
  await page.waitForURL(`${BASE}/es/servicios`);
  // raiz honra a preferência (cookie = es agora)
  const r = await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  if (!page.url().endsWith("/es")) failures.push(`"/" com cookie es foi para ${page.url()} (status ${r?.status()})`);
  // link direto sempre respeita a URL
  await page.goto(`${BASE}/en/lab`, { waitUntil: "domcontentloaded" });
  if (!page.url().endsWith("/en/lab")) failures.push(`/en/lab com cookie es foi para ${page.url()}`);
  // navegação por teclado até o seletor (foco visível = outline)
  await open(page, "/");
  let focusedSwitch = false;
  for (let i = 0; i < 12 && !focusedSwitch; i++) {
    await page.keyboard.press("Tab");
    focusedSwitch = await page.evaluate(() => document.activeElement?.getAttribute("hreflang") !== null);
  }
  if (!focusedSwitch) failures.push("seletor não alcançável por Tab em 12 passos");
  void sw;
  await ctx.close();
}

// 3) Mobile: menu abre, seletor visível, troca mantém a página
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await open(page, "/en/work/aurex-timepieces");
  await page.locator('header button[aria-controls="nav-overlay"]').click();
  await page.waitForTimeout(500);
  const es = page.locator('#nav-overlay a[hreflang="es"]');
  if (!(await es.isVisible())) failures.push("mobile: seletor ES não visível no menu");
  await page.screenshot({ path: ".audit/shots/390-menu-en.png" });
  await es.click();
  await page.waitForURL(`${BASE}/es/proyectos/aurex-timepieces`);
  await ctx.close();
}

await browser.close();
if (failures.length) {
  console.log("\nFALHAS:");
  for (const f of failures) console.log(" -", f);
  process.exit(1);
}
console.log("\nvisual/i18n OK");
