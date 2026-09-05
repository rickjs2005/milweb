import { PROJECTS_1 } from "./content-projects-1";
import { PROJECTS_2 } from "./content-projects-2";
import { PROJECTS_3 } from "./content-projects-3";
import { GH } from "./content-shared";
/**
 * Conteúdo do site MilWeb — fonte única, bilíngue (pt/en).
 * Posicionamento: freelancer full-stack que resolve o problema do cliente.
 * MilWeb aparece de forma discreta (marca pessoal, não agência).
 */

export type Locale = "pt" | "en" | "es";
/** Toda string de conteúdo existe nos três idiomas. Chave faltando = erro de build. */
export type Localized = { pt: string; en: string; es: string };

/**
 * Encurta um texto para a meta description (o Google corta perto de 160
 * caracteres e a frase aparece truncada no meio no resultado da busca).
 *
 * Fecha na última frase INTEIRA que couber; só quando nem a primeira frase
 * cabe é que corta na palavra e reticencia.
 *
 * Existe por causa dos cases: a description deles sai de `result`, que é
 * escrito para ser lido dentro da página (o maior tem 639 caracteres).
 * Encurtar o próprio `result` tiraria conteúdo de quem está lendo o case,
 * então o corte acontece só na saída para o buscador.
 */
export function searchDescription(text: string, limit = 160): string {
  if (text.length <= limit) return text;
  const head = text.slice(0, limit);
  const sentenceEnd = Math.max(
    head.lastIndexOf(". "),
    head.lastIndexOf("! "),
    head.lastIndexOf("? "),
  );
  // Um corte de frase muito no começo devolveria uma description curta
  // demais para descrever a página; nesse caso vale mais o corte por palavra.
  if (sentenceEnd >= 80) return text.slice(0, sentenceEnd + 1);
  const lastSpace = head.lastIndexOf(" ");
  return `${text.slice(0, lastSpace > 0 ? lastSpace : limit).trimEnd()}…`;
}

/** URL pública (sem barra final). Definir NEXT_PUBLIC_SITE_URL no Vercel.
 *  Blindado: env ausente, vazia ou malformada cai no domínio canônico —
 *  `new URL(SITE_URL)` roda a cada request no generateMetadata, e um valor
 *  inválido aqui derruba o site inteiro (aprendido em produção). */
const RAW_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim();
export const SITE_URL = (
  /^https?:\/\/\S+$/.test(RAW_SITE_URL) ? RAW_SITE_URL : "https://milweb.com.br"
).replace(/\/$/, "");

export const PROFILE = {
  name: "Rick",
  brand: "MilWeb",
  role: {
    pt: "Desenvolvedor de Sistemas Web & SaaS",
    en: "Web Systems & SaaS Developer",
    es: "Desarrollador de Sistemas Web y SaaS",
  } as Localized,
  headline: {
    pt: "Sites e sistemas que fazem seu negócio vender.",
    en: "Websites and systems that make your business sell.",
    es: "Sitios y sistemas que hacen que tu negocio venda.",
  } as Localized,
  /**
   * A linha de apoio do hero fala do resultado do cliente, não da minha
   * stack. A versão anterior ("desenvolvo plataformas, lojas e sistemas...")
   * descrevia o meu trabalho; quem contrata quer saber o que muda no negócio
   * dele. A tecnologia aparece mais abaixo, na seção de stack.
   */
  subtitle: {
    pt: "Seu cliente encontra você no Google, abre o site em menos de 2 segundos e fala com você no WhatsApp. É isso que eu construo.",
    en: "Your customer finds you on Google, opens your site in under 2 seconds and messages you on WhatsApp. That's what I build.",
    es: "Tu cliente te encuentra en Google, abre el sitio en menos de 2 segundos y te escribe por WhatsApp. Eso es lo que construyo.",
  } as Localized,
  location: { pt: "Brasil · 100% remoto", en: "Brazil · fully remote", es: "Brasil · 100% remoto" } as Localized,
  email: "rickjanuario0@gmail.com",
  // WhatsApp de trabalho (só dígitos, com DDI 55).
  whatsapp: "5533998779375",
  github: "https://github.com/rickjs2005",
  linkedin: "https://www.linkedin.com/in/rick-januario-41211b238",
  logo: "/logo-mw.png",
};

/** O QUE EU ENTREGO — a oferta concreta (resolve o problema do cliente). */
export type Deliverable = { icon: string; title: Localized; desc: Localized };
/**
 * Ordem e títulos falam do ganho, não da categoria técnica.
 *
 * Antes a lista abria em "SaaS & MVP sob medida" e "Sistemas Web", que são as
 * palavras mais caras e mais abstratas do site. Quem chega procurando um jeito
 * de receber mais orçamento tinha que descer até o quinto item para se
 * reconhecer. Agora começa pelo que a maioria vem buscar e termina no que é
 * mais raro e mais caro.
 */
export const DELIVERABLES: Deliverable[] = [
  {
    icon: "Rocket",
    title: { pt: "Receba mais orçamentos", en: "Get more enquiries", es: "Recibe más cotizaciones" },
    desc: { pt: "Landing page rápida, feita para transformar visita em conversa no WhatsApp. Sem formulário que ninguém preenche.", en: "A fast landing page built to turn a visit into a WhatsApp conversation. No forms nobody fills in.", es: "Landing page rápida, hecha para convertir visitas en conversaciones por WhatsApp. Sin formularios que nadie llena." },
  },
  {
    icon: "MessageCircle",
    title: { pt: "Venda pelo WhatsApp", en: "Sell on WhatsApp", es: "Vende por WhatsApp" },
    desc: { pt: "Catálogo com seus produtos e preços. O cliente monta o pedido sozinho e ele chega pronto no seu WhatsApp.", en: "A catalog with your products and prices. The customer builds the order and it lands ready in your WhatsApp.", es: "Catálogo con tus productos y precios. El cliente arma el pedido solo y llega listo a tu WhatsApp." },
  },
  {
    icon: "AppWindow",
    title: { pt: "Apareça no Google", en: "Show up on Google", es: "Aparece en Google" },
    desc: { pt: "Site institucional que carrega em menos de 2 segundos e é encontrado por quem procura o que você vende.", en: "A company site that loads in under 2 seconds and gets found by people searching for what you sell.", es: "Sitio institucional que carga en menos de 2 segundos y lo encuentran quienes buscan lo que vendes." },
  },
  {
    icon: "LayoutDashboard",
    title: { pt: "Pare de controlar tudo no caderno", en: "Stop running it all on paper", es: "Deja de controlar todo en un cuaderno" },
    desc: { pt: "Painel com produtos, pedidos, estoque e clientes num lugar só, com acesso separado para cada pessoa da equipe.", en: "A dashboard with products, orders, stock and customers in one place, with separate access for each team member.", es: "Panel con productos, pedidos, inventario y clientes en un solo lugar, con acceso separado para cada persona del equipo." },
  },
  {
    icon: "Zap",
    title: { pt: "Automatize o atendimento", en: "Automate your customer service", es: "Automatiza la atención" },
    desc: { pt: "Fluxos que respondem, cobram e organizam sozinhos: WhatsApp, e-mail, integrações e recursos com IA.", en: "Flows that reply, follow up and organise on their own: WhatsApp, email, integrations and AI features.", es: "Flujos que responden, cobran y organizan solos: WhatsApp, correo, integraciones y funciones con IA." },
  },
  {
    icon: "Boxes",
    title: { pt: "Tire seu produto do papel", en: "Get your product off the ground", es: "Saca tu producto del papel" },
    desc: { pt: "Sistema ou SaaS sob medida quando nada pronto no mercado resolve. Multi-tenant, seguro e pronto para crescer.", en: "A custom system or SaaS when nothing off the shelf solves it. Multi-tenant, secure and ready to grow.", es: "Sistema o SaaS a medida cuando nada listo en el mercado lo resuelve. Multi-tenant, seguro y listo para crecer." },
  },
];

/** POR QUE ME CONTRATAR — diferenciais (com prova no scroll). */
export type Differential = { icon: string; title: Localized; desc: Localized };
export const DIFFERENTIALS: Differential[] = [
  { icon: "ShieldCheck", title: { pt: "Contrato de garantia", en: "Service contract", es: "Contrato de garantía" }, desc: { pt: "Todo projeto fechado com contrato e assinatura eletrônica. Sua garantia de entrega, por escrito.", en: "Every project closed with a contract and e-signature. Your delivery guarantee, in writing.", es: "Todo proyecto se cierra con contrato y firma electrónica. Tu garantía de entrega, por escrito." } },
  { icon: "Code2", title: { pt: "Código limpo", en: "Clean code", es: "Código limpio" }, desc: { pt: "Organizado e documentado, fácil de manter e evoluir depois.", en: "Organized and documented, easy to maintain and grow later.", es: "Organizado y documentado, fácil de mantener y evolucionar después." } },
  { icon: "Gauge", title: { pt: "Performance", en: "Performance", es: "Performance" }, desc: { pt: "Sites rápidos que não perdem cliente no carregamento.", en: "Fast sites that don't lose customers while loading.", es: "Sitios rápidos que no pierden clientes en la carga." } },
  { icon: "Search", title: { pt: "SEO técnico", en: "Technical SEO", es: "SEO técnico" }, desc: { pt: "Estrutura pronta pra aparecer no Google.", en: "Structure ready to rank on Google.", es: "Estructura lista para aparecer en Google." } },
  { icon: "TrendingUp", title: { pt: "Escalabilidade", en: "Scalability", es: "Escalabilidad" }, desc: { pt: "Arquitetura que cresce junto com o seu negócio.", en: "Architecture that grows with your business.", es: "Arquitectura que crece junto con tu negocio." } },
  { icon: "Sparkles", title: { pt: "Experiência do usuário", en: "User experience", es: "Experiencia de usuario" }, desc: { pt: "Interfaces bonitas e fáceis, pensadas pra quem vai usar.", en: "Beautiful, easy interfaces designed for the people who'll actually use them.", es: "Interfaces bonitas y fáciles, pensadas para quien las va a usar." } },
  { icon: "Timer", title: { pt: "Entrega rápida", en: "Fast delivery", es: "Entrega rápida" }, desc: { pt: "Prazos realistas e comunicação direta, sem enrolação.", en: "Realistic deadlines and direct communication, no fuss.", es: "Plazos realistas y comunicación directa, sin rodeos." } },
  { icon: "LifeBuoy", title: { pt: "Suporte pós-entrega", en: "Post-launch support", es: "Soporte posentrega" }, desc: { pt: "Suporte gratuito após a entrega para ajustes e correções. Você não fica na mão.", en: "Free support after launch for tweaks and fixes. You're never left stranded.", es: "Soporte gratuito después de la entrega para ajustes y correcciones. No te quedas solo." } },
];

