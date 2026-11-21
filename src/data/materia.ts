import type { Locale } from "@/i18n/config";
import { COMPANY, FIELD_CUES, PREMISES, SECTOR_CUES, normalize, type FieldId, type SectorId } from "./materia-lexicon";

export type { FieldId, SectorId } from "./materia-lexicon";

/**
 * MATÉRIA — textos da guia do portfólio, por idioma (só o idioma ativo vai para o cliente).
 *
 * Regra de conteúdo: a Matéria só afirma o que o portfólio já publica. Cada referência diz o que
 * ela é (trabalho para cliente, demonstração ou projeto do estúdio); preço e integração nunca são
 * prometidos — vão para a proposta do Rick. Os dados (projetos, perfil, processo, condições) vêm do
 * payload do OS; aqui ficam só as frases e as recomendações.
 *
 * Ritmo: a primeira resposta é uma recomendação (`pick`), um motivo concreto (`why`) e uma pergunta
 * (`ask`). O resto fica no case ou em "Por que este exemplo?" (`detail`).
 * As palavras que disparam cada intenção ficam em materia-lexicon.ts e em features/os/materia/brain.ts.
 */
type L = Record<Locale, string>;
const l = (pt: string, en: string, es: string): L => ({ pt, en, es });

const ui = {
  name: l("Matéria", "Matéria", "Matéria"),
  talk: l("Conversar com a Matéria", "Talk to Matéria", "Hablar con Matéria"),
  /** Os dois destinos em destaque na primeira tela. */
  goProjects: l("Ver projetos", "See the work", "Ver proyectos"),
  goProfile: l("Perfil e currículo", "Profile and résumé", "Perfil y currículum"),
  /** O grupo dos demais destinos. */
  more: l("Mais", "More", "Más"),
  idea: l("Ver uma ideia para o meu site", "See an idea for my site", "Ver una idea para mi sitio"),
  explore: l("Ver o projeto", "View the project", "Ver el proyecto"),
  made: l("Ver como foi feito", "See how it was made", "Ver cómo se hizo"),
  role: l("Guia do portfólio", "Portfolio guide", "Guía del portafolio"),
  placeholder: l("Escreva para a Matéria", "Write to Matéria", "Escribe a Matéria"),
  send: l("Enviar", "Send", "Enviar"),
  mic: l("Falar", "Speak", "Hablar"),
  micStop: l("Parar de ouvir", "Stop listening", "Dejar de escuchar"),
  stopSpeak: l("Interromper a resposta", "Stop the answer", "Interrumpir la respuesta"),
  close: l("Fechar a conversa", "Close the conversation", "Cerrar la conversación"),
  minimize: l("Recolher a conversa", "Minimise the conversation", "Minimizar la conversación"),
  resume: l("Continuar a conversa", "Continue the conversation", "Continuar la conversación"),
  restart: l("Recomeçar", "Start over", "Empezar de nuevo"),
  log: l("Conversa com a Matéria", "Conversation with Matéria", "Conversación con Matéria"),
  listening: l("Ouvindo", "Listening", "Escuchando"),
  thinking: l("Pensando", "Thinking", "Pensando"),
  speaking: l("Respondendo", "Answering", "Respondiendo"),
  heard: l("Você disse", "You said", "Dijiste"),
  micDenied: l("O microfone não foi liberado. A conversa continua por texto.", "The microphone was not allowed. The conversation continues in writing.", "No se permitió el micrófono. La conversación sigue por escrito."),
  micUnsupported: l("Este navegador não reconhece voz. A conversa continua por texto.", "This browser has no speech recognition. The conversation continues in writing.", "Este navegador no reconoce voz. La conversación sigue por escrito."),
  micSilent: l("Não ouvi nada. Tente de novo ou escreva.", "I heard nothing. Try again or type.", "No escuché nada. Inténtalo de nuevo o escribe."),
  open: l("Abrir", "Open", "Abrir"),
  openProject: l("Abrir o projeto", "Open the project", "Abrir el proyecto"),
  openIdea: l("Abrir a prévia", "Open the preview", "Abrir la vista previa"),
  why: l("Por que este exemplo?", "Why this example?", "¿Por qué este ejemplo?"),
  another: l("Me mostra outro", "Show me another", "Muéstrame otro"),
  likeThis: l("Quero algo assim", "I want something like this", "Quiero algo así"),
  brief: l("Montar o pedido de proposta", "Build the proposal request", "Preparar la solicitud de propuesta"),
  cv: l("Abrir o currículo (PDF)", "Open the résumé (PDF)", "Abrir el currículum (PDF)"),
  profile: l("Abrir o Perfil", "Open the Profile", "Abrir el Perfil"),
  studio: l("Abrir o Estúdio", "Open the Studio", "Abrir el Estudio"),
  projects: l("Ver todos os projetos", "See all projects", "Ver todos los proyectos"),
  code: l("Ver o código", "See the code", "Ver el código"),
  client: l("Trabalho para cliente.", "Client work.", "Trabajo para cliente."),
  demo: l("É uma demonstração, não um trabalho para cliente.", "It is a demonstration, not client work.", "Es una demostración, no un trabajo para cliente."),
  study: l("É um projeto do próprio estúdio.", "It is one of the studio's own projects.", "Es un proyecto del propio estudio."),
  /** O recorte no rosto da escultura: a ideia aparece ali dentro e abre numa janela. */
  portal: l("Abrir a ideia que aparece dentro da Matéria", "Open the idea showing inside Matéria", "Abrir la idea que aparece dentro de Matéria"),
  portalOpen: l("Abrir a ideia", "Open the idea", "Abrir la idea"),
  portalClose: l("Agora não", "Not now", "Ahora no"),
};

