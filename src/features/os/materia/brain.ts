import type { SectorId } from "@/data/materia";
import type { OsPayload } from "../types";
import type { GuideAction, GuideCtx } from "./guide-store";

/**
 * O raciocínio da Matéria: uma função pura, sem rede e sem chave paga. Lê o que a pessoa escreveu
 * (português, inglês ou espanhol, com tolerância a erro de digitação), o que já sabe dela (`ctx`) e
 * o portfólio (`payload`), e devolve a resposta, as ações oferecidas e a ação que roda sozinha.
 *
 * Só responde com o que o portfólio publica. As ações são sempre de um conjunto fechado (app,
 * projeto do catálogo, arquivo cadastrado, pedido de proposta): quem executa confere de novo
 * (guide-actions.ts). O que depende do projeto do visitante vira pergunta guardada para o Rick.
 */
export type Reply = { text: string; actions: GuideAction[]; ctx: GuideCtx; card?: string; run?: GuideAction };
export type Here = { project: string | null };

export const normalize = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

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

const SECTOR: { id: SectorId; test: RegExp; words: string[] }[] = [
  { id: "health", test: /\b(psicolog\w*|psycholog\w*|psiquiatr\w*|psychiatr\w*|terap\w*|therap\w*|consultorio\w*|clinic\w*|dentist\w*|odonto\w*|medic[oa]s?|doctor\w*|doutor\w*|nutri\w*|fisio\w*|physio\w*|saude|health\w*|salud|estetic\w*|fonoaudi\w*)\b/, words: ["psicologa", "psicologo", "psychologist", "terapeuta", "therapist", "dentista", "consultorio", "clinica"] },
  { id: "tourism", test: /\b(turism\w*|tourism|tours?|passeio\w*|viage\w*|travel\w*|safari\w*|guias? (local|turistic)\w*|tour guide\w*|hotel\w*|hoteis|pousada\w*|hostel\w*|mergulh\w*|diving|transfer\w*|excurs\w*|viaje\w*|turist\w*)\b/, words: ["turismo", "tourism", "passeios", "viagens", "pousada"] },
  { id: "landing", test: /\b(landing\w*|pagina de venda\w*|sales page|anuncio\w*|ads|campanha\w*|campaign\w*|lancamento\w*|one page|pagina unica)\b/, words: ["landing"] },
  { id: "store", test: /\b(loja\w*|ecommerce|e commerce|shop|shops|stores?|tienda\w*|vender online|sell online|vender en linea|catalogo\w*|catalogue\w*|catalog|checkout)\b/, words: ["ecommerce", "catalogo"] },
  { id: "system", test: /\b(sistema\w*|systems?|painel|paineis|dashboard\w*|crm|erp|saas|software|aplicativo\w*|plataforma\w*|platform\w*|planilha\w*|spreadsheet\w*)\b/, words: ["sistema", "dashboard", "plataforma"] },
  { id: "food", test: /\b(cafes?|coffee|cafeteria\w*|restaurante\w*|restaurant\w*|padaria\w*|bakery|gastronom\w*|laticin\w*|torrefac\w*)\b/, words: ["restaurante", "cafeteria", "padaria"] },
  { id: "immersive", test: /\b(3d|webgl|imersiv\w*|immersive|inmersiv\w*|cinematic\w*|cinematograf\w*|impacto visual|visual impact)\b/, words: ["imersivo", "immersive"] },
  { id: "company", test: /\b(empresa\w*|institucional\w*|company|companies|corporate|escritorio\w*|advog\w*|lawyer\w*|law firm|abogad\w*|arquitet\w*|architect\w*|arquitect\w*|engenharia|contab\w*|accountan\w*|consultoria\w*|industria\w*|construtora\w*)\b/, words: ["empresa", "institucional", "escritorio", "advogado", "arquiteto"] },
];