/** PROJETOS — reframe pró-cliente (o que o projeto resolve). */
export type Project = {
  slug: string;
  title: string;
  /**
   * Categoria do filtro na seção Projetos e no acervo /projetos.
   *
   * ESPELHA o catálogo de produtos do MilLead (pedido do Rick, 01/08 —
   * packages/database/prisma/seed-data/finance.ts, PRODUCTS): o visitante
   * filtra pelo MESMO produto que aparece no orçamento. Rankear pela
   * descrição do produto: essencial = 1 página focada em conversão;
   * landing premium = one-pager com scroll cinematográfico/3D;
   * institucional premium = site de empresa com design exclusivo;
   * sistema = aplicação com backend (SaaS, lojas, apps).
   */
  category:
    | "landing-essencial"
    | "landing-premium"
    | "institucional"
    | "institucional-premium"
    | "sistema-saas";
  tagline: Localized;
  problem: Localized;
  result: Localized;
  stack: string[];
  live?: string;
  repos?: { label: string; url: string }[];
  featured?: boolean;
  /** Card em destaque (carro-chefe) — renderizado grande e primeiro. */
  flagship?: boolean;
  /**
   * true = trabalho contratado e entregue para um cliente real.
   *
   * É o que separa a seção em dois blocos: entregas primeiro, projetos
   * autorais depois. Antes tudo dividia por categoria técnica (saas,
   * ecommerce...), o que não responde a única pergunta que um empresário faz
   * olhando o portfólio: "quanto disso é cliente de verdade?".
   *
   * Só marque quem pagou pelo trabalho. Produto próprio, base white-label,
   * ferramenta interna e estudo NÃO entram aqui, mesmo estando no ar.
   */
  clientWork?: boolean;
  /** Nome do cliente, exibido no selo do card de entrega. */
  clientName?: string;
  /**
   * true = sem card nas listagens (home e /projetos), mas a página de case
   * continua no ar. Uso: MilLead, que já se apresenta na seção de
   * diagnóstico/preço justo e é ferramenta interna — card duplicado só diluía.
   */
  hideFromLists?: boolean;
  /**
   * true = este projeto autoral aparece na home. Os demais vivem só em
   * /projetos e nas próprias páginas de case.
   *
   * A home renderizava os 20 autorais no servidor. Medido, o corte para 7
   * derruba o render de 878ms para 545ms e o HTML de 536KB para 348KB — é a
   * maior alavanca de performance do site, e de quebra resolve a diluição:
   * vinte demos ao lado de dois clientes reais faziam o visitante perguntar
   * se aqui se atende empresa ou se fazem experimentos.
   *
   * Nenhum projeto some: /projetos lista todos e continua no sitemap.
   */
  homeFeatured?: boolean;
  /** Métrica/fato de destaque do projeto (badge no card). Só fatos verdadeiros. */
  metric?: Localized;
  /**
   * true = a métrica é PROVA comercial real (cliente/em produção) → pílula em accent (loud).
   * Sem isso, a métrica é tratada como feature/trivia de demo → pílula calma/neutra.
   * Só marque quem for cliente real / em produção.
   */
  metricProof?: boolean;
  /** Status honesto do projeto (tag neutra): "Protótipo de estudo", "Em desenvolvimento"... */
  status?: Localized;
  /** Nota/ressalva curta exibida no card (ex.: protótipo de estudo, SaaS em dev). */
  note?: Localized;
  /** Screenshot real (alto) pro preview rolante. Sem imagem = preview estilizado. */
  image?: string;
  /** true = imagem estática inteira no card (sem rolagem), ex.: print de celular. */
  imageStatic?: boolean;
  /**
   * Aprofundamento técnico do case: arquitetura/decisões + destaques + galeria
   * de telas adicionais. Opcional — só nos projetos com repositório documentado.
   */
  caseStudy?: {
    /** Parágrafos técnicos (arquitetura, stack, decisões de engenharia). */
    narrative: Localized[];
    /** Destaques técnicos curtos, em cards (ex.: "Multi-tenant via RLS"). */
    highlights?: { label: Localized; detail: Localized }[];
    /** Screenshots extras (além do preview principal) mostrando outras telas. */
    gallery?: { src: string; alt: Localized }[];
  };
};
export const PROJECTS: Project[] = [...PROJECTS_1, ...PROJECTS_2, ...PROJECTS_3];

/** COMO EU TRABALHO — processo em 4 passos. */
export type Step = { n: string; title: Localized; desc: Localized };
/** Vídeos do Lab: animações autorais feitas 100% em código (Remotion). */
export type LabClip = {
  src: string;
  /** versão completa, com áudio (página /lab) */
  full: string;
  poster: string;
  title: Localized;
  desc: Localized;
  tags: (string | Localized)[];
};
export const LAB: LabClip[] = [
  {
    src: "/lab/cosmos.mp4",
    full: "/lab/full-cosmos.mp4",
    poster: "/lab/cosmos.jpg",
    title: { pt: "Cosmos", en: "Cosmos", es: "Cosmos" },
    desc: {
      pt: "Da Terra à teia cósmica: zoom-out contínuo com a Terra real da NASA em shader.",
      en: "From Earth to the cosmic web: a continuous zoom-out with NASA's real Earth in a shader.",
      es: "De la Tierra a la red cósmica: zoom-out continuo con la Tierra real de la NASA en shader.",
    },
    tags: ["Three.js", "WebGL", "GLSL"],
  },
  {
    src: "/lab/explosion.mp4",
    full: "/lab/full-explosion.mp4",
    poster: "/lab/explosion.jpg",
    title: { pt: "Element Explosion", en: "Element Explosion", es: "Element Explosion" },
    desc: {
      pt: "Um ponto de luz explode e vira interface, dashboard e devices, com física de partículas própria.",
      en: "A point of light explodes into interface, dashboard and devices, running on a custom particle system.",
      es: "Un punto de luz explota y se convierte en interfaz, dashboard y dispositivos, con física de partículas propia.",
    },
    tags: ["Remotion", "React", { pt: "Partículas", en: "Particles", es: "Partículas" }],
  },
  {
    src: "/lab/reel.mp4",
    full: "/lab/full-reel.mp4",
    poster: "/lab/reel.jpg",
    title: { pt: "Site em 30s", en: "Website in 30s", es: "Sitio en 30s" },
    desc: {
      pt: "Um site nascendo do zero: wireframe, componentes e dashboard, tudo animado em código.",
      en: "A website born from scratch: wireframe, components and dashboard, all animated in code.",
      es: "Un sitio naciendo desde cero: wireframe, componentes y dashboard, todo animado en código.",
    },
    tags: ["Remotion", "TypeScript", "60fps"],
  },
  {
    src: "/lab/unveil.mp4",
    full: "/lab/full-unveil.mp4",
    poster: "/lab/unveil.jpg",
    title: { pt: "Revelação de Produto", en: "Product Reveal", es: "Revelación de Producto" },
    desc: {
      pt: "Um enxame de partículas se monta em um smartphone 3D: vidro, titânio e uma explosão de luz revelando o aparelho.",
      en: "A swarm of particles assembles into a 3D smartphone: glass, titanium and a burst of light revealing the device.",
      es: "Un enjambre de partículas se ensambla en un smartphone 3D: vidrio, titanio y una explosión de luz que revela el dispositivo.",
    },
    tags: ["React Three Fiber", "GLSL", "GSAP"],
  },
  {
    src: "/lab/timescale.mp4",
    full: "/lab/full-timescale.mp4",
    poster: "/lab/timescale.jpg",
    title: { pt: "Escala do Tempo", en: "Timescale", es: "Escala del Tiempo" },
    desc: {
      pt: "Do tique de um segundo à história da humanidade até a Terra vista do espaço. Uma jornada sobre o valor do tempo, renderizada em shader.",
      en: "From the tick of a second to the history of humankind to Earth seen from space. A journey about the value of time, rendered in shader.",
      es: "Del tic de un segundo a la historia de la humanidad, hasta la Tierra vista desde el espacio. Un viaje sobre el valor del tiempo, renderizado en shader.",
    },
    tags: ["Three.js", "WebGL", "Shader"],
  },
  {
    src: "/lab/blackhole.mp4",
    full: "/lab/full-blackhole.mp4",
    poster: "/lab/blackhole.jpg",
    title: { pt: "Horizonte de Eventos", en: "Event Horizon", es: "Horizonte de Eventos" },
    desc: {
      pt: "Uma jornada em alta velocidade por estrelas e nebulosas até um buraco negro, com lente gravitacional e disco de acreção em física real e trilha sonora sintetizada em código.",
      en: "A high-speed journey through stars and nebulae into a black hole, with real gravitational lensing, accretion disk physics and a code-synthesized score.",
      es: "Un viaje a alta velocidad por estrellas y nebulosas hasta un agujero negro, con lente gravitacional y disco de acreción en física real y banda sonora sintetizada en código.",
    },
    tags: ["React Three Fiber", "GLSL", "Remotion"],
  },
];

/** Página /lab (destino de bio nas redes): strings próprias. */
export const LAB_PAGE = {
  metaTitle: {
    pt: "Lab MilWeb: animações e vídeos feitos 100% em código",
    en: "MilWeb Lab: animations and videos made 100% in code",
    es: "Lab MilWeb: animaciones y videos hechos 100% en código",
  },
  metaDescription: {
    pt: "Os filmes do Lab da MilWeb: universo, partículas e interfaces animados inteiramente em código com React, Remotion, Three.js e shaders. Veja como foram feitos.",
    en: "MilWeb Lab films: universe, particles and interfaces animated entirely in code with React, Remotion, Three.js and shaders. See how they were made.",
    es: "Las películas del Lab de MilWeb: universo, partículas e interfaces animados por completo en código con React, Remotion, Three.js y shaders. Mira cómo se hicieron.",
  },
  eyebrow: { pt: "Lab MilWeb", en: "MilWeb Lab", es: "Lab MilWeb" },
  title: { pt: "Feito de código,", en: "Made of code,", es: "Hecho de código," },
  titleHighlight: { pt: "do primeiro ao último frame", en: "from the first frame to the last", es: "del primer al último frame" },
  sub: {
    pt: "Nenhuma imagem de banco, nenhum editor de vídeo: cada frame destes filmes foi renderizado por código que eu escrevi. É a mesma engenharia que coloco nos projetos dos clientes.",
    en: "No stock footage, no video editor: every frame of these films was rendered by code I wrote. It's the same engineering I put into client projects.",
    es: "Ninguna imagen de banco, ningún editor de video: cada frame de estas películas fue renderizado por código que yo escribí. Es la misma ingeniería que pongo en los proyectos de los clientes.",
  },
  madeWith: { pt: "Feito com", en: "Made with", es: "Hecho con" },
  watchHint: { pt: "Toque para assistir com som", en: "Tap to watch with sound", es: "Toca para ver con sonido" },
  ctaTitle: { pt: "Quer esse nível de capricho no seu projeto?", en: "Want this level of craft in your project?", es: "¿Quieres este nivel de detalle en tu proyecto?" },
  ctaWhats: {
    pt: "Olá Rick! Vi os vídeos do Lab e quero algo nesse nível para minha marca.",
    en: "Hi Rick! I saw the Lab videos and want something at this level for my brand.",
    es: "¡Hola Rick! Vi los videos del Lab y quiero algo de ese nivel para mi marca.",
  },
  ctaButton: { pt: "Falar no WhatsApp", en: "Chat on WhatsApp", es: "Hablar por WhatsApp" },
  back: { pt: "Voltar para o site", en: "Back to the site", es: "Volver al sitio" },
} as const;