const say = {
  hello: l(
    "Sou a Matéria, a guia deste portfólio. Diga quem você é ou o que procura e eu abro o lugar certo.",
    "I am Matéria, the guide to this portfolio. Tell me who you are or what you are looking for and I will open the right place.",
    "Soy Matéria, la guía de este portafolio. Dime quién eres o qué buscas y abro el lugar correcto.",
  ),
  chipRecruiter: l("Sou recrutador", "I'm a recruiter", "Soy reclutador"),
  chipSite: l("Quero um site", "I want a website", "Quiero un sitio"),
  chipTour: l("Mostre algo de turismo", "Show me something for tourism", "Muéstrame algo de turismo"),
  chipHow: l("Como o Rick trabalha?", "How does Rick work?", "¿Cómo trabaja Rick?"),
  chipHealth: l("Clínica ou consultório", "Clinic or practice", "Clínica o consulta"),
  chipTourism: l("Turismo", "Tourism", "Turismo"),
  chipStore: l("Loja", "Shop", "Tienda"),
  chipCompany: l("Empresa", "Company", "Empresa"),
  chipSystem: l("Sistema interno", "Internal system", "Sistema interno"),
  chipBackend: l("Você tem experiência com backend?", "Do you have backend experience?", "¿Tienes experiencia con backend?"),
  /** As três entradas da conversa (além de escrever livremente). */
  chipExplore: l("Ver os sites", "See the sites", "Ver los sitios"),
  chipCv: l("Ver o currículo", "See the résumé", "Ver el currículum"),
  chipQuote: l("Quero um orçamento", "I want a quote", "Quiero un presupuesto"),
  chipProject: l("Tenho um projeto em mente", "I have a project in mind", "Tengo un proyecto en mente"),
  chipRecruiting: l("Estou recrutando", "I'm recruiting", "Estoy reclutando"),
  /** Objetivos, não profissões: o que o visitante de quem pede precisa conseguir fazer. */
  goalOrders: l("Pedir orçamento ou fazer um pedido", "Request a quote or place an order", "Pedir presupuesto o hacer un pedido"),
  goalBook: l("Agendar ou reservar", "Book or schedule", "Agendar o reservar"),
  goalBuy: l("Comprar pelo site", "Buy on the site", "Comprar en el sitio"),
  goalKnow: l("Conhecer meu trabalho", "Get to know my work", "Conocer mi trabajo"),
  projectAsk: l("Boa. O que você gostaria que seus visitantes conseguissem fazer?", "Good. What would you like your visitors to be able to do?", "Bien. ¿Qué te gustaría que tus visitantes pudieran hacer?"),
  leadOrders: l(
    "Para receber pedidos mais completos, o site conduz a pessoa por perguntas curtas em vez de um formulário aberto: é como o pedido de proposta deste portfólio funciona.",
    "To receive more complete requests, the site walks the person through short questions instead of an open form: it is how the proposal request in this portfolio works.",
    "Para recibir pedidos más completos, el sitio guía a la persona con preguntas cortas en lugar de un formulario abierto: así funciona la solicitud de propuesta de este portafolio.",
  ),
  leadShowcase: l(
    "Para apresentar melhor o seu trabalho, a página conta uma história em vez de listar serviços.",
    "To present your work better, the page tells a story instead of listing services.",
    "Para presentar mejor tu trabajo, la página cuenta una historia en lugar de listar servicios.",
  ),
  recruiter: l(
    "O Rick é engenheiro de software full-stack sênior: Python e React, backends escaláveis e aplicações com LLMs e agentes de IA, com experiência em fintech. Abri o Perfil, com a experiência, as competências e os projetos técnicos.",
    "Rick is a senior full-stack software engineer: Python and React, scalable backends and applications built on LLMs and AI agents, with fintech experience. I opened the Profile, with his experience, skills and technical projects.",
    "Rick es ingeniero de software full-stack sénior: Python y React, backends escalables y aplicaciones con LLMs y agentes de IA, con experiencia en fintech. Abrí el Perfil, con su experiencia, competencias y proyectos técnicos.",
  ),
  cv: l("Este é o currículo real do Rick ({lang}). Abri o arquivo em outra aba.", "This is Rick's actual résumé ({lang}). I opened the file in another tab.", "Este es el currículum real de Rick ({lang}). Abrí el archivo en otra pestaña."),
  cvRecruiter: l(
    "O Rick é engenheiro de software full-stack sênior, com foco em backends e aplicações com IA. Este é o currículo real dele ({lang}); abri o arquivo em outra aba.",
    "Rick is a senior full-stack software engineer focused on backends and AI applications. This is his actual résumé ({lang}); I opened the file in another tab.",
    "Rick es ingeniero de software full-stack sénior, con foco en backends y aplicaciones con IA. Este es su currículum real ({lang}); abrí el archivo en otra pestaña.",
  ),
  skill: l("{label}: {contribution} A evidência está em {project}: {evidence}", "{label}: {contribution} The evidence is in {project}: {evidence}", "{label}: {contribution} La evidencia está en {project}: {evidence}"),
  skillListed: l("Sim. No Perfil, {name} aparece em {group}. Abri o Perfil para você ver de onde vem cada competência.", "Yes. In the Profile, {name} is listed under {group}. I opened the Profile so you can see where each skill comes from.", "Sí. En el Perfil, {name} aparece en {group}. Abrí el Perfil para que veas de dónde viene cada competencia."),
  skillUnknown: l("Não encontrei isso documentado no perfil. O currículo completo e o código público estão aqui.", "I could not find that documented in the profile. The full résumé and the public code are here.", "No encontré eso documentado en el perfil. El currículum completo y el código público están aquí."),
  how: l(
    "O Rick trabalha remoto, com contrato, comunicação direta e código que fica com o cliente. O processo tem seis etapas: {steps}. Tudo pode ser combinado por e-mail ou WhatsApp, até a aprovação da proposta.",
    "Rick works remotely, with a contract, direct communication and code the client keeps. The process has six stages: {steps}. Everything can be handled by email or WhatsApp, through proposal approval.",
    "Rick trabaja en remoto, con contrato, comunicación directa y código que se queda con el cliente. El proceso tiene seis etapas: {steps}. Todo se puede gestionar por correo o WhatsApp, hasta la aprobación de la propuesta.",
  ),
  whichBusiness: l("Para que tipo de negócio?", "What kind of business is it for?", "¿Para qué tipo de negocio?"),
  /** Duas leituras plausíveis da mesma frase ("loja de mergulho"): uma pergunta curta decide. */
  which: l("Você quer principalmente {a} ou {b}?", "Do you mainly want to {a} or to {b}?", "¿Quieres sobre todo {a} o {b}?"),
  pickAny: l("Separei {title}. {kind}", "I picked {title}. {kind}", "Elegí {title}. {kind}"),
  another: l("Outra referência: {title}. {tagline}. {kind}", "Another reference: {title}. {tagline}. {kind}", "Otra referencia: {title}. {tagline}. {kind}"),
  noOther: l("Já mostrei as referências que tenho para isso. Você pode ver o mural completo ou seguir para o pedido.", "I have shown the references I have for this. You can see the full board or move on to the request.", "Ya mostré las referencias que tengo para esto. Puedes ver el mural completo o pasar a la solicitud."),
  whyNone: l("Ainda não indiquei um exemplo. Diga o seu ramo e eu separo o mais próximo.", "I have not suggested an example yet. Tell me your field and I will pick the closest one.", "Todavía no sugerí un ejemplo. Dime tu rubro y elijo el más cercano."),
  /** Só o preço: a resposta publicada no guia, a referência em pauta e o convite — o pedido abre quando a pessoa escolhe. */
  price: l("{price} {project}", "{price} {project}", "{price} {project}"),
  priceProject: l("{title} é a referência, não uma tabela. ", "{title} is the reference, not a price list. ", "{title} es la referencia, no una lista de precios. "),
  priceAsk: l("Quer que eu monte o pedido de proposta com o que você me contou?", "Shall I build the proposal request from what you told me?", "¿Preparo la solicitud de propuesta con lo que me contaste?"),
  /** Preço junto de outro assunto: os mesmos fatos publicados, numa frase. */
  priceShort: l(
    "O orçamento é gratuito e o valor depende das páginas, do conteúdo e das integrações; o Rick envia escopo, preço e prazo por escrito para você aprovar.",
    "The quote is free and the price depends on the pages, content and integrations you need; Rick sends the scope, price and timeline in writing for you to approve.",
    "La cotización es gratuita y el precio depende de las páginas, el contenido y las integraciones; Rick envía el alcance, el precio y el plazo por escrito para que los apruebes.",
  ),
  leadBooking: l("Como o agendamento é a prioridade, ", "Since booking is the priority, ", "Como la cita es la prioridad, "),
  leadReservation: l("Como as reservas são a prioridade, ", "Since bookings are the priority, ", "Como las reservas son la prioridad, "),
  ideaOffer: l("Quer ver uma ideia para o seu site antes de pedir a proposta?", "Would you like to see an idea for your site before requesting the proposal?", "¿Quieres ver una idea para tu sitio antes de pedir la propuesta?"),
  closeIdea: l("Quer ver essa direção numa prévia?", "Would you like to see this direction in a preview?", "¿Quieres ver esta dirección en una vista previa?"),
  closeBrief: l("Quer que eu monte o pedido de proposta?", "Shall I build the proposal request?", "¿Preparo la solicitud de propuesta?"),
  like: l("Combinado: {title} fica como referência. Abri o pedido de proposta com o que você me contou; revise, acrescente o que faltar e envie ao Rick por e-mail ou WhatsApp.", "Done: {title} is set as the reference. I opened the proposal request with what you told me; review it, add what is missing and send it to Rick by email or WhatsApp.", "Hecho: {title} queda como referencia. Abrí la solicitud de propuesta con lo que me contaste; revísala, añade lo que falte y envíala a Rick por correo o WhatsApp."),
  brief: l("Abri o pedido de proposta com o que você me contou. Revise, acrescente o que faltar e envie ao Rick por e-mail ou WhatsApp.", "I opened the proposal request with what you told me. Review it, add what is missing and send it to Rick by email or WhatsApp.", "Abrí la solicitud de propuesta con lo que me contaste. Revísala, añade lo que falte y envíala a Rick por correo o WhatsApp."),
  noted: l("Anotado. Isso vai no pedido para o Rick avaliar. Quer que eu monte agora?", "Noted. That goes into the request for Rick to assess. Shall I build it now?", "Anotado. Eso va en la solicitud para que Rick lo evalúe. ¿La preparo ahora?"),
  forRick: l("Isso depende do seu projeto e só o Rick responde. Guardei a pergunta para o pedido.", "That depends on your project and only Rick can answer it. I saved the question for the request.", "Eso depende de tu proyecto y solo Rick puede responderlo. Guardé la pregunta para la solicitud."),
  fallback: l("Ainda não sei responder isso com o que está publicado aqui. Posso mostrar um projeto, abrir o Perfil ou levar sua pergunta ao Rick.", "I cannot answer that yet from what is published here. I can show a project, open the Profile or take your question to Rick.", "Todavía no sé responder eso con lo que está publicado aquí. Puedo mostrar un proyecto, abrir el Perfil o llevar tu pregunta a Rick."),
  later: l("Tudo bem. Continuo por aqui quando você quiser.", "No problem. I am here whenever you want.", "Sin problema. Aquí estaré cuando quieras."),
  thanks: l("Fico por aqui. É só chamar.", "I will be right here. Just call.", "Aquí estaré. Solo llama."),
  projectsOpened: l(
    "Abri a coleção, com o TERRAL em destaque. Em cada projeto você pode experimentar uma amostra ou ver como foi feito.",
    "I opened the collection, with TERRAL featured. For each project you can try a sample or see how it was made.",
    "Abrí la colección, con TERRAL destacado. En cada proyecto puedes probar una muestra o ver cómo se hizo.",
  ),
  briefQuestion: l("Dúvida", "Question", "Duda"),
  briefPriority: l("Prioridade", "Priority", "Prioridad"),
  /** "Ver uma ideia para o meu site": a pessoa conta o negócio e a ideia aparece dentro da escultura. */
  ideaAsk: l("O que você gostaria que seus visitantes conseguissem fazer?", "What would you like your visitors to be able to do?", "¿Qué te gustaría que tus visitantes pudieran hacer?"),
  ideaPortal: l(
    "Olhe para a escultura: abri um recorte no rosto com {idea}. Toque nele para experimentar.",
    "Look at the sculpture: I opened a cut through the face with {idea}. Tap it to try it.",
    "Mira la escultura: abrí un recorte en el rostro con {idea}. Tócalo para probarla.",
  ),
  ideaDirect: l("Abri {idea} numa janela para você experimentar.", "I opened {idea} in a window for you to try.", "Abrí {idea} en una ventana para que la pruebes."),
  ideaNone: l(
    "Ainda não tenho uma prévia interativa pronta para esse caso; mostro a referência mais próxima do catálogo.",
    "I do not have an interactive preview ready for this case yet; here is the closest reference in the catalogue.",
    "Todavía no tengo una vista previa interactiva para este caso; te muestro la referencia más cercana del catálogo.",
  ),
};

