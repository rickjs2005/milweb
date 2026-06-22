/**
 * Conteúdo do site MilWeb — fonte única, bilíngue (pt/en).
 * Posicionamento: freelancer full-stack que resolve o problema do cliente.
 * MilWeb aparece de forma discreta (marca pessoal, não agência).
 */

export type Locale = "pt" | "en";
export type Localized = { pt: string; en: string };

/** URL pública (sem barra final). Definir NEXT_PUBLIC_SITE_URL no Vercel. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://milweb.vercel.app"
).replace(/\/$/, "");

export const PROFILE = {
  name: "Rick",
  brand: "MilWeb",
  role: {
    pt: "Desenvolvedor de Sistemas Web & SaaS",
    en: "Web Systems & SaaS Developer",
  } as Localized,
  headline: {
    pt: "Transformo processos, operações e ideias em produtos digitais que geram resultado.",
    en: "I turn processes, operations and ideas into digital products that drive results.",
  } as Localized,
  subtitle: {
    pt: "Desenvolvo plataformas SaaS, sistemas internos e aplicações web modernas para empresas que precisam de velocidade, performance e escalabilidade.",
    en: "I build SaaS platforms, internal systems and modern web applications for companies that need speed, performance and scalability.",
  } as Localized,
  location: { pt: "Brasil · 100% remoto", en: "Brazil · fully remote" } as Localized,
  email: "rickjanuario0@gmail.com",
  // WhatsApp de trabalho (só dígitos, com DDI 55).
  whatsapp: "5533998779375",
  github: "https://github.com/rickjs2005",
  linkedin: "https://www.linkedin.com/in/rick-januario-41211b238",
  logo: "/milweb-logo.png",
  heroImage: "/hero.webp",
};

/** O QUE EU ENTREGO — a oferta concreta (resolve o problema do cliente). */
export type Deliverable = { icon: string; title: Localized; desc: Localized };
export const DELIVERABLES: Deliverable[] = [
  {
    icon: "Boxes",
    title: { pt: "SaaS & MVP sob medida", en: "Custom SaaS & MVP" },
    desc: { pt: "Tiro sua ideia do papel e coloco no ar — multi-tenant, segura e pronta pra escalar.", en: "I take your idea from paper to live — multi-tenant, secure and ready to scale." },
  },
  {
    icon: "AppWindow",
    title: { pt: "Sistemas Web", en: "Web Systems" },
    desc: { pt: "Aplicações sob medida pro seu negócio, do login e do fluxo ao relatório.", en: "Custom apps for your business, from login and flow to reports." },
  },
  {
    icon: "LayoutDashboard",
    title: { pt: "Painéis Administrativos", en: "Admin Dashboards" },
    desc: { pt: "Produtos, pedidos, estoque, clientes e acessos por papel num lugar só.", en: "Products, orders, stock, customers and role-based access in one place." },
  },
  {
    icon: "Zap",
    title: { pt: "Automações & IA", en: "Automations & AI" },
    desc: { pt: "Fluxos que trabalham por você — WhatsApp, e-mail, integrações e recursos com IA.", en: "Workflows that work for you — WhatsApp, email, integrations and AI-powered features." },
  },
  {
    icon: "Rocket",
    title: { pt: "Landing Pages de Conversão", en: "High-Conversion Landing Pages" },
    desc: { pt: "Páginas rápidas e bonitas, focadas em transformar visita em cliente.", en: "Fast, polished pages built to turn visits into customers." },
  },
  {
    icon: "MessageCircle",
    title: { pt: "Catálogos para WhatsApp", en: "WhatsApp Catalogs" },
    desc: { pt: "Vitrine de produtos com pedido e orçamento direto no seu WhatsApp.", en: "Product showcase with orders and quotes straight to your WhatsApp." },
  },
];

