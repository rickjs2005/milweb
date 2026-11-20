import type { Locale } from "@/i18n/config";

/**
 * PRÉVIA ("Ver uma ideia para o meu site") — textos das duas experiências que a Matéria abre numa
 * janela do OS (features/os/apps/idea). Só o idioma ativo vai para o cliente.
 *
 * Regra de conteúdo: são ideias, não sites prontos. A de mergulho é um CONCEITO com dados
 * ilustrativos e termina antes de qualquer reserva; a do consultório é uma PRÉVIA DE DIREÇÃO com
 * conteúdo ilustrativo — nenhum profissional, depoimento ou resultado é inventado. A referência de
 * cada uma é um projeto real do portfólio, identificado pelo que é.
 */
type L = Record<Locale, string>;
const l = (pt: string, en: string, es: string): L => ({ pt, en, es });
type LL = Record<Locale, string[]>;
const ll = (pt: string[], en: string[], es: string[]): LL => ({ pt, en, es });

const common = {
  use: l("Usar esta direção no meu orçamento", "Use this direction in my quote request", "Usar esta dirección en mi cotización"),
  reference: l("Referência", "Reference", "Referencia"),
  openCase: l("Abrir o case", "Open the case", "Abrir el caso"),
  talk: l("Voltar à conversa", "Back to the conversation", "Volver a la conversación"),
  emptyTitle: l("Nenhuma prévia aberta", "No preview open", "Ninguna vista previa abierta"),
  emptyBody: l(
    "Conte o seu negócio à Matéria e ela abre aqui uma ideia para você experimentar.",
    "Tell Matéria about your business and she will open an idea here for you to try.",
    "Cuéntale tu negocio a Matéria y abrirá aquí una idea para que la pruebes.",
  ),
  /** Linhas que a prévia leva para o pedido de proposta (Hire Rick). */
  briefChoice: l("Escolha na prévia", "Choice in the preview", "Elección en la vista previa"),
};