/**
 * O que a Matéria diz de cada referência: `pick` identifica o que ela é, `why` dá um motivo concreto
 * (sempre algo visível no case), `detail` responde a "Por que este exemplo?". Referência sem texto
 * próprio usa o título, o tipo e a frase publicada no catálogo.
 */
const refs: Record<string, { pick: L; why: L; detail?: L; detailOther?: L }> = {
  "alva-odontologia": {
    pick: l("Separei a ALVA, uma demonstração de odontologia.", "I picked ALVA, a dental clinic demonstration.", "Elegí ALVA, una demostración de odontología."),
    why: l("Ela mostra como apresentar o espaço antes do primeiro contato.", "It shows how to introduce the space before the first contact.", "Muestra cómo presentar el espacio antes del primer contacto."),
    detail: l(
      "A ALVA Odontologia é uma demonstração que o Rick criou para odontologia, não um trabalho para cliente. O que dá para ver nela e serviria a um consultório de psicologia: o filme guiado pela rolagem, que ali percorre a clínica, pode apresentar o seu espaço e o tom do atendimento antes do primeiro contato; a luz calma da marca sustenta o acolhimento; e o caminho termina simples: conhecer, confiar e agendar pelo WhatsApp.",
      "ALVA Odontologia is a demonstration Rick built for a dental clinic, not client work. What you can see in it that would suit a psychology practice: the scroll-driven film, which there walks through the clinic, can introduce your space and the tone of your care before the first contact; the calm light of the brand supports a welcoming mood; and the path ends simply: get to know, trust and book on WhatsApp.",
      "ALVA Odontologia es una demostración que Rick creó para odontología, no un trabajo para cliente. Lo que se ve en ella y serviría a una consulta de psicología: la película guiada por el scroll, que allí recorre la clínica, puede presentar tu espacio y el tono de la atención antes del primer contacto; la luz calma de la marca sostiene la acogida; y el camino termina simple: conocer, confiar y agendar por WhatsApp.",
    ),
    detailOther: l(
      "A ALVA Odontologia é uma demonstração que o Rick criou para odontologia, não um trabalho para cliente. O que dá para aproveitar dela: o filme guiado pela rolagem apresenta o espaço antes do primeiro contato, a identidade sustenta a confiança, e o caminho termina simples: conhecer, confiar e agendar pelo WhatsApp.",
      "ALVA Odontologia is a demonstration Rick built for a dental clinic, not client work. What carries over from it: the scroll-driven film introduces the space before the first contact, the identity builds trust, and the path ends simply: get to know, trust and book on WhatsApp.",
      "ALVA Odontologia es una demostración que Rick creó para odontología, no un trabajo para cliente. Lo que se aprovecha de ella: la película guiada por el scroll presenta el espacio antes del primer contacto, la identidad sostiene la confianza, y el camino termina simple: conocer, confiar y agendar por WhatsApp.",
    ),
  },
  "ace-diving-miami": {
    pick: l("Separei o Ace Diving Miami, um conceito para uma operadora de mergulho.", "I picked Ace Diving Miami, a concept for a dive operator.", "Elegí Ace Diving Miami, un concepto para una operadora de buceo."),
    why: l(
      "Nele, rolar a página é descer: os pontos de mergulho aparecem por profundidade e cada saída leva ao link de reserva.",
      "On it, scrolling is descending: dive sites appear by depth and every trip leads to its booking link.",
      "En él, desplazarse es descender: los puntos de buceo aparecen por profundidad y cada salida lleva a su enlace de reserva.",
    ),
    detail: l(
      "O Ace Diving Miami é um conceito comercial, não um trabalho para cliente. A página desce da superfície aos 40 metros com um medidor de profundidade, lista dez pontos de mergulho filtráveis por recifes e naufrágios e mostra cada oferta com fatos, inclusões, política e o link exato de reserva. As reservas abrem no sistema da própria operadora.",
      "Ace Diving Miami is a commercial concept, not client work. The page descends from the surface to 40 metres with a depth meter, lists ten dive sites you can filter by reefs and wrecks, and shows every offer with facts, inclusions, policy and the exact booking link. Bookings open the operator's own system.",
      "Ace Diving Miami es un concepto comercial, no un trabajo para cliente. La página desciende de la superficie a los 40 metros con un medidor de profundidad, lista diez puntos de buceo filtrables por arrecifes y naufragios y muestra cada oferta con datos, inclusiones, política y el enlace exacto de reserva. Las reservas abren el sistema de la propia operadora.",
    ),
  },
  "mabrouk-zanzibar": {
    pick: l(
      "Separei o Mabrouk Zanzibar, um trabalho para cliente: a demonstração que fechou o contrato de um guia local.",
      "I picked Mabrouk Zanzibar, client work: the demo that won a local guide as a client.",
      "Elegí Mabrouk Zanzibar, un trabajo para cliente: la demostración que cerró el contrato de un guía local.",
    ),
    why: l("Nele, cada passeio tem a sua apresentação e um planejador monta a mensagem de reserva.", "In it, each experience has its own presentation and a planner builds the booking message.", "En él, cada experiencia tiene su presentación y un planificador arma el mensaje de reserva."),
    detail: l(
      "O Mabrouk Zanzibar é um trabalho para cliente. Cada passeio tem a sua apresentação e um planejador monta a mensagem de reserva. No seu site, o viajante poderia escolher a experiência, a data e o tamanho do grupo antes de escrever.",
      "Mabrouk Zanzibar is client work. Each experience has its own presentation and a planner builds the booking message. On your site, guests could choose a tour, date and group size before writing to you.",
      "Mabrouk Zanzibar es un trabajo para cliente. Cada experiencia tiene su presentación y un planificador arma el mensaje de reserva. En tu sitio, el viajero podría elegir el tour, la fecha y el tamaño del grupo antes de escribirte.",
    ),
  },
  "kavita-drones": {
    pick: l("Separei a Kavita Drones, um trabalho para cliente que está no ar.", "I picked Kavita Drones, client work that is live.", "Elegí Kavita Drones, un trabajo para cliente que está en línea."),
    why: l("Nela, o comprador escolhe os equipamentos e a revenda recebe a lista no WhatsApp.", "On it, buyers choose equipment and the dealer gets their list on WhatsApp.", "En ella, el comprador elige equipos y el distribuidor recibe la lista por WhatsApp."),
    detail: l(
      "A Kavita Drones é um trabalho para cliente, no ar. O comprador escolhe os equipamentos e a revenda recebe a lista no WhatsApp. O mesmo caminho serve para quem pede orçamento dos seus produtos ou serviços.",
      "Kavita Drones is client work, live. Buyers choose equipment and the dealer gets their list on WhatsApp. The same path works for people asking for a quote on your products or services.",
      "Kavita Drones es un trabajo para cliente, en línea. El comprador elige equipos y el distribuidor recibe la lista por WhatsApp. El mismo camino sirve para quien pide cotización de tus productos o servicios.",
    ),
  },
  "loja-de-iphone": {
    pick: l("Separei a Loja de iPhone Premium, uma demonstração de vitrine.", "I picked Loja de iPhone Premium, a storefront demonstration.", "Elegí Loja de iPhone Premium, una demostración de escaparate."),
    why: l("Ela mostra o produto em primeiro plano e leva o comprador até o pedido sem distração.", "It keeps the product in the foreground and takes the buyer to the order without distraction.", "Muestra el producto en primer plano y lleva al comprador al pedido sin distracciones."),
  },
  millead: {
    pick: l(
      "Separei o MilLead, o CRM com IA que o Rick construiu para a própria MilWeb; é de uso interno.",
      "I picked MilLead, the AI-powered CRM Rick built for MilWeb itself; it is for internal use.",
      "Elegí MilLead, el CRM con IA que Rick construyó para la propia MilWeb; es de uso interno.",
    ),
    why: l("Ele organiza a prospecção do estúdio.", "It runs the studio's own pipeline.", "Organiza la prospección del estudio."),
    detail: l(
      "O MilLead é o CRM com IA que o Rick construiu para a própria MilWeb, de uso interno. Ele organiza a prospecção do estúdio. No seu caso, o ponto de partida é uma tarefa repetitiva da equipe e a tela que acompanha cada pedido ou cliente.",
      "MilLead is the AI-powered CRM Rick built for MilWeb itself, for internal use. It runs the studio's own pipeline. In your case, the starting point is a repetitive task on your team and the screen that tracks each order or customer.",
      "MilLead es el CRM con IA que Rick construyó para la propia MilWeb, de uso interno. Organiza la prospección del estudio. En tu caso, el punto de partida es una tarea repetitiva del equipo y la pantalla que sigue cada pedido o cliente.",
    ),
  },
  "kavita-institucional": {
    pick: l("Separei o Kavita Institucional, um trabalho para cliente que está no ar.", "I picked Kavita Institucional, client work that is live.", "Elegí Kavita Institucional, un trabajo para cliente que está en línea."),
    why: l("Ele apresenta a empresa e as áreas de atuação.", "It introduces the business and its areas of work.", "Presenta la empresa y sus áreas de trabajo."),
    detail: l(
      "O Kavita Institucional é um trabalho para cliente, no ar. Ele apresenta a empresa e as áreas de atuação. No seu, cada serviço pode reunir o que você entrega, uma referência de trabalho e um contato direto.",
      "Kavita Institucional is client work, live. It introduces the business and its areas of work. On yours, each service could bring together what you deliver, an example of your work and a direct contact.",
      "Kavita Institucional es un trabajo para cliente, en línea. Presenta la empresa y sus áreas de trabajo. En el tuyo, cada servicio puede reunir lo que entregas, un ejemplo y un contacto directo.",
    ),
  },
  terral: {
    pick: l("Separei a TERRAL, uma demonstração para uma torrefação artesanal.", "I picked TERRAL, a demonstration for an artisanal coffee roastery.", "Elegí TERRAL, una demostración para un tostadero artesanal."),
    why: l("Ela conta o produto em cinco capítulos, do grão à xícara.", "It tells the product in five chapters, from bean to cup.", "Cuenta el producto en cinco capítulos, del grano a la taza."),
    detail: l(
      "A TERRAL é uma demonstração para uma torrefação artesanal, não um trabalho para cliente. Ela conta o produto em cinco capítulos, do grão à xícara. A mesma narrativa serve para mostrar de onde vem o que você vende.",
      "TERRAL is a demonstration for an artisanal coffee roastery, not client work. It tells the product in five chapters, from bean to cup. The same narrative works to show where what you sell comes from.",
      "TERRAL es una demostración para un tostadero artesanal, no un trabajo para cliente. Cuenta el producto en cinco capítulos, del grano a la taza. La misma narrativa sirve para mostrar de dónde viene lo que vendes.",
    ),
  },
  "aurex-timepieces": {
    pick: l(
      "Separei a AUREX TIMEPIECES, uma demonstração com um relógio em 3D que se desmonta com a rolagem.",
      "I picked AUREX TIMEPIECES, a demonstration with a 3D watch that comes apart as you scroll.",
      "Elegí AUREX TIMEPIECES, una demostración con un reloj en 3D que se desmonta con el scroll.",
    ),
    why: l("O efeito existe para explicar o produto por dentro, não para enfeitar.", "The effect is there to explain the product from the inside, not to decorate.", "El efecto existe para explicar el producto por dentro, no para adornar."),
  },
};

