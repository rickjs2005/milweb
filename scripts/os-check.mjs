/**
 * MilWeb OS — testes de fluxo (Playwright, Chromium).
 *
 *   node scripts/os-check.mjs [--base http://127.0.0.1:3100] [--out .audit/os] [--only desktop,mobile,resize]
 *
 * Cobre os riscos reais do shell: histórico/rotas (link direto, Voltar,
 * recarregar), estado das janelas (abrir, focar, minimizar, restaurar,
 * maximizar, fechar, arrastar com clamp, teclado), os controles de janela
 * (grupo `controls`: luzes, saída animada, Esc global, celular, Hold to
 * Inspect), o telefone (grupos `mobile` e `phones`: launcher, dock de redes,
 * telas cheias, histórico sem entradas repetidas, Sobre/Ajustes sem URL),
 * troca de modo (desktop ↔ celular preservando o case) e contato a uma ação. Emulação de navegador, não aparelho físico: cobre a lógica,
 * não a percepção.
 */
import { chromium, devices } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const opt = (k, d) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : d;
};
const BASE = opt("--base", "http://127.0.0.1:3100").replace(/\/$/, "");
const OUT = opt("--out", ".audit/os");
const ONLY = opt("--only", "desktop,controls,projects,mobile,phones,resize,simple,theme,boot,share").split(",");
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
    if (/hydrat/i.test(t)) errs.push(`hydration: ${t.slice(t.indexOf("<SearchDialog") > 0 ? t.indexOf("<SearchDialog") : 0, (t.indexOf("<SearchDialog") > 0 ? t.indexOf("<SearchDialog") : 0) + 1500)}`);
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
  check("olho presente como imagem (fallback estático, fundo CSS do tema)", await page.evaluate(() => /eye-(gojo|obito)\.webp/.test(getComputedStyle(document.querySelector(".os-eye__still")).backgroundImage)));
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

  // redes do estúdio ao redor do olho (HUD social)
  await settle(page, 1600); // circuitos se desenham até ~1,9 s depois do load
  const hud = await page.evaluate(() => {
    const h = document.querySelector(".os-hud");
    const eye = document.querySelector(".os-eye").getBoundingClientRect();
    const cx = eye.left + eye.width / 2;
    const p = (k) => h.querySelector(`.os-hud__panel[data-social="${k}"]`);
    const r = (k) => p(k).getBoundingClientRect();
    const hit = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    const others = [".os-icons", ".os-sign", ".os-dock ul", ".os-topbar"].map((sel) => document.querySelector(sel).getBoundingClientRect());
    const panels = ["linkedin", "github", "instagram"].map(r);
    const lines = [...h.querySelectorAll(".os-hud__line:not(.os-hud__line--glow)")];
    return {
      sides: r("linkedin").right < cx && r("github").left > cx && r("instagram").left > cx && r("github").bottom <= r("instagram").top,
      links: ["linkedin", "github", "instagram"].every((k) => p(k).target === "_blank" && p(k).rel.includes("noopener") && p(k).rel.includes("noreferrer")),
      hrefs: p("github").href === "https://github.com/rickjs2005" && p("instagram").href === "https://www.instagram.com/milweb01/" && /^https:\/\/www\.linkedin\.com\/in\//.test(p("linkedin").href),
      clear: panels.every((b) => b.left >= 0 && b.right <= innerWidth && b.top >= 0 && b.bottom <= innerHeight && others.every((o) => !hit(b, o))),
      wires: getComputedStyle(h.querySelector(".os-hud__wires")).pointerEvents === "none" && lines.length === 3 && lines.every((l) => l.getAttribute("d")?.startsWith("M") && parseFloat(getComputedStyle(l).strokeDashoffset) < 0.01),
      micro: ["linkedin", "github", "instagram"].every((k) => p(k).querySelector(".os-hud__micro")?.textContent.trim().length > 8),
    };
  });
  check("HUD social: LinkedIn à esquerda do olho, GitHub sobre Instagram à direita", hud.sides, JSON.stringify(hud));
  check("HUD social: links reais em nova aba (noopener noreferrer) e microtextos", hud.links && hud.hrefs && hud.micro);
  check("HUD social: painéis dentro da viewport, sem cobrir ícones, assinatura, dock ou barra", hud.clear);
  check("HUD social: circuitos em SVG decorativo (pointer-events none), desenhados até o olho", hud.wires);
  const ghPanel = page.locator('.os-hud__panel[data-social="github"]');
  await ghPanel.hover();
  await settle(page, 350);
  check("HUD social: hover eleva o cartão e dispara um pulso no circuito", (await ghPanel.evaluate((e) => getComputedStyle(e.querySelector(".os-hud__card")).transform !== "none")) && (await page.evaluate(() => document.querySelector('.os-hud__wire[data-social="github"]')?.dataset.hot === "1")));
  const [popup] = await Promise.all([ctx.waitForEvent("page", { timeout: 8000 }).catch(() => null), ghPanel.click()]);
  check("HUD social: clique abre o GitHub em nova aba", !!popup && popup.url().startsWith("https://github.com/rickjs2005"), popup ? popup.url() : "sem nova aba");
  if (popup) await popup.close();
  await page.mouse.move(700, 620); // sobre o olho (sem ponteiro): longe da dock
  await settle(page, 300);
  await page.locator(".os-topbar__brand").focus();
  let reached = false;
  for (let i = 0; i < 14 && !reached; i++) {
    await page.keyboard.press("Tab");
    reached = await page.evaluate(() => document.activeElement?.classList.contains("os-hud__panel"));
  }
  check("HUD social: painéis alcançáveis pelo teclado (Tab) com foco visível", reached && (await page.evaluate(() => getComputedStyle(document.activeElement.querySelector(".os-hud__card")).outlineStyle !== "none")));
  await page.mouse.click(700, 620);
  check("HUD social: olho continua sem interceptar o ponteiro", await page.evaluate(() => getComputedStyle(document.querySelector(".os-eye")).pointerEvents === "none"));

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
  for (const [w, h] of [[1920, 1080], [1366, 768]]) {
    console.log(`\n# desktop ${w}×${h} · HUD social`);
    const c = await browser.newContext({ viewport: { width: w, height: h }, locale: "pt-BR" });
    const pg = await c.newPage();
    await pg.goto(`${BASE}/`, { waitUntil: "load" });
    await settle(pg, 2600);
    const ok = await pg.evaluate(() => {
      const h = document.querySelector(".os-hud");
      const eye = document.querySelector(".os-eye").getBoundingClientRect();
      const cx = eye.left + eye.width / 2;
      const r = (k) => h.querySelector(`.os-hud__panel[data-social="${k}"]`).getBoundingClientRect();
      const hit = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
      const others = [".os-icons", ".os-sign", ".os-dock ul", ".os-topbar"].map((sel) => document.querySelector(sel).getBoundingClientRect());
      const panels = ["linkedin", "github", "instagram"].map(r);
      const lines = [...h.querySelectorAll(".os-hud__line:not(.os-hud__line--glow)")];
      return r("linkedin").right < cx && r("github").left > cx && panels.every((b) => b.left >= 0 && b.right <= innerWidth && others.every((o) => !hit(b, o))) && lines.length === 3 && lines.every((l) => parseFloat(getComputedStyle(l).strokeDashoffset) < 0.01);
    });
    check(`HUD social em ${w}×${h}: lados certos, sem sobreposição, circuitos desenhados`, ok);
    await c.close();
  }

  console.log("\n# desktop 1440×900 · prefers-reduced-motion");
  const rctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "pt-BR", reducedMotion: "reduce" });
  const rpage = await rctx.newPage();
  await rpage.goto(`${BASE}/`, { waitUntil: "load" });
  await settle(rpage, 2500);
  check("reduced motion: olho estático (imagem), sem WebGL", (await rpage.getAttribute(".os-eye", "data-state")) === "still" && (await rpage.evaluate(() => typeof window.__mwOsEye === "undefined")));
  check("reduced motion: HUD social pronto, sem animação nem pulsos", await rpage.evaluate(() => [...document.querySelectorAll(".os-hud__panel")].every((p) => getComputedStyle(p).opacity === "1" && getComputedStyle(p).animationName === "none") && [...document.querySelectorAll(".os-hud__pulse")].every((p) => getComputedStyle(p).display === "none")));
  await rctx.close();

  // ajuste "Reduzir movimento" salvo: mesmo resultado
  const pctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "pt-BR" });
  const ppage = await pctx.newPage();
  await ppage.goto(`${BASE}/`, { waitUntil: "load" });
  await ppage.evaluate(() => localStorage.setItem("milweb-os:prefs", JSON.stringify({ theme: "obito", motion: "reduce", simple: false })));
  await ppage.reload({ waitUntil: "load" });
  await settle(ppage, 2500);
  check("Ajustes › Reduzir: olho estático", (await ppage.getAttribute(".os-eye", "data-state")) === "still" && (await ppage.getAttribute("html", "data-os-motion")) === "reduce");
  await pctx.close();
}

