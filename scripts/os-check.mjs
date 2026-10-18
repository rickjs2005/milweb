/**
 * MilWeb OS — testes de fluxo (Playwright, Chromium).
 *
 *   node scripts/os-check.mjs [--base http://127.0.0.1:3100] [--out .audit/os] [--only desktop,mobile,resize]
 *
 * Cobre os riscos reais do shell: histórico/rotas (link direto, Voltar,
 * recarregar), estado das janelas (abrir, focar, minimizar, restaurar,
 * maximizar, fechar, arrastar com clamp, teclado), troca de modo
 * (desktop ↔ celular preservando o case) e contato a uma ação. Emulação
 * de navegador, não aparelho físico: cobre a lógica, não a percepção.
 */
import { chromium, devices } from "playwright";
import { mkdirSync } from "node:fs";

const args = process.argv.slice(2);
const opt = (k, d) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : d;
};
const BASE = opt("--base", "http://127.0.0.1:3100").replace(/\/$/, "");
const OUT = opt("--out", ".audit/os");
const ONLY = opt("--only", "desktop,mobile,resize,simple").split(",");
mkdirSync(OUT, { recursive: true });

const results = [];
let current = "";
function check(name, ok, detail = "") {
  results.push({ group: current, name, ok: !!ok, detail });
  console.log(`${ok ? "  ✓" : "  ✗"} ${name}${detail ? ` — ${detail}` : ""}`);
}
async function shot(page, name) {
  await page.screenshot({ path: `${OUT}/${name}.png` });
}
const win = (page, app) => page.locator(`.os-window[data-app="${app}"]`);
const rectOf = async (loc) => {
  const b = await loc.boundingBox();
  return b ? { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) } : null;
};
const path = (page) => new URL(page.url()).pathname;
const errorsOf = (page) => {
  const errs = [];
  page.on("pageerror", (e) => errs.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    const t = m.text();
    // Ruído do ambiente local: os scripts do Vercel Analytics/Speed Insights só existem no deploy.
    if (m.type() === "error" && !/favicon|404 \(Not Found\)|_vercel\/|vercel-scripts|net::ERR|Refused to execute script/.test(t)) errs.push(`console.error: ${t.slice(0, 200)}`);
    if (/hydrat/i.test(t)) errs.push(`hydration: ${t.slice(0, 200)}`);
  });
  return errs;
};
const settle = (page, ms = 450) => page.waitForTimeout(ms);
/** O App Router só troca a URL quando a rota chega (no dev, depois de compilar). */
const urlIs = async (page, re) => {
  try {
    await page.waitForURL(re, { timeout: 20000 });
    return true;
  } catch {
    return false;
  }
};

const browser = await chromium.launch();