/**
 * Ramos com referência e prévia próprias. `want` entra na pergunta de desempate; `ask` substitui a
 * pergunta do setor; `idea` é a prévia interativa (apps/idea) e `ideaLabel`/`ideaNote` a apresentam.
 */
const fields: Record<FieldId, { sector: SectorId; ref: string; idea: "dive" | "practice"; want: L | null; ask: L | null; ideaLabel: L; ideaNote: L }> = {
  diving: {
    sector: "tourism",
    ref: "ace-diving-miami",
    idea: "dive",
    want: l("receber reservas de mergulhos e cursos", "take bookings for dives and courses", "recibir reservas de inmersiones y cursos"),
    ask: l("Quer ver uma ideia assim para a sua operadora?", "Would you like to see an idea like this for your dive shop?", "¿Quieres ver una idea así para tu centro de buceo?"),
    ideaLabel: l("uma ideia para a sua operadora de mergulho", "an idea for your dive shop", "una idea para tu centro de buceo"),
    ideaNote: l(
      "A referência é o Ace Diving Miami, e o que você vai ver é um conceito, não um site pronto.",
      "The reference is Ace Diving Miami, and what you will see is a concept, not a finished site.",
      "La referencia es Ace Diving Miami, y lo que verás es un concepto, no un sitio terminado.",
    ),
  },
  psychology: {
    sector: "health",
    ref: "alva-odontologia",
    idea: "practice",
    want: null,
    ask: l(
      "No seu consultório, você quer destacar sua abordagem ou facilitar o agendamento?",
      "At your practice, would you rather highlight your approach or make booking easy?",
      "En tu consulta, ¿quieres destacar tu enfoque o facilitar la cita?",
    ),
    ideaLabel: l("uma prévia de direção para o seu consultório", "a direction preview for your practice", "una vista previa de dirección para tu consulta"),
    ideaNote: l(
      "A referência é a ALVA, uma demonstração de odontologia; a prévia mostra outra direção visual, pensada para consultório.",
      "The reference is ALVA, a dental clinic demonstration; the preview takes a different visual direction, designed for a practice.",
      "La referencia es ALVA, una demostración de odontología; la vista previa muestra otra dirección visual, pensada para consulta.",
    ),
  },
};

