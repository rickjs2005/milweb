import { COMPANY, FIELD_CUES, PREMISES, SECTOR_CUES, normalize, type FieldId, type SectorId } from "@/data/materia-lexicon";
import type { OsPayload, OsProject } from "../types";
import type { GuideAction, GuideCtx } from "./guide-store";

export { normalize } from "@/data/materia-lexicon";

/**
 * O raciocínio da Matéria: uma função pura, sem rede e sem chave paga. Lê o que a pessoa escreveu
 * (português, inglês ou espanhol, com tolerância a erro de digitação), o que já sabe dela (`ctx`) e
 * o portfólio (`payload`), e devolve a resposta, as ações oferecidas e a ação que roda sozinha.
 *
 * A frase é lida inteira (`read`): o ramo ("dive shop"), o que o visitante quer que o cliente dele
 * faça ("scuba bookings", "sell … online") e o que está à venda pesam juntos. "Loja" sozinho é sinal
 * fraco: uma operadora de mergulho que quer reservas não é uma loja virtual. Com duas leituras
 * plausíveis, a Matéria faz uma pergunta curta em vez de escolher. Dentro do setor, a referência sai
 * do que os cases publicam (`payload.materia.cases`).
 *
 * Só responde com o que o portfólio publica. As ações são sempre de um conjunto fechado (app,
 * projeto do catálogo, arquivo cadastrado, prévia, pedido de proposta): quem executa confere de novo
 * (guide-panel.tsx). O que depende do projeto do visitante vira pergunta guardada para o Rick.
 */
export type Reply = { text: string; actions: GuideAction[]; ctx: GuideCtx; card?: string; run?: GuideAction; /** Prévia a preparar (apps/idea): a escultura abre o recorte, ou a janela abre direto. */ idea?: { kind: "dive" | "practice"; priority: string | null } };
/** `live`: a escultura está viva e à vista — a ideia pode aparecer dentro dela. */
export type Here = { project: string | null; live?: boolean };

function distance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 3;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = row;
  }
  return prev[b.length];
}
/** Alguma palavra do texto é uma das `words`, aceitando uma letra trocada (duas, em palavras longas). */
function near(tokens: string[], words: string[]): boolean {
  return tokens.some((t) => t.length >= 3 && words.some((w) => t === w || (w.length >= 4 && Math.abs(t.length - w.length) <= 2 && distance(t, w) <= (w.length >= 9 ? 2 : 1))));
}