const RX = {
  cv: /\b(curriculo|curriculum|cv|resume|pdf|hoja de vida)\b/,
  recruiter: /\b(recrut\w*|recruit\w*|reclut\w*|hiring|headhunter\w*|rh|talent\w*|vagas?|contratando|tech lead|engineering manager|seleccion de personal)\b/,
  skillAsk: /\b(experiencia\w*|experience\w*|sabe|conhece|trabalha com|trabalhou com|worked with|works with|knows?|skills?|competenc\w*|habilidad\w*|stack|tecnolog\w*|technolog\w*|domina)\b/,
  backend: /\b(backend|back end|apis?|servidor\w*|servers?|banco de dados|database\w*|python|django|fastapi|node|nodejs|filas|queues|microservic\w*|postgres\w*|sql)\b/,
  ai: /\b(ia|ai|llms?|agentes?|agents?|inteligencia artificial|artificial intelligence|machine learning|automac\w*|automat\w*)\b/,
  motion: /\b(frontend|front end|interfaces?|motion|animac\w*|animat\w*|webgl|react|next|nextjs|three|gsap|ux|ui)\b/,
  price: /\b(quanto custa\w*|custa|custaria|custo|preco\w*|valor|valores|orcamento\w*|how much|costs?|pric\w*|budget|quote|cuanto cuesta|cuesta|costaria|precio\w*|presupuesto\w*|cotiza\w*)\b/,
  time: /\b(prazo\w*|quanto tempo|demora\w*|how long|timeline\w*|deadline\w*|cuanto tard\w*|plazo\w*|cuanto tiempo)\b/,
  another: /\b(outro|outra|outros|mais um|mais uma|another|other one|something else|different one|otro|otra|mas opciones|mais opcoes|more options)\b/,
  like: /\b(algo assim|assim|gostei|adorei|quero esse|quero este|quero isso|something like (this|that)|like this|like that|i like|love it|algo asi|me gusta|me gusto|quiero ese|quiero este)\b/,
  brief: /\b(proposta\w*|pedido|contratar|hire|proposal\w*|propuesta\w*|solicitud\w*|montar|monta|monte|build the request|start a project|comecar um projeto)\b/,
  /** A frase fala de quem escreve: é o que vale levar para o pedido. */
  personal: /\b(sou|somos|tenho|temos|quero|queremos|preciso|precisamos|minha|meu|nossa|nosso|i am|i m|we are|we re|i have|we have|i want|we want|i need|we need|my|our|soy|tengo|tenemos|quiero|necesito|necesitamos|mi|nuestra|nuestro)\b/,
  yes: /^(sim|claro|pode|pode sim|quero|quero sim|isso|yes|yeah|yep|sure|ok|okay|please|yes please|si|claro que si|dale|vamos|bora|monta|manda|por favor)\b/,
  how: /\b(como (o rick |voce |voces |ele )?trabalh\w*|processo\w*|etapas|como funciona|how does (rick|he) work|how do you work|process|workflow|como trabaja\w*|proceso\w*)\b/,
  who: /\b(quem e (o )?rick|quem e voce|who is rick|who are you|quien es rick|quien eres|sobre o rick|about rick)\b/,
  projects: /\b(projetos?|portfolio|portafolio|trabalhos|cases?|projects?|your work|proyectos?)\b/,
  services: /\b(servicos?|services?|servicios?|o que voce faz|o que voces fazem|what do you do|que haces)\b/,
  contact: /\b(contato|contacto|contact|falar com o rick|talk to rick|hablar con rick|whatsapp|e ?mail|telefone)\b/,
  site: /\b(sites?|websites?|web site|sitios?|paginas?|page)\b/,
  thanks: /^(obrigad\w*|valeu|thanks?|thank you|gracias|tchau|bye|adios|ate mais)\b/,
  hello: /^(oi|ola|hello|hi|hey|hola|bom dia|boa tarde|boa noite|good morning|buenos dias|e ai)\b/,
  psych: /\b(psicolog\w*|psycholog\w*|terap\w*|therap\w*|psiquiatr\w*|psychiatr\w*)\b/,
  /** Ligar o projeto a uma ferramenta de terceiros é escopo: nunca se promete, vai para o Rick. */
  integrate: /\b(integr\w*|sincroniz\w*|sync\w*|conect\w*|connect\w*|compativ\w*|compatib\w*|webhooks?|funciona com|works with)\b/,
};
const OPTION: Record<string, RegExp> = {
  booking: /\b(agend\w*|marcar|marcacao|consulta\w*|booking\w*|schedul\w*|appointment\w*|book|citas?|reserv\w*|primeiro contato|first contact|primer contacto|contato)\b/,
  approach: /\b(abordagem|explicar|explica\w*|approach|explain\w*|enfoque|metodo\w*|method\w*|linha)\b/,
  fixed: /\b(fixos?|fixas?|fixed|fijos?|poucos|few|pacotes?|packages?|paquetes?)\b/,
  custom: /\b(sob medida|medida|personaliz\w*|custom\w*|tailor\w*|a medida|roteiro\w*|itinerar\w*)\b/,
  ads: /\b(anuncio\w*|ads?|trafego|traffic|campanha\w*|campaign\w*|publicidad|trafico)\b/,
  product: /\b(produto\w*|products?|productos?|marca|brand|apresentar|present\w*)\b/,
  checkout: /\b(pagamento\w*|checkout|cartao|pix|payment\w*|cards?|pago\w*|tarjeta\w*|no site|on the site|en el sitio)\b/,
  whatsapp: /\b(whatsapp|zap|mensagem|message|mensaje)\b/,
  present: /\b(apresentar|apresenta\w*|introduc\w*|present\w*|institucional)\b/,
  quotes: /\b(orcamento\w*|quotes?|cotiza\w*|presupuesto\w*|pedidos?|leads?|vender|sell)\b/,
};