/** Recomendações por setor: `refs` em ordem editorial, `want` para a pergunta de desempate, `ask` muda a proposta. */
const sectors = {
  health: {
    refs: ["alva-odontologia", "kavita-institucional"],
    service: "criacao-de-sites",
    want: l("receber agendamentos", "take appointment bookings", "recibir citas"),
    ask: l("Você quer destacar como trabalha ou facilitar o agendamento?", "Would you rather highlight how you work or make booking easy?", "¿Quieres destacar cómo trabajas o facilitar la cita?"),
    options: {
      booking: {
        label: l("Quero facilitar o primeiro agendamento", "I want to make the first booking easy", "Quiero facilitar la primera cita"),
        fact: l("facilitar o primeiro agendamento", "make the first booking easy", "facilitar la primera cita"),
        reply: l(
          "Então o site começa pelo agendamento: o botão de primeiro contato fica à vista desde o topo e a sua abordagem entra em poucas linhas, só para dar segurança. Agenda online e outras integrações o Rick confirma na proposta.",
          "Then the site starts with booking: the first-contact button stays visible from the top and your approach comes in a few lines, just enough to reassure. Online scheduling and other integrations are confirmed by Rick in the proposal.",
          "Entonces el sitio empieza por la cita: el botón de primer contacto queda a la vista desde arriba y tu enfoque entra en pocas líneas, solo para dar seguridad. La agenda en línea y otras integraciones las confirma Rick en la propuesta.",
        ),
      },
      approach: {
        label: l("Quero apresentar minha abordagem", "I want to present my approach", "Quiero presentar mi enfoque"),
        fact: l("apresentar a abordagem", "present the approach", "presentar el enfoque"),
        reply: l(
          "Então o site começa pela abordagem: quem você atende, como trabalha e o que esperar da primeira sessão, em linguagem clara; o agendamento aparece ao fim de cada bloco.",
          "Then the site starts with your approach: who you work with, how you work and what to expect from the first session, in plain language; booking appears at the end of each block.",
          "Entonces el sitio empieza por el enfoque: a quién atiendes, cómo trabajas y qué esperar de la primera sesión, en lenguaje claro; la cita aparece al final de cada bloque.",
        ),
      },
    },
  },
  tourism: {
    refs: ["mabrouk-zanzibar", "said-zanzibar", "debby-tour", "serengeti-wildlife-safaris", "ace-diving-miami", "legends-of-hollywood-tours"],
    service: "criacao-de-sites",
    want: l("receber reservas de passeios", "take bookings for tours", "recibir reservas de tours"),
    ask: l("Você vende passeios fixos ou roteiros sob medida?", "Do you sell fixed tours or tailor-made itineraries?", "¿Vendes tours fijos o itinerarios a medida?"),
    options: {
      fixed: {
        label: l("Passeios fixos", "Fixed tours", "Tours fijos"),
        fact: l("passeios fixos", "fixed tours", "tours fijos"),
        reply: l(
          "Então cada passeio ganha a sua página e o pedido já sai com o passeio escolhido. O Rick confirma o escopo na proposta.",
          "Then each tour gets its own page and the enquiry already carries the chosen tour. Rick confirms the scope in the proposal.",
          "Entonces cada tour tiene su página y la consulta ya sale con el tour elegido. Rick confirma el alcance en la propuesta.",
        ),
      },
      custom: {
        label: l("Roteiros sob medida", "Tailor-made itineraries", "Itinerarios a medida"),
        fact: l("roteiros sob medida", "tailor-made itineraries", "itinerarios a medida"),
        reply: l(
          "Então o planejador vira o centro: o viajante monta o roteiro e você recebe o pedido com as escolhas. O Rick confirma o escopo na proposta.",
          "Then the planner becomes the centre: guests build their itinerary and you receive the enquiry with their choices. Rick confirms the scope in the proposal.",
          "Entonces el planificador es el centro: el viajero arma su itinerario y recibes la consulta con sus elecciones. Rick confirma el alcance en la propuesta.",
        ),
      },
    },
  },
  landing: {
    refs: ["kavita-drones", "terral", "atelier-vertex", "aurex-timepieces"],
    service: "landing-pages",
    want: l("captar contatos com uma página única", "capture leads with a single page", "captar contactos con una página única"),
    ask: l("A página vai receber tráfego de anúncio ou apresentar um produto?", "Will the page receive ad traffic or present a product?", "¿La página recibirá tráfico de anuncios o presentará un producto?"),
    options: {
      ads: {
        label: l("Anúncio", "Ads", "Anuncios"),
        fact: l("página para tráfego de anúncio", "page for ad traffic", "página para tráfico de anuncios"),
        reply: l(
          "Então ela sai pronta para campanha: o serviço de landing pages do Rick entrega pixel da Meta, Google Analytics e eventos de conversão configurados.",
          "Then it ships ready for campaigns: Rick's landing page service delivers Meta pixel, Google Analytics and conversion events configured.",
          "Entonces sale lista para campañas: el servicio de landing pages de Rick entrega pixel de Meta, Google Analytics y eventos de conversión configurados.",
        ),
      },
      product: {
        label: l("Apresentar um produto", "Present a product", "Presentar un producto"),
        fact: l("página para apresentar um produto", "page to present a product", "página para presentar un producto"),
        reply: l(
          "Então o foco é a história do produto: uma página, um objetivo e o contato sempre a um toque.",
          "Then the focus is the product's story: one page, one goal and contact always one tap away.",
          "Entonces el foco es la historia del producto: una página, un objetivo y el contacto siempre a un toque.",
        ),
      },
    },
  },
  store: {
    refs: ["loja-de-iphone", "rjjstore", "loja-joias", "ecommerce-do-agro", "rjs-laticinios"],
    service: "loja-virtual",
    want: l("vender produtos online", "sell products online", "vender productos en línea"),
    ask: l("Você quer pagamento no próprio site ou fechar o pedido pelo WhatsApp?", "Do you want payment on the site itself or to close the order on WhatsApp?", "¿Quieres pago en el propio sitio o cerrar el pedido por WhatsApp?"),
    options: {
      checkout: {
        label: l("Pagamento no site", "Payment on the site", "Pago en el sitio"),
        fact: l("loja com pagamento no site", "shop with payment on the site", "tienda con pago en el sitio"),
        reply: l(
          "Então é uma loja com pagamento: catálogo, meios de pagamento e regiões atendidas são as primeiras definições, e os meios de pagamento o Rick confirma na proposta.",
          "Then it is a shop with payment: catalogue, payment methods and delivery area are the first decisions, and Rick confirms the payment methods in the proposal.",
          "Entonces es una tienda con pago: catálogo, medios de pago y zonas de envío son las primeras definiciones, y los medios de pago los confirma Rick en la propuesta.",
        ),
      },
      whatsapp: {
        label: l("Pedido pelo WhatsApp", "Order on WhatsApp", "Pedido por WhatsApp"),
        fact: l("catálogo com pedido pelo WhatsApp", "catalogue with orders on WhatsApp", "catálogo con pedido por WhatsApp"),
        reply: l(
          "Então é um catálogo: o cliente chega ao WhatsApp com produto e quantidade já escolhidos.",
          "Then it is a catalogue: customers open WhatsApp with product and quantity already chosen.",
          "Entonces es un catálogo: el cliente llega a WhatsApp con el producto y la cantidad ya elegidos.",
        ),
      },
    },
  },
  system: {
    refs: ["millead", "milsaca", "inkvision", "ecoa"],
    service: "sistemas-sob-medida",
    want: l("organizar a operação num sistema interno", "run your operation in an internal system", "organizar la operación en un sistema interno"),
    ask: l("Qual tarefa a sua equipe repete hoje em planilha ou no WhatsApp?", "Which task does your team repeat today in a spreadsheet or on WhatsApp?", "¿Qué tarea repite hoy tu equipo en una planilla o por WhatsApp?"),
    options: {},
  },
  company: {
    refs: ["kavita-institucional", "lumen-architecture", "atelier-vertex"],
    service: "criacao-de-sites",
    want: l("apresentar a empresa e os serviços", "present the company and its services", "presentar la empresa y sus servicios"),
    ask: l("O site precisa mais apresentar a empresa ou gerar pedidos de orçamento?", "Should the site mainly introduce the company or generate quote requests?", "¿El sitio debe sobre todo presentar la empresa o generar solicitudes de cotización?"),
    options: {
      present: {
        label: l("Apresentar a empresa", "Introduce the company", "Presentar la empresa"),
        fact: l("apresentar a empresa", "introduce the company", "presentar la empresa"),
        reply: l("Então a estrutura parte de quem vocês são e do que entregam, com prova de trabalho em cada serviço.", "Then the structure starts from who you are and what you deliver, with proof of work in each service.", "Entonces la estructura parte de quiénes son y qué entregan, con prueba de trabajo en cada servicio."),
      },
      quotes: {
        label: l("Gerar orçamentos", "Generate quote requests", "Generar cotizaciones"),
        fact: l("gerar pedidos de orçamento", "generate quote requests", "generar solicitudes de cotización"),
        reply: l("Então cada página termina num pedido de orçamento já preenchido com o serviço escolhido.", "Then each page ends in a quote request already filled in with the chosen service.", "Entonces cada página termina en una solicitud de cotización ya rellenada con el servicio elegido."),
      },
    },
  },
  food: {
    refs: ["terral", "rjs-laticinios"],
    service: "criacao-de-sites",
    want: l("apresentar a casa e o que ela serve", "present the place and what it serves", "presentar el local y lo que sirve"),
    ask: null,
    options: {},
  },
  immersive: {
    refs: ["aurex-timepieces", "aurex-motors", "as-copas", "age-of-dragons", "nexus-geek"],
    service: "landing-pages",
    want: l("impressionar com uma experiência visual", "impress with a visual experience", "impresionar con una experiencia visual"),
    ask: null,
    options: {},
  },
} as const satisfies Record<SectorId, unknown>;

