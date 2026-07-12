/**
 * Conteúdo do site MilWeb — fonte única, bilíngue (pt/en).
 * Posicionamento: freelancer full-stack que resolve o problema do cliente.
 * MilWeb aparece de forma discreta (marca pessoal, não agência).
 */

export type Locale = "pt" | "en";
export type Localized = { pt: string; en: string };

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
  logo: "/icon.svg",
  heroImage: "/milo2.webp",
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
  /** Vídeos do app em uso. 2+ = toggle (ex.: Desktop | Mobile | Admin). */
  media?: { label: Localized; src: string; poster: string; kind: "desktop" | "mobile" }[];
};
const GH = "https://github.com/rickjs2005";
export const PROJECTS: Project[] = [
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
    featured: true,
    image: "/shots/milsaca.png",
  },
  {
    slug: "inkvision",
    title: "InkVision",
    tagline: { pt: "SaaS de tatuagem · simulação de tattoo com IA", en: "Tattoo SaaS · AI tattoo simulation" },
    problem: { pt: "Cliente de tatuagem decide no escuro: só vê como a arte vai ficar na pele durante a sessão, já com a agulha na mão.", en: "Tattoo clients decide in the dark: they only see how the art looks on skin during the session, needle already in hand." },
    result: { pt: "Simulação da tatuagem na própria foto via IA, chat com o tatuador pra aprovar o desenho, agendamento e um marketplace multi-tenant conectando clientes a estúdios e artistas.", en: "AI-powered tattoo simulation on the client's own photo, in-app chat with the artist to approve the design, scheduling and a multi-tenant marketplace connecting clients to studios and artists." },
    stack: ["Next.js", "TypeScript", "Prisma", "PostgreSQL", "Turborepo", "Stripe"],
    metric: { pt: "Simulação de tattoo por IA · multi-tenant", en: "AI tattoo simulation · multi-tenant" },
    status: { pt: "Em desenvolvimento", en: "In development" },
    note: {
      pt: "SaaS em desenvolvimento ativo.",
      en: "SaaS under active development.",
    },
    repos: [{ label: "Código", url: `${GH}/inkvision` }],
    featured: true,
    image: "/shots/inkvision.webp",
  },
  {
    slug: "rockverse",
    title: "ROCKVERSE",
    tagline: { pt: "Site-experiência sobre Rock · motion design de ponta a ponta", en: "Rock experience site · end-to-end motion design" },
    problem: { pt: "Marcas de música e cultura disputam atenção em segundos — e sites institucionais comuns não geram desejo, memória nem compartilhamento.", en: "Music and culture brands fight for attention in seconds — and ordinary websites create no desire, memory or shares." },
    result: { pt: "Experiência imersiva pela história do rock: headline cinética letra a letra, scroll com inércia (Lenis), cursor contextual, vinis interativos com modal, timeline com scrub e seção editorial em papel — projeto auditado como jurado de premiação e refinado em 5 fases, mantendo Lighthouse 99/100/100/100 no desktop.", en: "An immersive journey through rock history: letter-by-letter kinetic headline, inertia scrolling (Lenis), contextual cursor, interactive vinyl sleeves with modal, scrubbed timeline and a paper editorial section — audited like an awards juror and refined in 5 phases, keeping a 99/100/100/100 desktop Lighthouse." },
    stack: ["Next.js 16", "TypeScript", "Tailwind v4", "Framer Motion", "Lenis"],
    metric: { pt: "Lighthouse 99 · A11y 100 · motion 60fps", en: "Lighthouse 99 · A11y 100 · 60fps motion" },
    status: { pt: "Projeto autoral · demo", en: "Personal project · demo" },
    repos: [{ label: "Código", url: `${GH}/rockverse` }],
    featured: true,
    media: [
      { label: { pt: "Desktop", en: "Desktop" }, src: "/shots/rockverse-desktop.mp4", poster: "/shots/rockverse-desktop.jpg", kind: "desktop" },
    ],
  },
  {
    slug: "as-copas",
    title: "As Copas",
    tagline: { pt: "Site imersivo · estádios históricos em 3D (WebGL)", en: "Immersive site · historic stadiums in 3D (WebGL)" },
    problem: { pt: "Conteúdo esportivo na web é tudo igual: listas de texto sem identidade, nada que alguém queira compartilhar.", en: "Sports content on the web all looks the same: identity-less text lists, nothing anyone wants to share." },
    result: { pt: "Tributo às Copas do Mundo com 8 estádios icônicos modelados em 3D (arquibancadas, setores e torcida), Modo cinema para gravar vídeos, álbum de figurinhas com os áudios virais e identidade editorial própria — 100% estático, rápido até no 3G.", en: "A World Cup tribute with 8 iconic stadiums modeled in 3D (stands, sectors and crowd), a Cinema mode for recording videos, a sticker album with viral audios and its own editorial identity — 100% static, fast even on 3G." },
    stack: ["Next.js", "TypeScript", "Three.js", "React Three Fiber", "Tailwind", "Framer Motion"],
    metric: { pt: "8 estádios em 3D · Modo cinema", en: "8 stadiums in 3D · Cinema mode" },
    status: { pt: "Projeto autoral · no ar", en: "Personal project · live" },
    live: "https://copa2026-alpha.vercel.app",
    featured: true,
    image: "/shots/copa2026.webp",
  },
  {
    slug: "ecoa",
    title: "ECOA",
    tagline: { pt: "Rede social anônima · produto completo com IA", en: "Anonymous social network · full product with AI" },
    problem: { pt: "Pessoas querem desabafar e ser ouvidas sem expor o rosto — e as redes tradicionais punem a vulnerabilidade.", en: "People want to vent and be heard without showing their face — and traditional networks punish vulnerability." },
    result: { pt: "Rede só-texto onde cada pessoa é um número: anonimato garantido pela arquitetura do banco (nem a API consegue ligar conta a post), moderação em 2 estágios com IA, recuperação de conta sem e-mail e LGPD de ponta a ponta.", en: "Text-only network where each person is a number: anonymity guaranteed by the database architecture (not even the API can link account to post), 2-stage AI moderation, e-mail-free account recovery and end-to-end privacy compliance." },
    stack: ["Next.js", "TypeScript", "Supabase", "PostgreSQL", "Claude API"],
    metric: { pt: "Anonimato por arquitetura · IA de moderação", en: "Anonymity by architecture · AI moderation" },
    status: { pt: "MVP no ar", en: "MVP live" },
    live: "https://ecoa-teal.vercel.app",
    featured: true,
    image: "/shots/ecoa.webp",
    imageStatic: true,
  },
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
    metricProof: true,
    live: "https://kavita.com.br",
    repos: [{ label: "Código", url: `${GH}/kavita-drones-landing` }],
    featured: true,
    media: [
      { label: { pt: "Desktop", en: "Desktop" }, src: "/shots/drones-desktop.mp4", poster: "/shots/drones-desktop.jpg", kind: "desktop" },
      { label: { pt: "Mobile", en: "Mobile" }, src: "/shots/drones-mobile.mp4", poster: "/shots/drones-mobile.jpg", kind: "mobile" },
    ],
  },
  {
    slug: "ecommerce-do-agro",
    title: "E-commerce do Agro",
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
      { label: "Frontend", url: `${GH}/ecommerce-do-agro-frontend` },
      { label: "Backend", url: `${GH}/ecommerce-do-agro-backend` },
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
];