const dive = {
  tag: l("Conceito", "Concept", "Concepto"),
  note: l("Conceito para uma operadora de mergulho · dados ilustrativos", "Concept for a dive operator · illustrative data", "Concepto para un centro de buceo · datos ilustrativos"),
  brand: l("Sua operadora", "Your dive shop", "Tu centro de buceo"),
  title: l("Desça antes de reservar.", "Descend before you book.", "Desciende antes de reservar."),
  sub: l(
    "Arraste para baixo: cada metro mostra o que o seu cliente vai encontrar.",
    "Drag down: every metre shows what your guests will find.",
    "Arrastra hacia abajo: cada metro muestra lo que encontrará tu cliente.",
  ),
  hint: l("Arraste para descer", "Drag to descend", "Arrastra para descender"),
  surface: l("Superfície", "Surface", "Superficie"),
  depth: l("Profundidade", "Depth", "Profundidad"),
  chooseTitle: l("Recife ou naufrágio?", "Reef or wreck?", "¿Arrecife o naufragio?"),
  chooseSub: l(
    "O visitante escolhe o tipo de mergulho e a página o leva até lá.",
    "Visitors choose the kind of dive and the page takes them there.",
    "El visitante elige el tipo de inmersión y la página lo lleva hasta allí.",
  ),
  reef: l("Recife", "Reef", "Arrecife"),
  reefLine: l("Raso, claro, cheio de vida. Um bom primeiro mergulho.", "Shallow, bright, full of life. A good first dive.", "Poco profundo, claro, lleno de vida. Una buena primera inmersión."),
  reefLevel: l("Iniciante", "Beginner", "Principiante"),
  wreck: l("Naufrágio", "Wreck", "Naufragio"),
  wreckLine: l("Mais fundo e mais escuro. Para quem já tem certificação.", "Deeper and darker. For certified divers.", "Más profundo y más oscuro. Para buzos certificados."),
  wreckLevel: l("Certificado", "Certified", "Certificado"),
  level: l("Nível", "Level", "Nivel"),
  go: l("Descer até aqui", "Descend here", "Descender hasta aquí"),
  chosen: l("Escolhido", "Chosen", "Elegido"),
  bookTitle: l("Como a reserva começa", "How a booking starts", "Cómo empieza una reserva"),
  bookSub: l(
    "O visitante chega ao pedido com o mergulho já escolhido.",
    "Guests reach the request with their dive already chosen.",
    "El visitante llega a la solicitud con la inmersión ya elegida.",
  ),
  pickFirst: l("Escolha recife ou naufrágio para ver o pedido.", "Choose reef or wreck to see the request.", "Elige arrecife o naufragio para ver la solicitud."),
  divers: l("Mergulhadores", "Divers", "Buzos"),
  fewer: l("Menos um mergulhador", "One diver fewer", "Un buzo menos"),
  more: l("Mais um mergulhador", "One more diver", "Un buzo más"),
  diverOne: l("1 mergulhador", "1 diver", "1 buzo"),
  diverMany: l("{n} mergulhadores", "{n} divers", "{n} buzos"),
  when: l("Quando", "When", "Cuándo"),
  start: l("Iniciar pedido de reserva", "Start the booking request", "Iniciar la solicitud de reserva"),
  message: l("Olá! Quero reservar: {site} ({depth} m) · {divers} · {when}.", "Hi! I would like to book: {site} ({depth} m) · {divers} · {when}.", "¡Hola! Quiero reservar: {site} ({depth} m) · {divers} · {when}."),
  messageLabel: l("O pedido que o visitante enviaria", "The request a guest would send", "La solicitud que enviaría el visitante"),
  end: l(
    "A demonstração termina aqui: nada foi enviado. No seu site, este pedido seguiria para o WhatsApp, o e-mail ou o sistema de reservas da operadora.",
    "The demonstration ends here: nothing was sent. On your site, this request would go to the operator's WhatsApp, email or booking system.",
    "La demostración termina aquí: no se envió nada. En tu sitio, esta solicitud iría al WhatsApp, al correo o al sistema de reservas del centro.",
  ),
  briefTitle: l(
    "Prévia vista: conceito para operadora de mergulho (rolar a página é descer)",
    "Preview seen: concept for a dive operator (scrolling the page is descending)",
    "Vista previa: concepto para centro de buceo (desplazarse es descender)",
  ),
  briefGoal: l(
    "O que a prévia mostrou: o visitante inicia o pedido de reserva no próprio site",
    "What the preview showed: guests start the booking request on the site itself",
    "Lo que mostró la vista previa: el visitante inicia la solicitud de reserva en el propio sitio",
  ),
  navDives: l("Mergulhos", "Dives", "Inmersiones"),
  navCourses: l("Cursos", "Courses", "Cursos"),
  navBook: l("Reservar", "Book", "Reservar"),
};
const diveWhen = ll(["Sábado de manhã", "Domingo de manhã", "Outra data"], ["Saturday morning", "Sunday morning", "Another date"], ["Sábado por la mañana", "Domingo por la mañana", "Otra fecha"]);