// ------------------------------------------------------------------ desktop
if (ONLY.includes("desktop")) {
  current = "desktop";
  console.log("\n# desktop 1440×900");
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "pt-BR" });
  const page = await ctx.newPage();
  const errs = errorsOf(page);
  await page.goto(`${BASE}/`, { waitUntil: "load" });
  await settle(page, 1200);
  check("shell = desktop", (await page.getAttribute("html", "data-shell")) === "desktop");
  check("documento não rola", await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight + 1));
  check("Destaques aberta na raiz", (await win(page, "home").count()) === 1 && (await win(page, "home").getAttribute("data-focused")) === "1");
  check("h1 na raiz é a manchete", (await page.locator("h1").count()) === 1);
  await shot(page, "d01-home");

  // abrir pela dock (um clique) → janela + URL
  await page.click('[data-dock-id="studio"]');
  const toStudio = await urlIs(page, /\/estudio$/);
  await settle(page);
  check("dock abre Estúdio e muda a URL", (await win(page, "studio").count()) === 1 && toStudio, path(page));
  const zTop = async (app) => Number(await win(page, app).evaluate((e) => getComputedStyle(e).zIndex));
  check("Estúdio em foco acima de Destaques", (await zTop("studio")) > (await zTop("home")));
  check("foco de teclado foi para a janela", await page.evaluate(() => document.activeElement?.closest(".os-window")?.dataset.app === "studio"));

  // segunda janela (Ajustes, menor: não cobre a barra do Estúdio) → clicar na de trás foca
  await page.click('[data-dock-id="settings"]');
  await settle(page, 600);
  check("Ajustes abre sem mudar a URL (app sem rota)", (await win(page, "settings").count()) === 1 && path(page) === "/estudio", path(page));
  check("Ajustes no topo da pilha", (await zTop("settings")) > (await zTop("studio")));
  const studioBox = await rectOf(win(page, "studio"));
  await page.mouse.click(studioBox.x + 120, studioBox.y + 20);
  await settle(page, 600);
  check("clicar na janela de trás traz para frente", (await zTop("studio")) > (await zTop("settings")));
  // Ajustes voltou para trás do Estúdio: a dock traz de volta e o Esc fecha (foco está na janela)
  await page.click('[data-dock-id="settings"]');
  await settle(page, 400);
  check("dock refoca Ajustes sem mexer na URL", (await zTop("settings")) > (await zTop("studio")) && path(page) === "/estudio", path(page));
  await page.keyboard.press("Escape");
  await settle(page, 500);
  check("Esc fecha Ajustes e o foco volta ao item da dock", (await win(page, "settings").count()) === 0 && (await page.evaluate(() => document.activeElement?.id)) === "os-dock-settings", await page.evaluate(() => document.activeElement?.id));

  // ícone da área de trabalho → Projetos
  await page.click("#os-icon-projects");
  const toProjects = await urlIs(page, /\/projetos$/);
  await settle(page);
  check("ícone abre Projetos (/projetos)", (await win(page, "projects").count()) === 1 && toProjects, path(page));
  check("Projetos no topo da pilha", (await zTop("projects")) > (await zTop("studio")));
  // Projetos cobre o Estúdio: a dock traz o Estúdio para frente antes dos testes de janela
  await page.click('[data-dock-id="studio"]');
  await urlIs(page, /\/estudio$/);
  await settle(page, 500);
  check("dock traz o Estúdio para frente e a URL acompanha", (await zTop("studio")) > (await zTop("projects")) && path(page) === "/estudio", path(page));

  // minimizar → some, dock restaura
  await win(page, "studio").locator('[data-action="min"]').click();
  await urlIs(page, /\/projetos$/);
  await settle(page, 600);
  check("minimizar esconde (visibility hidden + inert)", await win(page, "studio").evaluate((e) => getComputedStyle(e).visibility === "hidden" && e.hasAttribute("inert")));
  check("foco passa para Projetos", path(page) === "/projetos" && (await win(page, "projects").getAttribute("data-focused")) === "1", path(page));
  await page.click('[data-dock-id="studio"]');
  await urlIs(page, /\/estudio$/);
  await settle(page, 600);
  check("dock restaura a janela minimizada", await win(page, "studio").evaluate((e) => getComputedStyle(e).visibility === "visible" && e.dataset.min === "0" && e.dataset.focused === "1"));
  await shot(page, "d02-three-windows");

  // arrastar pela barra de título
  const before = await rectOf(win(page, "studio"));
  const bar = win(page, "studio").locator(".os-window__bar");
  const bb = await bar.boundingBox();
  await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
  await page.mouse.down();
  await page.mouse.move(bb.x + bb.width / 2 + 60, bb.y + bb.height / 2 + 40, { steps: 6 });
  await page.mouse.move(bb.x + bb.width / 2 + 120, bb.y + bb.height / 2 + 80, { steps: 6 });
  await page.mouse.up();
  await settle(page);
  const after = await rectOf(win(page, "studio"));
  const lay = await rectOf(page.locator(".os-windows"));
  const expX = Math.min(before.x + 120, lay.x + lay.w - before.w);
  const expY = Math.min(before.y + 80, lay.y + lay.h - before.h);
  check("arraste move +120/+80 (até o limite da área)", after.x === expX && after.y === expY, `${JSON.stringify(before)} → ${JSON.stringify(after)} (esperado ${expX},${expY})`);

  // arrastar para fora → clamp dentro da área útil
  const bb2 = await bar.boundingBox();
  await page.mouse.move(bb2.x + 200, bb2.y + 20);
  await page.mouse.down();
  await page.mouse.move(-500, -400, { steps: 10 });
  await page.mouse.up();
  await settle(page);
  const clamped = await rectOf(win(page, "studio"));
  const layer = await rectOf(page.locator(".os-windows"));
  check("clamp: janela inteira dentro da área útil", clamped.x >= layer.x && clamped.y >= layer.y && clamped.x + clamped.w <= layer.x + layer.w + 1 && clamped.y + clamped.h <= layer.y + layer.h + 1, JSON.stringify({ clamped, layer }));

  // conteúdo não inicia arraste
  const body = win(page, "studio").locator(".os-window__body");
  const bodyBox = await body.boundingBox();
  const beforeBody = await rectOf(win(page, "studio"));
  await page.mouse.move(bodyBox.x + 100, bodyBox.y + 100);
  await page.mouse.down();
  await page.mouse.move(bodyBox.x + 200, bodyBox.y + 180, { steps: 5 });
  await page.mouse.up();
  await settle(page);
  const afterBody = await rectOf(win(page, "studio"));
  check("arrastar o conteúdo não move a janela", beforeBody.x === afterBody.x && beforeBody.y === afterBody.y);

  // teclado na barra de título: setas movem
  await win(page, "studio").locator(".os-window__title").focus();
  const kb = await rectOf(win(page, "studio"));
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowDown");
  await settle(page);
  const kb2 = await rectOf(win(page, "studio"));
  check("setas movem a janela pelo teclado", kb2.x === kb.x + 24 && kb2.y === kb.y + 24, `${JSON.stringify(kb)} → ${JSON.stringify(kb2)}`);

  // maximizar / restaurar
  await win(page, "studio").locator('[data-action="max"]').click();
  await settle(page);
  const maxed = await rectOf(win(page, "studio"));
  check("maximizar ocupa a área útil", Math.abs(maxed.w - layer.w) <= 1 && Math.abs(maxed.h - layer.h) <= 1, JSON.stringify(maxed));
  await win(page, "studio").locator('[data-action="max"]').click();
  await settle(page);
  const restored = await rectOf(win(page, "studio"));
  check("restaurar volta à geometria anterior", restored.w === kb2.w && restored.h === kb2.h && restored.x === kb2.x, JSON.stringify(restored));

  // redimensionar pela alça
  const seHandle = win(page, "studio").locator('.os-window__resize [data-dir="se"]');
  const hb = await seHandle.boundingBox();
  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
  await page.mouse.down();
  await page.mouse.move(hb.x + 60, hb.y + 40, { steps: 5 });
  await page.mouse.up();
  await settle(page);
  const resized = await rectOf(win(page, "studio"));
  check("alça redimensiona", resized.w > restored.w && resized.h > restored.h, `${restored.w}×${restored.h} → ${resized.w}×${resized.h}`);

  // Projetos: card → case dentro da mesma janela, URL do case, título da janela
  await page.click('[data-dock-id="projects"]');
  await urlIs(page, /\/projetos$/);
  await settle(page);
  await win(page, "projects").locator('.os-project__link[href="/projetos/terral"]').click();
  await page.waitForURL(/\/projetos\/terral$/);
  await settle(page, 800);
  check("case abre dentro da janela de Projetos", (await win(page, "projects").locator(".os-case").count()) === 1 && (await page.locator(".os-window").count()) === 3);
  check("título da janela mostra o case", /TERRAL/i.test(await win(page, "projects").locator(".os-window__title").innerText()));
  check("case tem h1 próprio e link real para o site", (await win(page, "projects").locator("h1").count()) === 1 && (await win(page, "projects").locator('a[href="https://terral-cafe.vercel.app"]').count()) >= 1);
  await shot(page, "d03-case-in-window");

  // focar outra janela mantém o case aberto atrás (cache por app)
  await page.click('[data-dock-id="studio"]');
  await urlIs(page, /\/estudio$/);
  await settle(page, 600);
  check("Estúdio focado, case continua na janela de Projetos", path(page) === "/estudio" && (await win(page, "projects").locator(".os-case").count()) === 1, path(page));
  await page.goBack();
  await page.waitForURL(/\/projetos\/terral$/);
  await settle(page, 600);
  check("Voltar refoca Projetos no case", (await win(page, "projects").getAttribute("data-focused")) === "1");

  // Esc fecha a janela em foco; foco volta ao gatilho
  await win(page, "projects").locator(".os-window__title").focus();
  await page.keyboard.press("Escape");
  await urlIs(page, /\/estudio$/);
  await settle(page, 600);
  check("Esc fecha a janela em foco", (await win(page, "projects").count()) === 0);
  check("fechar devolve a URL ao próximo app", path(page) === "/estudio", path(page));

  // atalho de projeto na área de trabalho → Projetos no case certo (o Estúdio cobre a coluna de atalhos: minimiza antes)
  await win(page, "studio").locator('[data-action="min"]').click();
  await settle(page, 500);
  await page.click("#os-icon-kavita-drones");
  await page.waitForURL(/\/projetos\/kavita-drones$/);
  await settle(page, 800);
  check("atalho abre Projetos no case Kavita", (await win(page, "projects").locator('.os-case[data-world="kavita-drones"]').count()) === 1);

  // busca: tecla / → resultado → abre (Projetos minimizada para a busca abrir o case numa janela sem foco e depois restaurá-la)
  await win(page, "projects").locator('[data-action="min"]').click();
  await settle(page, 400);
  await page.keyboard.press("/");
  await settle(page);
  check("tecla / abre a busca", await page.locator("dialog.os-search[open]").count() === 1);
  await page.keyboard.type("inkvision");
  await settle(page);
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/projetos\/inkvision$/);
  await settle(page, 800);
  check("busca abre o case pelo Enter", (await win(page, "projects").locator('.os-case[data-world="inkvision"]').count()) === 1);
  check("busca fechou", (await page.locator("dialog.os-search[open]").count()) === 0);

  // contato a uma ação do dock
  await page.click('[data-dock-id="contact"]');
  await urlIs(page, /\/contato$/);
  await settle(page, 600);
  check("Contato abre pela dock com WhatsApp real", path(page) === "/contato" && (await win(page, "contact").locator('a[href^="https://wa.me/5533998779375"]').count()) >= 1, path(page));

  // recarregar preserva o app da URL
  await page.reload({ waitUntil: "load" });
  await settle(page, 1200);
  check("recarregar reabre a janela da URL", (await win(page, "contact").count()) === 1 && (await win(page, "contact").getAttribute("data-focused")) === "1");

  // link direto para página de serviço → janela de Serviços com o conteúdo da rota
  await page.goto(`${BASE}/criacao-de-sites`, { waitUntil: "load" });
  await settle(page, 1200);
  check("página de serviço abre na janela de Serviços", (await win(page, "services").count()) === 1 && (await win(page, "services").locator("h1").count()) === 1);

  // inglês: rota localizada
  await page.goto(`${BASE}/en/work/terral`, { waitUntil: "load" });
  await settle(page, 1200);
  check("EN: /en/work/terral abre o case", (await win(page, "projects").locator(".os-case").count()) === 1 && (await page.getAttribute("html", "lang")) === "en");
  await win(page, "projects").locator('[data-action="close"]').click();
  await urlIs(page, /\/en$/);
  await settle(page);
  check("EN: fechar leva à raiz do idioma", path(page) === "/en", path(page));

  check("sem erros de console/hidratação", errs.length === 0, errs.slice(0, 3).join(" | "));
  await ctx.close();
}