/** POR QUE ME CONTRATAR — diferenciais (com prova no scroll). */
export type Differential = { icon: string; title: Localized; desc: Localized };
export const DIFFERENTIALS: Differential[] = [
  { icon: "ShieldCheck", title: { pt: "Contrato de garantia", en: "Service contract" }, desc: { pt: "Todo projeto fechado com contrato e assinatura eletrônica — sua garantia de entrega, por escrito.", en: "Every project closed with a contract and e-signature — your delivery guarantee, in writing." } },
  { icon: "Code2", title: { pt: "Código limpo", en: "Clean code" }, desc: { pt: "Organizado e documentado — fácil de manter e evoluir depois.", en: "Organized and documented — easy to maintain and grow later." } },
  { icon: "Gauge", title: { pt: "Performance", en: "Performance" }, desc: { pt: "Sites rápidos que não perdem cliente no carregamento.", en: "Fast sites that don't lose customers while loading." } },
  { icon: "Search", title: { pt: "SEO técnico", en: "Technical SEO" }, desc: { pt: "Estrutura pronta pra aparecer no Google.", en: "Structure ready to rank on Google." } },
  { icon: "TrendingUp", title: { pt: "Escalabilidade", en: "Scalability" }, desc: { pt: "Arquitetura que cresce junto com o seu negócio.", en: "Architecture that grows with your business." } },
  { icon: "Sparkles", title: { pt: "Experiência do usuário", en: "User experience" }, desc: { pt: "Interfaces bonitas e fáceis — pensadas pra quem vai usar.", en: "Beautiful, easy interfaces — designed for real users." } },
  { icon: "Timer", title: { pt: "Entrega rápida", en: "Fast delivery" }, desc: { pt: "Prazos realistas e comunicação direta, sem enrolação.", en: "Realistic deadlines and direct communication, no fuss." } },
  { icon: "LifeBuoy", title: { pt: "Suporte pós-entrega", en: "Post-launch support" }, desc: { pt: "Suporte gratuito após a entrega para ajustes e correções — você não fica na mão.", en: "Free support after launch for tweaks and fixes — you're never left stranded." } },
];