const fill = (text: string, values: Record<string, string>) => text.replace(/\{(\w+)\}/g, (_, k: string) => values[k] ?? "");
const push = (list: string[], item: string) => (item && !list.includes(item) ? [...list, item] : list);

export function respond(input: string, ctx: GuideCtx, payload: OsPayload, here: Here): Reply {
  const M = payload.materia;
  const raw = input.trim().replace(/\s+/g, " ").slice(0, 400);
  const text = normalize(raw);
  const tokens = text.split(" ").filter(Boolean);
  const catalog = [...payload.projects, ...payload.authorial];
  const find = (slug: string | null) => (slug ? catalog.find((p) => p.slug === slug) : undefined);
  const kindOf = (kind: "client" | "demo" | "study") => M.ui[kind];
  const current = find(here.project) ?? find(ctx.project);

  const say = (label: string, send = label): GuideAction => ({ kind: "say", text: send, label });
  const openProject = (slug: string): GuideAction => ({ kind: "project", slug, label: M.ui.openProject });
  const brief: GuideAction = { kind: "brief", label: M.ui.brief };
  const cv: GuideAction = { kind: "file", href: payload.profile.cv.href, label: M.ui.cv };
  const profile: GuideAction = { kind: "app", app: "profile", label: M.ui.profile };
  const starters = [say(M.say.chipRecruiter), say(M.say.chipSite), say(M.say.chipTour), say(M.say.chipHow)];

  const has = (rx: RegExp) => rx.test(text);
  /** O que a pessoa contou sobre si entra no pedido; um comando ("mostre algo de turismo") não. */
  const told = (list: string[]) => (tokens.length >= 3 && RX.personal.test(text) ? push(list, raw) : list);
  const sector = SECTOR.find((s) => s.test.test(text) || near(tokens, s.words))?.id ?? null;
  const wantsSite = has(RX.site) || near(tokens, ["site", "website", "sitio", "pagina"]);

  if (!text) return { text: M.say.hello, actions: starters, ctx };

  // ── recrutamento
  if (has(RX.cv)) {
    const recruiter = ctx.role === "recruiter" || has(RX.recruiter);
    return { text: fill(recruiter ? M.say.cvRecruiter : M.say.cv, { lang: payload.profile.cv.lang }), actions: [cv, profile, say(M.say.chipHow)], ctx: { ...ctx, role: recruiter ? "recruiter" : ctx.role, asked: null }, run: cv };
  }
  const skill = has(RX.backend) ? "backend" : has(RX.ai) ? "ai" : has(RX.motion) ? "motion" : null;
  if (skill && (ctx.role === "recruiter" || has(RX.skillAsk) || has(RX.recruiter)) && !sector) {
    const shown = payload.profile.showcase.find((s) => s.key === skill);
    const proof = shown && payload.profile.projects.find((p) => p.slug === shown.project);
    if (shown && proof) {
      const code = proof.code[0];
      return {
        text: fill(M.say.skill, { label: shown.label, contribution: shown.contribution, project: proof.name, evidence: proof.evidence.code }),
        actions: [profile, ...(code ? [{ kind: "file", href: code.url, label: `${M.ui.code} · ${proof.name}` } as GuideAction] : []), cv],
        ctx: { ...ctx, role: "recruiter", asked: null },
        run: profile,
      };
    }
  }
  if (has(RX.skillAsk) && (ctx.role === "recruiter" || has(RX.recruiter))) {
    for (const group of payload.profile.skills) {
      const item = group.items.find((it) => tokens.includes(normalize(it.name)) || normalize(it.name).split(" ").every((w) => tokens.includes(w)));
      if (item) return { text: fill(M.say.skillListed, { name: item.name, group: group.title }), actions: [profile, cv], ctx: { ...ctx, role: "recruiter", asked: null }, run: profile };
    }
    return { text: M.say.skillUnknown, actions: [cv, profile], ctx: { ...ctx, role: "recruiter", asked: null } };
  }
  if (has(RX.recruiter)) {
    return { text: M.say.recruiter, actions: [cv, say(M.say.chipBackend), { kind: "app", app: "projects", label: M.ui.projects }], ctx: { ...ctx, role: "recruiter", asked: null }, run: profile };
  }

  // ── quanto custa / quanto tempo: o processo real, sem número que o portfólio não publica
  const briefCtx = (c: GuideCtx, question?: string): GuideCtx => ({ ...c, role: c.role ?? "client", project: current?.slug ?? c.project, asked: null, questions: question ? push(c.questions, question) : c.questions });
  if (has(RX.price)) {
    return {
      text: fill(M.say.price, { price: payload.contact.guide.copy.priceA, project: current ? fill(M.say.priceProject, { title: current.title }) : "" }),
      actions: [brief, ...(current ? [openProject(current.slug)] : []), say(M.say.chipHow)],
      ctx: briefCtx(ctx, raw),
      run: brief,
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
    const refs = ctx.sector ? M.sectors[ctx.sector as SectorId]?.refs ?? [] : [];
    const pool = refs.length ? refs : catalog.filter((p) => p.kind !== "study").map((p) => p.slug);
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
    const S = M.sectors[ctx.sector as SectorId];
    const options = Object.entries(S.options);
    const hit = options.find(([id]) => OPTION[id]?.test(text)) ?? options.find(([, o]) => normalize(o.label) === text);
    if (hit) return { text: hit[1].reply, actions: [brief, say(M.ui.another), ...(ctx.project ? [openProject(ctx.project)] : [])], ctx: { ...ctx, asked: "brief", facts: push(ctx.facts, `${M.say.briefPriority}: ${hit[1].fact}`) } };
    // pergunta aberta (sistemas): o que a pessoa descrever vai para o pedido
    if (!options.length && !sector && tokens.length >= 2) return { text: M.say.noted, actions: [brief, say(M.ui.another)], ctx: { ...ctx, asked: "brief", facts: push(ctx.facts, raw) } };
  }
  if (ctx.asked === "brief" && tokens.length <= 3 && has(RX.yes)) return { text: M.say.brief, actions: [brief], ctx: briefCtx(ctx), run: brief };

  // ── "quero algo assim" / pedir a proposta
  if (has(RX.like) && current) return { text: fill(M.say.like, { title: current.title }), actions: [brief, say(M.ui.another)], ctx: briefCtx(ctx), run: brief };
  if (has(RX.brief) && !sector) return { text: current ? fill(M.say.like, { title: current.title }) : M.say.brief, actions: [brief], ctx: briefCtx(ctx), run: brief };

  // ── como o Rick trabalha / quem é
  if (has(RX.how) || has(RX.who)) {
    const steps = payload.studio.process.steps.map((s) => s.label.charAt(0) + s.label.slice(1).toLowerCase()).join(", ");
    return { text: has(RX.who) && !has(RX.how) ? payload.studio.founder.body : fill(M.say.how, { steps }), actions: [{ kind: "app", app: "studio", label: M.ui.studio }, say(M.say.chipSite), brief], ctx: { ...ctx, asked: null }, run: { kind: "app", app: "studio", label: M.ui.studio } };
  }

  // ── um setor reconhecido: uma recomendação explicada, não uma lista
  if (sector) {
    const S = M.sectors[sector];
    const ref = find(S.refs.find((slug) => !ctx.shown.includes(slug) && find(slug)) ?? S.refs.find((slug) => find(slug)) ?? null);
    if (ref) {
      const first = ref.slug === S.refs[0];
      const adapt = sector === "health" && !has(RX.psych) && S.adaptOther ? S.adaptOther : S.adapt;
      const lead = first ? `${S.pick} ${adapt}` : fill(M.say.another, { title: ref.title, tagline: ref.tagline, kind: kindOf(ref.kind) });
      const chips = Object.values(S.options).map((o) => say(o.label));
      return {
        text: S.ask ? `${lead} ${S.ask}` : lead,
        actions: [...chips, say(M.ui.another), say(M.ui.likeThis)],
        ctx: { ...ctx, role: ctx.role === "recruiter" ? ctx.role : "client", sector, project: ref.slug, shown: push(ctx.shown, ref.slug), asked: S.ask ? "sector" : null, facts: told(ctx.facts) },
        card: ref.slug,
        run: openProject(ref.slug),
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
  if (ctx.asked === "sector" && !raw.includes("?")) return { text: M.say.noted, actions: [brief, say(M.ui.another)], ctx: { ...ctx, asked: "brief", facts: push(ctx.facts, raw) } };

  // ── não sei: se for pergunta, ela segue para o Rick
  if (raw.includes("?") || tokens.length >= 4) return { text: M.say.forRick, actions: [brief, ...starters.slice(1, 3)], ctx: { ...ctx, asked: "brief", questions: push(ctx.questions, raw) } };
  return { text: M.say.fallback, actions: starters, ctx };
}

/** O texto que vai para o pedido de proposta: o que a pessoa contou, as prioridades e as dúvidas. */
export function briefNotes(ctx: GuideCtx, questionLabel: string): string {
  return [...ctx.facts, ...ctx.questions.map((q) => `${questionLabel}: ${q}`)].join("\n");
}