// ------------------------------------------------------------------- mobile
// Telefone (revisão 9): a tela inicial é um launcher — status, olho como papel de parede, grade de 8 ícones
// (4 colunas) e a dock de redes (WhatsApp, LinkedIn, GitHub, Instagram). Nada de lema/descrição/botões à vista.
// Cada app abre em tela cheia a partir do ícone; fechar volta à home pelo histórico (sem entradas repetidas) e
// devolve o foco ao ícone; Sobre/Ajustes (sem URL) respondem ao Voltar do navegador por entrada própria.
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
    const canBack = () => page.evaluate(() => (typeof navigation !== "undefined" ? navigation.canGoBack : null));
    check("shell = mobile", (await page.getAttribute("html", "data-shell")) === "mobile");
    check("sem rolagem horizontal", await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    check("tela inicial sem app aberto", (await page.locator('.os-window[data-screen="1"]').count()) === 0 && (await page.locator(".os-window").count()) === 0);
    const home = await page.evaluate(() => {
      const r = (s) => document.querySelector(s)?.getBoundingClientRect();
      const vis = (s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== "none" && e.getBoundingClientRect().width > 1; };
      const tiles = [...document.querySelectorAll(".os-launch")];
      const xs = tiles.slice(0, 4).map((t) => Math.round(t.getBoundingClientRect().left));
      const labels = tiles.map((t) => t.querySelector(".os-launch__label"));
      const grid = r(".os-launcher__apps"), status = r(".os-launcher__status"), eye = r(".os-eye"), dock = r(".os-mdock ul");
      const sign = r(".os-sign");
      return {
        tiles: tiles.length,
        ids: tiles.map((t) => t.id).join(","),
        fourCols: xs.length === 4 && new Set(xs).size === 4 && xs.every((x, i) => i === 0 || x > xs[i - 1]) && Math.round(tiles[4].getBoundingClientRect().left) === xs[0],
        labelPx: Math.min(...labels.map((l) => parseFloat(getComputedStyle(l).fontSize))),
        labelCut: labels.some((l) => l.scrollWidth > l.clientWidth + 1),
        iconPx: Math.min(...tiles.map((t) => t.querySelector(".os-micon").getBoundingClientRect().width)),
        small: tiles.filter((t) => { const b = t.getBoundingClientRect(); return b.width < 48 || b.height < 48; }).length,
        heroHidden: !!sign && sign.width <= 1 && sign.height <= 1 && !!document.querySelector("h1.os-sign__motto"),
        noDesktopBits: !vis(".os-hud") && !vis(".os-dock") && !vis(".os-icons") && !vis(".os-topbar"),
        eyeBetween: !!eye && eye.top >= status.bottom - 1 && eye.bottom <= grid.top + 2 && eye.width > 0,
        eyeImg: /eye-(gojo|obito)-mobile\.webp/.test(getComputedStyle(document.querySelector(".os-eye__still")).backgroundImage),
        eyeNoPointer: getComputedStyle(document.querySelector(".os-eye")).pointerEvents === "none",
        gridAboveDock: grid.bottom <= dock.top + 1,
        dockIn: dock.bottom <= innerHeight + 1 && dock.left >= 0 && dock.right <= innerWidth,
        // as quatro redes são links; o quinto item é o sol/lua do tema (botão, revisão 10)
        dockHrefs: [...document.querySelectorAll("a.os-mdock__item")].map((a) => a.href),
        dockRel: [...document.querySelectorAll("a.os-mdock__item")].every((a) => a.target === "_blank" && a.rel.includes("noopener") && a.rel.includes("noreferrer")),
        dockTheme: !!document.querySelector('button.os-mdock__item.os-mdock__theme[role="switch"]') && document.querySelectorAll(".os-mdock__item").length === 5,
        dockSmall: [...document.querySelectorAll(".os-mdock__item")].filter((a) => { const b = a.getBoundingClientRect(); return b.width < 48 || b.height < 48; }).length,
        dockLabels: [...document.querySelectorAll(".os-mdock__label")].map((l) => l.textContent.trim()).join(","),
        noScroll: document.querySelector(".os-desktop").scrollHeight <= document.querySelector(".os-desktop").clientHeight + 1,
      };
    });
    check("launcher: 8 ícones (Projetos, Estúdio, Lab, Serviços, Sobre, Contato, Ajustes, Buscar) em 4 colunas", home.tiles === 8 && home.fourCols && home.ids === "os-launch-projects,os-launch-studio,os-launch-lab,os-launch-services,os-launch-about,os-launch-contact,os-launch-settings,os-launch-search", home.ids);
    check("launcher: ícones ≥ 56 px, rótulos ≥ 11 px sem cortes, item inteiro ≥ 48 px", home.iconPx >= 56 && home.labelPx >= 11 && !home.labelCut && home.small === 0, JSON.stringify({ icon: home.iconPx, label: home.labelPx, cut: home.labelCut, small: home.small }));
    check("sem lema, descrição, botões, HUD, dock do desktop ou barra à vista (h1 continua no DOM)", home.heroHidden && home.noDesktopBits);
    check("olho como papel de parede entre o status e a grade, imagem pronta, sem ponteiro", home.eyeBetween && home.eyeImg && home.eyeNoPointer);
    check("dock de redes: WhatsApp, LinkedIn, GitHub, Instagram em nova aba segura + sol/lua do tema, ≥ 48 px, dentro da tela, abaixo da grade", home.dockHrefs.length === 4 && home.dockHrefs[0].startsWith("https://wa.me/") && /linkedin\.com/.test(home.dockHrefs[1]) && /github\.com/.test(home.dockHrefs[2]) && /instagram\.com/.test(home.dockHrefs[3]) && home.dockRel && home.dockTheme && home.dockSmall === 0 && home.dockIn && home.gridAboveDock, JSON.stringify({ hrefs: home.dockHrefs, labels: home.dockLabels }));
    check("tela inicial cabe sem rolar", home.noScroll);
    await shot(page, `m-${label.split(" ")[0]}-home`);

    // tocar no ícone → tela do app + URL; a dock some atrás; fechar volta à home pelo histórico
    const back0 = await canBack();
    await page.tap("#os-launch-projects");
    await page.waitForURL(/\/projetos$/);
    await settle(page, 700);
    check("tocar em Projetos abre a tela (/projetos)", (await win(page, "projects").getAttribute("data-screen")) === "1");
    const screen = await rectOf(win(page, "projects"));
    const vp = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight }));
    check("tela ocupa a viewport inteira", screen.x === 0 && screen.y === 0 && screen.w === vp.w && Math.abs(screen.h - vp.h) <= 2, JSON.stringify({ screen, vp }));
    const bar = await page.evaluate(() => {
      const w = document.querySelector('.os-window[data-app="projects"]');
      const b = w.querySelector(".os-window__back").getBoundingClientRect(), c = w.querySelector(".os-window__close").getBoundingClientRect();
      const dock = document.querySelector(".os-mdock ul").getBoundingClientRect();
      const hit = document.elementFromPoint(dock.left + dock.width / 2, dock.top + dock.height / 2);
      return { back: b.width >= 48 && b.height >= 48, backLabel: w.querySelector(".os-window__back span").textContent.trim(), close: c.width >= 48 && c.height >= 48, title: w.querySelector(".os-window__title").textContent.trim(), dockCovered: !!hit && !!hit.closest(".os-window"), noHome: !w.querySelector(".os-window__home"), noControls: getComputedStyle(w.querySelector(".os-window__controls")).display === "none" };
    });
    check("cabeçalho: Voltar (Início) e Fechar ≥ 48 px, título, sem luzes/arraste; a dock fica atrás da tela", bar.back && bar.backLabel.toUpperCase() === "INÍCIO" && bar.close && bar.title.toUpperCase() === "PROJETOS" && bar.dockCovered && bar.noHome && bar.noControls, JSON.stringify(bar));
    await win(page, "projects").locator(".os-window__close").tap();
    await page.waitForURL((u) => u.pathname === "/");
    await settle(page, 600);
    const back1 = await canBack();
    check("Fechar volta à home sem entrada repetida no histórico (Voltar do navegador fica como antes)", (await page.locator('.os-window[data-screen="1"]').count()) === 0 && (back0 === null || back1 === back0), `canGoBack ${back0} → ${back1}`);
    check("Fechar devolve o foco ao ícone de Projetos", await page.evaluate(() => document.activeElement?.id === "os-launch-projects"));

    // reabrir → Voltar do navegador (app continua aberto, escondido) → reabrir de novo
    await page.tap("#os-launch-projects");
    await page.waitForURL(/\/projetos$/);
    await settle(page, 600);
    check("reabrir funciona", (await win(page, "projects").getAttribute("data-screen")) === "1");
    await page.goBack();
    await page.waitForURL((u) => u.pathname === "/");
    await settle(page, 700);
    check("Voltar do navegador esconde a tela e mostra a home (app continua aberto no store)", (await page.locator('.os-window[data-screen="1"]').count()) === 0 && (await page.getAttribute('[data-dock-id="projects"]', "data-open")) === "1");
    await page.tap("#os-launch-projects");
    await page.waitForURL(/\/projetos$/);
    await settle(page, 2600);
    check("reabrir depois do Voltar funciona", (await win(page, "projects").getAttribute("data-screen")) === "1");

    // pasta → case; Voltar do cabeçalho dentro do case volta à coleção pelo histórico
    await win(page, "projects").locator('.os-project__link[href="/projetos/kavita-drones"]').tap();
    await page.waitForURL(/\/projetos\/kavita-drones$/);
    await settle(page, 1800);
    check("tocar no cartaz principal abre o case na mesma tela", (await win(page, "projects").locator(".os-case").count()) === 1);
    check("no case, o Voltar do cabeçalho aponta para Projetos", (await win(page, "projects").locator(".os-window__back span").innerText()) === "PROJETOS");
    await shot(page, `m-${label.split(" ")[0]}-case`);
    await win(page, "projects").locator(".os-window__back").tap();
    await page.waitForURL(/\/projetos$/);
    await settle(page, 600);
    check("Voltar do app volta à coleção", (await win(page, "projects").locator(".os-projects").count()) === 1);
    check("…pelo histórico (o case fica no Avançar), não empilhando a coleção de novo", (await page.evaluate(() => (typeof navigation !== "undefined" ? navigation.canGoForward : true))) === true);
    await page.goBack();
    await page.waitForURL((u) => u.pathname === "/");
    await settle(page, 600);
    check("Voltar do navegador na raiz do app volta à home", (await page.locator('.os-window[data-screen="1"]').count()) === 0);

    // Sobre e Ajustes (sem URL): entrada própria no histórico; o Voltar do navegador fecha
    await page.tap("#os-launch-about");
    await settle(page, 700);
    check("Sobre abre em tela cheia sem mudar a URL, com o fundador, base, foco e canais", (await win(page, "about").getAttribute("data-screen")) === "1" && path(page) === "/" && (await win(page, "about").locator(".os-about__name").innerText()).includes("RICK") && (await win(page, "about").locator('.os-about__channels a[href^="https://wa.me/"]').count()) === 1);
    check("Sobre: links sem hover (linhas de 52 px) e em nova aba segura", await page.evaluate(() => [...document.querySelectorAll(".os-about__row")].every((a) => a.getBoundingClientRect().height >= 48) && [...document.querySelectorAll('.os-about__row[target="_blank"]')].every((a) => a.rel.includes("noopener"))));
    await page.goBack();
    await settle(page, 700);
    check("Voltar do navegador fecha Sobre", (await page.locator('.os-window[data-screen="1"]').count()) === 0 && path(page) === "/");
    await page.tap("#os-launch-settings");
    await settle(page, 700);
    const chips = await page.evaluate(() => [...document.querySelectorAll('.os-window[data-app="settings"] .os-chip')].filter((c) => c.getBoundingClientRect().width > 0).map((c) => c.getBoundingClientRect().height));
    check("Ajustes abre em tela cheia com opções ≥ 48 px e sem 'reorganizar janelas'", (await win(page, "settings").getAttribute("data-screen")) === "1" && chips.length > 0 && chips.every((h) => h >= 48) && (await page.evaluate(() => getComputedStyle(document.querySelector('.os-window[data-app="settings"] .os-settings__row:has(> .os-chip:only-child)')).display === "none")));
    await win(page, "settings").locator(".os-window__close").tap();
    await settle(page, 700);
    check("Fechar Ajustes volta à home e não deixa entrada no histórico", (await page.locator('.os-window[data-screen="1"]').count()) === 0 && (back0 === null || (await canBack()) === back0));

    // busca pelo launcher; contato pelo launcher com WhatsApp real
    await page.tap("#os-launch-search");
    await settle(page, 500);
    check("Buscar abre a busca", await page.evaluate(() => !!document.querySelector("dialog.os-search[open]")));
    await page.keyboard.press("Escape");
    await settle(page, 300);
    await page.tap("#os-launch-contact");
    await urlIs(page, /\/contato$/);
    await settle(page, 600);
    check("Contato pelo launcher com WhatsApp real", (await win(page, "contact").locator('a[href^="https://wa.me/"]:visible').count()) >= 1);

    // link direto + recarregar
    await page.goto(`${BASE}/es/proyectos/atelier-vertex`, { waitUntil: "load" });
    await settle(page, 1200);
    check("ES: link direto abre o case na tela", (await win(page, "projects").locator('.os-case[data-world="atelier-vertex"]').count()) === 1 && (await page.getAttribute("html", "lang")) === "es");
    await win(page, "projects").locator(".os-window__close").tap();
    await page.waitForURL((u) => u.pathname === "/es");
    await settle(page, 500);
    check("ES: fechar um link direto cai na home (replace, sem marca)", (await page.locator('.os-window[data-screen="1"]').count()) === 0);
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

  // 8. telefone: Voltar (Início) mantém o app aberto; Fechar (×) encerra e volta à tela inicial
  console.log("\n# controles no celular 390×844");
  const mctx = await browser.newContext({ ...devices["iPhone 13"], locale: "pt-BR" });
  const mpage = await mctx.newPage();
  const merrs = errorsOf(mpage);
  await mpage.goto(`${BASE}/`, { waitUntil: "load" });
  await settle(mpage, 1200);
  await mpage.tap("#os-launch-projects");
  await mpage.waitForURL(/\/projetos$/);
  await settle(mpage, 700);
  const mclose = win(mpage, "projects").locator(".os-window__close");
  const mback = win(mpage, "projects").locator(".os-window__back");
  const sizes = [await mclose.boundingBox(), await mback.boundingBox()];
  check("8. cabeçalho com Voltar (Início) e Fechar visíveis, ≥ 48px", sizes.every((b) => b && b.width >= 48 && b.height >= 48) && (await mback.locator("span").innerText()) === "INÍCIO", JSON.stringify(sizes));
  check("8. luzes do desktop não aparecem no celular", (await win(mpage, "projects").locator(".os-window__controls").isVisible()) === false);
  await mback.tap();
  await mpage.waitForURL((u) => u.pathname === "/");
  await settle(mpage, 600);
  check("8. Voltar na raiz volta à tela inicial e mantém o app aberto", (await mpage.locator('.os-window[data-screen="1"]').count()) === 0 && (await mpage.getAttribute('[data-dock-id="projects"]', "data-open")) === "1");
  await mpage.tap("#os-launch-projects");
  await mpage.waitForURL(/\/projetos$/);
  await settle(mpage, 2900);
  await win(mpage, "projects").locator('.os-project__link[href="/projetos/kavita-drones"]').tap();
  await mpage.waitForURL(/\/projetos\/kavita-drones$/);
  await settle(mpage, 1600);
  await mclose.tap();
  await mpage.waitForURL((u) => u.pathname === "/");
  await settle(mpage, 600);
  check("8. Fechar (×) a partir do case encerra o app: tela inicial, sem janela", (await mpage.locator(".os-window").count()) === 0 && (await mpage.getAttribute('[data-dock-id="projects"]', "data-open")) === "0");
  await mpage.tap("#os-launch-projects");
  await mpage.waitForURL(/\/projetos$/);
  await settle(mpage, 600);
  check("8. reaberto na pasta (não no case)", (await win(mpage, "projects").locator(".os-projects").count()) === 1);
  await mback.tap();
  await mpage.waitForURL((u) => u.pathname === "/");
  await settle(mpage, 600);
  await mpage.tap("#os-launch-studio");
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
  const mrect = await mact.evaluate((e) => { const r = e.getBoundingClientRect(); return { l: Math.round(r.left), r: Math.round(r.right), w: Math.round(r.width), vw: innerWidth }; });
  check("um cartaz inteiro na tela, vizinho espiando", mrect.l >= 0 && mrect.r <= mrect.vw && mrect.w > mrect.vw * 0.55 && (await mm.locator('.bounty__slot[data-d="1"]').evaluate((e) => { const r = e.getBoundingClientRect(); return r.left < innerWidth && r.right > innerWidth; })), JSON.stringify(mrect));
  check("sem rolagem horizontal; pé dentro da tela (a dock fica atrás do app no telefone)", await mpage.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.querySelector(".bounty__foot").getBoundingClientRect().bottom <= innerHeight + 1));
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

