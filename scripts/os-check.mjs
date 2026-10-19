/**
 * MilWeb OS — testes de fluxo (Playwright, Chromium).
 *
 *   node scripts/os-check.mjs [--base http://127.0.0.1:3100] [--out .audit/os] [--only desktop,mobile,resize]
 *
 * Cobre os riscos reais do shell: histórico/rotas (link direto, Voltar,
 * recarregar), estado das janelas (abrir, focar, minimizar, restaurar,
 * maximizar, fechar, arrastar com clamp, teclado), os controles de janela
 * (grupo `controls`: luzes, saída animada, Esc global, celular, Hold to
 * Inspect), troca de modo (desktop ↔ celular preservando o case) e contato
 * a uma ação. Emulação de navegador, não aparelho físico: cobre a lógica,
 * não a percepção.
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
const ONLY = opt("--only", "desktop,controls,projects,mobile,resize,simple").split(",");
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
    // Ruído do ambiente local: os scripts do Vercel Analytics/Speed Insights só existem no deploy; o SDK do Google
    // Preferred Sources dispara um aviso de CSP report-only (frame-ancestors) que não é do OS.
    if (m.type() === "error" && !/favicon|404 \(Not Found\)|_vercel\/|vercel-scripts|net::ERR|Refused to execute script|Content Security Policy|news\.google\.com/.test(t)) errs.push(`console.error: ${t.slice(0, 200)}`);
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
  check("raiz sem janela aberta", (await page.locator(".os-window").count()) === 0 && (await page.evaluate(() => window.__milwebOs?.getState().focused ?? null)) === null);
  check("sem Destaques nem atalhos de case na área de trabalho", (await page.locator("#os-icon-home, [data-shortcut], .os-highlights, #os-icon-kavita-drones").count()) === 0);
  check("coluna de aplicativos: Projetos, Estúdio, Lab, Serviços, Contato", (await page.locator('.os-icons li[data-desktop="1"]:visible .os-icon-btn__label').allInnerTexts()).join("|") === "PROJETOS|ESTÚDIO|LAB|SERVIÇOS|CONTATO");
  check("h1 na raiz é o lema", (await page.locator("h1").count()) === 1 && (await page.locator("h1").innerText()) === "Códigos movem o mundo.");
  check("olho presente como imagem (fallback estático)", await page.evaluate(() => { const i = document.querySelector(".os-eye img"); return !!i && i.complete && i.naturalWidth > 0; }));
  check("olho não intercepta o ponteiro", await page.evaluate(() => getComputedStyle(document.querySelector(".os-eye")).pointerEvents === "none"));
  check("sem a escultura orbital (preload e arte)", (await page.locator('link[href*="orbital-sculpture"], .os-wallpaper__art').count()) === 0);
  const overlap = await page.evaluate(() => {
    const r = (s) => document.querySelector(s)?.getBoundingClientRect();
    const g = r(".os-eye"), sg = r(".os-sign"), ic = r(".os-icons"), dk = r(".os-dock ul");
    const hit = (a, b) => a && b && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    return { globeSign: hit(g, sg), globeIcons: hit(g, ic), globeDock: hit(g, dk), signDock: hit(sg, dk), signIcons: hit(sg, ic) };
  });
  check("olho, assinatura, aplicativos e dock não se sobrepõem", Object.values(overlap).every((v) => !v), JSON.stringify(overlap));
  await shot(page, "d01-home");

  // abrir pela dock (um clique) → janela + URL
  await page.click('[data-dock-id="studio"]');
  const toStudio = await urlIs(page, /\/estudio$/);
  await settle(page);
  check("dock abre Estúdio e muda a URL", (await win(page, "studio").count()) === 1 && toStudio, path(page));
  const zTop = async (app) => Number(await win(page, app).evaluate((e) => getComputedStyle(e).zIndex));
  check("foco de teclado foi para a janela", await page.evaluate(() => document.activeElement?.closest(".os-window")?.dataset.app === "studio"));

  // Voltar do navegador para a raiz: a janela fica, mas nenhuma em foco; Avançar refoca
  await page.goBack();
  await page.waitForURL((u) => u.pathname === "/");
  await settle(page, 500);
  check("Voltar para a raiz tira o foco (janela continua aberta)", (await win(page, "studio").count()) === 1 && (await win(page, "studio").getAttribute("data-focused")) === "0" && (await page.locator('.os-window[data-focused="1"]').count()) === 0);
  await page.goForward();
  await urlIs(page, /\/estudio$/);
  await settle(page, 500);
  check("Avançar refoca o Estúdio", (await win(page, "studio").getAttribute("data-focused")) === "1");

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

  // fechar a janela de TRÁS (Projetos, atrás do Estúdio) num gesto só: fecha, e a URL continua a do app em foco
  await win(page, "projects").locator('[data-action="close"]').click();
  await settle(page, 900);
  check("fechar janela de trás não muda a URL do app em foco", (await win(page, "projects").count()) === 0 && path(page) === "/estudio" && (await win(page, "studio").getAttribute("data-focused")) === "1", path(page));
  await page.click("#os-icon-projects");
  await urlIs(page, /\/projetos$/);
  await settle(page, 500);
  await page.click('[data-dock-id="studio"]');
  await urlIs(page, /\/estudio$/);
  await settle(page, 500);
  check("Projetos reaberto na pasta e Estúdio de volta à frente", (await win(page, "projects").locator(".os-projects").count()) === 1 && (await zTop("studio")) > (await zTop("projects")) && path(page) === "/estudio", path(page));

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
  await settle(page, 2800); // os cartazes chegam voando (~2 s); o clique espera o pouso
  await win(page, "projects").locator('.os-project__link[href="/projetos/terral"]').click();
  await page.waitForURL(/\/projetos\/terral$/);
  await settle(page, 800);
  check("case abre dentro da janela de Projetos", (await win(page, "projects").locator(".os-case").count()) === 1 && (await page.locator(".os-window").count()) === 2);
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
  await urlIs(page, /\/projetos$/);
  await settle(page, 1200);
  check("Esc com o dossiê aberto fecha o dossiê (mural fica)", path(page) === "/projetos" && (await win(page, "projects").locator(".bounty").count()) === 1 && (await win(page, "projects").locator(".bounty__dossier").count()) === 0, path(page));
  await page.keyboard.press("Escape");
  await urlIs(page, /\/estudio$/);
  await settle(page, 600);
  check("Esc fecha a janela em foco", (await win(page, "projects").count()) === 0);
  check("fechar devolve a URL ao próximo app", path(page) === "/estudio", path(page));

  // os cases só aparecem depois de abrir Projetos: pasta → card → case (duas ações)
  await win(page, "studio").locator('[data-action="min"]').click();
  await settle(page, 500);
  await page.click("#os-icon-projects");
  await urlIs(page, /\/projetos$/);
  await settle(page, 600);
  await settle(page, 2800);
  await win(page, "projects").locator('.os-project__link[href="/projetos/kavita-drones"]').click();
  await page.waitForURL(/\/projetos\/kavita-drones$/);
  await settle(page, 800);
  check("pasta Projetos → card abre o case Kavita (≤ 2 ações)", (await win(page, "projects").locator('.os-case[data-world="kavita-drones"]').count()) === 1);

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
  check("EN: raiz sem janela em foco", (await page.locator('.os-window[data-focused="1"]').count()) === 0);

  check("sem erros de console/hidratação", errs.length === 0, errs.slice(0, 3).join(" | "));
  await ctx.close();

  // movimento reduzido: o globo fica na imagem, sem canvas vivo
  console.log("\n# desktop 1440×900 · prefers-reduced-motion");
  const rctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "pt-BR", reducedMotion: "reduce" });
  const rpage = await rctx.newPage();
  await rpage.goto(`${BASE}/`, { waitUntil: "load" });
  await settle(rpage, 2500);
  check("reduced motion: olho estático (imagem), sem WebGL", (await rpage.getAttribute(".os-eye", "data-state")) === "still" && (await rpage.evaluate(() => typeof window.__mwOsEye === "undefined")));
  await rctx.close();

  // ajuste "Reduzir movimento" salvo: mesmo resultado
  const pctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "pt-BR" });
  const ppage = await pctx.newPage();
  await ppage.goto(`${BASE}/`, { waitUntil: "load" });
  await ppage.evaluate(() => localStorage.setItem("milweb-os:prefs", JSON.stringify({ theme: "graphite", motion: "reduce", simple: false })));
  await ppage.reload({ waitUntil: "load" });
  await settle(ppage, 2500);
  check("Ajustes › Reduzir: olho estático", (await ppage.getAttribute(".os-eye", "data-state")) === "still" && (await ppage.getAttribute("html", "data-os-motion")) === "reduce");
  await pctx.close();
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
    check("tela inicial sem app aberto", (await page.locator('.os-window[data-screen="1"]').count()) === 0 && (await page.locator(".os-window").count()) === 0);
    check("sem case, destaque ou atalho na entrada", (await page.locator(".os-highlights, .os-home__widget, [data-shortcut], #os-icon-home").count()) === 0);
    check("olho como imagem até o canvas montar", (await page.evaluate(() => { const i = document.querySelector(".os-eye img"); return !!i && i.complete && i.naturalWidth > 0 && typeof window.__mwOsEye === "undefined"; })));
    check("grade com rótulos legíveis", await page.evaluate(() => [...document.querySelectorAll('.os-icons li[data-mobile="1"] .os-icon-btn__label')].every((l) => { const r = l.getBoundingClientRect(); return r.height > 8 && getComputedStyle(l).visibility === "visible"; })));
    check("dock com Projetos, Estúdio, Lab e Contato", (await page.locator('.os-dock li[data-mobile="1"]:visible [data-dock-id]').evaluateAll((els) => els.map((e) => e.dataset.dockId).join(","))) === "projects,studio,lab,contact");
    const dockBox = await rectOf(page.locator(".os-dock"));
    check("dock dentro da viewport", dockBox && dockBox.y + dockBox.h <= (await page.evaluate(() => window.innerHeight)) + 1, JSON.stringify(dockBox));
    const fit = await page.evaluate(() => {
      const r = (s) => document.querySelector(s)?.getBoundingClientRect();
      const ic = r(".os-icons"), dk = r(".os-dock ul"), g = r(".os-eye"), sg = r(".os-sign");
      return { iconsBottom: Math.round(ic.bottom), dockTop: Math.round(dk.top), globeBottom: Math.round(g.bottom), signTop: Math.round(sg.top), signBottom: Math.round(sg.bottom), iconsTop: Math.round(ic.top), scroll: document.querySelector(".os-desktop").scrollHeight, vh: innerHeight };
    });
    check("olho, assinatura, grade e dock sem sobreposição", fit.globeBottom <= fit.signTop && fit.signBottom <= fit.iconsTop && fit.iconsBottom <= fit.dockTop, JSON.stringify(fit));
    check("tela inicial cabe sem rolar", fit.scroll <= fit.vh + 1, `${fit.scroll} vs ${fit.vh}`);
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
    await settle(page, 2600);
    await win(page, "projects").locator('.os-project__link[href="/projetos/kavita-drones"]').tap();
    await page.waitForURL(/\/projetos\/kavita-drones$/);
    await settle(page, 1800);
    check("tocar no cartaz principal abre o case na mesma tela", (await win(page, "projects").locator(".os-case").count()) === 1);
    await shot(page, `m-${label.split(" ")[0]}-case`);

    // Voltar do cabeçalho → coleção; Voltar do navegador → tela inicial
    await win(page, "projects").locator(".os-window__back").tap();
    await page.waitForURL(/\/projetos$/);
    await settle(page, 600);
    check("Voltar do app volta à coleção", (await win(page, "projects").locator(".os-projects").count()) === 1);
    await page.goBack();
    await page.waitForURL(/\/projetos\/kavita-drones$/);
    await settle(page, 1200);
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

// ----------------------------------------------------------------- controls
// Os nove fluxos do pedido de 18/10 (controles de janela): abrir e fechar, duas janelas e fechar uma,
// minimizar/restaurar, maximizar/restaurar, alternar sobrepostas, fechar todas, celular, controles depois
// de navegar entre seções. Mais: luzes coloridas com símbolo no hover, saída animada, Esc global, reduced
// motion e a regressão do Hold to Inspect (um hold cancelado não pode engolir o clique seguinte).
if (ONLY.includes("controls")) {
  current = "controls";
  console.log("\n# controles de janela 1440×900");
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "pt-BR" });
  const page = await ctx.newPage();
  const errs = errorsOf(page);
  // Estado lido do DOM (o store só é exposto em desenvolvimento; a suíte roda também no build de produção).
  const st = () => page.evaluate(() => {
    const ws = [...document.querySelectorAll(".os-window")];
    return { focused: ws.find((w) => w.dataset.focused === "1")?.dataset.app ?? null, order: ws.sort((a, b) => Number(getComputedStyle(a).zIndex) - Number(getComputedStyle(b).zIndex)).map((w) => w.dataset.app), open: ws.map((w) => w.dataset.app) };
  });
  const light = (app, action) => win(page, app).locator(`[data-action="${action}"]`);
  const bg = (app, action) => light(app, action).evaluate((e) => getComputedStyle(e, "::before").backgroundColor);
  const toRoot = () => page.waitForURL((u) => u.pathname === "/", { timeout: 20000 }).then(() => true, () => false);
  const zTop = async (app) => Number(await win(page, app).evaluate((e) => getComputedStyle(e).zIndex));
  await page.goto(`${BASE}/`, { waitUntil: "load" });
  await settle(page, 1200);

  // 1. abrir Projetos e fechar pelo vermelho
  await page.click("#os-icon-projects");
  await urlIs(page, /\/projetos$/);
  await settle(page, 500);
  const lights = [await bg("projects", "close"), await bg("projects", "min"), await bg("projects", "max")];
  check("luzes: vermelho, amarelo, verde", lights.join("|") === "rgb(255, 95, 87)|rgb(254, 188, 46)|rgb(40, 200, 64)", lights.join(" "));
  check("símbolos escondidos sem hover", await light("projects", "close").locator("svg").evaluate((e) => getComputedStyle(e).opacity === "0"));
  await light("projects", "close").hover();
  await settle(page, 250);
  check("hover mostra os símbolos dos três", await win(page, "projects").locator(".os-window__btn svg").evaluateAll((els) => els.every((e) => getComputedStyle(e).opacity === "1")));
  check("tooltip nativo (title) nos controles", (await light("projects", "close").getAttribute("title")) === "Fechar" && (await light("projects", "min").getAttribute("title")) === "Minimizar" && (await light("projects", "max").getAttribute("title")) === "Maximizar");
  const hit = await light("projects", "close").boundingBox();
  check("área de clique ≥ 24px", hit && hit.width >= 24 && hit.height >= 24, JSON.stringify(hit));
  await light("projects", "close").click();
  await page.waitForTimeout(60);
  check("saída animada: janela ainda no DOM com data-anim=out", (await page.locator('.os-window[data-app="projects"][data-anim="out"]').count()) === 1);
  await toRoot();
  await settle(page, 500);
  check("1. Projetos fechado: sem janela, URL raiz, dock sem indicador", (await page.locator(".os-window").count()) === 0 && path(page) === "/" && (await page.getAttribute('[data-dock-id="projects"]', "data-open")) === "0" && (await st()).focused === null, path(page));
  check("1. wallpaper e olho à vista", await page.locator(".os-eye").isVisible());

  // 2. abrir Lab e fechar
  await page.click('[data-dock-id="lab"]');
  await urlIs(page, /\/lab$/);
  await settle(page, 500);
  check("2. Lab abre pela dock com indicador", (await win(page, "lab").count()) === 1 && (await page.getAttribute('[data-dock-id="lab"]', "data-open")) === "1");
  await light("lab", "close").click();
  await toRoot();
  await settle(page, 500);
  check("2. Lab fechado pelo vermelho", (await page.locator(".os-window").count()) === 0 && path(page) === "/", path(page));

  // 3. duas janelas, fechar só uma: a outra fica no lugar e assume o foco
  await page.click("#os-icon-projects");
  await urlIs(page, /\/projetos$/);
  await settle(page, 400);
  const pr = await rectOf(win(page, "projects"));
  await page.click("#os-icon-lab");
  await urlIs(page, /\/lab$/);
  await settle(page, 400);
  check("3. duas janelas abertas, Lab na frente", (await page.locator(".os-window").count()) === 2 && (await st()).order.join(",") === "projects,lab");
  await light("lab", "close").click();
  await urlIs(page, /\/projetos$/);
  await settle(page, 500);
  const pr2 = await rectOf(win(page, "projects"));
  check("3. só o Lab fechou; Projetos fica no lugar e em foco", (await win(page, "lab").count()) === 0 && (await win(page, "projects").count()) === 1 && (await st()).focused === "projects" && JSON.stringify(pr) === JSON.stringify(pr2), `${JSON.stringify(pr)} → ${JSON.stringify(pr2)}`);
  await page.click("#os-icon-lab");
  await urlIs(page, /\/lab$/);
  await settle(page, 400);
  await page.click('[data-dock-id="lab"]');
  await settle(page, 400);
  check("3. reabrir pelo ícone e clicar na dock não duplica a janela", (await win(page, "lab").count()) === 1 && (await page.locator(".os-window").count()) === 2);

  // 4. minimizar pelo amarelo e restaurar pela dock
  const lr = await rectOf(win(page, "lab"));
  await light("lab", "min").click();
  await urlIs(page, /\/projetos$/);
  await settle(page, 600);
  check("4. amarelo minimiza: oculta e inerte, dock com anel", (await win(page, "lab").evaluate((e) => getComputedStyle(e).visibility === "hidden" && e.hasAttribute("inert"))) && (await page.getAttribute('[data-dock-id="lab"]', "data-min")) === "1" && (await page.getAttribute('[data-dock-id="lab"]', "data-open")) === "1");
  await page.click('[data-dock-id="lab"]');
  await urlIs(page, /\/lab$/);
  await settle(page, 600);
  const lr2 = await rectOf(win(page, "lab"));
  check("4. dock restaura com a mesma geometria e foco", JSON.stringify(lr) === JSON.stringify(lr2) && (await st()).focused === "lab" && (await page.getAttribute('[data-dock-id="lab"]', "data-min")) === "0", `${JSON.stringify(lr)} → ${JSON.stringify(lr2)}`);

  // 5. maximizar pelo verde e restaurar
  const layer = await rectOf(page.locator(".os-windows"));
  await light("lab", "max").click();
  await page.waitForTimeout(100);
  check("5. maximizar interpola (data-zooming durante o gesto)", await win(page, "lab").evaluate((e) => e.hasAttribute("data-zooming")));
  await settle(page, 500);
  const mx = await rectOf(win(page, "lab"));
  check("5. verde maximiza na área útil (entre barra e dock)", Math.abs(mx.w - layer.w) <= 1 && Math.abs(mx.h - layer.h) <= 1 && mx.x === layer.x && mx.y === layer.y, JSON.stringify({ mx, layer }));
  check("5. sem rolagem horizontal maximizada", await page.evaluate(() => { const b = document.querySelector('.os-window[data-app="lab"] .os-window__body'); return document.documentElement.scrollWidth <= window.innerWidth && b.scrollWidth <= b.clientWidth + 1; }));
  check("5. verde vira Restaurar", (await light("lab", "max").getAttribute("title")) === "Restaurar" && (await light("lab", "max").getAttribute("aria-pressed")) === "true" && (await win(page, "lab").evaluate((e) => !e.hasAttribute("data-zooming"))));
  await light("lab", "max").click();
  await settle(page, 600);
  const rs = await rectOf(win(page, "lab"));
  check("5. restaurar volta à geometria anterior", JSON.stringify(rs) === JSON.stringify(lr2), `${JSON.stringify(lr2)} → ${JSON.stringify(rs)}`);
  await win(page, "lab").locator(".os-window__bar").dblclick({ position: { x: 300, y: 20 } });
  await settle(page, 600);
  check("5. duplo clique na barra maximiza", (await win(page, "lab").getAttribute("data-max")) === "1");
  await win(page, "lab").locator(".os-window__bar").dblclick({ position: { x: 300, y: 20 } });
  await settle(page, 600);
  check("5. duplo clique de novo restaura", (await win(page, "lab").getAttribute("data-max")) === "0" && JSON.stringify(await rectOf(win(page, "lab"))) === JSON.stringify(lr2));

  // 6. alternar entre janelas sobrepostas
  const pb = await rectOf(win(page, "projects"));
  const lb = await rectOf(win(page, "lab"));
  const z1 = { p: await zTop("projects"), l: await zTop("lab") };
  const inside = (p, r) => p[0] >= r.x && p[0] <= r.x + r.w && p[1] >= r.y && p[1] <= r.y + r.h;
  // a barra de título primeiro: dentro do corpo um clique cai num cartaz do mural e abre o dossiê
  const free = [[pb.x + pb.w / 2, pb.y + 12], [pb.x + pb.w - 12, pb.y + pb.h / 2], [pb.x + 12, pb.y + pb.h / 2], [pb.x + pb.w / 2, pb.y + pb.h - 6]].find((p) => !inside(p, lb));
  await page.mouse.click(free[0], free[1]);
  await urlIs(page, /\/projetos$/);
  await settle(page, 500);
  check("6. clicar na parte visível da janela de trás traz para frente", z1.l > z1.p && (await zTop("projects")) > (await zTop("lab")) && (await st()).focused === "projects", JSON.stringify({ z1, free }));
  await page.click('[data-dock-id="lab"]');
  await urlIs(page, /\/lab$/);
  await settle(page, 500);
  check("6. dock alterna de volta para o Lab", (await zTop("lab")) > (await zTop("projects")) && (await st()).focused === "lab");
  check("6. as duas continuam abertas e íntegras", (await page.locator('.os-window[data-min="0"]').count()) === 2 && (await win(page, "projects").locator(".os-projects").count()) === 1);

  // Esc com o foco fora da janela fecha a da frente; dentro da busca, só fecha a busca
  await page.evaluate(() => { document.activeElement?.blur?.(); document.body.focus(); });
  await page.keyboard.press("Escape");
  await urlIs(page, /\/projetos$/);
  await settle(page, 500);
  check("Esc com foco fora da janela fecha a da frente (Lab)", (await win(page, "lab").count()) === 0 && (await st()).focused === "projects");
  await page.keyboard.press("/");
  await settle(page, 300);
  await page.keyboard.press("Escape");
  await settle(page, 400);
  check("Esc na busca só fecha a busca", (await page.locator("dialog.os-search[open]").count()) === 0 && (await win(page, "projects").count()) === 1);

  // 9. controles continuam funcionando depois de navegar entre seções (case → Serviços → Voltar)
  await settle(page, 1200);
  await win(page, "projects").locator('.os-project__link[href="/projetos/terral"]').click();
  await page.waitForURL(/\/projetos\/terral$/);
  await settle(page, 800);
  await page.click('[data-dock-id="services"]');
  await urlIs(page, /\/servicos$/);
  await settle(page, 600);
  await page.goBack();
  await page.waitForURL(/\/projetos\/terral$/);
  await settle(page, 600);
  check("9. case → Serviços → Voltar: Projetos em foco com o case", (await st()).focused === "projects" && (await win(page, "projects").locator(".os-case").count()) === 1);
  await light("projects", "min").click();
  await urlIs(page, /\/servicos$/);
  await settle(page, 500);
  check("9. amarelo ainda minimiza (foco passa a Serviços)", (await win(page, "projects").getAttribute("data-min")) === "1" && (await st()).focused === "services");
  await light("services", "max").click();
  await settle(page, 600);
  check("9. verde ainda maximiza Serviços", (await win(page, "services").getAttribute("data-max")) === "1");
  await light("services", "close").click();
  await toRoot();
  await settle(page, 600);
  check("9. vermelho fecha a maximizada; a minimizada não rouba o foco", (await win(page, "services").count()) === 0 && (await st()).focused === null && path(page) === "/", path(page));

  // 7. fechar todas → só o wallpaper
  await page.click('[data-dock-id="projects"]');
  await urlIs(page, /\/projetos\/terral$/);
  await settle(page, 500);
  await page.click('[data-dock-id="settings"]');
  await settle(page, 500);
  await light("settings", "close").click();
  await settle(page, 500);
  await light("projects", "close").click();
  await toRoot();
  await settle(page, 600);
  check("7. fechar todas: só o wallpaper, nenhum app aberto, dock sem indicadores", (await page.locator(".os-window").count()) === 0 && (await st()).open.length === 0 && (await page.locator('.os-dock__item[data-open="1"]').count()) === 0 && (await page.locator(".os-eye").isVisible()));
  await shot(page, "c01-closed-all");

  // regressão: Hold to Inspect cancelado (sem click) não engole o clique seguinte em Fechar
  await page.click("#os-icon-studio");
  await urlIs(page, /\/estudio$/);
  await settle(page, 500);
  await page.evaluate(() => window.dispatchEvent(new PointerEvent("pointerdown", { button: 0, clientX: 700, clientY: 500, pointerType: "touch" })));
  await page.waitForTimeout(450);
  const inspecting = await page.evaluate(() => document.documentElement.hasAttribute("data-mode"));
  await page.evaluate(() => window.dispatchEvent(new PointerEvent("pointercancel", { pointerType: "touch" })));
  await settle(page, 200);
  await light("studio", "close").click();
  await toRoot();
  await settle(page, 500);
  check("hold cancelado não engole o clique em Fechar", inspecting && (await win(page, "studio").count()) === 0, `inspect ligou: ${inspecting}`);

  // reduced motion: fechar é imediato
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.click("#os-icon-studio");
  await urlIs(page, /\/estudio$/);
  await settle(page, 500);
  await light("studio", "close").click();
  await page.waitForTimeout(80);
  check("reduced motion: fechar é imediato", (await win(page, "studio").count()) === 0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  check("sem erros de console/hidratação", errs.length === 0, errs.slice(0, 3).join(" | "));
  await ctx.close();

  // 8. celular: Início mantém o app aberto; Fechar (×) encerra e volta à tela inicial
  console.log("\n# controles no celular 390×844");
  const mctx = await browser.newContext({ ...devices["iPhone 13"], locale: "pt-BR" });
  const mpage = await mctx.newPage();
  const merrs = errorsOf(mpage);
  await mpage.goto(`${BASE}/`, { waitUntil: "load" });
  await settle(mpage, 1200);
  await mpage.tap("#os-icon-projects");
  await mpage.waitForURL(/\/projetos$/);
  await settle(mpage, 700);
  const mclose = win(mpage, "projects").locator(".os-window__close");
  const mhome = win(mpage, "projects").locator(".os-window__home");
  const sizes = [await mclose.boundingBox(), await mhome.boundingBox()];
  check("8. cabeçalho com Início e Fechar visíveis, ≥ 44px", sizes.every((b) => b && b.width >= 44 && b.height >= 44), JSON.stringify(sizes));
  check("8. luzes do desktop não aparecem no celular", (await win(mpage, "projects").locator(".os-window__controls").isVisible()) === false);
  await mhome.tap();
  await mpage.waitForURL((u) => u.pathname === "/");
  await settle(mpage, 500);
  check("8. Início volta à tela inicial e mantém o app aberto (dock marca)", (await mpage.locator('.os-window[data-screen="1"]').count()) === 0 && (await mpage.getAttribute('[data-dock-id="projects"]', "data-open")) === "1");
  await mpage.tap('[data-dock-id="projects"]');
  await mpage.waitForURL(/\/projetos$/);
  await settle(mpage, 500);
  await settle(mpage, 2400);
  await win(mpage, "projects").locator('.os-project__link[href="/projetos/kavita-drones"]').tap();
  await mpage.waitForURL(/\/projetos\/kavita-drones$/);
  await settle(mpage, 1600);
  await mclose.tap();
  await mpage.waitForURL((u) => u.pathname === "/");
  await settle(mpage, 600);
  check("8. Fechar (×) a partir do case encerra o app: tela inicial, sem janela, dock sem indicador", (await mpage.locator(".os-window").count()) === 0 && (await mpage.getAttribute('[data-dock-id="projects"]', "data-open")) === "0");
  await mpage.tap("#os-icon-projects");
  await mpage.waitForURL(/\/projetos$/);
  await settle(mpage, 600);
  check("8. reaberto na pasta (não no case)", (await win(mpage, "projects").locator(".os-projects").count()) === 1);
  await mpage.tap('[data-dock-id="studio"]');
  await mpage.waitForURL(/\/estudio$/);
  await settle(mpage, 600);
  await win(mpage, "studio").locator(".os-window__close").tap();
  await mpage.waitForURL((u) => u.pathname === "/");
  await settle(mpage, 600);
  check("8. fechar com outro app aberto volta à tela inicial (Projetos segue aberto atrás)", (await mpage.locator('.os-window[data-screen="1"]').count()) === 0 && (await win(mpage, "projects").count()) === 1 && (await win(mpage, "studio").count()) === 0);
  check("8. sem erros de console/hidratação", merrs.length === 0, merrs.slice(0, 3).join(" | "));
  await shot(mpage, "c02-mobile-home-after-close");
  await mctx.close();
}

// ----------------------------------------------------------------- projects
// Projetos como THE BOUNTY COLLECTION: 31 cartazes no mural (um principal, vizinhos em degraus, distantes
// ocultos e sem imagem), cartaz íntegro (faixa/nome dentro do papel), filtros compactos, Kavita só com o link
// interno, navegação por setas/Home/End/roda/arraste/fita/"ver todos", hover (inclinação), o voo do dossiê
// (cartaz se desprende, outros recuam, folha com o cartaz à esquerda e o case ao lado), Esc e "voltar" revertem
// o voo mantendo o ponto da coleção, link direto já aberto, maximizar/restaurar, reduced motion, EN e celular.
if (ONLY.includes("projects")) {
  current = "projects";
  console.log("\n# Projetos: THE BOUNTY COLLECTION 1440×900");
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "pt-BR" });
  const page = await ctx.newPage();
  const errs = errorsOf(page);
  await page.goto(`${BASE}/`, { waitUntil: "load" });
  await settle(page, 1000);
  await page.click("#os-icon-projects");
  await urlIs(page, /\/projetos$/);
  let moving = false;
  for (let i = 0; i < 25 && !moving; i++) {
    await page.waitForTimeout(60);
    moving = await page.evaluate(() => [...document.querySelectorAll(".bounty__paper")].some((p) => { const t = getComputedStyle(p).transform; return t !== "none" && t !== "matrix(1, 0, 0, 1, 0, 0)"; }));
  }
  check("entrada: cartazes chegam voando (transform em curso)", moving);
  await settle(page, 2600);
  const mural = win(page, "projects").locator(".bounty");
  const slots = mural.locator(".bounty__slot");
  const activeSlug = () => mural.locator('.bounty__slot[data-active="1"]').getAttribute("data-slug");
  const centered = () => mural.locator('.bounty__slot[data-active="1"]').evaluate((e) => { const r = e.getBoundingClientRect(); const s = e.closest(".bounty__stage").getBoundingClientRect(); return Math.abs(r.left + r.width / 2 - (s.left + s.width / 2)) < 3; });
  check("31 cartazes no mural, um principal, grade antiga ausente", (await slots.count()) === 31 && (await mural.locator('.bounty__slot[data-active="1"]').count()) === 1 && (await page.locator(".os-projects__board, .os-project__sheet").count()) === 0);
  check("cartaz principal: faixa, imagem, nome, identificador, selo e frase", await mural.locator('.bounty__slot[data-active="1"]').evaluate((e) => ["bounty__tier", "bounty__img", "bounty__name", "bounty__id", "bounty__seal", "bounty__line"].every((c) => e.querySelector("." + c))));
  check("faixa e nome cabem no papel (sem estourar)", await mural.locator('.bounty__slot[data-active="1"] .bounty__sheet').evaluate((s) => { const r = s.getBoundingClientRect(); return [...s.querySelectorAll(".bounty__tier, .bounty__name, .bounty__line")].every((el) => { const b = el.getBoundingClientRect(); return b.right <= r.right + 1 && el.scrollWidth <= el.clientWidth + 1; }); }));
  check("vizinhos parcialmente visíveis, distantes ocultos", (await mural.locator('.bounty__slot[data-far="0"]').count()) === 7 && (await mural.locator('.bounty__slot[data-far="1"]').count()) === 24 && (await mural.locator('.bounty__slot[data-d="1"]').evaluate((e) => getComputedStyle(e).visibility === "visible" && Number(getComputedStyle(e).opacity) < 1)));
  check("só os cartazes próximos carregam imagem", (await mural.locator(".bounty__img:not(.bounty__img--empty)").count()) <= 10);
  check("filtros compactos (7) com contagem e ativo marcado", (await mural.locator(".bounty__pill").count()) === 7 && (await mural.locator('.bounty__pill[aria-pressed="true"]').innerText()).includes("TODOS") && (await mural.locator(".bounty__pill").first().evaluate((e) => e.getBoundingClientRect().height <= 30)));
  check("Kavita: só o link interno do case, sem link externo", await mural.locator('.bounty__slot[data-slug^="kavita"] a').evaluateAll((as) => as.length === 2 && as.every((a) => a.getAttribute("href").startsWith("/projetos/kavita") && !a.target)));
  check("seis projetos de turismo no mural", (await mural.locator('.bounty__slot[data-slug="debby-tour"], .bounty__slot[data-slug="ace-diving-miami"], .bounty__slot[data-slug="legends-of-hollywood-tours"], .bounty__slot[data-slug="said-zanzibar"], .bounty__slot[data-slug="mabrouk-zanzibar"], .bounty__slot[data-slug="serengeti-wildlife-safaris"]').count()) === 6);
  check("principal centrado", await centered());

  // navegação: teclado, roda, fita, ver todos, arraste
  await mural.locator(".bounty__stage").focus();
  await page.keyboard.press("ArrowRight");
  await settle(page, 300);
  await page.keyboard.press("ArrowRight");
  await settle(page, 900);
  check("setas movem o principal (→ → = 03) e o contador acompanha", (await activeSlug()) === "atelier-vertex" && (await mural.locator(".bounty__count").innerText()).startsWith("03") && (await centered()));
  await page.keyboard.press("End");
  await settle(page, 900);
  check("End vai ao último (31)", (await activeSlug()) === "imperio-cafe");
  await page.keyboard.press("Home");
  await settle(page, 900);
  await page.mouse.move(720, 480);
  await page.mouse.wheel(0, 140);
  await settle(page, 800);
  check("roda do mouse avança", (await activeSlug()) === "terral");
  await mural.locator(".bounty__tick").nth(9).click();
  await settle(page, 900);
  check("fita de posição salta direto (10 = Ace Diving)", (await activeSlug()) === "ace-diving-miami" && /ACE/i.test(await mural.locator('.bounty__tick[aria-current="true"]').getAttribute("aria-label")));
  await mural.locator(".bounty__all-btn").click();
  await settle(page, 400);
  check("ver todos: grade com os 31", (await mural.locator(".bounty__all-item").count()) === 31);
  await mural.locator(".bounty__all-item").nth(13).click();
  await settle(page, 900);
  check("ver todos salta e fecha (14 = Serengeti)", (await activeSlug()) === "serengeti-wildlife-safaris" && (await mural.locator(".bounty__all").count()) === 0);
  const stage = await rectOf(mural.locator(".bounty__stage"));
  await page.mouse.move(stage.x + stage.w * 0.6, stage.y + stage.h / 2);
  await page.mouse.down();
  await page.mouse.move(stage.x + stage.w * 0.3, stage.y + stage.h / 2, { steps: 8 });
  await page.mouse.up();
  await settle(page, 900);
  check("arrastar para a esquerda avança (distância vira passos)", ["as-copas", "age-of-dragons"].includes(await activeSlug()), await activeSlug());
  const act = mural.locator('.bounty__slot[data-active="1"] .bounty__link');
  const ab = await act.boundingBox();
  await page.mouse.move(ab.x + ab.width * 0.75, ab.y + ab.height * 0.3);
  await settle(page, 400);
  check("hover inclina o cartaz ao cursor e o levanta", await act.locator(".bounty__paper").evaluate((e) => e.style.getPropertyValue("--ry") !== "" && getComputedStyle(e).getPropertyValue("--lift").trim() === "34px"));
  await page.mouse.move(stage.x + 20, stage.y + 20);

  // filtros
  await mural.locator(".bounty__pill").nth(3).click();
  await settle(page, 1200);
  check("filtro Turismo & guias: 6 cartazes e contador 06", (await slots.count()) === 6 && (await mural.locator(".bounty__count").innerText()).includes("06") && (await mural.locator('.bounty__pill[aria-pressed="true"]').innerText()).includes("TURISMO"));
  await mural.locator(".bounty__pill").nth(2).click();
  await settle(page, 1200);
  check("filtro Demos: sem clientes, com Said", (await mural.locator('.bounty__slot[data-slug="said-zanzibar"]').count()) === 1 && (await mural.locator('.bounty__slot[data-slug^="kavita"]').count()) === 0);
  await mural.locator(".bounty__pill").nth(0).click();
  await settle(page, 1200);

  // abrir: o voo e o dossiê
  await mural.locator(".bounty__tick").nth(8).click();
  await settle(page, 900);
  const before = await activeSlug();
  await mural.locator('.bounty__slot[data-active="1"] .bounty__link').click();
  await page.waitForTimeout(260);
  const mid = await mural.evaluate((r) => { const f = r.querySelector(".bounty__flyer"); return { phase: r.dataset.phase, flyer: !!f && f.dataset.visible === "1" && getComputedStyle(f).transform !== "none", dim: Number(getComputedStyle(r.querySelector(".bounty__track")).opacity) < 1 }; });
  check("clique: o cartaz se desprende (voador em voo) e os outros recuam", mid.phase === "opening" && mid.flyer && mid.dim, JSON.stringify(mid));
  await page.waitForURL(/\/projetos\/debby-tour$/);
  await settle(page, 2000);
  check("dossiê: cartaz à esquerda, case ao lado, URL do case e título da janela", (await mural.evaluate((r) => r.dataset.phase === "open" && !!r.querySelector(".bounty__dossier-slot .bounty__paper") && !!r.querySelector(".bounty__case .os-case"))) && /DEBBY/i.test(await win(page, "projects").locator(".os-window__title").innerText()));
  check("dossiê: seções do case e botão do site (URL válida)", (await mural.locator(".bounty__case .os-case__section").count()) >= 3 && (await mural.locator('.bounty__case a[href="https://debby-tour.vercel.app"]').count()) >= 1);
  check("dossiê rola por dentro; véu sobre o mural", (await mural.locator(".bounty__dossier").evaluate((e) => { e.scrollTop = 400; return e.scrollTop > 100; })) && (await mural.locator(".bounty__veil").evaluate((e) => getComputedStyle(e).opacity === "1")));
  await page.keyboard.press("Escape");
  await page.waitForURL(/\/projetos$/);
  await settle(page, 1400);
  check("Esc fecha o dossiê, reverte o voo e mantém o ponto da coleção", (await mural.getAttribute("data-phase")) === "closed" && (await activeSlug()) === before && (await mural.locator(".bounty__dossier").count()) === 0 && (await win(page, "projects").count()) === 1);

  // link direto e Kavita sem navegação externa
  await page.goto(`${BASE}/projetos/kavita-drones`, { waitUntil: "load" });
  await settle(page, 1500);
  check("link direto: dossiê já aberto sobre o mural; Kavita sem link externo", (await mural.getAttribute("data-phase")) === "open" && (await mural.locator(".bounty__case .os-case").count()) === 1 && (await mural.locator('.bounty__case .os-case__links a, .bounty__case a[href^="http"][href*="kavita"]').count()) === 0 && (await activeSlug()) === "kavita-drones");
  await mural.locator(".bounty__close").click();
  await page.waitForURL(/\/projetos$/);
  await settle(page, 1400);
  check("Voltar à coleção fecha o dossiê", (await mural.getAttribute("data-phase")) === "closed");

  // a janela muda de tamanho: o mural acompanha
  const w0 = await mural.locator('.bounty__slot[data-active="1"]').evaluate((e) => e.getBoundingClientRect().width);
  await win(page, "projects").locator('[data-action="max"]').click();
  await settle(page, 900);
  const w1 = await mural.locator('.bounty__slot[data-active="1"]').evaluate((e) => e.getBoundingClientRect().width);
  check("maximizar: cartazes crescem com a janela e seguem centrados", w1 > w0 && (await centered()), `${Math.round(w0)} → ${Math.round(w1)}`);
  await win(page, "projects").locator('[data-action="max"]').click();
  await settle(page, 900);
  check("restaurar: volta ao tamanho anterior", Math.abs((await mural.locator('.bounty__slot[data-active="1"]').evaluate((e) => e.getBoundingClientRect().width)) - w0) <= 1);

  // reduced motion
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${BASE}/projetos`, { waitUntil: "load" });
  await settle(page, 800);
  check("reduced motion: mural pronto, sem animação", await mural.locator('.bounty__slot[data-active="1"] .bounty__paper').evaluate((e) => ["none", "matrix(1, 0, 0, 1, 0, 0)"].includes(getComputedStyle(e).transform)));
  await mural.locator('.bounty__slot[data-active="1"] .bounty__link').click();
  await page.waitForURL(/\/projetos\/kavita-drones$/);
  await settle(page, 500);
  check("reduced motion: dossiê abre direto", (await mural.getAttribute("data-phase")) === "open");
  await page.emulateMedia({ reducedMotion: "no-preference" });

  // EN
  await page.goto(`${BASE}/en/work`, { waitUntil: "load" });
  await settle(page, 1500);
  check("EN: faixa, selo e coleção traduzidos", (await mural.locator('.bounty__slot[data-active="1"] .bounty__tier').innerText()) === "MOST WANTED" && (await mural.locator('.bounty__slot[data-active="1"] .bounty__seal').innerText()) === "CLIENT PROJECT" && (await mural.locator(".bounty__eyebrow").first().innerText()).includes("BOUNTY COLLECTION"));
  check("sem erros de console/hidratação", errs.length === 0, errs.slice(0, 3).join(" | "));
  await shot(page, "p01-mural-en");
  await ctx.close();

  console.log("\n# mural no celular 390×844");
  const mctx = await browser.newContext({ ...devices["iPhone 13"], locale: "pt-BR" });
  const mpage = await mctx.newPage();
  const merrs = errorsOf(mpage);
  await mpage.goto(`${BASE}/projetos`, { waitUntil: "load" });
  await settle(mpage, 2800);
  const mm = win(mpage, "projects").locator(".bounty");
  const mact = mm.locator('.bounty__slot[data-active="1"]');
  check("um cartaz inteiro na tela, vizinho espiando", (await mact.evaluate((e) => { const r = e.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.width > innerWidth * 0.6; })) && (await mm.locator('.bounty__slot[data-d="1"]').evaluate((e) => { const r = e.getBoundingClientRect(); return r.left < innerWidth && r.right > innerWidth; })));
  check("sem rolagem horizontal; pé acima da dock", await mpage.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.querySelector(".bounty__foot").getBoundingClientRect().bottom <= document.querySelector(".os-dock ul").getBoundingClientRect().top + 1));
  const st = await rectOf(mm.locator(".bounty__stage"));
  await mpage.mouse.move(st.x + st.w * 0.7, st.y + st.h / 2);
  await mpage.mouse.down();
  await mpage.mouse.move(st.x + st.w * 0.25, st.y + st.h / 2, { steps: 8 });
  await mpage.mouse.up();
  await settle(mpage, 900);
  check("swipe avança um cartaz", (await mact.getAttribute("data-slug")) === "terral");
  await mact.locator(".bounty__link").tap();
  await mpage.waitForURL(/\/projetos\/terral$/);
  await settle(mpage, 2000);
  check("toque abre o dossiê: cartaz no topo, case abaixo", (await mm.getAttribute("data-phase")) === "open" && (await mm.locator(".bounty__dossier-slot .bounty__paper").count()) === 1 && (await mm.locator(".bounty__case .os-case").count()) === 1);
  check("botão de voltar não cobre o cartaz", await mm.evaluate((r) => r.querySelector(".bounty__close").getBoundingClientRect().bottom <= r.querySelector(".bounty__dossier-slot").getBoundingClientRect().top + 1));
  await mm.locator(".bounty__close").tap();
  await mpage.waitForURL(/\/projetos$/);
  await settle(mpage, 1400);
  check("fecha e continua no mesmo cartaz", (await mm.getAttribute("data-phase")) === "closed" && (await mact.getAttribute("data-slug")) === "terral");
  check("sem erros de console/hidratação", merrs.length === 0, merrs.slice(0, 3).join(" | "));
  await shot(mpage, "p02-mural-mobile");
  await mctx.close();
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