export const PROCESS: Step[] = [
  { n: "01", title: { pt: "Descoberta", en: "Discovery", es: "Descubrimiento" }, desc: { pt: "Entendo seu negócio, o problema e o objetivo. Sem isso, não começo.", en: "I understand your business, the problem and the goal. I don't start without it.", es: "Entiendo tu negocio, el problema y el objetivo. Sin eso, no empiezo." } },
  { n: "02", title: { pt: "Design & Protótipo", en: "Design & Prototype", es: "Diseño y Prototipo" }, desc: { pt: "Desenho a solução e a interface antes de codar. Você aprova a direção.", en: "I design the solution and the UI before coding. You approve the direction.", es: "Diseño la solución y la interfaz antes de programar. Tú apruebas la dirección." } },
  { n: "03", title: { pt: "Desenvolvimento", en: "Development", es: "Desarrollo" }, desc: { pt: "Construo com código limpo e atualizações frequentes do progresso.", en: "I build with clean code and frequent progress updates.", es: "Construyo con código limpio y actualizaciones frecuentes del avance." } },
  { n: "04", title: { pt: "Entrega & Suporte", en: "Launch & Support", es: "Entrega y Soporte" }, desc: { pt: "Coloco no ar, te explico como usar e dou suporte pós-entrega.", en: "I ship it, show you how to use it and provide post-launch support.", es: "Lo pongo en línea, te explico cómo usarlo y doy soporte posentrega." } },
];