// ------------------------------------------------------------------- phones
// Celulares (revisão 9): a matriz pedida — 320×568, 375×667, 390×844, 393×852, 430×932 e deitados 844×390 /
// 932×430. Em cada um: launcher (sem rolagem horizontal, nada aberto, 8 ícones ≥ 56/48 px, rótulos legíveis, dock
// de redes dentro da tela), Projetos (controles 48 px, cartaz legível e inteiro, swipe horizontal avança e gesto
// vertical não), case em coluna (texto 16 px, voltar 48 px), "Ver todos", Contato (opções 48 px com estado ativo).
// Mais: busca num viewport curto (teclado aberto). Emulação, não aparelho físico.
if (ONLY.includes("phones")) {
  current = "phones";
  const PHONES = [
    ["320×568", { viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }],
    ["375×667", { viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }],
    ["390×844", { ...devices["iPhone 13"] }],
    ["393×852", { viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 }],
    ["430×932", { ...devices["iPhone 14 Pro Max"] }],
    ["844×390 deitado", { ...devices["iPhone 13 landscape"] }],
    ["932×430 deitado", { ...devices["iPhone 14 Pro Max landscape"] }],
  ];
  const sizes = (page, sel) => page.evaluate((sel) => [...document.querySelectorAll(sel)].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== "hidden"; }).filter((e) => { const r = e.getBoundingClientRect(); return r.width < 48 || r.height < 48; }).map((e) => (e.getAttribute("aria-label") || e.textContent.trim()).slice(0, 24)), sel);
  for (const [label, opts] of PHONES) {
    console.log(`\n# celular ${label}`);
    const landscape = opts.viewport.width > opts.viewport.height;
    const ctx = await browser.newContext({ ...opts, locale: "pt-BR" });
    const page = await ctx.newPage();
    const errs = errorsOf(page);
    await page.goto(`${BASE}/`, { waitUntil: "load" });
    await settle(page, 1500);
    const home = await page.evaluate(() => {
      const r = (s) => document.querySelector(s)?.getBoundingClientRect();
      const tiles = [...document.querySelectorAll(".os-launch")];
      const labels = tiles.map((t) => t.querySelector(".os-launch__label"));
      const grid = r(".os-launcher__apps"), status = r(".os-launcher__status"), eye = r(".os-eye"), dock = r(".os-mdock ul");
      const desk = document.querySelector(".os-desktop");
      return {
        shell: document.documentElement.dataset.shell,
        noX: document.documentElement.scrollWidth <= innerWidth,
        nothingOpen: document.querySelectorAll('.os-window[data-screen="1"], .os-window').length === 0,
        tiles: tiles.length,
        iconPx: Math.min(...tiles.map((t) => t.querySelector(".os-micon").getBoundingClientRect().width)),
        labelPx: Math.min(...labels.map((l) => parseFloat(getComputedStyle(l).fontSize))),
        labelCut: labels.some((l) => l.scrollWidth > l.clientWidth + 1),
        overlap: tiles.some((t, i) => tiles.slice(i + 1).some((u) => { const a = t.getBoundingClientRect(), b = u.getBoundingClientRect(); return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom; })),
        gridIn: grid.left >= 0 && grid.right <= innerWidth && grid.bottom <= dock.top + 1 && grid.top >= status.bottom - 1,
        eyeOk: !!eye && eye.width > 0 && eye.height > 0 && (innerWidth > innerHeight ? eye.left >= grid.right - 1 : eye.top >= status.bottom - 1 && eye.bottom <= grid.top + 2),
        dockIn: dock.bottom <= innerHeight + 1 && dock.left >= 0 && dock.right <= innerWidth && document.querySelectorAll(".os-mdock__item").length === 5 && [...document.querySelectorAll(".os-mdock__label")].every((l) => l.scrollWidth <= l.clientWidth + 1),
        fits: desk.scrollHeight <= desk.clientHeight + 1,
      };
    });
    check("launcher: celular, sem rolagem horizontal, nada aberto, 8 ícones sem sobreposição, cabe sem rolar", home.shell === "mobile" && home.noX && home.nothingOpen && home.tiles === 8 && !home.overlap && home.fits, JSON.stringify(home));
    check(`ícones ≥ ${landscape ? 48 : 56} px, rótulos ≥ 10.5 px sem cortes, grade entre status e dock, olho ${landscape ? "à direita" : "entre status e grade"}, dock de redes dentro da tela`, home.iconPx >= (landscape ? 48 : 56) && home.labelPx >= 10.5 && !home.labelCut && home.gridIn && home.eyeOk && home.dockIn, JSON.stringify({ icon: home.iconPx, label: home.labelPx, cut: home.labelCut, grid: home.gridIn, eye: home.eyeOk, dock: home.dockIn }));
    const smallHome = await sizes(page, ".os-launch, .os-mdock__item");
    check("alvos ≥ 48 px na tela inicial (aplicativos e dock)", smallHome.length === 0, smallHome.join(", "));
    await shot(page, `ph-${label.split(" ")[0]}-home`);

    // Projetos
    await page.tap("#os-launch-projects");
    await page.waitForURL(/\/projetos$/);
    await settle(page, 2600);
    if (landscape) {
      await page.locator(".bounty__filters-btn").tap();
      await settle(page, 300);
    }
    const smallProj = await sizes(page, ".os-window__back, .os-window__close, .bounty__arrow, .bounty__all-btn, .bounty__pill, .bounty__filters-btn");
    if (landscape) {
      await page.locator(".bounty__filters-btn").tap();
      await settle(page, 300);
    }
    check("Projetos: Voltar, Fechar, setas, filtros e Ver todos ≥ 48 px", smallProj.length === 0, smallProj.join(", "));
    const poster = await page.evaluate(() => {
      const a = document.querySelector('.bounty__slot[data-active="1"]');
      const r = a.getBoundingClientRect();
      const nb = document.querySelector('.bounty__slot[data-d="1"]')?.getBoundingClientRect();
      const px = (s) => parseFloat(getComputedStyle(a.querySelector(s)).fontSize);
      return { whole: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight, name: px(".bounty__name"), line: px(".bounty__line"), id: px(".bounty__id"), peek: !!nb && nb.left < innerWidth && (nb.right > innerWidth || innerWidth > innerHeight), noX: document.documentElement.scrollWidth <= innerWidth, touch: getComputedStyle(document.querySelector(".bounty__stage")).touchAction, ticks: getComputedStyle(document.querySelector(".bounty__ticks")).display === "none", progress: getComputedStyle(document.querySelector(".bounty__progress")).display !== "none", footIn: document.querySelector(".bounty__foot").getBoundingClientRect().bottom <= innerHeight + 1 };
    });
    check("Projetos: cartaz inteiro e legível (nome ≥ 21/15 px, frase ≥ 13/11 px), vizinho espiando, sem rolagem horizontal", poster.whole && poster.name >= (landscape ? 15 : 21) && poster.line >= (landscape ? 11 : 13) && poster.peek && poster.noX, JSON.stringify(poster));
    check("Projetos: rolagem vertical livre (pan-y), fita trocada por barra de progresso, pé dentro da tela", /pan-y/.test(poster.touch) && poster.ticks && (landscape || poster.progress) && poster.footIn, JSON.stringify({ touch: poster.touch, ticks: poster.ticks, progress: poster.progress, foot: poster.footIn }));
    const st = await rectOf(page.locator(".bounty__stage"));
    await page.mouse.move(st.x + st.w * 0.7, st.y + st.h / 2);
    await page.mouse.down();
    await page.mouse.move(st.x + st.w * 0.3, st.y + st.h / 2, { steps: 8 });
    await page.mouse.up();
    await settle(page, 900);
    const after1 = await page.locator('.bounty__slot[data-active="1"]').getAttribute("data-slug");
    await page.mouse.move(st.x + st.w / 2, st.y + st.h * 0.3);
    await page.mouse.down();
    await page.mouse.move(st.x + st.w / 2 + 4, st.y + st.h * 0.7, { steps: 8 });
    await page.mouse.up();
    await settle(page, 700);
    const after2 = await page.locator('.bounty__slot[data-active="1"]').getAttribute("data-slug");
    check("swipe horizontal avança; gesto vertical não troca de cartaz", after1 !== "kavita-drones" && after2 === after1, `${after1} → ${after2}`);
    const openSlug = after2;
    await shot(page, `ph-${label.split(" ")[0]}-projetos`);

    // case em coluna
    await page.locator('.bounty__slot[data-active="1"] .bounty__link').tap();
    await page.waitForURL(new RegExp(`/projetos/${openSlug}$`));
    await settle(page, 2000);
    const dossier = await page.evaluate(() => {
      const d = document.querySelector(".bounty__dossier"), c = document.querySelector(".bounty__close");
      const text = document.querySelector(".bounty__case .os-case__text");
      const side = document.querySelector(".bounty__dossier-side").getBoundingClientRect();
      const cb = c.getBoundingClientRect();
      return { open: document.querySelector(".bounty").dataset.phase === "open", text: text ? parseFloat(getComputedStyle(text).fontSize) : 0, close: cb.height >= 48 && cb.top >= 0, noX: d.scrollWidth <= d.clientWidth + 1 && document.documentElement.scrollWidth <= innerWidth, column: side.width < innerWidth * 0.6, title: document.querySelector(".os-window__title").textContent.includes("/") };
    });
    check("case: dossiê em coluna, texto ≥ 16 px, Voltar à coleção ≥ 48 px, sem rolagem horizontal", dossier.open && dossier.text >= (landscape ? 15 : 16) && dossier.close && dossier.noX && dossier.column && dossier.title, JSON.stringify(dossier));
    await page.locator(".bounty__close").tap();
    await page.waitForURL(/\/projetos$/);
    await settle(page, 1200);
    check("Voltar à coleção devolve o mesmo cartaz", (await page.locator('.bounty__slot[data-active="1"]').getAttribute("data-slug")) === openSlug);
    await page.locator(".bounty__all-btn").tap();
    await settle(page, 400);
    const allItems = await page.locator(".bounty__all-item").count();
    await page.locator(".bounty__all-item").nth(9).tap();
    await settle(page, 900);
    check("Ver todos: grade com os 31 e salto direto (10)", allItems === 31 && (await page.locator('.bounty__slot[data-active="1"]').getAttribute("data-slug")) === "ace-diving-miami");

    // Contato
    await page.locator(".os-window__close").tap();
    await page.waitForURL((u) => u.pathname === "/");
    await settle(page, 600);
    await page.tap("#os-launch-contact");
    await urlIs(page, /\/contato$/);
    await settle(page, 900);
    const opt = page.locator(".os-contact__composer button[aria-pressed]").first();
    await opt.scrollIntoViewIfNeeded();
    await settle(page, 300);
    await opt.tap();
    await settle(page, 200);
    const smallContact = await sizes(page, ".os-contact__composer button[aria-pressed], .os-cta, .os-contact__composer a[data-inspect]");
    check("Contato: opções do compositor e WhatsApp ≥ 48 px; opção marcada com estado ativo evidente", smallContact.length === 0 && (await opt.getAttribute("aria-pressed")) === "true" && (await opt.evaluate((e) => getComputedStyle(e).backgroundColor !== "rgba(0, 0, 0, 0)")), smallContact.join(", "));
    check("sem erros de console/hidratação", errs.length === 0, errs.slice(0, 3).join(" | "));
    await ctx.close();
  }

  // busca com o teclado aberto (viewport curto): campo, resultado e fechar acessíveis
  console.log("\n# celular 390×420 · busca com teclado aberto");
  const kctx = await browser.newContext({ ...devices["iPhone 13"], viewport: { width: 390, height: 420 }, locale: "pt-BR" });
  const kpage = await kctx.newPage();
  await kpage.goto(`${BASE}/`, { waitUntil: "load" });
  await settle(kpage, 1200);
  await kpage.locator("#os-launch-search").tap();
  await settle(kpage, 500);
  await kpage.keyboard.type("terral");
  await settle(kpage, 600);
  const kb = await kpage.evaluate(() => {
    const inp = document.querySelector(".os-search__form input").getBoundingClientRect();
    const close = document.querySelector(".os-search__close").getBoundingClientRect();
    const hit = document.querySelector(".os-search__hit")?.getBoundingClientRect();
    return { input: inp.top >= 0 && inp.bottom <= innerHeight && inp.height >= 48, close: close.width >= 48 && close.height >= 48 && close.bottom <= innerHeight, hit: !!hit && hit.top >= 0 && hit.bottom <= innerHeight, font: parseFloat(getComputedStyle(document.querySelector(".os-search__form input")).fontSize) };
  });
  check("busca num viewport curto: campo (16 px, 48 px), primeiro resultado e fechar visíveis", kb.input && kb.close && kb.hit && kb.font >= 16, JSON.stringify(kb));
  await kpage.locator(".os-search__hit").first().tap();
  await kpage.waitForURL(/\/projetos\/terral$/);
  check("resultado da busca abre o case", true);
  await kctx.close();
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