/** PROJETOS — reframe pró-cliente (o que o projeto resolve). */
export type Project = {
  slug: string;
  title: string;
  tagline: Localized;
  problem: Localized;
  result: Localized;
  stack: string[];
  live?: string;
  repos?: { label: string; url: string }[];
  featured?: boolean;
  /** Card em destaque (carro-chefe) — renderizado grande e primeiro. */
  flagship?: boolean;
  /** Métrica/fato de destaque do projeto (badge no card). Só fatos verdadeiros. */
  metric?: Localized;
  /** Status honesto do projeto (tag neutra): "Protótipo de estudo", "Em desenvolvimento"... */
  status?: Localized;
  /** Nota/ressalva curta exibida no card (ex.: protótipo de estudo, SaaS em dev). */
  note?: Localized;
  /** Screenshot real (alto) pro preview rolante. Sem imagem = preview estilizado. */
  image?: string;
  /** Vídeos do app em uso. 2+ = toggle (ex.: Desktop | Mobile | Admin). */
  media?: { label: Localized; src: string; poster: string; kind: "desktop" | "mobile" }[];
};
const GH = "https://github.com/rickjs2005";
export const PROJECTS: Project[] = [
  {
    slug: "loja-iphone",
    title: "Loja de iPhone",
    tagline: { pt: "E-commerce white-label · checkout no WhatsApp", en: "White-label e-commerce · WhatsApp checkout" },
    problem: { pt: "Lojas de iPhone vendem só pelo Instagram, sem uma vitrine própria e profissional.", en: "iPhone stores sell only on Instagram, without a proper professional storefront." },
    result: { pt: "Loja completa com catálogo, painel admin de produtos/estoque e pedido direto no WhatsApp — uma base white-label que vira várias lojas trocando só cor, logo e contato.", en: "Full store with catalog, admin panel for products/stock and orders straight to WhatsApp — a white-label base that becomes many stores by swapping color, logo and contact." },
    stack: ["Next.js", "TypeScript", "Tailwind", "Supabase", "Zustand"],
    metric: { pt: "1 base white-label → várias lojas", en: "1 white-label base → many stores" },
    live: "https://loja-iphone-kohl.vercel.app",
    repos: [{ label: "Código", url: `${GH}/loja-iphone` }],
    featured: true,
    flagship: true,
    media: [
      { label: { pt: "Desktop", en: "Desktop" }, src: "/shots/iphone-desktop.mp4", poster: "/shots/iphone-desktop.jpg", kind: "desktop" },
      { label: { pt: "Mobile", en: "Mobile" }, src: "/shots/iphone-cliente.mp4", poster: "/shots/iphone-cliente.jpg", kind: "mobile" },
      { label: { pt: "Admin", en: "Admin" }, src: "/shots/iphone-admin.mp4", poster: "/shots/iphone-admin.jpg", kind: "mobile" },
    ],
  },
  {
    slug: "kavita-drones",
    title: "Kavita Drones",
    tagline: { pt: "Landing de alta conversão · cliente real, no ar", en: "High-conversion landing · real client, live" },
    problem: { pt: "Uma revenda de drones agrícolas precisava apresentar produtos e captar orçamento sem depender de rede social.", en: "An agricultural-drone reseller needed to showcase products and capture quotes without relying on social media." },
    result: { pt: "Landing mobile-first, rápida, com catálogo + orçamento dinâmico enviado direto no WhatsApp. Entregue e em produção.", en: "Fast, mobile-first landing with catalog + dynamic quote sent straight to WhatsApp. Delivered and live." },
    stack: ["HTML", "CSS", "JavaScript", "Vercel"],
    metric: { pt: "Cliente real · em produção", en: "Real client · in production" },
    live: "https://kavita.com.br",
    repos: [{ label: "Código", url: `${GH}/kavita-drones-landing` }],
    featured: true,
    media: [
      { label: { pt: "Desktop", en: "Desktop" }, src: "/shots/drones-desktop.mp4", poster: "/shots/drones-desktop.jpg", kind: "desktop" },
      { label: { pt: "Mobile", en: "Mobile" }, src: "/shots/drones-mobile.mp4", poster: "/shots/drones-mobile.jpg", kind: "mobile" },
    ],
  },
  {
    slug: "kavita",
    title: "Kavita",
    tagline: { pt: "Sistema web completo · e-commerce + painéis", en: "Full web system · e-commerce + dashboards" },
    problem: { pt: "Um negócio do agro precisava de muito mais que uma loja: vendas, pagamentos, entregas e gestão por papel.", en: "An agribusiness needed far more than a store: sales, payments, deliveries and role-based management." },
    result: { pt: "Plataforma com loja, checkout com pagamento, 5 painéis por papel, app de entregas e API documentada — do pedido à entrega.", en: "Platform with store, paid checkout, 5 role-based panels, delivery app and a documented API — from order to delivery." },
    stack: ["Next.js", "Node.js", "Express", "MySQL", "Docker"],
    metric: { pt: "5 painéis por papel · API documentada", en: "5 role-based panels · documented API" },
    status: { pt: "Protótipo de estudo", en: "Study prototype" },
    note: {
      pt: "É apenas um protótipo que fiz para testar e aprimorar minhas habilidades — não é um produto de cliente.",
      en: "It's just a prototype I built to test and sharpen my skills — not a client product.",
    },
    repos: [
      { label: "Frontend", url: `${GH}/kavita-frontend` },
      { label: "Backend", url: `${GH}/kavita-backend` },
    ],
    featured: true,
    image: "/shots/kavita.png",
  },
  {
    slug: "milsaca",
    title: "Milsaca",
    tagline: { pt: "SaaS sob medida · plataforma multi-tenant", en: "Custom SaaS · multi-tenant platform" },
    problem: { pt: "Um setor inteiro rodava no improviso entre planilhas e WhatsApp, sem um sistema único.", en: "A whole sector ran improvised between spreadsheets and WhatsApp, with no single system." },
    result: { pt: "SaaS multi-tenant (web + mobile) com painéis por papel, automações e dados seguros (RLS) — prova de que entrego produto complexo de ponta a ponta.", en: "Multi-tenant SaaS (web + mobile) with role-based panels, automations and secure data (RLS) — proof I ship complex products end to end." },
    stack: ["Next.js", "Expo", "Supabase", "PostgreSQL", "TypeScript"],
    metric: { pt: "Multi-tenant · web + mobile · RLS", en: "Multi-tenant · web + mobile · RLS" },
    status: { pt: "Em desenvolvimento", en: "In development" },
    note: {
      pt: "SaaS em desenvolvimento ativo.",
      en: "SaaS under active development.",
    },
    featured: false,
    image: "/shots/milsaca.png",
  },
];