/** COMO EU TRABALHO — processo em 4 passos. */
export type Step = { n: string; title: Localized; desc: Localized };
/** Vídeos do Lab: animações autorais feitas 100% em código (Remotion). */
export type LabClip = {
  src: string;
  poster: string;
  title: Localized;
  desc: Localized;
  tags: string[];
};
export const LAB: LabClip[] = [
  {
    src: "/lab/cosmos.mp4",
    poster: "/lab/cosmos.jpg",
    title: { pt: "Cosmos", en: "Cosmos" },
    desc: {
      pt: "Da Terra à teia cósmica: zoom-out contínuo com a Terra real da NASA em shader.",
      en: "From Earth to the cosmic web: a continuous zoom-out with NASA's real Earth in a shader.",
    },
    tags: ["Three.js", "WebGL", "GLSL"],
  },
  {
    src: "/lab/explosion.mp4",
    poster: "/lab/explosion.jpg",
    title: { pt: "Element Explosion", en: "Element Explosion" },
    desc: {
      pt: "Um ponto de luz explode e vira interface, dashboard e devices — física de partículas própria.",
      en: "A point of light explodes into interface, dashboard and devices — a custom particle system.",
    },
    tags: ["Remotion", "React", "Partículas"],
  },
  {
    src: "/lab/reel.mp4",
    poster: "/lab/reel.jpg",
    title: { pt: "Site em 30s", en: "Website in 30s" },
    desc: {
      pt: "Um site nascendo do zero — wireframe, componentes e dashboard, tudo animado em código.",
      en: "A website born from scratch — wireframe, components and dashboard, all animated in code.",
    },
    tags: ["Remotion", "TypeScript", "60fps"],
  },
];

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
    risk: { pt: "Raio-X", en: "X-Ray" },
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
    miloHi: { pt: "Oi! Eu sou o Milo 👋", en: "Hi! I'm Milo 👋" },
  },
  sections: {
    deliverablesEyebrow: { pt: "O que eu faço", en: "What I do" },
    deliverablesTitle: { pt: "O que eu entrego", en: "What I deliver" },
    deliverablesSub: { pt: "Do site simples ao sistema completo — eu resolvo o problema digital do seu negócio.", en: "From a simple site to a full system — I solve your business's digital problem." },
    whyEyebrow: { pt: "Diferenciais", en: "Why me" },
    whyTitle: { pt: "Por que me contratar", en: "Why hire me" },
    whySub: { pt: "Não basta funcionar. Entrego um produto rápido, bonito e que dá resultado de verdade.", en: "Working isn't enough. I ship a product that's fast, polished and that actually delivers." },
    projectsEyebrow: { pt: "Trabalhos", en: "Work" },
    projectsTitle: { pt: "Projetos & produtos", en: "Projects & products" },
    projectsSub: { pt: "Sistemas, lojas, landing pages e SaaS — uma amostra do que eu consigo construir.", en: "Systems, stores, landing pages and SaaS — a sample of what I can build." },
    projectsLegendProof: { pt: "Cliente real · em produção", en: "Real client · in production" },
    projectsLegendDemo: { pt: "Projeto autoral · demo/protótipo", en: "Personal project · demo/prototype" },
    labEyebrow: { pt: "Lab", en: "Lab" },
    labTitle: { pt: "Animações 100% em código", en: "Animations 100% in code" },
    labSub: {
      pt: "Nada de banco de vídeo: estes filmes foram programados em React, Three.js e shaders — o mesmo capricho técnico que vai para o seu projeto.",
      en: "No stock footage: these films were programmed with React, Three.js and shaders — the same technical care that goes into your project.",
    },
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

/** RAIO-X DA DEPENDÊNCIA — bloco interativo de conversão (calculadora +
 *  mini-dashboard). Argumento: depender só de rede social é risco; a saída
 *  é um site próprio (que é exatamente o que eu vendo). */
export const DEPENDENCY = {
  eyebrow: { pt: "Raio-X da dependência", en: "Dependency X-ray" },
  title: {
    pt: "Depender só de rede social custa caro",
    en: "Relying only on social media gets expensive",
  },
  sub: {
    pt: "O Instagram já ficou quase 7 horas fora do ar — levando as vendas junto. Veja o risco de operar 100% em plataformas alugadas e calcule o que um apagão custaria pra você.",
    en: "Instagram has already gone dark for almost 7 hours — taking sales with it. See the risk of running 100% on rented platforms and calculate what an outage would cost you.",
  },
  calc: {
    title: { pt: "Calculadora de prejuízo", en: "Loss calculator" },
    revenue: { pt: "Faturamento mensal", en: "Monthly revenue" },
    ig: { pt: "Vendas que nascem no Instagram", en: "Sales born on Instagram" },
    wa: { pt: "Vendas fechadas no WhatsApp", en: "Sales closed on WhatsApp" },
    clients: { pt: "Clientes por mês", en: "Customers per month" },
    duration: { pt: "Duração do apagão", en: "Outage length" },
    h24: { pt: "24 horas", en: "24 hours" },
    d7: { pt: "7 dias", en: "7 days" },
    lose: { pt: "Você perderia", en: "You'd lose" },
    loseSub: {
      pt: "em {duration} fora do ar, com {share}% das vendas presas em plataformas alugadas.",
      en: "in {duration} offline, with {share}% of sales locked inside rented platforms.",
    },
    orders: { pt: "Pedidos perdidos", en: "Lost orders" },
    leads: { pt: "Leads que não chegam", en: "Leads that never arrive" },
    messages: { pt: "Mensagens sem resposta", en: "Unanswered messages" },
    hours: { pt: "Horas de venda paradas", en: "Selling hours on hold" },
    note: {
      pt: "* Estimativa ilustrativa a partir dos valores informados.",
      en: "* Illustrative estimate based on your inputs.",
    },
    milo0: {
      pt: "Parece pouco? Multiplica pelos apagões que acontecem todo ano.",
      en: "Looks small? Multiply it by the outages that happen every year.",
    },
    milo1: {
      pt: "Não é pouco, né? E apagões reais já passaram de 6 horas.",
      en: "Not small, right? Real outages have lasted over 6 hours.",
    },
    milo2: {
      pt: "Dói só de calcular. Um site próprio não cai junto com o feed.",
      en: "It hurts just to calculate. Your own site doesn't go down with the feed.",
    },
    /* Diagnóstico gratuito: transforma o resultado em lead com contexto. */
    diagButton: { pt: "Gerar meu diagnóstico gratuito", en: "Get my free diagnosis" },
    diagTitle: { pt: "Seu diagnóstico", en: "Your diagnosis" },
    riskLabel: { pt: "Nota de risco do seu negócio", en: "Your business risk score" },
    rec1a: {
      pt: "Mais da metade das suas vendas nasce no Instagram. Prioridade nº 1: um canal de captura fora do feed — site próprio com SEO.",
      en: "Over half of your sales are born on Instagram. Priority #1: an acquisition channel outside the feed — your own website with SEO.",
    },
    rec1b: {
      pt: "Sua dependência de redes ainda é moderada — é o melhor momento para construir o canal próprio antes que ela cresça.",
      en: "Your social dependency is still moderate — it's the best moment to build your own channel before it grows.",
    },
    rec2a: {
      pt: "Fechar tudo no WhatsApp não escala: com catálogo ou agendamento no site, o pedido chega pronto e o WhatsApp vira só o fechamento.",
      en: "Closing everything on WhatsApp doesn't scale: with a catalog or booking on your site, orders arrive ready and WhatsApp becomes just the closing step.",
    },
    rec2b: {
      pt: "Automatize a entrada de pedidos no site para o atendimento não virar gargalo quando as vendas crescerem.",
      en: "Automate order intake on your website so support doesn't become a bottleneck as sales grow.",
    },
    rec3: {
      pt: "Um site otimizado transforma o Google em canal de aquisição contínuo — clientes chegando sem depender de post.",
      en: "An optimized website turns Google into a continuous acquisition channel — customers arriving without a single post.",
    },
    diagWhats: { pt: "Receber um plano no WhatsApp", en: "Get a plan on WhatsApp" },
    diagWhatsMsg: {
      pt: "Olá Rick! Fiz o diagnóstico no milweb.com.br → faturamento {revenue}/mês, {share}% das vendas em redes sociais, prejuízo estimado de {loss} em {duration} e nota de risco {score}/100. Quero um plano para ter meu site próprio.",
      en: "Hi Rick! I ran the diagnosis at milweb.com.br → {revenue}/month in revenue, {share}% of sales on social media, an estimated {loss} loss in {duration} and a {score}/100 risk score. I want a plan for my own website.",
    },
    share: { pt: "Compartilhar resultado", en: "Share result" },
    shareTitle1: { pt: "Se o Instagram cair amanhã,", en: "If Instagram goes down tomorrow," },
    shareTitle2: { pt: "eu perderia", en: "I'd lose" },
    shareSub: {
      pt: "em {duration}, com {share}% das vendas em redes sociais",
      en: "in {duration}, with {share}% of sales on social media",
    },
    shareFooter: { pt: "Calcule o seu → milweb.com.br", en: "Calculate yours → milweb.com.br" },
    shareFile: { pt: "meu-diagnostico-milweb", en: "my-milweb-diagnosis" },
  },
  widgets: {
    risk: { pt: "Risco do negócio", en: "Business risk" },
    riskHigh: { pt: "Risco alto", en: "High risk" },
    live: { pt: "ao vivo", en: "live" },
    channels: { pt: "Dependência por canal", en: "Dependency by channel" },
    ownSite: { pt: "Site próprio", en: "Own website" },
    channelsNote: {
      pt: "Perfil típico de quem vende \"pelo direct\".",
      en: "Typical profile of a DM-driven business.",
    },
    salesOrigin: { pt: "Origem das vendas", en: "Where sales come from" },
    referral: { pt: "Indicação", en: "Referrals" },
    googleSite: { pt: "Google / site", en: "Google / website" },
    outage: { pt: "Simulação de apagão · 24h", en: "Outage simulation · 24h" },
    outageAxis: { pt: "Vendas/hora num dia comum", en: "Sales/hour on a normal day" },
    outageWindow: { pt: "janela do apagão", en: "outage window" },
  },
  punch: {
    pt: "O único canal que é realmente seu é o seu site.",
    en: "The only channel you truly own is your website.",
  },
  cta: { pt: "Quero um site próprio", en: "I want my own website" },
  ctaWhats: {
    pt: "Olá! Usei a calculadora do milweb.com.br e quero um site próprio para o meu negócio.",
    en: "Hi! I used the calculator at milweb.com.br and I want my own website.",
  },
};

/** O TESTE DO GOOGLE — SERP simulada que mostra concorrentes ocupando a
 *  posição do visitante. Templates usam {q}/{Q} (nicho minúsculo/capitalizado). */
export const GOOGLE_SIM = {
  eyebrow: { pt: "O teste do Google", en: "The Google test" },
  title: {
    pt: "É assim que clientes procuram você agora",
    en: "This is how customers search for you right now",
  },
  sub: {
    pt: "Digite o que você faz — ou escolha um exemplo — e veja quem aparece quando alguém pesquisa no Google.",
    en: "Type what you do — or pick an example — and see who shows up when someone searches on Google.",
  },
  placeholder: { pt: "Ex.: dentista, doceria, personal…", en: "E.g.: dentist, bakery, trainer…" },
  search: { pt: "Buscar", en: "Search" },
  suggestions: {
    pt: "tatuador|advogada|restaurante|pet shop|arquiteto|loja de roupas",
    en: "tattoo artist|lawyer|restaurant|pet shop|architect|clothing store",
  },
  autorun: { pt: "tatuador", en: "tattoo artist" },
  emptyHint: { pt: "Os resultados aparecem aqui ✦", en: "Results show up here ✦" },
  r1t: { pt: "{Q} perto de você | Agende online em 2 minutos", en: "{Q} near you | Book online in 2 minutes" },
  r1d: {
    pt: "Atendimento profissional de {q} com horários online, avaliações verificadas e orçamento na hora. Referência na sua região.",
    en: "Professional {q} services with online booking, verified reviews and instant quotes. A local reference.",
  },
  r1r: { pt: "4,9 ★★★★★ (312)", en: "4.9 ★★★★★ (312)" },
  r2t: { pt: "Top 10 melhores profissionais de {q} — ranking 2026", en: "Top 10 best {q} professionals — 2026 ranking" },
  r2d: {
    pt: "Comparamos preço, avaliações e tempo de resposta dos mais procurados. Veja quem lidera o ranking deste ano.",
    en: "We compared price, reviews and response time of the most searched. See who leads this year's ranking.",
  },
  r3t: { pt: "{Q} — orçamento rápido pelo site", en: "{Q} — quick quote via website" },
  r3d: {
    pt: "Solicite orçamento sem sair do Google. Página otimizada, resposta automática e atendimento em minutos.",
    en: "Request a quote without leaving Google. Optimized page, automatic reply, service in minutes.",
  },
  slotTitle: { pt: "Sua empresa poderia estar aqui.", en: "Your business could be right here." },
  slotSub: {
    pt: "Com um site otimizado, essa posição trabalha para você 24h — sem depender de post, story ou sorte.",
    en: "With an optimized website this spot works for you 24/7 — no posts, stories or luck required.",
  },
  slotCta: { pt: "Quero aparecer no Google", en: "I want to show up on Google" },
  slotWhats: {
    pt: "Olá! Fiz o teste do Google no milweb.com.br e quero aparecer nas buscas.",
    en: "Hi! I tried the Google test at milweb.com.br and I want to show up in searches.",
  },
  milo: {
    pt: "Sua empresa apareceu aí? Se não… seu concorrente apareceu.",
    en: "Did your business show up? If not… your competitor did.",
  },
};

/** MILO FAB — o mascote como botão flutuante de WhatsApp. */
export const MILO_FAB = {
  label: { pt: "Falar no WhatsApp", en: "Chat on WhatsApp" },
  bubble: { pt: "Fala com o Rick 👋", en: "Talk to Rick 👋" },
  message: {
    pt: "Olá Rick! Vim pelo site da MilWeb e quero um orçamento.",
    en: "Hi Rick! I came from the MilWeb site and I'd like a quote.",
  },
};

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
    pt: "Isso não é hipótese — já aconteceu:",
    en: "This isn't hypothetical — it already happened:",
  } as Localized,
  events: [
    {
      date: { pt: "04 out 2021", en: "Oct 4, 2021" },
      title: { pt: "O dia em que a Meta sumiu", en: "The day Meta vanished" },
      value: 7,
      suffix: { pt: "h", en: "h" },
      statLabel: { pt: "fora do ar", en: "offline" },
      desc: {
        pt: "Facebook, Instagram e WhatsApp caíram juntos no mundo inteiro. Milhões de negócios ficaram mudos por quase 7 horas.",
        en: "Facebook, Instagram and WhatsApp went down together worldwide. Millions of businesses went silent for almost 7 hours.",
      },
      color: "#fb7185",
    },
    {
      date: { pt: "18 jan 2025", en: "Jan 18, 2025" },
      title: { pt: "TikTok apagado nos EUA", en: "TikTok switched off in the US" },
      value: 170,
      suffix: { pt: " mi", en: "M" },
      statLabel: { pt: "de usuários no escuro, da noite pro dia", en: "users in the dark, overnight" },
      desc: {
        pt: "Audiência construída por anos, congelada por uma decisão de governo. Quem só existia lá, sumiu junto.",
        en: "Audiences built over years, frozen by a government decision. Whoever only existed there vanished too.",
      },
      color: "#a78bfa",
    },
    {
      date: { pt: "Todos os anos", en: "Every year" },
      title: { pt: "Contas banidas sem aviso", en: "Accounts banned without warning" },
      value: 100,
      suffix: { pt: "%", en: "%" },
      statLabel: { pt: "das contas sujeitas a bloqueio", en: "of accounts subject to blocking" },
      desc: {
        pt: "Perfis são bloqueados por engano todos os dias — e o recurso pode levar semanas. Um site não é banido por robô de moderação.",
        en: "Profiles get blocked by mistake every day — appeals can take weeks. A website can't be banned by a moderation bot.",
      },
      color: "#fbbf24",
    },
  ] as OutageEvent[],
};

/** LIGHTHOUSE — prova técnica na seção de números. */
export const LIGHTHOUSE = {
  title: {
    pt: "Lighthouse deste site — a auditoria do próprio Google",
    en: "This site's Lighthouse — Google's own audit",
  } as Localized,
  note: {
    pt: "Nota máxima não é promessa: é o padrão de tudo que eu entrego.",
    en: "A perfect score isn't a promise: it's the baseline of everything I ship.",
  } as Localized,
  labels: {
    perf: { pt: "Performance", en: "Performance" },
    a11y: { pt: "Acessibilidade", en: "Accessibility" },
    best: { pt: "Boas práticas", en: "Best practices" },
    seo: { pt: "SEO", en: "SEO" },
  },
};
