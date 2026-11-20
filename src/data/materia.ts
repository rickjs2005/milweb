import type { Locale } from "@/i18n/config";

/**
 * MATÉRIA — textos da guia do portfólio, por idioma (só o idioma ativo vai para o cliente).
 *
 * Regra de conteúdo: a Matéria só afirma o que o portfólio já publica. Cada referência diz o que
 * ela é (trabalho para cliente, demonstração ou projeto do estúdio); preço e integração nunca são
 * prometidos — vão para a proposta do Rick. Os dados (projetos, perfil, processo, condições) vêm do
 * payload do OS; aqui ficam só as frases e as recomendações por setor.
 * As palavras que disparam cada intenção ficam em features/os/materia/brain.ts.
 */
type L = Record<Locale, string>;
const l = (pt: string, en: string, es: string): L => ({ pt, en, es });

const ui = {
  name: l("Matéria", "Matéria", "Matéria"),
  talk: l("Conversar com a Matéria", "Talk to Matéria", "Hablar con Matéria"),
  figure: l("Matéria, a escultura: abrir a conversa. Arraste de lado para dobrar o tempo.", "Matéria, the sculpture: open the conversation. Drag sideways to bend time.", "Matéria, la escultura: abrir la conversación. Arrastra hacia un lado para doblar el tiempo."),
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
  another: l("Outra referência: {title}. {tagline}. {kind}", "Another reference: {title}. {tagline}. {kind}", "Otra referencia: {title}. {tagline}. {kind}"),
  noOther: l("Já mostrei as referências que tenho para isso. Você pode ver o mural completo ou seguir para o pedido.", "I have shown the references I have for this. You can see the full board or move on to the request.", "Ya mostré las referencias que tengo para esto. Puedes ver el mural completo o pasar a la solicitud."),
  price: l("{price} {project}Montei o pedido com o que você me contou: revise e envie ao Rick por e-mail ou WhatsApp.", "{price} {project}I built the request from what you told me: review it and send it to Rick by email or WhatsApp.", "{price} {project}Preparé la solicitud con lo que me contaste: revísala y envíala a Rick por correo o WhatsApp."),
  priceProject: l("{title} é a referência, não uma tabela. ", "{title} is the reference, not a price list. ", "{title} es la referencia, no una lista de precios. "),
  like: l("Combinado: {title} fica como referência. Abri o pedido de proposta com o que você me contou; revise, acrescente o que faltar e envie ao Rick por e-mail ou WhatsApp.", "Done: {title} is set as the reference. I opened the proposal request with what you told me; review it, add what is missing and send it to Rick by email or WhatsApp.", "Hecho: {title} queda como referencia. Abrí la solicitud de propuesta con lo que me contaste; revísala, añade lo que falte y envíala a Rick por correo o WhatsApp."),
  brief: l("Abri o pedido de proposta com o que você me contou. Revise, acrescente o que faltar e envie ao Rick por e-mail ou WhatsApp.", "I opened the proposal request with what you told me. Review it, add what is missing and send it to Rick by email or WhatsApp.", "Abrí la solicitud de propuesta con lo que me contaste. Revísala, añade lo que falte y envíala a Rick por correo o WhatsApp."),
  noted: l("Anotado. Isso vai no pedido para o Rick avaliar. Quer que eu monte agora?", "Noted. That goes into the request for Rick to assess. Shall I build it now?", "Anotado. Eso va en la solicitud para que Rick lo evalúe. ¿La preparo ahora?"),
  forRick: l("Isso depende do seu projeto e só o Rick responde. Guardei a pergunta para o pedido.", "That depends on your project and only Rick can answer it. I saved the question for the request.", "Eso depende de tu proyecto y solo Rick puede responderlo. Guardé la pregunta para la solicitud."),
  fallback: l("Ainda não sei responder isso com o que está publicado aqui. Posso mostrar um projeto, abrir o Perfil ou levar sua pergunta ao Rick.", "I cannot answer that yet from what is published here. I can show a project, open the Profile or take your question to Rick.", "Todavía no sé responder eso con lo que está publicado aquí. Puedo mostrar un proyecto, abrir el Perfil o llevar tu pregunta a Rick."),
  thanks: l("Fico por aqui. É só chamar.", "I will be right here. Just call.", "Aquí estaré. Solo llama."),
  projectsOpened: l("Abri o mural com todos os projetos. Se disser o seu ramo, eu aponto o mais próximo.", "I opened the board with every project. Tell me your field and I will point to the closest one.", "Abrí el mural con todos los proyectos. Dime tu rubro y señalo el más cercano."),
  briefQuestion: l("Dúvida", "Question", "Duda"),
  briefPriority: l("Prioridade", "Priority", "Prioridad"),
};

