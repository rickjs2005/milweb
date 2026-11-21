/**
 * Matéria — verificação da escultura, da conversa e das prévias, pela interface real.
 *
 *   node scripts/materia-check.mjs [--base http://127.0.0.1:3100] [--only scene,gestures,entries,match,mixed,recruiter,client,explore,languages,idea,voice,reduced,loading,mobile,policy] [--software]
 *
 * Por padrão usa a GPU real (ANGLE/D3D11) para a cena viva. `--software` força a GPU por software:
 * a cena cai na imagem estática e a conversa precisa funcionar do mesmo jeito (a prévia abre direto).
 *
 * Grupos:
 *   scene      a primeira tela: a escultura em repouso, os dois destaques, a navegação, a conversa discreta, o cérebro
 *   gestures   os seis gestos (Projetos, Perfil, Serviços, Estúdio, Lab, Orçamento): a figura de cada destino, a passagem
 *              presa às mãos, a página de verdade por baixo, o foco; a segunda escolha, o teclado, Voltar, movimento
 *              reduzido, sem WebGL, carregamento lento, link direto, idiomas e telefone
 *   entries    as entradas da conversa para qualquer cliente ou recrutador e a recomendação pelo objetivo (PT, EN, ES)
 *   match      a escolha da referência pela frase inteira (mergulho × comércio, desempate, outros setores) em PT, EN e ES
 *   mixed      pedido que mistura intenções: preço + quem a pessoa é + o que ela quer; o pedido só abre quando ela escolhe
 *   recruiter  o caminho curto: Perfil, currículo em PDF, evidência
 *   client     a psicóloga: resposta curta (uma recomendação, um motivo, uma pergunta), "Por que este exemplo?", pedido
 *   explore    exploração livre, "me mostra outro", retorno do case
 *   languages  os mesmos percursos em inglês e em espanhol
 *   idea       "Ver uma ideia para o meu site": o recorte no rosto, as duas prévias, a passagem ao orçamento
 *   voice      voz SIMULADA (ver abaixo)
 *   reduced    movimento reduzido: poses estáticas, destino e prévia abrem direto
 *   loading    o 3D ainda carregando: projetos e prévia continuam acessíveis
 *   mobile     telefone: os convites, a prévia, a volta à conversa, o orçamento com o teclado aberto
 *   policy     Permissions-Policy
 *
 * VOZ: o grupo `voice` SIMULA o reconhecimento de fala (um `SpeechRecognition` falso injetado na
 * página) — confere a transcrição, a permissão negada, a interrupção da resposta e o fim da escuta ao
 * fechar. Não é teste com microfone físico; esse só se faz num aparelho, à mão.
 * TECLADO DO TELEFONE: simulado encolhendo `visualViewport` — confere a lógica, não um teclado real.
 * O teste para antes de qualquer envio: nenhum link de e-mail ou WhatsApp é aberto.
 */
import { chromium } from "playwright";

const opt = (k, d) => {
  const i = process.argv.indexOf(k);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d;
};
const BASE = opt("--base", "http://127.0.0.1:3100").replace(/\/$/, "");
const ONLY = opt("--only", "scene,gestures,entries,match,mixed,recruiter,client,explore,languages,idea,voice,reduced,loading,mobile,policy").split(",");
const SOFTWARE = process.argv.includes("--software");
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const DESK = { viewport: { width: 1440, height: 900 } };
const PHONE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, userAgent: UA };