// ------------------------------------------------------------------- theme
// Gojo (claro) / Obito (escuro) — revisão 10: tema antes da hidratação (script inline), tema do sistema sem
// preferência salva, sol/lua na dock (desktop e celular) sincronizado com Ajustes, persistência, movimento
// reduzido (troca imediata, sem canvas), contraste dos painéis das redes e dos rótulos, sem mancha escura em
// volta do olho no tema claro, sem rolagem horizontal em 320/360/390/430. A transição com o olho VIVO
// (fecha → troca fechado → reabre) só roda se o canvas montar neste ambiente (?quality=high; SwiftShader
// precisa de --enable-unsafe-swiftshader) — senão fica registrada como pulada, não como verde.
if (ONLY.includes("theme")) {
  current = "theme";
  console.log("\n# tema: Gojo (claro) / Obito (escuro)");
  const prefs = (theme) => JSON.stringify({ theme, motion: "system", simple: false });
  // `window.__milwebOs` só existe em desenvolvimento: no build de produção o estado é lido do <html> e do localStorage.
  const themeOf = (page) => page.evaluate(() => { const st = window.__milwebOs?.getState(); const saved = localStorage.getItem("milweb-os:prefs"); const attr = document.documentElement.dataset.osTheme; return { attr, theme: st ? st.prefs.theme : attr, auto: st ? st.prefs.themeAuto : !/"theme"/.test(saved ?? ""), pending: st ? st.themePending : null, saved }; });
  const settled = (page) => page.waitForFunction(() => !window.__milwebOs || window.__milwebOs.getState().themePending === null, null, { timeout: 4000 }).catch(() => {});
  /** Contraste WCAG entre o texto e o fundo efetivo (cor translúcida composta sobre a base). */
  const contrast = (page, textSel, bgSel, baseSel) =>
    page.evaluate(([textSel, bgSel, baseSel]) => {
      const rgba = (s) => { const m = s.match(/[\d.]+/g).map(Number); return { r: m[0], g: m[1], b: m[2], a: m[3] ?? 1 }; };
      const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
      const over = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
      const text = rgba(getComputedStyle(document.querySelector(textSel)).color);
      const base = rgba(getComputedStyle(document.querySelector(baseSel)).backgroundColor);
      const bg = over(rgba(getComputedStyle(document.querySelector(bgSel)).backgroundColor), base);
      const fg = over(text, bg);
      const [l1, l2] = [lum(fg), lum(bg)].sort((a, b) => b - a);
      return Math.round(((l1 + 0.05) / (l2 + 0.05)) * 100) / 100;
    }, [textSel, bgSel, baseSel]);

  // 1) sem nada salvo o tema é o do sistema, já no primeiro quadro (script inline), e NÃO vira escolha salva
  for (const [scheme, want] of [["dark", "obito"], ["light", "gojo"]]) {
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "pt-BR", colorScheme: scheme });
    const p = await c.newPage();
    const errs = errorsOf(p);
    const early = new Promise((res) => p.once("domcontentloaded", async () => res(await p.evaluate(() => document.documentElement.dataset.osTheme).catch(() => null))));
    await p.goto(`${BASE}/`, { waitUntil: "load" });
    await settle(p, 1200);
    const t = await themeOf(p);
    check(`sem preferência salva + prefers-color-scheme: ${scheme} → ${want} antes da hidratação e depois, nada gravado`, (await early) === want && t.attr === want && t.theme === want && t.auto === true && !/"theme"/.test(t.saved ?? ""), JSON.stringify({ early: await early, ...t }));
    await p.emulateMedia({ colorScheme: scheme === "dark" ? "light" : "dark" });
    await settle(p, 1400);
    const t2 = await themeOf(p);
    check(`  o sistema muda com a página aberta → acompanha, continua automático`, t2.theme !== want && t2.attr === t2.theme && t2.auto === true && !/"theme"/.test(t2.saved ?? ""), JSON.stringify(t2));
    check("  sem erros de console/hidratação", errs.length === 0, errs.slice(0, 3).join(" | "));
    await c.close();
  }

  // 2) desktop, tema salvo Gojo: aparência, contraste, sol/lua, Ajustes, persistência
  {
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "pt-BR", colorScheme: "dark" });
    await c.addInitScript((v) => { if (!localStorage.getItem("milweb-os:prefs")) localStorage.setItem("milweb-os:prefs", v); }, prefs("gojo"));
    const p = await c.newPage();
    const errs = errorsOf(p);
    const early = new Promise((res) => p.once("domcontentloaded", async () => res(await p.evaluate(() => document.documentElement.dataset.osTheme).catch(() => null))));
    await p.goto(`${BASE}/`, { waitUntil: "load" });
    await settle(p, 2600);
    check("preferência salva (gojo) vence o sistema (dark) e já vale no primeiro quadro", (await early) === "gojo" && (await themeOf(p)).attr === "gojo");
    const look = await p.evaluate(() => {
      const bg = getComputedStyle(document.querySelector(".os")).backgroundColor.match(/\d+/g).map(Number);
      const fg = getComputedStyle(document.querySelector(".os-topbar")).color.match(/\d+/g).map(Number);
      const card = getComputedStyle(document.querySelector(".os-hud__card")).backgroundColor.match(/[\d.]+/g).map(Number);
      return { light: bg[0] > 235 && bg[1] > 235 && bg[2] > 235, darkText: fg[0] < 40 && fg[1] < 40 && fg[2] < 40, cardLight: card[0] > 240 && card[1] > 240 && card[2] > 240, still: getComputedStyle(document.querySelector(".os-eye__still")).backgroundImage };
    });
    check("Gojo: fundo gelo, texto escuro, painéis das redes claros, imagem do olho claro", look.light && look.darkText && look.cardLight && /eye-gojo\.webp/.test(look.still), JSON.stringify(look));
    // sem mancha escura: os cantos do quadro do olho (longe do globo) têm a luminância do papel de parede
    const corners = await p.evaluate(async () => {
      const r = document.querySelector(".os-eye").getBoundingClientRect();
      return [[0.08, 0.12], [0.92, 0.12], [0.08, 0.88], [0.92, 0.88], [0.5, 0.06], [0.5, 0.94]].map(([fx, fy]) => [Math.round(r.left + r.width * fx), Math.round(r.top + r.height * fy)]);
    });
    const shotBuf = await p.screenshot();
    const lums = await p.evaluate(async ([b64, pts]) => {
      const img = new Image();
      await new Promise((res) => { img.onload = res; img.src = "data:image/png;base64," + b64; });
      const cv = document.createElement("canvas"); cv.width = img.width; cv.height = img.height;
      const g = cv.getContext("2d", { willReadFrequently: true }); g.drawImage(img, 0, 0);
      return pts.map(([x, y]) => { const d = g.getImageData(x, y, 1, 1).data; return Math.round((0.2126 * d[0] + 0.7152 * d[1] + 0.0722 * d[2]) / 2.55); });
    }, [shotBuf.toString("base64"), corners]);
    check("Gojo: nenhuma mancha escura em volta do olho (cantos do quadro ≥ 88 % de luminância)", lums.every((l) => l >= 88), lums.join(","));
    const cName = await contrast(p, ".os-hud__name", ".os-hud__card", ".os");
    const cMicro = await contrast(p, ".os-hud__micro", ".os", ".os");
    const cSign = await contrast(p, ".os-sign__line", ".os", ".os");
    const cOrigin = await contrast(p, ".os-sign__origin", ".os", ".os");
    check("Gojo: contraste ≥ 4.5 — nome da rede no painel, microtexto, assinatura, origem (acento)", cName >= 4.5 && cMicro >= 4.5 && cSign >= 4.5 && cOrigin >= 4.5, `${cName} / ${cMicro} / ${cSign} / ${cOrigin}`);

    const toggle = p.locator(".os-dock__theme");
    const box = await rectOf(toggle);
    check("sol/lua na dock: ≥ 48 × 48 px, role=switch, nome acessível, aria-checked=false no claro", box && box.w >= 48 && box.h >= 48 && (await toggle.getAttribute("role")) === "switch" && (await toggle.getAttribute("aria-label")) === "Tema escuro (Obito)" && (await toggle.getAttribute("aria-checked")) === "false", JSON.stringify(box));
    await toggle.focus();
    check("sol/lua: foco visível (outline) e lua à vista no tema claro", await p.evaluate(() => { const b = document.querySelector(".os-dock__theme"); const o = getComputedStyle(b).outlineStyle !== "none" || getComputedStyle(b.querySelector(".os-icon")).boxShadow !== "none"; const moon = b.querySelector(".os-theme__moon"), sun = b.querySelector(".os-theme__sun"); return o && getComputedStyle(moon).display !== "none" && getComputedStyle(sun).display === "none"; }));
    await toggle.click();
    await p.waitForFunction(() => document.documentElement.dataset.osTheme === "obito", null, { timeout: 4000 }).catch(() => {});
    await settled(p);
    await settle(p, 900);
    const t1 = await themeOf(p);
    check("clique no sol/lua: Obito aplicado, salvo como escolha, switch marcado, sol à vista", t1.attr === "obito" && t1.theme === "obito" && t1.auto === false && /"theme":"obito"/.test(t1.saved) && (await toggle.getAttribute("aria-checked")) === "true" && (await p.evaluate(() => getComputedStyle(document.querySelector(".os-dock__theme .os-theme__sun")).display !== "none")), JSON.stringify(t1));
    const dark = await p.evaluate(() => { const bg = getComputedStyle(document.querySelector(".os")).backgroundColor.match(/\d+/g).map(Number); return bg[0] < 20 && bg[1] < 20 && bg[2] < 20 && /eye-obito\.webp/.test(getComputedStyle(document.querySelector(".os-eye__still")).backgroundImage); });
    check("Obito: fundo carvão e imagem do olho escuro", dark);
    const dName = await contrast(p, ".os-hud__name", ".os-hud__card", ".os");
    const dMicro = await contrast(p, ".os-hud__micro", ".os", ".os");
    const dOrigin = await contrast(p, ".os-sign__origin", ".os", ".os");
    check("Obito: contraste ≥ 4.5 — nome da rede, microtexto, origem (acento vermelho)", dName >= 4.5 && dMicro >= 4.5 && dOrigin >= 4.5, `${dName} / ${dMicro} / ${dOrigin}`);
    await shot(p, "t01-obito");

    // cliques rápidos (3 no mesmo tick): um só destino, nada pendente ao fim
    await p.evaluate(() => { const b = document.querySelector(".os-dock__theme"); b.click(); b.click(); b.click(); });
    await settled(p);
    await settle(p, 1200);
    const t3 = await themeOf(p);
    check("três cliques rápidos → gojo, nada pendente, atributo e store iguais", t3.theme === "gojo" && t3.attr === "gojo" && t3.pending === null, JSON.stringify(t3));

    // Ajustes sincronizado (mesmo store): a opção marcada acompanha e escolher lá muda a dock
    await p.click('[data-dock-id="settings"]');
    await settle(p, 500);
    const chips = () => p.evaluate(() => [...document.querySelectorAll('.os-window[data-app="settings"] [name="theme"]')].map((c) => c.textContent.trim() + ":" + c.getAttribute("aria-checked")).join(","));
    check("Ajustes › Tema marca Gojo", (await chips()) === "Gojo · claro:true,Obito · escuro:false", await chips());
    await p.click('.os-window[data-app="settings"] [name="theme"]:nth-child(2)');
    await p.waitForFunction(() => document.documentElement.dataset.osTheme === "obito", null, { timeout: 4000 }).catch(() => {});
    await settled(p);
    await settle(p, 600);
    check("Ajustes › Obito: aplicado e a dock acompanha (aria-checked=true)", (await chips()) === "Gojo · claro:false,Obito · escuro:true" && (await toggle.getAttribute("aria-checked")) === "true" && (await themeOf(p)).attr === "obito");
    await shot(p, "t02-ajustes");
    await p.keyboard.press("Escape");

    // persistência: recarregar mantém o Obito já no primeiro quadro
    const early2 = new Promise((res) => p.once("domcontentloaded", async () => res(await p.evaluate(() => document.documentElement.dataset.osTheme).catch(() => null))));
    await p.reload({ waitUntil: "load" });
    await settle(p, 1200);
    check("recarregar: Obito salvo já no primeiro quadro, sem flash", (await early2) === "obito" && (await themeOf(p)).attr === "obito");
    check("sem erros de console/hidratação", errs.length === 0, errs.slice(0, 3).join(" | "));
    await c.close();
  }

  // 3) movimento reduzido: sem canvas, a troca é imediata e a imagem acompanha
  {
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "pt-BR", reducedMotion: "reduce" });
    await c.addInitScript((v) => { if (!localStorage.getItem("milweb-os:prefs")) localStorage.setItem("milweb-os:prefs", v); }, prefs("obito"));
    const p = await c.newPage();
    await p.goto(`${BASE}/`, { waitUntil: "load" });
    await settle(p, 2000);
    await p.click(".os-dock__theme");
    await settle(p, 80);
    const t = await themeOf(p);
    check("reduced motion: olho estático, clique troca na hora (gojo), imagem clara, nada pendente", (await p.getAttribute(".os-eye", "data-state")) === "still" && t.attr === "gojo" && t.pending === null && (await p.evaluate(() => /eye-gojo\.webp/.test(getComputedStyle(document.querySelector(".os-eye__still")).backgroundImage))), JSON.stringify(t));
    await c.close();
  }

  // 4) celular: sol/lua na dock de redes em 320/360/390/430, sem rolagem horizontal, rótulos legíveis
  for (const [w, h] of [[320, 568], [360, 780], [390, 844], [430, 932]]) {
    for (const theme of ["gojo", "obito"]) {
      const c = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, locale: "pt-BR" });
      await c.addInitScript((v) => { if (!localStorage.getItem("milweb-os:prefs")) localStorage.setItem("milweb-os:prefs", v); }, prefs(theme));
      const p = await c.newPage();
      const errs = errorsOf(p);
      await p.goto(`${BASE}/`, { waitUntil: "load" });
      await settle(p, 1500);
      const m = await p.evaluate(() => {
        const b = document.querySelector(".os-mdock__theme");
        const r = b.getBoundingClientRect();
        const labels = [...document.querySelectorAll(".os-mdock__label")].map((l) => ({ t: l.textContent, over: l.scrollWidth > l.clientWidth + 1 }));
        const bg = getComputedStyle(document.querySelector(".os")).backgroundColor.match(/\d+/g).map(Number);
        return { w: r.width, h: r.height, inside: r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight, role: b.getAttribute("role"), label: b.getAttribute("aria-label"), overflowX: document.documentElement.scrollWidth > innerWidth, labels, light: bg[0] > 235, still: getComputedStyle(document.querySelector(".os-eye__still")).backgroundImage, launchLabel: getComputedStyle(document.querySelector(".os-launch__label")).color };
      });
      const cLaunch = await contrast(p, ".os-launch__label", ".os", ".os");
      const cDock = await contrast(p, ".os-mdock__label", ".os-mdock ul", ".os");
      check(`${w}×${h} ${theme}: sol/lua ≥ 48 px dentro da tela, rótulos da dock sem corte, sem rolagem horizontal, imagem do tema, contraste rótulos ≥ 4.5`, m.w >= 48 && m.h >= 48 && m.inside && m.role === "switch" && m.labels.every((l) => !l.over) && !m.overflowX && (theme === "gojo") === m.light && new RegExp(`eye-${theme}-mobile\\.webp`).test(m.still) && cLaunch >= 4.5 && cDock >= 4.5, JSON.stringify({ ...m, labels: m.labels.filter((l) => l.over).map((l) => l.t), cLaunch, cDock }));
      if (w === 390 && theme === "obito") {
        await p.tap(".os-mdock__theme");
        await p.waitForFunction(() => document.documentElement.dataset.osTheme === "gojo", null, { timeout: 4000 }).catch(() => {});
        await settled(p);
        await settle(p, 600);
        check("390: toque no sol/lua troca para gojo e salva", (await themeOf(p)).attr === "gojo" && /"theme":"gojo"/.test((await themeOf(p)).saved));
        await shot(p, "t03-mobile-gojo");
      }
      check(`${w}×${h} ${theme}: sem erros`, errs.length === 0, errs.slice(0, 2).join(" | "));
      await c.close();
    }
  }

  // 5) olho VIVO (só se o canvas montar aqui): a pálpebra fecha, o tema troca com ela fechada, e reabre
  {
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "pt-BR" });
    await c.addInitScript((v) => { if (!localStorage.getItem("milweb-os:prefs")) localStorage.setItem("milweb-os:prefs", v); }, prefs("gojo"));
    const p = await c.newPage();
    await p.goto(`${BASE}/?quality=high`, { waitUntil: "load" });
    const live = await p.waitForSelector('.os-eye[data-state="live"]', { timeout: 15000 }).then(() => true).catch(() => false);
    const handle = live && (await p.evaluate(() => !!window.__mwOsEye));
    if (!live) console.log("  · olho vivo: PULADO — o canvas não montou neste ambiente (sem GPU/SwiftShader); ver .audit/scratch/theme-live.mjs");
    else if (!handle) console.log("  · olho vivo: PULADO — o build de produção não expõe window.__mwOsEye (rode no dev server ou .audit/scratch/theme-live.mjs --headed)");
    else {
      await p.click(".os-dock__theme");
      const trace = [];
      const t0 = Date.now();
      while (Date.now() - t0 < 2600) {
        trace.push(await p.evaluate(() => ({ phase: window.__mwOsEye.phase, lid: +window.__mwOsEye.lid.toFixed(2), attr: document.documentElement.dataset.osTheme })));
        await p.waitForTimeout(8);
      }
      // A garantia que importa: no PRIMEIRO quadro em que o tema já mudou a pálpebra está fechada, e o olho reabre
      // depois. (Sem GPU, um quadro do SwiftShader pode durar mais que o fechamento inteiro — a fase "closing" nem
      // sempre é amostrada; a cadência real fica com .audit/scratch/theme-live.mjs --headed.)
      const flip = trace.findIndex((s) => s.attr === "obito");
      const ok = flip >= 0 && trace[flip].lid >= 0.99 && trace.slice(0, flip).every((s) => s.attr === "gojo") && trace.slice(flip).some((s) => s.phase === "opening") && trace.at(-1).phase === "open" && trace.at(-1).lid === 0;
      check("olho vivo: o tema troca com a pálpebra FECHADA e o olho reabre (pálpebra por uBlink, nunca o olho comprimido)", ok, JSON.stringify({ flip, at: trace[flip], end: trace.at(-1) }));
    }
    await c.close();
  }
}