/**
 * Índice dos cases para a escolha da referência: as palavras que descrevem para quem cada projeto foi
 * feito (título, frase e problema, nos três idiomas), sem as que quase todos têm e sem as que já são
 * sinal de setor. É o que faz "uma operadora em Miami" achar o Ace Diving e "safári" achar o Serengeti
 * sem uma regra escrita para cada um.
 */
export function buildCaseIndex(cases: { slug: string; /** Título e frase: o que o projeto é. */ head: string[]; /** O problema: para quem foi feito. */ body: string[] }[], limit = 14): Record<string, string> {
  const cue = (word: string) => SECTOR_CUES.some((s) => s.test.test(word)) || FIELD_CUES.some((f) => f.test.test(word)) || PREMISES.test(word) || COMPANY.test(word) || GENERIC.has(word);
  const words = (texts: string[], min: number) => [...new Set(normalize(texts.join(" ")).split(" ").filter((w) => w.length >= min && !/^\d+$/.test(w)))];
  const bags = cases.map((c) => ({ slug: c.slug, head: words(c.head, 4), body: words(c.body, 5) }));
  const seen = new Map<string, number>();
  for (const bag of bags) for (const word of new Set([...bag.head, ...bag.body])) seen.set(word, (seen.get(word) ?? 0) + 1);
  const rare = (w: string) => (seen.get(w) ?? 0) <= 2 && !cue(w);
  // "fortes|fracas": as do título e da frase valem o dobro e bastam para apontar um case fora do setor.
  return Object.fromEntries(bags.map((bag) => [bag.slug, `${bag.head.filter(rare).slice(0, limit).join(" ")}|${bag.body.filter((w) => rare(w) && !bag.head.includes(w)).slice(0, limit).join(" ")}`]));
}
/** Palavras de vitrine que aparecem em poucas frases mas não dizem de que negócio o case é. */
const GENERIC = new Set("conceito concepto concept alta alto high local style estilo aberto abre digital brand marca premium demo site sitio website pagina page unica single para with como onde donde where pelos pela pelo todo toda todos cada each every tres three cinco five antes before depois after durante during sobre about".split(" "));

