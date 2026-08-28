import type { Localized } from "@/lib/content";

/** /studio — MilWeb + Rick. Manifesto, processo, princípios. */
export const STUDIO = {
  meta: {
    title: { pt: "Estúdio — MilWeb, desenvolvimento criativo", en: "Studio — MilWeb, creative development", es: "Estudio — MilWeb, desarrollo creativo" } as Localized,
    description: {
      pt: "MilWeb é um estúdio de creative development no Brasil, fundado por Rick Januario: design, código, motion e WebGL em experiências digitais autorais.",
      en: "MilWeb is a creative development studio in Brazil, founded by Rick Januario: design, code, motion and WebGL in original digital experiences.",
      es: "MilWeb es un estudio de creative development en Brasil, fundado por Rick Januario: diseño, código, motion y WebGL en experiencias digitales propias.",
    } as Localized,
  },
  manifesto: ["WE BUILD", "DIGITAL", "EXPERIENCES."],
  intro: {
    pt: "MilWeb é um estúdio de uma pessoa com ambição de muitas. Design, código, motion e WebGL saem da mesma mão — do primeiro wireframe ao deploy — o que significa que nada se perde na tradução entre quem imagina e quem constrói.",
    en: "MilWeb is a one-person studio with the ambition of many. Design, code, motion and WebGL come from the same hands — from first wireframe to deploy — which means nothing gets lost in translation between the one who imagines and the one who builds.",
    es: "MilWeb es un estudio de una sola persona con la ambición de muchas. Diseño, código, motion y WebGL salen de la misma mano —del primer wireframe al deploy—, lo que significa que nada se pierde en la traducción entre quien imagina y quien construye.",
  } as Localized,
  beliefs: {
    eyebrow: { pt: "No que acreditamos", en: "What we believe", es: "En qué creemos" } as Localized,
    items: [
      { n: "01", title: { pt: "Código deve mover pessoas.", en: "Code should move people.", es: "El código debe mover a las personas." }, body: { pt: "Performance é design. Motion é linguagem. Se o visitante não sente nada, o site não fez o trabalho.", en: "Performance is design. Motion is language. If the visitor feels nothing, the site didn't do its job.", es: "Performance es diseño. Motion es lenguaje. Si el visitante no siente nada, el sitio no hizo su trabajo." } },
      { n: "02", title: { pt: "Cada elemento justifica sua existência.", en: "Every element earns its place.", es: "Cada elemento justifica su existencia." }, body: { pt: "Sem card pra encher espaço, sem partícula sem propósito, sem gradiente de IA. Se não comunica, sai.", en: "No cards to fill space, no purposeless particles, no AI gradients. If it doesn't communicate, it goes.", es: "Sin cards para llenar espacio, sin partículas sin propósito, sin gradientes de IA. Si no comunica, se va." } },
      { n: "03", title: { pt: "A tecnologia se percebe, não se lê.", en: "Technology is felt, not read.", es: "La tecnología se percibe, no se lee." }, body: { pt: "Ninguém precisa saber o que é um shader pra sentir a diferença. A stack fica no capítulo técnico.", en: "Nobody needs to know what a shader is to feel the difference. The stack lives in the technical chapter.", es: "Nadie necesita saber qué es un shader para sentir la diferencia. El stack se queda en el capítulo técnico." } },
      { n: "04", title: { pt: "Preciso, não \"bom o suficiente\".", en: "Precise, not \"good enough\".", es: "Preciso, no \"suficientemente bueno\"." }, body: { pt: "Line-height, tracking, easing, delay, widows. Revisado obsessivamente contra o build real, não contra a intenção.", en: "Line-height, tracking, easing, delay, widows. Obsessively reviewed against the real build, not the intent.", es: "Line-height, tracking, easing, delay, widows. Revisado obsesivamente contra el build real, no contra la intención." } },
    ] as { n: string; title: Localized; body: Localized }[],
  },
  process: {
    eyebrow: { pt: "Como trabalhamos", en: "How we work", es: "Cómo trabajamos" } as Localized,
    steps: [
      { n: "01", label: "STRUCTURE", body: { pt: "Briefing, arquitetura de conteúdo, sitemap. Entender o problema antes de desenhar a solução.", en: "Briefing, content architecture, sitemap. Understand the problem before designing the answer.", es: "Briefing, arquitectura de contenido, sitemap. Entender el problema antes de diseñar la solución." } },
      { n: "02", label: "DESIGN", body: { pt: "Direção criativa, tipografia, grid, tokens. Uma identidade reconhecível sem o logo.", en: "Creative direction, typography, grid, tokens. An identity recognisable without the logo.", es: "Dirección creativa, tipografía, grid, tokens. Una identidad reconocible sin el logo." } },
      { n: "03", label: "MOTION", body: { pt: "Hierarquia de movimento: narrativa, layout, micro. Nada anima sem intenção.", en: "Motion hierarchy: narrative, layout, micro. Nothing moves without intent.", es: "Jerarquía de movimiento: narrativa, layout, micro. Nada se anima sin intención." } },
      { n: "04", label: "INTERACTION", body: { pt: "Cursor, scroll, toque, teclado. Interações que têm função — e uma assinatura.", en: "Cursor, scroll, touch, keyboard. Interactions with a function — and a signature.", es: "Cursor, scroll, toque, teclado. Interacciones que tienen función — y una firma." } },
      { n: "05", label: "EXPERIENCE", body: { pt: "WebGL, shaders e física onde agregam impacto real; fallback onde não cabem.", en: "WebGL, shaders and physics where they add real impact; fallbacks where they don't fit.", es: "WebGL, shaders y física donde suman impacto real; fallback donde no caben." } },
      { n: "06", label: "SHIP", body: { pt: "Performance, acessibilidade, SEO, QA em navegadores e dispositivos. Contrato, deploy e suporte pós-entrega.", en: "Performance, accessibility, SEO, cross-browser and device QA. Contract, deploy and post-launch support.", es: "Performance, accesibilidad, SEO, QA en navegadores y dispositivos. Contrato, deploy y soporte posentrega." } },
    ] as { n: string; label: string; body: Localized }[],
  },
  founder: {
    eyebrow: { pt: "Fundador", en: "Founder", es: "Fundador" } as Localized,
    body: {
      pt: "Rick Januario é desenvolvedor full-stack e creative developer. Constrói sites, sistemas e experiências para empresas no Brasil e projetos autorais que testam o limite do que a web consegue sentir. Trabalha remoto, com contrato, comunicação direta e código que fica com o cliente.",
      en: "Rick Januario is a full-stack and creative developer. He builds websites, systems and experiences for companies in Brazil, plus studio projects that test the limits of what the web can feel like. Works remotely, with a contract, direct communication and code the client keeps.",
      es: "Rick Januario es desarrollador full-stack y creative developer. Construye sitios, sistemas y experiencias para empresas en Brasil y proyectos propios que ponen a prueba el límite de lo que la web puede sentir. Trabaja remoto, con contrato, comunicación directa y código que se queda con el cliente.",
    } as Localized,
  },
  cta: { pt: "Ver serviços", en: "See services", es: "Ver servicios" } as Localized,
};