// ------------------------------------------------------------------- boot
// Tela de carregamento (features/os/boot.tsx): está no HTML do servidor, sai quando fontes + olho + hidratação
// estão prontos (ou aos 2,5 s), não captura o ponteiro, não volta em navegação interna nem em recarga da mesma
// sessão, sai na hora com movimento reduzido, sobrevive a recurso com erro e some sem JavaScript (CSS, 6 s).
if (ONLY.includes("boot")) {
  current = "boot";
  console.log("\n# tela de carregamento");
  // Antes da hidratação a captura é CRUA, pelo CDP: o page.screenshot() do Playwright adianta as animações
  // CSS finitas até o fim (a rede de segurança de 6 s da tela terminaria na hora) e deixa um style="" nos
  // <input> (o React acusaria um atributo a mais) — artefatos da ferramenta, não do site.
  const shotRaw = async (p, name) => {
    const cdp = await p.context().newCDPSession(p);
    const { data } = await cdp.send("Page.captureScreenshot", { format: "png" });
    writeFileSync(`${OUT}/${name}.png`, Buffer.from(data, "base64"));
    await cdp.detach();
  };
  const bootGone = (p, ms = 4500) => p.waitForFunction(() => !document.querySelector(".os-boot"), null, { timeout: ms }).then(() => true).catch(() => false);
  // Rede lenta só até a tela ser vista: depois a conexão volta ao normal (no dev server o JavaScript tem
  // megabytes — a 350 kbps a hidratação levaria minutos; em produção, segundos). O que se mede é o
  // comportamento, não a velocidade do bundle do dev.
  const slow = async (p, kbps = 350) => {
    const cdp = await p.context().newCDPSession(p);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 300, downloadThroughput: (kbps * 1024) / 8, uploadThroughput: (kbps * 1024) / 8 });
    return { restore: () => cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 }) };
  };

  // 1) conexão lenta (desktop): a tela aparece, com o texto certo, e sai sozinha quando a home está pronta
  {
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "pt-BR", colorScheme: "dark" });
    const p = await c.newPage();
    const errs = errorsOf(p);
    const net = await slow(p);
    await p.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 120000 });
    const seen = await p.evaluate(() => {
      const b = document.querySelector(".os-boot");
      if (!b) return null;
      const cs = getComputedStyle(b);
      return { role: b.getAttribute("role"), live: b.getAttribute("aria-live"), text: b.querySelector(".os-boot__text")?.textContent, foot: b.querySelector(".os-boot__foot")?.textContent, logo: b.querySelector(".os-boot__logo")?.textContent, pointer: cs.pointerEvents, bar: !!b.querySelector(".os-boot__bar span"), visible: cs.display !== "none" && cs.opacity !== "0" };
    });
    await shotRaw(p, "b01-boot-desktop");
    check("lenta: tela no HTML inicial — MILWEB®, indicador, 'Preparando seu ambiente', rodapé; role=status; sem capturar o ponteiro", !!seen && seen.visible && seen.role === "status" && seen.live === "polite" && seen.logo === "MILWEB®" && seen.text === "Preparando seu ambiente" && /Estúdio de desenvolvimento.*Brasil → Mundo/.test(seen.foot ?? "") && seen.pointer === "none" && seen.bar, JSON.stringify(seen));
    await net.restore();
    const t0 = Date.now();
    const gone = await bootGone(p, 60000);
    const dt = Date.now() - t0;
    check("lenta: sai sozinha quando a home fica pronta; marca a sessão", gone && (await p.evaluate(() => document.documentElement.dataset.osBooted === "1" && sessionStorage.getItem("milweb-os:booted") === "1")), `${dt} ms depois do domcontentloaded`);
    check("lenta: h1 e área de trabalho acessíveis por trás (nada escondido de leitores de tela)", await p.evaluate(() => document.querySelectorAll("h1").length === 1 && !document.querySelector(".os-desktop")?.closest("[aria-hidden='true'], [inert]")));
    // navegação interna não remonta a tela
    await p.click('[data-dock-id="studio"]');
    await urlIs(p, /\/estudio$/);
    await settle(p, 600);
    check("navegação interna (Estúdio) não reapresenta a tela", (await p.locator(".os-boot").count()) === 0);
    // recarregar na mesma sessão: nem desenha (atributo do script inline antes da pintura)
    const early = new Promise((res) => p.once("domcontentloaded", async () => res(await p.evaluate(() => ({ booted: document.documentElement.dataset.osBooted, display: document.querySelector(".os-boot") ? getComputedStyle(document.querySelector(".os-boot")).display : "absent" })).catch(() => null))));
    await p.reload({ waitUntil: "load", timeout: 120000 });
    const e = await early;
    check("recarregar na mesma sessão: data-os-booted já no domcontentloaded e a tela nem é desenhada", !!e && e.booted === "1" && (e.display === "none" || e.display === "absent"), JSON.stringify(e));
    check("sem erros de console/hidratação", errs.length === 0, errs.slice(0, 3).join(" | "));
    await c.close();
  }

  // 2) rápida: sai logo após a hidratação (sem duração mínima); 3) movimento reduzido: sem transição
  {
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "pt-BR" });
    const p = await c.newPage();
    const t0 = Date.now();
    await p.goto(`${BASE}/`, { waitUntil: "load" });
    const gone = await bootGone(p);
    check("rápida: tela sai em até 4,5 s do load (sem duração mínima imposta)", gone, `${Date.now() - t0} ms`);
    await c.close();
    const r = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "pt-BR", reducedMotion: "reduce" });
    const rp = await r.newPage();
    await rp.addInitScript(() => { window.__bootPhases = []; new MutationObserver((ms) => ms.forEach((m) => { if (m.target.classList?.contains("os-boot")) window.__bootPhases.push(m.target.dataset.phase); })).observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: ["data-phase"] }); });
    await rp.goto(`${BASE}/`, { waitUntil: "load" });
    const rgone = await bootGone(rp);
    check("movimento reduzido: sai sem passar pela transição (nenhuma fase 'leave')", rgone && (await rp.evaluate(() => !window.__bootPhases.includes("leave"))), JSON.stringify(await rp.evaluate(() => window.__bootPhases)));
    await r.close();
  }

  // 4) recurso essencial com erro (imagem do olho bloqueada): a tela sai mesmo assim, sem erro no console
  {
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "pt-BR" });
    const p = await c.newPage();
    const errs = errorsOf(p);
    await p.route("**/art/eye-*.webp", (r) => r.abort());
    const t0 = Date.now();
    await p.goto(`${BASE}/`, { waitUntil: "load" });
    const gone = await bootGone(p, 6000);
    check("imagem do olho com erro: a tela sai (limite de 2,5 s) e nada quebra", gone && errs.length === 0, `${Date.now() - t0} ms · ${errs.slice(0, 2).join(" | ")}`);
    await c.close();
  }

  // 5) sem JavaScript: a tela está lá, não bloqueia o ponteiro e se apaga pelo CSS aos 6 s
  {
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "pt-BR", javaScriptEnabled: false });
    const p = await c.newPage();
    await p.goto(`${BASE}/`, { waitUntil: "load" });
    const at1 = await p.evaluate(() => { const b = document.querySelector(".os-boot"); return b ? getComputedStyle(b).visibility : "absent"; });
    await p.waitForTimeout(6800);
    const at7 = await p.evaluate(() => { const b = document.querySelector(".os-boot"); return b ? { vis: getComputedStyle(b).visibility, op: getComputedStyle(b).opacity } : "absent"; });
    check("sem JavaScript: visível no load e apagada pelo CSS depois de 6 s (nunca bloqueia)", at1 === "visible" && !!at7 && at7 !== "absent" && at7.vis === "hidden", JSON.stringify({ at1, at7 }));
    await c.close();
  }

  // 6) celular lento (390×844, EN): tela centrada, sem rolagem horizontal, texto traduzido, sai sozinha
  {
    const c = await browser.newContext({ ...devices["iPhone 13"], locale: "en-US", colorScheme: "dark" });
    const p = await c.newPage();
    const net = await slow(p);
    await p.goto(`${BASE}/en`, { waitUntil: "domcontentloaded", timeout: 120000 });
    const m = await p.evaluate(() => {
      const b = document.querySelector(".os-boot");
      if (!b) return null;
      const r = b.querySelector(".os-boot__mark").getBoundingClientRect();
      return { text: b.querySelector(".os-boot__text")?.textContent, foot: b.querySelector(".os-boot__foot")?.textContent, centered: Math.abs(r.left + r.width / 2 - innerWidth / 2) < 4, overflowX: document.documentElement.scrollWidth > innerWidth };
    });
    await shotRaw(p, "b02-boot-mobile-en");
    check("celular EN: 'Preparing your environment', rodapé traduzido, marca centrada, sem rolagem horizontal", !!m && m.text === "Preparing your environment" && /Development studio.*Brazil → World/.test(m.foot ?? "") && m.centered && !m.overflowX, JSON.stringify(m));
    await net.restore();
    check("celular: sai sozinha", await bootGone(p, 60000));
    await c.close();
  }
}