let pass = 0;
const fails = [];
const check = (name, ok, detail = "") => {
  if (ok) pass++;
  else fails.push(name);
  console.log(`  ${ok ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
};

const browser = await chromium.launch({ args: SOFTWARE ? ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] : ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });

async function open(path, o = {}) {
  const ctx = await browser.newContext({ ...(o.phone ? PHONE : DESK), locale: o.locale ?? "pt-BR", colorScheme: "dark", reducedMotion: o.reduced ? "reduce" : "no-preference" });
  // Registra o que a página manda abrir em outra aba (no navegador sem janela o PDF vira download e a aba some).
  await ctx.addInitScript(() => {
    window.__opened = [];
    const real = window.open;
    window.open = function (url, ...rest) {
      window.__opened.push(String(url));
      return real.call(window, url, ...rest);
    };
  });
  if (o.init) await ctx.addInitScript(o.init);
  const page = await ctx.newPage();
  if (o.route) await o.route(page);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && !/_vercel|favicon|Failed to load resource/.test(m.text()) && errors.push(m.text().slice(0, 160)));
  await page.goto(`${BASE}${path}${path.includes("?") ? "&" : "?"}scene-debug`, { waitUntil: "load" });
  await page.waitForSelector(".os-materia-talk", { state: "visible", timeout: 30000 });
  await page.waitForTimeout(o.settle ?? 600);
  return { ctx, page, errors };
}
const live = (page, ms = 20000) => page.waitForFunction(() => document.querySelector(".os-materia")?.dataset.state === "live", null, { timeout: ms }).then(() => true).catch(() => false);
const talk = async (page) => {
  await page.locator(".os-materia-talk").click();
  await page.waitForSelector(".os-materia-panel", { state: "visible", timeout: 8000 });
};
/**
 * A conversa se recolhe na pílula quando um destino abre pelo gesto da escultura (ela cobriria a cena): quem vai
 * continuar a conversa reabre a folha — o histórico, a resposta e as ações continuam lá.
 */
const ensure = async (page, patience = 12000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < patience) {
    if ((await page.locator(".os-materia-panel").count()) > 0) return;
    const bubble = page.locator(".os-materia-bubble");
    if ((await bubble.count()) === 0) return;
    // durante o gesto a pílula fica fora de alcance: tenta de novo em seguida
    await bubble.click({ timeout: 900 }).catch(() => undefined);
    if (await page.waitForSelector(".os-materia-panel", { state: "visible", timeout: 900 }).then(() => true).catch(() => false)) return;
  }
};
const replies = async (page) => {
  await ensure(page);
  return page.locator('.os-materia-msg[data-from="materia"]:not([data-thinking]) > p').allInnerTexts();
};
/** Espera a resposta nova da Matéria depois de `act` (escrever, ou tocar numa resposta rápida). */
async function answer(page, act) {
  const before = (await replies(page)).length;
  await act();
  const t0 = Date.now();
  for (;;) {
    const n = await page.locator('.os-materia-msg[data-from="materia"]:not([data-thinking]) > p').count();
    if (n > before) break;
    if (Date.now() - t0 > 12000) throw new Error("a Matéria não respondeu em 12 s");
    // um destino pode ter aberto pelo gesto nesse meio-tempo: a folha se recolheu, e a resposta está nela
    if ((await page.locator(".os-materia-panel").count()) === 0) await ensure(page, 1500);
    await page.waitForTimeout(100);
  }
  await page.waitForTimeout(250);
  const all = await page.locator('.os-materia-msg[data-from="materia"]:not([data-thinking]) > p').allInnerTexts();
  return all[all.length - 1];
}
/** Escreve, envia e espera a resposta nova da Matéria. */
const say = (page, text) =>
  answer(page, async () => {
    await page.locator("#os-materia-input").fill(text);
    await page.locator("#os-materia-input").press("Enter");
  });
/** Toca numa resposta rápida (ou ação) da última mensagem. */
const chip = (page, rx) => page.locator(".os-materia-msg__actions button", { hasText: rx }).first();
const pick = (page, rx) => answer(page, () => chip(page, rx).click());
const chips = async (page) => {
  await ensure(page);
  return page.locator(".os-materia-msg__actions button").allInnerTexts();
};
const card = async (page) => {
  await ensure(page);
  return page.locator(".os-materia-msg:last-child .os-materia-card strong").innerText().catch(() => "");
};
const pathIs = (page, rx, ms = 6000) => page.waitForURL((u) => rx.test(u.pathname), { timeout: ms }).then(() => true).catch(() => false);
const stays = async (page, rx, ms = 1800) => {
  await page.waitForTimeout(ms);
  return rx.test(new URL(page.url()).pathname);
};
const reopen = async (page) => {
  const bubble = page.locator(".os-materia-bubble");
  if (await bubble.count()) await bubble.click();
  await page.waitForSelector(".os-materia-panel", { state: "visible", timeout: 5000 });
};
/** Recomeçar: outra pessoa, outra conversa. */
const restart = async (page) => {
  if (!(await page.locator(".os-materia-panel").count())) await reopen(page);
  await page.locator(".os-materia-panel__icon").first().click();
  await page.waitForTimeout(300);
};
const sentences = (text) => text.split(/(?<=[.!?])\s+/).filter(Boolean).length;
const GUIDE = '[class*="project-guide_guide__"]';
const request = async (page) => {
  await page.waitForSelector(`${GUIDE} textarea[readonly]`, { timeout: 8000 });
  return page.evaluate((sel) => {
    const root = document.querySelector(sel);
    const links = [...root.querySelectorAll('[class*="project-guide_actions__"] a')].map((a) => a.href);
    const mail = links.find((h) => h.startsWith("mailto:"));
    return { notes: root.querySelector("textarea:not([readonly])").value, preview: root.querySelector("textarea[readonly]").value, body: mail ? decodeURIComponent(mail.split("body=")[1]) : "" };
  }, GUIDE);
};
const IDEA = '.os-window[data-app="idea"]';
/** A prévia entra pela conversa (antes era um botão da primeira tela): abre a conversa e pede a ideia por escrito. */
const IDEA_ASK = { pt: "Ver uma ideia para o meu site", en: "See an idea for my site", es: "Ver una idea para mi sitio" };
const askIdea = async (page, lang) => {
  if (!(await page.locator(".os-materia-panel").count())) await talk(page);
  const code = lang ?? (await page.evaluate(() => document.documentElement.lang)).slice(0, 2).toLowerCase();
  const sel = '.os-materia-msg[data-from="materia"]:not([data-thinking]) > p';
  const before = await page.locator(sel).count();
  await page.locator("#os-materia-input").fill(IDEA_ASK[code] ?? IDEA_ASK.pt);
  await page.locator("#os-materia-input").press("Enter");
  // a saudação já estava na folha: espera a resposta a este pedido
  await page.waitForFunction(([q, n]) => document.querySelectorAll(q).length > n, [sel, before], { timeout: 8000 }).catch(() => undefined);
};
const engine = (page) => page.evaluate(() => window.__mwMateria?.state ?? null);
const MONEY = /(R\$|US\$|USD|\$\s?\d|\d+\s?(reais|dólares|dolares|dollars|euros))/i;

// ───────────────────────── cena: a escultura em repouso, a hierarquia da primeira tela, a conversa
const eng = (page) => page.evaluate(() => { const q = window.__mwMateria?.state; return q ? { char: q.char, prev: q.prev, shift: q.shift, hero: q.hero, morph: q.morph, act: q.act, reach: q.reach, pulling: q.pulling, release: q.release, done: q.done, arms: q.arms, hands: q.hands, miss: q.miss, alive: q.alive, loaded: q.loaded, frames: q.frames, fps: q.fps, ms: q.ms, costMs: q.costMs, dpr: q.dpr, count: q.count, arriving: q.arriving, passage: q.passage, mood: q.mood } : null; });
/** A janela de um app como está agora: recorte, transformação, lugar definitivo (sem a transformação) e foco. */
const winOf = (page, app) => page.evaluate((a) => { const w = document.querySelector(`.os-window[data-app="${a}"]`); if (!w) return null; const cs = getComputedStyle(w); const l = w.offsetParent?.getBoundingClientRect(); return { arriving: w.dataset.arriving ?? null, clip: cs.clipPath, tf: cs.transform, opacity: cs.opacity, x: (l?.left ?? 0) + w.offsetLeft, y: (l?.top ?? 0) + w.offsetTop, w: w.offsetWidth, h: w.offsetHeight, focusIn: w.contains(document.activeElement), html: document.documentElement.dataset.osArriving ?? null, path: location.pathname }; }, app);
const far = (p, q) => (p && q ? Math.hypot(p.x - q.x, p.y - q.y) : 9999);
const GO = ["projects", "profile", "services", "studio", "lab", "contact"];

if (ONLY.includes("scene")) {
  console.log("\n— cena (desktop 1440 × 900)");
  const { ctx, page, errors } = await open("/en", { locale: "en-US" });
  const alive = await live(page);
  check("a cena entra viva com GPU real (ou fica a imagem com --software)", SOFTWARE ? !alive : alive);
  const box = (sel) => page.locator(sel).first().boundingBox();
  const motto = await box(".os-sign__motto");
  const pj = await box("#os-icon-projects");
  const pf = await box("#os-icon-profile");
  const label = async (app) => (await page.locator(`#os-icon-${app} .os-icon-btn__cta`).innerText()).trim().toUpperCase();
  check("“See the work” e “Profile and résumé” são os dois destaques: logo abaixo do lema, no terço esquerdo, com alvo ≥ 44 px", (await label("projects")) === "SEE THE WORK" && (await label("profile")) === "PROFILE AND RÉSUMÉ" && !!motto && !!pj && !!pf && pj.y > motto.y + motto.height - 6 && Math.abs(pj.x - pf.x) < 2 && pf.y >= pj.y + pj.height && pf.y - (pj.y + pj.height) < 16 && Math.abs(pj.width - pf.width) < 2 && pf.x + pf.width < 250 && pj.height >= 44 && pf.height >= 44, pj && pf && `projetos em y ${Math.round(pj.y)}, perfil em y ${Math.round(pf.y)}, ${Math.round(pj.width)} px de largura`);
  const plates = await page.evaluate(() => {
    const alpha = (sel) => { const m = getComputedStyle(document.querySelector(sel)).backgroundColor.match(/[\d.]+/g) ?? []; return m.length < 4 ? 1 : Number(m[3]); };
    return { projects: alpha("#os-icon-projects"), profile: alpha("#os-icon-profile"), talk: alpha(".os-materia-talk"), talkBorder: getComputedStyle(document.querySelector(".os-materia-talk")).borderTopColor };
  });
  check("o primeiro destaque é a placa cheia; o segundo, contorno sobre a parede", plates.projects === 1 && plates.profile < 0.9, JSON.stringify(plates));
  const nav = [];
  for (const app of ["services", "studio", "lab", "contact"]) nav.push(await box(`#os-icon-${app}`));
  check("os demais destinos (Services, Studio, Lab, Quote) ficam agrupados logo abaixo, em 2 × 2, com alvo ≥ 44 px", nav.every((n) => !!n && n.height >= 44 && n.width >= 44 && n.y >= pf.y + pf.height) && Math.abs(nav[0].y - nav[1].y) < 2 && Math.abs(nav[2].y - nav[3].y) < 2 && nav[2].y > nav[0].y + 40 && nav[1].x > nav[0].x && Math.abs(nav[0].x - nav[2].x) < 2 && nav.every((n) => n.x + n.width < 250), nav.map((n) => n && `${Math.round(n.x)},${Math.round(n.y)}`).join(" · "));
  const tk = await box(".os-materia-talk");
  check("“Talk to Matéria” é a terceira entrada: discreta (sem placa), logo abaixo da navegação, com alvo ≥ 44 px", !!tk && plates.talk === 0 && tk.y >= nav[2].y + nav[2].height - 4 && tk.height >= 44 && tk.x + tk.width < 250 && /TALK TO MATÉRIA/i.test(await page.locator(".os-materia-talk").innerText()), tk && `y ${Math.round(tk.y)}, ${Math.round(tk.width)} × ${Math.round(tk.height)}`);
  check("a primeira tela não tem outros convites (a prévia entra pela conversa; a dobra saiu)", (await page.locator(".os-materia-idea, .os-materia-fold, .os-materia-tip").count()) === 0 && !(await page.locator(".os-materia-go").first().isVisible()));
  check("a barra do alto traz MILWEB e a identificação do estúdio", /MILWEB/.test(await page.locator(".os-topbar__brand").innerText()) && /CREATIVE DEVELOPMENT STUDIO/i.test(await page.locator(".os-topbar__app").innerText()), await page.locator(".os-topbar__app").innerText());
  check("os controles ficam numa coluna à esquerda, que as janelas não cobrem (elas abrem a partir de x = 252); o lema, na metade esquerda", [pj, pf, tk, ...nav].every((r) => r.x + r.width < 250) && motto.x + motto.width < 1440 * 0.5, `lema até x ${Math.round(motto.x + motto.width)}`);
  if (alive) {
    const s = await eng(page);
    check("a escultura em repouso: a figura inteira, o braço direito formado (o outro ombro ainda é bloco), as moléculas guardadas, quadro dentro do orçamento", s.char === "rest" && s.hero === 1 && s.arms.a === 1 && s.arms.b === 0 && s.count >= 20000 && s.ms < 40, `${s.count} moléculas, ${s.ms.toFixed(1)} ms no laço, custo medido ${s.costMs.toFixed(1)} ms, dpr ${s.dpr.toFixed(2)}`);
    const f0 = s.frames;
    await page.waitForTimeout(700);
    const f1 = (await eng(page)).frames;
    check("os grãos de prata sobem até o punho (a cena redesenha enquanto está viva)", f1 > f0 + 5, `${f1 - f0} quadros em 0,7 s`);
    await page.waitForFunction(() => !window.__mwMateria.state.alive && window.__mwMateria.state.fps === 0, null, { timeout: 22000 }).catch(() => undefined);
    const a0 = (await eng(page)).frames;
    await page.waitForTimeout(900);
    const a1 = (await eng(page)).frames;
    check("sem ninguém por perto, a cena para de redesenhar (o quadro continua na tela sem gastar a GPU)", a1 === a0, `${a1 - a0} quadros em 0,9 s`);
    await page.mouse.move(900, 500);
    await page.mouse.move(906, 506);
    await page.waitForTimeout(800);
    check("o ponteiro por perto acorda os grãos", (await eng(page)).frames > a1 + 5);
    const warm = await page.waitForFunction(() => ["projects", "profile"].every((id) => window.__mwMateria.state.loaded.includes(id)), null, { timeout: 15000 }).then(() => true).catch(() => false);
    check("as figuras dos dois destaques chegam adiantadas, sem esperar o clique; as outras quatro só sob demanda", warm && !(await eng(page)).loaded.some((id) => ["services", "studio", "lab", "contact"].includes(id)), (await eng(page)).loaded.join(", "));
  }
  // a conversa
  await talk(page);
  check("texto e microfone disponíveis desde o primeiro momento", (await page.locator("#os-materia-input").isVisible()) && (await page.locator(".os-materia-panel__mic").isVisible()));
  const first = await chips(page);
  check("a conversa abre com “See the sites”, “See the résumé” e “I want a quote”", first.join("|") === "See the sites|See the résumé|I want a quote", first.join(" | "));
  if (alive) {
    const thought = await page.waitForFunction(() => window.__mwMateria.state.morph > 0.98 && window.__mwMateria.state.hero < 0.02, null, { timeout: 8000 }).then(() => true).catch(() => false);
    check("na conversa a escultura se recolhe e a prata vira o cérebro", thought && (await page.locator(".os-materia").getAttribute("data-pose")) === "brain");
    await page.keyboard.press("Escape");
    const back = await page.waitForFunction(() => window.__mwMateria.state.hero === 1 && window.__mwMateria.state.morph === 0, null, { timeout: 8000 }).then(() => true).catch(() => false);
    check("fechar a conversa devolve a escultura", back && (await eng(page)).char === "rest");
  }
  check("sem erros de console", errors.length === 0, errors.slice(0, 2).join(" | "));
  await ctx.close();
}

// ───────────────────────── os seis gestos: a figura de cada destino, a passagem, a página de verdade
if (ONLY.includes("gestures")) {
  /** Depois do toque: amostras do motor e da janela até o gesto terminar. */
  const follow = async (page, app, ms = 16000) => {
    const out = [];
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      const [e, w] = await Promise.all([eng(page), winOf(page, app)]);
      out.push({ t: Date.now() - t0, e, w });
      if (e && w && e.done && !w.html) break;
      if (!e && w && !w.html && w.opacity === "1") break;
      await page.waitForTimeout(25);
    }
    return out;
  };
  const CONTENT = {
    projects: async (page) => {
      const active = await page.locator('.bounty__slot[data-active="1"]').getAttribute("data-slug");
      const seal = (await page.locator('.bounty__slot[data-active="1"] .bounty__seal').innerText()).trim();
      const visit = page.locator('.bounty__acts [data-act="visit"]');
      const other = await page.locator('.bounty__slot[data-d="1"]').first().evaluate((el) => { const r = el.getBoundingClientRect(); return getComputedStyle(el).visibility === "visible" && r.width > 40; });
      return { ok: active === "terral" && seal.length > 3 && (await visit.getAttribute("href")) === "https://terral-cafe.vercel.app" && (await visit.getAttribute("target")) === "_blank" && (await page.locator('.bounty__acts [data-act="made"]').isVisible()) && (await page.locator('.bounty__acts [data-act="try"]').isVisible()) && other, note: `em destaque: ${active} (${seal}), com Visitar site, Experimentar e Como foi feito; outro site à vista` };
    },
    profile: async (page) => {
      const t = await page.locator('.os-window[data-app="profile"]').innerText();
      const cv = page.locator('[data-profile-action="view-cv"]');
      const dl = page.locator('[data-profile-action="download-cv"]');
      const head = await fetch(new URL(await cv.getAttribute("href"), BASE)).then((r) => ({ ok: r.ok, type: r.headers.get("content-type") })).catch(() => ({ ok: false, type: "" }));
      return { ok: /RICK JANUARIO/i.test(t) && /Senior Full Stack Engineer/i.test(t) && (await cv.isVisible()) && (await dl.isVisible()) && /\.pdf$/.test((await cv.getAttribute("href")) ?? "") && head.ok && /pdf/.test(head.type ?? ""), note: `nome, função, ver e baixar o currículo; o PDF responde (${head.type})` };
    },
    services: async (page) => {
      const links = await page.locator('.os-window[data-app="services"] a[href]').count();
      return { ok: links >= 4, note: `${links} caminhos (entregas e proposta)` };
    },
    studio: async (page) => {
      const t = await page.locator('.os-window[data-app="studio"]').innerText();
      return { ok: t.length > 300 && (await page.locator('.os-window[data-app="studio"] a[href]').count()) >= 1, note: `${t.length} caracteres do processo` };
    },
    lab: async (page) => {
      const works = await page.locator('.os-window[data-app="lab"] :is(a[href], button)').count();
      return { ok: works >= 2, note: `${works} controles (experimentos e filmes)` };
    },
    contact: async (page) => {
      const win = page.locator('.os-window[data-app="contact"]');
      const written = await win.locator("button, a", { hasText: /Pedir proposta por escrito/i }).first().isVisible().catch(() => false);
      const channels = await win.locator('a[href^="https://wa.me"], a[href^="mailto:"]').count();
      return { ok: written && channels >= 2, note: `o pedido por escrito a um toque e ${channels} canais que já existem (WhatsApp, e-mail)` };
    },
  };
  const NAME = { projects: "Projetos · a Curadora", profile: "Perfil · o Arquivista", services: "Serviços · a Arquiteta", studio: "Estúdio · o Gravador", lab: "Lab · a Inventora", contact: "Orçamento · a Mensageira" };

  for (const app of GO) {
    console.log(`\n— gesto: ${NAME[app]} (desktop 1440 × 900)`);
    const { ctx, page, errors } = await open("/");
    const alive = await live(page);
    if (alive) {
      await page.evaluate((id) => window.__mwMateria.need(id), app);
      // câmera lenta (só no teste): dá para medir o gesto quadro a quadro
      await page.evaluate(() => window.__mwMateria.pace(0.3));
    }
    const href = new URL(await page.locator(`#os-icon-${app}`).getAttribute("href"), BASE).pathname;
    await page.locator(`#os-icon-${app}`).click();
    const S = await follow(page, app);
    await page.evaluate(() => window.__mwMateria?.pace(1));
    const opened = S.find((x) => x.w && x.w.path === href);
    if (alive) {
      const became = S.find((x) => x.e.char === app);
      check("o clique responde na hora: a rota e a janela abrem e a pedra já começa a virar a figura do destino", !!opened && opened.t < 700 && !!became && became.t < 700 && S[0].e.shift < 1, `rota em ${opened?.t} ms, transformação em ${became?.t} ms`);
      const before = S.filter((x) => x.w && x.e.act === app && !x.e.passage && !x.e.done);
      const during = S.filter((x) => x.w && x.e.passage && !x.e.passage.done && x.e.passage.q < 0.98);
      const shaped = during.filter((x) => /^(polygon|circle)\(/.test(x.w.clip) && x.w.tf !== "none" && x.w.arriving === "1");
      check("a janela espera recolhida até as mãos chegarem ao contato; então a página de verdade aparece pela abertura (recortada pelo contorno que as mãos seguram)", before.length >= 2 && before.every((x) => x.w.opacity === "0" || /inset/.test(x.w.clip)) && during.length >= 4 && shaped.length === during.length, `${before.length} amostras à espera, ${shaped.length}/${during.length} recortadas (${app === "lab" ? "círculo" : "polígono"})`);
      const held = during.filter((x) => x.e.reach >= 1 && x.e.pulling > 0.12 && x.e.release === 0);
      const off = Math.max(0, ...held.map((x) => Math.max(x.e.miss.a, x.e.miss.b)));
      check("as mãos tocam o que seguram durante todo o movimento (o ponto de contato de cada uma a menos de 0,3 unidade do alvo)", held.length >= 3 && off < 0.3, `${held.length} amostras, no máximo ${off.toFixed(2)} unidade`);
      if (app === "projects") {
        const pull = during.filter((x) => x.e.pulling > 0.08 && x.e.release === 0);
        const gap = Math.max(0, ...pull.map((x) => Math.max(far(x.e.hands.a, x.e.hands.tl), far(x.e.hands.b, x.e.hands.tr))));
        const lifted = pull.length ? pull[pull.length - 1].e.hands.tr.y < pull[0].e.hands.tr.y - 60 && pull[pull.length - 1].e.hands.tl.y < pull[0].e.hands.tl.y - 15 : false;
        check("as duas mãos seguram a borda durante o movimento: a esquerda dela a ergue em diagonal, a direita a segura e sobe depois", pull.length >= 4 && gap < 30 && lifted, `${pull.length} amostras, no máximo ${gap.toFixed(0)} px das quinas`);
      }
      await page.waitForTimeout(120);
      const end = { e: await eng(page), w: await winOf(page, app) };
      const rect = during.length ? during[0].w : null;
      check("as mãos soltam e a abertura segue sozinha até as coordenadas reais: no fim a janela está inteira, no lugar e com o foco", end.e.done && end.w.clip === "none" && end.w.tf === "none" && !end.w.arriving && !end.w.html && end.w.focusIn && !!rect && rect.x === end.w.x && rect.w === end.w.w, `janela em (${end.w.x}, ${end.w.y}) ${end.w.w} × ${end.w.h}${end.w.tf === "none" ? "" : " · " + end.w.tf}`);
    } else {
      check("sem a cena viva, o destino abre direto", !!opened && S[S.length - 1].w.opacity === "1");
    }
    const c = await CONTENT[app](page);
    check("o que chega é a página de verdade, pronta para usar", c.ok, c.note);
    check("sem erros de console", errors.length === 0, errors.slice(0, 2).join(" | "));
    await ctx.close();
  }

  console.log("\n— gestos: o tempo, a segunda escolha, o teclado, Voltar");
  {
    const { ctx, page } = await open("/");
    if (await live(page)) {
      await page.evaluate(() => window.__mwMateria.need("projects"));
      await page.waitForTimeout(400);
      const t0 = Date.now();
      await page.locator("#os-icon-projects").click();
      let contact = 0, release = 0, end = 0;
      while (Date.now() - t0 < 6000 && !end) {
        const e = await eng(page);
        if (!contact && e.reach > 0) contact = Date.now() - t0;
        if (!release && e.release > 0) release = Date.now() - t0;
        if (e.done) end = Date.now() - t0;
        await page.waitForTimeout(16);
      }
      check("o gesto principal (alcançar e puxar) dura cerca de um segundo; do clique à janela inteira, menos de três", release - contact > 500 && release - contact < 1700 && end > 0 && end < 3000, `transformação ${contact} ms, gesto ${release - contact} ms, tudo ${end} ms`);
    }
    await ctx.close();
  }
  {
    const { ctx, page } = await open("/");
    const alive = await live(page);
    if (alive) for (const id of ["projects", "profile"]) await page.evaluate((x) => window.__mwMateria.need(x), id);
    await page.locator("#os-icon-projects").click();
    await page.waitForTimeout(alive ? 520 : 100);
    const mid = alive ? await eng(page) : null;
    await page.locator("#os-icon-profile").click();
    await page.waitForTimeout(160);
    const [e2, w1, w2] = await Promise.all([eng(page), winOf(page, "projects"), winOf(page, "profile")]);
    check("uma segunda escolha interrompe a primeira: o destino anterior aparece inteiro na hora e a figura parte de onde está", (await pathIs(page, /\/perfil$/, 8000)) && w1.clip === "none" && !w1.arriving && (!alive || (mid.arriving === "projects" && e2.arriving === "profile" && (e2.char === "profile" || e2.prev !== null))), alive ? `antes: ${mid.arriving}, depois: ${e2.arriving}` : "sem motor");
    const settled = await page.waitForFunction(() => !document.documentElement.dataset.osArriving, null, { timeout: 8000 }).then(() => true).catch(() => false);
    check("…e o novo destino chega pelo gesto dele", settled && (await winOf(page, "profile")).clip === "none" && (!alive || (await eng(page)).char === "profile") && !!w2);
    await ctx.close();
  }
  {
    const { ctx, page } = await open("/");
    const alive = await live(page);
    if (alive) await page.evaluate(() => window.__mwMateria.need("studio"));
    await page.locator("#os-icon-studio").focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(260);
    const waiting = alive ? (await eng(page)).arriving : "studio";
    await page.keyboard.press("ArrowDown");
    const now = await page.waitForFunction(() => { const w = document.querySelector('.os-window[data-app="studio"]'); return !document.documentElement.dataset.osArriving && !!w && getComputedStyle(w).clipPath === "none" && getComputedStyle(w).opacity === "1"; }, null, { timeout: 800 }).then(() => true).catch(() => false);
    check("pelo teclado: Enter abre com o gesto, e qualquer tecla seguinte entrega a janela na hora, com o foco nela", waiting === "studio" && now && (await winOf(page, "studio")).focusIn);
    await ctx.close();
  }
  {
    const { ctx, page } = await open("/");
    const alive = await live(page);
    if (alive) for (const id of ["projects", "profile"]) await page.evaluate((x) => window.__mwMateria.need(x), id);
    const h0 = await page.evaluate(() => history.length);
    await page.locator("#os-icon-projects").click();
    await page.waitForFunction(() => !document.documentElement.dataset.osArriving, null, { timeout: 8000 }).catch(() => undefined);
    await page.waitForTimeout(400);
    // em meio a Projetos, pede o Perfil pela conversa
    await page.locator(".os-materia-bubble").click();
    await page.waitForSelector(".os-materia-panel", { state: "visible" });
    await say(page, "sou recrutador");
    const atProfile = await pathIs(page, /\/perfil$/, 8000);
    await page.waitForFunction(() => !document.documentElement.dataset.osArriving, null, { timeout: 8000 }).catch(() => undefined);
    await page.waitForTimeout(500);
    const h2 = await page.evaluate(() => history.length);
    const folded = (await page.locator(".os-materia-panel").count()) === 0 && (await page.locator(".os-materia-bubble").count()) === 1;
    check("em meio a Projetos, pedir o Perfil pela conversa: a folha se recolhe (ela cobriria a cena) e o destino abre pelo mesmo caminho do clique — uma entrada de histórico por destino", atProfile && h2 === h0 + 2 && (!alive || (folded && (await eng(page)).char === "profile")), `histórico ${h0} → ${h2}`);
    await page.goBack();
    const backTo = await pathIs(page, /\/projetos$/, 6000);
    await page.waitForTimeout(350);
    const w = await winOf(page, "projects");
    const again = alive ? await eng(page) : null;
    const hNow = await page.evaluate(() => history.length);
    const slug = await page.locator('.bounty__slot[data-active="1"]').getAttribute("data-slug").catch(() => null);
    check("Voltar devolve Projetos (URL, janela inteira e foco), sem uma segunda animação de entrada nem entrada duplicada no histórico", backTo && !!w && w.clip === "none" && w.tf === "none" && !w.arriving && !w.html && w.focusIn && hNow === h2 && (!alive || again.arriving === null) && slug === "terral", JSON.stringify({ backTo, w, hNow, h2, arriving: again?.arriving, slug }));
    await ctx.close();
  }

  console.log("\n— gestos: movimento reduzido, sem WebGL, carregamento lento, link direto, idiomas");
  {
    const { ctx, page } = await open("/", { reduced: true });
    await page.locator("#os-icon-projects").click();
    const direct = await page.waitForFunction(() => { const w = document.querySelector('.os-window[data-app="projects"]'); return !document.documentElement.dataset.osArriving && !!w && getComputedStyle(w).opacity !== "0" && getComputedStyle(w).clipPath === "none"; }, null, { timeout: 900 }).then(() => true).catch(() => false);
    const still = await page.evaluate(() => ({ state: document.querySelector(".os-materia").dataset.state, image: getComputedStyle(document.querySelector(".os-scene__still")).backgroundImage }));
    check("movimento reduzido: a composição estática da escultura e a página do destino na hora", direct && still.state === "still" && /materia-home-/.test(still.image) && (await page.locator('.bounty__slot[data-active="1"]').getAttribute("data-slug")) === "terral", still.image.slice(0, 60));
    await ctx.close();
  }
  {
    const { ctx, page } = await open("/", { init: () => { const real = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (type, ...rest) { return /webgl/i.test(String(type)) ? null : real.call(this, type, ...rest); }; } });
    await page.waitForTimeout(2500);
    const still = await page.evaluate(() => ({ state: document.querySelector(".os-materia").dataset.state, image: getComputedStyle(document.querySelector(".os-scene__still")).backgroundImage, debug: !!window.__mwMateria }));
    await page.locator("#os-icon-profile").click();
    const direct = await page.waitForFunction(() => { const w = document.querySelector('.os-window[data-app="profile"]'); return !!w && getComputedStyle(w).opacity !== "0" && getComputedStyle(w).clipPath === "none"; }, null, { timeout: 900 }).then(() => true).catch(() => false);
    check("sem WebGL: fica a imagem da escultura, e o Perfil abre na hora com o acesso ao PDF", still.state === "still" && !still.debug && /materia-home-/.test(still.image) && direct && (await page.locator('[data-profile-action="view-cv"]').isVisible()));
    await ctx.close();
  }
  {
    // a figura do destino demora a chegar: a página vai na frente
    const { ctx, page } = await open("/", { route: (pg) => pg.route(/sculpt-services/, async (r) => { await new Promise((ok) => setTimeout(ok, 2500)); await r.continue(); }) });
    const alive = await live(page);
    const t0 = Date.now();
    await page.locator("#os-icon-services").click();
    const shown = await page.waitForFunction(() => { const w = document.querySelector('.os-window[data-app="services"]'); return !!w && getComputedStyle(w).opacity === "1" && getComputedStyle(w).clipPath === "none" && !document.documentElement.dataset.osArriving; }, null, { timeout: 1200 }).then(() => true).catch(() => false);
    const took = Date.now() - t0;
    const later = alive ? await page.waitForFunction(() => window.__mwMateria.state.char === "services", null, { timeout: 9000 }).then(() => true).catch(() => false) : true;
    check("carregamento lento da figura: a página do destino abre sem esperar por ela, e a escultura a acompanha quando chega", shown && later, `página em ${took} ms`);
    await ctx.close();
  }
  for (const [path, app, rx] of [["/projetos", "projects", /projetos$/], ["/perfil", "profile", /perfil$/], ["/en/profile", "profile", /en\/profile$/], ["/es/perfil", "profile", /es\/perfil$/]]) {
    const { ctx, page } = await open(path, { locale: path.startsWith("/en") ? "en-US" : path.startsWith("/es") ? "es-ES" : "pt-BR" });
    const w = await winOf(page, app);
    const alive = await live(page);
    const follows = alive ? await page.waitForFunction((a) => window.__mwMateria.state.char === a, app, { timeout: 12000 }).then(() => true).catch(() => false) : true;
    check(`link direto ${path}: o conteúdo já está na tela desde o carregamento, sem gesto; a escultura acompanha depois`, !!w && w.opacity === "1" && w.clip === "none" && !w.html && rx.test(w.path) && follows);
    await ctx.close();
  }
  {
    const { ctx, page } = await open("/es", { locale: "es-ES" });
    const alive = await live(page);
    if (alive) await page.evaluate(() => window.__mwMateria.need("contact"));
    const labels = [await page.locator("#os-icon-projects .os-icon-btn__cta").innerText(), await page.locator("#os-icon-profile .os-icon-btn__cta").innerText(), await page.locator(".os-materia-talk").innerText()].map((t) => t.trim().toUpperCase());
    await page.locator("#os-icon-contact").click();
    const arrived = await page.waitForFunction(() => !document.documentElement.dataset.osArriving && getComputedStyle(document.querySelector('.os-window[data-app="contact"]')).clipPath === "none", null, { timeout: 9000 }).then(() => true).catch(() => false);
    check("ES: os mesmos destaques e o mesmo gesto, com a rota do idioma", labels.join("|") === "VER PROYECTOS|PERFIL Y CURRÍCULUM|HABLAR CON MATÉRIA" && arrived && /\/es\/contacto$/.test(new URL(page.url()).pathname) && (!alive || (await eng(page)).char === "contact"), labels.join(" | "));
    await ctx.close();
  }

  console.log("\n— gestos: telefone (390 × 844)");
  {
    const { ctx, page } = await open("/", { phone: true });
    const alive = await live(page, 15000);
    const go = page.locator('.os-materia-go[data-app="projects"]');
    const gb = await go.boundingBox();
    const pb = await page.locator('.os-materia-go[data-app="profile"]').boundingBox();
    const tb = await page.locator(".os-materia-talk").boundingBox();
    check("telefone: “Ver projetos” e “Perfil e currículo” lado a lado, ao alcance do polegar; a conversa, discreta, logo acima", !!gb && !!pb && !!tb && gb.height >= 44 && pb.height >= 44 && tb.height >= 44 && Math.abs(gb.y - pb.y) < 2 && gb.y > 844 * 0.34 && pb.x + pb.width <= 390 && tb.y + tb.height <= gb.y + 2 && tb.x + tb.width <= 390, gb && `destaques em y ${Math.round(gb.y)}, conversa em y ${tb && Math.round(tb.y)}`);
    if (alive) {
      await page.evaluate(() => window.__mwMateria.need("projects"));
      await page.evaluate(() => window.__mwMateria.pace(0.3));
    }
    await go.tap();
    const S = await follow(page, "projects");
    await page.evaluate(() => window.__mwMateria?.pace(1));
    if (alive) {
      const pull = S.filter((x) => x.e.passage && x.e.pulling > 0.05 && x.e.release === 0);
      const inView = pull.filter((x) => [x.e.hands.a, x.e.hands.b].every((h) => h.x > -4 && h.x < 394 && h.y > 0 && h.y < 844));
      const edge = pull.filter((x) => x.e.hands.tl && x.e.hands.tr && x.e.hands.tl.x > -4 && x.e.hands.tr.x < 394);
      check("telefone: as duas mãos e a borda cabem no enquadramento durante o gesto", pull.length >= 3 && inView.length === pull.length && edge.length === pull.length, `${inView.length}/${pull.length} amostras com as duas mãos à vista`);
    }
    const end = await winOf(page, "projects");
    const shot = await page.locator('.bounty__slot[data-active="1"] .bounty__img').first().boundingBox();
    check("telefone: Projetos chega inteiro, com a captura do TERRAL na primeira tela e rolagem nativa", !!end && end.clip === "none" && !end.html && !!shot && shot.y > 0 && shot.y + shot.height < 844 && (await page.locator('.bounty__slot[data-active="1"]').getAttribute("data-slug")) === "terral");
    await ctx.close();
  }
  {
    const { ctx, page } = await open("/", { phone: true });
    const alive = await live(page, 15000);
    if (alive) await page.evaluate(() => window.__mwMateria.need("profile"));
    await page.locator('.os-materia-go[data-app="profile"]').tap();
    await page.waitForFunction(() => !document.documentElement.dataset.osArriving, null, { timeout: 9000 }).catch(() => undefined);
    await page.waitForTimeout(700);
    const t = await page.locator('.os-window[data-app="profile"]').innerText();
    const cv = await page.locator('[data-profile-action="view-cv"]').boundingBox();
    const dl = await page.locator('[data-profile-action="download-cv"]').boundingBox();
    check("telefone: o Perfil abre com o nome, a função e o acesso ao PDF (ver e baixar) na primeira tela, com alvos ≥ 44 px", /RICK\s+JANUARIO/i.test(t) && /Senior Full Stack Engineer/i.test(t) && !!cv && !!dl && cv.y + cv.height < 844 && dl.y + dl.height < 844 && cv.height >= 44 && dl.height >= 44, cv && `ver em y ${Math.round(cv.y)}, baixar em y ${dl && Math.round(dl.y)}`);
    await ctx.close();
  }
}

// ───────────────────────── as entradas da conversa: os sites, o currículo, o orçamento — pelo mesmo destino do clique
if (ONLY.includes("entries")) {
  console.log("\n— entradas da conversa (PT)");
  {
    const { ctx, page, errors } = await open("/");
    await talk(page);
    await page.waitForTimeout(400);
    const first = await chips(page);
    check("a conversa abre com “Ver os sites”, “Ver o currículo” e “Quero um orçamento” — sugestões que servem a qualquer visitante", first.join("|") === "Ver os sites|Ver o currículo|Quero um orçamento", first.join(" | "));
    const a = await say(page, "quero um site");
    const goals = await chips(page);
    check("“quero um site” devolve a pergunta pelo objetivo, com saídas que são objetivos (nenhuma profissão de exemplo)", /O que você gostaria que seus visitantes conseguissem fazer\?/.test(a) && goals.length === 4 && !goals.some((c) => /mergulho|psic/i.test(c)), `${a} · ${goals.join(" | ")}`);
    const b = await say(page, "Tenho uma distribuidora e quero receber pedidos mais completos");
    check("…e a resposta apresenta algo real que o Rick já fez (uma referência do catálogo, a partir do objetivo)", /pedidos mais completos/i.test(b) && /Kavita Drones/.test(b) && (await card(page)) === "Kavita Drones" && b.trim().endsWith("?"), b.slice(0, 110));
    check("…o briefing aparece para revisão, com o que a pessoa contou, e segue por escrito", await (async () => {
      await page.waitForTimeout(1800);
      await reopen(page);
      await say(page, "Quero um orçamento");
      await pathIs(page, /\/contato$/, 8000);
      await page.waitForTimeout(1900);
      const r = await request(page);
      return /distribuidora/i.test(r.notes) && /Kavita Drones/i.test(r.preview) && (await page.locator(`${GUIDE} textarea:not([readonly])`).isEditable());
    })());
    check("sem erros de console", errors.length === 0, errors.slice(0, 2).join(" | "));
    await ctx.close();
  }
  {
    const { ctx, page } = await open("/");
    const alive = await live(page);
    if (alive) await page.evaluate(() => window.__mwMateria.need("projects"));
    await talk(page);
    const d = await say(page, "mostra os seus sites");
    const at = await pathIs(page, /\/projetos$/, 8000);
    await page.waitForFunction(() => !document.documentElement.dataset.osArriving, null, { timeout: 9000 }).catch(() => undefined);
    await page.waitForTimeout(500);
    const folded = (await page.locator(".os-materia-panel").count()) === 0 && (await page.locator(".os-materia-bubble").count()) === 1;
    check("“mostra os seus sites” abre a coleção (TERRAL em destaque) pelo mesmo caminho do clique: a conversa se recolhe e a Curadora faz o gesto", /TERRAL em destaque/i.test(d) && at && (await page.locator('.bounty__slot[data-active="1"]').getAttribute("data-slug")) === "terral" && (!alive || (folded && (await eng(page)).char === "projects" && (await eng(page)).done)), d.slice(0, 80));
    await ctx.close();
  }
  {
    const { ctx, page } = await open("/");
    await talk(page);
    const d = await pick(page, /Ver os sites/);
    check("a sugestão “Ver os sites” leva ao mesmo lugar", /TERRAL em destaque/i.test(d) && (await pathIs(page, /\/projetos$/, 8000)), d.slice(0, 80));
    await ctx.close();
  }
  {
    const { ctx, page } = await open("/");
    const alive = await live(page);
    if (alive) await page.evaluate(() => window.__mwMateria.need("profile"));
    await talk(page);
    const r = await say(page, "sou recrutador");
    const at = await pathIs(page, /\/perfil$/, 8000);
    await page.waitForFunction(() => !document.documentElement.dataset.osArriving, null, { timeout: 9000 }).catch(() => undefined);
    await page.waitForTimeout(500);
    const t = await page.locator('.os-window[data-app="profile"]').innerText();
    check("“sou recrutador”: o Arquivista toma assento e entrega o Perfil — Rick Januario · Senior Full Stack Engineer, com Ver e Baixar o currículo", at && /RICK JANUARIO/i.test(t) && /Senior Full Stack Engineer/i.test(t) && (await page.locator('[data-profile-action="view-cv"]').isVisible()) && (await page.locator('[data-profile-action="download-cv"]').isVisible()) && (!alive || (await eng(page)).char === "profile"), r.slice(0, 80));
    await reopen(page);
    const e = await say(page, "me mostra o que ele fez em backend");
    await page.waitForFunction(() => !document.documentElement.dataset.osArriving, null, { timeout: 9000 }).catch(() => undefined);
    await page.waitForTimeout(900);
    const tab = page.locator('.os-window[data-app="profile"] [role="tab"][data-track="backend"]');
    const panel = await page.locator('.os-window[data-app="profile"] .os-showcase__panel[data-active="1"]').innerText().catch(() => "");
    const acts = await (async () => { await reopen(page); return chips(page); })();
    check("“me mostra o que ele fez em backend”: a resposta diz a contribuição e a evidência, e o Perfil abre em Engenharia em prática, na aba de backend, com o foco nela", /Backend/i.test(e) && (await tab.getAttribute("aria-selected")) === "true" && (await tab.evaluate((el) => el === document.activeElement || el.ownerDocument.activeElement?.closest?.(".os-materia-panel") !== null)) && panel.length > 80 && acts.some((c) => /Ver como foi feito/i.test(c)) && acts.some((c) => /Ver o código/i.test(c)), `${e.slice(0, 70)} · ${acts.join(" | ")}`);
    await ctx.close();
  }
  {
    const { ctx, page } = await open("/");
    await talk(page);
    const r = await say(page, "quero ver o currículo");
    await page.waitForTimeout(700);
    const opened = await page.evaluate(() => window.__opened);
    check("“quero ver o currículo” (por escrito): o documento real abre — o PDF cadastrado, em inglês, de duas páginas", opened.some((u) => /\/cv\/.+\.pdf$/.test(u)) && /inglês/i.test(r), `${opened.join(", ")} · ${r.slice(0, 70)}`);
    await restart(page);
    const c = await pick(page, /Ver o currículo/);
    await page.waitForTimeout(500);
    check("a sugestão “Ver o currículo” abre o mesmo documento", (await page.evaluate(() => window.__opened.filter((u) => /\.pdf$/.test(u)).length)) === 2, c.slice(0, 60));
    await ctx.close();
  }
  {
    const { ctx, page } = await open("/");
    await talk(page);
    await pick(page, /Quero um orçamento/);
    const at = await pathIs(page, /\/contato$/, 8000);
    await page.waitForFunction(() => !document.documentElement.dataset.osArriving, null, { timeout: 9000 }).catch(() => undefined);
    await page.waitForTimeout(700);
    check("a sugestão “Quero um orçamento” abre o briefing editável (a Mensageira entrega)", at && (await page.locator(`${GUIDE} textarea:not([readonly])`).isEditable()));
    await ctx.close();
  }
  {
    const { ctx, page } = await open("/");
    await askIdea(page);
    await page.waitForTimeout(1500);
    const ask = (await replies(page)).at(-1) ?? "";
    check("a prévia entra pela conversa: “Ver uma ideia para o meu site” vai direto a uma pergunta útil", /O que você gostaria que seus visitantes conseguissem fazer\?/.test(ask), ask);
    const c = await say(page, "Sou fotógrafo e quero apresentar melhor meu trabalho");
    check("profissional independente que quer apresentar melhor o trabalho recebe o TERRAL como referência", /apresentar melhor o seu trabalho/i.test(c) && /TERRAL/.test(c) && (await card(page)) === "TERRAL", c.slice(0, 110));
    await ctx.close();
  }
  console.log("\n— entradas da conversa (EN, ES)");
  {
    const { ctx, page } = await open("/en", { locale: "en-US" });
    await talk(page);
    await page.waitForTimeout(400);
    const first = await chips(page);
    const r1 = await say(page, "I'm a recruiter");
    check("EN: as mesmas sugestões; “I'm a recruiter” chega ao Perfil", first.join("|") === "See the sites|See the résumé|I want a quote" && /senior full-stack software engineer/i.test(r1) && (await pathIs(page, /\/en\/profile$/, 8000)), `${first.join(" | ")} · ${r1.slice(0, 60)}`);
    await page.waitForFunction(() => !document.documentElement.dataset.osArriving, null, { timeout: 9000 }).catch(() => undefined);
    await page.waitForTimeout(900);
    await reopen(page);
    const r2 = await say(page, "Do you have experience with APIs?");
    await page.waitForTimeout(900);
    await reopen(page);
    const acts = await chips(page);
    check("EN: pediu evidência de experiência com APIs — a resposta aponta o projeto e oferece “See how it was made”", /Backend & APIs/i.test(r2) && acts.some((c) => /See how it was made/i.test(c)) && acts.some((c) => /See the code/i.test(c)), acts.join(" | "));
    await chip(page, /See how it was made/).click();
    const onWork = await pathIs(page, /\/en\/work$/, 8000);
    const face = await page.waitForFunction(() => document.querySelector(".bounty__explore")?.getAttribute("data-face") === "made", null, { timeout: 9000 }).then(() => true).catch(() => false);
    // o verso se preenche quando o dado do projeto chega (um JSON estático, buscado uma vez por sessão)
    await page.waitForSelector(".bounty__made", { timeout: 10000 }).catch(() => undefined);
    await page.waitForTimeout(900);
    const made = face ? await page.locator(".bounty__face--made").innerText() : "";
    check("…e esse lado da peça é a entrada do recrutador: problema, o que o Rick fez, decisão e código", onWork && face && /THE PROBLEM/i.test(made) && /WHAT RICK DID/i.test(made) && /IMPLEMENTATION DECISION/i.test(made) && ((await page.locator(".bounty__made-proof").getAttribute("href").catch(() => "")) ?? "").includes("github.com"), `rota ${onWork ? "ok" : "não"}, verso ${face ? "ok" : "não"} · ${made.replace(/\s+/g, " ").slice(0, 70)}`);
    await ctx.close();
  }
  {
    const { ctx, page } = await open("/es", { locale: "es-ES" });
    await talk(page);
    await page.waitForTimeout(400);
    const first = await chips(page);
    const e1 = await say(page, "quiero un sitio");
    const e2 = await say(page, "Quiero recibir pedidos más completos");
    check("ES: as mesmas sugestões, a pergunta pelo objetivo e a recomendação a partir dele", first.join("|") === "Ver los sitios|Ver el currículum|Quiero un presupuesto" && /tus visitantes pudieran hacer\?/.test(e1) && /pedidos más completos/i.test(e2) && /Kavita Drones/.test(e2), `${first.join(" | ")} · ${e2.slice(0, 80)}`);
    await ctx.close();
  }
}

// ───────────────────────── a referência sai da frase inteira: ramo, objetivo e o que os cases publicam
if (ONLY.includes("match")) {
  console.log("\n— escolha da referência (inglês): mergulho × comércio");
  const { ctx, page, errors } = await open("/en", { locale: "en-US" });
  await talk(page);
  const dive = "I run a dive shop in Miami. I need a website for scuba bookings.";
  const a = await say(page, dive);
  check(`“${dive}” recomenda o Ace Diving Miami, não uma loja`, /Ace Diving Miami/.test(a) && !/iPhone/i.test(a) && (await card(page)) === "Ace Diving Miami", a.slice(0, 80));
  check("…identificado como conceito para uma operadora de mergulho", /a concept for a dive operator/i.test(a));
  check("…em uma recomendação, um motivo e uma pergunta", sentences(a) <= 3 && a.trim().endsWith("?") && /scrolling is descending/i.test(a), `${sentences(a)} frases · ${a.length} caracteres`);
  check("…e não pergunta sobre pagamento", !/payment|WhatsApp/i.test(a) && (await chips(page)).some((c) => /see an idea for my site/i.test(c)));
  check("…abre o case real do Ace Diving", await pathIs(page, /\/en\/work\/ace-diving-miami$/, 8000));
  await page.waitForTimeout(1500);
  await restart(page);
  const b = await say(page, "I sell diving masks online");
  check("“I sell diving masks online” é comércio: referência de loja e a pergunta de pagamento", /Loja de iPhone Premium/.test(b) && /payment on the site/i.test(b) && !/Ace Diving/.test(b), b.slice(0, 80));
  await pathIs(page, /\/en\/work\/loja-de-iphone$/, 8000);
  await page.waitForTimeout(1200);
  await restart(page);
  const c = await say(page, "I run a dive shop in Miami");
  const two = await chips(page);
  check("duas leituras plausíveis (“dive shop”, sem dizer o objetivo): uma pergunta curta com as duas saídas", c.trim().endsWith("?") && c.length < 110 && two.length === 2 && /bookings for dives/i.test(two[0]) && /sell products online/i.test(two[1]), `${c} [${two.join(" | ")}]`);
  check("…e nada abre antes da resposta", await stays(page, /\/en\/work\/loja-de-iphone$/, 1200));
  const d = await pick(page, /bookings for dives/i);
  check("escolher “reservas” leva ao Ace Diving Miami", /Ace Diving Miami/.test(d) && (await pathIs(page, /\/en\/work\/ace-diving-miami$/, 8000)));
  await page.waitForTimeout(1500);
  await restart(page);
  await say(page, "I run a dive shop in Miami");
  const e = await say(page, "we mostly sell gear online");
  check("responder com as próprias palavras (“we mostly sell gear online”) leva à loja", /Loja de iPhone Premium/.test(e), e.slice(0, 70));
  await pathIs(page, /\/en\/work\/loja-de-iphone$/, 8000);
  await page.waitForTimeout(1200);
  await restart(page);
  const f = await say(page, "We run safaris in Tanzania");
  check("outros setores: “We run safaris in Tanzania” acha o Serengeti pelo que o case publica", /Serengeti Wildlife Safaris/.test(f) && /demonstration/i.test(f), f.slice(0, 80));
  await pathIs(page, /\/en\/work\/serengeti-wildlife-safaris$/, 8000);
  await page.waitForTimeout(1200);
  await restart(page);
  const g = await say(page, "I have a tour company in Rio");
  check("“tour company” é turismo, não site institucional (sem pergunta de desempate)", /Mabrouk Zanzibar/.test(g) && /client work/i.test(g), g.slice(0, 70));
  check("sem erros de console", errors.length === 0, errors.slice(0, 2).join(" | "));
  await ctx.close();

  console.log("\n— escolha da referência (português e espanhol)");
  const pt = await open("/");
  await talk(pt.page);
  const p1 = await say(pt.page, "Tenho uma operadora de mergulho em Búzios e preciso de um site para reservas");
  check("PT: operadora de mergulho com reservas → Ace Diving Miami", /Ace Diving Miami/.test(p1) && /conceito para uma operadora de mergulho/i.test(p1) && sentences(p1) <= 3, p1.slice(0, 80));
  await pathIs(pt.page, /\/projetos\/ace-diving-miami$/, 8000);
  await pt.page.waitForTimeout(1200);
  await restart(pt.page);
  const p2 = await say(pt.page, "Vendo máscaras de mergulho pela internet");
  check("PT: “Vendo máscaras de mergulho pela internet” → loja", /Loja de iPhone Premium/.test(p2) && /pagamento no próprio site/i.test(p2), p2.slice(0, 80));
  await pathIs(pt.page, /\/projetos\/loja-de-iphone$/, 8000);
  await pt.page.waitForTimeout(1200);
  await restart(pt.page);
  const p3 = await say(pt.page, "Tenho uma loja de mergulho");
  check("PT: “Tenho uma loja de mergulho” → pergunta curta", /reservas de mergulhos e cursos ou vender produtos online\?$/.test(p3.trim()), p3);
  await restart(pt.page);
  const p4 = await say(pt.page, "Vendo drones agrícolas");
  check("PT: “Vendo drones agrícolas” acha a Kavita Drones (o case que fala disso), não a primeira loja da lista", /Kavita Drones/.test(p4) && /trabalho para cliente/i.test(p4), p4.slice(0, 80));
  await pathIs(pt.page, /\/projetos\/kavita-drones$/, 8000);
  await pt.page.waitForTimeout(1200);
  await restart(pt.page);
  const p5 = await say(pt.page, "Tenho uma barbearia e quero agendamento online");
  check("PT: serviço com hora marcada sem ramo conhecido → referência de agendamento, não loja", /ALVA/.test(p5) && !/iPhone/.test(p5), p5.slice(0, 70));
  await pathIs(pt.page, /\/projetos\/alva-odontologia$/, 8000);
  check("sem erros de console (PT)", pt.errors.length === 0, pt.errors.slice(0, 2).join(" | "));
  await pt.ctx.close();
  const es = await open("/es", { locale: "es-ES" });
  await talk(es.page);
  const e1 = await say(es.page, "Tengo un centro de buceo y necesito un sitio para reservas");
  check("ES: centro de buceo con reservas → Ace Diving Miami", /Ace Diving Miami/.test(e1) && /concepto para una operadora de buceo/i.test(e1), e1.slice(0, 80));
  await pathIs(es.page, /\/es\/proyectos\/ace-diving-miami$/, 8000);
  await es.page.waitForTimeout(1200);
  await restart(es.page);
  const e2 = await say(es.page, "Vendo máscaras de buceo en línea");
  check("ES: “Vendo máscaras de buceo en línea” → tienda", /Loja de iPhone Premium/.test(e2) && /pago en el propio sitio/i.test(e2), e2.slice(0, 80));
  check("sem erros de console (ES)", es.errors.length === 0, es.errors.slice(0, 2).join(" | "));
  await es.ctx.close();
}

// ───────────────────────── pedido que mistura intenções: preço + quem é + o que quer
if (ONLY.includes("mixed")) {
  const SETS = [
    { lang: "português", home: "/", locale: "pt-BR", text: "Sou psicóloga e quero saber quanto custa um site para o meu consultório com agendamento online", price: /orçamento é gratuito/i, goal: /agendamento é a prioridade/i, ref: /a ALVA, uma demonstração de odontologia/i, brief: /Montar o pedido de proposta/i, idea: /Ver uma ideia para o meu site/i, contact: /\/contato$/, home2: /^\/$/, priority: /Prioridade: facilitar o primeiro agendamento/ },
    { lang: "inglês", home: "/en", locale: "en-US", text: "I'm a psychologist and I'd like to know how much a website for my practice with online booking costs", price: /The quote is free/i, goal: /booking is the priority/i, ref: /ALVA, a dental clinic demonstration/i, brief: /Build the proposal request/i, idea: /See an idea for my site/i, contact: /\/en\/contact$/, home2: /^\/en$/, priority: /Priority: make the first booking easy/ },
    { lang: "espanhol", home: "/es", locale: "es-ES", text: "Soy psicóloga y quiero saber cuánto cuesta un sitio para mi consulta con citas en línea", price: /La cotización es gratuita/i, goal: /la cita es la prioridad/i, ref: /ALVA, una demostración de odontología/i, brief: /Preparar la solicitud de propuesta/i, idea: /Ver una idea para mi sitio/i, contact: /\/es\/contacto$/, home2: /^\/es$/, priority: /Prioridad: facilitar la primera cita/ },
  ];
  for (const S of SETS) {
    console.log(`\n— pedido que mistura intenções (${S.lang})`);
    const { ctx, page, errors } = await open(S.home, { locale: S.locale });
    await talk(page);
    const r = await say(page, S.text);
    check("responde à dúvida de preço com o que está publicado, sem inventar valor", S.price.test(r) && !MONEY.test(r), r.slice(0, 70));
    check("reconhece o objetivo de agendamento", S.goal.test(r));
    check("oferece a referência pertinente (ALVA, identificada como demonstração de odontologia)", S.ref.test(r) && (await card(page)) === "ALVA Odontologia");
    const acts = await chips(page);
    check("as ações oferecem a prévia e o pedido de proposta", acts.some((a) => S.idea.test(a)) && acts.some((a) => S.brief.test(a)), acts.join(" | "));
    check("NÃO abre o Orçamento sozinha (nem outra janela): continua na home", await stays(page, S.home2));
    await chip(page, S.brief).click();
    check("o briefing abre quando a pessoa escolhe pedir a proposta", await pathIs(page, S.contact, 8000));
    const req = await request(page);
    check("…com a frase dela, a prioridade reconhecida e a referência", req.notes.includes(S.text) && S.priority.test(req.notes) && /ALVA Odontologia/.test(req.preview) && req.body === req.preview, req.notes.replace(/\n/g, " | ").slice(0, 150));
    check("sem erros de console", errors.length === 0, errors.slice(0, 2).join(" | "));
    await ctx.close();
  }
}

// ───────────────────────── recrutamento: o caminho curto
if (ONLY.includes("recruiter")) {
  console.log("\n— recrutamento (português)");
  const { ctx, page, errors } = await open("/");
  await talk(page);
  const r1 = await say(page, "Sou recrutador");
  check("“Sou recrutador” apresenta em uma frase o que o Rick faz", /engenheiro de software full-stack/i.test(r1) && r1.split(/(?<=[.!?])\s/).length <= 2, r1.slice(0, 90));
  check("…e abre o Perfil", await pathIs(page, /\/perfil$/));
  await reopen(page);
  await say(page, "Quero o PDF");
  const pdfUrl = (await page.evaluate(() => window.__opened)).at(-1) ?? "";
  check("“Quero o PDF” entrega o currículo real, sem passar pela experiência comercial", /^\/cv\/rick-januario.*\.pdf$/.test(pdfUrl) && (await page.locator(IDEA).count()) === 0 && !(await page.evaluate(() => document.documentElement.dataset.osPortal)), pdfUrl || "nada foi aberto");
  if (pdfUrl) {
    const res = await ctx.request.get(BASE + pdfUrl);
    check("o arquivo existe e é um PDF", res.ok() && /pdf/.test(res.headers()["content-type"] ?? ""), `${res.status()} ${res.headers()["content-type"]}`);
  }
  const r3 = await say(page, "Você tem experiência com backend?");
  const profile = await page.evaluate(() => document.querySelector('.os-window[data-app="profile"]')?.innerText ?? "");
  const proof = /evidência está em ([^:]+):/.exec(r3)?.[1]?.trim() ?? "";
  check("“Você tem experiência com backend?” recupera uma contribuição documentada", /Backend/i.test(r3) && proof.length > 2 && profile.toLowerCase().includes(proof.toLowerCase()), `evidência em ${proof}`);
  const actions = await page.locator(".os-materia-msg__actions button").evaluateAll((b) => b.map((x) => x.innerText));
  check("…e aponta para a evidência disponível (Perfil e código)", actions.some((a) => /perfil/i.test(a)) && actions.some((a) => /código/i.test(a)), actions.join(" · "));
  // quem pediu uma ideia e depois se apresenta como recrutador sai do percurso comercial
  await restart(page);
  await answer(page, () => page.locator("#os-materia-input").fill("Ver uma ideia para o meu site").then(() => page.locator("#os-materia-input").press("Enter")));
  const r4 = await say(page, "Na verdade sou recrutador, quero o currículo em PDF");
  check("no meio do pedido de prévia, “sou recrutador, quero o currículo” vai direto ao arquivo", /currículo real/i.test(r4) && /\.pdf$/.test((await page.evaluate(() => window.__opened)).at(-1) ?? "") && (await page.locator(IDEA).count()) === 0, r4.slice(0, 70));
  check("sem erros de console", errors.length === 0, errors.slice(0, 2).join(" | "));
  await ctx.close();

  console.log("\n— recrutamento (inglês e espanhol)");
  const en = await open("/en", { locale: "en-US" });
  await talk(en.page);
  const r5 = await say(en.page, "I’m hiring a full-stack engineer. Can I see Rick’s résumé?");
  const pdf2 = (await en.page.evaluate(() => window.__opened)).at(-1) ?? "";
  check("“I’m hiring a full-stack engineer. Can I see Rick’s résumé?” abre o currículo e responde em inglês", /\.pdf$/.test(pdf2) && /résumé/i.test(r5) && /senior full-stack/i.test(r5), `${pdf2} · ${r5.slice(0, 60)}`);
  await en.ctx.close();
  const es = await open("/es", { locale: "es-ES" });
  await talk(es.page);
  const r6 = await say(es.page, "Soy reclutador");
  check("espanhol: “Soy reclutador” responde em espanhol e abre o Perfil", /ingeniero de software/i.test(r6) && (await pathIs(es.page, /\/es\/perfil$/)), r6.slice(0, 70));
  await reopen(es.page);
  await say(es.page, "Quiero el PDF");
  check("espanhol: “Quiero el PDF” entrega o arquivo", /\.pdf$/.test((await es.page.evaluate(() => window.__opened)).at(-1) ?? ""));
  await es.ctx.close();
}

// ───────────────────────── uma psicóloga procurando um site → contratação por escrito
if (ONLY.includes("client")) {
  console.log("\n— psicóloga procurando um site (português)");
  const { ctx, page, errors } = await open("/");
  const alive = await live(page, 12000);
  await talk(page);
  const first = "Sou psicóloga e quero um sit para meu consultório";
  const r1 = await say(page, first);
  check("entende a frase com erro de digitação e escolhe a ALVA", /Separei a ALVA/.test(r1) && (await card(page)) === "ALVA Odontologia");
  check("identifica a referência como demonstração de odontologia", /uma demonstração de odontologia\./i.test(r1));
  check("a primeira resposta é curta: uma recomendação, um motivo concreto e uma pergunta", sentences(r1) === 3 && r1.length < 220 && /apresentar o espaço antes do primeiro contato/i.test(r1), `${sentences(r1)} frases · ${r1.length} caracteres`);
  check("…e a pergunta muda a proposta", /destacar sua abordagem ou facilitar o agendamento\?$/.test(r1.trim()), r1.trim().slice(-70));
  check("atravessar o portfólio: termina na página navegável do case, com a URL normal", await pathIs(page, /\/projetos\/alva-odontologia$/, 8000));
  await page.waitForSelector('.os-window[data-app="projects"]', { state: "visible", timeout: 8000 });
  await page.waitForTimeout(1500);
  check("…com o case real aberto na janela e sem resto da travessia na tela", (await page.locator('.os-window[data-app="projects"]').innerText()).includes("ALVA") && (await page.locator(".os-materia-shard").count()) === 0);
  if (alive) check("a capa do projeto está refletida na prata", (await engine(page)).tint > 0.8);
  await reopen(page);
  const why = await pick(page, /Por que este exemplo\?/i);
  check("“Por que este exemplo?” traz os detalhes: o que ela é e o que se adapta para psicologia", /não um trabalho para cliente/i.test(why) && /psicologia/i.test(why) && /agendar pelo WhatsApp/i.test(why), why.slice(0, 70));
  const r2 = await say(page, "agendamento");
  check("“agendamento” continua desse ponto, em poucas linhas, e convida para a prévia", /começa pelo agendamento/i.test(r2) && /o Rick confirma na proposta/i.test(r2) && /prévia\?$/.test(r2.trim()), r2.slice(0, 70));
  const r3 = await say(page, "gostei desse, quanto custa?");
  check("“gostei desse, quanto custa?” sabe qual projeto está aberto", /ALVA Odontologia é a referência/.test(r3));
  check("explica o processo real e não inventa valor", /orçamento é gratuito/i.test(r3) && /entrada e entrega/i.test(r3) && !MONEY.test(r3), r3.slice(0, 60));
  check("…e espera a pessoa escolher: o pedido não abre sozinho", await stays(page, /\/projetos\/alva-odontologia$/));
  await say(page, "sim");
  check("“sim” leva ao pedido de proposta do Hire Rick", await pathIs(page, /\/contato$/, 8000));
  const req = await request(page);
  check("o briefing chega com o que a pessoa já contou", req.notes.includes(first) && /Prioridade: facilitar o primeiro agendamento/.test(req.notes) && /Dúvida: gostei desse, quanto custa\?/.test(req.notes), req.notes.replace(/\n/g, " | "));
  check("a referência do pedido é o projeto da conversa e a mensagem do e-mail é a mesma da prévia", /Referência: ALVA Odontologia/.test(req.preview) && req.body === req.preview);
  await reopen(page);
  check("a conversa continua disponível sobre o pedido", (await replies(page)).length >= 4);
  check("sem erros de console", errors.length === 0, errors.slice(0, 2).join(" | "));
  await ctx.close();
}

// ───────────────────────── exploração livre, “me mostra outro”, retorno do case
if (ONLY.includes("explore")) {
  console.log("\n— exploração livre (português)");
  const { ctx, page, errors } = await open("/");
  await talk(page);
  const t1 = await say(page, "Mostre algo de turismo");
  check("“Mostre algo de turismo” recomenda o Mabrouk Zanzibar como trabalho para cliente", /Mabrouk Zanzibar/.test(t1) && /trabalho para cliente/i.test(t1) && sentences(t1) <= 3);
  check("…e abre o case", await pathIs(page, /\/projetos\/mabrouk-zanzibar$/, 8000));
  await page.waitForTimeout(1600);
  // voltar do case: a conversa está lá
  await page.goBack();
  await pathIs(page, /^\/$/);
  await page.waitForTimeout(500);
  await reopen(page);
  const kept = await replies(page);
  check("ao voltar do case, a conversa é recuperada", kept.length >= 2 && kept.some((t) => /Mabrouk Zanzibar/.test(t)));
  const t2 = await say(page, "me mostra outro");
  const other = /Outra referência: ([^.]+)\./.exec(t2)?.[1] ?? "";
  check("“me mostra outro” traz outra referência do mesmo assunto, dizendo o que ela é", other.length > 2 && !/Mabrouk/.test(other) && /(demonstração|trabalho para cliente|projeto do próprio estúdio)/i.test(t2), other);
  check("…e abre esse outro case", await pathIs(page, /\/projetos\/(?!mabrouk-zanzibar)[a-z-]+$/, 8000));
  await page.waitForTimeout(1500);
  await reopen(page);
  const t3 = await say(page, "quero algo assim");
  check("“quero algo assim” fixa a referência e abre o pedido", t3.includes(other) && (await pathIs(page, /\/contato$/, 8000)));
  await page.waitForSelector(`${GUIDE} textarea[readonly]`, { timeout: 8000 });
  check("o pedido traz essa referência", (await page.locator(`${GUIDE} textarea[readonly]`).inputValue()).includes(other));
  await reopen(page);
  const t4 = await say(page, "quero uma landing page");
  check("“quero uma landing page” responde outra coisa: Kavita Drones", /Kavita Drones/.test(t4) && t4 !== t1 && (await pathIs(page, /\/projetos\/kavita-drones$/, 8000)));
  await page.waitForTimeout(1500);
  await reopen(page);
  const t5 = await say(page, "como o Rick trabalha?");
  check("“como o Rick trabalha?” descreve o processo real e abre o Estúdio", /contrato/i.test(t5) && /seis etapas/i.test(t5) && (await pathIs(page, /\/(estudio|studio)$/, 8000)), t5.slice(0, 70));
  await reopen(page);
  const t6 = await say(page, "quero um site");
  check("falta informação decisiva → uma pergunta curta, pelo objetivo", t6.trim().endsWith("?") && t6.length < 80 && /visitantes/.test(t6) && (await chips(page)).length >= 4, t6);
  const t7 = await say(page, "Dá para integrar com o sistema TideDesk?");
  check("pergunta sobre integração não é prometida: fica guardada para o Rick", /só o Rick responde/i.test(t7));
  const t8 = await say(page, "quero um orçamento");
  check("“quero um orçamento” é escolher a proposta: o pedido abre", await pathIs(page, /\/contato$/, 8000), t8.slice(0, 60));
  check("sem erros de console", errors.length === 0, errors.slice(0, 2).join(" | "));
  await ctx.close();
}

// ───────────────────────── os mesmos percursos em inglês e em espanhol; a Matéria a um toque dentro de um case
if (ONLY.includes("languages")) {
  const SETS = {
    en: {
      home: "/en", locale: "en-US", profile: /\/en\/profile$/, work: (s) => new RegExp(`/en/work/${s}$`), contact: /\/en\/contact$/, studio: /\/en\/studio$/,
      recruiter: ["I'm a recruiter", /senior full-stack software engineer/i], cv: "Can I get your résumé as a PDF?", backend: ["Do you have backend experience?", /Backend & APIs/i],
      client: ["I'm a psychologist and I want a website for my practice", /I picked ALVA, a dental clinic demonstration\./, /highlight your approach or make booking easy\?$/], why: [/Why this example\?/i, /not client work/i], answer: ["booking", /starts with booking/i],
      price: ["I like this one, how much does it cost?", /The quote is free/i, /Question: I like this one, how much does it cost\?/], brief: /Build the proposal request/i,
      tour: ["Show me something for tourism", /Mabrouk Zanzibar/], another: ["show me another", /Another reference: /], like: "I want something like this", landing: ["I want a landing page", /Kavita Drones/], how: ["How does Rick work?", /six stages/i],
    },
    es: {
      home: "/es", locale: "es-ES", profile: /\/es\/perfil$/, work: (s) => new RegExp(`/es/proyectos/${s}$`), contact: /\/es\/contacto$/, studio: /\/es\/estudio$/,
      recruiter: ["Soy reclutador", /ingeniero de software full-stack sénior/i], cv: "Quiero tu currículum en PDF", backend: ["¿Tienes experiencia con backend?", /Backend y APIs/i],
      client: ["Soy psicóloga y quiero un sitio para mi consulta", /Elegí ALVA, una demostración de odontología\./, /destacar tu enfoque o facilitar la cita\?$/], why: [/¿Por qué este ejemplo\?/i, /no un trabajo para cliente/i], answer: ["la cita", /empieza por la cita/i],
      price: ["Me gustó este, ¿cuánto cuesta?", /La cotización es gratuita/i, /Duda: Me gustó este, ¿cuánto cuesta\?/], brief: /Preparar la solicitud de propuesta/i,
      tour: ["Muéstrame algo de turismo", /Mabrouk Zanzibar/], another: ["muéstrame otro", /Otra referencia: /], like: "quiero algo así", landing: ["quiero una landing page", /Kavita Drones/], how: ["¿Cómo trabaja Rick?", /seis etapas/i],
    },
  };
  for (const [lang, S] of Object.entries(SETS)) {
    console.log(`\n— ${lang === "en" ? "inglês" : "espanhol"}: os percursos completos`);
    const { ctx, page, errors } = await open(S.home, { locale: S.locale });
    await talk(page);
    const a = await say(page, S.recruiter[0]);
    check(`recrutamento: “${S.recruiter[0]}” responde no idioma e abre o Perfil`, S.recruiter[1].test(a) && (await pathIs(page, S.profile)));
    await reopen(page);
    await say(page, S.cv);
    check(`“${S.cv}” abre o currículo real`, /\.pdf$/.test((await page.evaluate(() => window.__opened)).at(-1) ?? ""));
    const b = await say(page, S.backend[0]);
    check(`“${S.backend[0]}” traz a contribuição documentada`, S.backend[1].test(b), b.slice(0, 60));
    await restart(page);
    const c = await say(page, S.client[0]);
    check(`“${S.client[0]}” → ALVA como demonstração, em três frases, com a pergunta`, S.client[1].test(c) && S.client[2].test(c.trim()) && sentences(c) === 3 && (await pathIs(page, S.work("alva-odontologia"), 8000)), c.slice(0, 70));
    await page.waitForTimeout(1500);
    await reopen(page);
    const w = await pick(page, S.why[0]);
    check("“por que este exemplo?” diz que não é trabalho para cliente", S.why[1].test(w), w.slice(0, 60));
    const d = await say(page, S.answer[0]);
    check(`“${S.answer[0]}” continua desse ponto`, S.answer[1].test(d), d.slice(0, 60));
    const e = await say(page, S.price[0]);
    check(`“${S.price[0]}” explica o processo sem valor e espera a escolha`, S.price[1].test(e) && !MONEY.test(e) && (await stays(page, S.work("alva-odontologia"))));
    await chip(page, S.brief).click();
    check("escolher o pedido abre o Hire Rick", await pathIs(page, S.contact, 8000));
    await page.waitForSelector(`${GUIDE} textarea[readonly]`, { timeout: 8000 });
    const notes = await page.locator(`${GUIDE} textarea:not([readonly])`).inputValue();
    check("o pedido leva o que a pessoa contou e a dúvida, no idioma dela", notes.includes(S.client[0]) && S.price[2].test(notes), notes.replace(/\n/g, " | "));
    await restart(page);
    const f = await say(page, S.tour[0]);
    check(`“${S.tour[0]}” → Mabrouk Zanzibar`, S.tour[1].test(f) && (await pathIs(page, S.work("mabrouk-zanzibar"), 8000)));
    await page.waitForTimeout(1500);
    await reopen(page);
    const g = await say(page, S.another[0]);
    check(`“${S.another[0]}” → outra referência`, S.another[1].test(g) && (await pathIs(page, S.work("(?!mabrouk-zanzibar)[a-z-]+"), 8000)), g.slice(0, 60));
    await page.waitForTimeout(1500);
    await reopen(page);
    await say(page, S.like);
    check(`“${S.like}” → pedido de proposta`, await pathIs(page, S.contact, 8000));
    await reopen(page);
    const h = await say(page, S.landing[0]);
    check(`“${S.landing[0]}” → Kavita Drones`, S.landing[1].test(h) && (await pathIs(page, S.work("kavita-drones"), 8000)));
    await page.waitForTimeout(1500);
    await reopen(page);
    const i = await say(page, S.how[0]);
    check(`“${S.how[0]}” → processo real e Estúdio`, S.how[1].test(i) && (await pathIs(page, S.studio, 8000)));
    check("sem erros de console", errors.length === 0, errors.slice(0, 2).join(" | "));
    await ctx.close();
  }

  console.log("\n— a Matéria a um toque dentro de um case aberto pelo visitante");
  const { ctx, page, errors } = await open("/projetos/terral");
  const bubble = page.locator(".os-materia-bubble");
  check("com um app em primeiro plano, a pílula “Conversar com a Matéria” fica à vista", (await bubble.isVisible()) && /conversar com a matéria/i.test(await bubble.innerText()));
  await bubble.click();
  await page.waitForSelector(".os-materia-panel", { state: "visible" });
  const r = await say(page, "gostei desse, quanto custa?");
  check("ela sabe qual projeto está aberto, mesmo sem tê-lo recomendado", /TERRAL é a referência/.test(r), r.slice(0, 90));
  await chip(page, /Montar o pedido de proposta/i).click();
  check("o pedido abre quando a pessoa escolhe", await pathIs(page, /\/contato$/, 8000));
  await page.waitForSelector(`${GUIDE} textarea[readonly]`, { timeout: 8000 });
  check("o pedido sai com esse projeto como referência", /Referência: TERRAL/.test(await page.locator(`${GUIDE} textarea[readonly]`).inputValue()));
  await reopen(page);
  await page.locator('.os-materia-panel__icon[aria-label="Fechar a conversa"]').click();
  await page.waitForTimeout(400);
  check("fechar devolve o foco a quem abre a conversa", await page.evaluate(() => document.activeElement?.classList.contains("os-materia-bubble") || document.activeElement?.classList.contains("os-materia-talk")));
  check("sem erros de console", errors.length === 0, errors.slice(0, 2).join(" | "));
  await ctx.close();
}

// ───────────────────────── "Ver uma ideia para o meu site": o recorte no rosto e as duas prévias
/** Espera o recorte abrir na escultura; devolve o que o motor e a interface dizem dele. */
async function waitPortal(page, kind) {
  const set = await page.waitForFunction((k) => document.documentElement.dataset.osPortal === k, kind, { timeout: 6000 }).then(() => true).catch(() => false);
  const ready = set && (await page.waitForFunction(() => document.querySelector(".os-materia-portal")?.dataset.ready === "1", null, { timeout: 12000 }).then(() => true).catch(() => false));
  await page.waitForTimeout(400);
  const st = await engine(page);
  const geo = await page.evaluate(() => {
    const cut = document.querySelector(".os-materia-cut");
    const s = window.__mwMateria?.state;
    if (!cut || !s) return null;
    const r = cut.getBoundingClientRect();
    const box = document.querySelector(".os-materia canvas").getBoundingClientRect();
    // centro da figura no lugar em que ela está agora (repouso ou conversa)
    const L = s.layout;
    const fx = L.home.x + (L.talk.x - L.home.x) * s.place, fy = L.home.y + (L.talk.y - L.home.y) * s.place, fk = L.k * (1 + (L.talk.k - 1) * s.place);
    return { w: r.width, h: r.height, dx: r.left + r.width / 2 - (box.left + fx), dy: r.top + r.height / 2 - (box.top + fy), k: fk, text: cut.innerText, visible: getComputedStyle(cut).visibility === "visible" };
  });
  return { set, ready, st, geo };
}
if (ONLY.includes("idea")) {
  console.log("\n— prévia de mergulho (inglês): dive shop em Miami → Ace Diving → prévia → orçamento");
  {
    const { ctx, page, errors } = await open("/en", { locale: "en-US" });
    const alive = await live(page);
    await page.waitForTimeout(alive ? 2400 : 300);
    await askIdea(page);
    await page.waitForSelector(".os-materia-panel", { state: "visible", timeout: 8000 });
    await page.waitForFunction(() => document.querySelectorAll('.os-materia-msg[data-from="materia"]:not([data-thinking]) > p').length > 0, null, { timeout: 8000 });
    const ask = (await replies(page)).at(-1);
    const first = await chips(page);
    check("“See an idea for my site” abre a conversa perguntando pelo objetivo, por texto ou voz, sem destacar profissões", /What would you like your visitors to be able to do\?/i.test(ask) && first.length >= 3 && !first.some((c) => /dive|psycholog/i.test(c)) && (await page.locator("#os-materia-input").isVisible()) && (await page.locator(".os-materia-panel__mic").isVisible()), `${ask.slice(0, 60)} · ${first.join(" | ")}`);
    const r = await say(page, "I run a dive shop in Miami. I need a website for scuba bookings.");
    check("para mergulho não há pergunta: a resposta já apresenta a ideia e diz que é um conceito com o Ace Diving como referência", /Ace Diving Miami/.test(r) && /concept, not a finished site/i.test(r) && !r.trim().endsWith("?"), r.slice(0, 80));
    if (alive) {
      const P = await waitPortal(page, "dive");
      check("o acontecimento: a cabeça vira de perfil e o recorte se abre no rosto", P.set && P.ready && P.st.portal > 0.99 && P.st.morph < 0.01, P.st && `recorte ${P.st.portal.toFixed(2)} · cérebro ${P.st.morph.toFixed(2)}`);
      const sea = await page.waitForFunction(() => window.__mwMateria.state.sea > 0.97, null, { timeout: 4000 }).then(() => true).catch(() => false);
      check("a faixa de luz vira a superfície do mar", sea, `mar ${(await engine(page)).sea.toFixed(2)}`);
      check("o recorte fica dentro da cabeça, no lugar que o motor abriu, e mostra a página", P.geo && P.geo.visible && Math.abs(P.geo.dx - 0.06 * P.geo.k) < 4 && Math.abs(P.geo.dy + 0.1 * P.geo.k) < 4 && P.geo.w > 120 && /Descend before you book/i.test(P.geo.text), P.geo && `${Math.round(P.geo.w)}×${Math.round(P.geo.h)} px · desvio ${P.geo.dx.toFixed(1)} / ${P.geo.dy.toFixed(1)}`);
      check("o recorte é um botão com nome acessível, e há um botão escrito para o mesmo gesto", (await page.locator(".os-materia-cut").getAttribute("aria-label")) === "Open the idea showing inside Matéria" && (await page.locator(".os-materia-portal__open").isVisible()));
      await page.locator(".os-materia-cut").click();
      await page.waitForTimeout(250);
      check("tocar no recorte faz a página crescer até a janela", (await page.locator(".os-materia-flight").count()) === 1);
    } else {
      check("sem a escultura viva, a prévia abre direto na janela", /in a window/i.test(r));
    }
    await page.waitForSelector(IDEA, { state: "visible", timeout: 8000 });
    await page.waitForTimeout(1500);
    const win = page.locator(IDEA);
    check("a prévia é uma janela do MilWeb OS, sem resto da travessia e sem recorte", (await win.locator(".os-window__title").innerText()).trim().toUpperCase() === "PREVIEW" && (await page.locator(".os-materia-flight").count()) === 0 && !(await page.evaluate(() => document.documentElement.dataset.osPortal)));
    check("identificada como conceito, com dados ilustrativos", /CONCEPT/i.test(await win.innerText()) && /illustrative data/i.test(await win.innerText()));
    check("a referência é o Ace Diving Miami, com o status publicado no catálogo", /Reference: Ace Diving Miami/.test(await win.innerText()) && /Commercial proposal · demo/.test(await win.innerText()));
    check("a conversa se recolhe na pílula para a pessoa experimentar", (await page.locator(".os-materia-bubble").isVisible()) && (await page.locator(".os-materia-panel").count()) === 0);
    const scene = win.locator("[data-site]");
    const depth = () => win.locator('[role="slider"]').getAttribute("aria-valuenow").then(Number);
    const box = await scene.boundingBox();
    const d0 = await depth();
    await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.8);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.2, { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(400);
    const d1 = await depth();
    check("arrastar para descer: a página desce e o medidor de profundidade acompanha", d0 === 0 && d1 > 3, `${d0} m → ${d1} m`);
    await win.locator('[role="slider"]').focus();
    await page.keyboard.press("PageDown");
    await page.waitForTimeout(700);
    check("o medidor também desce pelo teclado", (await depth()) > d1, `${await depth()} m`);
    const cards = win.locator("article[data-kind]");
    check("escolha entre recife e naufrágio, com profundidade e nível", (await cards.count()) === 2 && /Reef/.test(await cards.nth(0).innerText()) && /12 m/i.test(await cards.nth(0).innerText()) && /Wreck/.test(await cards.nth(1).innerText()) && /26 m/i.test(await cards.nth(1).innerText()));
    await cards.nth(1).locator("button").click();
    await page.waitForTimeout(1500);
    check("escolher o naufrágio leva a página até ele (26 m)", (await scene.getAttribute("data-site")) === "wreck" && Math.abs((await depth()) - 26) <= 3, `${await depth()} m`);
    await win.locator('button[aria-label="One more diver"]').click();
    await win.locator("button", { hasText: /Sunday morning/i }).click();
    await win.locator("button", { hasText: /Start the booking request/i }).click();
    await page.waitForSelector(`${IDEA} [data-request="1"]`, { timeout: 4000 });
    const reqText = await win.locator('[data-request="1"]').innerText();
    check("mostra como um visitante iniciaria o pedido de reserva", /I would like to book: Wreck \(26 m\) · 3 divers · Sunday morning/.test(reqText), reqText.replace(/\n/g, " ").slice(0, 110));
    check("a demonstração termina antes de uma reserva real: nada é enviado e não há link de envio", /nothing was sent/i.test(reqText) && (await win.locator('a[href^="mailto:"], a[href*="wa.me"], form').count()) === 0);
    const use = win.locator('[data-use="1"]');
    check("o controle principal é “Use this direction in my quote request”", (await use.innerText()).trim() === "Use this direction in my quote request" && (await use.isVisible()));
    await use.click();
    check("…e leva ao Hire Rick", await pathIs(page, /\/en\/contact$/, 8000));
    const req = await request(page);
    check("o pedido leva o setor, a referência e as escolhas da prévia", /Reference: Ace Diving Miami/.test(req.preview) && /concept for a dive operator/i.test(req.notes) && /Choice in the preview: Wreck \(26 m\) · 3 divers · Sunday morning/.test(req.notes) && req.notes.includes("I run a dive shop in Miami"), req.notes.replace(/\n/g, " | ").slice(0, 200));
    check("a pessoa revisa o texto antes de enviar: prévia = corpo do e-mail, campo editável", req.body === req.preview && (await page.locator(`${GUIDE} textarea:not([readonly])`).isEditable()));
    // voltar à prévia: as escolhas continuam lá
    await page.locator('.os-window[data-app="contact"] [data-action="close"]').click();
    await page.waitForTimeout(900);
    check("ao voltar, a prévia continua com as escolhas (naufrágio, 3 mergulhadores, domingo, pedido iniciado)", (await page.locator(`${IDEA} [data-site="wreck"]`).count()) === 1 && (await win.locator("output").innerText()).trim() === "3" && (await win.locator('button[aria-pressed="true"]', { hasText: /Sunday morning/i }).count()) === 1 && (await win.locator('[data-request="1"]').count()) === 1);
    await page.locator(".os-materia-bubble").click();
    await page.waitForSelector(".os-materia-panel", { state: "visible" });
    check("…e a conversa também", (await replies(page)).some((t) => /Ace Diving Miami/.test(t)));
    check("sem erros de console", errors.length === 0, errors.slice(0, 2).join(" | "));
    await ctx.close();
  }

  console.log("\n— prévia do consultório (português): psicóloga → uma pergunta → prévia de direção → orçamento");
  {
    const { ctx, page, errors } = await open("/");
    const alive = await live(page);
    await page.waitForTimeout(alive ? 2400 : 300);
    await askIdea(page);
    await page.waitForSelector(".os-materia-panel", { state: "visible", timeout: 8000 });
    await page.waitForFunction(() => document.querySelectorAll('.os-materia-msg[data-from="materia"]:not([data-thinking]) > p').length > 0, null, { timeout: 8000 });
    const q = await say(page, "Sou psicóloga");
    const opts = await chips(page);
    check("uma única pergunta, a que muda a direção visual, com as duas saídas", /destacar sua abordagem ou facilitar o agendamento\?$/.test(q.trim()) && opts.length === 2 && /Quero facilitar o primeiro agendamento/.test(opts[0]) && /Quero apresentar minha abordagem/.test(opts[1]), `${q} [${opts.join(" | ")}]`);
    check("…e nada abre antes da resposta", (await page.locator(IDEA).count()) === 0 && !(await page.evaluate(() => document.documentElement.dataset.osPortal)));
    const r = await pick(page, /Quero facilitar o primeiro agendamento/);
    check("a Matéria apresenta a ALVA como referência de odontologia e avisa que a prévia é outra direção visual", /ALVA, uma demonstração de odontologia/.test(r) && /outra direção visual, pensada para consultório/i.test(r), r.slice(0, 90));
    if (alive) {
      const P = await waitPortal(page, "practice");
      check("o recorte se abre no rosto com a primeira dobra do consultório (sem mar)", P.set && P.ready && P.st.portal > 0.99 && P.st.sea < 0.05 && /O primeiro passo pode ser uma conversa/.test(P.geo?.text ?? "") && /Agendar primeira conversa/.test(P.geo?.text ?? ""), P.geo?.text.replace(/\n/g, " · "));
      await page.keyboard.press("Tab");
      await page.locator(".os-materia-portal__open").click();
    }
    await page.waitForSelector(IDEA, { state: "visible", timeout: 8000 });
    await page.waitForTimeout(1500);
    const win = page.locator(IDEA);
    const text = await win.innerText();
    check("identificada como prévia de direção, com conteúdo ilustrativo", /PRÉVIA DE DIREÇÃO/i.test(text) && /Conteúdo ilustrativo/i.test(text));
    check("a ALVA aparece como referência de odontologia, e a prévia como outra direção", /Referência: ALVA Odontologia/.test(text) && /demonstração de odontologia/i.test(text) && /outra direção visual/i.test(text));
    const look = await win.evaluate((w) => {
      const title = w.querySelector('[data-title="1"]');
      const body = w.querySelector(".os-window__body").getBoundingClientRect();
      const btn = w.querySelector('[data-primary="1"]').getBoundingClientRect();
      const page = title.closest('[class*="idea_page__"]').getBoundingClientRect();
      return { font: getComputedStyle(title).fontFamily, bg: getComputedStyle(title.closest('[class*="idea_practice__"]')).backgroundColor, inFold: btn.top >= page.top && btn.bottom <= page.bottom && btn.bottom <= body.bottom, btnBottom: Math.round(btn.bottom), fold: Math.round(page.bottom) };
    });
    check("proposta visual distinta: serifa e papel claro, nem a ALVA nem o OS", /Iowan|Palatino|Georgia/i.test(look.font) && look.bg === "rgb(239, 233, 223)", `${look.font.slice(0, 40)} · ${look.bg}`);
    const primary = win.locator('[data-primary="1"]');
    check("a primeira dobra mostra o botão “Agendar primeira conversa” inteiro", (await primary.innerText()).trim() === "Agendar primeira conversa" && look.inFold, `botão até ${look.btnBottom} px, dobra até ${look.fold} px`);
    const snap = () => win.evaluate((w) => ({ title: w.querySelector('[data-title="1"]').innerText, action: w.querySelector('[data-primary="1"]').innerText, order: [...w.querySelectorAll("[data-block]")].map((b) => b.dataset.block).join(">"), nav: [...w.querySelectorAll('nav [data-flip^="nav-"]')].map((b) => b.innerText).join(">") }));
    const before = await snap();
    await primary.click();
    await page.waitForTimeout(400);
    check("o botão mostra a mensagem pronta e avisa que nada é enviado", /Gostaria de agendar uma primeira conversa/.test(await win.locator('[data-ready="1"]').innerText()) && /nada é enviado/i.test(await win.locator('[data-ready="1"]').innerText()) && (await win.locator('a[href^="mailto:"], a[href*="wa.me"], form').count()) === 0);
    const t0 = Date.now();
    await win.locator('[role="radio"][data-direction="approach"]').click();
    await page.waitForFunction((sel) => document.querySelector(`${sel} [data-primary="1"]`)?.innerText.trim() === "Conhecer minha abordagem", IDEA, { timeout: 2000 });
    const took = Date.now() - t0;
    const after = await snap();
    check("alternar para “Apresentar minha abordagem” muda o título na hora", after.title !== before.title && /entenda como eu trabalho/i.test(after.title), `${took} ms · ${after.title}`);
    check("…a ordem das informações", after.order !== before.order && before.order === "first>approach>info" && after.order === "approach>session>first" && after.nav !== before.nav, `${before.order} → ${after.order}`);
    check("…e a ação principal", before.action.trim() === "Agendar primeira conversa" && after.action.trim() === "Conhecer minha abordagem");
    check("a troca é anunciada a quem usa leitor de tela, e os dois modos são um grupo de opções", /Direção alterada/.test(await win.locator('[role="status"]').first().innerText()) && (await win.locator('[role="radiogroup"] [role="radio"][aria-checked="true"]').count()) === 1);
    check("nenhum profissional, depoimento ou resultado inventado", !/(Dra?\.|CRP|depoimento|pacientes atendidos|\d+\s?%|anos de experiência)/i.test(await win.innerText()));
    await win.locator('[data-use="1"]').click();
    check("“Usar esta direção no meu orçamento” leva ao Hire Rick", await pathIs(page, /\/contato$/, 8000));
    const req = await request(page);
    check("o pedido leva o setor, a prioridade, a referência e as escolhas", /Referência: ALVA Odontologia/.test(req.preview) && /direção para consultório de psicologia/.test(req.notes) && /Prioridade: apresentar a abordagem/.test(req.notes) && /Ação principal: Conhecer minha abordagem/.test(req.notes) && /Ordem das informações: Minha abordagem → O que esperar da primeira sessão → Como funciona a primeira conversa/.test(req.notes), req.notes.replace(/\n/g, " | "));
    check("a prioridade antiga não fica no pedido, e a pessoa revisa antes de enviar", !/facilitar o primeiro agendamento/.test(req.notes) && req.body === req.preview);
    // voltar à conversa: ela sabe da direção escolhida na prévia
    await reopen(page);
    const back = await say(page, "ver uma ideia para o meu site");
    check("ao voltar à conversa e pedir a prévia de novo, ela não pergunta outra vez", !back.trim().endsWith("?") && /prévia de direção para o seu consultório/i.test(back), back.slice(0, 70));
    await page.waitForTimeout(alive ? 4200 : 900);
    if (alive) await page.locator(".os-materia-portal__open").click();
    await page.waitForSelector(IDEA, { state: "visible", timeout: 8000 });
    await page.waitForTimeout(1300);
    check("…e a prévia continua na direção escolhida", (await win.locator('[role="radio"][data-direction="approach"]').getAttribute("aria-checked")) === "true");
    check("sem erros de console", errors.length === 0, errors.slice(0, 2).join(" | "));
    await ctx.close();
  }

  for (const S of [
    { lang: "inglês", home: "/en", locale: "en-US", me: "I'm a psychologist", choose: /I want to present my approach/, tag: /DIRECTION PREVIEW/i, title: /Before you book, see how I work/, action: "Read my approach", title2: /The first step can be a conversation/, action2: "Book a first conversation", use: "Use this direction in my quote request", contact: /\/en\/contact$/, notes: [/direction for a psychology practice/, /Priority: make the first booking easy/, /Primary action: Book a first conversation/], ref: /Reference: ALVA Odontologia/ },
    { lang: "espanhol", home: "/es", locale: "es-ES", me: "Soy psicóloga", choose: /Quiero presentar mi enfoque/, tag: /VISTA PREVIA DE DIRECCIÓN/i, title: /Antes de agendar, conoce cómo trabajo/, action: "Conocer mi enfoque", title2: /El primer paso puede ser una conversación/, action2: "Agendar primera conversación", use: "Usar esta dirección en mi cotización", contact: /\/es\/contacto$/, notes: [/dirección para consulta de psicología/, /Prioridad: facilitar la primera cita/, /Acción principal: Agendar primera conversación/], ref: /Referencia: ALVA Odontologia/ },
  ]) {
    console.log(`\n— prévia do consultório (${S.lang}): começando pela outra direção`);
    const { ctx, page, errors } = await open(S.home, { locale: S.locale });
    const alive = await live(page);
    await page.waitForTimeout(alive ? 2400 : 300);
    await askIdea(page);
    await page.waitForSelector(".os-materia-panel", { state: "visible", timeout: 8000 });
    await page.waitForFunction(() => document.querySelectorAll('.os-materia-msg[data-from="materia"]:not([data-thinking]) > p').length > 0, null, { timeout: 8000 });
    const q = await say(page, S.me);
    check(`“${S.me}” → uma pergunta com duas saídas`, q.trim().endsWith("?") && (await chips(page)).length === 2, q);
    await pick(page, S.choose);
    if (alive) {
      await waitPortal(page, "practice");
      await page.locator(".os-materia-portal__open").click();
    }
    await page.waitForSelector(IDEA, { state: "visible", timeout: 8000 });
    await page.waitForTimeout(1400);
    const win = page.locator(IDEA);
    const read = () => win.evaluate((w) => ({ title: w.querySelector('[data-title="1"]').innerText, action: w.querySelector('[data-primary="1"]').innerText.trim() }));
    const first = await read();
    check("a prévia abre na direção escolhida, no idioma do site", S.tag.test(await win.innerText()) && S.title.test(first.title) && first.action === S.action, `${first.title} · ${first.action}`);
    await win.locator('[role="radio"][data-direction="booking"]').click();
    await page.waitForTimeout(500);
    const second = await read();
    check("alternar muda o título e a ação principal", S.title2.test(second.title) && second.action === S.action2, `${second.title} · ${second.action}`);
    check("o controle principal está no idioma", (await win.locator('[data-use="1"]').innerText()).trim() === S.use);
    await win.locator('[data-use="1"]').click();
    check("…e leva ao pedido", await pathIs(page, S.contact, 8000));
    const req = await request(page);
    check("o pedido leva a direção escolhida na prévia, a referência e o que a pessoa contou", S.notes.every((rx) => rx.test(req.notes)) && S.ref.test(req.preview) && req.notes.includes(S.me) && req.body === req.preview, req.notes.replace(/\n/g, " | ").slice(0, 200));
    check("sem erros de console", errors.length === 0, errors.slice(0, 2).join(" | "));
    await ctx.close();
  }

  console.log("\n— prévia: conversa comum, outro idioma e negócio sem prévia");
  {
    const { ctx, page, errors } = await open("/es", { locale: "es-ES" });
    const alive = await live(page);
    await page.waitForTimeout(alive ? 2400 : 300);
    await talk(page);
    const a = await say(page, "Tengo un centro de buceo y necesito un sitio para reservas");
    check("ES: na conversa comum, a recomendação convida para a ideia", /¿Quieres ver una idea así para tu centro de buceo\?$/.test(a.trim()), a.slice(-60));
    await pathIs(page, /\/es\/proyectos\/ace-diving-miami$/, 8000);
    await page.waitForTimeout(1500);
    await reopen(page);
    const b = await say(page, "sí");
    check("ES: “sí” apresenta a ideia (com o case aberto, as janelas saem de cena para a escultura aparecer)", /una idea para tu centro de buceo/i.test(b));
    if (alive) {
      const P = await waitPortal(page, "dive");
      const hidden = await page.evaluate(() => getComputedStyle(document.querySelector('.os-window[data-app="projects"]')).opacity);
      check("ES: o recorte abre mesmo com uma janela na frente", P.ready && hidden === "0" && /Desciende antes de reservar/i.test(P.geo?.text ?? ""), `opacidade da janela ${hidden}`);
      await page.locator(".os-materia-portal__close").click();
      await page.waitForTimeout(700);
      check("ES: “Ahora no” fecha o recorte e devolve as janelas", !(await page.evaluate(() => document.documentElement.dataset.osPortal)) && (await page.evaluate(() => getComputedStyle(document.querySelector('.os-window[data-app="projects"]')).opacity)) === "1");
      await chip(page, /Abrir la vista previa/i).click();
      await waitPortal(page, "dive");
      await page.locator(".os-materia-cut").click();
    }
    await page.waitForSelector(IDEA, { state: "visible", timeout: 8000 });
    await page.waitForTimeout(1300);
    check("ES: a prévia abre em espanhol", /CONCEPTO/i.test(await page.locator(IDEA).innerText()) && /Desciende antes de reservar/.test(await page.locator(IDEA).innerText()));
    await reopen(page);
    await restart(page);
    await answer(page, () => page.locator("#os-materia-input").fill("Ver una idea para mi sitio").then(() => page.locator("#os-materia-input").press("Enter")));
    const c = await say(page, "Tengo un despacho de abogados");
    check("ES: negócio sem prévia interativa → diz que mostra a referência mais próxima e recomenda uma", /referencia más cercana del catálogo/i.test(c) && /Kavita Institucional/.test(c), c.slice(0, 110));
    check("sem erros de console", errors.length === 0, errors.slice(0, 2).join(" | "));
    await ctx.close();
  }
}

// ───────────────────────── voz (SIMULADA) e microfone negado
const FAKE_SPEECH = (mode, phrase = "sou recrutador") => `
  window.__speech = { started: 0, aborted: 0, spoken: [], cancelled: 0 };
  class FakeRecognition {
    start() {
      window.__speech.started++;
      window.__speech.lang = this.lang;
      if (${JSON.stringify(mode)} === "denied") return void setTimeout(() => { this.onerror && this.onerror({ error: "not-allowed" }); this.onend && this.onend(); }, 60);
      if (${JSON.stringify(mode)} === "hold") return;
      const said = ${JSON.stringify(phrase)};
      setTimeout(() => this.onresult && this.onresult({ resultIndex: 0, results: [{ isFinal: false, 0: { transcript: said.slice(0, 9) } }] }), 150);
      setTimeout(() => { this.onresult && this.onresult({ resultIndex: 0, results: [{ isFinal: true, 0: { transcript: said } }] }); this.onend && this.onend(); }, 700);
    }
    stop() {}
    abort() { window.__speech.aborted++; }
  }
  window.SpeechRecognition = FakeRecognition;
  window.webkitSpeechRecognition = FakeRecognition;
  const synth = { speaking: false, cancel() { window.__speech.cancelled++; }, speak(u) { window.__speech.spoken.push(u.text); window.__utter = u; }, getVoices: () => [] };
  Object.defineProperty(window, "speechSynthesis", { value: synth, configurable: true });
`;
if (ONLY.includes("voice")) {
  console.log("\n— voz SIMULADA (SpeechRecognition falso; não é microfone físico)");
  {
    const { ctx, page } = await open("/", { init: FAKE_SPEECH("ok") });
    check("a entrada é silenciosa: nada escuta nem fala antes de a pessoa escolher", (await page.evaluate(() => window.__speech.started + window.__speech.spoken.length)) === 0);
    await talk(page);
    check("abrir a conversa não pede o microfone", (await page.evaluate(() => window.__speech.started)) === 0);
    await page.locator(".os-materia-panel__mic").click();
    await page.waitForTimeout(380);
    const interim = await page.locator('.os-materia-msg[data-interim="1"]').innerText().catch(() => "");
    check("o microfone só começa quando a pessoa escolhe falar, no idioma do site", (await page.evaluate(() => window.__speech)).lang === "pt-BR");
    check("a transcrição aparece enquanto a pessoa fala", /sou recru/.test(interim), interim.replace(/\s+/g, " "));
    await page.waitForFunction(() => window.__speech.spoken.length > 0, null, { timeout: 6000 }).catch(() => {});
    const sp = await page.evaluate(() => window.__speech.spoken);
    check("a frase reconhecida é enviada e a resposta é falada", sp.length === 1 && /engenheiro de software/i.test(sp[0]) && (await pathIs(page, /\/perfil$/)));
    await reopen(page);
    const stop = page.locator(".os-materia-panel__tool");
    const had = await stop.isVisible();
    if (had) await stop.click();
    check("dá para interromper a resposta falada", had && (await page.evaluate(() => window.__speech.cancelled)) >= 2);
    await ctx.close();
  }
  {
    const { ctx, page } = await open("/", { init: FAKE_SPEECH("ok", "mostra os seus sites") });
    const alive = await live(page);
    if (alive) await page.evaluate(() => window.__mwMateria.need("projects"));
    await talk(page);
    await page.locator(".os-materia-panel__mic").click();
    const at = await pathIs(page, /\/projetos$/, 9000);
    await page.waitForFunction(() => !document.documentElement.dataset.osArriving, null, { timeout: 9000 }).catch(() => undefined);
    await page.waitForTimeout(400);
    check("por voz (simulada), “mostra os seus sites” aciona o mesmo destino do clique e do texto: a coleção, com o TERRAL em destaque", at && (await page.locator('.bounty__slot[data-active="1"]').getAttribute("data-slug")) === "terral" && (!alive || (await eng(page)).char === "projects"));
    await ctx.close();
  }
  {
    const { ctx, page } = await open("/", { init: FAKE_SPEECH("ok", "quero ver o currículo") });
    await talk(page);
    await page.locator(".os-materia-panel__mic").click();
    const at = await pathIs(page, /\/perfil$/, 9000);
    await page.waitForFunction(() => !document.documentElement.dataset.osArriving, null, { timeout: 9000 }).catch(() => undefined);
    const focused = await page.waitForFunction(() => document.activeElement?.getAttribute("data-profile-action") === "view-cv", null, { timeout: 5000 }).then(() => true).catch(() => false);
    const opened = await page.evaluate(() => window.__opened);
    const href = focused ? await page.evaluate(() => document.activeElement.getAttribute("href")) : "";
    check("por voz (simulada), “quero ver o currículo”: o navegador não abre aba nova por voz — o Perfil chega com o link do PDF já em foco, a um Enter do documento", at && focused && opened.length === 0 && /\.pdf$/.test(href ?? ""), `abas abertas pelo script: ${opened.length}, foco em ${href}`);
    await ctx.close();
  }
  {
    const { ctx, page } = await open("/", { init: FAKE_SPEECH("ok", "tenho uma operadora de mergulho") });
    const alive = await live(page);
    await page.waitForTimeout(alive ? 2400 : 300);
    await askIdea(page);
    await page.waitForSelector(".os-materia-panel", { state: "visible" });
    await page.waitForTimeout(900);
    await page.locator(".os-materia-panel__mic").click();
    await page.waitForFunction(() => window.__speech.spoken.length > 0, null, { timeout: 6000 }).catch(() => {});
    const sp = await page.evaluate(() => window.__speech.spoken);
    const ok = alive ? (await waitPortal(page, "dive")).ready : await page.waitForSelector(IDEA, { state: "visible", timeout: 6000 }).then(() => true).catch(() => false);
    check("a prévia também se pede por voz (simulada): o negócio falado abre a ideia de mergulho", sp.length === 1 && /operadora de mergulho/i.test(sp[0]) && ok, sp[0]?.slice(0, 70));
    await ctx.close();
  }
  {
    const { ctx, page } = await open("/", { init: FAKE_SPEECH("denied") });
    await talk(page);
    await page.locator(".os-materia-panel__mic").click();
    await page.waitForTimeout(400);
    const notice = await page.locator(".os-materia-panel__notice").innerText();
    check("microfone negado: aviso claro e o texto continua disponível", /microfone não foi liberado/i.test(notice) && (await page.locator("#os-materia-input").isEnabled()), notice);
    const r = await say(page, "Mostre algo de turismo");
    check("…e a conversa segue por texto", /Mabrouk Zanzibar/.test(r));
    await ctx.close();
  }
  {
    const { ctx, page } = await open("/", { init: FAKE_SPEECH("hold") });
    await talk(page);
    await page.locator(".os-materia-panel__mic").click();
    await page.waitForTimeout(200);
    const listening = await page.locator(".os-materia-panel").getAttribute("data-phase");
    await page.locator('.os-materia-panel__icon[aria-label="Fechar a conversa"]').click();
    await page.waitForTimeout(200);
    check("fechar a conversa encerra a escuta", listening === "listening" && (await page.evaluate(() => window.__speech.aborted)) === 1);
    await ctx.close();
  }
}

// ───────────────────────── movimento reduzido: poses estáticas, destino e prévia diretos
if (ONLY.includes("reduced")) {
  console.log("\n— movimento reduzido");
  const { ctx, page, errors } = await open("/", { reduced: true });
  await page.waitForTimeout(1500);
  const bg = () => page.evaluate(() => getComputedStyle(document.querySelector(".os-materia .os-scene__still")).backgroundImage);
  check("a escultura fica na imagem estática (sem motor)", (await page.locator(".os-materia").getAttribute("data-state")) === "still" && /materia-home-dark\.webp/.test(await bg()));
  const img = await ctx.request.get(`${BASE}/art/materia-home-dark.webp`);
  const img2 = await ctx.request.get(`${BASE}/art/materia-brain-light.webp`);
  check("as imagens estáticas existem (a home com a dobra aberta e o cérebro)", img.ok() && img2.ok(), `${img.status()} / ${img2.status()}`);
  await talk(page);
  check("na conversa, a pose estática do cérebro", /materia-brain-dark\.webp/.test(await bg()));
  const t0 = Date.now();
  const r = await say(page, "Mostre algo de turismo");
  const ok = await pathIs(page, /\/projetos\/mabrouk-zanzibar$/, 3000);
  check("o destino abre direto, sem travessia", ok && /Mabrouk/.test(r) && (await page.locator(".os-materia-shard").count()) === 0, `${Date.now() - t0} ms`);
  await restart(page);
  await page.locator('.os-materia-panel__icon[aria-label="Fechar a conversa"]').click();
  await page.locator('.os-window[data-app="projects"] [data-action="close"]').click();
  await page.waitForTimeout(500);
  await askIdea(page);
  await page.waitForSelector(".os-materia-panel", { state: "visible" });
  await page.waitForTimeout(300);
  const t1 = Date.now();
  // sem animação a janela abre junto com a resposta e a conversa se recolhe: a resposta é lida pela pílula
  await page.locator("#os-materia-input").fill("Tenho uma operadora de mergulho");
  await page.locator("#os-materia-input").press("Enter");
  const direct = await page.waitForSelector(IDEA, { state: "visible", timeout: 3000 }).then(() => true).catch(() => false);
  const took = Date.now() - t1;
  const unread = await page.locator(".os-materia-bubble").getAttribute("data-unread");
  await reopen(page);
  const d = (await replies(page)).at(-1) ?? "";
  await page.locator('.os-materia-panel__icon[aria-label="Recolher a conversa"]').click();
  check("a mesma prévia abre direto na janela, sem recorte e sem voo", direct && /numa janela/i.test(d) && !(await page.evaluate(() => document.documentElement.dataset.osPortal)) && (await page.locator(".os-materia-flight, .os-materia-cut").count()) === 0 && unread === "1", `${took} ms`);
  const win = page.locator(IDEA);
  check("…com o mesmo conteúdo: conceito, descida, recife ou naufrágio, botão do orçamento", /CONCEITO/i.test(await win.innerText()) && /Desça antes de reservar/.test(await win.innerText()) && (await win.locator("article[data-kind]").count()) === 2 && (await win.locator('[data-use="1"]').isVisible()));
  await win.locator('article[data-kind="reef"] button').click();
  await page.waitForTimeout(400);
  check("…e a escolha funciona sem animação (recife, 12 m)", (await win.locator("[data-site]").getAttribute("data-site")) === "reef" && Math.abs(Number(await win.locator('[role="slider"]').getAttribute("aria-valuenow")) - 12) <= 2);
  check("sem erros de console", errors.length === 0, errors.slice(0, 2).join(" | "));
  await ctx.close();
}

// ───────────────────────── o 3D ainda carregando: projetos e prévia continuam acessíveis
if (ONLY.includes("loading")) {
  console.log("\n— enquanto o 3D carrega (as moléculas nunca chegam)");
  let held = 0;
  const { ctx, page, errors } = await open("/en", { locale: "en-US", route: (p) => p.route("**/models/materia-*.bin*", () => { held++; }) });
  await page.waitForTimeout(2500);
  check("as moléculas estão retidas e a escultura fica na imagem estática", held >= 1 && (await page.locator(".os-materia").getAttribute("data-state")) === "still", `${held} arquivo(s) retido(s)`);
  check("os dois destaques, a navegação e a conversa já estão à mão", (await page.locator("#os-icon-projects").isVisible()) && (await page.locator("#os-icon-profile").isVisible()) && (await page.locator("#os-icon-services").isVisible()) && (await page.locator(".os-materia-talk").isVisible()));
  await page.locator("#os-icon-projects").click();
  check("Projetos abre pelo ícone, sem esperar o 3D", await pathIs(page, /\/en\/work$/, 6000));
  await page.locator('.os-window[data-app="projects"] [data-action="close"]').click();
  await pathIs(page, /^\/en$/, 6000);
  await talk(page);
  const a = await say(page, "I run a dive shop in Miami. I need a website for scuba bookings.");
  check("a conversa recomenda o Ace Diving e o case abre direto", /Ace Diving Miami/.test(a) && (await pathIs(page, /\/en\/work\/ace-diving-miami$/, 8000)));
  await page.waitForTimeout(1200);
  await reopen(page);
  const b = await pick(page, /See an idea for my site/i);
  const direct = await page.waitForSelector(IDEA, { state: "visible", timeout: 4000 }).then(() => true).catch(() => false);
  check("a prévia abre direto na janela (sem recorte)", direct && /in a window/i.test(b) && !(await page.evaluate(() => document.documentElement.dataset.osPortal)), b.slice(0, 60));
  check("sem erros de console", errors.length === 0, errors.slice(0, 2).join(" | "));
  await ctx.close();
}

// ───────────────────────── telefone
if (ONLY.includes("mobile")) {
  console.log("\n— telefone (390 × 844)");
  const { ctx, page, errors } = await open("/en", { phone: true, locale: "en-US" });
  const alive = await live(page, 15000);
  const box = async (sel) => page.locator(sel).first().boundingBox();
  const pill = await box(".os-materia-talk");
  const goA = await box('.os-materia-go[data-app="projects"]');
  const goB = await box('.os-materia-go[data-app="profile"]');
  const grid = await box(".os-launcher__apps");
  check("“See the work” e “Profile and résumé” aparecem inteiros, lado a lado, acima da grade de apps, com alvo ≥ 44 px", goA && goB && grid && goA.x >= 0 && goB.x + goB.width <= 390 && goA.x + goA.width <= goB.x - 4 && Math.abs(goA.y - goB.y) < 2 && goA.height >= 44 && goB.height >= 44 && goA.y + goA.height <= grid.y + 2, goA && `${Math.round(goA.width)}×${Math.round(goA.height)} em y ${Math.round(goA.y)}`);
  check("a conversa é a terceira entrada: pequena, logo acima dos dois, inteira na tela, com alvo ≥ 44 px", pill && goA && pill.x >= 0 && pill.x + pill.width <= 390 && pill.y + pill.height <= goA.y + 2 && pill.height >= 44 && pill.width < 260, pill && `${Math.round(pill.width)}×${Math.round(pill.height)} em y ${Math.round(pill.y)}`);
  if (alive) {
    await page.waitForTimeout(1500);
    const st = await engine(page);
    const hero = st.layout.hero;
    const stage = await box(".os-stage");
    check("a escultura ocupa o palco, acima dos destaques, e não segura o toque (a tela rola por cima dela)", stage && hero.x > 40 && hero.x < 350 && hero.y > stage.y && hero.y < goA.y && st.char === "rest" && (await page.evaluate(() => getComputedStyle(document.querySelector(".os-materia")).pointerEvents)) === "none", `quadro em (${Math.round(hero.x)}, ${Math.round(hero.y)}), ${Math.round(hero.h)} px de altura`);
  }
  await page.locator(".os-materia-talk").tap();
  await page.waitForSelector(".os-materia-panel", { state: "visible" });
  await page.waitForTimeout(600);
  const input = await box("#os-materia-input");
  const send = await box(".os-materia-panel__send");
  const mic = await box(".os-materia-panel__mic");
  check("campo, microfone e enviar visíveis e com alvo ≥ 44 px", [input, send, mic].every((b) => b && b.y + b.height <= 844 && b.height >= 44 && b.x >= 0 && b.x + b.width <= 390), `enviar em y ${send && Math.round(send.y + send.height)}`);
  check("o campo usa 16 px (o telefone não dá zoom ao focar)", (await page.locator("#os-materia-input").evaluate((el) => getComputedStyle(el).fontSize)) === "16px");
  // teclado virtual: a janela visual encolhe; a folha precisa caber nela
  const keyboard = (h) => page.evaluate((hh) => {
    const vv = window.visualViewport;
    if (hh) Object.defineProperty(vv, "height", { value: hh, configurable: true });
    else delete vv.height;
    vv.dispatchEvent(new Event("resize"));
  }, h);
  await keyboard(480);
  await page.waitForTimeout(200);
  const kb = await page.evaluate(() => {
    const r = (s) => document.querySelector(s).getBoundingClientRect();
    return { panelTop: r(".os-materia-panel").top, sendBottom: r(".os-materia-panel__send").bottom, inputBottom: r("#os-materia-input").bottom };
  });
  check("com o teclado aberto (janela visual de 480 px, simulada), campo e enviar ficam acima dele", kb.sendBottom <= 480 && kb.inputBottom <= 480 && kb.panelTop >= 0, JSON.stringify(kb));
  await keyboard(0);
  const r = await say(page, "Show me something for tourism");
  check("a resposta vem em inglês e o case abre em tela cheia", /Mabrouk Zanzibar/.test(r) && /client work/i.test(r) && (await pathIs(page, /\/en\/work\/mabrouk-zanzibar$/, 8000)));
  await page.waitForTimeout(1600);
  check("a conversa vira uma pílula sobre o case", (await page.locator(".os-materia-bubble").isVisible()) && (await page.locator(".os-materia-panel").count()) === 0);
  await page.locator(".os-materia-bubble").tap();
  await page.waitForSelector(".os-materia-panel", { state: "visible" });
  check("tocar na pílula recupera a conversa", (await replies(page)).some((t) => /Mabrouk/.test(t)));
  check("sem rolagem horizontal", await page.evaluate(() => document.scrollingElement.scrollWidth <= window.innerWidth + 1));

  console.log("\n— telefone: a prévia, a volta à conversa e o orçamento com o teclado aberto");
  await restart(page);
  const d = await say(page, "I run a dive shop in Miami. I need a website for scuba bookings.");
  check("a frase do mergulho recomenda o Ace Diving também no telefone", /Ace Diving Miami/.test(d) && (await pathIs(page, /\/en\/work\/ace-diving-miami$/, 8000)));
  await page.waitForTimeout(1600);
  await page.locator(".os-materia-bubble").tap();
  await page.waitForSelector(".os-materia-panel", { state: "visible" });
  await answer(page, () => chip(page, /See an idea for my site/i).tap());
  if (alive) {
    const P = await waitPortal(page, "dive");
    const cutBox = await box(".os-materia-cut");
    check("o recorte abre na tela inicial, com a folha recolhida e a figura inteira à vista", P.ready && (await pathIs(page, /^\/en$/, 3000)) && (await page.locator(".os-materia-panel").count()) === 0 && cutBox && cutBox.width >= 120 && cutBox.y > 0 && cutBox.y + cutBox.height < grid.y, cutBox && `${Math.round(cutBox.width)}×${Math.round(cutBox.height)} em y ${Math.round(cutBox.y)}`);
    const openBtn = await box(".os-materia-portal__open");
    check("os botões do recorte cabem acima da grade, com alvo ≥ 44 px", openBtn && openBtn.height >= 44 && openBtn.y + openBtn.height <= grid.y + 2 && openBtn.x >= 0);
    await page.locator(".os-materia-cut").tap();
  }
  await page.waitForSelector(IDEA, { state: "visible", timeout: 8000 });
  await page.waitForTimeout(1500);
  const win = page.locator(IDEA);
  const full = await win.boundingBox();
  check("a prévia ocupa a tela do telefone", full && full.width === 390 && full.height >= 800);
  const scene = win.locator("[data-site]");
  const depth = () => win.locator('[role="slider"]').getAttribute("aria-valuenow").then(Number);
  await scene.evaluate((el) => el.scrollBy({ top: el.clientHeight * 0.5 }));
  await page.waitForTimeout(400);
  check("a pessoa explora: a página desce com o dedo e o medidor acompanha", (await depth()) > 3, `${await depth()} m`);
  await win.locator('article[data-kind="reef"] button').tap();
  await page.waitForTimeout(1500);
  check("escolhe o recife (12 m)", (await scene.getAttribute("data-site")) === "reef" && Math.abs((await depth()) - 12) <= 2, `${await depth()} m`);
  const useBox = await box(`${IDEA} [data-use="1"]`);
  const pillBox = await box(".os-materia-bubble");
  const refBox = await box(`${IDEA} footer button`);
  const hits = (a, b) => a && b && a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
  check("o botão do orçamento fica inteiro e sempre à vista, com alvo ≥ 44 px", useBox && useBox.height >= 44 && useBox.y + useBox.height <= 844 && useBox.x >= 0 && useBox.x + useBox.width <= 390, useBox && `até y ${Math.round(useBox.y + useBox.height)}`);
  check("a pílula da Matéria não cobre nem o botão do orçamento nem a referência", pillBox && !hits(pillBox, useBox) && !hits(pillBox, refBox), pillBox && `pílula em y ${Math.round(pillBox.y)}`);
  await page.locator(".os-materia-bubble").tap();
  await page.waitForSelector(".os-materia-panel", { state: "visible" });
  check("volta à conversa por cima da prévia, com tudo o que foi dito", (await replies(page)).some((t) => /an idea for your dive shop/i.test(t)));
  await page.locator('.os-materia-panel__icon[aria-label="Minimise the conversation"]').tap();
  await page.waitForTimeout(400);
  check("…e a prévia continua onde estava, com o recife escolhido", (await scene.getAttribute("data-site")) === "reef" && (await win.isVisible()));
  await win.locator('[data-use="1"]').tap();
  check("“Use this direction in my quote request” leva ao pedido", await pathIs(page, /\/en\/contact$/, 8000));
  const req = await request(page);
  check("o pedido chega preenchido com a escolha feita no telefone", /Reference: Ace Diving Miami/.test(req.preview) && /Choice in the preview: Reef \(12 m\)/.test(req.notes), req.notes.replace(/\n/g, " | ").slice(0, 160));
  // teclado aberto na revisão: o campo em edição e o texto do pedido precisam caber na janela visual
  const notes = page.locator(`${GUIDE} textarea:not([readonly])`);
  await notes.tap();
  await keyboard(480);
  await page.waitForTimeout(250);
  await notes.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(200);
  const nb = await notes.boundingBox();
  check("com o teclado aberto (janela visual de 480 px, simulada), o campo em edição fica inteiro acima dele", nb && nb.y >= 56 && nb.y + nb.height <= 480, nb && `campo de y ${Math.round(nb.y)} a ${Math.round(nb.y + nb.height)}`);
  await notes.pressSequentially(" We open in June.");
  const pv = page.locator(`${GUIDE} textarea[readonly]`);
  await pv.evaluate((el) => el.scrollIntoView({ block: "end" }));
  await page.waitForTimeout(200);
  const pb = await pv.boundingBox();
  check("…a pessoa edita, rola e revê a mensagem inteira com o teclado aberto", (await pv.inputValue()).includes("We open in June.") && pb && pb.y + pb.height <= 480 + 1, pb && `mensagem até y ${Math.round(pb.y + pb.height)}`);
  const pill2 = await box(".os-materia-bubble");
  check("…e a pílula da Matéria não fica sobre o campo", !pill2 || !hits(pill2, await notes.boundingBox()));
  await keyboard(0);
  await page.goBack();
  await page.waitForTimeout(900);
  check("Voltar reencontra a prévia com a escolha", (await page.locator(`${IDEA} [data-site="reef"]`).count()) === 1 && (await win.isVisible()));
  check("sem rolagem horizontal", await page.evaluate(() => document.scrollingElement.scrollWidth <= window.innerWidth + 1));
  check("sem erros de console", errors.length === 0, errors.slice(0, 2).join(" | "));
  await ctx.close();
}

// ───────────────────────── microfone habilitado na própria origem
if (ONLY.includes("policy")) {
  console.log("\n— Permissions-Policy");
  const ctx = await browser.newContext();
  const res = await ctx.request.get(`${BASE}/en`);
  const policy = res.headers()["permissions-policy"] ?? "";
  check("o microfone está liberado só para a própria origem", /microphone=\(self\)/.test(policy) && /camera=\(\)/.test(policy), policy || "(sem o cabeçalho)");
  await ctx.close();
}

await browser.close();
console.log(`\n${pass}/${pass + fails.length} ok${fails.length ? ` — falhas: ${fails.join("; ")}` : ""}`);
process.exit(fails.length ? 1 : 0);