/** Só o idioma ativo vai no payload, como no resto do OS. */
export function buildMateria(locale: Locale, cases: Record<string, string> = {}) {
  const pick = <T extends Record<string, L>>(group: T) => Object.fromEntries(Object.entries(group).map(([k, v]) => [k, v[locale]])) as { [K in keyof T]: string };
  return {
    ui: pick(ui),
    say: pick(say),
    cases,
    refs: Object.fromEntries(Object.entries(refs).map(([slug, r]) => [slug, { pick: r.pick[locale], why: r.why[locale], detail: r.detail?.[locale] ?? null, detailOther: r.detailOther?.[locale] ?? null }])) as Record<string, { pick: string; why: string; detail: string | null; detailOther: string | null }>,
    fields: Object.fromEntries(
      Object.entries(fields).map(([id, f]) => [id, { sector: f.sector, ref: f.ref, idea: f.idea, want: f.want?.[locale] ?? null, ask: f.ask?.[locale] ?? null, ideaLabel: f.ideaLabel[locale], ideaNote: f.ideaNote[locale] }]),
    ) as Record<FieldId, { sector: SectorId; ref: string; idea: "dive" | "practice"; want: string | null; ask: string | null; ideaLabel: string; ideaNote: string }>,
    sectors: Object.fromEntries(
      Object.entries(sectors).map(([id, s]) => [
        id,
        {
          refs: [...s.refs] as string[],
          service: s.service as string,
          want: s.want[locale],
          ask: s.ask ? s.ask[locale] : null,
          options: Object.fromEntries(Object.entries(s.options as Record<string, { label: L; fact: L; reply: L }>).map(([k, o]) => [k, { label: o.label[locale], fact: o.fact[locale], reply: o.reply[locale] }])),
        },
      ]),
    ) as Record<SectorId, { refs: string[]; service: string; want: string; ask: string | null; options: Record<string, { label: string; fact: string; reply: string }> }>,
  };
}

export type MateriaData = ReturnType<typeof buildMateria>;
