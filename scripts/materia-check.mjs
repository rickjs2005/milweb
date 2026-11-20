/**
 * Matéria — verificação da escultura e da conversa, pela interface real.
 *
 *   node scripts/materia-check.mjs [--base http://127.0.0.1:3100] [--only scene,recruiter,client,explore,languages,voice,reduced,mobile,policy] [--software]
 *
 * Por padrão usa a GPU real (ANGLE/D3D11) para a cena viva. `--software` força a GPU por software:
 * a cena cai na imagem estática e a conversa precisa funcionar do mesmo jeito.
 *
 * VOZ: o grupo `voice` SIMULA o reconhecimento de fala (um `SpeechRecognition` falso injetado na
 * página) — confere a transcrição, a permissão negada, a interrupção da resposta e o fim da escuta ao
 * fechar. Não é teste com microfone físico; esse só se faz num aparelho, à mão.
 * O teste para antes de qualquer envio: nenhum link de e-mail ou WhatsApp é aberto.
 */
import { chromium } from "playwright";

const opt = (k, d) => {
  const i = process.argv.indexOf(k);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d;
};
const BASE = opt("--base", "http://127.0.0.1:3100").replace(/\/$/, "");
const ONLY = opt("--only", "scene,recruiter,client,explore,languages,voice,reduced,mobile,policy").split(",");
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
const replies = (page) => page.locator('.os-materia-msg[data-from="materia"]:not([data-thinking]) > p').allInnerTexts();
/** Escreve, envia e espera a resposta nova da Matéria. */
async function say(page, text) {
  const before = (await replies(page)).length;
  await page.locator("#os-materia-input").fill(text);
  await page.locator("#os-materia-input").press("Enter");
  await page.waitForFunction((n) => document.querySelectorAll('.os-materia-msg[data-from="materia"]:not([data-thinking]) > p').length > n, before, { timeout: 8000 });
  await page.waitForTimeout(250);
  const all = await replies(page);
  return all[all.length - 1];
}
const chips = (page) => page.locator(".os-materia-msg__actions button").allInnerTexts();
const pathIs = (page, rx, ms = 6000) => page.waitForURL((u) => rx.test(u.pathname), { timeout: ms }).then(() => true).catch(() => false);
const reopen = async (page) => {
  const bubble = page.locator(".os-materia-bubble");
  if (await bubble.count()) await bubble.click();
  await page.waitForSelector(".os-materia-panel", { state: "visible", timeout: 5000 });
};
const MONEY = /(R\$|US\$|USD|\$\s?\d|\d+\s?(reais|dólares|dolares|dollars|euros))/i;

// ───────────────────────── cena: repouso, dobrar o tempo, ver o pensamento
if (ONLY.includes("scene")) {
  console.log("\n— cena (desktop 1440 × 900)");
  const { ctx, page, errors } = await open("/en");
  const alive = await live(page);
  check("a escultura entra viva com GPU real (ou fica a imagem com --software)", alive || SOFTWARE, alive ? "WebGL" : "imagem estática");
  const hit = page.locator(".os-materia-hit");
  check("a figura é um controle com nome acessível e o botão “Talk to Matéria” está visível", (await hit.getAttribute("aria-label"))?.includes("Matéria") && (await page.locator(".os-materia-talk").innerText()).trim().toUpperCase() === "TALK TO MATÉRIA");
  if (alive) {
    await page.waitForTimeout(2200);
    const st = await page.evaluate(() => window.__mwMateria.state);
    check("52 mil moléculas no desktop, quadro dentro do orçamento", st.count === 52000 && st.costMs < 45, `${st.count} · calibração ${st.costMs.toFixed(1)} ms · dpr ${st.dpr.toFixed(2)}`);
    // dobrar o tempo: o ponteiro vai e volta ao lado do rosto
    const l = st.layout;
    let on = true;
    const mover = (async () => { for (let i = 0; on; i++) { await page.mouse.move(l.home.x + Math.sin(i * 0.42) * 0.95 * l.k, l.home.y + 46); await page.waitForTimeout(24); } })();
    let peak = 0;
    for (let i = 0; i < 40; i++) { peak = Math.max(peak, Math.abs(await page.evaluate(() => window.__mwMateria.state.split))); await page.waitForTimeout(30); }
    on = false;
    await mover;
    check("dobrar o tempo: os dois perfis se separam com o gesto", peak > 0.25, `afastamento máximo ${(peak * 180 / Math.PI).toFixed(0)}°`);
    await page.mouse.move(40, 700);
    const left = Date.now();
    const joined = await page.waitForFunction(() => { const s = window.__mwMateria.state; return Math.abs(s.split) < 0.01 && Math.abs(s.pull) < 0.02; }, null, { timeout: 5000, polling: 50 }).then(() => true).catch(() => false);
    check("ao soltar, os dois perfis voltam a se encaixar", joined, joined ? `em ${((Date.now() - left) / 1000).toFixed(1)} s` : "ainda separados depois de 5 s");
  }
  await talk(page);
  check("texto e microfone disponíveis desde o primeiro momento", (await page.locator("#os-materia-input").isVisible()) && (await page.locator(".os-materia-panel__mic").isVisible()) && (await page.locator(".os-materia-panel__send").isVisible()));
  check("a conversa abre com a pose do cérebro", (await page.locator(".os-materia").getAttribute("data-pose")) === "brain");
  if (alive) {
    await page.waitForTimeout(700);
    const mid = await page.evaluate(() => window.__mwMateria.state.morph);
    await page.waitForTimeout(2200);
    const end = await page.evaluate(() => window.__mwMateria.state.morph);
    check("ver o pensamento: as moléculas se reorganizam em cérebro (transição visível, depois completa)", mid > 0.05 && mid < 0.95 && end > 0.99, `meio ${mid.toFixed(2)} → fim ${end.toFixed(2)}`);
  }
  await page.locator(".os-materia-panel").press("Escape");
  await page.waitForTimeout(alive ? 2400 : 300);
  const back = alive ? await page.evaluate(() => window.__mwMateria.state.morph) : 0;
  check("fechar a conversa recompõe a escultura", (await page.locator(".os-materia").getAttribute("data-pose")) === "bust" && back < 0.01, `metamorfose ${back.toFixed(2)}`);
  check("sem erros de console", errors.length === 0, errors.slice(0, 2).join(" | "));
  await ctx.close();
}