const RX = {
  cv: /\b(curriculo|curriculum|cv|resume|pdf|hoja de vida)\b/,
  recruiter: /\b(recrut\w*|recruit\w*|reclut\w*|hiring|headhunter\w*|rh|talent\w*|vagas?|contratando|tech lead|engineering manager|seleccion de personal|full time|tempo integral|clt|job opening|open position|open role|emprego|puesto de trabajo)\b/,
  skillAsk: /\b(experiencia\w*|experience\w*|sabe|conhece|trabalha com|trabalhou com|worked with|works with|knows?|skills?|competenc\w*|habilidad\w*|stack|tecnolog\w*|technolog\w*|domina)\b/,
  backend: /\b(backend|back end|apis?|servidor\w*|servers?|banco de dados|database\w*|python|django|fastapi|node|nodejs|filas|queues|microservic\w*|postgres\w*|sql)\b/,
  ai: /\b(ia|ai|llms?|agentes?|agents?|inteligencia artificial|artificial intelligence|machine learning|automac\w*|automat\w*)\b/,
  motion: /\b(frontend|front end|interfaces?|motion|animac\w*|animat\w*|webgl|react|next|nextjs|three|gsap|ux|ui)\b/,
  /** Pergunta de preço. Pedir um orçamento ("quero um orçamento") é escolher a proposta: ver `quote` + `want`. */
  price: /\b(quanto custa\w*|quanto (fica|sai|e|seria)|custa|custam|custaria|custo|custos|preco\w*|valor|valores|how much|costs?|pric\w*|cuanto cuesta\w*|cuanto (sale|seria)|cuesta|cuestan|costaria|precio\w*)\b/,
  quote: /\b(orcamento\w*|quotes?|budget|presupuesto\w*|cotiza\w*)\b/,
  want: /\b(quero|queria|queremos|preciso|precisamos|gostaria|pedir|solicitar|fazer|i want|we want|i d like|i would like|i need|we need|can i get|request|get a|quiero|queremos|necesito|quisiera|pedir|solicitar)\b/,
  time: /\b(prazo\w*|quanto tempo|demora\w*|how long|timeline\w*|deadline\w*|cuanto tard\w*|plazo\w*|cuanto tiempo)\b/,
  another: /\b(outro|outra|outros|mais um|mais uma|another|other one|something else|different one|otro|otra|mas opciones|mais opcoes|more options)\b/,
  like: /\b(algo assim|assim|gostei|adorei|quero esse|quero este|quero isso|something like (this|that)|like this|like that|i like|love it|algo asi|me gusta|me gusto|quiero ese|quiero este)\b/,
  brief: /\b(proposta\w*|pedido|contratar|hire|proposal\w*|propuesta\w*|solicitud\w*|montar|monta|monte|build the request|start a project|comecar um projeto)\b/,
  /** A frase fala de quem escreve: é o que vale levar para o pedido. */
  personal: /\b(sou|somos|tenho|temos|quero|queremos|preciso|precisamos|minha|meu|nossa|nosso|i am|i m|we are|we re|i have|we have|i want|we want|i need|we need|i run|we run|i own|my|our|soy|tengo|tenemos|quiero|necesito|necesitamos|mi|nuestra|nuestro)\b/,
  yes: /^(sim|claro|pode|pode sim|quero|quero sim|quero ver|isso|yes|yeah|yep|sure|ok|okay|please|yes please|show me|si|claro que si|dale|vamos|bora|monta|manda|mostra|por favor)\b/,
  no: /^(nao|agora nao|depois|ainda nao|no|not now|later|not yet|nope|ahora no|despues|todavia no)\b/,
  how: /\b(como (o rick |voce |voces |ele )?trabalh\w*|processo\w*|etapas|como funciona|how does (rick|he) work|how do you work|process|workflow|como trabaja\w*|proceso\w*)\b/,
  who: /\b(quem e (o )?rick|quem e voce|who is rick|who are you|quien es rick|quien eres|sobre o rick|about rick)\b/,
  projects: /\b(projetos?|portfolio|portafolio|trabalhos|cases?|projects?|your work|proyectos?)\b/,
  services: /\b(servicos?|services?|servicios?|o que voce faz|o que voces fazem|what do you do|que haces)\b/,
  contact: /\b(contato|contacto|contact|falar com o rick|talk to rick|hablar con rick|whatsapp|e ?mail|telefone)\b/,
  site: /\b(sites?|websites?|web site|sitios?|paginas?|page)\b/,
  show: /^(mostr|show|muestr|tem algo|have anything|tienes algo)/,
  thanks: /^(obrigad\w*|valeu|thanks?|thank you|gracias|tchau|bye|adios|ate mais)\b/,
  hello: /^(oi|ola|hello|hi|hey|hola|bom dia|boa tarde|boa noite|good morning|buenos dias|e ai)\b/,
  /** Ligar o projeto a uma ferramenta de terceiros é escopo: nunca se promete, vai para o Rick. */
  integrate: /\b(integr\w*|sincroniz\w*|sync\w*|conect\w*|connect\w*|compativ\w*|compatib\w*|webhooks?|funciona com|works with)\b/,
  idea: /\b(ver uma ideia|uma ideia para|ideia para (o )?(meu|nosso) site|see an idea|an idea for|idea for (my|our) (web ?)?site|ver una idea|una idea para|idea para (mi|nuestro) sitio|previas?|preview|vista previa|abrir a ideia|open the idea|abrir la idea)\b/,
  why: /\b(por ?que (este|esse|essa|esta) (exemplo|projeto|referencia)|why this (example|one|project|reference)|por ?que (este|ese|esta|esa) (ejemplo|proyecto|referencia))\b/,
};
/** O que o visitante quer que o cliente dele faça no site. */
const GOAL = {
  booking: /\b(agend\w*|reserv\w*|bookings?|book|schedul\w*|appointment\w*|citas?|marcar (uma |a )?(consulta|horario|hora)|marcacao)\b/,
  /** Vender pela internet, com os termos de loja virtual. */
  sell: /\b(vend\w+ .{0,40}?(online|pela internet|na internet|en linea|por internet)|sell\w* .{0,40}?online|comprar online|buy online|e ?commerce|lojas? (virtual|virtuais|online)|online (store|shop)s?|tiendas? (virtual|online|en linea)|checkout|carrinho|shopping cart)\b/,
  sellVerb: /\b(vendo|vende|vendemos|vender|vendas|sell|sells|selling|vendes)\b/,
  manage: /\b(gerenci\w*|controlar|controle de|organizar|manage|track|gestion\w*|administr\w*)\b/,
};
/** O que se vende é uma experiência com data marcada: "vender passeios online" é reserva, não vitrine. */
const SERVICE_NOUN = /\b(tours?|passeios?|viagens?|trips?|pacotes?|packages?|excurs\w*|dives|mergulhos|sessoes|sessions|sesiones|consultas|ingressos|tickets|entradas|experienc\w*|hospedag\w*|diarias|transfers?|inmersiones)\b/;
const SERVICE_SECTORS: SectorId[] = ["tourism", "health", "food"];
const OPTION: Record<string, RegExp> = {
  booking: /\b(agend\w*|marcar|marcacao|consulta\w*|booking\w*|schedul\w*|appointment\w*|book|citas?|reserv\w*|primeiro contato|first contact|primer contacto|contato)\b/,
  approach: /\b(abordagem|explicar|explica\w*|approach|explain\w*|enfoque|metodo\w*|method\w*|linha|destac\w*|highlight\w*|como trabalh\w*|how (i|you) work|como trabaj\w*)\b/,
  fixed: /\b(fixos?|fixas?|fixed|fijos?|poucos|few|pacotes?|packages?|paquetes?)\b/,
  custom: /\b(sob medida|medida|personaliz\w*|custom\w*|tailor\w*|a medida|roteiro\w*|itinerar\w*)\b/,
  ads: /\b(anuncio\w*|ads?|trafego|traffic|campanha\w*|campaign\w*|publicidad|trafico)\b/,
  product: /\b(produto\w*|products?|productos?|marca|brand|apresentar|present\w*)\b/,
  checkout: /\b(pagamento\w*|checkout|cartao|pix|payment\w*|cards?|pago\w*|tarjeta\w*|no site|on the site|en el sitio)\b/,
  whatsapp: /\b(whatsapp|zap|mensagem|message|mensaje)\b/,
  present: /\b(apresentar|apresenta\w*|introduc\w*|present\w*|institucional)\b/,
  quotes: /\b(orcamento\w*|quotes?|cotiza\w*|presupuesto\w*|pedidos?|leads?|vender|sell)\b/,
};
/** Palavras de quem escreve, não do negócio: não contam para achar o case mais próximo. */
const FILLER = new Set("algo algum alguma alguns para pelo pela meu minha meus nossa nosso quero queria queremos preciso precisamos tenho temos mostre mostra mostrar show something need want have with that this these those site sites sitio sitios website pagina paginas page como sobre about mais muito online novo nova make fazer criar create build negocio negocios business cliente clientes customers clients customer client vender vendo sell loja lojas shop store tienda quanto custa cuanto much does would could should seria gostaria also from into your their voce voces usted ustedes saber know para onde quando where when what which esto este esta esse essa isso aqui there here just only tambem muito pouco hacer tener querer necesito tengo quiero mostrar muestrame algo".split(" "));

