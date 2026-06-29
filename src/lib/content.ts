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
    pt: "Sites e sistemas que fazem seu negócio vender.",
    en: "Websites and systems that make your business sell.",
  } as Localized,
  subtitle: {
    pt: "Desenvolvo plataformas, lojas e sistemas sob medida — rápidos, bonitos e prontos pra escalar.",
    en: "I build custom platforms, stores and systems — fast, polished and ready to scale.",
  } as Localized,
  location: { pt: "Brasil · 100% remoto", en: "Brazil · fully remote" } as Localized,
  email: "rickjanuario0@gmail.com",
  // WhatsApp de trabalho (só dígitos, com DDI 55).
  whatsapp: "5533998779375",
  github: "https://github.com/rickjs2005",
  linkedin: "https://www.linkedin.com/in/rick-januario-41211b238",
  logo: "/milweb-logo.png",
  heroImage: "/milo2.png",
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
  /** true = imagem estática inteira no card (sem rolagem), ex.: print de celular. */
  imageStatic?: boolean;
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
    slug: "akatsuki",
    title: "Akatsuki",
    tagline: { pt: "Loja de animes cinematográfica em 3D · checkout no WhatsApp", en: "Cinematic 3D anime store · WhatsApp checkout" },
    problem: { pt: "Lojas de nicho (animes e colecionáveis) disputam atenção e precisam de uma vitrine memorável que venda sem fricção.", en: "Niche stores (anime & collectibles) fight for attention and need a memorable storefront that sells without friction." },
    result: { pt: "Loja imersiva em 3D (Three.js) com dois temas que se transformam — Akatsuki ⇄ Expansão de Domínio —, aura de energia por personagem ao adicionar ao carrinho, carrinho que persiste e pedido fechado direto no WhatsApp.", en: "Immersive 3D store (Three.js) with two morphing themes — Akatsuki ⇄ Domain Expansion —, per-character energy aura on add-to-cart, a persistent cart and orders closed straight on WhatsApp." },
    stack: ["Next.js", "TypeScript", "Three.js", "React Three Fiber", "Tailwind", "Framer Motion"],
    metric: { pt: "Cena 3D + 2 temas animados", en: "3D scene + 2 animated themes" },
    status: { pt: "Projeto autoral · demo", en: "Personal project · demo" },
    live: "https://akatsuki-loja-animes.vercel.app",
    repos: [{ label: "Código", url: `${GH}/akatsuki-loja-animes` }],
    featured: true,
    media: [
      { label: { pt: "Desktop", en: "Desktop" }, src: "/shots/akatsuki-desktop.mp4", poster: "/shots/akatsuki-desktop.jpg", kind: "desktop" },
    ],
  },
  {
    slug: "loja-joias",
    title: "AURÉA — Joalheria",
    tagline: { pt: "Vitrine premium · Espelho Virtual (try-on) · WhatsApp", en: "Premium showcase · Virtual Mirror (try-on) · WhatsApp" },
    problem: { pt: "Joalherias autorais vendem por foto no Instagram — sem uma vitrine elegante e sem o cliente conseguir “experimentar” a peça.", en: "Indie jewelers sell via Instagram photos — no elegant storefront and no way for the customer to “try on” the piece." },
    result: { pt: "Vitrine editorial white-label com Espelho Virtual que prova brincos e colares pela câmera em tempo real (MediaPipe, 100% no navegador) e leva ao WhatsApp já com a referência da peça.", en: "White-label editorial showcase with a Virtual Mirror that tries earrings and necklaces on via live camera (MediaPipe, 100% in-browser) and opens WhatsApp prefilled with the piece reference." },
    stack: ["Next.js", "React 19", "TypeScript", "Tailwind v4", "MediaPipe", "Framer Motion"],
    metric: { pt: "Espelho Virtual · try-on por câmera", en: "Virtual Mirror · camera try-on" },
    status: { pt: "Projeto autoral · white-label", en: "Personal project · white-label" },
    live: "https://loja-joias-two.vercel.app",
    repos: [{ label: "Código", url: `${GH}/loja-joias` }],
    featured: true,
    media: [
      { label: { pt: "Desktop", en: "Desktop" }, src: "/shots/joias-desktop.mp4", poster: "/shots/joias-desktop.jpg", kind: "desktop" },
    ],
  },
  {
    slug: "nexus-geek",
    title: "NEXUS — Loja Geek",
    tagline: { pt: "Hero buraco negro 3D (R3F) · pós-processamento de cinema", en: "3D black-hole hero (R3F) · cinematic postprocessing" },
    problem: { pt: "Marcas geek/gamer precisam de uma vitrine com cara de produto premium — impacto visual que diferencia da concorrência.", en: "Geek/gamer brands need a storefront that feels premium — visual impact that stands out from competitors." },
    result: { pt: "Vitrine conceitual com hero de buraco negro estilo Interestelar (React Three Fiber): disco de acreção turbulento, distorção gravitacional, planeta e asteroides, iluminação HDRI e pós-processamento cinematográfico. Uma timeline (Theatre.js) faz a câmera mergulhar no buraco conforme o scroll.", en: "Concept showcase with an Interstellar-style black-hole hero (React Three Fiber): turbulent accretion disk, gravitational lensing, planet and asteroids, HDRI lighting and cinematic postprocessing. A timeline (Theatre.js) dives the camera into the hole on scroll." },
    stack: ["React", "Vite", "Three.js · R3F", "react-postprocessing", "Theatre.js", "GLSL"],
    metric: { pt: "Buraco negro 3D + lente gravitacional", en: "3D black hole + gravitational lensing" },
    status: { pt: "Projeto autoral · conceito", en: "Personal project · concept" },
    live: "https://nexus-geek-store.vercel.app",
    repos: [{ label: "Código", url: `${GH}/nexus-geek-store` }],
    featured: true,
    media: [
      { label: { pt: "Desktop", en: "Desktop" }, src: "/shots/geek-desktop.mp4", poster: "/shots/geek-desktop.jpg", kind: "desktop" },
    ],
  },
  {
    slug: "lumen-architecture",
    title: "Lumen",
    tagline: { pt: "Site cinematográfico 3D para arquitetura · React Three Fiber", en: "Cinematic 3D site for architecture · React Three Fiber" },
    problem: { pt: "Escritórios de arquitetura precisam transmitir sofisticação e domínio do espaço — um site comum não passa a sensação do trabalho deles.", en: "Architecture studios need to convey sophistication and spatial mastery — a plain website doesn't capture the feel of their work." },
    result: { pt: "Vitrine imersiva em 3D (React Three Fiber) com cenas cinematográficas e navegação fluida que apresentam o escritório como uma experiência, não como uma lista de fotos.", en: "Immersive 3D showcase (React Three Fiber) with cinematic scenes and fluid navigation that present the studio as an experience, not a list of photos." },
    stack: ["React", "Vite", "TypeScript", "Three.js · R3F", "SCSS"],
    metric: { pt: "Experiência 3D cinematográfica", en: "Cinematic 3D experience" },
    status: { pt: "Projeto autoral · demo", en: "Personal project · demo" },
    live: "https://lumen-architecture-drab.vercel.app",
    repos: [{ label: "Código", url: `${GH}/lumen-architecture` }],
    featured: true,
    media: [
      { label: { pt: "Desktop", en: "Desktop" }, src: "/shots/lumen-desktop.mp4", poster: "/shots/lumen-desktop.jpg", kind: "desktop" },
    ],
  },
  {
    slug: "rjjstore",
    title: "RJjstore",
    tagline: { pt: "Moda premium editorial · checkout no WhatsApp", en: "Editorial premium fashion · WhatsApp checkout" },
    problem: { pt: "Lojas de roupa de marca vendem por foto no Instagram — sem uma vitrine com cara de grife que transmita desejo e exclusividade.", en: "Branded clothing stores sell via Instagram photos — without a storefront that feels like a fashion house and conveys desire and exclusivity." },
    result: { pt: "E-commerce de moda com estética de estúdio de luxo: hero cinematográfico, lookbook com scroll horizontal, iluminação dinâmica seguindo o cursor, vista rápida do produto, carrinho persistente e pedido fechado direto no WhatsApp — com tema Areia/Branco alternável.", en: "Fashion e-commerce with a luxury-studio aesthetic: cinematic hero, horizontal-scroll lookbook, cursor-following dynamic lighting, product quick-view, persistent cart and orders closed straight on WhatsApp — with a switchable Sand/White theme." },
    stack: ["Next.js", "TypeScript", "Tailwind", "Framer Motion", "Lenis"],
    metric: { pt: "Editorial de luxo · checkout no WhatsApp", en: "Luxury editorial · WhatsApp checkout" },
    status: { pt: "Projeto autoral · demo", en: "Personal project · demo" },
    live: "https://rjjstore.vercel.app",
    repos: [{ label: "Código", url: `${GH}/rjjstore` }],
    featured: true,
    image: "/shots/rjjstore.png",
  },
  {
    slug: "rjs-laticinios",
    title: "RJS Laticínios",
    tagline: { pt: "Vitrine de laticínios artesanais · pedido no WhatsApp", en: "Artisanal dairy showcase · WhatsApp ordering" },
    problem: { pt: "Produtores de laticínios artesanais vendem no boca a boca e no WhatsApp, sem uma vitrine própria que mostre os produtos com profissionalismo.", en: "Artisanal dairy producers sell by word of mouth and WhatsApp, without a proper storefront that showcases products professionally." },
    result: { pt: "Vitrine com catálogo de produtos e pedido fechado direto no WhatsApp — uma base simples e rápida para o produtor vender online sem depender só das redes sociais.", en: "A storefront with a product catalog and orders closed straight on WhatsApp — a simple, fast base for the producer to sell online without relying only on social media." },
    stack: ["Next.js", "TypeScript", "Tailwind", "Vercel"],
    metric: { pt: "Catálogo · pedido no WhatsApp", en: "Catalog · WhatsApp ordering" },
    status: { pt: "Projeto autoral · demo", en: "Personal project · demo" },
    live: "https://rjs-laticinios.vercel.app",
    repos: [{ label: "Código", url: `${GH}/rjs-laticinios` }],
    featured: true,
    media: [
      { label: { pt: "Desktop", en: "Desktop" }, src: "/shots/rjs-laticinios-desktop.mp4", poster: "/shots/rjs-laticinios-desktop.jpg", kind: "desktop" },
    ],
  },
  {
    slug: "imperio-cafe",
    title: "Império do Café",
    tagline: { pt: "Jogo mobile de simulação · React Native/Expo", en: "Mobile simulation game · React Native/Expo" },
    problem: { pt: "Mostrar domínio de mobile e de lógica complexa exige mais que um CRUD — pede um produto com profundidade real.", en: "Showing mobile + complex-logic mastery takes more than a CRUD — it calls for a product with real depth." },
    result: { pt: "Jogo mobile completo de gestão de fazenda de café (Zona da Mata), 100% offline com saves locais: variedades, pragas e doenças, ciclo agronômico e mercado — dezenas de sistemas interligados.", en: "Full mobile coffee-farm management game (Zona da Mata), 100% offline with local saves: varieties, pests and diseases, agronomic cycle and market — dozens of interlocking systems." },
    stack: ["React Native", "Expo", "React 19", "JavaScript", "AsyncStorage"],
    metric: { pt: "App mobile · 100% offline", en: "Mobile app · 100% offline" },
    status: { pt: "Projeto autoral", en: "Personal project" },
    repos: [{ label: "Código", url: `${GH}/rpg-mobile` }],
    featured: true,
    image: "/shots/imperio-cafe.jpg",
    imageStatic: true,
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
    eyebrow: { pt: "Dev full-stack · SaaS e sistemas web", en: "Full-stack dev · SaaS & web systems" },
    // H1 dividido em duas partes p/ aplicar o gradiente só na última palavra.
    titleLead: { pt: "Sites e sistemas que fazem seu negócio", en: "Websites and systems that make your business" },
    titleHighlight: { pt: "vender", en: "sell" },
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
    whySub: { pt: "Não basta funcionar. Entrego um produto rápido, bonito e que dá resultado de verdade.", en: "Working isn't enough. I ship a product that's fast, polished and that actually delivers." },
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
    sub: { pt: "Me conta o que você precisa. Respondo rápido e te passo um orçamento gratuito, sem compromisso.", en: "Tell me what you need. I reply fast and send a free quote, no strings attached." },
    whats: { pt: "Falar no WhatsApp", en: "Chat on WhatsApp" },
    email: { pt: "Enviar e-mail", en: "Send email" },
  },
  /* Selos de confiança honestos (sem preço/depoimento) — exibidos no ponto de
     conversão. Cada item é uma garantia real já oferecida (ver DIFFERENTIALS/FAQ). */
  trust: {
    contract: { pt: "Contrato de garantia", en: "Service contract" },
    support: { pt: "Suporte pós-entrega", en: "Post-launch support" },
    ownCode: { pt: "O código é seu", en: "You own the code" },
    freeQuote: { pt: "Orçamento gratuito", en: "Free quote" },
  },
  labels: {
    caseStudy: { pt: "Ver case", en: "View case" },
    backToProjects: { pt: "Voltar aos projetos", en: "Back to projects" },
    prev: { pt: "Anterior", en: "Previous" },
    next: { pt: "Próximo", en: "Next" },
    viewLive: { pt: "Ver ao vivo", en: "Live demo" },
    code: { pt: "Código", en: "Code" },
    problem: { pt: "Problema", en: "Problem" },
    result: { pt: "Solução", en: "Solution" },
    rights: { pt: "Feito com Next.js e Tailwind.", en: "Built with Next.js and Tailwind." },
    footerNote: { pt: "Freelancer independente · fundador da MilWeb.", en: "Independent freelancer · founder of MilWeb." },
  },
} satisfies Record<string, Record<string, unknown>>;