// ───────────────────────── recrutamento
if (ONLY.includes("recruiter")) {
  console.log("\n— recrutamento (português)");
  const { ctx, page, errors } = await open("/");
  await talk(page);
  const r1 = await say(page, "Sou recrutador");
  check("“Sou recrutador” apresenta em uma frase o que o Rick faz", /engenheiro de software full-stack/i.test(r1) && r1.split(/(?<=[.!?])\s/).length <= 2, r1.slice(0, 90));
  check("…e abre o Perfil", await pathIs(page, /\/perfil$/));
  await reopen(page);
  await say(page, "Quero seu currículo em PDF");
  const pdfUrl = (await page.evaluate(() => window.__opened)).at(-1) ?? "";
  check("“Quero seu currículo em PDF” leva direto ao arquivo real", /^\/cv\/rick-januario.*\.pdf$/.test(pdfUrl), pdfUrl || "nada foi aberto");
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
  check("sem erros de console", errors.length === 0, errors.slice(0, 2).join(" | "));
  await ctx.close();

  console.log("\n— recrutamento (inglês e espanhol)");
  const en = await open("/en", { locale: "en-US" });
  await talk(en.page);
  const r4 = await say(en.page, "I’m hiring a full-stack engineer. Can I see Rick’s résumé?");
  const pdf2 = (await en.page.evaluate(() => window.__opened)).at(-1) ?? "";
  check("“I’m hiring a full-stack engineer. Can I see Rick’s résumé?” abre o currículo e responde em inglês", /\.pdf$/.test(pdf2) && /résumé/i.test(r4) && /senior full-stack/i.test(r4), `${pdf2} · ${r4.slice(0, 60)}`);
  await en.ctx.close();
  const es = await open("/es", { locale: "es-ES" });
  await talk(es.page);
  const r5 = await say(es.page, "Soy reclutador");
  check("espanhol: “Soy reclutador” responde em espanhol e abre o Perfil", /ingeniero de software/i.test(r5) && (await pathIs(es.page, /\/es\/perfil$/)), r5.slice(0, 70));
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
  check("entende a frase com erro de digitação e escolhe a ALVA Odontologia", /ALVA Odontologia/.test(r1));
  check("identifica a referência como demonstração para odontologia", /demonstração/i.test(r1) && /odontologia/i.test(r1) && /não um trabalho para cliente/i.test(r1));
  check("explica o que se adapta para psicologia a partir do que está visível", /psicologia/i.test(r1) && /agendar pelo WhatsApp/i.test(r1));
  check("faz uma pergunta que muda a proposta", /abordagem ou facilitar o primeiro agendamento\?$/.test(r1.trim()), r1.trim().slice(-70));
  check("atravessar o portfólio: termina na página navegável do case, com a URL normal", await pathIs(page, /\/projetos\/alva-odontologia$/, 8000));
  await page.waitForSelector('.os-window[data-app="projects"]', { state: "visible", timeout: 8000 });
  await page.waitForTimeout(1500);
  check("…com o case real aberto na janela e sem resto da travessia na tela", (await page.locator('.os-window[data-app="projects"]').innerText()).includes("ALVA") && (await page.locator(".os-materia-shard").count()) === 0);
  if (alive) check("a capa do projeto está refletida na prata", (await page.evaluate(() => window.__mwMateria.state.tint)) > 0.8);
  await reopen(page);
  const r2 = await say(page, "agendamento");
  check("“agendamento” continua desse ponto", /começa pelo agendamento/i.test(r2) && /o Rick confirma na proposta/i.test(r2), r2.slice(0, 70));
  const r3 = await say(page, "gostei desse, quanto custa?");
  check("“gostei desse, quanto custa?” sabe qual projeto está aberto", /ALVA Odontologia é a referência/.test(r3));
  check("explica o processo real e não inventa valor", /orçamento é gratuito/i.test(r3) && /entrada e entrega/i.test(r3) && !MONEY.test(r3), r3.slice(0, 60));
  check("…e leva ao pedido de proposta do Hire Rick", await pathIs(page, /\/contato$/, 8000));
  await page.waitForSelector('[class*="project-guide_guide__"] textarea[readonly]', { timeout: 8000 });
  const req = await page.evaluate(() => {
    const root = document.querySelector('[class*="project-guide_guide__"]');
    const links = [...root.querySelectorAll('[class*="project-guide_actions__"] a')].map((a) => a.href);
    const mail = links.find((h) => h.startsWith("mailto:"));
    return { notes: root.querySelector("textarea:not([readonly])").value, preview: root.querySelector("textarea[readonly]").value, body: mail ? decodeURIComponent(mail.split("body=")[1]) : "" };
  });
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
  check("“Mostre algo de turismo” recomenda o Mabrouk Zanzibar como trabalho para cliente", /Mabrouk Zanzibar/.test(t1) && /trabalho para cliente/i.test(t1));
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
  await page.waitForSelector('[class*="project-guide_guide__"] textarea[readonly]', { timeout: 8000 });
  check("o pedido traz essa referência", (await page.locator('[class*="project-guide_guide__"] textarea[readonly]').inputValue()).includes(other));
  await reopen(page);
  const t4 = await say(page, "quero uma landing page");
  check("“quero uma landing page” responde outra coisa: Kavita Drones", /Kavita Drones/.test(t4) && t4 !== t1 && (await pathIs(page, /\/projetos\/kavita-drones$/, 8000)));
  await page.waitForTimeout(1500);
  await reopen(page);
  const t5 = await say(page, "como o Rick trabalha?");
  check("“como o Rick trabalha?” descreve o processo real e abre o Estúdio", /contrato/i.test(t5) && /seis etapas/i.test(t5) && (await pathIs(page, /\/(estudio|studio)$/, 8000)), t5.slice(0, 70));
  await reopen(page);
  const t6 = await say(page, "quero um site");
  check("falta informação decisiva → uma pergunta curta", t6.trim().endsWith("?") && t6.length < 60 && (await chips(page)).length >= 4, t6);
  const t7 = await say(page, "Dá para integrar com o sistema TideDesk?");
  check("pergunta sobre integração não é prometida: fica guardada para o Rick", /só o Rick responde/i.test(t7));
  check("sem erros de console", errors.length === 0, errors.slice(0, 2).join(" | "));
  await ctx.close();
}