// ------------------------------------------------------------------- mobile
if (ONLY.includes("mobile")) {
  current = "mobile";
  for (const [label, device, extra] of [
    ["360×780 (Pixel-like)", { ...devices["Pixel 5"], viewport: { width: 360, height: 780 } }, {}],
    ["390×844 (iPhone 13)", devices["iPhone 13"], {}],
    ["430×932 (iPhone 14 Pro Max)", devices["iPhone 14 Pro Max"], {}],
  ]) {
    console.log(`\n# mobile ${label}`);
    const ctx = await browser.newContext({ ...device, ...extra, locale: "pt-BR" });
    const page = await ctx.newPage();
    const errs = errorsOf(page);
    await page.goto(`${BASE}/`, { waitUntil: "load" });
    await settle(page, 1200);
    check("shell = mobile", (await page.getAttribute("html", "data-shell")) === "mobile");
    check("sem rolagem horizontal", await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    check("tela inicial sem app aberto", (await page.locator('.os-window[data-screen="1"]').count()) === 0);
    check("widget com imagem real do projeto", (await page.locator(".os-home__widget img").count()) >= 1);
    const dockBox = await rectOf(page.locator(".os-dock"));
    check("dock dentro da viewport", dockBox && dockBox.y + dockBox.h <= (await page.evaluate(() => window.innerHeight)) + 1, JSON.stringify(dockBox));
    const tooSmall = await page.evaluate(() => [...document.querySelectorAll(".os-dock a, .os-dock button, .os-icon-btn, .os-home__tool")].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.width < 44 || r.height < 44); }).map((e) => e.getAttribute("aria-label") || e.textContent.trim()));
    check("alvos de toque ≥ 44px", tooSmall.length === 0, tooSmall.join(", "));
    await shot(page, `m-${label.split(" ")[0]}-home`);

    // tocar no ícone → tela do app + URL
    await page.tap("#os-icon-projects");
    await page.waitForURL(/\/projetos$/);
    await settle(page, 700);
    check("tocar em Projetos abre a tela (/projetos)", (await win(page, "projects").getAttribute("data-screen")) === "1");
    const screen = await rectOf(win(page, "projects"));
    const vp = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight }));
    check("tela ocupa a área útil", screen.x === 0 && screen.y === 0 && screen.w === vp.w && Math.abs(screen.h - vp.h) <= 2, JSON.stringify({ screen, vp }));
    check("cabeçalho com Voltar e Início", (await win(page, "projects").locator(".os-window__back:visible").count()) === 1 && (await win(page, "projects").locator(".os-window__home:visible").count()) === 1);

    // pasta → projeto imediato
    await win(page, "projects").locator('.os-project__link[href="/projetos/terral"]').tap();
    await page.waitForURL(/\/projetos\/terral$/);
    await settle(page, 800);
    check("tocar no projeto abre o case na mesma tela", (await win(page, "projects").locator(".os-case").count()) === 1);
    await shot(page, `m-${label.split(" ")[0]}-case`);

    // Voltar do cabeçalho → coleção; Voltar do navegador → tela inicial
    await win(page, "projects").locator(".os-window__back").tap();
    await page.waitForURL(/\/projetos$/);
    await settle(page, 600);
    check("Voltar do app volta à coleção", (await win(page, "projects").locator(".os-projects").count()) === 1);
    await page.goBack();
    await page.waitForURL(/\/projetos\/terral$/);
    await settle(page, 600);
    check("Voltar do navegador reabre o case", (await win(page, "projects").locator(".os-case").count()) === 1);
    await win(page, "projects").locator(".os-window__home").tap();
    await page.waitForURL((u) => u.pathname === "/");
    await settle(page, 600);
    check("Início fecha a tela e volta à tela inicial", (await page.locator('.os-window[data-screen="1"]').count()) === 0);

    // contato a uma ação da dock
    await page.tap('[data-dock-id="contact"]');
    await urlIs(page, /\/contato$/);
    await settle(page, 600);
    check("Contato pela dock com WhatsApp real", (await win(page, "contact").locator('a[href^="https://wa.me/"]:visible').count()) >= 1);

    // link direto + recarregar
    await page.goto(`${BASE}/es/proyectos/atelier-vertex`, { waitUntil: "load" });
    await settle(page, 1200);
    check("ES: link direto abre o case na tela", (await win(page, "projects").locator('.os-case[data-world="atelier-vertex"]').count()) === 1 && (await page.getAttribute("html", "lang")) === "es");
    check("sem erros de console/hidratação", errs.length === 0, errs.slice(0, 3).join(" | "));
    await ctx.close();
  }
}