// ------------------------------------------------------------------- share
// Capa de compartilhamento (lib/share-cover.ts + scripts/og-cover.mjs): og:image absoluta com dimensões,
// tipo e alt, Twitter Card grande, canonical + hreflang, uma imagem só por página, cases com a própria OG,
// arquivo público e leve.
if (ONLY.includes("share")) {
  current = "share";
  console.log("\n# capa de compartilhamento e metadados");
  const c = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: "pt-BR" });
  const p = await c.newPage();
  const metaOf = (page) =>
    page.evaluate(() => {
      const all = (sel) => [...document.querySelectorAll(sel)].map((m) => m.getAttribute("content") ?? m.getAttribute("href"));
      return {
        title: document.title,
        desc: all('meta[name="description"]')[0],
        ogImage: all('meta[property="og:image"]'),
        ogW: all('meta[property="og:image:width"]')[0],
        ogH: all('meta[property="og:image:height"]')[0],
        ogT: all('meta[property="og:image:type"]')[0],
        ogAlt: all('meta[property="og:image:alt"]')[0],
        ogUrl: all('meta[property="og:url"]')[0],
        ogLocale: all('meta[property="og:locale"]')[0],
        ogType: all('meta[property="og:type"]')[0],
        twCard: all('meta[name="twitter:card"]')[0],
        twImage: all('meta[name="twitter:image"]'),
        canonical: all('link[rel="canonical"]')[0],
        hreflang: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((l) => l.getAttribute("hreflang")).sort().join(","),
      };
    });
  for (const [path, locale, ogLocale] of [["/", "pt", "pt_BR"], ["/en", "en", "en_US"], ["/es", "es", "es_419"]]) {
    await p.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
    const m = await metaOf(p);
    const cover = `https://milweb.com.br/og/cover-${locale}.jpg`;
    check(`${path}: og:image única, absoluta (${cover}), 1200×630, image/jpeg, com alt`, m.ogImage.length === 1 && m.ogImage[0] === cover && m.ogW === "1200" && m.ogH === "630" && m.ogT === "image/jpeg" && (m.ogAlt ?? "").length > 40 && /Rick Januario/.test(m.ogAlt), JSON.stringify({ img: m.ogImage, w: m.ogW, h: m.ogH, t: m.ogT, alt: (m.ogAlt ?? "").slice(0, 60) }));
    check(`${path}: twitter:card summary_large_image com a mesma capa; og:url, og:locale ${ogLocale}, título e descrição`, m.twCard === "summary_large_image" && m.twImage.length === 1 && m.twImage[0] === cover && m.ogUrl === `https://milweb.com.br${path === "/" ? "" : path}` && m.ogLocale === ogLocale && m.ogType === "website" && /MilWeb/.test(m.title) && (m.desc ?? "").length > 60, JSON.stringify({ card: m.twCard, tw: m.twImage, url: m.ogUrl, loc: m.ogLocale }));
    check(`${path}: canonical + hreflang pt-BR/en/es/x-default`, m.canonical === `https://milweb.com.br${path === "/" ? "" : path}` && m.hreflang === "en,es,pt-BR,x-default", `${m.canonical} · ${m.hreflang}`);
  }
  // o case continua com a própria OG (arquivo de rota), uma imagem só
  await p.goto(`${BASE}/projetos/terral`, { waitUntil: "domcontentloaded" });
  const mc = await metaOf(p);
  check("case (Terral): og:image própria (…/opengraph-image), única, sem a capa do site; card grande", mc.ogImage.length === 1 && /\/work\/terral\/opengraph-image/.test(mc.ogImage[0]) && !/cover-/.test(mc.ogImage[0]) && mc.twCard === "summary_large_image" && mc.twImage.length === 1 && /\/work\/terral\/twitter-image/.test(mc.twImage[0]), JSON.stringify({ og: mc.ogImage, tw: mc.twImage }));
  // arquivo público, leve, nas dimensões certas, sem autenticação
  for (const locale of ["pt", "en", "es"]) {
    const res = await p.request.get(`${BASE}/og/cover-${locale}.jpg`);
    const buf = await res.body();
    const dim = await p.evaluate(async (b64) => { const i = new Image(); i.src = "data:image/jpeg;base64," + b64; await i.decode(); return [i.naturalWidth, i.naturalHeight]; }, buf.toString("base64"));
    check(`cover-${locale}.jpg: 200 público, image/jpeg, 1200×630, < 300 KB`, res.status() === 200 && /image\/jpeg/.test(res.headers()["content-type"] ?? "") && dim[0] === 1200 && dim[1] === 630 && buf.length < 300 * 1024, `${res.status()} · ${(buf.length / 1024).toFixed(0)} KB · ${dim.join("×")}`);
  }
  const old = await p.request.get(`${BASE}/opengraph-image`);
  check("a rota dinâmica antiga (/opengraph-image) não existe mais — nada de duas capas", old.status() === 404, String(old.status()));
  await c.close();
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