export const SERVICES_PAGE = {
  meta: {
    title: { pt: "Serviços — sites, landing pages, lojas e sistemas", en: "Services — websites, landing pages, stores and systems", es: "Servicios — sitios, landing pages, tiendas y sistemas" } as Localized,
    description: {
      pt: "O que a MilWeb entrega: sites institucionais, landing pages, catálogos para WhatsApp, lojas virtuais e sistemas sob medida. Orçamento gratuito e diagnóstico.",
      en: "What MilWeb delivers: company websites, landing pages, WhatsApp catalogs, online stores and custom systems. Free quote and audit.",
      es: "Lo que MilWeb entrega: sitios institucionales, landing pages, catálogos para WhatsApp, tiendas en línea y sistemas a medida. Presupuesto gratuito y diagnóstico.",
    } as Localized,
  },
  title: { pt: ["SERVIÇOS."], en: ["SERVICES."], es: ["SERVICIOS."] } as { pt: string[]; en: string[]; es: string[] },
  intro: {
    pt: "A parte comercial, sem rodeio: o que entregamos, como funciona, o que está incluso. Cada serviço tem a própria página com detalhes e perguntas frequentes.",
    en: "The commercial side, no detours: what we deliver, how it works, what's included. Each service has its own page with details and FAQ.",
    es: "La parte comercial, sin rodeos: qué entregamos, cómo funciona, qué está incluido. Cada servicio tiene su propia página con detalles y preguntas frecuentes.",
  } as Localized,
  list: { pt: "Serviços", en: "Services", es: "Servicios" } as Localized,
  deliverables: { pt: "O que você ganha", en: "What you get", es: "Lo que recibes" } as Localized,
  differentials: { pt: "Garantias", en: "Guarantees", es: "Garantías" } as Localized,
  audit: {
    eyebrow: { pt: "Diagnóstico gratuito", en: "Free audit", es: "Diagnóstico gratuito" } as Localized,
    title: { pt: "Quanto custa depender só de rede social?", en: "What does depending on social media alone cost?", es: "¿Cuánto cuesta depender solo de las redes sociales?" } as Localized,
    cta: { pt: "Abrir o diagnóstico", en: "Open the audit", es: "Abrir el diagnóstico" } as Localized,
  },
  quote: { pt: "Pedir orçamento", en: "Get a quote", es: "Pedir presupuesto" } as Localized,
};

export const CONTACT_PAGE = {
  meta: {
    title: { pt: "Contato — começar um projeto", en: "Contact — start a project", es: "Contacto — empezar un proyecto" } as Localized,
    description: {
      pt: "Fale com a MilWeb: WhatsApp, e-mail ou monte sua mensagem em dois cliques. Orçamento gratuito, resposta direta do Rick.",
      en: "Talk to MilWeb: WhatsApp, email or compose your message in two clicks. Free quote, direct reply from Rick.",
      es: "Habla con MilWeb: WhatsApp, correo o arma tu mensaje en dos clics. Presupuesto gratuito, respuesta directa de Rick.",
    } as Localized,
  },
  title: { pt: ["COMEÇAR", "UM PROJETO."], en: ["START", "A PROJECT."], es: ["EMPEZAR", "UN PROYECTO."] } as { pt: string[]; en: string[]; es: string[] },
  intro: {
    pt: "Sem formulário que ninguém preenche. Escolha o que precisa, veja a mensagem e mande no WhatsApp — ou escreva um e-mail.",
    en: "No form nobody fills in. Pick what you need, see the message and send it on WhatsApp — or write an email.",
    es: "Sin formularios que nadie llena. Elige lo que necesitas, revisa el mensaje y envíalo por WhatsApp — o escribe un correo.",
  } as Localized,
  channels: { pt: "Canais", en: "Channels", es: "Canales" } as Localized,
  send: { pt: "Enviar no WhatsApp", en: "Send on WhatsApp", es: "Enviar por WhatsApp" } as Localized,
  location: { pt: "Brasil · remoto · fuso GMT-3", en: "Brazil · remote · GMT-3", es: "Brasil · remoto · huso GMT-3" } as Localized,
};
