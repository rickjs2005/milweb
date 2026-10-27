/**
 * MilWeb OS — testes de fluxo (Playwright, Chromium).
 *
 *   node scripts/os-check.mjs [--base http://127.0.0.1:3100] [--out .audit/os] [--only desktop,mobile,resize]
 *
 * Cobre os riscos reais do shell: histórico/rotas (link direto, Voltar,
 * recarregar), estado das janelas (abrir, focar, minimizar, restaurar,
 * maximizar, fechar, arrastar com clamp, teclado), os controles de janela
 * (grupo `controls`: luzes, saída animada, Esc global, celular, Hold to
 * Inspect), o tablet (grupo `tablet`: a área de trabalho de 720 a 1079 px com
 * a coluna, a dock completa e o HUD das redes; os grupos `desktop`, `controls`
 * e `theme` rodam a 1440 px, no desktop largo: grade 2 × 3, dock só com o
 * sistema, redes compactas), o telefone (grupos `mobile` e `phones`: launcher, dock de redes,
 * telas cheias, histórico sem entradas repetidas, Perfil com URL, Ajustes sem URL),
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
const ONLY = opt("--only", "desktop,tablet,controls,projects,mobile,phones,resize,simple,theme,boot,share,profile").split(",");
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
  // desktop largo (≥ 1080 px): lema no alto, grade 2 × 3 sob ele (o DOM segue a ordem visual, para o Tab), dock só com o sistema
  const home = await page.evaluate(() => {
    const items = [...document.querySelectorAll('.os-icons li[data-desktop="1"]')].filter((li) => li.getClientRects().length);
    const box = items.map((li) => { const b = li.querySelector(".os-icon-btn").getBoundingClientRect(); return { id: li.dataset.app, x: Math.round(b.left), y: Math.round(b.top), plate: li.querySelector(".os-icon").offsetWidth }; }); // offsetWidth: a flutuação gira a placa e infla o retângulo
    const m = document.querySelector(".os-sign__motto"), mb = m.getBoundingClientRect(), top = document.querySelector(".os-topbar").getBoundingClientRect(), gb = document.querySelector(".os-icons ul").getBoundingClientRect();
    const rg = document.createRange();
    rg.selectNodeContents(m);
    const css = getComputedStyle(document.documentElement);
    const triple = (v) => css.getPropertyValue(v).trim().split(/\s+/).join(", ");
    const sig = triple("--os-signal");
    return {
      dom: box.map((b) => b.id).join(","),
      reading: [...box].sort((a, b) => a.y - b.y || a.x - b.x).map((b) => b.id).join(","),
      cols: new Set(box.map((b) => b.x)).size,
      rows: new Set(box.map((b) => b.y)).size,
      plates: box.map((b) => b.plate),
      labels: items.map((li) => li.querySelector(".os-icon-btn__label").innerText).join("|"),
      contact: getComputedStyle(document.querySelector('.os-icons li[data-app="contact"] .os-icon')).boxShadow.includes(sig) && !getComputedStyle(document.querySelector('.os-icons li[data-app="lab"] .os-icon')).boxShadow.includes(sig),
      motto: { left: Math.round(mb.left), gapTop: Math.round(mb.top - top.bottom), lines: new Set([...rg.getClientRects()].map((r) => Math.round(r.top))).size, color: getComputedStyle(m).color, want: document.documentElement.dataset.osTheme === "gojo" ? `rgb(${triple("--os-fg")})` : "rgb(255, 255, 255)", dot: getComputedStyle(document.querySelector(".os-sign__dot")).color === `rgb(${sig})`, toGrid: Math.round(gb.top - mb.bottom), px: parseFloat(getComputedStyle(m).fontSize) },
      dock: [...document.querySelectorAll(".os-dock li")].filter((li) => li.getClientRects().length).map((li) => li.dataset.dockSys || li.dataset.dockApp).join(","),
    };
  });
  check("grade 2 × 3: Projetos | Serviços, Estúdio | Lab, Perfil | Contato (DOM na ordem visual)", home.cols === 2 && home.rows === 3 && home.reading === "projects,services,studio,lab,profile,contact" && home.dom === home.reading && home.labels === "PROJETOS|SERVIÇOS|ESTÚDIO|LAB|PERFIL|CONTATO", JSON.stringify({ dom: home.dom, reading: home.reading, cols: home.cols, rows: home.rows, labels: home.labels }));
  check("ícones de 60–68 px com o nome sempre visível embaixo; Contato com borda no acento do tema", home.plates.every((p) => p >= 60 && p <= 68) && home.contact, `${home.plates.join(",")} · contato ${home.contact}`);
  check("lema no alto à esquerda (branco no Obito, tinta no Gojo), até duas linhas, ponto no acento, respiro até a grade", home.motto.left <= 40 && home.motto.gapTop >= 8 && home.motto.gapTop <= 60 && home.motto.lines <= 2 && home.motto.color === home.motto.want && home.motto.dot && home.motto.toGrid >= 16 && home.motto.px >= 40, JSON.stringify(home.motto));
  check("dock: só Buscar, Ajustes e o tema, nessa ordem", home.dock === "search,settings,theme", home.dock);
  check("h1 na raiz é o lema", (await page.locator("h1").count()) === 1 && (await page.locator("h1").innerText()) === "Códigos movem o mundo.");
  check("fundo presente como imagem (fallback estático do universo do tema, fundo CSS)", await page.evaluate(() => /scene-(tsukuyomi|void)\.webp/.test(getComputedStyle(document.querySelector(".os-scene__still")).backgroundImage)));
  check("fundo e palco não interceptam o ponteiro; nenhum olho grande no cenário", await page.evaluate(() => getComputedStyle(document.querySelector(".os-scene")).pointerEvents === "none" && getComputedStyle(document.querySelector(".os-stage")).pointerEvents === "none" && !document.querySelector(".os-eye, .os-eye__still, .os-eye__canvas")));
  check("sem a escultura orbital (preload e arte)", (await page.locator('link[href*="orbital-sculpture"], .os-wallpaper__art').count()) === 0);
  const overlap = await page.evaluate(() => {
    const r = (s) => document.querySelector(s)?.getBoundingClientRect();
    const g = r(".os-stage"), mo = r(".os-sign__motto"), ln = r(".os-sign__line"), ic = r(".os-icons ul"), dk = r(".os-dock ul"), so = r(".os-social");
    const hit = (a, b) => a && b && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    return { globeMotto: hit(g, mo), globeIcons: hit(g, ic), globeDock: hit(g, dk), mottoIcons: hit(mo, ic), iconsLine: hit(ic, ln), iconsDock: hit(ic, dk), lineDock: hit(ln, dk), socialDock: hit(so, dk), socialLine: hit(so, ln), socialIcons: hit(so, ic) };
  });
  check("palco, lema, aplicativos, rodapé, dock e redes não se sobrepõem", Object.values(overlap).every((v) => !v), JSON.stringify(overlap));
  await shot(page, "d01-home");

  // redes: grupo compacto no canto inferior direito (o HUD com circuitos ficou para o tablet — grupo `tablet`)
  const soc = await page.evaluate(() => {
    const items = [...document.querySelectorAll(".os-social__item")];
    const box = document.querySelector(".os-social").getBoundingClientRect();
    const dock = document.querySelector(".os-dock ul").getBoundingClientRect();
    return {
      keys: items.map((a) => a.dataset.social).join(","),
      hrefs: items.map((a) => a.href),
      safe: items.every((a) => a.target === "_blank" && a.rel.includes("noopener") && a.rel.includes("noreferrer")),
      names: items.map((a) => a.querySelector(".os-social__name").textContent.trim()).join(","),
      sr: items.every((a) => /abre em nova aba/.test(a.textContent)),
      corner: box.right <= innerWidth && innerWidth - box.right <= 32 && innerHeight - box.bottom <= 24 && box.left > dock.right,
      noHud: !document.querySelector(".os-hud, .os-hud__wires, .os-hud__micro"),
    };
  });
  check("redes: LinkedIn, GitHub, Instagram e WhatsApp num grupo no canto inferior direito, à direita da dock", soc.keys === "linkedin,github,instagram,whatsapp" && soc.names === "LinkedIn,GitHub,Instagram,WhatsApp" && soc.corner, JSON.stringify(soc));
  check("redes: links reais em nova aba segura (noopener noreferrer), aviso para leitor de tela, WhatsApp em wa.me com DDI", soc.safe && soc.sr && /^https:\/\/www\.linkedin\.com\/in\//.test(soc.hrefs[0]) && soc.hrefs[1] === "https://github.com/rickjs2005" && soc.hrefs[2] === "https://www.instagram.com/milweb01/" && soc.hrefs[3] === "https://wa.me/5533998779375", soc.hrefs.join(" "));
  check("sem os cartões HUD, circuitos e descrições no desktop largo", soc.noHud);
  const waItem = page.locator('.os-social__item[data-social="whatsapp"]');
  await waItem.hover();
  await settle(page, 350);
  const wa = await waItem.evaluate((e) => ({ c: getComputedStyle(e.querySelector(".os-social__icon")).color, t: document.documentElement.dataset.osTheme }));
  check("WhatsApp: verde discreto no hover", wa.c.includes(wa.t === "gojo" ? "21, 128, 61" : "37, 211, 102"), JSON.stringify(wa));
  const ghItem = page.locator('.os-social__item[data-social="github"]');
  const [popup] = await Promise.all([ctx.waitForEvent("page", { timeout: 8000 }).catch(() => null), ghItem.click()]);
  check("redes: clique abre o GitHub em nova aba", !!popup && popup.url().startsWith("https://github.com/rickjs2005"), popup ? popup.url() : "sem nova aba");
  if (popup) await popup.close();
  await page.mouse.move(700, 620); // sobre o palco (sem ponteiro): longe da dock
  await settle(page, 300);
  await page.locator(".os-topbar__brand").focus();
  let reached = false;
  for (let i = 0; i < 16 && !reached; i++) {
    await page.keyboard.press("Tab");
    reached = await page.evaluate(() => document.activeElement?.classList.contains("os-social__item"));
  }
  await settle(page, 300); // a placa tem transição de 0,2 s
  check("redes: alcançáveis pelo teclado (Tab) com foco visível", reached && (await page.evaluate(() => getComputedStyle(document.activeElement.querySelector(".os-social__icon")).boxShadow.includes("0px 0px 0px 2px"))));
  await page.mouse.click(700, 620);
  check("o fundo continua sem interceptar o ponteiro", await page.evaluate(() => getComputedStyle(document.querySelector(".os-scene")).pointerEvents === "none" && getComputedStyle(document.querySelector(".os-stage")).pointerEvents === "none"));

  // Na grade (desktop largo) o app abre e volta pelo ícone — os apps saíram da dock neste tamanho. Se uma janela está
  // por cima do ícone (a do Estúdio, depois de arrastada para o canto, cobre a grade), pelo teclado no mesmo ícone.
  const launchIcon = async (id) => {
    const el = page.locator(`#os-icon-${id}`);
    const free = await el.evaluate((a) => { const b = a.getBoundingClientRect(); return a.contains(document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2)); });
    if (free) await el.click();
    else {
      await el.focus();
      await page.keyboard.press("Enter");
    }
  };

  // abrir pela grade (um clique) → janela + URL
  await launchIcon("studio");
  const toStudio = await urlIs(page, /\/estudio$/);
  await settle(page);
  check("ícone abre Estúdio e muda a URL", (await win(page, "studio").count()) === 1 && toStudio, path(page));
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
  // Projetos cobre o Estúdio: o ícone traz o Estúdio para frente antes dos testes de janela
  await launchIcon("studio");
  await urlIs(page, /\/estudio$/);
  await settle(page, 500);
  check("ícone traz o Estúdio para frente e a URL acompanha", (await zTop("studio")) > (await zTop("projects")) && path(page) === "/estudio", path(page));

  // fechar a janela de TRÁS (Projetos, atrás do Estúdio) num gesto só: fecha, e a URL continua a do app em foco
  await win(page, "projects").locator('[data-action="close"]').click();
  await settle(page, 900);
  check("fechar janela de trás não muda a URL do app em foco", (await win(page, "projects").count()) === 0 && path(page) === "/estudio" && (await win(page, "studio").getAttribute("data-focused")) === "1", path(page));
  await page.click("#os-icon-projects");
  await urlIs(page, /\/projetos$/);
  await settle(page, 500);
  await launchIcon("studio");
  await urlIs(page, /\/estudio$/);
  await settle(page, 500);
  check("Projetos reaberto na pasta e Estúdio de volta à frente", (await win(page, "projects").locator(".os-projects").count()) === 1 && (await zTop("studio")) > (await zTop("projects")) && path(page) === "/estudio", path(page));

  // minimizar → some, o ícone mostra o anel e restaura
  await win(page, "studio").locator('[data-action="min"]').click();
  await urlIs(page, /\/projetos$/);
  await settle(page, 600);
  check("minimizar esconde (visibility hidden + inert)", await win(page, "studio").evaluate((e) => getComputedStyle(e).visibility === "hidden" && e.hasAttribute("inert")));
  check("foco passa para Projetos", path(page) === "/projetos" && (await win(page, "projects").getAttribute("data-focused")) === "1", path(page));
  check("ícone do Estúdio mostra o anel de minimizada e o nome acessível diz isso", (await page.getAttribute("#os-icon-studio", "data-min")) === "1" && /Minimizar/.test(await page.locator("#os-icon-studio").textContent()));
  await launchIcon("studio");
  await urlIs(page, /\/estudio$/);
  await settle(page, 600);
  check("ícone restaura a janela minimizada", await win(page, "studio").evaluate((e) => getComputedStyle(e).visibility === "visible" && e.dataset.min === "0" && e.dataset.focused === "1"));
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
  await launchIcon("projects");
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
  await launchIcon("studio");
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

  // contato a uma ação (ícone da grade)
  await launchIcon("contact");
  await urlIs(page, /\/contato$/);
  await settle(page, 600);
  check("Contato abre pelo ícone com WhatsApp real", path(page) === "/contato" && (await win(page, "contact").locator('a[href^="https://wa.me/5533998779375"]').count()) >= 1, path(page));

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

  // a mesma composição em outros desktops, inclusive baixos: nada se sobrepõe nem sai da tela
  for (const [w, h] of [[1920, 1080], [1366, 768], [1366, 650], [1280, 600]]) {
    console.log(`\n# desktop ${w}×${h} · lema, grade, rodapé, dock e redes`);
    const c = await browser.newContext({ viewport: { width: w, height: h }, locale: "pt-BR" });
    const pg = await c.newPage();
    await pg.goto(`${BASE}/`, { waitUntil: "load" });
    await settle(pg, 1600);
    const r = await pg.evaluate(() => {
      const R = (sel) => document.querySelector(sel).getBoundingClientRect();
      const boxes = { motto: R(".os-sign__motto"), grid: R(".os-icons ul"), line: R(".os-sign__line"), dock: R(".os-dock ul"), social: R(".os-social") };
      const keys = Object.keys(boxes);
      const near = [];
      for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) {
        const a = boxes[keys[i]], b = boxes[keys[j]];
        if (Math.max(b.left - a.right, a.left - b.right, b.top - a.bottom, a.top - b.bottom) < 8) near.push(`${keys[i]}×${keys[j]}`);
      }
      const top = R(".os-topbar");
      const out = keys.filter((k) => { const b = boxes[k]; return b.left < 0 || b.top < top.bottom || b.right > innerWidth || b.bottom > innerHeight; });
      const rg = document.createRange();
      rg.selectNodeContents(document.querySelector(".os-sign__motto"));
      return { near, out, lines: new Set([...rg.getClientRects()].map((x) => Math.round(x.top))).size, cut: [...document.querySelectorAll(".os-icon-btn__label")].filter((l) => l.getClientRects().length && l.scrollWidth > l.clientWidth + 1).length };
    });
    check(`${w}×${h}: lema (≤ 2 linhas), grade, rodapé, dock e redes sem se sobrepor e dentro da tela, rótulos inteiros`, !r.near.length && !r.out.length && r.lines <= 2 && !r.cut, JSON.stringify(r));
    await c.close();
  }

  // movimento reduzido: o fundo fica na imagem, sem canvas vivo
  console.log("\n# desktop 1440×900 · prefers-reduced-motion");
  const rctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "pt-BR", reducedMotion: "reduce" });
  const rpage = await rctx.newPage();
  await rpage.goto(`${BASE}/`, { waitUntil: "load" });
  await settle(rpage, 2500);
  check("reduced motion: fundo estático (imagem), sem WebGL", (await rpage.getAttribute(".os-scene", "data-state")) === "still" && (await rpage.evaluate(() => typeof window.__mwOsScene === "undefined")));
  check("reduced motion: sem HUD no desktop largo; redes sem transição", await rpage.evaluate(() => !document.querySelector(".os-hud") && [...document.querySelectorAll(".os-social__item, .os-social__icon")].every((e) => getComputedStyle(e).transitionDuration.split(",").every((d) => parseFloat(d) === 0))));
  check("reduced motion: ícones da grade parados (sem flutuar)", await rpage.evaluate(() => [...document.querySelectorAll(".os-icons .os-icon")].every((e) => getComputedStyle(e).animationName === "none")));
  await rctx.close();

  // ajuste "Reduzir movimento" salvo: mesmo resultado
  const pctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "pt-BR" });
  const ppage = await pctx.newPage();
  await ppage.goto(`${BASE}/`, { waitUntil: "load" });
  await ppage.evaluate(() => localStorage.setItem("milweb-os:prefs", JSON.stringify({ theme: "obito", motion: "reduce", simple: false })));
  await ppage.reload({ waitUntil: "load" });
  await settle(ppage, 2500);
  check("Ajustes › Reduzir: fundo estático", (await ppage.getAttribute(".os-scene", "data-state")) === "still" && (await ppage.getAttribute("html", "data-os-motion")) === "reduce");
  await pctx.close();
}

// ------------------------------------------------------------------- tablet
// De 720 a 1079 px a área de trabalho é a de antes do desktop largo: coluna de aplicativos à esquerda, lema pequeno
// no canto com a assinatura, dock com os apps e o HUD das redes com circuitos. A janela minimizada encolhe para o
// item da dock. (Em 768 × 1024 o cartão do LinkedIn já encostava no rótulo de Serviços antes desta revisão: ali não
// se confere a sobreposição do HUD.)
if (ONLY.includes("tablet")) {
  current = "tablet";
  for (const [w, h] of [[1024, 768], [768, 1024], [1079, 800]]) {
    console.log(`\n# tablet ${w}×${h}`);
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, locale: "pt-BR" });
    const page = await ctx.newPage();
    const errs = errorsOf(page);
    await page.goto(`${BASE}/`, { waitUntil: "load" });
    await settle(page, 2600); // circuitos se desenham até ~1,9 s depois do load
    check("shell = desktop", (await page.getAttribute("html", "data-shell")) === "desktop");
    const lay = await page.evaluate(() => {
      const vis = (sel) => { const e = document.querySelector(sel); return !!e && e.getClientRects().length > 0 && getComputedStyle(e).display !== "none"; };
      const labels = [...document.querySelectorAll('.os-icons li[data-desktop="1"]')].filter((li) => li.getClientRects().length).map((li) => li.querySelector(".os-icon-btn__label").innerText).join("|");
      const dock = [...document.querySelectorAll(".os-dock li")].filter((li) => li.getClientRects().length).map((li) => li.dataset.dockSys || li.dataset.dockApp || (li.classList.contains("os-dock__sep") ? "|" : "?")).join(",");
      const motto = document.querySelector(".os-sign__motto");
      const sign = document.querySelector(".os-sign").getBoundingClientRect();
      return { labels, dock, social: vis(".os-social"), hud: vis(".os-hud"), mottoPx: parseFloat(getComputedStyle(motto).fontSize), corner: Math.round(sign.left) === 24 && innerHeight - sign.bottom > 84, dot: getComputedStyle(document.querySelector(".os-sign__dot")).color === getComputedStyle(motto).color, dots: document.querySelectorAll('.os-icon-btn__state').length };
    });
    check("coluna de aplicativos: Perfil, Projetos, Estúdio, Lab, Serviços, Contato", lay.labels === "PERFIL|PROJETOS|ESTÚDIO|LAB|SERVIÇOS|CONTATO", lay.labels);
    check("dock completa: os apps, o separador, Buscar e o tema", lay.dock === "profile,projects,studio,lab,services,contact,settings,|,search,theme", lay.dock);
    check("lema pequeno no canto inferior esquerdo, ponto na mesma cor; HUD à vista e sem o grupo compacto de redes", lay.corner && lay.mottoPx <= 21 && lay.dot && lay.hud && !lay.social, JSON.stringify(lay));
    const hud = await page.evaluate(() => {
      const h = document.querySelector(".os-hud");
      const eye = document.querySelector(".os-stage").getBoundingClientRect();
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
        pulses: document.querySelectorAll(".os-hud__wires animateMotion, .os-hud__wires animate").length === 0 && document.querySelectorAll("span.os-hud__pulse").length >= 3,
      };
    });
    check("HUD: LinkedIn à esquerda do centro, GitHub sobre Instagram à direita", hud.sides, JSON.stringify(hud));
    check("HUD: links reais em nova aba (noopener noreferrer) e microtextos", hud.links && hud.hrefs && hud.micro);
    if (w !== 768) check("HUD: painéis dentro da viewport, sem cobrir ícones, assinatura, dock ou barra", hud.clear);
    check("HUD: circuitos em SVG decorativo desenhados até o palco; pulsos como pontos HTML, sem SMIL", hud.wires && hud.pulses);
    const ghPanel = page.locator('.os-hud__panel[data-social="github"]');
    await ghPanel.hover();
    await settle(page, 350);
    check("HUD: hover eleva o cartão e dispara um pulso no circuito", (await ghPanel.evaluate((e) => getComputedStyle(e.querySelector(".os-hud__card")).transform !== "none")) && (await page.evaluate(() => document.querySelector('.os-hud__wire[data-social="github"]')?.dataset.hot === "1")));
    await page.mouse.move(Math.round(w / 2), Math.round(h * 0.7));
    // dock: abre, minimiza para o item da dock (anel, foco) e restaura
    await page.click('[data-dock-id="studio"]');
    await urlIs(page, /\/estudio$/);
    await settle(page, 600);
    check("dock abre Estúdio", (await win(page, "studio").count()) === 1);
    const target = await page.evaluate(() => { const b = document.querySelector('[data-dock-id="studio"]').getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
    await win(page, "studio").locator('[data-action="min"]').click();
    await settle(page, 700);
    const m = await page.evaluate(() => { const r = document.querySelector('.os-window[data-app="studio"]').getBoundingClientRect(); return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, min: document.querySelector('[data-dock-id="studio"]').dataset.min, active: document.activeElement?.id }; });
    check("minimizar encolhe para o item da dock (anel) e o foco vai para ele", m.min === "1" && Math.abs(m.cx - target.x) < 2 && Math.abs(m.cy - target.y) < 2 && m.active === "os-dock-studio", JSON.stringify({ m, target }));
    await page.click('[data-dock-id="studio"]');
    await settle(page, 600);
    check("dock restaura a janela minimizada", await win(page, "studio").evaluate((e) => getComputedStyle(e).visibility === "visible" && e.dataset.min === "0"));
    check("sem erros de console/hidratação", errs.length === 0, errs.slice(0, 3).join(" | "));
    await ctx.close();
  }
}

// ------------------------------------------------------------------- mobile
// Telefone (revisão 9): a tela inicial é um launcher — status, olho como papel de parede, grade de 8 ícones
// (4 colunas) e a dock de redes (WhatsApp, LinkedIn, GitHub, Instagram). Nada de lema/descrição/botões à vista.
// Cada app abre em tela cheia a partir do ícone; fechar volta à home pelo histórico (sem entradas repetidas) e
// devolve o foco ao ícone; Ajustes (sem URL) responde ao Voltar do navegador por entrada própria.
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
      const grid = r(".os-launcher__apps"), status = r(".os-launcher__status"), eye = r(".os-stage"), dock = r(".os-mdock ul");
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
        noDesktopBits: !vis(".os-hud") && !vis(".os-social") && !vis(".os-dock") && !vis(".os-icons") && !vis(".os-topbar"),
        eyeBetween: !!eye && eye.top >= status.bottom - 1 && eye.bottom <= grid.top + 2 && eye.width > 0,
        eyeImg: /scene-(tsukuyomi|void)-mobile\.webp/.test(getComputedStyle(document.querySelector(".os-scene__still")).backgroundImage),
        eyeNoPointer: getComputedStyle(document.querySelector(".os-stage")).pointerEvents === "none" && getComputedStyle(document.querySelector(".os-scene")).pointerEvents === "none",
        gridAboveDock: grid.bottom <= dock.top + 1,
        dockIn: dock.bottom <= innerHeight + 1 && dock.left >= 0 && dock.right <= innerWidth,
        // as quatro redes são links; o quinto item é o olho do tema (botão; revisão 10, olho na revisão 14)
        dockHrefs: [...document.querySelectorAll("a.os-mdock__item")].map((a) => a.href),
        dockRel: [...document.querySelectorAll("a.os-mdock__item")].every((a) => a.target === "_blank" && a.rel.includes("noopener") && a.rel.includes("noreferrer")),
        dockTheme: !!document.querySelector('button.os-mdock__item.os-mdock__theme[role="switch"]') && document.querySelectorAll(".os-mdock__item").length === 5,
        dockSmall: [...document.querySelectorAll(".os-mdock__item")].filter((a) => { const b = a.getBoundingClientRect(); return b.width < 48 || b.height < 48; }).length,
        dockLabels: [...document.querySelectorAll(".os-mdock__label")].map((l) => l.textContent.trim()).join(","),
        noScroll: document.querySelector(".os-desktop").scrollHeight <= document.querySelector(".os-desktop").clientHeight + 1,
      };
    });
    check("launcher: 8 ícones (Perfil, Projetos, Estúdio, Lab, Serviços, Contato, Ajustes, Buscar) em 4 colunas", home.tiles === 8 && home.fourCols && home.ids === "os-launch-profile,os-launch-projects,os-launch-studio,os-launch-lab,os-launch-services,os-launch-contact,os-launch-settings,os-launch-search", home.ids);
    check("launcher: ícones ≥ 56 px, rótulos ≥ 11 px sem cortes, item inteiro ≥ 48 px", home.iconPx >= 56 && home.labelPx >= 11 && !home.labelCut && home.small === 0, JSON.stringify({ icon: home.iconPx, label: home.labelPx, cut: home.labelCut, small: home.small }));
    check("sem lema, descrição, botões, HUD, dock do desktop ou barra à vista (h1 continua no DOM)", home.heroHidden && home.noDesktopBits);
    check("palco do fundo entre o status e a grade, imagem do universo pronta, sem ponteiro", home.eyeBetween && home.eyeImg && home.eyeNoPointer);
    check("dock de redes: WhatsApp, LinkedIn, GitHub, Instagram em nova aba segura + olho do tema, ≥ 48 px, dentro da tela, abaixo da grade", home.dockHrefs.length === 4 && home.dockHrefs[0].startsWith("https://wa.me/") && /linkedin\.com/.test(home.dockHrefs[1]) && /github\.com/.test(home.dockHrefs[2]) && /instagram\.com/.test(home.dockHrefs[3]) && home.dockRel && home.dockTheme && home.dockSmall === 0 && home.dockIn && home.gridAboveDock, JSON.stringify({ hrefs: home.dockHrefs, labels: home.dockLabels }));
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

    // Perfil (revisão 12, no lugar de Sobre na grade): tela cheia com URL própria, conteúdo profissional, alvos de 48 px
    await page.tap("#os-launch-profile");
    const profileUrl = await urlIs(page, /\/perfil$/);
    await settle(page, 900); // a tela entra com transição; medir depois dela (transform muda o getBoundingClientRect)
    const pm = await page.evaluate(() => { const el = document.querySelector('.os-window[data-app="profile"]'); return { screen: el?.getAttribute("data-screen"), name: el?.querySelector(".os-profile__name")?.textContent, photo: !!el?.querySelector("img.os-profile__photo"), actions: [...(el?.querySelectorAll(".os-profile__actions a") ?? [])].map((a) => Math.round(a.getBoundingClientRect().height)) }; });
    check("Perfil abre em tela cheia com a URL /perfil, nome, cargo, foto e ações de 48 px", profileUrl && pm.screen === "1" && pm.name === "Rick Januario" && pm.photo && pm.actions.length === 5 && pm.actions.every((h) => h >= 48), JSON.stringify(pm));
    await page.goBack();
    await page.waitForURL((u) => u.pathname === "/");
    await settle(page, 700);
    check("Voltar do navegador fecha o Perfil e volta à home", (await page.locator('.os-window[data-screen="1"]').count()) === 0 && path(page) === "/");
    // Ajustes (sem URL): entrada própria no histórico; o Voltar do navegador fecha
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
  // os apps abrem e voltam pelo ícone da grade; com uma janela por cima dele, pelo teclado no mesmo ícone
  const launchIcon = async (id) => {
    const el = page.locator(`#os-icon-${id}`);
    const free = await el.evaluate((a) => { const b = a.getBoundingClientRect(); return a.contains(document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2)); });
    if (free) await el.click();
    else {
      await el.focus();
      await page.keyboard.press("Enter");
    }
  };
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
  check("1. Projetos fechado: sem janela, URL raiz, ícone sem indicador", (await page.locator(".os-window").count()) === 0 && path(page) === "/" && (await page.getAttribute("#os-icon-projects", "data-open")) === "0" && (await st()).focused === null, path(page));
  check("1. fundo e palco à vista", (await page.locator(".os-scene").isVisible()) && (await page.locator(".os-stage").isVisible()));

  // 2. abrir Lab e fechar
  await page.click("#os-icon-lab");
  await urlIs(page, /\/lab$/);
  await settle(page, 500);
  check("2. Lab abre pelo ícone, que mostra o indicador", (await win(page, "lab").count()) === 1 && (await page.getAttribute("#os-icon-lab", "data-open")) === "1");
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
  await page.click("#os-icon-lab");
  await settle(page, 400);
  check("3. reabrir pelo ícone de novo não duplica a janela", (await win(page, "lab").count()) === 1 && (await page.locator(".os-window").count()) === 2);

  // 4. minimizar pelo amarelo e restaurar pelo ícone
  const lr = await rectOf(win(page, "lab"));
  await light("lab", "min").click();
  await urlIs(page, /\/projetos$/);
  await settle(page, 600);
  check("4. amarelo minimiza: oculta e inerte, ícone com anel", (await win(page, "lab").evaluate((e) => getComputedStyle(e).visibility === "hidden" && e.hasAttribute("inert"))) && (await page.getAttribute("#os-icon-lab", "data-min")) === "1" && (await page.getAttribute("#os-icon-lab", "data-open")) === "1");
  await launchIcon("lab");
  await urlIs(page, /\/lab$/);
  await settle(page, 600);
  const lr2 = await rectOf(win(page, "lab"));
  check("4. ícone restaura com a mesma geometria e foco", JSON.stringify(lr) === JSON.stringify(lr2) && (await st()).focused === "lab" && (await page.getAttribute("#os-icon-lab", "data-min")) === "0", `${JSON.stringify(lr)} → ${JSON.stringify(lr2)}`);

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
  await launchIcon("lab");
  await urlIs(page, /\/lab$/);
  await settle(page, 500);
  check("6. ícone alterna de volta para o Lab", (await zTop("lab")) > (await zTop("projects")) && (await st()).focused === "lab");
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
  await launchIcon("services");
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
  await launchIcon("projects");
  await urlIs(page, /\/projetos\/terral$/);
  await settle(page, 500);
  await page.click('[data-dock-id="settings"]');
  await settle(page, 500);
  await light("settings", "close").click();
  await settle(page, 500);
  await light("projects", "close").click();
  await toRoot();
  await settle(page, 600);
  check("7. fechar todas: só o wallpaper, nenhum app aberto, dock e ícones sem indicadores", (await page.locator(".os-window").count()) === 0 && (await st()).open.length === 0 && (await page.locator('.os-dock__item[data-open="1"], .os-icon-btn[data-open="1"]').count()) === 0 && (await page.locator(".os-scene").isVisible()));
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
      const grid = r(".os-launcher__apps"), status = r(".os-launcher__status"), eye = r(".os-stage"), dock = r(".os-mdock ul");
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
    check(`ícones ≥ ${landscape ? 48 : 56} px, rótulos ≥ 10.5 px sem cortes, grade entre status e dock, palco ${landscape ? "à direita" : "entre status e grade"}, dock de redes dentro da tela`, home.iconPx >= (landscape ? 48 : 56) && home.labelPx >= 10.5 && !home.labelCut && home.gridIn && home.eyeOk && home.dockIn, JSON.stringify({ icon: home.iconPx, label: home.labelPx, cut: home.labelCut, grid: home.gridIn, eye: home.eyeOk, dock: home.dockIn }));
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
  await page.click("#os-icon-studio");
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
// Gojo (claro) / Obito (escuro) — revisão 10, fundo da revisão 14: tema antes da hidratação (script inline), tema
// do sistema sem preferência salva, o olho do tema na dock (desktop e celular) sincronizado com Ajustes,
// persistência, movimento reduzido (troca imediata, sem canvas), contraste dos painéis das redes e dos rótulos,
// áreas de leitura calmas, sem rolagem horizontal em 320/360/390/430. A travessia com o fundo VIVO só roda se o
// canvas montar neste ambiente (?quality=high força o WebGL; no SwiftShader em resolução mínima) — senão fica
// registrada como pulada, não como verde. A arte e o desempenho reais ficam com .audit/scene/live.mjs (GPU).
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

  // 2) desktop, tema salvo Gojo: aparência, contraste, olho do tema, Ajustes, persistência
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
      const card = getComputedStyle(document.querySelector(".os-social__icon")).backgroundColor.match(/[\d.]+/g).map(Number);
      return { light: bg[0] > 235 && bg[1] > 235 && bg[2] > 235, darkText: fg[0] < 40 && fg[1] < 40 && fg[2] < 40, cardLight: card[0] > 240 && card[1] > 240 && card[2] > 240, still: getComputedStyle(document.querySelector(".os-scene__still")).backgroundImage };
    });
    check("Gojo: fundo gelo, texto escuro, placas das redes claras, imagem do Vazio Ilimitado", look.light && look.darkText && look.cardLight && /scene-void\.webp/.test(look.still), JSON.stringify(look));
    // áreas de leitura calmas: na margem da grade de apps, em volta do lema e da linha do rodapé, o fundo claro do tema
    const corners = await p.evaluate(async () => {
      const ic = document.querySelector(".os-icons ul").getBoundingClientRect();
      const mo = document.querySelector(".os-sign__motto").getBoundingClientRect();
      const ln = document.querySelector(".os-sign__line").getBoundingClientRect();
      return [[3, ic.top + 60], [3, ic.top + ic.height * 0.5], [3, ic.bottom - 20], [mo.left, mo.top - 10], [ln.left + 120, ln.bottom + 10], [ln.right + 30, ln.bottom - 6]].map(([x, y]) => [Math.round(x), Math.round(y)]);
    });
    const shotBuf = await p.screenshot();
    const lums = await p.evaluate(async ([b64, pts]) => {
      const img = new Image();
      await new Promise((res) => { img.onload = res; img.src = "data:image/png;base64," + b64; });
      const cv = document.createElement("canvas"); cv.width = img.width; cv.height = img.height;
      const g = cv.getContext("2d", { willReadFrequently: true }); g.drawImage(img, 0, 0);
      return pts.map(([x, y]) => { const d = g.getImageData(x, y, 1, 1).data; return Math.round((0.2126 * d[0] + 0.7152 * d[1] + 0.0722 * d[2]) / 2.55); });
    }, [shotBuf.toString("base64"), corners]);
    check("Gojo: áreas de leitura calmas — na margem da grade, em volta do lema e do rodapé o fundo fica claro (≥ 80 % de luminância)", lums.every((l) => l >= 80), lums.join(","));
    const cName = await contrast(p, ".os-social__name", ".os", ".os");
    const cIcon = await contrast(p, ".os-social__icon", ".os-social__icon", ".os");
    const cSign = await contrast(p, ".os-sign__line", ".os", ".os");
    const cOrigin = await contrast(p, ".os-sign__origin", ".os", ".os");
    check("Gojo: contraste ≥ 4.5 — nome da rede, ícone na placa, assinatura, origem (acento)", cName >= 4.5 && cIcon >= 4.5 && cSign >= 4.5 && cOrigin >= 4.5, `${cName} / ${cIcon} / ${cSign} / ${cOrigin}`);

    const toggle = p.locator(".os-dock__theme");
    const box = await rectOf(toggle);
    check("olho do tema na dock: ≥ 48 × 48 px, role=switch, nome acessível, aria-checked=false no claro", box && box.w >= 48 && box.h >= 48 && (await toggle.getAttribute("role")) === "switch" && (await toggle.getAttribute("aria-label")) === "Tema escuro (Obito)" && (await toggle.getAttribute("aria-checked")) === "false", JSON.stringify(box));
    await toggle.focus();
    check("olho do tema: foco visível (outline) e íris azul à vista no tema claro (a vermelha escondida)", await p.evaluate(() => { const b = document.querySelector(".os-dock__theme"); const o = getComputedStyle(b).outlineStyle !== "none" || getComputedStyle(b.querySelector(".os-icon")).boxShadow !== "none"; const blue = b.querySelector(".os-eyecon__iris--gojo"), red = b.querySelector(".os-eyecon__iris--obito"); return o && getComputedStyle(blue).display !== "none" && getComputedStyle(red).display === "none"; }));
    await toggle.click();
    await p.waitForFunction(() => document.documentElement.dataset.osTheme === "obito", null, { timeout: 4000 }).catch(() => {});
    await settled(p);
    await settle(p, 900);
    const t1 = await themeOf(p);
    check("clique no olho: Obito aplicado, salvo como escolha, switch marcado, íris vermelha à vista", t1.attr === "obito" && t1.theme === "obito" && t1.auto === false && /"theme":"obito"/.test(t1.saved) && (await toggle.getAttribute("aria-checked")) === "true" && (await p.evaluate(() => getComputedStyle(document.querySelector(".os-dock__theme .os-eyecon__iris--obito")).display !== "none" && getComputedStyle(document.querySelector(".os-dock__theme .os-eyecon__iris--gojo")).display === "none")), JSON.stringify(t1));
    const dark = await p.evaluate(() => { const bg = getComputedStyle(document.querySelector(".os")).backgroundColor.match(/\d+/g).map(Number); return bg[0] < 20 && bg[1] < 20 && bg[2] < 20 && /scene-tsukuyomi\.webp/.test(getComputedStyle(document.querySelector(".os-scene__still")).backgroundImage); });
    check("Obito: fundo carvão e imagem do Tsukuyomi", dark);
    const dName = await contrast(p, ".os-social__name", ".os", ".os");
    const dIcon = await contrast(p, ".os-social__icon", ".os-social__icon", ".os");
    const dOrigin = await contrast(p, ".os-sign__origin", ".os", ".os");
    check("Obito: contraste ≥ 4.5 — nome da rede, ícone na placa, origem (acento vermelho)", dName >= 4.5 && dIcon >= 4.5 && dOrigin >= 4.5, `${dName} / ${dIcon} / ${dOrigin}`);
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
    check("reduced motion: fundo estático, clique troca na hora (gojo), imagem do Vazio, íris azul sem piscar, nada pendente", (await p.getAttribute(".os-scene", "data-state")) === "still" && t.attr === "gojo" && t.pending === null && (await p.evaluate(() => /scene-void\.webp/.test(getComputedStyle(document.querySelector(".os-scene__still")).backgroundImage) && document.querySelector(".os-dock__theme").dataset.iris === "gojo")), JSON.stringify(t));
    await c.close();
  }

  // 4) celular: olho do tema na dock de redes em 320/360/390/430, sem rolagem horizontal, rótulos legíveis
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
        return { w: r.width, h: r.height, inside: r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight, role: b.getAttribute("role"), label: b.getAttribute("aria-label"), overflowX: document.documentElement.scrollWidth > innerWidth, labels, light: bg[0] > 235, still: getComputedStyle(document.querySelector(".os-scene__still")).backgroundImage, launchLabel: getComputedStyle(document.querySelector(".os-launch__label")).color };
      });
      const cLaunch = await contrast(p, ".os-launch__label", ".os", ".os");
      const cDock = await contrast(p, ".os-mdock__label", ".os-mdock ul", ".os");
      check(`${w}×${h} ${theme}: olho do tema ≥ 48 px dentro da tela, rótulos da dock sem corte, sem rolagem horizontal, imagem do universo, contraste rótulos ≥ 4.5`, m.w >= 48 && m.h >= 48 && m.inside && m.role === "switch" && m.labels.every((l) => !l.over) && !m.overflowX && (theme === "gojo") === m.light && new RegExp(`scene-${theme === "gojo" ? "void" : "tsukuyomi"}-mobile\\.webp`).test(m.still) && cLaunch >= 4.5 && cDock >= 4.5, JSON.stringify({ ...m, labels: m.labels.filter((l) => l.over).map((l) => l.t), cLaunch, cDock }));
      if (w === 390 && theme === "obito") {
        await p.tap(".os-mdock__theme");
        await p.waitForFunction(() => document.documentElement.dataset.osTheme === "gojo", null, { timeout: 4000 }).catch(() => {});
        await settled(p);
        await settle(p, 600);
        check("390: toque no olho do tema troca para gojo e salva", (await themeOf(p)).attr === "gojo" && /"theme":"gojo"/.test((await themeOf(p)).saved));
        await shot(p, "t03-mobile-gojo");
      }
      check(`${w}×${h} ${theme}: sem erros`, errs.length === 0, errs.slice(0, 2).join(" | "));
      await c.close();
    }
  }

  // 5) fundo VIVO (só se o canvas montar aqui: ?quality=high força o WebGL mesmo no SwiftShader, em resolução mínima):
  //    uma travessia só, o tema da interface muda NO MEIO dela (quando o universo novo chega às áreas de leitura),
  //    o universo de destino fica em cena, e o olho do controle troca de íris com a pálpebra fechada.
  {
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "pt-BR" });
    await c.addInitScript((v) => { if (!localStorage.getItem("milweb-os:prefs")) localStorage.setItem("milweb-os:prefs", v); }, prefs("gojo"));
    const p = await c.newPage();
    const errs = errorsOf(p);
    await p.goto(`${BASE}/?quality=high`, { waitUntil: "load" });
    const live = await p.waitForSelector('.os-scene[data-state="live"]', { timeout: 20000 }).then(() => true).catch(() => false);
    if (!live) console.log("  · fundo vivo: PULADO — o canvas não montou neste ambiente (sem WebGL); ver .audit/scene/live.mjs (GPU real)");
    else {
      await settle(p, 1200);
      await p.click(".os-dock__theme");
      const trace = [];
      const t0 = Date.now();
      while (Date.now() - t0 < 3200) {
        trace.push(await p.evaluate(() => {
          const sc = document.querySelector(".os-scene");
          const btn = document.querySelector(".os-dock__theme");
          return { t: 0, attr: document.documentElement.dataset.osTheme, trans: sc.dataset.trans ?? null, world: sc.dataset.world, p: window.__mwOsScene?.trans?.p ?? null, iris: btn.dataset.iris, lid: parseFloat(getComputedStyle(btn.querySelector(".os-eyecon")).getPropertyValue("--lid") || "0") };
        }));
        trace.at(-1).t = Date.now() - t0;
        await p.waitForTimeout(25);
      }
      const flip = trace.findIndex((s) => s.attr === "obito");
      const transNames = [...new Set(trace.map((s) => s.trans).filter(Boolean))];
      const irisFlip = trace.findIndex((s) => s.iris === "obito");
      const end = trace.at(-1);
      const midway = flip > 0 && trace.slice(0, flip).some((s) => s.trans) && (trace[flip].p === null || (trace[flip].p > 0.35 && trace[flip].p < 0.8));
      check("fundo vivo: uma travessia só (void → tsukuyomi) e o tema da interface muda no meio dela", transNames.length === 1 && transNames[0] === "void>tsukuyomi" && midway, JSON.stringify({ transNames, flipAt: trace[flip] }));
      check("fundo vivo: terminada a travessia, o Tsukuyomi fica em cena e nada fica pendente", end.trans === null && end.world === "tsukuyomi" && end.attr === "obito" && (await themeOf(p)).pending === null, JSON.stringify(end));
      check("olho do controle: a íris vermelha entra com a pálpebra fechada (antes de a interface trocar de tema)", irisFlip >= 0 && trace[irisFlip].lid >= 0.9 && (flip < 0 || irisFlip <= flip), JSON.stringify(trace[irisFlip]));
      check("fundo vivo: sem erros no console", errs.length === 0, errs.slice(0, 2).join(" | "));
    }
    await c.close();
  }

  // 6) fundo vivo em regime (revisão 15): os ícones da grade flutuam só na placa (botão e rótulo parados); no
  //    desktop largo não há HUD (os pulsos dos circuitos ficam no grupo `tablet`); o laço do fundo (`data-run`) para com a aba
  //    oculta — evento simulado, porque o Playwright mantém as páginas visíveis — e com uma janela maximizada, e
  //    retoma nos dois casos.
  {
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "pt-BR" });
    await c.addInitScript((v) => { if (!localStorage.getItem("milweb-os:prefs")) localStorage.setItem("milweb-os:prefs", v); }, prefs("obito"));
    const p = await c.newPage();
    const errs = errorsOf(p);
    await p.goto(`${BASE}/?quality=high`, { waitUntil: "load" });
    const live = await p.waitForSelector('.os-scene[data-state="live"]', { timeout: 20000 }).then(() => true).catch(() => false);
    const icons = () => p.evaluate(() => [...document.querySelectorAll(".os-icons .os-icon")].slice(0, 3).map((e) => ({ tr: getComputedStyle(e).translate, top: Math.round(e.closest(".os-icon-btn").getBoundingClientRect().top), label: Math.round(e.closest(".os-icon-btn").querySelector(".os-icon-btn__label").getBoundingClientRect().top), anim: getComputedStyle(e).animationName })));
    const i1 = await icons();
    await settle(p, 900);
    const i2 = await icons();
    check("ícones da grade flutuam só na placa (botão e rótulo parados)", i1.every((x) => x.anim === "os-float") && i1.some((x, k) => x.tr !== i2[k].tr) && i1.every((x, k) => x.top === i2[k].top && x.label === i2[k].label), JSON.stringify({ i1, i2 }));
    check("desktop largo sem o HUD (circuitos e pulsos): as redes ficam no grupo compacto", await p.evaluate(() => !document.querySelector(".os-hud, .os-hud__pulse, .os-hud__wires") && document.querySelectorAll(".os-social__item").length === 4));
    if (!live) console.log("  · fundo vivo em regime: PULADO — o canvas não montou neste ambiente (sem WebGL)");
    else {
      const run = () => p.evaluate(() => document.querySelector(".os-scene").dataset.run);
      await settle(p, 600);
      const r0 = await run();
      const rHidden = await p.evaluate(async () => {
        Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
        Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
        document.dispatchEvent(new Event("visibilitychange"));
        await new Promise((r) => setTimeout(r, 200));
        return document.querySelector(".os-scene").dataset.run;
      });
      const rBack = await p.evaluate(async () => {
        delete document.hidden;
        delete document.visibilityState;
        document.dispatchEvent(new Event("visibilitychange"));
        await new Promise((r) => setTimeout(r, 200));
        return document.querySelector(".os-scene").dataset.run;
      });
      check("fundo: laço rodando em cena, parado com a aba oculta, de volta ao reaparecer", r0 === "1" && rHidden === "0" && rBack === "1", `${r0} → ${rHidden} → ${rBack}`);
      await p.click("#os-icon-lab");
      await win(p, "lab").waitFor({ state: "visible", timeout: 5000 });
      await settle(p, 500);
      const max = win(p, "lab").locator('.os-window__btn[data-action="max"]');
      await max.click();
      await settle(p, 700);
      const rMax = await run();
      await max.click();
      await settle(p, 700);
      const rRest = await run();
      check("fundo: laço parado com janela maximizada, de volta ao restaurar", rMax === "0" && rRest === "1", `${rMax} → ${rRest}`);
      check("fundo vivo em regime: sem erros no console", errs.length === 0, errs.slice(0, 2).join(" | "));
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
    // navegação interna não remonta a tela (1440 px: desktop largo, o Estúdio abre pela grade)
    await p.click("#os-icon-studio");
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

  // 4) recurso essencial com erro (imagem do fundo bloqueada): a tela sai mesmo assim, sem erro no console
  {
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "pt-BR" });
    const p = await c.newPage();
    const errs = errorsOf(p);
    await p.route("**/art/scene-*.webp", (r) => r.abort());
    const t0 = Date.now();
    await p.goto(`${BASE}/`, { waitUntil: "load" });
    const gone = await bootGone(p, 6000);
    check("imagem do fundo com erro: a tela sai (limite de 2,5 s) e nada quebra", gone && errs.length === 0, `${Date.now() - t0} ms · ${errs.slice(0, 2).join(" | ")}`);
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