// ------------------------------------------------------------------- resize
if (ONLY.includes("resize")) {
  current = "resize";
  console.log("\n# redimensionar entre modos");
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "pt-BR" });
  const page = await ctx.newPage();
  const errs = errorsOf(page);
  await page.goto(`${BASE}/projetos/terral`, { waitUntil: "load" });
  await settle(page, 1200);
  await page.click('[data-dock-id="studio"]');
  await urlIs(page, /\/estudio$/);
  await settle(page, 500);
  await page.setViewportSize({ width: 390, height: 844 });
  await settle(page, 800);
  check("1440 → 390 vira celular", (await page.getAttribute("html", "data-shell")) === "mobile");
  check("case continua aberto após trocar de modo (URL)", path(page) === "/estudio");
  await page.goBack();
  await page.waitForURL(/\/projetos\/terral$/);
  await settle(page, 600);
  check("no celular o case é a tela em foco", (await win(page, "projects").getAttribute("data-screen")) === "1" && (await win(page, "projects").locator(".os-case").count()) === 1);
  await page.setViewportSize({ width: 1920, height: 1080 });
  await settle(page, 800);
  check("390 → 1920 volta ao desktop", (await page.getAttribute("html", "data-shell")) === "desktop");
  const layer = await rectOf(page.locator(".os-windows"));
  const insides = await page.evaluate(() => [...document.querySelectorAll('.os-window[data-min="0"]')].map((w) => { const r = w.getBoundingClientRect(); return { app: w.dataset.app, x: Math.round(r.x), y: Math.round(r.y), r: Math.round(r.right), b: Math.round(r.bottom) }; }));
  check("janelas recalculadas dentro da área", insides.every((w) => w.x >= layer.x && w.y >= layer.y && w.r <= layer.x + layer.w + 1 && w.b <= layer.y + layer.h + 1), JSON.stringify(insides));
  await page.setViewportSize({ width: 844, height: 390 });
  await settle(page, 800);
  check("telefone deitado (844×390) usa a tela inicial", (await page.getAttribute("html", "data-shell")) === "mobile");
  await page.setViewportSize({ width: 768, height: 1024 });
  await settle(page, 800);
  check("tablet retrato (768×1024) fica no desktop", (await page.getAttribute("html", "data-shell")) === "desktop");
  check("sem erros de console/hidratação", errs.length === 0, errs.slice(0, 3).join(" | "));
  await ctx.close();
}

// ------------------------------------------------------------------- simple
if (ONLY.includes("simple")) {
  current = "simple";
  console.log("\n# modo simples");
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: "pt-BR" });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/projetos/terral`, { waitUntil: "load" });
  await settle(page, 1000);
  await page.keyboard.press("Tab");
  check("primeiro Tab chega ao atalho de navegação simples", await page.evaluate(() => document.activeElement?.classList.contains("os-skip")));
  await page.keyboard.press("Enter");
  await settle(page, 800);
  check("modo simples sem janelas, com o case como página", (await page.locator(".os-window").count()) === 0 && (await page.locator("main#os-simple .os-case").count()) === 1);
  check("documento rola no modo simples", await page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight));
  await page.reload({ waitUntil: "load" });
  await settle(page, 1000);
  check("preferência persiste após recarregar", (await page.locator("main#os-simple").count()) === 1);
  await page.click("main#os-simple button.link-rule");
  await settle(page, 800);
  check("volta ao OS pelo botão", (await page.locator(".os-window").count()) >= 1);
  await ctx.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} ok${failed.length ? ` — falhas: ${failed.map((f) => `${f.group}: ${f.name}`).join("; ")}` : ""}`);
process.exit(failed.length ? 1 : 0);