/** Recomendações por setor: `pick` diz o que a referência é, `adapt` o que se aproveita dela, `ask` muda a proposta. */
const sectors = {
  health: {
    refs: ["alva-odontologia", "kavita-institucional"],
    service: "criacao-de-sites",
    pick: l(
      "A referência mais próxima é a ALVA Odontologia. É uma demonstração que o Rick criou para odontologia, não um trabalho para cliente.",
      "The closest reference is ALVA Odontologia. It is a demonstration Rick built for a dental clinic, not client work.",
      "La referencia más cercana es ALVA Odontologia. Es una demostración que Rick creó para odontología, no un trabajo para cliente.",
    ),
    adapt: l(
      "O que dá para ver nela e serviria a um consultório de psicologia: o filme guiado pela rolagem, que ali percorre a clínica, pode apresentar o seu espaço e o tom do atendimento antes do primeiro contato; a luz calma da marca sustenta o acolhimento; e o caminho termina simples: conhecer, confiar e agendar pelo WhatsApp.",
      "What you can see in it that would suit a psychology practice: the scroll-driven film, which there walks through the clinic, can introduce your space and the tone of your care before the first contact; the calm light of the brand supports a welcoming mood; and the path ends simply: get to know, trust and book on WhatsApp.",
      "Lo que se ve en ella y serviría a una consulta de psicología: la película guiada por el scroll, que allí recorre la clínica, puede presentar tu espacio y el tono de la atención antes del primer contacto; la luz calma de la marca sostiene la acogida; y el camino termina simple: conocer, confiar y agendar por WhatsApp.",
    ),
    adaptOther: l(
      "O que dá para aproveitar dela: o filme guiado pela rolagem apresenta o espaço antes do primeiro contato, a identidade sustenta a confiança, e o caminho termina simples: conhecer, confiar e agendar pelo WhatsApp.",
      "What carries over from it: the scroll-driven film introduces the space before the first contact, the identity builds trust, and the path ends simply: get to know, trust and book on WhatsApp.",
      "Lo que se aprovecha de ella: la película guiada por el scroll presenta el espacio antes del primer contacto, la identidad sostiene la confianza, y el camino termina simple: conocer, confiar y agendar por WhatsApp.",
    ),
    ask: l("Hoje é mais importante explicar sua abordagem ou facilitar o primeiro agendamento?", "Right now, is it more important to explain your approach or to make the first booking easy?", "Hoy, ¿es más importante explicar tu enfoque o facilitar la primera cita?"),
    options: {
      booking: {
        label: l("Facilitar o agendamento", "Make booking easy", "Facilitar la cita"),
        fact: l("facilitar o primeiro agendamento", "make the first booking easy", "facilitar la primera cita"),
        reply: l(
          "Então o site começa pelo agendamento: o botão de primeiro contato fica visível desde o topo, com a mensagem já pronta no WhatsApp, e a sua abordagem entra em poucas linhas, só para dar segurança antes de a pessoa escrever. Agenda online e outras integrações o Rick confirma na proposta. Quer que eu monte o pedido com o que você me contou?",
          "Then the site starts with booking: the first-contact button stays visible from the top, with the WhatsApp message already written, and your approach comes in a few lines, just enough to reassure someone before they write. Online scheduling and other integrations are confirmed by Rick in the proposal. Shall I build the request from what you told me?",
          "Entonces el sitio empieza por la cita: el botón de primer contacto queda visible desde arriba, con el mensaje de WhatsApp ya listo, y tu enfoque entra en pocas líneas, solo para dar seguridad antes de que la persona escriba. La agenda en línea y otras integraciones las confirma Rick en la propuesta. ¿Preparo la solicitud con lo que me contaste?",
        ),
      },
      approach: {
        label: l("Explicar a abordagem", "Explain the approach", "Explicar el enfoque"),
        fact: l("explicar a abordagem", "explain the approach", "explicar el enfoque"),
        reply: l(
          "Então o site começa pela abordagem: quem você atende, como trabalha e o que esperar da primeira sessão, em linguagem clara; o agendamento aparece ao fim de cada bloco, sem pressa. Quer que eu monte o pedido com o que você me contou?",
          "Then the site starts with your approach: who you work with, how you work and what to expect from the first session, in plain language; booking appears at the end of each block, unhurried. Shall I build the request from what you told me?",
          "Entonces el sitio empieza por el enfoque: a quién atiendes, cómo trabajas y qué esperar de la primera sesión, en lenguaje claro; la cita aparece al final de cada bloque, sin prisa. ¿Preparo la solicitud con lo que me contaste?",
        ),
      },
    },
  },
  tourism: {
    refs: ["mabrouk-zanzibar", "said-zanzibar", "debby-tour", "serengeti-wildlife-safaris", "ace-diving-miami", "legends-of-hollywood-tours"],
    service: "criacao-de-sites",
    pick: l(
      "Para turismo, a referência é o Mabrouk Zanzibar: trabalho para cliente, a demonstração que fechou o contrato de um guia local.",
      "For tourism, the reference is Mabrouk Zanzibar: client work, the demo that won a local guide as a client.",
      "Para turismo, la referencia es Mabrouk Zanzibar: trabajo para cliente, la demostración que cerró el contrato de un guía local.",
    ),
    adapt: l(
      "Nele, cada passeio tem a sua apresentação e um planejador monta a mensagem de reserva. No seu site, o viajante poderia escolher a experiência, a data e o tamanho do grupo antes de escrever.",
      "In it, each experience has its own presentation and a planner builds the booking message. On your site, guests could choose a tour, date and group size before writing to you.",
      "En él, cada experiencia tiene su presentación y un planificador arma el mensaje de reserva. En tu sitio, el viajero podría elegir el tour, la fecha y el tamaño del grupo antes de escribirte.",
    ),
    ask: l("Você vende passeios fixos ou roteiros sob medida?", "Do you sell fixed tours or tailor-made itineraries?", "¿Vendes tours fijos o itinerarios a medida?"),
    options: {
      fixed: {
        label: l("Passeios fixos", "Fixed tours", "Tours fijos"),
        fact: l("passeios fixos", "fixed tours", "tours fijos"),
        reply: l(
          "Então cada passeio ganha a sua página e o pedido já sai com o passeio escolhido. O Rick confirma o escopo na proposta. Quer que eu monte o pedido?",
          "Then each tour gets its own page and the enquiry already carries the chosen tour. Rick confirms the scope in the proposal. Shall I build the request?",
          "Entonces cada tour tiene su página y la consulta ya sale con el tour elegido. Rick confirma el alcance en la propuesta. ¿Preparo la solicitud?",
        ),
      },
      custom: {
        label: l("Roteiros sob medida", "Tailor-made itineraries", "Itinerarios a medida"),
        fact: l("roteiros sob medida", "tailor-made itineraries", "itinerarios a medida"),
        reply: l(
          "Então o planejador vira o centro: o viajante monta o roteiro e você recebe o pedido com as escolhas. O Rick confirma o escopo na proposta. Quer que eu monte o pedido?",
          "Then the planner becomes the centre: guests build their itinerary and you receive the enquiry with their choices. Rick confirms the scope in the proposal. Shall I build the request?",
          "Entonces el planificador es el centro: el viajero arma su itinerario y recibes la consulta con sus elecciones. Rick confirma el alcance en la propuesta. ¿Preparo la solicitud?",
        ),
      },
    },
  },
  landing: {
    refs: ["kavita-drones", "terral", "atelier-vertex", "aurex-timepieces"],
    service: "landing-pages",
    pick: l("Para landing page, a referência é a Kavita Drones: trabalho para cliente, no ar.", "For a landing page, the reference is Kavita Drones: client work, live.", "Para una landing page, la referencia es Kavita Drones: trabajo para cliente, en línea."),
    adapt: l(
      "Nela, o comprador escolhe os equipamentos e a revenda recebe a lista no WhatsApp. O mesmo caminho serve para quem pede orçamento dos seus produtos ou serviços.",
      "On it, buyers choose equipment and the dealer gets their list on WhatsApp. The same path works for people asking for a quote on your products or services.",
      "En ella, el comprador elige equipos y el distribuidor recibe la lista por WhatsApp. El mismo camino sirve para quien pide cotización de tus productos o servicios.",
    ),
    ask: l("A página vai receber tráfego de anúncio ou apresentar um produto?", "Will the page receive ad traffic or present a product?", "¿La página recibirá tráfico de anuncios o presentará un producto?"),
    options: {
      ads: {
        label: l("Anúncio", "Ads", "Anuncios"),
        fact: l("página para tráfego de anúncio", "page for ad traffic", "página para tráfico de anuncios"),
        reply: l(
          "Então ela sai pronta para campanha: o serviço de landing pages do Rick entrega pixel da Meta, Google Analytics e eventos de conversão configurados. Quer que eu monte o pedido?",
          "Then it ships ready for campaigns: Rick's landing page service delivers Meta pixel, Google Analytics and conversion events configured. Shall I build the request?",
          "Entonces sale lista para campañas: el servicio de landing pages de Rick entrega pixel de Meta, Google Analytics y eventos de conversión configurados. ¿Preparo la solicitud?",
        ),
      },
      product: {
        label: l("Apresentar um produto", "Present a product", "Presentar un producto"),
        fact: l("página para apresentar um produto", "page to present a product", "página para presentar un producto"),
        reply: l(
          "Então o foco é a história do produto: uma página, um objetivo e o contato sempre a um toque. Quer que eu monte o pedido?",
          "Then the focus is the product's story: one page, one goal and contact always one tap away. Shall I build the request?",
          "Entonces el foco es la historia del producto: una página, un objetivo y el contacto siempre a un toque. ¿Preparo la solicitud?",
        ),
      },
    },
  },
  store: {
    refs: ["loja-de-iphone", "rjjstore", "loja-joias", "ecommerce-do-agro", "rjs-laticinios"],
    service: "loja-virtual",
    pick: l("Para loja, veja a Loja de iPhone Premium: uma demonstração de vitrine, não um trabalho para cliente.", "For a shop, see Loja de iPhone Premium: a storefront demonstration, not client work.", "Para una tienda, mira Loja de iPhone Premium: una demostración de escaparate, no un trabajo para cliente."),
    adapt: l("Ela mostra o produto em primeiro plano e leva o comprador até o pedido sem distração.", "It keeps the product in the foreground and takes the buyer to the order without distraction.", "Muestra el producto en primer plano y lleva al comprador al pedido sin distracciones."),
    ask: l("Você quer pagamento no próprio site ou fechar o pedido pelo WhatsApp?", "Do you want payment on the site itself or to close the order on WhatsApp?", "¿Quieres pago en el propio sitio o cerrar el pedido por WhatsApp?"),
    options: {
      checkout: {
        label: l("Pagamento no site", "Payment on the site", "Pago en el sitio"),
        fact: l("loja com pagamento no site", "shop with payment on the site", "tienda con pago en el sitio"),
        reply: l(
          "Então é uma loja com pagamento: catálogo, meios de pagamento e regiões atendidas são as primeiras definições, e os meios de pagamento o Rick confirma na proposta. Quer que eu monte o pedido?",
          "Then it is a shop with payment: catalogue, payment methods and delivery area are the first decisions, and Rick confirms the payment methods in the proposal. Shall I build the request?",
          "Entonces es una tienda con pago: catálogo, medios de pago y zonas de envío son las primeras definiciones, y los medios de pago los confirma Rick en la propuesta. ¿Preparo la solicitud?",
        ),
      },
      whatsapp: {
        label: l("Pedido pelo WhatsApp", "Order on WhatsApp", "Pedido por WhatsApp"),
        fact: l("catálogo com pedido pelo WhatsApp", "catalogue with orders on WhatsApp", "catálogo con pedido por WhatsApp"),
        reply: l(
          "Então é um catálogo: o cliente chega ao WhatsApp com produto e quantidade já escolhidos. Quer que eu monte o pedido?",
          "Then it is a catalogue: customers open WhatsApp with product and quantity already chosen. Shall I build the request?",
          "Entonces es un catálogo: el cliente llega a WhatsApp con el producto y la cantidad ya elegidos. ¿Preparo la solicitud?",
        ),
      },
    },
  },
  system: {
    refs: ["millead", "milsaca", "inkvision", "ecoa"],
    service: "sistemas-sob-medida",
    pick: l("Para sistemas, a referência é o MilLead: o CRM com IA que o Rick construiu para a própria MilWeb. É de uso interno, não um trabalho para cliente.", "For systems, the reference is MilLead: the AI-powered CRM Rick built for MilWeb itself. It is for internal use, not client work.", "Para sistemas, la referencia es MilLead: el CRM con IA que Rick construyó para la propia MilWeb. Es de uso interno, no un trabajo para cliente."),
    adapt: l("Ele organiza a prospecção do estúdio. No seu caso, o ponto de partida é uma tarefa repetitiva da equipe e a tela que acompanha cada pedido ou cliente.", "It runs the studio's own pipeline. In your case, the starting point is a repetitive task on your team and the screen that tracks each order or customer.", "Organiza la prospección del estudio. En tu caso, el punto de partida es una tarea repetitiva del equipo y la pantalla que sigue cada pedido o cliente."),
    ask: l("Qual tarefa a sua equipe repete hoje em planilha ou no WhatsApp?", "Which task does your team repeat today in a spreadsheet or on WhatsApp?", "¿Qué tarea repite hoy tu equipo en una planilla o por WhatsApp?"),
    options: {},
  },
  company: {
    refs: ["kavita-institucional", "lumen-architecture", "atelier-vertex"],
    service: "criacao-de-sites",
    pick: l("Para site de empresa, a referência é o Kavita Institucional: trabalho para cliente, no ar.", "For a company site, the reference is Kavita Institucional: client work, live.", "Para un sitio de empresa, la referencia es Kavita Institucional: trabajo para cliente, en línea."),
    adapt: l("Ele apresenta a empresa e as áreas de atuação. No seu, cada serviço pode reunir o que você entrega, uma referência de trabalho e um contato direto.", "It introduces the business and its areas of work. On yours, each service could bring together what you deliver, an example of your work and a direct contact.", "Presenta la empresa y sus áreas de trabajo. En el tuyo, cada servicio puede reunir lo que entregas, un ejemplo y un contacto directo."),
    ask: l("O site precisa mais apresentar a empresa ou gerar pedidos de orçamento?", "Should the site mainly introduce the company or generate quote requests?", "¿El sitio debe sobre todo presentar la empresa o generar solicitudes de cotización?"),
    options: {
      present: {
        label: l("Apresentar a empresa", "Introduce the company", "Presentar la empresa"),
        fact: l("apresentar a empresa", "introduce the company", "presentar la empresa"),
        reply: l("Então a estrutura parte de quem vocês são e do que entregam, com prova de trabalho em cada serviço. Quer que eu monte o pedido?", "Then the structure starts from who you are and what you deliver, with proof of work in each service. Shall I build the request?", "Entonces la estructura parte de quiénes son y qué entregan, con prueba de trabajo en cada servicio. ¿Preparo la solicitud?"),
      },
      quotes: {
        label: l("Gerar orçamentos", "Generate quote requests", "Generar cotizaciones"),
        fact: l("gerar pedidos de orçamento", "generate quote requests", "generar solicitudes de cotización"),
        reply: l("Então cada página termina num pedido de orçamento já preenchido com o serviço escolhido. Quer que eu monte o pedido?", "Then each page ends in a quote request already filled in with the chosen service. Shall I build the request?", "Entonces cada página termina en una solicitud de cotización ya rellenada con el servicio elegido. ¿Preparo la solicitud?"),
      },
    },
  },
  food: {
    refs: ["terral", "rjs-laticinios"],
    service: "criacao-de-sites",
    pick: l("Para café e gastronomia, veja a TERRAL: uma demonstração para uma torrefação artesanal, não um trabalho para cliente.", "For coffee and food, see TERRAL: a demonstration for an artisanal coffee roastery, not client work.", "Para café y gastronomía, mira TERRAL: una demostración para un tostadero artesanal, no un trabajo para cliente."),
    adapt: l("Ela conta o produto em cinco capítulos, do grão à xícara. A mesma narrativa serve para mostrar de onde vem o que você vende.", "It tells the product in five chapters, from bean to cup. The same narrative works to show where what you sell comes from.", "Cuenta el producto en cinco capítulos, del grano a la taza. La misma narrativa sirve para mostrar de dónde viene lo que vendes."),
    ask: null,
    options: {},
  },
  immersive: {
    refs: ["aurex-timepieces", "aurex-motors", "as-copas", "age-of-dragons", "nexus-geek"],
    service: "landing-pages",
    pick: l("Se a ideia é impacto visual, veja a AUREX TIMEPIECES: uma demonstração com um relógio em 3D que se desmonta com a rolagem.", "If the goal is visual impact, see AUREX TIMEPIECES: a demonstration with a 3D watch that comes apart as you scroll.", "Si la idea es impacto visual, mira AUREX TIMEPIECES: una demostración con un reloj en 3D que se desmonta con el scroll."),
    adapt: l("O efeito existe para explicar o produto por dentro, não para enfeitar.", "The effect is there to explain the product from the inside, not to decorate.", "El efecto existe para explicar el producto por dentro, no para adornar."),
    ask: null,
    options: {},
  },
} as const;