const practice = {
  tag: l("Prévia de direção", "Direction preview", "Vista previa de dirección"),
  note: l(
    "Conteúdo ilustrativo: nomes, textos e fotos reais entram no projeto.",
    "Illustrative content: real names, copy and photos come with the project.",
    "Contenido ilustrativo: los nombres, textos y fotos reales llegan con el proyecto.",
  ),
  refNote: l(
    "ALVA Odontologia é uma demonstração de odontologia. Esta prévia usa outra direção visual, pensada para consultório.",
    "ALVA Odontologia is a dental clinic demonstration. This preview takes a different visual direction, designed for a practice.",
    "ALVA Odontologia es una demostración de odontología. Esta vista previa usa otra dirección visual, pensada para consulta.",
  ),
  refShort: l("Demonstração de odontologia", "Dental clinic demonstration", "Demostración de odontología"),
  switchLabel: l("Direção da página", "Page direction", "Dirección de la página"),
  bookingSwitch: l("Facilitar o primeiro agendamento", "Make the first booking easy", "Facilitar la primera cita"),
  approachSwitch: l("Apresentar minha abordagem", "Present my approach", "Presentar mi enfoque"),
  changed: l(
    "Direção alterada: o título, a ordem das informações e a ação principal mudaram.",
    "Direction changed: the title, the order of information and the primary action changed.",
    "Dirección cambiada: el título, el orden de la información y la acción principal cambiaron.",
  ),
  brand: l("Seu consultório", "Your practice", "Tu consulta"),
  brandSub: l("Psicologia", "Psychology", "Psicología"),
  eyebrow: l("Psicologia clínica", "Clinical psychology", "Psicología clínica"),
  navFirst: l("Primeira conversa", "First conversation", "Primera conversación"),
  navApproach: l("Abordagem", "Approach", "Enfoque"),
  navSession: l("Primeira sessão", "First session", "Primera sesión"),
  navInfo: l("Informações", "Information", "Información"),
  bookingTitle: l("O primeiro passo pode ser uma conversa.", "The first step can be a conversation.", "El primer paso puede ser una conversación."),
  bookingSub: l(
    "Escolha um horário e receba a confirmação por mensagem. A primeira conversa serve para entender o que você procura.",
    "Pick a time and get the confirmation by message. The first conversation is there to understand what you are looking for.",
    "Elige un horario y recibe la confirmación por mensaje. La primera conversación sirve para entender lo que buscas.",
  ),
  bookingAction: l("Agendar primeira conversa", "Book a first conversation", "Agendar primera conversación"),
  approachTitle: l("Antes de agendar, entenda como eu trabalho.", "Before you book, see how I work.", "Antes de agendar, conoce cómo trabajo."),
  approachSub: l(
    "Quem eu atendo, como são as sessões e o que esperar do primeiro encontro, em linguagem clara.",
    "Who I work with, what sessions are like and what to expect from the first meeting, in plain language.",
    "A quién atiendo, cómo son las sesiones y qué esperar del primer encuentro, en lenguaje claro.",
  ),
  approachAction: l("Conhecer minha abordagem", "Read my approach", "Conocer mi enfoque"),
  /** Blocos da página: mudam de ordem conforme a direção. */
  firstTitle: l("Como funciona a primeira conversa", "How the first conversation works", "Cómo funciona la primera conversación"),
  approachBlock: l("Minha abordagem", "My approach", "Mi enfoque"),
  approachBody: l(
    "Aqui entra o seu texto: a sua linha de trabalho, explicada sem jargão, e para quem ela serve.",
    "Your text goes here: your line of work, explained without jargon, and who it is for.",
    "Aquí va tu texto: tu línea de trabajo, explicada sin jerga, y para quién sirve.",
  ),
  sessionTitle: l("O que esperar da primeira sessão", "What to expect from the first session", "Qué esperar de la primera sesión"),
  sessionBody: l(
    "Como é o primeiro encontro, quanto dura e o que não é preciso preparar.",
    "What the first meeting is like, how long it takes and what you do not need to prepare.",
    "Cómo es el primer encuentro, cuánto dura y qué no hace falta preparar.",
  ),
  infoTitle: l("Informações práticas", "Practical information", "Información práctica"),
  infoBody: l(
    "Formato, duração e valores: o que você decidir publicar.",
    "Format, length and fees: whatever you decide to publish.",
    "Formato, duración y honorarios: lo que decidas publicar.",
  ),
  ready: l("Mensagem pronta", "Message ready", "Mensaje listo"),
  readyText: l("Olá! Gostaria de agendar uma primeira conversa.", "Hello! I would like to book a first conversation.", "¡Hola! Me gustaría agendar una primera conversación."),
  readyNote: l(
    "Na prévia nada é enviado. Agenda online e outras integrações o Rick confirma na proposta.",
    "Nothing is sent in the preview. Online scheduling and other integrations are confirmed by Rick in the proposal.",
    "En la vista previa no se envía nada. La agenda en línea y otras integraciones las confirma Rick en la propuesta.",
  ),
  briefTitle: l("Prévia vista: direção para consultório de psicologia", "Preview seen: direction for a psychology practice", "Vista previa: dirección para consulta de psicología"),
  briefAction: l("Ação principal", "Primary action", "Acción principal"),
  briefOrder: l("Ordem das informações", "Order of information", "Orden de la información"),
};
const practiceSteps = ll(
  ["Você escolhe um horário", "Recebe a confirmação por mensagem", "Conversamos sobre o que você procura"],
  ["You pick a time", "You get the confirmation by message", "We talk about what you are looking for"],
  ["Eliges un horario", "Recibes la confirmación por mensaje", "Conversamos sobre lo que buscas"],
);

export function buildIdea(locale: Locale) {
  const pick = <T extends Record<string, L>>(group: T) => Object.fromEntries(Object.entries(group).map(([k, v]) => [k, v[locale]])) as { [K in keyof T]: string };
  return {
    common: pick(common),
    dive: { ...pick(dive), whenOptions: diveWhen[locale], /** Profundidades ilustrativas (m) de cada parada da descida. */ depths: { reef: 12, wreck: 26, floor: 30 } },
    practice: { ...pick(practice), steps: practiceSteps[locale] },
  };
}

export type IdeaData = ReturnType<typeof buildIdea>;