// ───────────────────────── os mesmos percursos em inglês e em espanhol; a Matéria a um toque dentro de um case
if (ONLY.includes("languages")) {
  const SETS = {
    en: {
      home: "/en", locale: "en-US", profile: /\/en\/profile$/, work: (s) => new RegExp(`/en/work/${s}$`), contact: /\/en\/contact$/, studio: /\/en\/studio$/,
      recruiter: ["I'm a recruiter", /senior full-stack software engineer/i], cv: "Can I get your résumé as a PDF?", backend: ["Do you have backend experience?", /Backend & APIs/i],
      client: ["I'm a psychologist and I want a website for my practice", /ALVA Odontologia/, /demonstration/i, /not client work/i], answer: ["booking", /starts with booking/i],
      price: ["I like this one, how much does it cost?", /The quote is free/i, /Question: I like this one, how much does it cost\?/],
      tour: ["Show me something for tourism", /Mabrouk Zanzibar/], another: ["show me another", /Another reference: /], like: "I want something like this", landing: ["I want a landing page", /Kavita Drones/], how: ["How does Rick work?", /six stages/i],
    },
    es: {
      home: "/es", locale: "es-ES", profile: /\/es\/perfil$/, work: (s) => new RegExp(`/es/proyectos/${s}$`), contact: /\/es\/contacto$/, studio: /\/es\/estudio$/,
      recruiter: ["Soy reclutador", /ingeniero de software full-stack sénior/i], cv: "Quiero tu currículum en PDF", backend: ["¿Tienes experiencia con backend?", /Backend y APIs/i],
      client: ["Soy psicóloga y quiero un sitio para mi consulta", /ALVA Odontologia/, /demostración/i, /no un trabajo para cliente/i], answer: ["la cita", /empieza por la cita/i],
      price: ["Me gustó este, ¿cuánto cuesta?", /La cotización es gratuita/i, /Duda: Me gustó este, ¿cuánto cuesta\?/],
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
    await page.locator(".os-materia-panel__icon").first().click(); // recomeçar: outra pessoa, outra conversa
    await page.waitForTimeout(300);
    const c = await say(page, S.client[0]);
    check(`“${S.client[0]}” → ALVA, identificada como demonstração`, S.client.slice(1).every((rx) => rx.test(c)) && (await pathIs(page, S.work("alva-odontologia"), 8000)), c.slice(0, 70));
    await page.waitForTimeout(1500);
    await reopen(page);
    const d = await say(page, S.answer[0]);
    check(`“${S.answer[0]}” continua desse ponto`, S.answer[1].test(d), d.slice(0, 60));
    const e = await say(page, S.price[0]);
    check(`“${S.price[0]}” explica o processo sem valor e abre o pedido`, S.price[1].test(e) && !MONEY.test(e) && (await pathIs(page, S.contact, 8000)));
    await page.waitForSelector('[class*="project-guide_guide__"] textarea[readonly]', { timeout: 8000 });
    const notes = await page.locator('[class*="project-guide_guide__"] textarea:not([readonly])').inputValue();
    check("o pedido leva o que a pessoa contou e a dúvida, no idioma dela", notes.includes(S.client[0]) && S.price[2].test(notes), notes.replace(/\n/g, " | "));
    await reopen(page);
    await page.locator(".os-materia-panel__icon").first().click();
    await page.waitForTimeout(300);
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
  check("ela sabe qual projeto está aberto, mesmo sem tê-lo recomendado", /TERRAL é a referência/.test(r) && (await pathIs(page, /\/contato$/, 8000)), r.slice(0, 90));
  await page.waitForSelector('[class*="project-guide_guide__"] textarea[readonly]', { timeout: 8000 });
  check("o pedido sai com esse projeto como referência", /Referência: TERRAL/.test(await page.locator('[class*="project-guide_guide__"] textarea[readonly]').inputValue()));
  await reopen(page);
  await page.locator('.os-materia-panel__icon[aria-label="Fechar a conversa"]').click();
  await page.waitForTimeout(400);
  check("fechar devolve o foco a quem abre a conversa", await page.evaluate(() => document.activeElement?.classList.contains("os-materia-bubble") || document.activeElement?.classList.contains("os-materia-talk")));
  check("sem erros de console", errors.length === 0, errors.slice(0, 2).join(" | "));
  await ctx.close();
}

// ───────────────────────── voz (SIMULADA) e microfone negado
const FAKE_SPEECH = (mode) => `
  window.__speech = { started: 0, aborted: 0, spoken: [], cancelled: 0 };
  class FakeRecognition {
    start() {
      window.__speech.started++;
      window.__speech.lang = this.lang;
      if (${JSON.stringify(mode)} === "denied") return void setTimeout(() => { this.onerror && this.onerror({ error: "not-allowed" }); this.onend && this.onend(); }, 60);
      if (${JSON.stringify(mode)} === "hold") return;
      setTimeout(() => this.onresult && this.onresult({ resultIndex: 0, results: [{ isFinal: false, 0: { transcript: "sou recru" } }] }), 150);
      setTimeout(() => { this.onresult && this.onresult({ resultIndex: 0, results: [{ isFinal: true, 0: { transcript: "sou recrutador" } }] }); this.onend && this.onend(); }, 700);
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

// ───────────────────────── movimento reduzido: poses estáticas e destino direto
if (ONLY.includes("reduced")) {
  console.log("\n— movimento reduzido");
  const { ctx, page, errors } = await open("/", { reduced: true });
  await page.waitForTimeout(1500);
  const bg = () => page.evaluate(() => getComputedStyle(document.querySelector(".os-materia .os-scene__still")).backgroundImage);
  check("a escultura fica na imagem estática (sem motor)", (await page.locator(".os-materia").getAttribute("data-state")) === "still" && /materia-dark\.webp/.test(await bg()));
  const img = await ctx.request.get(`${BASE}/art/materia-dark.webp`);
  const img2 = await ctx.request.get(`${BASE}/art/materia-brain-light.webp`);
  check("as imagens estáticas existem (busto e cérebro)", img.ok() && img2.ok(), `${img.status()} / ${img2.status()}`);
  await talk(page);
  check("na conversa, a pose estática do cérebro", /materia-brain-dark\.webp/.test(await bg()));
  const t0 = Date.now();
  const r = await say(page, "Mostre algo de turismo");
  const ok = await pathIs(page, /\/projetos\/mabrouk-zanzibar$/, 3000);
  check("o destino abre direto, sem travessia", ok && /Mabrouk/.test(r) && (await page.locator(".os-materia-shard").count()) === 0, `${Date.now() - t0} ms`);
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
  const grid = await box(".os-launcher__apps");
  check("o botão da conversa aparece inteiro, acima da grade de apps, com alvo ≥ 44 px", pill && grid && pill.x >= 0 && pill.x + pill.width <= 390 && pill.y + pill.height <= grid.y + 2 && pill.height >= 44, pill && `${Math.round(pill.width)}×${Math.round(pill.height)} em y ${Math.round(pill.y)}`);
  if (alive) {
    // arraste curto sobre a escultura: dobra o tempo sem abrir a conversa e sem rolar a página
    const hit = await box(".os-materia-hit");
    const cx = hit.x + hit.width / 2, cy = hit.y + hit.height / 2;
    const cdp = await ctx.newCDPSession(page);
    const touch = (type, x) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y: cy }] });
    await touch("touchStart", cx - 60);
    let peak = 0;
    for (let i = 0; i <= 12; i++) { await touch("touchMove", cx - 60 + i * 12); await page.waitForTimeout(22); peak = Math.max(peak, Math.abs(await page.evaluate(() => window.__mwMateria.state.split))); }
    await page.waitForTimeout(120);
    peak = Math.max(peak, Math.abs(await page.evaluate(() => window.__mwMateria.state.split)));
    await touch("touchEnd", 0);
    await page.waitForTimeout(300);
    check("arraste curto sobre a escultura dobra o tempo e não abre a conversa", peak > 0.15 && (await page.locator(".os-materia-panel").count()) === 0, `afastamento ${(peak * 180 / Math.PI).toFixed(0)}°`);
    check("a figura deixa a rolagem vertical passar (touch-action: pan-y)", (await page.locator(".os-materia-hit").evaluate((el) => getComputedStyle(el).touchAction)) === "pan-y");
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
  await page.evaluate(() => {
    const vv = window.visualViewport;
    Object.defineProperty(vv, "height", { value: 480, configurable: true });
    vv.dispatchEvent(new Event("resize"));
  });
  await page.waitForTimeout(200);
  const kb = await page.evaluate(() => {
    const r = (s) => document.querySelector(s).getBoundingClientRect();
    return { panelTop: r(".os-materia-panel").top, sendBottom: r(".os-materia-panel__send").bottom, inputBottom: r("#os-materia-input").bottom };
  });
  check("com o teclado aberto (janela visual de 480 px, simulada), campo e enviar ficam acima dele", kb.sendBottom <= 480 && kb.inputBottom <= 480 && kb.panelTop >= 0, JSON.stringify(kb));
  await page.evaluate(() => { const vv = window.visualViewport; delete vv.height; vv.dispatchEvent(new Event("resize")); });
  const r = await say(page, "Show me something for tourism");
  check("a resposta vem em inglês e o case abre em tela cheia", /Mabrouk Zanzibar/.test(r) && /client work/i.test(r) && (await pathIs(page, /\/en\/work\/mabrouk-zanzibar$/, 8000)));
  await page.waitForTimeout(1600);
  check("a conversa vira uma pílula sobre o case", (await page.locator(".os-materia-bubble").isVisible()) && (await page.locator(".os-materia-panel").count()) === 0);
  await page.locator(".os-materia-bubble").tap();
  await page.waitForSelector(".os-materia-panel", { state: "visible" });
  check("tocar na pílula recupera a conversa", (await replies(page)).some((t) => /Mabrouk/.test(t)));
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