export type SectorId = keyof typeof sectors;

/** Só o idioma ativo vai no payload, como no resto do OS. */
export function buildMateria(locale: Locale) {
  const pick = <T extends Record<string, L>>(group: T) => Object.fromEntries(Object.entries(group).map(([k, v]) => [k, v[locale]])) as { [K in keyof T]: string };
  return {
    ui: pick(ui),
    say: pick(say),
    sectors: Object.fromEntries(
      Object.entries(sectors).map(([id, s]) => [
        id,
        {
          refs: [...s.refs] as string[],
          service: s.service as string,
          pick: s.pick[locale],
          adapt: s.adapt[locale],
          adaptOther: "adaptOther" in s ? s.adaptOther[locale] : null,
          ask: s.ask ? s.ask[locale] : null,
          options: Object.fromEntries(Object.entries(s.options as Record<string, { label: L; fact: L; reply: L }>).map(([k, o]) => [k, { label: o.label[locale], fact: o.fact[locale], reply: o.reply[locale] }])),
        },
      ]),
    ) as Record<SectorId, { refs: string[]; service: string; pick: string; adapt: string; adaptOther: string | null; ask: string | null; options: Record<string, { label: string; fact: string; reply: string }> }>,
  };
}

export type MateriaData = ReturnType<typeof buildMateria>;