/** COMO EU TRABALHO — processo em 4 passos. */
export type Step = { n: string; title: Localized; desc: Localized };
export const PROCESS: Step[] = [
  { n: "01", title: { pt: "Descoberta", en: "Discovery" }, desc: { pt: "Entendo seu negócio, o problema e o objetivo. Sem isso, não começo.", en: "I understand your business, the problem and the goal. I don't start without it." } },
  { n: "02", title: { pt: "Design & Protótipo", en: "Design & Prototype" }, desc: { pt: "Desenho a solução e a interface antes de codar — você aprova a direção.", en: "I design the solution and the UI before coding — you approve the direction." } },
  { n: "03", title: { pt: "Desenvolvimento", en: "Development" }, desc: { pt: "Construo com código limpo e atualizações frequentes do progresso.", en: "I build with clean code and frequent progress updates." } },
  { n: "04", title: { pt: "Entrega & Suporte", en: "Launch & Support" }, desc: { pt: "Coloco no ar, te explico como usar e dou suporte pós-entrega.", en: "I ship it, show you how to use it and provide post-launch support." } },
];

/** TECNOLOGIAS. */
export const TECH: { group: Localized; items: string[] }[] = [
  { group: { pt: "Front-end", en: "Front-end" }, items: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Framer Motion", "GSAP"] },
  { group: { pt: "Back-end", en: "Back-end" }, items: ["Node.js", "PostgreSQL", "Supabase", "MySQL", "API REST", "Zod"] },
  { group: { pt: "Infra & Tools", en: "Infra & Tools" }, items: ["Vercel", "Git / GitHub", "Figma", "Docker", "SEO", "CI/CD"] },
];

/** ESTATÍSTICAS — só números honestos/verificáveis. */
export const STATS: { value: number; suffix?: string; label: Localized }[] = [
  { value: 4, suffix: "+", label: { pt: "Produtos em produção", en: "Products in production" } },
  { value: 100, suffix: "%", label: { pt: "Entregues e no ar", en: "Delivered and live" } },
  { value: 3, suffix: "+", label: { pt: "Anos construindo", en: "Years building" } },
];

/** FAQ — perguntas reais de cliente freela. */
export const FAQ: { q: Localized; a: Localized }[] = [
  {
    q: { pt: "Quanto tempo leva um projeto?", en: "How long does a project take?" },
    a: { pt: "Depende do escopo: uma landing fica pronta em poucos dias; um sistema ou SaaS leva algumas semanas. Te passo um prazo realista logo no orçamento.", en: "It depends on scope: a landing in a few days; a system or SaaS in a few weeks. I give a realistic deadline upfront with the quote." },
  },
  {
    q: { pt: "Como funciona o orçamento e o pagamento?", en: "How do quotes and payment work?" },
    a: { pt: "Orçamento gratuito e sob medida pra cada projeto. O pagamento costuma ser dividido (entrada + entrega). Sem surpresa: você aprova o valor antes de eu começar.", en: "Free, tailored quote per project. Payment is usually split (deposit + delivery). No surprises: you approve the price before I start." },
  },
  {
    q: { pt: "O que está incluso e como funcionam as revisões?", en: "What's included and how do revisions work?" },
    a: { pt: "Combinamos o escopo no início e incluo rodadas de ajuste até ficar do seu jeito, dentro do combinado. Tudo transparente.", en: "We agree on scope upfront and I include revision rounds until it's right, within what we agreed. All transparent." },
  },
  {
    q: { pt: "Você dá manutenção e suporte depois da entrega?", en: "Do you offer maintenance and support after delivery?" },
    a: { pt: "Sim. Depois de no ar, dou suporte e ofereço planos de manutenção pra evoluir e cuidar do projeto.", en: "Yes. After launch I provide support and offer maintenance plans to keep the project growing." },
  },
  {
    q: { pt: "Quais tecnologias você usa?", en: "Which technologies do you use?" },
    a: { pt: "Stack moderna e sólida: Next.js, React, TypeScript, Tailwind, Node.js, PostgreSQL e Supabase — o que for melhor pro seu caso.", en: "A modern, solid stack: Next.js, React, TypeScript, Tailwind, Node.js, PostgreSQL and Supabase — whatever fits your case best." },
  },
  {
    q: { pt: "O código fica comigo?", en: "Do I own the code?" },
    a: { pt: "Fica. Ao final, o projeto e o código são seus, entregues e documentados.", en: "You do. At the end, the project and code are yours, delivered and documented." },
  },
];

/** Depoimentos — VAZIO de propósito. Só conteúdo real (a seção some sem itens). */
export type Testimonial = { quote: Localized; author: string; role: Localized };
export const TESTIMONIALS: Testimonial[] = [];

/** Textos de UI (rótulos, títulos de seção, nav). */
export const UI = {
  nav: {
    deliverables: { pt: "Serviços", en: "Services" },
    projects: { pt: "Projetos", en: "Projects" },
    process: { pt: "Processo", en: "Process" },
    faq: { pt: "FAQ", en: "FAQ" },
    contact: { pt: "Contato", en: "Contact" },
  },
  hero: {
    eyebrow: { pt: "Desenvolvimento de SaaS e Sistemas Web de Alto Valor", en: "High-Value SaaS & Web Systems Development" },
    ctaProjects: { pt: "Ver projetos", en: "View projects" },
    ctaWhats: { pt: "Falar no WhatsApp", en: "Chat on WhatsApp" },
    available: { pt: "Disponível para novos projetos", en: "Available for new projects" },
  },
  sections: {
    deliverablesEyebrow: { pt: "O que eu faço", en: "What I do" },
    deliverablesTitle: { pt: "O que eu entrego", en: "What I deliver" },
    deliverablesSub: { pt: "Do site simples ao sistema completo — eu resolvo o problema digital do seu negócio.", en: "From a simple site to a full system — I solve your business's digital problem." },
    whyEyebrow: { pt: "Diferenciais", en: "Why me" },
    whyTitle: { pt: "Por que me contratar", en: "Why hire me" },
    whySub: { pt: "Não é só fazer funcionar — é entregar um produto rápido, bonito e que dá resultado.", en: "It's not just making it work — it's shipping a fast, polished product that delivers." },
    projectsEyebrow: { pt: "Trabalhos", en: "Work" },
    projectsTitle: { pt: "Projetos em destaque", en: "Featured projects" },
    projectsSub: { pt: "Produtos reais em produção — não exercícios de tutorial.", en: "Real products in production — not tutorial exercises." },
    processEyebrow: { pt: "Como funciona", en: "How it works" },
    processTitle: { pt: "Como eu trabalho", en: "How I work" },
    processSub: { pt: "Um processo claro, do primeiro contato ao suporte pós-entrega.", en: "A clear process, from first contact to post-launch support." },
    techEyebrow: { pt: "Stack", en: "Stack" },
    techTitle: { pt: "Tecnologias", en: "Technologies" },
    techSub: { pt: "As ferramentas que uso pra entregar do front ao deploy.", en: "The tools I use to ship from front-end to deploy." },
    faqEyebrow: { pt: "Dúvidas", en: "FAQ" },
    faqTitle: { pt: "Perguntas frequentes", en: "Frequently asked questions" },
    faqSub: { pt: "O que os clientes mais perguntam antes de começar.", en: "What clients ask most before starting." },
    aboutTitle: { pt: "Sobre a MilWeb", en: "About MilWeb" },
    aboutBody: {
      pt: "MilWeb é a marca por trás do meu trabalho como desenvolvedor freelancer. Sou o Rick — eu cuido do seu projeto de ponta a ponta, do design ao código e ao deploy, com comunicação direta e foco no resultado do seu negócio.",
      en: "MilWeb is the brand behind my work as a freelance developer. I'm Rick — I handle your project end to end, from design to code to deploy, with direct communication and a focus on your business results.",
    },
  },
  cta: {
    title: { pt: "Pronto para transformar sua ideia em um produto digital?", en: "Ready to turn your idea into a digital product?" },
    sub: { pt: "Me conta o que você precisa. Respondo rápido e o orçamento é gratuito.", en: "Tell me what you need. I reply fast and the quote is free." },
    whats: { pt: "Falar no WhatsApp", en: "Chat on WhatsApp" },
    email: { pt: "Enviar e-mail", en: "Send email" },
  },
  labels: {
    viewLive: { pt: "Ver ao vivo", en: "Live demo" },
    code: { pt: "Código", en: "Code" },
    problem: { pt: "Problema", en: "Problem" },
    result: { pt: "Solução", en: "Solution" },
    rights: { pt: "Feito com Next.js e Tailwind.", en: "Built with Next.js and Tailwind." },
    footerNote: { pt: "Freelancer independente · fundador da MilWeb.", en: "Independent freelancer · founder of MilWeb." },
  },
} satisfies Record<string, Record<string, unknown>>;