const fill = (text: string, values: Record<string, string>) => text.replace(/\{(\w+)\}/g, (_, k: string) => values[k] ?? "");
const push = (list: string[], item: string) => (item && !list.includes(item) ? [...list, item] : list);
const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
/** "Separei a ALVA…" depois de uma oração de abertura ("Como o agendamento é a prioridade, separei…"). */
const lower = (text: string) => (/^I\b/.test(text) ? text : text.charAt(0).toLowerCase() + text.slice(1));
const sentence = (text: string) => (/[.!?]$/.test(text.trim()) ? text.trim() : `${text.trim()}.`);

export type Reading = { sector: SectorId | null; /** Segunda leitura plausível: vira pergunta. */ alt: SectorId | null; field: FieldId | null; goal: "booking" | "sell" | "manage" | null; score: Partial<Record<SectorId, number>>; /** A frase disse o ramo; sem isso o setor veio só do objetivo ("vendo…", "quero agendamento") e o case mais parecido decide. */ named: boolean };

/**
 * Lê a frase inteira e pesa os sinais. Ramo citado: 3. Reservas e agendamentos reforçam o ramo de
 * serviço (+4; sem ramo nenhum, valem como serviço com hora marcada). Vender pela internet: +5 para
 * loja, a não ser que o que se vende seja uma experiência. "Loja"/"shop" sozinho: 2.
 */
export function read(text: string, tokens: string[]): Reading {
  const score: Partial<Record<SectorId, number>> = {};
  for (const s of SECTOR_CUES) if (s.test.test(text) || near(tokens, s.words)) score[s.id] = 3;
  const field = FIELD_CUES.find((f) => f.test.test(text) || near(tokens, f.words)) ?? null;
  if (field) score[field.sector] = Math.max(score[field.sector] ?? 0, 3);
  const said = new Set(Object.keys(score));

  const sellsOnline = GOAL.sell.test(text);
  const sells = sellsOnline || GOAL.sellVerb.test(text);
  const service = SERVICE_NOUN.test(text);
  const booking = GOAL.booking.test(text) || (sells && service);
  let goal: Reading["goal"] = null;
  if (booking) {
    goal = "booking";
    const present = SERVICE_SECTORS.filter((id) => score[id]);
    if (present.length) for (const id of present) score[id] = (score[id] ?? 0) + 4;
    else score.health = 4;
  }
  if (sells && !service) {
    goal = goal ?? "sell";
    score.store = Math.max(score.store ?? 0, 0) + (sellsOnline ? 5 : 3);
  } else if (PREMISES.test(text) && !score.store) score.store = 2;
  if (GOAL.manage.test(text)) {
    goal = goal ?? "manage";
    score.system = (score.system ?? 0) + 2;
  }
  // "Empresa" sem mais nada é um site institucional; ao lado de um ramo, é só o jeito de falar do negócio.
  if (COMPANY.test(text) && !Object.keys(score).length) score.company = 2;

  const format = (id: SectorId) => !!SECTOR_CUES.find((s) => s.id === id)?.format;
  const ranked = (Object.entries(score) as [SectorId, number][]).sort((a, b) => b[1] - a[1] || SECTOR_CUES.findIndex((s) => s.id === a[0]) - SECTOR_CUES.findIndex((s) => s.id === b[0]));
  let [top, second] = ranked;
  // Formato (landing, 3D) e ramo na mesma frase não disputam: o ramo escolhe a referência.
  if (top && second && format(top[0]) !== format(second[0]) && second[1] >= 3 && top[1] - second[1] <= 1) {
    if (format(top[0])) [top, second] = [second, top];
    return { sector: top[0], alt: null, field: field && field.sector === top[0] ? field.id : null, goal, score, named: said.has(top[0]) };
  }
  const alt = top && second && top[1] - second[1] <= 1 && second[1] >= 2 ? second[0] : null;
  return { sector: top?.[0] ?? null, alt, field: field && (field.sector === top?.[0] || field.sector === alt) ? field.id : null, goal, score, named: !!top && said.has(top[0]) };
}