// ------------------------------------------------------------------- profile
// App Perfil (revisões 12 e 13): abre pela dock/coluna, URL /perfil, conteúdo do currículo sem fatos inventados
// (nada de Nubank; datas e empresas como no PDF; MilWeb como atuação independente sem data), currículo para ver
// (nova aba, PDF 200) e baixar (download=), GitHub/LinkedIn, contato abre o app Contato, case abre dentro de
// Projetos, teclado e foco visível, <details> por teclado, acesso direto nos três idiomas (+ /profile legado),
// metadata própria, temas claro/escuro, celular em tela cheia com alvos de 48 px e sem rolagem horizontal.
// Revisão 13: entrada animada uma vez por abertura (sem esconder nada do leitor, sem repetir em re-render),
// "Engenharia em prática" em abas (teclado, indicador, painéis empilhados sem salto, só fatos do código),
// navegação interna colada no corpo da janela, resumo recolhido com "ler mais", linha do tempo com fio e
// cargo em leitura, acordeões suaves, abrir/fechar repetido sem erro, celular sem controle fixo e sem vídeo
// (não há vídeos reais dos projetos), movimento reduzido sem nenhuma animação.
if (ONLY.includes("profile")) {
  current = "profile";
  console.log("\n# app Perfil");
  const booted = (c) => c.addInitScript(() => sessionStorage.setItem("milweb-os:booted", "1"));
  // 1440 px = desktop largo: o Perfil abre pelo ícone da grade (saiu da dock); com uma janela por cima, pelo teclado
  const openProfile = async (p) => {
    const el = p.locator("#os-icon-profile");
    const free = await el.evaluate((a) => { const b = a.getBoundingClientRect(); return a.contains(document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2)); });
    if (free) await el.click();
    else {
      await el.focus();
      await p.keyboard.press("Enter");
    }
  };
  {
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "pt-BR" });
    await booted(c);
    const p = await c.newPage();
    const errs = errorsOf(p);
    await p.goto(`${BASE}/`, { waitUntil: "load" });
    await settle(p, 1200);
    check("ícone Perfil (pessoa) na grade, 3ª linha à esquerda, e fora da dock", (await p.locator("#os-icon-profile .os-icon[data-kind='profile']").count()) === 1 && (await p.locator('[data-dock-id="profile"]').count()) === 0 && (await p.evaluate(() => { const r = (id) => document.querySelector(`#os-icon-${id}`).getBoundingClientRect(); return Math.round(r("profile").left) === Math.round(r("projects").left) && r("profile").top > r("studio").top && r("studio").top > r("projects").top; })));
    await openProfile(p);
    check("ícone abre a janela Perfil e a URL vira /perfil", (await urlIs(p, /\/perfil$/)) && (await win(p, "profile").count()) === 1);
    await settle(p, 900);
    const w = win(p, "profile");
    const info = await w.evaluate((el) => {
      const t = (s) => el.querySelector(s)?.textContent?.trim() ?? "";
      return {
        name: t(".os-profile__name"),
        title: t(".os-profile__title"),
        photo: !!el.querySelector(".os-profile__photo"),
        roles: [...el.querySelectorAll(".os-profile__company")].map((e) => e.firstChild?.textContent?.trim()),
        dates: [...el.querySelectorAll(".os-profile__when .tnum")].map((e) => e.textContent.trim()),
        nubank: /nubank/i.test(el.textContent ?? ""),
        independent: el.querySelectorAll('.os-profile__role[data-independent="1"]').length,
        groups: el.querySelectorAll(".os-profile__group").length,
        projects: [...el.querySelectorAll(".os-profile__pname")].map((e) => e.firstChild?.textContent?.trim()),
        codeLinks: [...el.querySelectorAll('.os-profile__plinks a[href*="github.com/rickjs2005"]')].length,
        shots: [...el.querySelectorAll(".os-profile__shot-img")].map((i) => i.getAttribute("src") || ""),
        edu: t(".os-profile__edu"),
        cvNote: t(".os-profile__cvnote"),
      };
    });
    check("apresentação: nome, cargo e foto real", info.name === "Rick Januario" && info.title === "Senior Full Stack Engineer" && info.photo);
    check("experiência como no currículo: SmartSheet, Fiserv, GoWorks e a MilWeb independente sem data", info.roles.join("|") === "SmartSheet|Fiserv|GoWorks|MilWeb" && info.dates.join("|") === "03/2025 – atual|05/2022 – 02/2025|05/2020 – 04/2022|em paralelo à carreira" && info.independent === 1, JSON.stringify({ roles: info.roles, dates: info.dates }));
    check("nenhuma menção à Nubank (divergência do currículo fica na entrega, não no site)", !info.nubank);
    check("sete grupos de competências; quatro projetos com captura real e link para o código", info.groups === 7 && info.projects.length === 4 && info.codeLinks >= 5 && info.shots.length === 4 && info.shots.every((s) => /\/shots\//.test(decodeURIComponent(s))), JSON.stringify({ groups: info.groups, projects: info.projects, codes: info.codeLinks }));
    check("formação como no currículo: USP, 08/2017 – 12/2021", /08\/2017 – 12\/2021/.test(info.edu) && /Universidade de São Paulo/.test(info.edu));
    const view = w.locator('[data-profile-action="view-cv"]');
    const dl = w.locator('[data-profile-action="download-cv"]');
    const href = await view.getAttribute("href");
    const res = await p.request.get(`${BASE}${href}`);
    check("currículo: 'Ver' aponta para o PDF (200, application/pdf, nome claro, nova aba) e 'Baixar' tem download=; nota 'PDF em inglês'", href === "/cv/rick-januario-senior-software-engineer-en.pdf" && (await view.getAttribute("target")) === "_blank" && res.status() === 200 && /application\/pdf/.test(res.headers()["content-type"] ?? "") && (await dl.getAttribute("download")) === "Rick-Januario-Senior-Software-Engineer-EN.pdf" && /inglês/i.test(info.cvNote), `${res.status()} ${res.headers()["content-type"]} · ${info.cvNote}`);
    // O Chromium headless não tem visualizador de PDF: o alvo _blank vira uma aba (com viewer) ou um download —
    // os dois provam que o clique entrega o arquivo certo sem sair do Perfil.
    const [popup, download] = await Promise.all([c.waitForEvent("page", { timeout: 6000 }).catch(() => null), p.waitForEvent("download", { timeout: 6000 }).catch(() => null), view.click()]);
    if (popup) await popup.waitForLoadState("load").catch(() => {});
    const got = (popup && /\.pdf/.test(popup.url())) || (download && /\.pdf$/.test(download.suggestedFilename()));
    check("clicar em 'Ver currículo' entrega o PDF em nova aba (ou download, no headless) e o Perfil continua aberto", !!got && (await win(p, "profile").count()) === 1, popup ? popup.url() : download ? download.suggestedFilename() : "nada");
    if (popup) await popup.close();
    check("GitHub e LinkedIn com os endereços certos, em nova aba segura", (await w.locator('[data-profile-action="github"]').getAttribute("href")) === "https://github.com/rickjs2005" && /linkedin\.com\/in\/rick-januario-41211b238/.test((await w.locator('[data-profile-action="linkedin"]').getAttribute("href")) ?? "") && (await w.locator('[data-profile-action="github"]').getAttribute("rel")) === "noopener noreferrer");
    await w.locator(".os-window__title").focus();
    let reached = false;
    for (let i = 0; i < 12 && !reached; i++) {
      await p.keyboard.press("Tab");
      reached = await p.evaluate(() => document.activeElement?.dataset.profileAction === "view-cv");
    }
    check("teclado: Tab chega a 'Ver currículo' com foco visível (outline ou fundo lima)", reached && (await p.evaluate(() => { const cs = getComputedStyle(document.activeElement); return cs.outlineStyle !== "none" || cs.backgroundColor === "rgb(183, 255, 55)"; })));
    const sum = w.locator(".os-profile__details summary").first();
    await sum.focus();
    await p.keyboard.press("Enter");
    await settle(p, 500);
    const det = await w.locator(".os-profile__details").first().evaluate((d) => ({ open: d.open, h: d.querySelector(".os-profile__dbody").getBoundingClientRect().height, ov: d.querySelector(".os-profile__dbody").style.overflow, text: /Confirmado no código/.test(d.textContent) && /Segundo o README/.test(d.textContent), focus: document.activeElement === d.querySelector("summary") }));
    check("'Detalhes técnicos' abre por teclado com altura animada (corpo visível, sem overflow residual), foco no summary, e separa código × README", det.open && det.h > 40 && det.ov === "" && det.text && det.focus, JSON.stringify(det));

    // ---- revisão 13: entrada concluída, abas, resumo, navegação interna, linha do tempo ----
    const after = await w.evaluate((el) => ({ entering: !!el.querySelector(".os-profile")?.hasAttribute("data-entering"), hidden: [...el.querySelectorAll("[data-enter]")].filter((n) => getComputedStyle(n).opacity !== "1" || n.style.opacity !== "").length, steps: el.querySelectorAll("[data-enter]").length }));
    check("entrada concluída: todos os alvos visíveis, sem marca nem estilo inline residual", !after.entering && after.hidden === 0 && after.steps >= 12, JSON.stringify(after));
    const tabs = w.locator('[role="tab"]');
    const tabInfo = await w.evaluate((el) => { const list = el.querySelector(".os-tabs"); const t = [...el.querySelectorAll('[role="tab"]')]; return { n: t.length, labels: t.map((b) => b.textContent.trim()), sel: t.map((b) => b.getAttribute("aria-selected")), ink: list.style.getPropertyValue("--ink-w"), panels: [...el.querySelectorAll('[role="tabpanel"]')].map((x) => `${x.dataset.project}:${x.dataset.active}:${x.hasAttribute("inert")}`) }; });
    check("Engenharia em prática: três abas (Backend & APIs, IA & automações, Interfaces & motion), a primeira ativa, painéis Kavita/MilLead/MilWeb OS com os inativos inertes", tabInfo.n === 3 && tabInfo.labels.join("|") === "Backend & APIs|IA & automações|Interfaces & motion" && tabInfo.sel.join("") === "truefalsefalse" && parseFloat(tabInfo.ink) > 20 && tabInfo.panels.join("|") === "ecommerce-do-agro:1:false|millead:0:true|milweb-os:0:true", JSON.stringify(tabInfo));
    const h0 = await w.locator(".os-showcase__panels").evaluate((e) => e.getBoundingClientRect().height);
    const ink0 = await w.locator(".os-tabs").evaluate((e) => e.style.getPropertyValue("--ink-x"));
    await tabs.nth(1).click();
    await settle(p, 500);
    const sw = await w.evaluate((el) => { const list = el.querySelector(".os-tabs"); const act = el.querySelector('[role="tabpanel"][data-active="1"]'); return { project: act?.dataset.project, inkX: list.style.getPropertyValue("--ink-x"), h: el.querySelector(".os-showcase__panels").getBoundingClientRect().height, sel: [...el.querySelectorAll('[role="tab"]')].map((b) => b.getAttribute("aria-selected")).join(""), ai: /pg-boss/.test(act?.textContent ?? "") && /score do lead/.test(act?.textContent ?? "") && /Anthropic/.test(act?.textContent ?? ""), op: getComputedStyle(act).opacity, vis: getComputedStyle(act).visibility, shot: !!act?.querySelector(".os-profile__shot-img") }; });
    check("'IA & automações' mostra o MilLead (score, relatório e rascunho por IA, filas pg-boss, adaptadores) com a captura real, sem mudar a altura da área (sem salto) e com o indicador deslizando", sw.project === "millead" && sw.sel === "falsetruefalse" && Math.abs(sw.h - h0) < 1 && sw.inkX !== ink0 && sw.ai && sw.op === "1" && sw.vis === "visible" && sw.shot, JSON.stringify({ h0, sw }));
    await tabs.nth(1).focus();
    await p.keyboard.press("ArrowRight");
    await settle(p, 120);
    const k1 = await p.evaluate(() => ({ focus: document.activeElement?.dataset.track, sel: document.querySelector('[role="tab"][aria-selected="true"]')?.dataset.track, outline: getComputedStyle(document.activeElement).outlineStyle, panel: document.querySelector('[role="tabpanel"][data-active="1"]')?.dataset.project }));
    await p.keyboard.press("Home");
    await settle(p, 120);
    const k2 = await p.evaluate(() => ({ focus: document.activeElement?.dataset.track, sel: document.querySelector('[role="tab"][aria-selected="true"]')?.dataset.track }));
    check("abas por teclado: → vai para 'Interfaces & motion' (painel MilWeb OS) com foco visível; Home volta para a primeira", k1.focus === "motion" && k1.sel === "motion" && k1.panel === "milweb-os" && k1.outline !== "none" && k2.focus === "backend" && k2.sel === "backend", JSON.stringify({ k1, k2 }));
    const about = w.locator(".os-profile__about");
    const moreBtn = w.locator(".os-profile__morebtn");
    const a0 = await about.evaluate((e) => ({ collapsed: e.dataset.collapsed, clipped: e.scrollHeight > e.clientHeight + 2, h: Math.round(e.getBoundingClientRect().height) }));
    await moreBtn.click();
    await settle(p, 500);
    const a1 = await about.evaluate((e) => ({ collapsed: e.dataset.collapsed, clipped: e.scrollHeight > e.clientHeight + 2, h: Math.round(e.getBoundingClientRect().height), ov: e.style.overflow }));
    check("Sobre: três linhas com 'Ler o resumo completo'; expandir mostra o texto inteiro (altura animada, sem overflow residual) e o botão vira 'Mostrar menos'", a0.collapsed === "1" && a0.clipped && a1.collapsed === "0" && !a1.clipped && a1.h > a0.h + 40 && a1.ov === "" && (await moreBtn.getAttribute("aria-expanded")) === "true" && /MOSTRAR MENOS/.test(await moreBtn.innerText()), JSON.stringify({ a0, a1 }));
    await moreBtn.click();
    await settle(p, 500);
    check("…e recolhe de volta às três linhas", (await about.getAttribute("data-collapsed")) === "1" && (await moreBtn.getAttribute("aria-expanded")) === "false");
    const nav = w.locator(".os-profile__nav");
    const navInfo = await nav.evaluate((n) => ({ pos: getComputedStyle(n).position, items: [...n.querySelectorAll("a")].map((a) => a.textContent.trim()).join("|"), active: n.querySelector('a[data-active="1"]')?.dataset.section }));
    check("navegação interna: cinco seções, colada no topo do corpo da janela (sticky), 'Apresentação' ativa no início", navInfo.pos === "sticky" && navInfo.items === "APRESENTAÇÃO|PROJETOS|EXPERIÊNCIA|COMPETÊNCIAS|FORMAÇÃO" && navInfo.active === "intro", JSON.stringify(navInfo));
    await nav.locator('a[data-section="experience"]').click();
    await settle(p, 900);
    const navAfter = await w.evaluate((el) => { const body = el.querySelector(".os-window__body"); const n = el.querySelector(".os-profile__nav"); const navTop = n.getBoundingClientRect().top; const bodyTop = body.getBoundingClientRect().top; const sec = el.querySelector("#os-profile-sec-experience").getBoundingClientRect().top; return { scrolled: body.scrollTop > 100, active: n.querySelector('a[data-active="1"]')?.dataset.section, stuck: Math.abs(navTop - bodyTop) < 1, secBelowNav: sec >= navTop + n.offsetHeight - 1, roles: [...el.querySelectorAll(".os-profile__role")].map((r) => r.dataset.active).join(""), focus: document.activeElement?.id, url: location.pathname + location.hash }; });
    check("clicar em 'Experiência' rola o corpo da janela até a seção (sob a navegação colada, sem hash na URL, foco na seção) e marca a seção e o primeiro cargo em leitura", navAfter.scrolled && navAfter.active === "experience" && navAfter.stuck && navAfter.secBelowNav && navAfter.roles === "1000" && navAfter.focus === "os-profile-sec-experience" && navAfter.url === "/perfil", JSON.stringify(navAfter));
    const tl = await w.evaluate((el) => { const t = el.querySelector(".os-profile__timeline"); const r = el.querySelector(".os-profile__role"); return { line: getComputedStyle(t, "::before").width, marker: getComputedStyle(r, "::before").borderRadius, activeBg: getComputedStyle(r, "::before").backgroundColor, idleBg: getComputedStyle(el.querySelectorAll(".os-profile__role")[1], "::before").backgroundColor, titleBlock: getComputedStyle(el.querySelector(".os-profile__roletitle")).display, legible: getComputedStyle(el.querySelectorAll(".os-profile__company")[1]).opacity === "1" }; });
    check("linha do tempo: fio vertical de 1 px, marcador redondo cheio só no cargo em leitura (os outros vazios e legíveis), cargo em linha própria sob a empresa", tl.line === "1px" && tl.marker === "50%" && tl.activeBg === "rgb(17, 17, 17)" && tl.idleBg !== tl.activeBg && tl.titleBlock === "block" && tl.legible, JSON.stringify(tl));
    await w.evaluate((el) => { el.querySelector(".os-window__body").scrollTop += 520; });
    await settle(p, 400);
    const roles2 = await w.evaluate((el) => [...el.querySelectorAll(".os-profile__role")].map((r) => r.dataset.active).join(""));
    check("rolar adiante passa o destaque para o cargo seguinte", roles2 !== "1000" && roles2.split("1").length === 2, roles2);
    await nav.locator('a[data-section="intro"]').click();
    await settle(p, 900);
    await w.locator('[data-profile-action="contact"]').click();
    check("'Entrar em contato' abre o app Contato", (await urlIs(p, /\/contato$/)) && (await win(p, "contact").count()) === 1);
    await openProfile(p);
    await settle(p, 500);
    await win(p, "profile").locator('.os-profile__plinks a[href*="/projetos/inkvision"]').click();
    check("'Case na MilWeb' abre o case dentro de Projetos", (await urlIs(p, /\/projetos\/inkvision$/)) && (await win(p, "projects").count()) === 1 && (await p.waitForSelector('.os-window[data-app="projects"] .os-case', { timeout: 15000 }).then(() => true).catch(() => false)));
    await shot(p, "pr01-desktop");
    check("sem erros de console/hidratação", errs.length === 0, errs.slice(0, 3).join(" | "));
    await c.close();
  }
  // entrada animada: uma vez por abertura; os controles ficam no DOM e clicáveis; nada se repete em re-render;
  // abrir e fechar três vezes repete a entrada e não deixa erro nem janela duplicada
  {
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "pt-BR" });
    await booted(c);
    const p = await c.newPage();
    const errs = errorsOf(p);
    await p.goto(`${BASE}/`, { waitUntil: "load" });
    await settle(p, 1200);
    await openProfile(p);
    await p.waitForSelector('.os-window[data-app="profile"] .os-profile__name');
    const early = await p.evaluate(() => { const n = document.querySelector(".os-profile__name"); const a = document.querySelector('[data-profile-action="view-cv"]'); return { op: parseFloat(getComputedStyle(n).opacity), vis: getComputedStyle(a).visibility, pe: getComputedStyle(a).pointerEvents, text: n.textContent, href: a.getAttribute("href") }; });
    await settle(p, 1600);
    const late = await p.evaluate(() => ({ all: [...document.querySelectorAll(".os-profile [data-enter]")].every((n) => getComputedStyle(n).opacity === "1" && n.style.opacity === "" && n.style.transform === ""), entering: document.querySelector(".os-profile").hasAttribute("data-entering") }));
    check("entrada: nasce em opacidade baixa com o botão já no DOM, visível ao foco e clicável; 1,6 s depois tudo visível e sem estilo inline", early.op < 1 && early.vis === "visible" && early.pe !== "none" && early.text === "Rick Januario" && /\.pdf$/.test(early.href) && late.all && !late.entering, JSON.stringify({ early, late }));
    await p.click('.os-window[data-app="profile"] [data-track="motion"]');
    await p.click('.os-dock__theme');
    await settle(p, 1400);
    const rerender = await p.evaluate(() => ({ entering: document.querySelector(".os-profile").hasAttribute("data-entering"), op: getComputedStyle(document.querySelector(".os-profile__name")).opacity, inline: document.querySelector(".os-profile__name").style.opacity, panel: document.querySelector('[role="tabpanel"][data-active="1"]')?.dataset.project }));
    check("re-render (troca de aba e de tema) não repete a entrada", !rerender.entering && rerender.op === "1" && rerender.inline === "" && rerender.panel === "milweb-os", JSON.stringify(rerender));
    const reopened = [];
    for (let i = 0; i < 3; i++) {
      await p.click('.os-window[data-app="profile"] .os-window__btn[data-action="close"]');
      await p.waitForSelector('.os-window[data-app="profile"]', { state: "detached", timeout: 5000 });
      await openProfile(p);
      await p.waitForSelector('.os-window[data-app="profile"] .os-profile__name');
      reopened.push((await p.evaluate(() => parseFloat(getComputedStyle(document.querySelector(".os-profile__name")).opacity))) < 1);
      await settle(p, 1500);
    }
    const final = await p.evaluate(() => ({ wins: document.querySelectorAll('.os-window[data-app="profile"]').length, all: [...document.querySelectorAll(".os-profile [data-enter]")].every((n) => getComputedStyle(n).opacity === "1"), url: location.pathname }));
    check("abrir e fechar o Perfil três vezes: a entrada repete a cada abertura e termina visível, uma janela só, URL /perfil, sem erros", reopened.every(Boolean) && final.wins === 1 && final.all && final.url === "/perfil" && errs.length === 0, JSON.stringify({ reopened, final, errs: errs.slice(0, 2) }));
    await c.close();
  }
  // acesso direto nos três idiomas, legado e metadata
  for (const [url, heading, present, title] of [["/perfil", "EXPERIÊNCIA", "atual", "Rick Januario — Senior Full Stack Engineer"], ["/en/profile", "EXPERIENCE", "present", "Rick Januario — Senior Full Stack Engineer"], ["/es/perfil", "EXPERIENCIA", "actual", "Rick Januario — Senior Full Stack Engineer"]]) {
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "pt-BR" });
    await booted(c);
    const p = await c.newPage();
    await p.goto(`${BASE}${url}`, { waitUntil: "load" });
    await settle(p, 1200);
    const m = await p.evaluate(() => ({ title: document.title, canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href"), desc: document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "", og: document.querySelector('meta[property="og:image"]')?.getAttribute("content") }));
    check(`${url}: abre direto no Perfil, título e descrição próprios, canonical, capa de compartilhamento`, (await win(p, "profile").count()) === 1 && m.title.startsWith(title) && m.canonical === `https://milweb.com.br${url}` && /Rick Januario/.test(m.desc) && /cover-/.test(m.og ?? "") && (await p.locator('.os-window[data-app="profile"] #os-profile-experience').innerText()) === heading && (await p.locator(".os-profile__when .tnum").first().innerText()).toLowerCase().endsWith(present), JSON.stringify({ title: m.title, canonical: m.canonical }));
    await c.close();
  }
  {
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "pt-BR" });
    const p = await c.newPage();
    await p.goto(`${BASE}/profile`, { waitUntil: "load" });
    check("/profile (segmento legado em PT) redireciona para /perfil", path(p) === "/perfil");
    await c.close();
  }
  // temas: a janela segue o papel; a dock e o ícone seguem o tema
  for (const theme of ["gojo", "obito"]) {
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "pt-BR" });
    await c.addInitScript((t) => { localStorage.setItem("milweb-os:prefs", JSON.stringify({ theme: t, motion: "system", simple: false })); sessionStorage.setItem("milweb-os:booted", "1"); }, theme);
    const p = await c.newPage();
    await p.goto(`${BASE}/perfil`, { waitUntil: "load" });
    await settle(p, 1200);
    const ok = await p.evaluate((t) => document.documentElement.dataset.osTheme === t && !!document.querySelector('.os-window[data-app="profile"]') && getComputedStyle(document.querySelector(".os-profile__name")).color === "rgb(17, 17, 17)", theme);
    check(`${theme}: Perfil aberto, texto em tinta sobre papel`, ok);
    await shot(p, `pr02-${theme}`);
    await c.close();
  }
  // celular: tela própria, rolagem vertical, alvos de 48 px, sem rolagem horizontal, reduced motion
  for (const [w, h, reduce] of [[390, 844, false], [320, 568, true]]) {
    const c = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, locale: "pt-BR", reducedMotion: reduce ? "reduce" : "no-preference" });
    await booted(c);
    const p = await c.newPage();
    const errs = errorsOf(p);
    await p.goto(`${BASE}/`, { waitUntil: "load" });
    await settle(p, 1200);
    check(`${w}: Perfil é o primeiro ícone da grade`, (await p.locator(".os-launcher__apps a, .os-launcher__apps button").first().getAttribute("id")) === "os-launch-profile");
    await p.tap("#os-launch-profile");
    check(`${w}: toque abre o Perfil em tela cheia com a URL /perfil`, (await urlIs(p, /\/perfil$/)) && (await win(p, "profile").getAttribute("data-screen")) === "1");
    const imm = await p.evaluate(() => ({ entering: !!document.querySelector(".os-profile")?.hasAttribute("data-entering"), op: getComputedStyle(document.querySelector(".os-profile__name")).opacity, panelT: getComputedStyle(document.querySelector('[role="tabpanel"][data-active="1"]')).transitionDuration }));
    check(`${w}: ${reduce ? "movimento reduzido: nada escondido na abertura e painéis sem transição" : "entrada animada na abertura"}`, reduce ? !imm.entering && imm.op === "1" && imm.panelT === "0s" : imm.entering || parseFloat(imm.op) < 1, JSON.stringify(imm));
    await settle(p, 1400);
    const m = await p.evaluate(() => {
      const el = document.querySelector('.os-window[data-app="profile"]');
      const body = el.querySelector(".os-window__body");
      const small = [...el.querySelectorAll('.os-profile__actions a, .os-profile__plinks a, .os-window__back, .os-window__close')].filter((a) => { const b = a.getBoundingClientRect(); return b.width < 44 || b.height < 44; }).length;
      return { overflowX: document.documentElement.scrollWidth > innerWidth || body.scrollWidth > body.clientWidth + 1, small, tall: body.scrollHeight > body.clientHeight, oneCol: getComputedStyle(el.querySelector('.os-showcase__panel[data-active="1"]')).gridTemplateColumns.split(" ").length === 1, tabs: [...el.querySelectorAll(".os-tabs__tab")].every((t) => t.getBoundingClientRect().height >= 44), navStatic: getComputedStyle(el.querySelector(".os-profile__nav")).position === "static", vctl: el.querySelectorAll(".os-showcase__vctl").length, morebtn: el.querySelector(".os-profile__morebtn").getBoundingClientRect().height >= 44 };
    });
    check(`${w}: rolagem só vertical, alvos ≥ 44/48 px (abas e 'ler mais' inclusive), painel em uma coluna, navegação sem fixar, sem botão de vídeo (não há vídeos reais)`, !m.overflowX && m.small === 0 && m.tall && m.oneCol && m.tabs && m.navStatic && m.vctl === 0 && m.morebtn, JSON.stringify(m));
    await p.tap('.os-window[data-app="profile"] [data-track="ai"]');
    await settle(p, 500);
    check(`${w}: tocar na aba 'IA & automações' troca o painel para o MilLead`, (await p.locator('.os-window[data-app="profile"] [role="tabpanel"][data-active="1"]').getAttribute("data-project")) === "millead");
    await p.evaluate(() => document.querySelector('.os-window[data-app="profile"] .os-window__body').scrollTo(0, 0));
    await settle(p, 400);
    check(`${w}: no topo da tela a navegação marca 'Apresentação' (as medidas são refeitas depois da transição da tela)`, (await p.locator('.os-window[data-app="profile"] .os-profile__nav a[data-active="1"]').getAttribute("data-section")) === "intro");
    await shot(p, `pr03-m${w}`);
    check(`${w}: sem erros`, errs.length === 0, errs.slice(0, 2).join(" | "));
    await c.close();
  }
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