/** TECNOLOGIAS. */
export const TECH: { group: Localized; items: string[] }[] = [
  { group: { pt: "Front-end", en: "Front-end", es: "Front-end" }, items: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Framer Motion", "GSAP"] },
  { group: { pt: "Back-end", en: "Back-end", es: "Back-end" }, items: ["Node.js", "PostgreSQL", "Supabase", "MySQL", "API REST", "Zod"] },
  { group: { pt: "Infra & Tools", en: "Infra & Tools", es: "Infra & Tools" }, items: ["Vercel", "Git / GitHub", "Figma", "Docker", "SEO", "CI/CD"] },
];

/** ESTATÍSTICAS — só números honestos/verificáveis. */
/**
 * Números que ajudam quem contrata a decidir, e que eu consigo provar.
 *
 * A tentação aqui é contar clientela ("+15 empresas atendidas"). Eu tenho
 * dois clientes, e inflar isso seria a única mentira do site. O que dá para
 * afirmar sem medo é o resto: os dois projetos entregues são para a mesma
 * empresa, que voltou; a nota do Lighthouse é auditoria do próprio Google e
 * está publicada logo abaixo; e o tempo de casa é real.
 *
 * "1 cliente" parece pequeno até vir acompanhado de "2 projetos": aí a
 * informação deixa de ser volume e vira recompra, que é o que um empresário
 * de fato quer saber.
 */
export const STATS: { value: number; suffix?: string; label: Localized }[] = [
  { value: 2, label: { pt: "Projetos entregues para o mesmo cliente", en: "Projects delivered to the same client", es: "Proyectos entregados al mismo cliente" } },
  { value: 100, label: { pt: "Lighthouse do Google, nas 4 notas", en: "Google Lighthouse, all 4 scores", es: "Lighthouse de Google, en las 4 notas" } },
  { value: 3, suffix: "+", label: { pt: "Anos construindo software", en: "Years building software", es: "Años construyendo software" } },
];

/** FAQ — perguntas reais de cliente freela. */
export const FAQ: { q: Localized; a: Localized }[] = [
  {
    q: { pt: "Quanto tempo leva um projeto?", en: "How long does a project take?", es: "¿Cuánto tarda un proyecto?" },
    a: { pt: "Depende do escopo: uma landing fica pronta em poucos dias; um sistema ou SaaS leva algumas semanas. Te passo um prazo realista logo no orçamento.", en: "It depends on scope: a landing in a few days; a system or SaaS in a few weeks. I give a realistic deadline upfront with the quote.", es: "Depende del alcance: una landing queda lista en pocos días; un sistema o SaaS toma algunas semanas. Te doy un plazo realista desde la cotización." },
  },
  {
    q: { pt: "Como funciona o orçamento e o pagamento?", en: "How do quotes and payment work?", es: "¿Cómo funcionan la cotización y el pago?" },
    a: { pt: "Orçamento gratuito e sob medida pra cada projeto. O pagamento costuma ser dividido (entrada + entrega). Sem surpresa: você aprova o valor antes de eu começar.", en: "Free, tailored quote per project. Payment is usually split (deposit + delivery). No surprises: you approve the price before I start.", es: "Cotización gratuita y a medida para cada proyecto. El pago suele dividirse (anticipo + entrega). Sin sorpresas: apruebas el valor antes de que yo empiece." },
  },
  {
    q: { pt: "O que está incluso e como funcionam as revisões?", en: "What's included and how do revisions work?", es: "¿Qué está incluido y cómo funcionan las revisiones?" },
    a: { pt: "Combinamos o escopo no início e incluo rodadas de ajuste até ficar do seu jeito, dentro do combinado. Tudo transparente.", en: "We agree on scope upfront and I include revision rounds until it's right, within what we agreed. All transparent.", es: "Acordamos el alcance al inicio e incluyo rondas de ajustes hasta que quede a tu gusto, dentro de lo acordado. Todo transparente." },
  },
  {
    q: { pt: "Você dá manutenção e suporte depois da entrega?", en: "Do you offer maintenance and support after delivery?", es: "¿Das mantenimiento y soporte después de la entrega?" },
    a: { pt: "Sim. Depois de no ar, dou suporte e ofereço planos de manutenção pra evoluir e cuidar do projeto.", en: "Yes. After launch I provide support and offer maintenance plans to keep the project growing.", es: "Sí. Una vez en línea, doy soporte y ofrezco planes de mantenimiento para evolucionar y cuidar el proyecto." },
  },
  {
    q: { pt: "Quais tecnologias você usa?", en: "Which technologies do you use?", es: "¿Qué tecnologías usas?" },
    a: { pt: "Stack moderna e sólida: Next.js, React, TypeScript, Tailwind, Node.js, PostgreSQL e Supabase. Uso o que for melhor pro seu caso.", en: "A modern, solid stack: Next.js, React, TypeScript, Tailwind, Node.js, PostgreSQL and Supabase. I use whatever fits your case best.", es: "Stack moderno y sólido: Next.js, React, TypeScript, Tailwind, Node.js, PostgreSQL y Supabase. Uso lo que sea mejor para tu caso." },
  },
  {
    q: { pt: "O código fica comigo?", en: "Do I own the code?", es: "¿El código es mío?" },
    a: { pt: "Fica. Ao final, o projeto e o código são seus, entregues e documentados.", en: "You do. At the end, the project and code are yours, delivered and documented.", es: "Sí. Al final, el proyecto y el código son tuyos, entregados y documentados." },
  },
];

/** PREÇO JUSTO — seção da home que mostra a calculadora de orçamento do
 * MilLead como prova de como o preço é montado. Substituiu o Raio-X no
 * fluxo da home quando ele ganhou página própria (/raio-x): a home ficou
 * com o argumento leve (transparência de preço) e o argumento denso
 * (dependência de redes) foi pra página dedicada. */
export const FAIR_PRICE = {
  eyebrow: { pt: "Como calculo seu orçamento", en: "How I price your project", es: "Cómo calculo tu cotización" },
  title: { pt: "Como o valor do projeto é calculado", en: "How the project price is calculated", es: "Cómo se calcula el valor del proyecto" },
  sub: {
    pt: "Antes de enviar qualquer proposta, eu calculo horas, infraestrutura e escopo. Você sabe exatamente pra onde vai cada real.",
    en: "Before any proposal goes out, I price hours, infrastructure and scope. You know exactly where every dollar goes.",
    es: "Antes de enviar cualquier propuesta, calculo horas, infraestructura y alcance. Sabes exactamente a dónde va cada centavo.",
  },
  bullets: [
    {
      title: { pt: "Horas por etapa", en: "Hours per stage", es: "Horas por etapa" },
      desc: { pt: "Design, código, SEO e testes entram na conta separados. Dá pra ver o tamanho real do trabalho.", en: "Design, code, SEO and testing are counted separately. You can see the real size of the work.", es: "Diseño, código, SEO y pruebas entran en la cuenta por separado. Se ve el tamaño real del trabajo." },
    },
    {
      title: { pt: "Infraestrutura sem surpresa", en: "No-surprise infrastructure", es: "Infraestructura sin sorpresas" },
      desc: { pt: "Hospedagem, banco e domínio aparecem no orçamento antes de virar cobrança. Nenhum custo escondido aparece depois.", en: "Hosting, database and domain show up in the quote before they ever become a bill. No hidden cost shows up later.", es: "Hosting, base de datos y dominio aparecen en la cotización antes de convertirse en cobro. Ningún costo oculto aparece después." },
    },
    {
      title: { pt: "Três faixas de preço", en: "Three price bands", es: "Tres rangos de precio" },
      desc: { pt: "O sistema me mostra o mínimo, o recomendado e o premium. Eu decido o valor final e te explico o porquê dele.", en: "The system shows me the minimum, the recommended and the premium. I set the final value and explain why.", es: "El sistema me muestra el mínimo, el recomendado y el premium. Yo decido el valor final y te explico el porqué." },
    },
  ],
  shotCaption: {
    pt: "Tela real do MilLead, o sistema que construí pra gerenciar a MilWeb (dados de demonstração).",
    en: "Real screen from MilLead, the system I built to run MilWeb (demo data).",
    es: "Pantalla real de MilLead, el sistema que construí para gestionar MilWeb (datos de demostración).",
  },
  cta: { pt: "Pedir meu orçamento", en: "Ask for my quote", es: "Pedir mi cotización" },
  ctaWhats: {
    pt: "Olá Rick! Quero um orçamento calculado pro meu projeto.",
    en: "Hi Rick! I want a properly calculated quote for my project.",
    es: "¡Hola Rick! Quiero una cotización calculada para mi proyecto.",
  },
  caseLink: { pt: "Conhecer o MilLead por dentro", en: "See MilLead from the inside", es: "Conocer MilLead por dentro" },
} as const;

/** DIAGNÓSTICO — conteúdo das seções 04 (o que está incluso) e 05 (CTA) da
 * página /diagnostico. As seções 01-03 reusam Dependency, Google e
 * FairPrice. */
export const DIAGNOSTICO = {
  /** Card-ponte na home, logo abaixo dos projetos (opção 3 do designer):
   * o diagnóstico apresentado como PRODUTO, entre "gostei do trabalho" e
   * "quero falar com você". */
  banner: {
    title: { pt: "Conheça o Diagnóstico MilWeb", en: "Meet the MilWeb Audit", es: "Conoce el Diagnóstico MilWeb" },
    text: {
      pt: "Uma análise rápida pra mostrar como sua empresa aparece na internet e quanto custa depender só das redes sociais.",
      en: "A quick analysis of how your company shows up online and what depending only on social media really costs.",
      es: "Un análisis rápido para mostrar cómo aparece tu empresa en internet y cuánto cuesta depender solo de las redes sociales.",
    },
    cta: { pt: "Explorar Diagnóstico", en: "Explore the audit", es: "Explorar el Diagnóstico" },
  },
  included: {
    eyebrow: { pt: "O que está incluso", en: "What's included", es: "Qué está incluido" },
    title: { pt: "Tudo isso faz parte do projeto", en: "All of this comes with the project", es: "Todo esto forma parte del proyecto" },
    sub: {
      pt: "Nada de item surpresa depois do contrato. O que segura um site de pé já entra no pacote.",
      en: "No surprise line items after the contract. Everything a site needs to stand is in the package.",
      es: "Nada de ítems sorpresa después del contrato. Lo que mantiene un sitio en pie ya viene en el paquete.",
    },
    items: [
      { icon: "Palette", title: { pt: "Design", en: "Design", es: "Diseño" }, desc: { pt: "Visual próprio, pensado pro seu público. Nada de template genérico.", en: "A look of your own, made for your audience. No generic template.", es: "Visual propio, pensado para tu público. Nada de plantillas genéricas." } },
      { icon: "Code2", title: { pt: "Desenvolvimento", en: "Development", es: "Desarrollo" }, desc: { pt: "Código feito à mão, rápido e fácil de evoluir depois.", en: "Hand-written code, fast and easy to grow later.", es: "Código hecho a mano, rápido y fácil de evolucionar después." } },
      { icon: "Search", title: { pt: "SEO", en: "SEO", es: "SEO" }, desc: { pt: "Estrutura pronta pra ser encontrada no Google.", en: "Structure built to be found on Google.", es: "Estructura lista para que te encuentren en Google." } },
      { icon: "Gauge", title: { pt: "Performance", en: "Performance", es: "Performance" }, desc: { pt: "Site abrindo em menos de 2 segundos, até no celular.", en: "Site loading in under 2 seconds, even on a phone.", es: "Sitio que abre en menos de 2 segundos, incluso en el celular." } },
      { icon: "Server", title: { pt: "Hospedagem", en: "Hosting", es: "Hosting" }, desc: { pt: "Configurada e no ar, sem você precisar entender de servidor.", en: "Set up and live, no server knowledge needed on your side.", es: "Configurado y en línea, sin que tengas que entender de servidores." } },
      { icon: "Globe", title: { pt: "Domínio", en: "Domain", es: "Dominio" }, desc: { pt: "Registro e configuração do seu endereço na internet.", en: "Registration and setup of your own web address.", es: "Registro y configuración de tu dirección en internet." } },
      { icon: "CheckCircle2", title: { pt: "Testes", en: "Testing", es: "Pruebas" }, desc: { pt: "Tudo conferido em celular, tablet e computador antes de entregar.", en: "Everything checked on phone, tablet and desktop before delivery.", es: "Todo revisado en celular, tablet y computadora antes de entregar." } },
      { icon: "BarChart3", title: { pt: "Analytics", en: "Analytics", es: "Analytics" }, desc: { pt: "Você enxerga quantas pessoas visitam e de onde elas vêm.", en: "You see how many people visit and where they come from.", es: "Ves cuántas personas visitan y de dónde vienen." } },
    ],
  },
  cta: {
    eyebrow: { pt: "Próximo passo", en: "Next step", es: "Siguiente paso" },
    title: { pt: "Vamos analisar seu negócio?", en: "Shall we analyze your business?", es: "¿Analizamos tu negocio?" },
    sub: {
      pt: "Me chama no WhatsApp e receba um diagnóstico gratuito, sem compromisso. Você sai da conversa sabendo o que precisa, quanto custa e por quê.",
      en: "Message me on WhatsApp for a free audit, no strings attached. You leave the conversation knowing what you need, what it costs and why.",
      es: "Escríbeme por WhatsApp y recibe un diagnóstico gratuito, sin compromiso. Sales de la conversación sabiendo qué necesitas, cuánto cuesta y por qué.",
    },
    button: { pt: "Receber diagnóstico gratuito", en: "Get my free audit", es: "Recibir diagnóstico gratuito" },
    whats: {
      pt: "Olá Rick! Quero um diagnóstico gratuito do meu negócio.",
      en: "Hi Rick! I'd like a free audit of my business.",
      es: "¡Hola Rick! Quiero un diagnóstico gratuito de mi negocio.",
    },
  },
} as const;

/** Textos de UI (rótulos, títulos de seção, nav). */
/**
 * SELETOR DE ORÇAMENTO — as duas perguntas da seção de contato.
 *
 * O visitante escolhe o que precisa e como está hoje, e essas escolhas
 * montam a mensagem que abre no WhatsApp. Não é formulário: nada é enviado
 * nem gravado, e escolher é opcional — sem nenhum clique o botão continua
 * levando a mensagem genérica de sempre (`fallback`).
 *
 * `phrase` existe porque o rótulo do chip não cabe na frase: o chip diz
 * "Loja virtual", a mensagem precisa dizer "Quero uma loja virtual".
 *
 * As chaves de `types` são os slugs de SERVICES (lib/services.ts) — assim a
 * página de cada serviço consegue já vir com o chip dela marcado.
 */
export const QUOTE = {
  typeQuestion: { pt: "O que você precisa?", en: "What do you need?", es: "¿Qué necesitas?" } as Localized,
  statusQuestion: { pt: "E hoje, o que você já tem?", en: "And what do you have today?", es: "Y hoy, ¿qué tienes ya?" } as Localized,
  types: [
    {
      key: "criacao-de-sites",
      label: { pt: "Site institucional", en: "Company site", es: "Sitio institucional" } as Localized,
      phrase: { pt: "Quero um site institucional", en: "I want a company site", es: "Quiero un sitio institucional" } as Localized,
    },
    {
      key: "loja-virtual",
      label: { pt: "Loja virtual", en: "Online store", es: "Tienda online" } as Localized,
      phrase: { pt: "Quero uma loja virtual", en: "I want an online store", es: "Quiero una tienda online" } as Localized,
    },
    {
      key: "catalogo-whatsapp",
      label: { pt: "Catálogo no WhatsApp", en: "WhatsApp catalog", es: "Catálogo para WhatsApp" } as Localized,
      phrase: { pt: "Quero um catálogo pra vender no WhatsApp", en: "I want a catalog to sell on WhatsApp", es: "Quiero un catálogo para vender por WhatsApp" } as Localized,
    },
    {
      key: "landing-pages",
      label: { pt: "Landing page", en: "Landing page", es: "Landing page" } as Localized,
      phrase: { pt: "Quero uma landing page", en: "I want a landing page", es: "Quiero una landing page" } as Localized,
    },
    {
      key: "sistemas-sob-medida",
      label: { pt: "Sistema sob medida", en: "Custom system", es: "Sistema a medida" } as Localized,
      phrase: { pt: "Quero um sistema sob medida", en: "I want a custom system", es: "Quiero un sistema a medida" } as Localized,
    },
  ],
  statuses: [
    {
      key: "nada",
      label: { pt: "Nada ainda", en: "Nothing yet", es: "Nada todavía" } as Localized,
      phrase: { pt: "ainda não tenho nada no ar", en: "I have nothing online yet", es: "todavía no tengo nada en línea" } as Localized,
    },
    {
      key: "redes",
      label: { pt: "Só redes sociais", en: "Only social media", es: "Solo redes sociales" } as Localized,
      phrase: { pt: "hoje só tenho redes sociais", en: "today I only have social media", es: "hoy solo tengo redes sociales" } as Localized,
    },
    {
      key: "site-antigo",
      label: { pt: "Um site antigo", en: "An old site", es: "Un sitio antiguo" } as Localized,
      phrase: { pt: "tenho um site antigo pra refazer", en: "I have an old site to rebuild", es: "tengo un sitio antiguo para rehacer" } as Localized,
    },
  ],
  /** Abertura e fecho que emolduram as frases escolhidas. */
  greeting: { pt: "Olá Rick! Vim pelo site da MilWeb.", en: "Hi Rick! I came from the MilWeb site.", es: "¡Hola Rick! Vengo del sitio de MilWeb." } as Localized,
  closing: { pt: "Pode me passar um orçamento?", en: "Could you send me a quote?", es: "¿Me puedes pasar una cotización?" } as Localized,
  /** Emenda das duas frases. Precisa ser bilíngue: com "e" fixo o inglês
   *  saía "I want an online store e today I only have social media". */
  joiner: { pt: " e ", en: " and ", es: " y " } as Localized,
  /** Mensagem de quem não escolheu nada — a mesma de antes do seletor existir. */
  fallback: {
    pt: "Olá Rick! Vim pelo site da MilWeb e quero um orçamento.",
    en: "Hi Rick! I came from the MilWeb site and I'd like a quote.",
    es: "¡Hola Rick! Vengo del sitio de MilWeb y quiero una cotización.",
  } as Localized,
  /** Rótulo do preview da mensagem, pra ninguém clicar sem saber o que envia. */
  previewLabel: { pt: "Sua mensagem", en: "Your message", es: "Tu mensaje" } as Localized,
} as const;

export const UI = {
  nav: {
    deliverables: { pt: "Serviços", en: "Services", es: "Servicios" },
    diagnosis: { pt: "Diagnóstico", en: "Audit", es: "Diagnóstico" },
    projects: { pt: "Projetos", en: "Projects", es: "Proyectos" },
    process: { pt: "Processo", en: "Process", es: "Proceso" },
    faq: { pt: "FAQ", en: "FAQ", es: "FAQ" },
    contact: { pt: "Contato", en: "Contact", es: "Contacto" },
  },
  hero: {
    /* A primeira linha da página não é lugar de cargo nem de stack. Quem lê é
       dono de negócio, e "dev full-stack · SaaS e sistemas web" só significa
       alguma coisa para outro desenvolvedor. */
    eyebrow: { pt: "Sites e sistemas para pequenas e médias empresas", en: "Websites and systems for small and medium businesses", es: "Sitios y sistemas para pequeñas y medianas empresas" },
    /* Os quatro ganhos concretos, logo abaixo do H1. É a resposta rápida para
       "esse cara faz o quê para a minha empresa?" antes de qualquer projeto. */
    benefits: [
      { pt: "Mais contatos no WhatsApp", en: "More WhatsApp enquiries", es: "Más contactos por WhatsApp" },
      { pt: "Mais visibilidade no Google", en: "More visibility on Google", es: "Más visibilidad en Google" },
      { pt: "Site abrindo em menos de 2 segundos", en: "Site loading in under 2 seconds", es: "Sitio que abre en menos de 2 segundos" },
      { pt: "Sistema sob medida para o seu negócio", en: "A system tailored to your business", es: "Sistema a medida para tu negocio" },
    ] as Localized[],
    // H1 em três partes: lead + destaque em gradiente + cauda (pode ser vazia).
    titleLead: { pt: "Seu site pode ser o melhor", en: "Your website can be your company's best", es: "Tu sitio puede ser el mejor" },
    titleHighlight: { pt: "vendedor", en: "salesperson", es: "vendedor" },
    titleTail: { pt: "da sua empresa", en: "", es: "de tu empresa" },
    ctaProjects: { pt: "Ver projetos", en: "View projects", es: "Ver proyectos" },
    // CTA secundário do hero (opção 4 do designer): quem ainda não está
    // pronto pra pedir orçamento entra primeiro no diagnóstico.
    ctaDiagnosis: { pt: "Ver diagnóstico", en: "See the audit", es: "Ver diagnóstico" },
    ctaWhats: { pt: "Falar no WhatsApp", en: "Chat on WhatsApp", es: "Hablar por WhatsApp" },
    available: { pt: "Disponível para novos projetos", en: "Available for new projects", es: "Disponible para nuevos proyectos" },
    miloHi: { pt: "Oi! Eu sou o Milo 👋", en: "Hi! I'm Milo 👋", es: "¡Hola! Soy Milo 👋" },
    /* Terminal-construtor do hero (hero-builder): o comando roda, cada
       etapa ganha ✓ e a seção correspondente do site-preview NASCE ao lado.
       A ORDEM importa: etapa i revela a seção i do preview (header → hero →
       produtos → conversão). Etapa e seção vivem juntas aqui pra tradução
       nunca dessincronizar da coreografia. */
    builder: {
      cmdBuild: { pt: "milweb build --premium", en: "milweb build --premium", es: "milweb build --premium" },
      steps: [
        { pt: "arquitetura responsiva", en: "responsive architecture", es: "arquitectura responsiva" },
        { pt: "design sob medida", en: "custom design", es: "diseño a medida" },
        { pt: "catálogo e preços", en: "catalog & pricing", es: "catálogo y precios" },
        { pt: "provas sociais", en: "social proof", es: "pruebas sociales" },
        { pt: "conversão via WhatsApp", en: "WhatsApp conversion", es: "conversión vía WhatsApp" },
      ] as Localized[],
      cmdDeploy: { pt: "milweb deploy", en: "milweb deploy", es: "milweb deploy" },
      url: { pt: "suaempresa.com.br", en: "yourbusiness.com", es: "tuempresa.com" },
      replay: { pt: "reexecutar", en: "replay", es: "reejecutar" },
      srSummary: {
        pt: "Demonstração: um terminal constrói um site premium — arquitetura responsiva, design sob medida, performance, SEO e conversão via WhatsApp — e publica em suaempresa.com.br.",
        en: "Demo: a terminal builds a premium website — responsive architecture, custom design, performance, SEO and WhatsApp conversion — and deploys it to yourbusiness.com.",
        es: "Demostración: una terminal construye un sitio premium — arquitectura responsiva, diseño a medida, performance, SEO y conversión vía WhatsApp — y lo publica en tuempresa.com.",
      },
      /* O site fictício que nasce no preview. "SUA EMPRESA" de propósito:
         o visitante se enxerga no lugar, sem inventar marca descartável.
         Produtos com nome+preço REAIS (não skeleton): o preview é a prova
         do serviço — precisa parecer loja de verdade, não wireframe. */
      preview: {
        brand: { pt: "SUA EMPRESA", en: "YOUR BUSINESS", es: "TU EMPRESA" },
        nav: [
          { pt: "Início", en: "Home", es: "Inicio" },
          { pt: "Produtos", en: "Products", es: "Productos" },
          { pt: "Contato", en: "Contact", es: "Contacto" },
        ] as Localized[],
        eyebrow: { pt: "Coleção nova", en: "New collection", es: "Nueva colección" },
        tagline: { pt: "Experiência premium para seus clientes.", en: "A premium experience for your customers.", es: "Experiencia premium para tus clientes." },
        sub: {
          pt: "Do primeiro clique à conversa no WhatsApp — rápido, bonito e no ar.",
          en: "From the first click to a WhatsApp chat — fast, beautiful and live.",
          es: "Del primer clic a la conversación por WhatsApp — rápido, bonito y en línea.",
        },
        heroCta: { pt: "Ver coleção", en: "View collection", es: "Ver colección" },
        products: [
          { name: { pt: "Produto 01", en: "Product 01", es: "Producto 01" }, price: "R$ 189" },
          { name: { pt: "Produto 02", en: "Product 02", es: "Producto 02" }, price: "R$ 249" },
          { name: { pt: "Produto 03", en: "Product 03", es: "Producto 03" }, price: "R$ 329" },
        ],
        rating: { pt: "4,9 · 132 avaliações", en: "4.9 · 132 reviews", es: "4,9 · 132 reseñas" },
        quote: {
          pt: "“Chegou em dois dias e a qualidade é absurda.”",
          en: "“Arrived in two days and the quality is unreal.”",
          es: "“Llegó en dos días y la calidad es increíble.”",
        },
        quoteAuthor: { pt: "Marina S. — cliente", en: "Marina S. — customer", es: "Marina S. — cliente" },
        cta: { pt: "Falar no WhatsApp", en: "Chat on WhatsApp", es: "Hablar por WhatsApp" },
      },
    },
    // Painel de produto codificado no lugar da imagem estática do hero —
    // um dashboard fictício de cliente, animado em CSS puro.
    panel: {
      store: { pt: "Painel da Loja Aurora", en: "Aurora Store dashboard", es: "Panel de la Tienda Aurora" },
      live: { pt: "no ar", en: "live", es: "en línea" },
      sales: { pt: "Vendas hoje", en: "Sales today", es: "Ventas hoy" },
      orders: { pt: "Pedidos", en: "Orders", es: "Pedidos" },
      conversion: { pt: "Conversão", en: "Conversion", es: "Conversión" },
      week: { pt: "Últimos 7 dias", en: "Last 7 days", es: "Últimos 7 días" },
      newOrder: { pt: "Novo pedido: R$ 189,90", en: "New order: $37.90", es: "Nuevo pedido: R$ 189,90" },
      viaGoogle: { pt: "cliente veio do Google", en: "customer came from Google", es: "cliente llegó desde Google" },
    },
  },
  sections: {
    deliverablesEyebrow: { pt: "O que eu faço", en: "What I do", es: "Qué hago" },
    deliverablesTitle: { pt: "O que eu entrego", en: "What I deliver", es: "Qué entrego" },
    deliverablesSub: { pt: "Do site simples ao sistema completo, eu resolvo o problema digital do seu negócio.", en: "From a simple site to a full system, I solve your business's digital problem.", es: "Del sitio simple al sistema completo, resuelvo el problema digital de tu negocio." },
    whyEyebrow: { pt: "Diferenciais", en: "Why me", es: "Diferenciales" },
    whyTitle: { pt: "Por que me contratar", en: "Why hire me", es: "Por qué contratarme" },
    whySub: { pt: "Não basta funcionar. Entrego um produto rápido, bonito e que dá resultado de verdade.", en: "Working isn't enough. I ship a product that's fast, polished and that actually delivers.", es: "No basta con que funcione. Entrego un producto rápido, bonito y que da resultados de verdad." },
    projectsEyebrow: { pt: "Trabalhos", en: "Work", es: "Trabajos" },
    projectsTitle: { pt: "Projetos & produtos", en: "Projects & products", es: "Proyectos y productos" },
    projectsSub: { pt: "Primeiro o que já está rodando para cliente pagante. Depois os projetos autorais, que é onde eu testo o que ainda não vendi.", en: "First what's already running for a paying client. Then the personal projects, where I test what I haven't sold yet.", es: "Primero lo que ya está funcionando para un cliente que paga. Después los proyectos propios, que es donde pruebo lo que todavía no vendí." },
    projectsLegendProof: { pt: "Cliente real · em produção", en: "Real client · in production", es: "Cliente real · en producción" },
    projectsLegendDemo: { pt: "Projeto autoral · demo/protótipo", en: "Personal project · demo/prototype", es: "Proyecto propio · demo/prototipo" },
    /* Cabeçalhos dos dois blocos. A divisão por cliente real x autoral responde
       a pergunta que o filtro por categoria técnica nunca respondeu: quanto
       disso aqui é trabalho contratado de verdade. */
    projectsClientTitle: { pt: "Entregue para cliente", en: "Delivered to a client", es: "Entregado a cliente" },
    projectsClientSub: { pt: "Trabalho contratado, pago e no ar. Os dois são para a mesma empresa: ela voltou para o segundo projeto.", en: "Contracted, paid and live. Both are for the same company: they came back for a second project.", es: "Trabajo contratado, pagado y en línea. Los dos son para la misma empresa: volvió para el segundo proyecto." },
    projectsOwnTitle: { pt: "Projetos autorais", en: "Personal projects", es: "Proyectos propios" },
    projectsOwnSub: { pt: "Produtos meus, bases white-label e estudos. Nenhum é cliente pagante, e estão aqui para mostrar alcance técnico, não volume de clientela.", en: "My own products, white-label bases and studies. None is a paying client; they're here to show technical range, not client volume.", es: "Productos míos, bases white-label y estudios. Ninguno es cliente que paga; están aquí para mostrar alcance técnico, no volumen de clientela." },
    projectsClientCount: { pt: "entregas", en: "deliveries", es: "entregas" },
    projectsSeeAll: { pt: "Ver todos os projetos", en: "See all projects", es: "Ver todos los proyectos" },
    /* Página /projetos — o acervo completo, fora da home. */
    projectsAllTitle: { pt: "Todos os projetos", en: "All projects", es: "Todos los proyectos" },
    projectsAllSub: { pt: "O acervo completo: as entregas para cliente e todos os projetos autorais, dos produtos às experiências em 3D.", en: "The full archive: client deliveries and every personal project, from products to 3D experiences.", es: "El acervo completo: las entregas a clientes y todos los proyectos propios, de los productos a las experiencias en 3D." },
    projectsBackHome: { pt: "Voltar para a home", en: "Back to home", es: "Volver al inicio" },
    projectsFilterAll: { pt: "Todos", en: "All", es: "Todos" },
    // Nomes idênticos aos produtos do catálogo do MilLead (finance.ts).
    projectsFilterLandingEssencial: { pt: "Landing Page Essencial", en: "Essential Landing Page", es: "Landing Page Esencial" },
    projectsFilterLandingPremium: { pt: "Landing Page Premium", en: "Premium Landing Page", es: "Landing Page Premium" },
    projectsFilterInstitucional: { pt: "Site Institucional", en: "Company Site", es: "Sitio Institucional" },
    projectsFilterInstitucionalPremium: { pt: "Site Institucional Premium", en: "Premium Company Site", es: "Sitio Institucional Premium" },
    projectsFilterSistemaSaas: { pt: "Sistema Web / SaaS", en: "Web System / SaaS", es: "Sistema Web / SaaS" },
    labEyebrow: { pt: "Lab", en: "Lab", es: "Lab" },
    labTitle: { pt: "Animações 100% em código", en: "Animations 100% in code", es: "Animaciones 100% en código" },
    labSub: {
      pt: "Não são vídeos prontos. São experiências desenvolvidas do zero com React, Three.js e shaders, o mesmo capricho técnico que vai para o seu projeto.",
      en: "These aren't stock videos. They're experiences built from scratch with React, Three.js and shaders, the same technical care that goes into your project.",
      es: "No son videos listos. Son experiencias desarrolladas desde cero con React, Three.js y shaders, el mismo cuidado técnico que va a tu proyecto.",
    },
    labCta: { pt: "Assistir com som e ver como foi feito", en: "Watch with sound and see how it was made", es: "Ver con sonido y descubrir cómo se hizo" },
    labCardCta: { pt: "Explorar projeto", en: "Explore project", es: "Explorar proyecto" },
    labScrollHint: { pt: "Role para explorar a vitrine", en: "Scroll to explore the showcase", es: "Desplázate para explorar la vitrina" },
    labMiloCenter: { pt: "Boa escolha, {title}! Clica de novo pra explorar 👀", en: "Nice pick, {title}! Click again to explore 👀", es: "¡Buena elección, {title}! Haz clic de nuevo para explorar 👀" },
    processEyebrow: { pt: "Como funciona", en: "How it works", es: "Cómo funciona" },
    processTitle: { pt: "Como eu trabalho", en: "How I work", es: "Cómo trabajo" },
    processSub: { pt: "Um processo claro, do primeiro contato ao suporte pós-entrega.", en: "A clear process, from first contact to post-launch support.", es: "Un proceso claro, del primer contacto al soporte posentrega." },
    techEyebrow: { pt: "Stack", en: "Stack", es: "Stack" },
    techTitle: { pt: "Tecnologias", en: "Technologies", es: "Tecnologías" },
    techSub: { pt: "As ferramentas que uso pra entregar do front ao deploy.", en: "The tools I use to ship from front-end to deploy.", es: "Las herramientas que uso para entregar del front al deploy." },
    faqEyebrow: { pt: "Dúvidas", en: "FAQ", es: "Dudas" },
    faqTitle: { pt: "Perguntas frequentes", en: "Frequently asked questions", es: "Preguntas frecuentes" },
    faqSub: { pt: "O que os clientes mais perguntam antes de começar.", en: "What clients ask most before starting.", es: "Lo que más preguntan los clientes antes de empezar." },
    aboutTitle: { pt: "Sobre a MilWeb", en: "About MilWeb", es: "Sobre MilWeb" },
    aboutBody: {
      pt: "MilWeb é a marca por trás do meu trabalho como desenvolvedor freelancer. Sou o Rick e cuido do seu projeto de ponta a ponta, do design ao código e ao deploy, com comunicação direta e foco no resultado do seu negócio.",
      en: "MilWeb is the brand behind my work as a freelance developer. I'm Rick, and I handle your project end to end, from design to code to deploy, with direct communication and a focus on your business results.",
      es: "MilWeb es la marca detrás de mi trabajo como desarrollador freelance. Soy Rick y me encargo de tu proyecto de punta a punta, del diseño al código y al deploy, con comunicación directa y foco en el resultado de tu negocio.",
    },
  },
  cta: {
    title: { pt: "Pronto para transformar sua ideia em um produto digital?", en: "Ready to turn your idea into a digital product?", es: "¿Listo para transformar tu idea en un producto digital?" },
    sub: { pt: "Me conta o que você precisa. Respondo rápido e te passo um orçamento gratuito, sem compromisso.", en: "Tell me what you need. I reply fast and send a free quote, no strings attached.", es: "Cuéntame qué necesitas. Respondo rápido y te paso una cotización gratuita, sin compromiso." },
    whats: { pt: "Falar no WhatsApp", en: "Chat on WhatsApp", es: "Hablar por WhatsApp" },
    email: { pt: "Enviar e-mail", en: "Send email", es: "Enviar correo" },
  },
  /* Selos de confiança honestos (sem preço/depoimento) — exibidos no ponto de
     conversão. Cada item é uma garantia real já oferecida (ver DIFFERENTIALS/FAQ). */
  trust: {
    contract: { pt: "Contrato de garantia", en: "Service contract", es: "Contrato de garantía" },
    support: { pt: "Suporte pós-entrega", en: "Post-launch support", es: "Soporte posentrega" },
    ownCode: { pt: "O código é seu", en: "You own the code", es: "El código es tuyo" },
    freeQuote: { pt: "Orçamento gratuito", en: "Free quote", es: "Cotización gratuita" },
  },
  labels: {
    caseStudy: { pt: "Ver case", en: "View case", es: "Ver case" },
    backToProjects: { pt: "Voltar aos projetos", en: "Back to projects", es: "Volver a los proyectos" },
    prev: { pt: "Anterior", en: "Previous", es: "Anterior" },
    next: { pt: "Próximo", en: "Next", es: "Siguiente" },
    /* Rótulos que só um leitor de tela lê. Ficam aqui, e não soltos no JSX,
       porque as duas versões do site saem prontas do build: string fixa em
       português era anunciada também em /en. */
    home: { pt: "MilWeb, início", en: "MilWeb, home", es: "MilWeb, inicio" },
    openMenu: { pt: "Abrir menu", en: "Open menu", es: "Abrir menú" },
    closeMenu: { pt: "Fechar menu", en: "Close menu", es: "Cerrar menú" },
    prevProject: { pt: "Projeto anterior", en: "Previous project", es: "Proyecto anterior" },
    nextProject: { pt: "Próximo projeto", en: "Next project", es: "Proyecto siguiente" },
    founder: { pt: "Fundador da MilWeb", en: "Founder of MilWeb", es: "Fundador de MilWeb" },
    viewLive: { pt: "Ver ao vivo", en: "Live demo", es: "Ver en vivo" },
    code: { pt: "Código", en: "Code", es: "Código" },
    problem: { pt: "Problema", en: "Problem", es: "Problema" },
    result: { pt: "Solução", en: "Solution", es: "Solución" },
    howItWasBuilt: { pt: "Como foi construído", en: "How it was built", es: "Cómo se construyó" },
    gallery: { pt: "Mais telas", en: "More screens", es: "Más pantallas" },
    rights: { pt: "Feito com Next.js e Tailwind.", en: "Built with Next.js and Tailwind.", es: "Hecho con Next.js y Tailwind." },
    footerNote: { pt: "Freelancer independente · fundador da MilWeb.", en: "Independent freelancer · founder of MilWeb.", es: "Freelancer independiente · fundador de MilWeb." },
    notFoundTitle: { pt: "Página não encontrada", en: "Page not found", es: "Página no encontrada" },
    notFoundBody: {
      pt: "O link mudou de lugar ou nunca existiu. Volta pra home ou dá uma olhada nos projetos.",
      en: "The link moved or never existed. Head back home or take a look at the projects.",
      es: "El enlace cambió de lugar o nunca existió. Vuelve al inicio o echa un vistazo a los proyectos.",
    },
    notFoundBackHome: { pt: "Voltar ao início", en: "Back to home", es: "Volver al inicio" },
    notFoundSeeProjects: { pt: "Ver projetos", en: "See projects", es: "Ver proyectos" },
    errorTitle: { pt: "Algo quebrou", en: "Something broke", es: "Algo se rompió" },
    errorBody: {
      pt: "Um erro inesperado aconteceu do meu lado. Tenta de novo — se continuar, me chama no WhatsApp.",
      en: "Something broke on my end. Try again — if it keeps happening, message me on WhatsApp.",
      es: "Ocurrió un error inesperado de mi lado. Intenta de nuevo — si continúa, escríbeme por WhatsApp.",
    },
    errorRetry: { pt: "Tentar de novo", en: "Try again", es: "Intentar de nuevo" },
  },
} satisfies Record<string, Record<string, unknown>>;

/** RAIO-X DA DEPENDÊNCIA — bloco interativo de conversão (calculadora +
 *  mini-dashboard). Argumento: depender só de rede social é risco; a saída
 *  é um site próprio (que é exatamente o que eu vendo). */
export const DEPENDENCY = {
  eyebrow: { pt: "Raio-X da dependência", en: "Dependency X-ray", es: "Radiografía de la dependencia" },
  title: {
    pt: "Depender só de rede social custa caro",
    en: "Relying only on social media gets expensive",
    es: "Depender solo de redes sociales sale caro",
  },
  sub: {
    pt: "O Instagram já ficou quase 7 horas fora do ar, levando as vendas junto. Veja o risco de operar 100% em plataformas alugadas e calcule o que um apagão custaria pra você.",
    en: "Instagram has already gone dark for almost 7 hours, taking sales with it. See the risk of running 100% on rented platforms and calculate what an outage would cost you.",
    es: "Instagram ya estuvo casi 7 horas fuera de línea, llevándose las ventas. Mira el riesgo de operar 100% en plataformas alquiladas y calcula lo que un apagón te costaría.",
  },
  calc: {
    title: { pt: "Calculadora de prejuízo", en: "Loss calculator", es: "Calculadora de pérdidas" },
    revenue: { pt: "Faturamento mensal", en: "Monthly revenue", es: "Facturación mensual" },
    ig: { pt: "Vendas que nascem no Instagram", en: "Sales born on Instagram", es: "Ventas que nacen en Instagram" },
    wa: { pt: "Vendas fechadas no WhatsApp", en: "Sales closed on WhatsApp", es: "Ventas cerradas por WhatsApp" },
    clients: { pt: "Clientes por mês", en: "Customers per month", es: "Clientes por mes" },
    duration: { pt: "Duração do apagão", en: "Outage length", es: "Duración del apagón" },
    h24: { pt: "24 horas", en: "24 hours", es: "24 horas" },
    d7: { pt: "7 dias", en: "7 days", es: "7 días" },
    lose: { pt: "Você perderia", en: "You'd lose", es: "Perderías" },
    loseSub: {
      pt: "em {duration} fora do ar, com {share}% das vendas presas em plataformas alugadas.",
      en: "in {duration} offline, with {share}% of sales locked inside rented platforms.",
      es: "en {duration} fuera de línea, con {share}% de las ventas atrapadas en plataformas alquiladas.",
    },
    orders: { pt: "Pedidos perdidos", en: "Lost orders", es: "Pedidos perdidos" },
    leads: { pt: "Leads que não chegam", en: "Leads that never arrive", es: "Leads que no llegan" },
    messages: { pt: "Mensagens sem resposta", en: "Unanswered messages", es: "Mensajes sin respuesta" },
    hours: { pt: "Horas de venda paradas", en: "Selling hours on hold", es: "Horas de venta detenidas" },
    note: {
      pt: "* Estimativa ilustrativa a partir dos valores informados.",
      en: "* Illustrative estimate based on your inputs.",
      es: "* Estimación ilustrativa a partir de los valores informados.",
    },
    milo0: {
      pt: "Parece pouco? Multiplica pelos apagões que acontecem todo ano.",
      en: "Looks small? Multiply it by the outages that happen every year.",
      es: "¿Parece poco? Multiplícalo por los apagones que ocurren cada año.",
    },
    milo1: {
      pt: "Não é pouco, né? E apagões reais já passaram de 6 horas.",
      en: "Not small, right? Real outages have lasted over 6 hours.",
      es: "No es poco, ¿verdad? Y los apagones reales ya superaron las 6 horas.",
    },
    milo2: {
      pt: "Dói só de calcular. Um site próprio não cai junto com o feed.",
      en: "It hurts just to calculate. Your own site doesn't go down with the feed.",
      es: "Duele solo de calcularlo. Un sitio propio no se cae junto con el feed.",
    },
    /* Diagnóstico gratuito: transforma o resultado em lead com contexto. */
    diagButton: { pt: "Gerar meu diagnóstico gratuito", en: "Get my free diagnosis", es: "Generar mi diagnóstico gratuito" },
    diagTitle: { pt: "Seu diagnóstico", en: "Your diagnosis", es: "Tu diagnóstico" },
    riskLabel: { pt: "Nota de risco do seu negócio", en: "Your business risk score", es: "Nota de riesgo de tu negocio" },
    rec1a: {
      pt: "Mais da metade das suas vendas nasce no Instagram. Prioridade nº 1: um canal de captura fora do feed, ou seja, site próprio com SEO.",
      en: "Over half of your sales are born on Instagram. Priority #1: an acquisition channel outside the feed, meaning your own website with SEO.",
      es: "Más de la mitad de tus ventas nace en Instagram. Prioridad n.º 1: un canal de captación fuera del feed, es decir, un sitio propio con SEO.",
    },
    rec1b: {
      pt: "Sua dependência de redes ainda é moderada, então é o melhor momento para construir o canal próprio antes que ela cresça.",
      en: "Your social dependency is still moderate, so this is the best moment to build your own channel before it grows.",
      es: "Tu dependencia de las redes todavía es moderada, así que es el mejor momento para construir tu canal propio antes de que crezca.",
    },
    rec2a: {
      pt: "Fechar tudo no WhatsApp não escala: com catálogo ou agendamento no site, o pedido chega pronto e o WhatsApp vira só o fechamento.",
      en: "Closing everything on WhatsApp doesn't scale: with a catalog or booking on your site, orders arrive ready and WhatsApp becomes just the closing step.",
      es: "Cerrar todo por WhatsApp no escala: con catálogo o agendamiento en el sitio, el pedido llega listo y WhatsApp queda solo para el cierre.",
    },
    rec2b: {
      pt: "Automatize a entrada de pedidos no site para o atendimento não virar gargalo quando as vendas crescerem.",
      en: "Automate order intake on your website so support doesn't become a bottleneck as sales grow.",
      es: "Automatiza la entrada de pedidos en el sitio para que la atención no se vuelva un cuello de botella cuando crezcan las ventas.",
    },
    rec3: {
      pt: "Um site otimizado transforma o Google em canal de aquisição contínuo, com clientes chegando sem depender de post.",
      en: "An optimized website turns Google into a continuous acquisition channel, with customers arriving without a single post.",
      es: "Un sitio optimizado convierte a Google en un canal de adquisición continuo, con clientes llegando sin depender de publicaciones.",
    },
    diagWhats: { pt: "Receber um plano no WhatsApp", en: "Get a plan on WhatsApp", es: "Recibir un plan por WhatsApp" },
    /** Reação do Milo do FAB quando o diagnóstico é gerado ({score}). */
    miloDiag0: {
      pt: "Nota {score}, tranquilo! Mas um site próprio garante 😉",
      en: "Score {score}, you're fine! But your own site seals it 😉",
      es: "Nota {score}, ¡tranquilo! Pero un sitio propio lo asegura 😉",
    },
    miloDiag1: {
      pt: "Nota {score} de dependência… dá pra melhorar, hein 🤔",
      en: "Dependency score {score}… room to improve, huh 🤔",
      es: "Nota {score} de dependencia… se puede mejorar, ¿eh? 🤔",
    },
    miloDiag2: {
      pt: "Eita, nota {score}?! Fala com o Rick AGORA 😱",
      en: "Whoa, score {score}?! Talk to Rick NOW 😱",
      es: "¡Uy! ¿Nota {score}? Habla con Rick AHORA 😱",
    },
    diagWhatsMsg: {
      pt: "Olá Rick! Fiz o diagnóstico no milweb.com.br → faturamento {revenue}/mês, {share}% das vendas em redes sociais, prejuízo estimado de {loss} em {duration} e nota de risco {score}/100. Quero um plano para ter meu site próprio.",
      en: "Hi Rick! I ran the diagnosis at milweb.com.br → {revenue}/month in revenue, {share}% of sales on social media, an estimated {loss} loss in {duration} and a {score}/100 risk score. I want a plan for my own website.",
      es: "¡Hola Rick! Hice el diagnóstico en milweb.com.br → facturación {revenue}/mes, {share}% de las ventas en redes sociales, pérdida estimada de {loss} en {duration} y nota de riesgo {score}/100. Quiero un plan para tener mi propio sitio.",
    },
    share: { pt: "Compartilhar resultado", en: "Share result", es: "Compartir resultado" },
    shareTitle1: { pt: "Se o Instagram cair amanhã,", en: "If Instagram goes down tomorrow,", es: "Si Instagram se cae mañana," },
    shareTitle2: { pt: "eu perderia", en: "I'd lose", es: "yo perdería" },
    shareSub: {
      pt: "em {duration}, com {share}% das vendas em redes sociais",
      en: "in {duration}, with {share}% of sales on social media",
      es: "en {duration}, con {share}% de las ventas en redes sociales",
    },
    shareFooter: { pt: "Calcule o seu → milweb.com.br", en: "Calculate yours → milweb.com.br", es: "Calcula el tuyo → milweb.com.br" },
    shareFile: { pt: "meu-diagnostico-milweb", en: "my-milweb-diagnosis", es: "mi-diagnostico-milweb" },
  },
  widgets: {
    risk: { pt: "Risco do negócio", en: "Business risk", es: "Riesgo del negocio" },
    riskHigh: { pt: "Risco alto", en: "High risk", es: "Riesgo alto" },
    /* Os quatro painéis são ilustrações com números fixos, não medição do
       visitante. O selo dizia "ao vivo" e o pulso vermelho reforçava —
       parecia telemetria real. */
    sample: { pt: "exemplo", en: "example", es: "ejemplo" },
    channels: { pt: "Dependência por canal", en: "Dependency by channel", es: "Dependencia por canal" },
    ownSite: { pt: "Site próprio", en: "Own website", es: "Sitio propio" },
    channelsNote: {
      pt: "Perfil típico de quem vende \"pelo direct\".",
      en: "Typical profile of a DM-driven business.",
      es: "Perfil típico de quien vende \"por mensaje directo\".",
    },
    salesOrigin: { pt: "Origem das vendas", en: "Where sales come from", es: "Origen de las ventas" },
    salesNote: {
      pt: "Divisão típica de quem ainda não tem site próprio.",
      en: "Typical split for a business with no site of its own.",
      es: "División típica de quien todavía no tiene sitio propio.",
    },
    referral: { pt: "Indicação", en: "Referrals", es: "Recomendación" },
    googleSite: { pt: "Google / site", en: "Google / website", es: "Google / sitio" },
    outage: { pt: "Simulação de apagão · 24h", en: "Outage simulation · 24h", es: "Simulación de apagón · 24h" },
    outageAxis: { pt: "Vendas/hora num dia comum", en: "Sales/hour on a normal day", es: "Ventas/hora en un día normal" },
    outageWindow: { pt: "janela do apagão", en: "outage window", es: "ventana del apagón" },
  },
  punch: {
    pt: "O único canal que é realmente seu é o seu site.",
    en: "The only channel you truly own is your website.",
    es: "El único canal que es realmente tuyo es tu sitio.",
  },
  cta: { pt: "Quero um site próprio", en: "I want my own website", es: "Quiero un sitio propio" },
  ctaWhats: {
    pt: "Olá! Usei a calculadora do milweb.com.br e quero um site próprio para o meu negócio.",
    en: "Hi! I used the calculator at milweb.com.br and I want my own website.",
    es: "¡Hola! Usé la calculadora de milweb.com.br y quiero un sitio propio para mi negocio.",
  },
};

/** O TESTE DO GOOGLE — SERP simulada que mostra concorrentes ocupando a
 *  posição do visitante. Templates usam {q}/{Q} (nicho minúsculo/capitalizado). */
export const GOOGLE_SIM = {
  eyebrow: { pt: "O teste do Google", en: "The Google test", es: "La prueba de Google" },
  title: {
    pt: "É assim que clientes procuram você agora",
    en: "This is how customers search for you right now",
    es: "Así es como los clientes te buscan ahora",
  },
  sub: {
    pt: "Digite o que você faz, ou escolha um exemplo, e veja quem aparece quando alguém pesquisa no Google.",
    en: "Type what you do, or pick an example, and see who shows up when someone searches on Google.",
    es: "Escribe lo que haces, o elige un ejemplo, y mira quién aparece cuando alguien busca en Google.",
  },
  placeholder: { pt: "Ex.: dentista, doceria, personal…", en: "E.g.: dentist, bakery, trainer…", es: "Ej.: dentista, pastelería, entrenador…" },
  search: { pt: "Buscar", en: "Search", es: "Buscar" },
  suggestions: {
    pt: "tatuador|advogada|restaurante|pet shop|arquiteto|loja de roupas",
    en: "tattoo artist|lawyer|restaurant|pet shop|architect|clothing store",
    es: "tatuador|abogada|restaurante|pet shop|arquitecto|tienda de ropa",
  },
  autorun: { pt: "tatuador", en: "tattoo artist", es: "tatuador" },
  emptyHint: { pt: "Os resultados aparecem aqui ✦", en: "Results show up here ✦", es: "Los resultados aparecen aquí ✦" },
  r1t: { pt: "{Q} perto de você | Agende online em 2 minutos", en: "{Q} near you | Book online in 2 minutes", es: "{Q} cerca de ti | Agenda online en 2 minutos" },
  r1d: {
    pt: "Atendimento profissional de {q} com horários online, avaliações verificadas e orçamento na hora. Referência na sua região.",
    en: "Professional {q} services with online booking, verified reviews and instant quotes. A local reference.",
    es: "Atención profesional de {q} con horarios online, reseñas verificadas y cotización al instante. Referencia en tu zona.",
  },
  r1r: { pt: "4,9 ★★★★★ (312)", en: "4.9 ★★★★★ (312)", es: "4,9 ★★★★★ (312)" },
  r2t: { pt: "Top 10 melhores profissionais de {q} em 2026", en: "Top 10 best {q} professionals in 2026", es: "Top 10 mejores profesionales de {q} en 2026" },
  r2d: {
    pt: "Comparamos preço, avaliações e tempo de resposta dos mais procurados. Veja quem lidera o ranking deste ano.",
    en: "We compared price, reviews and response time of the most searched. See who leads this year's ranking.",
    es: "Comparamos precio, reseñas y tiempo de respuesta de los más buscados. Mira quién lidera el ranking de este año.",
  },
  r3t: { pt: "{Q}: orçamento rápido pelo site", en: "{Q}: quick quote via website", es: "{Q}: cotización rápida por el sitio" },
  r3d: {
    pt: "Solicite orçamento sem sair do Google. Página otimizada, resposta automática e atendimento em minutos.",
    en: "Request a quote without leaving Google. Optimized page, automatic reply, service in minutes.",
    es: "Solicita una cotización sin salir de Google. Página optimizada, respuesta automática y atención en minutos.",
  },
  slotTitle: { pt: "Sua empresa poderia estar aqui.", en: "Your business could be right here.", es: "Tu empresa podría estar aquí." },
  slotSub: {
    pt: "Com um site otimizado, essa posição trabalha para você 24h, sem depender de post, story ou sorte.",
    en: "With an optimized website this spot works for you 24/7, with no posts, stories or luck required.",
    es: "Con un sitio optimizado, esta posición trabaja para ti 24h, sin depender de publicaciones, historias ni suerte.",
  },
  slotCta: { pt: "Quero aparecer no Google", en: "I want to show up on Google", es: "Quiero aparecer en Google" },
  slotWhats: {
    pt: "Olá! Fiz o teste do Google no milweb.com.br e quero aparecer nas buscas.",
    en: "Hi! I tried the Google test at milweb.com.br and I want to show up in searches.",
    es: "¡Hola! Hice la prueba de Google en milweb.com.br y quiero aparecer en las búsquedas.",
  },
  milo: {
    pt: "Sua empresa apareceu aí? Se não… seu concorrente apareceu.",
    en: "Did your business show up? If not… your competitor did.",
    es: "¿Apareció tu empresa ahí? Si no… apareció tu competidor.",
  },
};

/** MILO FAB — o mascote como botão flutuante de WhatsApp. */
export const MILO_FAB = {
  label: { pt: "Falar no WhatsApp", en: "Chat on WhatsApp", es: "Hablar por WhatsApp" },
  bubble: { pt: "Fala com o Rick 👋", en: "Talk to Rick 👋", es: "Habla con Rick 👋" },
  goodbye: {
    pt: "Até a próxima! Qualquer coisa, me chama aqui 👋",
    en: "See you next time! Ping me here anytime 👋",
    es: "¡Hasta la próxima! Cualquier cosa, escríbeme aquí 👋",
  },
  message: {
    pt: "Olá Rick! Vim pelo site da MilWeb e quero um orçamento.",
    en: "Hi Rick! I came from the MilWeb site and I'd like a quote.",
    es: "¡Hola Rick! Vengo del sitio de MilWeb y quiero una cotización.",
  },
};

/** Tour do Milo: o FAB comenta cada seção da home conforme o visitante
 * rola (uma fala por seção, uma vez por visita à página). */
export const MILO_TOUR: {
  id: string;
  pose?: "idle" | "think" | "shocked";
  text: Localized;
}[] = [
  { id: "deliverables", text: { pt: "Tudo isso o Rick faz pra você 👆", en: "Rick builds all of this for you 👆", es: "Todo esto lo hace Rick para ti 👆" } },
  { id: "why", text: { pt: "Por que ele? Já te mostro 😉", en: "Why him? Let me show you 😉", es: "¿Por qué él? Ya te muestro 😉" } },
  { id: "projects", text: { pt: "Projetos reais! Use os filtros pra achar o seu tipo 🚀", en: "Real projects! Use the filters to find your kind 🚀", es: "¡Proyectos reales! Usa los filtros para encontrar tu tipo 🚀" } },
  { id: "lab", pose: "shocked", text: { pt: "Essa é a vitrine de animações, tudo feito em código! ✨", en: "This is the animation showcase, all made in code! ✨", es: "¡Esta es la vitrina de animaciones, todo hecho en código! ✨" } },
  { id: "process", text: { pt: "É assim que o Rick trabalha, passo a passo 📋", en: "This is how Rick works, step by step 📋", es: "Así trabaja Rick, paso a paso 📋" } },
  { id: "tech", text: { pt: "As ferramentas do arsenal 🛠️", en: "The tools of the trade 🛠️", es: "Las herramientas del arsenal 🛠️" } },
  { id: "faq", text: { pt: "Dúvidas? A resposta deve estar aqui 💬", en: "Questions? The answer is probably here 💬", es: "¿Dudas? La respuesta debe estar aquí 💬" } },
  { id: "about", text: { pt: "Esse é o Rick, o humano da MilWeb 😄", en: "That's Rick, the human behind MilWeb 😄", es: "Ese es Rick, el humano de MilWeb 😄" } },
  { id: "contact", text: { pt: "Fala com o Rick e faz seu orçamento, é grátis! 👋", en: "Talk to Rick and get your quote, it's free! 👋", es: "Habla con Rick y pide tu cotización, ¡es gratis! 👋" } },
];

/** APAGÕES REAIS — mini-timeline de prova histórica dentro do Raio-X. */
export type OutageEvent = {
  date: Localized;
  title: Localized;
  value: number;
  suffix: Localized;
  statLabel: Localized;
  desc: Localized;
  color: string;
};
export const OUTAGE_EVENTS = {
  label: {
    pt: "Isso não é hipótese. Já aconteceu:",
    en: "This isn't hypothetical. It already happened:",
    es: "Esto no es una hipótesis. Ya pasó:",
  } as Localized,
  events: [
    {
      date: { pt: "04 out 2021", en: "Oct 4, 2021", es: "04 oct 2021" },
      title: { pt: "O dia em que a Meta sumiu", en: "The day Meta vanished", es: "El día en que Meta desapareció" },
      value: 7,
      suffix: { pt: "h", en: "h", es: "h" },
      statLabel: { pt: "fora do ar", en: "offline", es: "fuera de línea" },
      desc: {
        pt: "Facebook, Instagram e WhatsApp caíram juntos no mundo inteiro. Milhões de negócios ficaram mudos por quase 7 horas.",
        en: "Facebook, Instagram and WhatsApp went down together worldwide. Millions of businesses went silent for almost 7 hours.",
        es: "Facebook, Instagram y WhatsApp se cayeron juntos en todo el mundo. Millones de negocios quedaron mudos por casi 7 horas.",
      },
      color: "#fb7185",
    },
    {
      date: { pt: "18 jan 2025", en: "Jan 18, 2025", es: "18 ene 2025" },
      title: { pt: "TikTok apagado nos EUA", en: "TikTok switched off in the US", es: "TikTok apagado en EE. UU." },
      value: 170,
      suffix: { pt: " mi", en: "M", es: " M" },
      statLabel: { pt: "de usuários no escuro, da noite pro dia", en: "users in the dark, overnight", es: "de usuarios a oscuras, de la noche a la mañana" },
      desc: {
        pt: "Audiência construída por anos, congelada por uma decisão de governo. Quem só existia lá, sumiu junto.",
        en: "Audiences built over years, frozen by a government decision. Whoever only existed there vanished too.",
        es: "Audiencia construida durante años, congelada por una decisión de gobierno. Quien solo existía ahí, desapareció también.",
      },
      color: "#a78bfa",
    },
    {
      date: { pt: "Todos os anos", en: "Every year", es: "Todos los años" },
      title: { pt: "Contas banidas sem aviso", en: "Accounts banned without warning", es: "Cuentas bloqueadas sin aviso" },
      value: 100,
      suffix: { pt: "%", en: "%", es: "%" },
      statLabel: { pt: "das contas sujeitas a bloqueio", en: "of accounts subject to blocking", es: "de las cuentas sujetas a bloqueo" },
      desc: {
        pt: "Perfis são bloqueados por engano todos os dias, e o recurso pode levar semanas. Um site não é banido por robô de moderação.",
        en: "Profiles get blocked by mistake every day, and appeals can take weeks. A website can't be banned by a moderation bot.",
        es: "Perfiles bloqueados por error todos los días, y la apelación puede tardar semanas. A un sitio no lo banea un robot de moderación.",
      },
      color: "#fbbf24",
    },
  ] as OutageEvent[],
};

/** LIGHTHOUSE — prova técnica na seção de números. */
export const LIGHTHOUSE = {
  title: {
    pt: "Lighthouse deste site, a auditoria do próprio Google",
    en: "This site's Lighthouse, Google's own audit",
    es: "Lighthouse de este sitio, la auditoría del propio Google",
  } as Localized,
  note: {
    pt: "Nota máxima não é promessa: é o padrão de tudo que eu entrego.",
    en: "A perfect score isn't a promise: it's the baseline of everything I ship.",
    es: "La nota máxima no es una promesa: es el estándar de todo lo que entrego.",
  } as Localized,
  labels: {
    perf: { pt: "Performance", en: "Performance", es: "Performance" },
    a11y: { pt: "Acessibilidade", en: "Accessibility", es: "Accesibilidad" },
    best: { pt: "Boas práticas", en: "Best practices", es: "Buenas prácticas" },
    seo: { pt: "SEO", en: "SEO", es: "SEO" },
  },
};