const indexCache = new Map<string, [string[], string[]]>();
/**
 * Quanto a frase do visitante se parece com o que o case publica. O índice vem como "fortes|fracas"
 * (data/materia.ts › buildCaseIndex): palavra do título ou da frase do case vale 2, do problema vale 1.
 * Casa palavra igual, ou o mesmo começo em palavras longas ("reserva" e "reservas").
 */
function overlap(tokens: string[], index: string | undefined): number {
  if (!index) return 0;
  let sets = indexCache.get(index);
  if (!sets) {
    const [head = "", body = ""] = index.split("|");
    indexCache.set(index, (sets = [head.split(" ").filter(Boolean), body.split(" ").filter(Boolean)]));
  }
  const same = (w: string, t: string) => w === t || (t.length >= 5 && w.length >= 5 && (w.startsWith(t.slice(0, Math.max(5, t.length - 2))) || t.startsWith(w.slice(0, Math.max(5, w.length - 2)))));
  let score = 0;
  for (const t of tokens) {
    if (t.length < 4 || FILLER.has(t)) continue;
    if (sets[0].some((w) => same(w, t))) score += 2;
    else if (sets[1].some((w) => same(w, t))) score += 1;
  }
  return score;
}

export function respond(input: string, ctx: GuideCtx, payload: OsPayload, here: Here): Reply {
  const M = payload.materia;
  const raw = input.trim().replace(/\s+/g, " ").slice(0, 400);
  const text = normalize(raw);
  const tokens = text.split(" ").filter(Boolean);
  const catalog = [...payload.projects, ...payload.authorial];
  const find = (slug: string | null | undefined) => (slug ? catalog.find((p) => p.slug === slug) : undefined);
  const kindOf = (kind: "client" | "demo" | "study") => M.ui[kind];
  const current = find(here.project) ?? find(ctx.project);

  const say = (label: string, send = label): GuideAction => ({ kind: "say", text: send, label });
  const openProject = (slug: string): GuideAction => ({ kind: "project", slug, label: M.ui.openProject });
  const brief: GuideAction = { kind: "brief", label: M.ui.brief };
  const cv: GuideAction = { kind: "file", href: payload.profile.cv.href, label: M.ui.cv };
  const profile: GuideAction = { kind: "app", app: "profile", label: M.ui.profile };
  const ideaChip = say(M.ui.idea);
  const whyChip = say(M.ui.why);
  const starters = [say(M.say.chipRecruiter), say(M.say.chipSite), say(M.say.chipTour), say(M.say.chipHow)];

  const has = (rx: RegExp) => rx.test(text);
  /** O que a pessoa contou sobre si entra no pedido; um comando ("mostre algo de turismo") não. */
  const told = (list: string[]) => (tokens.length >= 2 && RX.personal.test(text) ? push(list, raw) : list);
  const wantsSite = has(RX.site) || near(tokens, ["site", "website", "sitio", "pagina"]);
  const sectorOf = (key: string) => key.split("/")[0] as SectorId;
  const fieldOf = (key: string) => (key.split("/")[1] as FieldId | undefined) ?? null;
  const wantOf = (key: string) => (fieldOf(key) ? M.fields[fieldOf(key)!].want : null) ?? M.sectors[sectorOf(key)].want;

  if (!text) return { text: M.say.hello, actions: starters, ctx };

  // ── como a frase se lê; a resposta a uma pergunta de desempate decide entre as duas leituras
  let R = read(text, tokens);
  if (ctx.asked === "which" && ctx.options.length === 2) {
    const exact = ctx.options.find((key) => normalize(wantOf(key)) === text);
    const byScore = [...ctx.options].sort((a, b) => (R.score[sectorOf(b)] ?? 0) - (R.score[sectorOf(a)] ?? 0));
    const lead = (R.score[sectorOf(byScore[0])] ?? 0) - (R.score[sectorOf(byScore[1])] ?? 0);
    const chosen = exact ?? (lead > 0 ? byScore[0] : null);
    if (chosen) R = { ...R, sector: sectorOf(chosen), alt: null, field: fieldOf(chosen), named: true };
  }
  const field = R.field ? M.fields[R.field] : null;

  /** O case do catálogo inteiro que mais se parece com a frase (pelo menos uma palavra do título ou da frase dele). */
  const closest = (): OsProject | undefined => {
    let best: OsProject | undefined;
    let top = 1;
    for (const p of catalog) {
      const s = overlap(tokens, M.cases[p.slug]);
      if (s > top) [best, top] = [p, s];
    }
    return best;
  };
  /**
   * A referência dentro do setor: a do ramo, a que mais se parece com a frase, ou a primeira ainda não mostrada.
   * Quando a frase não disse o ramo ("vendo drones"), o case mais parecido do catálogo inteiro vale mais que a ordem do setor.
   */
  const pickRef = (sector: SectorId, f: FieldId | null): OsProject | undefined => {
    const list = M.sectors[sector].refs.filter((slug) => find(slug));
    const hint = f ? M.fields[f].ref : null;
    let best: string | null = null;
    let top = 0;
    for (const slug of list) {
      const s = overlap(tokens, M.cases[slug]) + (slug === hint ? 4 : 0);
      if (s > top) [best, top] = [slug, s];
    }
    // …mas só quando esse objetivo é o único sinal: em "vendo máscaras de mergulho online" o mergulho perdeu para o
    // comércio, e o case de mergulho não pode voltar pela porta dos fundos.
    if (!best && !R.named && Object.keys(R.score).length === 1) {
      const near = closest();
      if (near) return near;
    }
    return find(best ?? list.find((slug) => !ctx.shown.includes(slug)) ?? list[0]);
  };
  const refText = (p: OsProject) => {
    const r = M.refs[p.slug];
    return { pick: r?.pick ?? fill(M.say.pickAny, { title: p.title, kind: kindOf(p.kind) }), why: r?.why ?? sentence(cap(p.tagline)) };
  };
  const detailOf = (p: OsProject) => {
    const r = M.refs[p.slug];
    const other = ctx.sector === "health" && ctx.field !== "psychology" ? r?.detailOther : null;
    return other ?? r?.detail ?? `${sentence(cap(p.tagline))} ${kindOf(p.kind)}`;
  };
  const priorityFact = (sector: SectorId, id: string) => `${M.say.briefPriority}: ${M.sectors[sector].options[id].fact}`;

  // ── recrutamento: o caminho curto — Perfil, currículo, evidência
  if (has(RX.cv)) {
    const recruiter = ctx.role === "recruiter" || has(RX.recruiter);
    return { text: fill(recruiter ? M.say.cvRecruiter : M.say.cv, { lang: payload.profile.cv.lang }), actions: [cv, profile, say(M.say.chipHow)], ctx: { ...ctx, role: recruiter ? "recruiter" : ctx.role, mode: null, asked: null }, run: cv };
  }
  const skill = has(RX.backend) ? "backend" : has(RX.ai) ? "ai" : has(RX.motion) ? "motion" : null;
  if (skill && (ctx.role === "recruiter" || has(RX.skillAsk) || has(RX.recruiter)) && !R.sector) {
    const shown = payload.profile.showcase.find((s) => s.key === skill);
    const proof = shown && payload.profile.projects.find((p) => p.slug === shown.project);
    if (shown && proof) {
      const code = proof.code[0];
      return {
        text: fill(M.say.skill, { label: shown.label, contribution: shown.contribution, project: proof.name, evidence: proof.evidence.code }),
        actions: [profile, ...(code ? [{ kind: "file", href: code.url, label: `${M.ui.code} · ${proof.name}` } as GuideAction] : []), cv],
        ctx: { ...ctx, role: "recruiter", mode: null, asked: null },
        run: profile,
      };
    }
  }
  if (has(RX.skillAsk) && (ctx.role === "recruiter" || has(RX.recruiter))) {
    for (const group of payload.profile.skills) {
      const item = group.items.find((it) => tokens.includes(normalize(it.name)) || normalize(it.name).split(" ").every((w) => tokens.includes(w)));
      if (item) return { text: fill(M.say.skillListed, { name: item.name, group: group.title }), actions: [profile, cv], ctx: { ...ctx, role: "recruiter", mode: null, asked: null }, run: profile };
    }
    return { text: M.say.skillUnknown, actions: [cv, profile], ctx: { ...ctx, role: "recruiter", mode: null, asked: null } };
  }
  if (has(RX.recruiter)) {
    return { text: M.say.recruiter, actions: [cv, say(M.say.chipBackend), { kind: "app", app: "projects", label: M.ui.projects }], ctx: { ...ctx, role: "recruiter", mode: null, asked: null }, run: profile };
  }

  // ── "por que este exemplo?": os detalhes que não cabem na primeira resposta
  if (has(RX.why)) {
    const p = find(ctx.project) ?? current;
    if (!p) return { text: M.say.whyNone, actions: starters.slice(1, 3), ctx: { ...ctx, asked: null } };
    const ideaReady = ctx.field && M.fields[ctx.field as FieldId]?.ref === p.slug;
    // A pergunta que a Matéria tinha feito continua de pé: as mesmas saídas voltam junto dos detalhes.
    const pending = ctx.asked === "sector" && ctx.sector ? Object.values(M.sectors[ctx.sector as SectorId].options).map((o) => say(o.label)) : [];
    return { text: detailOf(p), actions: [...pending, openProject(p.slug), ...(ideaReady && !pending.length ? [ideaChip] : []), say(M.ui.another), brief], ctx: { ...ctx, project: p.slug, asked: pending.length ? "sector" : ideaReady ? "idea" : null }, card: p.slug };
  }

  // ── a prévia: aparece dentro da escultura (ou abre direto, sem 3D ou com movimento reduzido)
  const presentIdea = (id: FieldId, base: GuideCtx): Reply => {
    const F = M.fields[id];
    const S = M.sectors[F.sector];
    const ref = find(F.ref);
    const priority = F.idea === "practice" ? (base.goal && S.options[base.goal] ? base.goal : null) : null;
    // Uma única pergunta, e só quando muda a direção visual: no consultório, abordagem ou agendamento.
    if (F.idea === "practice" && !priority) {
      return { text: F.ask ?? S.ask ?? "", actions: Object.values(S.options).map((o) => say(o.label)), ctx: { ...base, role: "client", mode: "idea", sector: F.sector, field: id, asked: "sector" } };
    }
    return {
      text: `${fill(here.live ? M.say.ideaPortal : M.say.ideaDirect, { idea: F.ideaLabel })} ${F.ideaNote}`,
      actions: [{ kind: "idea", label: M.ui.openIdea }, ...(ref ? [openProject(ref.slug)] : []), whyChip, brief],
      ctx: { ...base, role: "client", mode: null, asked: null, sector: F.sector, field: id, idea: F.idea, project: ref?.slug ?? base.project, shown: ref ? push(base.shown, ref.slug) : base.shown },
      card: ref?.slug,
      idea: { kind: F.idea, priority },
    };
  };
  /** Recomendação de um setor: uma referência, um motivo, uma pergunta. */
  const recommend = (sector: SectorId, f: FieldId | null, base: GuideCtx, prefix = ""): Reply | null => {
    const S = M.sectors[sector];
    const F = f ? M.fields[f] : null;
    const ref = pickRef(sector, f);
    if (!ref) return null;
    const { pick, why } = refText(ref);
    const options = Object.values(S.options);
    const withIdea = !!F && F.ref === ref.slug;
    const ask = (withIdea ? F.ask : null) ?? S.ask;
    const chips = withIdea && F.idea === "dive" ? [ideaChip] : ask === S.ask || F?.idea === "practice" ? options.map((o) => say(o.label)) : [];
    const asked = !ask ? null : withIdea && F.idea === "dive" ? "idea" : options.length || sector === "system" ? "sector" : null;
    return {
      text: [prefix, pick, why, ask].filter(Boolean).join(" "),
      actions: [...chips, whyChip, say(M.ui.another), say(M.ui.likeThis)],
      ctx: { ...base, role: base.role === "recruiter" ? base.role : "client", mode: null, sector, field: f, goal: null, options: [], project: ref.slug, shown: push(base.shown, ref.slug), asked, facts: told(base.facts) },
      card: ref.slug,
      run: openProject(ref.slug),
    };
  };
  /** Duas leituras plausíveis: uma pergunta curta, com as duas saídas à mão. */
  const whichOne = (base: GuideCtx): Reply => {
    const keys = [R.sector!, R.alt!].map((id) => (R.field && M.fields[R.field].sector === id ? `${id}/${R.field}` : id));
    return { text: fill(M.say.which, { a: wantOf(keys[0]), b: wantOf(keys[1]) }), actions: keys.map((key) => say(cap(wantOf(key)))), ctx: { ...base, role: "client", asked: "which", options: keys, facts: told(base.facts) } };
  };

  const asksIdea = has(RX.idea) || (ctx.asked === "idea" && tokens.length <= 4 && has(RX.yes));
  if (asksIdea) {
    const id = R.field ?? (ctx.field as FieldId | null);
    const facts = R.sector ? told(ctx.facts) : ctx.facts;
    if (R.alt) return whichOne({ ...ctx, mode: "idea" });
    if (id && M.fields[id]) return presentIdea(id, { ...ctx, facts, goal: R.goal === "booking" && M.fields[id].sector === "health" ? "booking" : ctx.goal });
    const known = R.sector ?? (ctx.sector as SectorId | null);
    if (known) {
      const again = find(ctx.project);
      const reply = R.sector || !again ? recommend(known, null, { ...ctx, facts }, M.say.ideaNone) : null;
      if (reply) return reply;
      return { text: `${M.say.ideaNone} ${M.say.closeBrief}`, actions: [brief, ...(again ? [openProject(again.slug)] : []), say(M.ui.another)], ctx: { ...ctx, mode: null, asked: "brief" }, card: again?.slug };
    }
    return { text: M.say.ideaAsk, actions: [say(M.say.chipDive), say(M.say.chipPsy)], ctx: { ...ctx, role: "client", mode: "idea", asked: "business" } };
  }
  // A pessoa pediu uma ideia e agora conta o negócio.
  if (ctx.mode === "idea" && ctx.asked !== "sector") {
    if (R.sector && R.alt) return whichOne(ctx);
    if (R.field && M.fields[R.field]) return presentIdea(R.field, { ...ctx, facts: told(ctx.facts), goal: R.goal === "booking" && M.fields[R.field].sector === "health" ? "booking" : OPTION.approach.test(text) && M.fields[R.field].sector === "health" ? "approach" : null });
    if (R.sector) {
      const reply = recommend(R.sector, null, ctx, M.say.ideaNone);
      if (reply) return reply;
    }
    if (!has(RX.price) && !has(RX.time) && !has(RX.how) && !has(RX.thanks) && !has(RX.no) && tokens.length >= 2) {
      const chips = [M.say.chipHealth, M.say.chipTourism, M.say.chipStore, M.say.chipCompany, M.say.chipSystem].map((label) => say(label));
      return { text: M.say.whichBusiness, actions: chips, ctx: { ...ctx, facts: told(ctx.facts) } };
    }
  }

  // ── quanto custa: o que está publicado. O pedido só abre quando a pessoa escolhe pedir a proposta.
  const briefCtx = (c: GuideCtx, question?: string): GuideCtx => ({ ...c, role: c.role ?? "client", mode: null, project: current?.slug ?? c.project, asked: null, questions: question ? push(c.questions, question) : c.questions });
  const wantsProposal = has(RX.quote) && has(RX.want) && !has(RX.price);
  if (has(RX.price) || (has(RX.quote) && !wantsProposal)) {
    // Preço junto de quem a pessoa é e do que ela quer: responde o preço, reconhece o objetivo e oferece a referência.
    if (R.sector && !R.alt) {
      const S = M.sectors[R.sector];
      const ref = pickRef(R.sector, R.field);
      if (ref) {
        const { pick, why } = refText(ref);
        const option = R.goal === "booking" && S.options.booking ? "booking" : R.sector === "health" && OPTION.approach.test(text) ? "approach" : null;
        const lead = R.goal === "booking" ? (R.sector === "health" ? M.say.leadBooking : M.say.leadReservation) : "";
        const withIdea = !!field && field.ref === ref.slug;
        const facts = option ? push(told(ctx.facts), priorityFact(R.sector, option)) : told(ctx.facts);
        return {
          text: [M.say.priceShort, lead ? lead + lower(pick) : pick, why, withIdea ? M.say.ideaOffer : M.say.priceAsk].join(" "),
          actions: [...(withIdea ? [ideaChip] : []), brief, openProject(ref.slug), whyChip],
          ctx: { ...ctx, role: "client", mode: null, sector: R.sector, field: R.field, goal: option, options: [], project: ref.slug, shown: push(ctx.shown, ref.slug), asked: withIdea ? "idea" : "brief", facts, questions: push(ctx.questions, raw) },
          card: ref.slug,
        };
      }
    }
    return {
      text: `${fill(M.say.price, { price: payload.contact.guide.copy.priceA, project: current ? fill(M.say.priceProject, { title: current.title }) : "" }).trim()} ${M.say.priceAsk}`,
      actions: [brief, ...(current ? [openProject(current.slug)] : []), say(M.say.chipHow)],
      ctx: { ...briefCtx(ctx, raw), asked: "brief" },
    };
  }
  if (has(RX.time)) {
    const service = payload.services.items.find((s) => s.slug === (ctx.sector ? M.sectors[ctx.sector as SectorId]?.service : null));
    const answer = service?.faq.find((f) => f.timing)?.a ?? payload.contact.guide.copy.timeA;
    return { text: answer, actions: [brief, say(M.say.chipHow)], ctx: { ...ctx, asked: "brief", questions: push(ctx.questions, raw) } };
  }

  // ── integração com ferramenta de terceiros: guardada para o Rick, sem promessa
  if (has(RX.integrate)) return { text: M.say.forRick, actions: [brief, say(M.ui.another)], ctx: { ...ctx, asked: "brief", questions: push(ctx.questions, raw) } };

  // ── "me mostra outro"
  if (has(RX.another) && (ctx.sector || ctx.shown.length)) {
    const list = ctx.sector ? M.sectors[ctx.sector as SectorId]?.refs ?? [] : [];
    const pool = list.length ? list : catalog.filter((p) => p.kind !== "study").map((p) => p.slug);
    const next = find(pool.find((slug) => !ctx.shown.includes(slug) && slug !== here.project && find(slug)) ?? null);
    if (!next) return { text: M.say.noOther, actions: [brief, { kind: "app", app: "projects", label: M.ui.projects }], ctx: { ...ctx, asked: null } };
    return {
      text: fill(M.say.another, { title: next.title, tagline: next.tagline, kind: kindOf(next.kind) }),
      actions: [say(M.ui.another), say(M.ui.likeThis), openProject(next.slug)],
      ctx: { ...ctx, project: next.slug, shown: push(ctx.shown, next.slug), asked: null },
      card: next.slug,
      run: openProject(next.slug),
    };
  }

  // ── resposta a uma pergunta da Matéria
  if (ctx.asked === "sector" && ctx.sector) {
    const sector = ctx.sector as SectorId;
    const S = M.sectors[sector];
    const options = Object.entries(S.options);
    const hit = options.find(([, o]) => normalize(o.label) === text) ?? options.find(([id]) => OPTION[id]?.test(text));
    if (hit) {
      const next: GuideCtx = { ...ctx, goal: hit[0], facts: push(ctx.facts, priorityFact(sector, hit[0])) };
      const F = ctx.field ? M.fields[ctx.field as FieldId] : null;
      // Pediu uma ideia: a resposta já é a prévia. Na conversa comum, a direção em uma frase e o convite.
      if (ctx.mode === "idea" && F) return presentIdea(ctx.field as FieldId, next);
      const withIdea = !!F && F.sector === sector;
      return {
        text: `${hit[1].reply} ${withIdea ? M.say.closeIdea : M.say.closeBrief}`,
        actions: [...(withIdea ? [ideaChip] : []), brief, say(M.ui.another), ...(ctx.project ? [openProject(ctx.project)] : [])],
        ctx: { ...next, asked: withIdea ? "idea" : "brief" },
      };
    }
    // pergunta aberta (sistemas): o que a pessoa descrever vai para o pedido
    if (!options.length && !R.sector && tokens.length >= 2) return { text: M.say.noted, actions: [brief, say(M.ui.another)], ctx: { ...ctx, asked: "brief", facts: push(ctx.facts, raw) } };
  }
  if (ctx.asked === "brief" && tokens.length <= 3 && has(RX.yes)) return { text: M.say.brief, actions: [brief], ctx: briefCtx(ctx), run: brief };
  if ((ctx.asked === "brief" || ctx.asked === "idea") && tokens.length <= 3 && has(RX.no)) return { text: M.say.later, actions: [brief, ...(current ? [openProject(current.slug)] : [])], ctx: { ...ctx, asked: null } };

  // ── "quero algo assim" / pedir a proposta: a pessoa escolheu — o pedido abre com o que ela contou
  if (has(RX.like) && current) return { text: fill(M.say.like, { title: current.title }), actions: [brief, say(M.ui.another)], ctx: briefCtx(ctx), run: brief };
  if ((has(RX.brief) || wantsProposal) && !R.sector) return { text: current ? fill(M.say.like, { title: current.title }) : M.say.brief, actions: [brief], ctx: briefCtx(ctx), run: brief };

  // ── como o Rick trabalha / quem é
  if (has(RX.how) || has(RX.who)) {
    const steps = payload.studio.process.steps.map((s) => s.label.charAt(0) + s.label.slice(1).toLowerCase()).join(", ");
    return { text: has(RX.who) && !has(RX.how) ? payload.studio.founder.body : fill(M.say.how, { steps }), actions: [{ kind: "app", app: "studio", label: M.ui.studio }, say(M.say.chipSite), brief], ctx: { ...ctx, asked: null }, run: { kind: "app", app: "studio", label: M.ui.studio } };
  }

  // ── um setor reconhecido: uma recomendação explicada, não uma lista
  if (R.sector) {
    if (R.alt) return whichOne(ctx);
    const reply = recommend(R.sector, R.field, ctx);
    if (reply) return reply;
  }
  // ── nenhum setor, mas a frase fala de algo que um case publica ("drones", "tatuagem")
  if (RX.personal.test(text) || wantsSite || has(RX.show)) {
    const best = closest();
    if (best) {
      const { pick, why } = refText(best);
      const home = (Object.keys(M.sectors) as SectorId[]).find((id) => M.sectors[id].refs.includes(best.slug)) ?? null;
      return {
        text: `${pick} ${why}`,
        actions: [whyChip, say(M.ui.another), say(M.ui.likeThis)],
        ctx: { ...ctx, role: ctx.role === "recruiter" ? ctx.role : "client", sector: home, field: null, project: best.slug, shown: push(ctx.shown, best.slug), asked: null, facts: told(ctx.facts) },
        card: best.slug,
        run: openProject(best.slug),
      };
    }
  }
  // ── quer um site, mas falta saber para quê: uma pergunta curta
  if (wantsSite) {
    const chips = [M.say.chipHealth, M.say.chipTourism, M.say.chipStore, M.say.chipCompany, M.say.chipSystem].map((label) => say(label));
    return { text: M.say.whichBusiness, actions: chips, ctx: { ...ctx, role: "client", asked: null, facts: told(ctx.facts) } };
  }

  // ── o resto do portfólio
  if (has(RX.projects)) return { text: M.say.projectsOpened, actions: [say(M.say.chipTour), say(M.say.chipSite)], ctx: { ...ctx, asked: null }, run: { kind: "app", app: "projects", label: M.ui.projects } };
  if (has(RX.services)) return { text: payload.services.intro, actions: [say(M.say.chipSite), brief], ctx: { ...ctx, asked: null }, run: { kind: "app", app: "services", label: M.ui.open } };
  if (has(RX.contact)) return { text: M.say.brief, actions: [brief], ctx: briefCtx(ctx), run: brief };
  if (has(RX.thanks)) return { text: M.say.thanks, actions: [], ctx: { ...ctx, asked: null } };
  if (has(RX.hello)) return { text: M.say.hello, actions: starters, ctx };

  // ── a pessoa respondeu à pergunta da Matéria com as próprias palavras: vale como está
  if (ctx.asked === "sector" && !raw.includes("?")) return { text: M.say.noted, actions: [brief, say(M.ui.another)], ctx: { ...ctx, mode: null, asked: "brief", facts: push(ctx.facts, raw) } };

  // ── não sei: se for pergunta, ela segue para o Rick
  if (raw.includes("?") || tokens.length >= 4) return { text: M.say.forRick, actions: [brief, ...starters.slice(1, 3)], ctx: { ...ctx, asked: "brief", questions: push(ctx.questions, raw) } };
  return { text: M.say.fallback, actions: starters, ctx };
}

/** O texto que vai para o pedido de proposta: o que a pessoa contou, as prioridades e as dúvidas. */
export function briefNotes(ctx: GuideCtx, questionLabel: string): string {
  return [...ctx.facts, ...ctx.questions.map((q) => `${questionLabel}: ${q}`)].join("\n");
}
