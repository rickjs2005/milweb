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
    caseStudy: {
      narrative: [
        {
          pt: "Monorepo Turborepo + pnpm com três frentes num só backend: Next.js 16 (App Router) pro web — que sozinho já cobre três painéis (produtor, corretora e admin da plataforma) — e Expo Router pro app mobile do produtor. Web e mobile falam com o mesmo Supabase através de um pacote compartilhado (@milsaca/db) com três camadas de client: uma com cookie de sessão pro server, uma sem cookie (só a chave pública) pra rotas com cache, e uma com secure-store pro mobile.",
          en: "A Turborepo + pnpm monorepo with three fronts on one backend: Next.js 16 (App Router) for web — which alone covers three panels (producer, broker, and platform admin) — and Expo Router for the producer's mobile app. Web and mobile talk to the same Supabase through a shared package (@milsaca/db) with three client layers: one with a session cookie for the server, one cookie-less (public key only) for cached routes, and one with secure-store for mobile.",
        },
        {
          pt: "Multi-tenant de verdade, não só \"filtro no WHERE\": toda tabela do schema público tem Row Level Security habilitada, sem exceção, com isolamento por corretora_id garantido no banco — não na aplicação. Papéis (produtor/corretora/admin) vivem num array na tabela de perfil, permitindo o mesmo e-mail acumular mais de um papel; o admin da plataforma fica numa tabela própria, fora do enum de papéis, pra não vazar por engano num RLS mal escrito.",
          en: "Multi-tenant for real, not just a \"WHERE filter\": every table in the public schema has Row Level Security enabled, no exceptions, with isolation by corretora_id enforced in the database — not in the application layer. Roles (producer/broker/admin) live in an array on the profile table, letting the same email hold more than one role; the platform admin sits in its own table, outside the role enum, so a sloppy RLS policy can't accidentally leak it.",
        },
        {
          pt: "A decisão de autenticação é um bom exemplo de aprender com o próprio produto: começou com magic link e foi trocada por OTP de 6 dígitos por e-mail, porque o Gmail Safe Links faz prefetch automático do link (pra escanear por segurança) e acaba \"queimando\" o token de uso único antes do usuário clicar — um bug sutil que só aparece em produção, com e-mails reais.",
          en: "The auth decision is a good example of learning from the product itself: it started with magic links and was switched to a 6-digit email OTP, because Gmail Safe Links auto-prefetches the link (to scan it for safety) and ends up \"burning\" the one-time token before the user even clicks — a subtle bug that only shows up in production, with real email providers.",
        },
        {
          pt: "O diferencial de domínio é a classificação COB (Instrução Normativa MAPA nº 8/2003): a lógica de tipos, defeitos, peneira e bebida do café cru foi extraída pra um pacote puro (@milsaca/cob), sem dependência de runtime, testável isoladamente — o laudo gerado tem PDF com QR code e uma página pública de verificação, dando ao produtor algo que hoje é feito no papel ou de cabeça.",
          en: "The domain differentiator is the COB classification (Brazilian MAPA regulation IN 8/2003): the logic for coffee type, defects, screen size and cup quality was extracted into a pure package (@milsaca/cob), with no runtime dependencies, independently testable — the generated report ships as a PDF with a QR code and a public verification page, giving the producer something that today is done on paper or from memory.",
        },
      ],
      highlights: [
        {
          label: { pt: "Multi-tenant via RLS", en: "Multi-tenant via RLS" },
          detail: { pt: "Isolamento por corretora_id garantido no banco, não na aplicação — RLS em toda tabela.", en: "Isolation by corretora_id enforced in the database, not the app — RLS on every table." },
        },
        {
          label: { pt: "Laudo COB digital", en: "Digital COB report" },
          detail: { pt: "Motor de classificação da IN 8/2003 (MAPA) em pacote puro, com PDF + QR de verificação pública.", en: "IN 8/2003 (MAPA) classification engine as a pure package, with PDF + public QR verification." },
        },
        {
          label: { pt: "Cotações ao vivo", en: "Live market quotes" },
          detail: { pt: "CEPEA, ICE NY Coffee C e PTAX (BCB) sincronizados via edge function agendada.", en: "CEPEA, ICE NY Coffee C and PTAX (Brazil's central bank) synced via a scheduled edge function." },
        },
        {
          label: { pt: "Web + mobile, um backend", en: "Web + mobile, one backend" },
          detail: { pt: "Next.js 16 e Expo Router compartilhando o mesmo Supabase por um pacote de clients em camadas.", en: "Next.js 16 and Expo Router sharing the same Supabase through a layered client package." },
        },
      ],
      gallery: [
        { src: "/shots/milsaca/landing.webp", alt: { pt: "Página pública do Milsaca", en: "Milsaca public landing page" } },
        { src: "/shots/milsaca/painel-corretora.webp", alt: { pt: "Painel da corretora — dados de demonstração", en: "Broker panel — demo data" } },
        { src: "/shots/milsaca/laudo-cob.webp", alt: { pt: "Laudo COB digital do produtor — dados de demonstração", en: "Producer's digital COB report — demo data" } },
      ],
    },
  },
  {
    slug: "millead",
    title: "MilLead",
    tagline: { pt: "CRM com IA · prospecção de clientes", en: "AI-powered CRM · client prospecting" },
    problem: { pt: "Prospectar clientes pra agência era manual: achar negócios com site fraco, avaliar um por um e escrever cada abordagem do zero.", en: "Prospecting clients for the agency was manual: finding businesses with weak websites, assessing each one and writing every outreach from scratch." },
    result: { pt: "CRM interno completo: pipeline kanban, auditoria automática de sites (performance, SEO, segurança), IA que pontua leads, escreve mensagens e gera landing pages de demonstração publicáveis com um clique.", en: "A complete internal CRM: kanban pipeline, automated website audits (performance, SEO, security), and AI that scores leads, writes outreach and generates demo landing pages publishable in one click." },
    stack: ["Next.js", "Express", "PostgreSQL", "Prisma", "BullMQ", "Claude API"],
    metric: { pt: "Auditoria de sites · IA · landing pages", en: "Website audits · AI · landing pages" },
    repos: [{ label: "Código", url: `${GH}/millead` }],
    status: { pt: "Ferramenta interna da MilWeb", en: "MilWeb internal tool" },
    image: "/shots/millead.png",
    note: {
      pt: "CRM interno usado na prospecção da própria MilWeb.",
      en: "Internal CRM used in MilWeb's own prospecting.",
    },
    featured: true,
    caseStudy: {
      narrative: [
        {
          pt: "Monorepo pnpm + Turborepo com API Express em Clean Architecture (domain/application/infrastructure/interfaces) e web Next.js 15. Multi-tenant por coluna discriminadora com RLS habilitado em todas as tabelas do Postgres (Supabase), auth JWT com refresh token de rotação atômica e RBAC com catálogo de permissões por papel.",
          en: "A pnpm + Turborepo monorepo with an Express API in Clean Architecture (domain/application/infrastructure/interfaces) and a Next.js 15 web app. Multi-tenant via discriminator column with RLS enabled on every Postgres table (Supabase), JWT auth with atomic refresh-token rotation, and RBAC with a per-role permission catalog.",
        },
        {
          pt: "O diferencial é o funil de prospecção automatizado: um worker BullMQ (Redis/Upstash) baixa o site do prospect e roda ~30 checagens próprias em 6 categorias (performance, SEO, acessibilidade, segurança, mobile, design), cada nota explicável check a check. Esses achados alimentam a IA (Claude, via SDK oficial): score de oportunidade 0-100 com justificativa, rascunhos de mensagem personalizados por canal e um relatório executivo do lead.",
          en: "The differentiator is the automated prospecting funnel: a BullMQ worker (Redis/Upstash) fetches the prospect's website and runs ~30 custom checks across 6 categories (performance, SEO, accessibility, security, mobile, design), every score explainable check by check. Those findings feed the AI (Claude, official SDK): a 0-100 opportunity score with rationale, per-channel personalized outreach drafts, and an executive lead report.",
        },
        {
          pt: "O fecho do funil são as landing pages geradas por IA: HTML único e autocontido (sem JS nem recursos externos), criado a partir dos dados da empresa + auditoria, servido numa URL pública com slug não-enumerável e contador de visitas — a demonstração \"veja como o site de vocês poderia ficar\" que a agência manda pro prospect.",
          en: "The funnel closes with AI-generated landing pages: a single self-contained HTML file (no JS, no external resources) built from the company data + audit, served at a public URL with a non-enumerable slug and a view counter — the \"here's what your website could look like\" demo the agency sends to prospects.",
        },
      ],
      highlights: [
        {
          label: { pt: "Auditoria de sites própria", en: "Custom website audits" },
          detail: { pt: "~30 checagens em 6 categorias via fila BullMQ, sem depender de API externa — nota explicável check a check.", en: "~30 checks across 6 categories via a BullMQ queue, no external API — scores explainable check by check." },
        },
        {
          label: { pt: "IA aplicada a vendas", en: "AI applied to sales" },
          detail: { pt: "Score de oportunidade, mensagens e relatórios com Claude, usando lead + empresa + auditoria como contexto.", en: "Opportunity scoring, outreach and reports with Claude, using lead + company + audit as context." },
        },
        {
          label: { pt: "Landing pages por IA", en: "AI-built landing pages" },
          detail: { pt: "HTML autocontido gerado sob demanda e publicado em URL pública com contador de visitas.", en: "Self-contained HTML generated on demand and published at a public URL with a view counter." },
        },
        {
          label: { pt: "Multi-tenant seguro", en: "Secure multi-tenant" },
          detail: { pt: "organizationId em toda tabela + RLS no Postgres, JWT com rotação atômica de refresh token e RBAC.", en: "organizationId on every table + Postgres RLS, JWT with atomic refresh-token rotation, and RBAC." },
        },
      ],
    },
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
    caseStudy: {
      narrative: [
        {
          pt: "Monorepo pnpm + Turborepo com Clean Architecture explícita: apps/web (Next.js 15, App Router, React 19) cobre SSR/ISR das páginas públicas e Server Actions para mutações, apps/realtime isola o Socket.IO num processo dedicado — WebSocket de longa duração não convive bem com o modelo serverless do Next — e apps/worker roda os jobs assíncronos via BullMQ. A regra de negócio nunca mora nas rotas: fica em packages/core (use cases puros, sem I/O, DTOs validados com zod) que só conhece interfaces (ports) implementadas por packages/infra (repositórios Prisma) — decisão que permitiria trocar a borda HTTP por outro framework sem tocar no domínio. Autenticação usa Better Auth em vez de Auth.js porque o plugin organization resolve membership multi-tenant nativamente (role ADMIN de plataforma e OWNER/MANAGER/ARTIST por estúdio; cliente é usuário sem membership).",
          en: "pnpm + Turborepo monorepo with explicit Clean Architecture: apps/web (Next.js 15, App Router, React 19) covers SSR/ISR for public pages and Server Actions for mutations, apps/realtime isolates Socket.IO in its own process — long-lived WebSockets don't play well with Next's serverless model — and apps/worker runs async jobs through BullMQ. Business rules never live in routes: they sit in packages/core (pure use cases, no I/O, zod-validated DTOs) which only knows interfaces (ports) implemented by packages/infra (Prisma repositories) — a decision that would let the HTTP edge be swapped for another framework without touching the domain. Auth uses Better Auth instead of Auth.js because its organization plugin resolves multi-tenant membership natively (platform ADMIN role plus per-studio OWNER/MANAGER/ARTIST; clients are users with no membership).",
        },
        {
          pt: "A simulação de tatuagem é a feature central e foi desenhada como um pipeline, não uma chamada única de IA: packages/ai expõe portas (TattooSimulationProvider, ImageGenerationProvider, SkinSegmentationProvider) e um registry que troca de provider — Fal.ai, Replicate, OpenAI, Gemini, Stable Diffusion — só com uma env var, sem nenhum caso de uso importando um provider concreto. O fluxo é segmentar a pele/parte do corpo → estimar perspectiva e curvatura → aplicar o desenho com warp na escala e posição escolhidas pelo cliente no editor (arrastar, redimensionar, rotacionar) → um passo de img2img de baixa intensidade que harmoniza sombra, textura e iluminação preservando o traço original. Como a geração leva de 10 a 60 segundos, a API só enfileira no BullMQ; o worker chama o provider e o resultado chega ao cliente por WebSocket (evento simulation:done) — nenhum request HTTP fica pendurado esperando a IA responder. Cada chamada grava um AiUsageLog (provider, operação, custo) que alimenta o dashboard admin e os limites de crédito por plano.",
          en: "Tattoo simulation is the centerpiece feature and was designed as a pipeline, not a single AI call: packages/ai exposes ports (TattooSimulationProvider, ImageGenerationProvider, SkinSegmentationProvider) and a registry that swaps providers — Fal.ai, Replicate, OpenAI, Gemini, Stable Diffusion — with just an env var, with no use case importing a concrete provider. The flow is: segment skin/body part → estimate perspective and curvature → warp the artwork to the scale and position the client chose in the editor (drag, resize, rotate) → a low-intensity img2img pass that blends shadow, texture and lighting while preserving the original line work. Since generation takes 10 to 60 seconds, the API only enqueues a BullMQ job; the worker calls the provider and the result reaches the client over WebSocket (simulation:done event) — no HTTP request hangs waiting on the AI. Every call writes an AiUsageLog (provider, operation, cost) that feeds both the admin dashboard and per-plan credit limits.",
        },
        {
          pt: "O isolamento multi-tenant é banco único com studioId em três camadas de defesa, não um filtro solto em cada query: uma extensão do Prisma Client exige studioId em toda consulta de modelo tenant-scoped (lança erro em dev, bloqueia em prod), Postgres RLS (SET app.current_studio_id) atua como defesa em profundidade mesmo se a camada de aplicação falhar, e existe uma suíte de testes de isolamento que tenta acesso cross-tenant em cada rota. Essa defesa em profundidade pegou um bug real: getActor() lia a tabela StudioMember — protegida por RLS — sem abrir o contexto de tenant/admin, então a política de RLS nunca casava e a consulta voltava vazia mesmo com memberships reais, deixando o dono do estúdio com o painel idêntico ao de um cliente comum. O bug nunca apareceu em dev local porque o role do Postgres usado localmente ignora RLS por padrão; só foi achado numa auditoria visual comparando telas reais, e o fix (withAdmin(), seguro porque o filtro final continua sendo pelo próprio userId) deixa a lição clara: sem testar contra o role de produção sem bypass de RLS, esse tipo de bug fica invisível indefinidamente.",
          en: "Multi-tenant isolation is a single database with studioId enforced in three layers of defense, not a loose filter bolted onto each query: a Prisma Client extension requires studioId on every tenant-scoped model query (throws in dev, blocked in prod), Postgres RLS (SET app.current_studio_id) acts as defense-in-depth even if the application layer fails, and a dedicated test suite attempts cross-tenant access against every route. That defense-in-depth caught a real bug: getActor() was reading the RLS-protected StudioMember table without opening the tenant/admin context, so the RLS policy never matched and the query silently came back empty even with real memberships — studio owners saw a dashboard identical to a regular client's. The bug never surfaced in local dev because the Postgres role used there bypasses RLS by default; it only turned up in a visual audit comparing real screens, and the fix (withAdmin(), safe because the final filter is still the caller's own userId) makes the lesson explicit: without testing against a production role with no RLS bypass, this class of bug stays invisible indefinitely.",
        },
        {
          pt: "O primeiro deploy real (Vercel + Neon, ambiente de teste antes da VPS de produção) revelou três bugs que nenhum ambiente anterior exercitava. A migration da constraint anti-overbooking usava tstzrange() num índice, que depende do fuso da sessão (função STABLE, não IMMUTABLE) e quebra num migrate deploy de verdade — corrigida trocando para tsrange(), que bate com o tipo real da coluna; local usa prisma db push (ignora SQL bruto) e o CI não rodava migrations, então o bug ficou invisível até o primeiro migrate deploy real, e teria travado o primeiro deploy na VPS também. O bundle serverless da Vercel também 'perdia' o query engine do Prisma num monorepo pnpm — resolvido com o plugin oficial de workaround, ativo só quando VERCEL=1 pra não afetar o Docker da VPS. E o rate limiting do Better Auth usava um limitador em memória que simplesmente não funciona com múltiplas instâncias serverless — trocado para armazenamento em banco (tabela RateLimit, deliberadamente fora do RLS, no mesmo padrão de User/Session, que também não são multi-tenant).",
          en: "The first real deploy (Vercel + Neon, a test environment ahead of the production VPS) surfaced three bugs no earlier environment exercised. The anti-overbooking constraint migration used tstzrange() on an index, which depends on the session timezone (a STABLE, not IMMUTABLE, function) and breaks on a real migrate deploy — fixed by switching to tsrange(), which matches the column's actual type; local dev uses prisma db push (which ignores raw SQL) and CI never ran migrations, so the bug stayed invisible until the first real migrate deploy, and would have blocked the first VPS deploy too. The Vercel serverless bundle also 'lost' Prisma's query engine inside a pnpm monorepo — fixed with the official workaround plugin, active only when VERCEL=1 so it doesn't touch the VPS's Docker build. And Better Auth's rate limiting used an in-memory limiter that simply doesn't work across multiple serverless instances — swapped for database-backed storage (a RateLimit table, deliberately outside RLS, following the same pattern as User/Session, which also aren't multi-tenant).",
        },
      ],
      highlights: [
        {
          label: { pt: "Simulação de IA como pipeline", en: "AI simulation as a pipeline" },
          detail: { pt: "Segmentação de pele, estimativa de perspectiva/curvatura, warp do desenho e img2img de baixa intensidade pra harmonizar sombra e textura — não uma chamada única de IA.", en: "Skin segmentation, perspective/curvature estimation, artwork warp and a low-intensity img2img pass to harmonize shadow and texture — not a single AI call." },
        },
        {
          label: { pt: "Provider de IA plugável", en: "Pluggable AI provider" },
          detail: { pt: "packages/ai troca entre Fal.ai, Replicate, OpenAI, Gemini ou Stable Diffusion só com uma env var — nenhum caso de uso importa um provider concreto.", en: "packages/ai swaps between Fal.ai, Replicate, OpenAI, Gemini or Stable Diffusion with just an env var — no use case imports a concrete provider." },
        },
        {
          label: { pt: "Multi-tenant em 3 camadas", en: "3-layer multi-tenancy" },
          detail: { pt: "Extensão do Prisma que exige studioId, Postgres RLS como defesa em profundidade e uma suíte automatizada de testes de isolamento cross-tenant.", en: "A Prisma extension enforcing studioId, Postgres RLS as defense-in-depth, and an automated cross-tenant isolation test suite." },
        },
        {
          label: { pt: "Bugs só visíveis em produção real", en: "Bugs only visible in real production" },
          detail: { pt: "Migration com tstzrange() só quebrava num migrate deploy de verdade (dev usa db push); achada no primeiro deploy Vercel+Neon, antes de chegar na VPS.", en: "A tstzrange() migration only broke on a real migrate deploy (dev uses db push); caught during the first Vercel+Neon deploy, before it could reach the VPS." },
        },
      ],
    },
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
    caseStudy: {
      narrative: [
        {
          pt: "O motion do ROCKVERSE não é biblioteca-padrão ligada no automático: o scroll passa por Lenis (lerp 0.1, smoothWheel), desligando o scroll-behavior: smooth nativo do CSS pra evitar que os dois sistemas disputem o mesmo frame — um conflito sutil que só aparece quando se clica num link âncora e a página \"engasga\" no meio do scroll. O cursor customizado (CustomCursor.tsx) só ativa em pointer: fine — telas touch nunca pagam o custo — e usa um anel com física de spring (stiffness 250, damping 25) seguindo um ponto rígido; um atributo data-cursor nos elementos interativos troca o rótulo do cursor contextualmente (ex.: \"GIRAR\" sobre um vinil), sem re-render desnecessário porque o estado só muda quando o valor realmente muda (bail-out do React via Object.is). A headline do hero é revelada letra a letra com máscara (overflow-hidden + translateY por motion.span, stagger de 35ms por caractere) e reage à posição do mouse com paralaxe em três camadas (fundo, título, luz radial) via useMotionValue + useSpring + useTransform — tudo com fallback estático completo quando prefers-reduced-motion está ativo.",
          en: "ROCKVERSE's motion isn't a stock library switched to autopilot: scroll runs through Lenis (lerp 0.1, smoothWheel), explicitly turning off the native CSS scroll-behavior: smooth so the two systems don't fight over the same frame — a subtle conflict that only shows up when you click an anchor link and the page \"stutters\" mid-scroll. The custom cursor (CustomCursor.tsx) only activates on pointer: fine — touch screens never pay the cost — and uses a spring-physics ring (stiffness 250, damping 25) trailing a rigid point; a data-cursor attribute on interactive elements swaps the cursor's label contextually (e.g. \"SPIN\" over a vinyl record) without unnecessary re-renders, since state only updates when the value actually changes (React's Object.is bail-out). The hero headline reveals letter by letter through a mask (overflow-hidden + translateY per motion.span, 35ms stagger per character) and reacts to mouse position with three-layer parallax (background, title, radial light) via useMotionValue + useSpring + useTransform — with a full static fallback whenever prefers-reduced-motion is set.",
        },
        {
          pt: "O diferencial em relação a \"mais um site com fadeUp\" está nas cenas ligadas ao próprio scroll, não só disparadas por ele. A timeline de décadas (History.tsx) tem uma barra de progresso em gradiente cuja escala Y é useScroll + useSpring do progresso da seção inteira, enquanto cada card individual roda seu próprio useScroll local pra dar paralaxe à imagem (-8% a 8%) e deslocar o ano lateralmente — com a imagem em sticky no desktop pra criar sensação de profundidade sem WebGL. Na seção de álbuns, os vinis por trás das capas giram fisicamente conforme o usuário rola a grade inteira (useTransform de 0 a 180 graus sobre o scrollYProgress da seção), e ganham animate-spin-slow de verdade só quando abertos no modal. O divisor de marquee vai além: em vez de rolar em velocidade fixa, aplica um skewX calculado a partir da velocidade instantânea do scroll (useVelocity sobre scrollY, mapeada pra -5°/5° com spring) — o texto se inclina mais quanto mais rápido o visitante rola, um detalhe que só existe em sites que tratam o scroll como instrumento, não como gatilho de fade-in.",
          en: "What sets this apart from \"yet another fadeUp site\" is the set of scenes tied to scroll position itself, not just triggered by it. The decades timeline (History.tsx) has a gradient progress bar whose Y-scale comes from useScroll + useSpring over the whole section's progress, while each individual card runs its own local useScroll to parallax its image (-8% to 8%) and shift the year label sideways — with the image pinned sticky on desktop to fake depth without WebGL. In the albums section, the vinyl records behind each sleeve physically spin as the user scrolls through the grid (useTransform from 0 to 180 degrees over the section's scrollYProgress), and only get a real animate-spin-slow once opened in the modal. The marquee divider goes further: instead of scrolling at a fixed speed, it applies a skewX derived from the scroll's instantaneous velocity (useVelocity on scrollY, mapped to -5°/5° through a spring) — the text tilts more the faster the visitor scrolls, a detail that only shows up on sites treating scroll as an instrument rather than a fade-in trigger.",
        },
        {
          pt: "Manter Lighthouse 99/100/100/100 com esse volume de efeito exigiu decisões de arquitetura, não sorte. app/page.tsx carrega Hero, History, Navbar e a barra de progresso de forma eager (é o que aparece na primeira dobra), e faz next/dynamic de todas as outras nove seções abaixo da dobra (Bands, Instruments, Genres, Festivals, Albums, HallOfFame, Curiosities, Stats, Gallery, Newsletter, Footer) — o bundle inicial não paga o custo de código que o usuário talvez nunca role até ver. As partículas de brasa do hero (EmberCanvas.tsx) não são componentes Framer Motion — são um canvas 2D cru desenhado a mão, com IntersectionObserver pausando o requestAnimationFrame fora da viewport e um listener de visibilitychange pausando quando a aba perde foco, além de devicePixelRatio limitado a 2 e densidade de partículas cortada pela metade no mobile. next/image usa qualidades customizadas (qualities: [60, 75], hero explicitamente em 60) pra cortar payload de LCP sem imagem borrada perceptível. E o prefers-reduced-motion é tratado em duas camadas: um kill-switch global no CSS (zera todas as animation-duration/transition-duration) e checagens pontuais via useReducedMotion() nos componentes que fazem cálculo de física (parallax do hero, timeline, rotação dos vinis) — sem isso, a query CSS mataria a transition mas não pararia os cálculos de useTransform rodando a cada frame.",
          en: "Keeping a 99/100/100/100 Lighthouse score with this much motion took architectural decisions, not luck. app/page.tsx loads Hero, History, Navbar and the scroll-progress bar eagerly (what's visible above the fold), and wraps every other one of the nine below-the-fold sections (Bands, Instruments, Genres, Festivals, Albums, HallOfFame, Curiosities, Stats, Gallery, Newsletter, Footer) in next/dynamic — the initial bundle doesn't pay for code the visitor may never scroll far enough to see. The hero's ember particles (EmberCanvas.tsx) aren't Framer Motion components at all — they're a hand-rolled raw 2D canvas, with an IntersectionObserver pausing the requestAnimationFrame loop outside the viewport and a visibilitychange listener pausing it when the tab loses focus, plus devicePixelRatio capped at 2 and particle density halved on mobile. next/image uses custom quality tiers (qualities: [60, 75], the hero image explicitly pinned to 60) to cut LCP payload with no perceptible blur. And prefers-reduced-motion is handled in two layers: a global CSS kill-switch (zeroes every animation-duration/transition-duration) plus targeted useReducedMotion() checks inside components doing physics math (hero parallax, timeline, vinyl rotation) — without the second layer, the CSS media query would kill the transition but leave the underlying useTransform calculations still running every frame.",
        },
        {
          pt: "O resultado documentado em docs/DESIGN-AUDIT.md é o que mais diferencia o processo: uma auto-auditoria de 20 problemas, escrita como se fosse um jurado de premiação avaliando o site (\"veredito geral: 7.2/10\"), cobrindo hero, paleta, tipografia, espaçamento, componentes e imagens — com um roadmap de 5 fases explícito. A Fase 4 do roadmap, \"Motion Design\", listava exatamente o que faltava (Lenis, headline cinética, timeline com scrub, skew no marquee por velocidade) — e é literalmente o que está implementado no código hoje. Tratar o próprio projeto autoral como se fosse um cliente exigente, com auditoria escrita, tabela de prioridade (P0 a P3) e reavaliação de Lighthouse a cada fase, é o que separa \"fizemos um site bonito\" de um processo de design repetível.",
          en: "The result documented in docs/DESIGN-AUDIT.md is what most sets the process apart: a self-audit of 20 issues, written as if an awards-show juror were grading the site (\"overall verdict: 7.2/10\"), covering hero, palette, typography, spacing, components and imagery — with an explicit 5-phase roadmap. Phase 4 of that roadmap, \"Motion Design\", listed exactly what was missing (Lenis, kinetic headline, scrubbed timeline, velocity-based marquee skew) — and that is literally what's implemented in the code today. Treating one's own passion project like a demanding client, with a written audit, a priority table (P0 through P3), and a Lighthouse re-check after every phase, is what separates \"we made a pretty site\" from a repeatable design process.",
        },
      ],
      highlights: [
        {
          label: { pt: "Scroll com física real", en: "Real-physics scroll" },
          detail: { pt: "Lenis com lerp 0.1 substitui o scroll nativo, com âncoras recalculadas via offset de navbar em vez de saltos secos.", en: "Lenis at lerp 0.1 replaces native scroll, with anchors recalculated through a navbar offset instead of hard jumps." },
        },
        {
          label: { pt: "Headline letra a letra", en: "Letter-by-letter headline" },
          detail: { pt: "Reveal por máscara com stagger de 35ms por caractere, mais paralaxe de mouse em três camadas independentes.", en: "Mask-based reveal with a 35ms stagger per character, plus three independent layers of mouse parallax." },
        },
        {
          label: { pt: "Cenas ligadas ao scroll", en: "Scroll-linked scenes" },
          detail: { pt: "Vinil que gira com o progresso da seção e marquee que se inclina conforme a velocidade instantânea do scroll.", en: "Vinyl records that spin with section scroll progress, and a marquee that skews with the scroll's instantaneous velocity." },
        },
        {
          label: { pt: "99/100/100/100 sem atalho", en: "99/100/100/100, no shortcuts" },
          detail: { pt: "Code-splitting por seção, partículas em canvas cru pausadas fora da viewport e reduced-motion tratado em duas camadas.", en: "Per-section code-splitting, raw-canvas particles paused off-viewport, and reduced-motion handled in two layers." },
        },
      ],
      gallery: [
        { src: "/shots/rockverse/hero.webp", alt: { pt: "Hero do ROCKVERSE com headline cinética", en: "ROCKVERSE hero with kinetic headline" } },
        { src: "/shots/rockverse/albums.webp", alt: { pt: "Grade de vinis (Discoteca)", en: "Vinyl grid (Discography section)" } },
      ],
    },
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
    caseStudy: {
      narrative: [
        {
          pt: "Site 100% estático em Next.js (App Router), sem backend, sem banco de dados: história, curiosidades, estádios e figurinhas moram em módulos TypeScript tipados dentro de src/data. Isso vira SSG puro — inclusive páginas dedicadas por estádio (/estadios/[slug]) geradas via generateStaticParams, cada uma com metadata e canonical próprios — e explica a sensação de carregamento instantâneo mesmo em 3G: zero round-trip a qualquer API para renderizar conteúdo.",
          en: "A 100% static Next.js site (App Router), no backend, no database: history, trivia, stadiums and stickers live in typed TypeScript modules under src/data. That compiles to pure SSG — including dedicated per-stadium pages (/estadios/[slug]) generated via generateStaticParams, each with its own metadata and canonical URL — which explains the instant-load feel even on 3G: zero round-trips to any API to render content.",
        },
        {
          pt: "O diferencial é um gerador procedural de estádios em React Three Fiber: cada um dos 8 estádios icônicos é descrito por um StadiumParams tipado (perfil radial em pontos [raio, altura] revolucionado com LatheGeometry, proporções sx/sz próprias e um \"landmark\" único — torre art déco no Centenário, anel plano no Maracanã, arco gigante em Wembley, coroa dourada em Lusail, lâminas de aço no MetLife). As arquibancadas em degraus não são um asset importado: é uma BufferGeometry construída na mão, fileira por fileira, com vertex colors para simular corredores de setor e degraus alternados — e a torcida é um InstancedMesh de milhares de esferas posicionadas por um PRNG determinístico (mulberry32, seed por hash do slug) para nunca variar entre servidor e cliente e nunca quebrar a hidratação.",
          en: "The differentiator is a procedural stadium generator in React Three Fiber: each of the 8 iconic stadiums is described by a typed StadiumParams object (a radial profile of [radius, height] points revolved with LatheGeometry, its own sx/sz proportions and a unique \"landmark\" — an art-deco tower for Estádio Centenário, a flat overhanging ring for Maracanã, a giant arch for Wembley, a golden crown for Lusail, steel blades for MetLife). The terraced stands aren't an imported asset — they're a hand-built BufferGeometry, row by row, with vertex colors simulating sector aisles and alternating steps, and the crowd is an InstancedMesh of thousands of spheres placed by a deterministic PRNG (mulberry32, seeded from a hash of the slug) so it never varies between server and client and never breaks hydration.",
        },
        {
          pt: "A experiência 3D foi escrita para sobreviver a mundo real: teste de contexto WebGL antes de montar o Canvas (com fallback textual + fotos reais se falhar), frameloop=\"never\" quando o card sai da viewport ou a aba fica oculta (IntersectionObserver + visibilitychange, economizando bateria no mobile), dica de gravação que detecta touch/user agent para não instruir \"Win+Alt+R\" num iPhone, e um Modo cinema com câmera respirando (seno suave em Y) mais uma marca d'água discreta gravada no canto do vídeo — porque o objetivo do site é ser compartilhado, e um clipe sem atribuição não traz ninguém de volta.",
          en: "The 3D experience was written to survive the real world: a WebGL context probe before mounting the Canvas (falling back to text + real photos if it fails), frameloop=\"never\" when the card leaves the viewport or the tab goes hidden (IntersectionObserver + visibilitychange, saving mobile battery), a recording hint that detects touch/user-agent so it never tells an iPhone user to press \"Win+Alt+R\", and a Cinema mode with a gently breathing camera (a soft sine on Y) plus a discreet watermark baked into the corner of the shot — because the whole point of the site is to be shared, and an unattributed clip brings nobody back.",
        },
        {
          pt: "O projeto nasceu com uma auto-auditoria sênior de UX/UI/SEO/acessibilidade rodada sobre o próprio código e o HTML servido em produção (14 dimensões, contrastes WCAG calculados par a par). Boa parte do roadmap gerado ali já foi implementada: countdown com estado pós-final, botão de compartilhar por estádio/curiosidade, fallback de WebGL, pausa do render fora de tela, páginas individuais por estádio para SEO long-tail e a marca d'água do Modo cinema — o tipo de disciplina de \"projeto pessoal tratado como produto\" que normalmente só aparece em trabalho remunerado.",
          en: "The project started with a senior-level self-audit of UX/UI/SEO/accessibility run against its own code and the HTML served in production (14 dimensions, WCAG contrast ratios calculated pairwise). Most of the resulting roadmap has since shipped: a post-final countdown state, a share button on every stadium and trivia card, a WebGL fallback, off-screen render pausing, individual per-stadium pages for long-tail SEO, and the Cinema-mode watermark — the kind of \"side project treated like a real product\" discipline that usually only shows up in paid work.",
        },
      ],
      highlights: [
        {
          label: { pt: "100% estático", en: "100% static" },
          detail: { pt: "Sem backend nem banco: conteúdo em módulos TypeScript, SSG total incluindo página própria por estádio.", en: "No backend, no database: content lives in TypeScript modules, full SSG including a dedicated page per stadium." },
        },
        {
          label: { pt: "Estádios procedurais", en: "Procedural stadiums" },
          detail: { pt: "8 estádios em 3D gerados por parâmetros (LatheGeometry + BufferGeometry escrita à mão), não modelos importados.", en: "8 stadiums in 3D generated from parameters (LatheGeometry + hand-built BufferGeometry), not imported models." },
        },
        {
          label: { pt: "Torcida determinística", en: "Deterministic crowd" },
          detail: { pt: "Milhares de instâncias posicionadas por PRNG com seed fixa — mesmo resultado no servidor e no cliente, zero erro de hidratação.", en: "Thousands of instances placed by a seeded PRNG — identical output on server and client, zero hydration mismatch." },
        },
        {
          label: { pt: "3D com consciência de bateria", en: "Battery-aware 3D" },
          detail: { pt: "Render pausa fora da viewport e com a aba oculta; fallback amigável se o WebGL falhar.", en: "Rendering pauses off-viewport and on hidden tabs; a friendly fallback kicks in if WebGL fails." },
        },
      ],
      gallery: [
        { src: "/shots/as-copas/hero.webp", alt: { pt: "Página inicial de As Copas", en: "As Copas homepage" } },
        { src: "/shots/as-copas/estadios-3d.webp", alt: { pt: "Estádio procedural em 3D", en: "Procedural 3D stadium" } },
        { src: "/shots/as-copas/historia.webp", alt: { pt: "Seção de história e curiosidades", en: "History and trivia section" } },
      ],
    },
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
    caseStudy: {
      narrative: [
        {
          pt: "O stack em produção é Next.js 16 (App Router, Turbopack) sobre Supabase Postgres na região sa-east-1 — escolhida por residência de dados no Brasil, pensando em LGPD. É deliberadamente mais simples que a arquitetura-alvo documentada no blueprint do projeto (NestJS, Redis, NATS JetStream, Meilisearch, React Native/Expo): o MVP trocou tudo isso por um atalho de validação rápida. Como o produto é só-texto e sem grafo social (sem seguir, sem seguidores), o problema mais caro de uma rede social — fan-out de timeline — simplesmente não existe: cada post pesa poucos KB e a query do feed é uma view Postgres com paginação por keyset, sem fila nem cache dedicado.",
          en: "The production stack is Next.js 16 (App Router, Turbopack) on Supabase Postgres in the sa-east-1 region — chosen for in-Brazil data residency with LGPD in mind. It's deliberately simpler than the target architecture documented in the project's blueprint (NestJS, Redis, NATS JetStream, Meilisearch, React Native/Expo): the MVP swapped all of that for a faster validation shortcut. Since the product is text-only with no social graph (no following, no followers), the most expensive problem in a social network — timeline fan-out — simply doesn't exist: each post weighs a few KB and the feed query is a Postgres view with keyset pagination, no queue or dedicated cache needed.",
        },
        {
          pt: "Anonimato aqui não é 'sem cadastro', é uma garantia de banco de dados. Cada pessoa entra via signInAnonymously() do Supabase e recebe um public_number gerado por uma função Postgres (sorteio com checagem de unicidade), exibido como \"Usuário #48291\". O UUID interno (profiles.id) nunca sai do banco: um revoke select remove o acesso padrão da tabela posts/comments/profiles para o papel authenticated, e um grant select seguinte devolve acesso só a uma lista explícita de colunas — sem user_id. Na prática, mesmo uma query client-side maliciosa não consegue ligar conta a conteúdo, porque o privilégio pra isso não existe no papel do banco, não é uma regra de aplicação que dá pra contornar. Não existe página de perfil navegável — tocar num \"#48291\" não abre histórico nenhum, decisão deliberada anti-stalking.",
          en: "Anonymity here isn't 'no signup' — it's a database-level guarantee. Each person enters via Supabase's signInAnonymously() and gets a public_number generated by a Postgres function (random draw with a uniqueness check), shown as \"User #48291\". The internal UUID (profiles.id) never leaves the database: a revoke select strips the default table privilege on posts/comments/profiles from the authenticated role, then a grant select restores access only to an explicit column list — excluding user_id. In practice, even a malicious client-side query can't join account to content, because the privilege to do so doesn't exist at the database-role level — it isn't an application rule that could be worked around. There's no browsable profile page either — tapping a \"#48291\" opens no history, a deliberate anti-stalking design choice.",
        },
        {
          pt: "A moderação roda em dois estágios, ambos em lib/moderation.ts. O estágio 0 é determinístico e instantâneo: normalização Unicode NFKC (contra bypass por homóglifos), bloqueio de links, regex de PII (e-mail/telefone) que só sinaliza, e um regex de sinal de crise (\"quero morrer\", \"me machucar\") que nunca bloqueia a publicação — só existe pra acionar apoio. O estágio 2 é opcional: uma chamada à Claude Haiku com saída JSON estruturada, cujo prompt de sistema instrui explicitamente \"na dúvida, não sinalize\", porque um falso positivo silenciando alguém em sofrimento é tratado como pior que um falso negativo. O design é fail-open por princípio — se a API cair ou estourar timeout de 8s, o conteúdo passa; hoje, sem crédito de API configurado em produção, só o estágio 0 está realmente ativo. Denúncias da comunidade viram auto-remoção via trigger Postgres a partir de 3 denunciantes distintos, sem fila de moderação dedicada — o painel do Supabase faz esse papel no MVP.",
          en: "Moderation runs in two stages, both in lib/moderation.ts. Stage 0 is deterministic and instant: Unicode NFKC normalization (against homoglyph bypass tricks), link blocking, a PII regex (email/phone) that only flags, and a crisis-signal regex (\"I want to die\", \"hurt myself\") that never blocks publishing — it only exists to trigger support. Stage 2 is optional: a call to Claude Haiku with structured JSON output, whose system prompt explicitly instructs \"when in doubt, don't flag\", because a false positive silencing someone in distress is treated as worse than a false negative. The design is fail-open by principle — if the API goes down or hits its 8-second timeout, content passes through; today, with no API budget provisioned in production, only stage 0 is actually active. Community reports auto-remove content via a Postgres trigger once 3 distinct reporters flag the same item, with no dedicated moderation queue app — the raw Supabase dashboard fills that role in the MVP.",
        },
        {
          pt: "Algumas decisões deixam claro o tipo de produto que é: nunca vai ter mensagem privada (\"vetor de assédio/aliciamento\"), nunca vai ter hashtag livre — só uma taxonomia curada de 13 tópicos pra impedir campanhas coordenadas — e o feed é cronológico, sem scroll infinito, com \"marcos de respiro\" a cada ~50 posts, decisão estrutural anti-vício e não só de UX. A recuperação de conta sem e-mail usa uma frase de 6 palavras (lista de 240 termos, ~47 bits de entropia) com hash bcrypt, reatribuída via RPC com ON UPDATE CASCADE propagando pra posts/comentários/reações. O próprio time documentou a honestidade dos limites atuais: o contador de tentativas de recuperação é anulado pelo rollback da mesma transação que gera o erro de autenticação — um detalhe reconhecido e aceito, porque a entropia da frase e o custo do bcrypt já seguram a maior parte do risco. Uma suíte e2e de 19 cenários roda contra o banco real, incluindo checagem de que a privacidade por coluna realmente impede o vazamento de user_id.",
          en: "A few decisions make the kind of product this is clear: no private messaging, ever (\"a harassment/grooming vector\"), no free-form hashtags, ever — just a curated taxonomy of 13 topics specifically to prevent coordinated campaigns — and the feed is chronological, with no infinite scroll, with a \"breathing milestone\" every ~50 posts, a structural anti-addiction decision rather than just a UX nicety. Email-free account recovery uses a 6-word passphrase (a 240-word list, ~47 bits of entropy) hashed with bcrypt, reassigned via an RPC with ON UPDATE CASCADE propagating through posts/comments/reactions. The team documented the honest limits of what's shipped: the recovery-attempt counter gets wiped out by the same transaction rollback that produces the auth error — a known, accepted gap, since the passphrase's entropy and bcrypt's cost already cover most of the risk. A 19-scenario e2e suite runs against the real database, including a check that column-level privacy actually prevents user_id from leaking.",
        },
      ],
      highlights: [
        {
          label: { pt: "Anonimato por privilégio de coluna", en: "Anonymity via column privilege" },
          detail: { pt: "revoke select + grant em lista explícita de colunas: nem a API consegue ligar conta a post.", en: "revoke select plus an explicit column-list grant: not even the API can link account to post." },
        },
        {
          label: { pt: "Moderação em 2 estágios, fail-open", en: "2-stage moderation, fail-open" },
          detail: { pt: "Regex determinístico sempre ativo + Claude Haiku opcional — indisponibilidade da IA nunca bloqueia a publicação.", en: "Always-on deterministic regex + optional Claude Haiku — AI downtime never blocks a post from publishing." },
        },
        {
          label: { pt: "Recuperação sem e-mail", en: "Email-free recovery" },
          detail: { pt: "Frase de 6 palavras com hash bcrypt reatribui a conta via RPC, sem precisar de nenhum dado pessoal.", en: "A 6-word bcrypt-hashed passphrase reassigns the account via RPC, with zero personal data required." },
        },
        {
          label: { pt: "Anti-manipulação por design", en: "Anti-manipulation by design" },
          detail: { pt: "Sem hashtag livre, sem DM, 13 tópicos curados — estrutura pensada contra campanhas coordenadas.", en: "No free hashtags, no DMs, 13 curated topics — a structure built against coordinated campaigns." },
        },
      ],
      gallery: [
        { src: "/shots/ecoa/ecoa-onboarding-1-so-palavras.webp", alt: { pt: "Onboarding do ECOA — \"Aqui, só palavras\"", en: "ECOA onboarding — \"Here, only words\"" } },
        { src: "/shots/ecoa/ecoa-onboarding-2-regras-da-casa.webp", alt: { pt: "Onboarding do ECOA — regras da comunidade", en: "ECOA onboarding — community rules" } },
        { src: "/shots/ecoa/ecoa-onboarding-3-voce-e-um-numero.webp", alt: { pt: "Onboarding do ECOA — \"Você é um número\"", en: "ECOA onboarding — \"You are a number\"" } },
      ],
    },
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
    caseStudy: {
      narrative: [
        {
          pt: "Next.js 15 (App Router) + TypeScript, Tailwind v4 com tema 100% CSS-first (sem tailwind.config: as cores vivem em @theme inline no globals.css) e Supabase cobrindo Auth, Postgres e Storage. A personalização multi-cliente não é feita por fork: um único arquivo (src/config/theme.config.ts) define nome, WhatsApp, logo e paleta, que o <ThemeInjector> converte em CSS variables (--store-*) no :root — os componentes só consomem utilitários (bg-bg, text-primary). Para revenda em série, o mesmo theme.config.ts lê variáveis NEXT_PUBLIC_STORE_* e NEXT_PUBLIC_COLOR_* com fallback: cada loja nova é o mesmo código com Environment Variables diferentes na Vercel — o único artefato por cliente é o arquivo do logo em /public.",
          en: "Next.js 15 (App Router) + TypeScript, Tailwind v4 with a fully CSS-first theme (no tailwind.config: colors live in an @theme inline block in globals.css) and Supabase covering Auth, Postgres and Storage. Multi-client customization isn't done by forking: a single file (src/config/theme.config.ts) defines name, WhatsApp number, logo and palette, which <ThemeInjector> turns into CSS variables (--store-*) on :root — components only ever consume utilities (bg-bg, text-primary). For reselling at scale, that same theme.config.ts reads NEXT_PUBLIC_STORE_* and NEXT_PUBLIC_COLOR_* env vars with fallbacks, so each new store is the same codebase with different Vercel Environment Variables — the only per-client artifact is the logo file in /public.",
        },
        {
          pt: "O estoque vai além de um campo único: products.stock é sempre o total, mas duas tabelas extras (units, inventory) habilitam um modo multi-loja física, com estoque por unidade. Um trigger no Postgres soma o inventory a cada mudança e recalcula o total automaticamente, então o resto da aplicação — carrinho, badge de estoque, JSON-LD — nunca precisa saber se a loja tem uma ou dez unidades. Ativar/desativar esse modo semeia ou limpa o inventário preservando o total, com uma guarda contra corrida (checar se a unidade recém-criada é de fato a única) pra dois admins não duplicarem o estoque criando a 'primeira' loja ao mesmo tempo.",
          en: "Inventory goes beyond a single field: products.stock is always the total, but two extra tables (units, inventory) enable a multi-physical-store mode with per-unit stock. A Postgres trigger sums the inventory rows on every change and recalculates the total automatically, so the rest of the app — cart, stock badge, JSON-LD — never needs to know whether the store has one location or ten. Toggling that mode seeds or clears the inventory while preserving the total, with a race guard (checking the newly created unit is genuinely the only one) so two admins can't double the stock by creating the 'first' unit at the same time.",
        },
        {
          pt: "Não há checkout com gateway: o carrinho vive 100% no client (Zustand + persist em localStorage) e o fechamento é sempre por WhatsApp. Um método syncWithServer reconcilia o carrinho salvo com o estado fresco do banco a cada visita — remove item que ficou inativo ou zerou estoque, clampa a quantidade ao estoque disponível e sinaliza lastSyncChanged pra UI avisar o cliente. Todo link wa.me passa por normalizeWhatsapp() (aplica a regra do nono dígito da Anatel e o DDI 55) e por waUrl(), nunca montado à mão; o componente <WhatsappCta> decide sozinho o número certo — direto se a loja tem 0 ou 1 unidade, ou abre um seletor modal quando há 2+ lojas atendendo, cada uma com o próprio WhatsApp.",
          en: "There's no payment-gateway checkout: the cart lives 100% client-side (Zustand + localStorage persistence) and always closes on WhatsApp. A syncWithServer method reconciles the saved cart with fresh database state on every visit — drops items that went inactive or out of stock, clamps quantity to available stock, and flags lastSyncChanged so the UI can warn the customer. Every wa.me link goes through normalizeWhatsapp() (applies Brazil's Anatel 9th-digit rule plus the 55 country code) and waUrl(), never built by hand; the <WhatsappCta> component alone decides the right number — straight through with 0 or 1 store unit, or a picker modal when 2+ units are attending, each with its own WhatsApp.",
        },
        {
          pt: "A postura de segurança leva a sério que este é um white-label que vira produto de terceiros: RLS habilitada em toda tabela do schema público, sem exceção, com uma allow-list de admins (tabela sem nenhuma policy — só acessível via função SECURITY DEFINER is_admin()) e a service_role nunca usada em lugar nenhum — as mutações do admin rodam com a sessão do dono + RLS como defesa final. O rate limit de login persiste no Postgres (sobrevive a cold start serverless) e nunca grava o IP em claro: salva um SHA-256(salt + IP), por exigência de LGPD. Até o JSON-LD do produto escapa '<' como \\u003c antes de serializar, pra um texto vindo do banco com '</script>' não injetar HTML na página.",
          en: "The security posture takes seriously that this white-label becomes a third party's product: RLS enabled on every table in the public schema, no exceptions, with an admin allow-list (a table with zero policies — reachable only through the SECURITY DEFINER function is_admin()) and the service_role key used nowhere — admin mutations run on the owner's session with RLS as the final line of defense. Login rate limiting persists in Postgres (survives serverless cold starts) and never stores the raw IP: it saves a SHA-256(salt + IP) hash for LGPD compliance. Even the product JSON-LD escapes '<' as \\u003c before serializing, so database text containing '</script>' can't inject HTML into the page.",
        },
      ],
      highlights: [
        {
          label: { pt: "White-label por config", en: "White-label by config" },
          detail: { pt: "Um arquivo (theme.config.ts) + variáveis de ambiente definem marca, cor e WhatsApp — cada cliente é o mesmo código com env vars diferentes na Vercel.", en: "One file (theme.config.ts) plus environment variables define brand, color and WhatsApp — each client is the same codebase with different Vercel env vars." },
        },
        {
          label: { pt: "Estoque por unidade", en: "Per-store inventory" },
          detail: { pt: "Trigger no Postgres soma o inventory de cada loja física e recalcula products.stock automaticamente — o app nunca sabe se há 1 ou 10 lojas.", en: "A Postgres trigger sums each physical store's inventory and recalculates products.stock automatically — the app never needs to know if there's 1 store or 10." },
        },
        {
          label: { pt: "Checkout 100% WhatsApp", en: "100% WhatsApp checkout" },
          detail: { pt: "Sem gateway: número normalizado (regra do 9º dígito), carrinho reconciliado com o estoque real e seletor de loja quando há 2+ unidades atendendo.", en: "No payment gateway: phone normalized (9th-digit rule), cart reconciled against real stock, and a store picker when 2+ units are attending." },
        },
        {
          label: { pt: "RLS em toda tabela", en: "RLS on every table" },
          detail: { pt: "Nenhum uso de service_role; allow-list de admins via função SECURITY DEFINER e IP de login hasheado (SHA-256) para LGPD.", en: "No use of service_role anywhere; admin allow-list via a SECURITY DEFINER function, and login IPs hashed (SHA-256) for LGPD compliance." },
        },
      ],
      gallery: [
        { src: "/shots/loja-iphone/home.webp", alt: { pt: "Home da loja com hero animado e catálogo de destaques", en: "Store home with animated hero and featured catalog" } },
        { src: "/shots/loja-iphone/catalogo.webp", alt: { pt: "Seção de catálogo com estoque, condição e parcelamento por produto", en: "Catalog section with per-product stock, condition and installments" } },
        { src: "/shots/loja-iphone/lojas.webp", alt: { pt: "Seção de lojas físicas — endereço, horário e WhatsApp por unidade", en: "Physical stores section — address, hours and WhatsApp per unit" } },
      ],
    },
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
    caseStudy: {
      narrative: [
        {
          pt: "Zero framework, de propósito: HTML5 semântico + CSS puro + JavaScript vanilla, sem build step — abre direto o index.html no navegador. São ~7.200 linhas divididas em 3 arquivos (script.js com 1.735 linhas, styles.css com 4.239), decisão documentada no próprio README como \"landing autocontida\", separada do sistema principal da Kavita. A hospedagem hoje é Cloudflare Workers via wrangler.jsonc servindo os arquivos como static assets, com um vercel.json residual só para redirecionar permanentemente www.kavita.com.br → kavita.com.br — rastro de uma migração de provedor sem quebrar o domínio antigo.",
          en: "Zero framework, on purpose: semantic HTML5 + plain CSS + vanilla JavaScript, no build step — just open index.html in the browser. It's about 7,200 lines split across 3 files (script.js at 1,735 lines, styles.css at 4,239), a decision the README itself documents as a \"self-contained landing\", kept separate from Kavita's core system. Hosting today is Cloudflare Workers via wrangler.jsonc serving the files as static assets, with a leftover vercel.json that only permanently redirects www.kavita.com.br → kavita.com.br — a trace of a provider migration that didn't break the old domain.",
        },
        {
          pt: "O catálogo de equipamentos (26 itens em 5 categorias: baterias, carregadores/energia, misturadores, motobombas e outros acessórios) vive num array ACCESSORIES em script.js, mas é tratado como dado governado, não como conteúdo solto: cada item carrega um campo status — confirmado, pendente-imagem, pendente-especificacao ou pendente-compatibilidade — e a regra do projeto, documentada em docs, é explícita: \"nada é inventado\". Specs sem fonte confirmada (manual DJI oficial ou página técnica da Agrobox) ficam marcadas como pendentes em vez de preenchidas com um chute. Os filtros de categoria e de compatibilidade com os 3 drones (T25P/T70P/T100) são combinados em AND, então um item só aparece se bater nos dois critérios ao mesmo tempo.",
          en: "The equipment catalog (26 items across 5 categories: batteries, chargers/power, tank mixers, sprayer pumps and other accessories) lives in an ACCESSORIES array in script.js, but it's treated as governed data, not loose content: every item carries a status field — confirmado, pendente-imagem, pendente-especificacao or pendente-compatibilidade — and the project's rule, documented in its docs, is explicit: \"nothing is invented\". Specs without a confirmed source (an official DJI manual or an Agrobox technical page) stay flagged as pending instead of getting filled in with a guess. Category and drone-compatibility filters (T25P/T70P/T100) combine with AND logic, so an item only shows up when it matches both criteria at once.",
        },
        {
          pt: "O orçamento funciona como um mini-carrinho sem loja: o visitante adiciona drones, equipamentos e serviços a um budget que persiste em localStorage entre sessões (com fallback silencioso se o navegador bloquear o storage), mostra contador de itens em tempo real e, no envio do formulário de lead, monta uma mensagem estruturada — separada em blocos \"Drones\", \"Equipamentos e acessórios\" e \"Serviços\" — e redireciona via wa.me. O número de destino muda por unidade: um objeto REPRESENTATIVES mapeia 4 filiais (Mateus/sede, Itaperuna-RJ, Manhuaçu-MG, Cachoeiro de Itapemirim-ES) para 4 WhatsApp diferentes, com fallback pro número padrão se o visitante não escolher nenhuma.",
          en: "The quote builder works like a mini-cart with no store behind it: visitors add drones, equipment and services to a budget that persists in localStorage across sessions (with a silent fallback if the browser blocks storage), shows a live item counter, and on lead-form submit assembles a structured message — split into \"Drones\", \"Equipment and accessories\" and \"Services\" blocks — then redirects via wa.me. The destination number changes per unit: a REPRESENTATIVES object maps 4 branches (Mateus/HQ, Itaperuna-RJ, Manhuaçu-MG, Cachoeiro de Itapemirim-ES) to 4 different WhatsApp numbers, falling back to a default if the visitor picks none.",
        },
        {
          pt: "Vários detalhes de performance e acessibilidade que normalmente vêm de um framework foram feitos à mão: o hero usa preload com fetchpriority=\"high\" pra imagem crítica e preconnect pras Google Fonts; o vídeo de fundo do hero pausa via IntersectionObserver quando sai da viewport (economia de CPU/bateria) e nem chega a tocar se prefers-reduced-motion estiver ativo; os contadores animados (números da DJI) usam requestAnimationFrame com easing easeOutCubic escrito na mão, calculado a partir do próprio texto do HTML — então funcionam como progressive enhancement puro, sem JS o número final já está certo; e o tema claro/escuro respeita a preferência do sistema (matchMedia) na primeira visita e depois persiste a escolha do usuário em localStorage.",
          en: "Several performance and accessibility details that usually come from a framework were hand-built: the hero uses preload with fetchpriority=\"high\" for the critical image and preconnect for Google Fonts; the hero background video pauses via IntersectionObserver when it leaves the viewport (CPU/battery savings) and won't even play if prefers-reduced-motion is on; the animated counters (DJI stat numbers) use requestAnimationFrame with a hand-written easeOutCubic easing, computed straight from the HTML's own text — so they work as pure progressive enhancement, with no JS the final number is already correct; and light/dark theme respects the system preference (matchMedia) on first visit, then persists the user's choice in localStorage.",
        },
      ],
      highlights: [
        {
          label: { pt: "Catálogo como dado governado", en: "Catalog as governed data" },
          detail: { pt: "26 itens com status confirmado/pendente por campo — nenhuma especificação é inventada.", en: "26 items with per-field confirmed/pending status — no specification is ever invented." },
        },
        {
          label: { pt: "Orçamento multi-item persistente", en: "Persistent multi-item quote" },
          detail: { pt: "Carrinho de drones + equipamentos + serviços em localStorage, virando uma mensagem estruturada no WhatsApp.", en: "Drones + equipment + services cart in localStorage, turned into a structured WhatsApp message." },
        },
        {
          label: { pt: "Roteamento por unidade regional", en: "Regional unit routing" },
          detail: { pt: "4 filiais (MG/ES/RJ) mapeadas para 4 números de WhatsApp diferentes, com fallback padrão.", en: "4 branches (MG/ES/RJ states) mapped to 4 different WhatsApp numbers, with a default fallback." },
        },
        {
          label: { pt: "Zero framework, performance à mão", en: "Zero framework, hand-built performance" },
          detail: { pt: "Vanilla JS com IntersectionObserver, fetchpriority e prefers-reduced-motion — sem build step.", en: "Vanilla JS with IntersectionObserver, fetchpriority and prefers-reduced-motion — no build step." },
        },
      ],
      gallery: [
        { src: "/shots/kavita-drones/hero.webp", alt: { pt: "Hero da Kavita Drones com CTA de orçamento pelo WhatsApp", en: "Kavita Drones hero with WhatsApp quote CTA" } },
        { src: "/shots/kavita-drones/drones.webp", alt: { pt: "Comparativo dos 3 modelos DJI Agras (T25P, T70P, T100)", en: "Comparison of the 3 DJI Agras models (T25P, T70P, T100)" } },
        { src: "/shots/kavita-drones/equipamentos.webp", alt: { pt: "Catálogo de equipamentos com filtros por categoria e compatibilidade", en: "Equipment catalog with category and compatibility filters" } },
      ],
    },
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
    caseStudy: {
      narrative: [
        {
          pt: "O projeto é dividido em dois repositórios (frontend e backend) que só se falam por HTTP — nada de import cruzado ou pacote compartilhado. O backend é uma API REST em Node.js/Express com arquitetura em camadas estrita: rota magra → controller → service → repository, sem exceção. O acesso a dados usa mysql2 com pool raw — o Sequelize está no projeto exclusivamente para rodar migrations via CLI (db:migrate, db:status); não existe um único Model.findAll() no código de aplicação, é SQL direto por decisão consciente de projeto, documentada no próprio README para não confundir quem chegar depois. Toda resposta HTTP passa por um contrato único ({ ok, data, code, message, meta }) e todo erro esperado vira um AppError capturado por um handler global — nunca res.json() cru nem res.status(4xx) inline.",
          en: "The project is split into two repositories (frontend and backend) that only talk over HTTP — no cross-imports, no shared package. The backend is a Node.js/Express REST API with a strict layered architecture: thin route → controller → service → repository, no exceptions. Data access uses a raw mysql2 pool — Sequelize is in the project exclusively to run migrations via CLI (db:migrate, db:status); there isn't a single Model.findAll() in application code, it's direct SQL by a documented, deliberate project decision so future contributors don't reach for an ORM that isn't there. Every HTTP response follows one contract ({ ok, data, code, message, meta }) and every expected error becomes an AppError caught by a global handler — never a bare res.json() or an inline res.status(4xx).",
        },
        {
          pt: "O domínio vai muito além de carrinho e checkout: existem quatro contextos de autenticação totalmente independentes, cada um com cookie HttpOnly, middleware e endpoint de login próprios — admin, cliente da loja, corretora de café e produtor rural — e eles coexistem no mesmo navegador (um admin pode entrar em modo impersonação no painel de uma corretora sem perder a própria sessão). O produtor nem usa senha: entra por magic-link com token assinado por HMAC e TTL curto, fluxo pensado para um público rural com baixa familiaridade digital. Por cima da loja tradicional (produtos, drones, carrinho, checkout com Mercado Pago) existe um módulo B2B inteiro — o \"Mercado do Café\" — com RBAC interno de quatro papéis na corretora (owner/manager/sales/viewer), planos SaaS cobrados via Asaas e proteção anti-bot (Turnstile) nos formulários públicos de captação de lead.",
          en: "The domain goes far beyond cart and checkout: there are four fully independent authentication contexts, each with its own HttpOnly cookie, middleware and login endpoint — admin, store customer, coffee broker (\"corretora\") and rural producer — and they coexist in the same browser (an admin can enter impersonation mode inside a broker's panel without losing their own session). The producer doesn't even use a password: they sign in via a magic link with an HMAC-signed, short-TTL token, a flow designed for a rural audience with low digital familiarity. On top of the traditional store (products, drones, cart, Mercado Pago checkout) sits an entire B2B module — the \"Coffee Market\" — with an internal 4-role RBAC inside each broker account (owner/manager/sales/viewer), SaaS plans billed through Asaas, and bot protection (Turnstile) on the public lead-capture forms.",
        },
        {
          pt: "Contratos entre corretora e produtor são fechados com assinatura eletrônica de verdade: integração com a API v3 da ClickSign, webhook validado por HMAC secret e um provider trocável por variável de ambiente (CONTRATO_SIGNER_PROVIDER=stub em staging, clicksign em produção) — troca de um lugar sem stub espalhado pelo código. Segurança tem peso real no backend: CSRF via double-submit cookie, rate limiting adaptativo com Redis e fallback in-memory caso o Redis caia, e uma ordem de middlewares em server.js deliberadamente não-óbvia — o Helmet define Cross-Origin-Resource-Policy: same-origin por padrão, e o override para servir mídia cross-origin em /uploads precisa vir depois do Helmet, senão os assets simplesmente param de carregar em outro domínio.",
          en: "Contracts between broker and producer are closed with real electronic signature: integration with ClickSign's v3 API, a webhook validated by an HMAC secret, and a swappable provider set via environment variable (CONTRATO_SIGNER_PROVIDER=stub in staging, clicksign in production) — one switch instead of stub logic scattered through the code. Security carries real weight on the backend: CSRF via double-submit cookie, adaptive rate limiting with Redis and an in-memory fallback if Redis goes down, and a deliberately non-obvious middleware order in server.js — Helmet sets Cross-Origin-Resource-Policy: same-origin by default, and the override that serves cross-origin media under /uploads has to come after Helmet, or assets simply stop loading from another domain.",
        },
        {
          pt: "No frontend, Next.js 15 (App Router) separa busca de dados pública em fetchers server-only sob src/server/data/ (RSC, cache: no-store) de tudo que é sessão de usuário, resolvido em Client Components via um apiClient próprio que substituiu o Axios por completo — ele injeta o header x-csrf-token automaticamente em mutações e centraliza erros como ApiError tipado. Uploads de mídia passam por um mediaService único no backend que abstrai disco local, S3 e GCS por variável de ambiente, e o frontend nunca monta URL de imagem na mão — sempre via absUrl(), que normaliza os formatos de path que o backend pode devolver. Testes cobrem os dois lados (Jest + Supertest no backend com banco de teste dedicado; Vitest + Testing Library no frontend), e o projeto é assumidamente um protótipo de estudo — não roda em produção para um cliente real —, mas foi construído com a disciplina de arquitetura de um sistema que precisaria escalar para várias corretoras e regiões produtoras de verdade.",
          en: "On the frontend, Next.js 15 (App Router) separates public data fetching into server-only fetchers under src/server/data/ (RSC, cache: no-store) from anything tied to a user session, which is resolved in Client Components through a custom apiClient that fully replaced Axios — it auto-injects the x-csrf-token header on mutations and centralizes errors as a typed ApiError. Media uploads flow through a single backend mediaService that abstracts local disk, S3 and GCS behind an environment variable, and the frontend never hand-builds an image URL — always through absUrl(), which normalizes whatever path shape the backend returns. Tests cover both sides (Jest + Supertest on the backend with a dedicated test database; Vitest + Testing Library on the frontend), and the project is openly a self-study prototype — it doesn't run in production for a real client — but it was built with the architectural discipline of a system that would need to scale across multiple brokers and real coffee-producing regions.",
        },
      ],
      highlights: [
        {
          label: { pt: "Camadas sem ORM", en: "Layered, no ORM" },
          detail: { pt: "Rota → controller → service → repository com SQL raw via mysql2; Sequelize só roda migrations por CLI.", en: "Route → controller → service → repository with raw SQL via mysql2; Sequelize only runs migrations via CLI." },
        },
        {
          label: { pt: "4 contextos de auth", en: "4 auth contexts" },
          detail: { pt: "Admin, loja, corretora e produtor com cookie HttpOnly próprio — coexistem no mesmo navegador, com impersonação.", en: "Admin, store, broker and producer each with their own HttpOnly cookie — coexisting in the same browser, with impersonation." },
        },
        {
          label: { pt: "Assinatura digital via API", en: "E-signature via API" },
          detail: { pt: "Contratos fechados pela ClickSign v3, webhook validado por HMAC, provider trocável por variável de ambiente.", en: "Contracts closed via ClickSign v3, HMAC-validated webhook, provider swappable via environment variable." },
        },
        {
          label: { pt: "Marketplace B2B embutido", en: "Embedded B2B marketplace" },
          detail: { pt: "Módulo Mercado do Café com RBAC de 4 papéis por corretora e planos SaaS cobrados via Asaas.", en: "Coffee Market module with 4-role RBAC per broker and SaaS plans billed through Asaas." },
        },
      ],
    },
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
    caseStudy: {
      narrative: [
        {
          pt: "A cena de fundo não é um vídeo nem uma imagem — é uma cena React Three Fiber renderizada num <Canvas> fixo atrás de todo o conteúdo, com lua, névoa e um campo de 120 partículas orbitais, todos movidos por shaders GLSL escritos à mão (ruído simplex, fbm) em vez de texturas prontas. A troca de tema (Akatsuki ⇄ Expansão de Domínio) não recarrega a cena: um único uniform uMorph interpola entre duas paletas e duas funções de céu dentro do mesmo fragment shader, então a lua vermelha e a esfera do Seis Olhos são a mesma geometria, só com o material mudando em tempo real.",
          en: "The background isn't a video or a static image — it's a React Three Fiber scene rendered on a fixed <Canvas> behind the whole page, with a moon, fog and a 120-particle orbital field, all driven by hand-written GLSL shaders (simplex noise, fbm) instead of baked textures. Switching themes (Akatsuki ⇄ Domain Expansion) doesn't reload the scene: a single uMorph uniform interpolates between two palettes and two sky functions inside the same fragment shader, so the red moon and the Six Eyes sphere are the same geometry, just with the material morphing live.",
        },
        {
          pt: "Performance foi tratada como parte do design, não como ajuste depois. O Canvas roda em frameloop=\"demand\" com um throttle manual a 30fps (o fundo é atmosférico, 60fps seria desperdício de GPU), dpr travado em 1 mesmo em telas retina (corta ~75% dos fragmentos processados) e o render pausa sozinho quando a aba perde foco. Por cima disso existe um PerfModeProvider com heurística estática (RAM, núcleos, prefers-reduced-motion, ponteiro touch) e um watchdog que mede o FPS real nos primeiros segundos: se cair abaixo de 45fps, a página rebaixa para um modo \"lite\" sem WebGL — só atmosfera CSS — e memoriza a decisão no localStorage pra não travar de novo na próxima visita.",
          en: "Performance was treated as part of the design, not a later pass. The Canvas runs in frameloop=\"demand\" with a manual 30fps throttle (the background is atmospheric — 60fps would be wasted GPU), dpr is locked to 1 even on retina screens (cutting ~75% of shaded fragments), and rendering auto-pauses when the tab loses focus. On top of that, a PerfModeProvider runs a static heuristic (RAM, core count, prefers-reduced-motion, touch pointer) plus a watchdog that samples real FPS in the first seconds: if it drops below 45fps, the page falls back to a WebGL-free \"lite\" mode — CSS atmosphere only — and remembers the decision in localStorage so it doesn't stutter again on the next visit.",
        },
        {
          pt: "A camada de produto é deliberadamente simples por cima da complexidade visual: 24 figures (heróis e vilões) e mangás vivem num array tipado em lib/products.ts, o carrinho é um Context com localStorage que só persiste depois de hidratar (evita sobrescrever o storage no primeiro render), e cada personagem tem uma cor de \"aura\" mapeada em lib/aura.ts — Kurama vermelho pro Naruto, Limitless azul pro Gojo, Instinto Superior prateado pro Goku — disparada como uma explosão de partículas via Framer Motion quando o item entra no carrinho. Nenhuma dessas interações depende do Three.js: a aura, o toast e o \"punch\" do card são CSS/SVG puro, o que mantém a cena 3D isolada e code-split do resto da UI.",
          en: "The product layer is deliberately simple on top of the visual complexity: 24 figures (heroes and villains) and manga live in a typed array in lib/products.ts, the cart is a Context backed by localStorage that only starts persisting after hydration (so it doesn't overwrite storage on first render), and each character has a lore-accurate \"aura\" color mapped in lib/aura.ts — red Kurama for Naruto, blue Limitless for Gojo, silver Ultra Instinct for Goku — fired as a Framer Motion particle burst when the item hits the cart. None of these interactions depend on Three.js: the aura, the toast and the card \"punch\" are pure CSS/SVG, which keeps the 3D scene isolated and code-split from the rest of the UI.",
        },
        {
          pt: "Não existe checkout: cada card monta um link wa.me com a mensagem já preenchida (nome, anime, preço) e o carrinho monta uma única mensagem consolidada com todos os itens e o total antes de abrir o WhatsApp — a lógica de formatação de texto fica isolada em lib/whatsapp.ts, sem gateway de pagamento nem backend. Combinado com o Next 14 code-splitting da cena 3D (só carrega no cliente) e a página de produto usando View Transitions nativas do navegador para uma transição compartilhada entre o card e o detalhe, o resultado é uma loja que parece cara de rodar mas serve tudo estático, direto do edge da Vercel.",
          en: "There's no checkout: every card builds a wa.me link with the message already filled in (name, anime, price), and the cart assembles a single consolidated message with every line item and the total before opening WhatsApp — the text-formatting logic lives isolated in lib/whatsapp.ts, no payment gateway or backend involved. Combined with Next 14 code-splitting the 3D scene (client-only) and the product page using the browser's native View Transitions for a shared transition between card and detail, the result is a store that looks expensive to run but ships entirely static, straight from Vercel's edge.",
        },
      ],
      highlights: [
        {
          label: { pt: "Shader único, dois universos", en: "One shader, two universes" },
          detail: { pt: "Um uniform uMorph interpola céu, lua e partículas entre os temas Akatsuki e Expansão de Domínio sem trocar de cena.", en: "A single uMorph uniform interpolates sky, moon and particles between the Akatsuki and Domain Expansion themes without swapping scenes." },
        },
        {
          label: { pt: "Watchdog de FPS", en: "FPS watchdog" },
          detail: { pt: "Mede o frame rate real após montar a cena e rebaixa pra modo \"lite\" (sem WebGL) se cair abaixo de 45fps, memorizando a escolha.", en: "Samples real frame rate after mount and falls back to WebGL-free \"lite\" mode if it drops below 45fps, remembering the choice." },
        },
        {
          label: { pt: "Aura por personagem", en: "Per-character aura" },
          detail: { pt: "Cada figure tem uma cor de energia fiel ao lore (Kurama, Limitless, Instinto Superior) disparada ao entrar no carrinho.", en: "Every figure has a lore-accurate energy color (Kurama, Limitless, Ultra Instinct) triggered when it enters the cart." },
        },
        {
          label: { pt: "Zero backend, zero checkout", en: "Zero backend, zero checkout" },
          detail: { pt: "Carrinho vira uma única mensagem formatada e o pedido fecha inteiro dentro do WhatsApp.", en: "The cart becomes a single formatted message and the order closes entirely inside WhatsApp." },
        },
      ],
      gallery: [
        { src: "/shots/akatsuki/hero-dark.webp", alt: { pt: "Hero no tema Akatsuki (Sharingan, lua vermelha)", en: "Hero in the Akatsuki theme (Sharingan, red moon)" } },
        { src: "/shots/akatsuki/hero-light.webp", alt: { pt: "Hero no tema Expansão de Domínio (Seis Olhos)", en: "Hero in the Domain Expansion theme (Six Eyes)" } },
        { src: "/shots/akatsuki/products.webp", alt: { pt: "Catálogo com badges de raridade e CTA de WhatsApp", en: "Catalog with rarity badges and WhatsApp CTA" } },
      ],
    },
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
    caseStudy: {
      narrative: [
        {
          pt: "A ÁUREA nasce com uma restrição de produto explícita: não é e-commerce. Não há carrinho, checkout nem gateway de pagamento — toda intenção de compra converge para o WhatsApp do atelier. Essa regra está documentada no AGENTS.md do projeto (\"Modelo de produto: VITRINE → WhatsApp... Não adicione carrinho/checkout sem pedido explícito\") e é reforçada em código: um único módulo, src/lib/whatsapp.ts, monta toda mensagem, e o AGENTS.md proíbe montar links wa.me na mão em qualquer componente. productMessage() serializa a peça em três linhas fixas — Nome, Referência, Valor em formatCents() — para o vendedor identificar o item na hora, sem precisar abrir o site.",
          en: "ÁUREA starts from an explicit product constraint: it isn't e-commerce. No cart, no checkout, no payment gateway — every purchase intent converges on the atelier's WhatsApp. That rule is written into the project's AGENTS.md (\"Product model: SHOWCASE → WhatsApp... don't add a cart/checkout without an explicit request\") and enforced in code: a single module, src/lib/whatsapp.ts, builds every message, and AGENTS.md bans hand-rolling wa.me links anywhere else. productMessage() serializes the piece into three fixed lines — Name, Reference, Price via formatCents() — so the seller can identify the item instantly, without opening the site.",
        },
        {
          pt: "A peça de maior risco técnico é o Espelho Virtual em /experimentar: try-on de brincos e colares pela câmera, 100% no navegador, sem enviar vídeo a nenhum servidor. VirtualMirror.tsx carrega o @mediapipe/tasks-vision (FaceLandmarker, delegate GPU) sob demanda via CDN e roda a detecção num loop de requestAnimationFrame, lendo landmarks fixos da malha facial (orelhas nos índices 234/454, queixo em 152, olhos em 33/263) para calcular largura do rosto e ângulo de inclinação da cabeça a cada frame. Um detalhe que só aparece em produção: os logs do MediaPipe/TFLite (\"XNNPACK delegate...\") saem por console.error, e o overlay de dev do Next trata isso como erro — o código intercepta e filtra especificamente essas mensagens benignas por regex, sem silenciar erros reais.",
          en: "The riskiest technical piece is the Virtual Mirror at /experimentar: earring and necklace try-on via camera, 100% in-browser, no video sent to any server. VirtualMirror.tsx lazy-loads @mediapipe/tasks-vision (FaceLandmarker, GPU delegate) from a CDN on demand and runs detection in a requestAnimationFrame loop, reading fixed landmarks off the face mesh (ears at indices 234/454, chin at 152, eyes at 33/263) to compute face width and head-tilt angle every frame. A detail that only shows up in production: MediaPipe/TFLite logs (\"XNNPACK delegate...\") are emitted via console.error, and Next's dev overlay treats that as a crash — the code intercepts and filters exactly those benign messages by regex, without swallowing real errors.",
        },
        {
          pt: "As joias não são fotos recortadas sobre o rosto — são desenhadas vetorialmente em canvas a cada frame, em src/lib/mirror/draw.ts, com gradientes radiais para simular metal e pérola e um ponto especular fixo para dar brilho. A posição bruta dos landmarks é ruidosa; uma suavização exponencial (EMA, fator 0.35) amortece o jitter frame a frame antes de desenhar. Cada tipo de peça tem constantes de encaixe calibradas manualmente como frações da distância entre orelhas (EARRING_DROP, NECK_SIDE_INSET, NECK_CENTER_DROP...) — é ajuste fino de olho, não geometria derivada automaticamente, e fica documentado como \"calibre aqui\" no próprio arquivo.",
          en: "The jewelry isn't a cut-out photo pasted on the face — it's drawn vectorially on canvas every frame in src/lib/mirror/draw.ts, using radial gradients to fake metal and pearl and a fixed specular highlight for shine. Raw landmark positions are noisy; an exponential moving average (EMA, factor 0.35) smooths jitter frame to frame before drawing. Each piece type has hand-calibrated fit constants expressed as fractions of ear-to-ear distance (EARRING_DROP, NECK_SIDE_INSET, NECK_CENTER_DROP...) — deliberate eyeballed tuning, not geometry derived automatically, and it's flagged as \"calibrate here\" directly in the file.",
        },
        {
          pt: "O restante do site é pensado para white-label: cor, marca, contato e textos vivem só em theme.config.ts e copy.ts (Tailwind v4 sem tailwind.config, variáveis --store-* espelhadas nos dois lugares), e nenhuma peça de catálogo depende de banco de dados. Cada card de produto usa um componente Showcase — um efeito de vitrine de museu em CSS 3D puro (transform-style: preserve-3d, seis camadas em profundidades distintas de translateZ, tilt que segue o cursor via Framer Motion useSpring) que simula peça sob vidro e holofote sem WebGL nenhum, e é desativado automaticamente sob prefers-reduced-motion.",
          en: "The rest of the site is built white-label: brand color, contact info and copy live only in theme.config.ts and copy.ts (Tailwind v4 with no tailwind.config, --store-* variables mirrored in both places), and no catalog piece depends on a database. Every product card uses a Showcase component — a museum-vitrine effect built in pure CSS 3D (transform-style: preserve-3d, six layers at distinct translateZ depths, cursor-following tilt via Framer Motion's useSpring) that fakes a piece under glass and spotlight with zero WebGL, and it's automatically disabled under prefers-reduced-motion.",
        },
      ],
      highlights: [
        {
          label: { pt: "Try-on 100% client-side", en: "100% client-side try-on" },
          detail: { pt: "FaceLandmarker do MediaPipe roda inteiramente no navegador — nenhum frame de vídeo sai do dispositivo do cliente.", en: "MediaPipe's FaceLandmarker runs entirely in the browser — no video frame ever leaves the client's device." },
        },
        {
          label: { pt: "Um único ponto de verdade pro WhatsApp", en: "Single source of truth for WhatsApp" },
          detail: { pt: "Todo link wa.me passa por waUrl()/productWaUrl() — proibido montar a URL na mão em componentes.", en: "Every wa.me link goes through waUrl()/productWaUrl() — hand-building the URL in components is banned." },
        },
        {
          label: { pt: "Joia desenhada, não recortada", en: "Drawn jewelry, not a cutout" },
          detail: { pt: "Brincos e colares são vetores em canvas com gradiente e EMA de suavização — não fotos coladas sobre o rosto.", en: "Earrings and necklaces are canvas vectors with gradients and EMA smoothing — not photos pasted over the face." },
        },
        {
          label: { pt: "White-label sem tocar componente", en: "White-label without touching components" },
          detail: { pt: "Marca, cores, contato e catálogo trocam de loja para loja mexendo em dois arquivos de config.", en: "Brand, colors, contact and catalog switch store to store by editing just two config files." },
        },
      ],
      gallery: [
        { src: "/shots/loja-joias/home.webp", alt: { pt: "Página inicial da ÁUREA", en: "ÁUREA homepage" } },
        { src: "/shots/loja-joias/home-collection.webp", alt: { pt: "Catálogo de joias", en: "Jewelry catalog" } },
        { src: "/shots/loja-joias/experimentar.webp", alt: { pt: "Espelho virtual para experimentar joias", en: "Virtual mirror to try on jewelry" } },
      ],
    },
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
    caseStudy: {
      narrative: [
        {
          pt: "O hero não usa nenhum asset de buraco-negro pronto: é um shader GLSL escrito à mão (BlackHoleScene.jsx) rodando num único plano dentro do React Three Fiber. FBM (fractal Brownian motion) gera a turbulência do disco de acreção em duas camadas de ruído, um perfil radial separa disco fino de núcleo, e o anel de fóton e o \"efeito Doppler\" (lado que se aproxima mais claro) são somados por cima — tudo calculado por pixel, sem textura. Sobre isso soma-se um planeta com atmosfera em fresnel aditivo e um campo de asteroides via instancedMesh (38 instâncias, uma única draw call) girando com ruído próprio de rotação.",
          en: "The hero doesn't use any off-the-shelf black-hole asset: it's a hand-written GLSL shader (BlackHoleScene.jsx) rendered on a single plane inside React Three Fiber. FBM (fractal Brownian motion) drives the accretion-disk turbulence across two noise layers, a radial profile separates the thin disk from the core, and the photon ring plus a Doppler-style brightening (the approaching side reads lighter) are layered on top — all computed per-pixel, no textures involved. On top of that sits a planet with an additive-fresnel atmosphere and an asteroid field via instancedMesh (38 instances, a single draw call) spinning on its own rotation noise.",
        },
        {
          pt: "A distorção gravitacional é um efeito de pós-processamento próprio, não um filtro pronto: uma classe LensingEffect que estende Effect da lib postprocessing e é conectada ao pipeline do R3F via wrapEffect. O shader da lente desloca o UV de amostragem do frame inteiro em função da distância ao horizonte de eventos (deflexão ~1/d²), curvando estrelas e nebulosa ao redor do buraco como uma lente de Einstein real. A câmera, por sua vez, não segue o scroll diretamente: uma timeline do Theatre.js (heroSheet, com keyframes de posição/FOV salvos em theatre-state.json) é 'esfregada' (sequence.position = t * SEQ_LEN) proporcionalmente ao scrollY, e o resultado é suavizado com lerp antes de aplicar à câmera — dá o mergulho cinematográfico no buraco sem depender de nenhuma lib de scroll externa.",
          en: "The gravitational distortion is a custom post-processing effect, not an off-the-shelf filter: a LensingEffect class that extends Effect from the postprocessing library and plugs into the R3F pipeline via wrapEffect. The lens shader offsets the sampling UV of the whole frame based on distance to the event horizon (deflection ~1/d²), bending stars and nebula around the hole like a real Einstein lens. The camera, in turn, doesn't follow scroll directly: a Theatre.js timeline (heroSheet, with position/FOV keyframes saved in theatre-state.json) is scrubbed (sequence.position = t * SEQ_LEN) proportionally to scrollY, and the result is lerped before being applied to the camera — that's what gives the cinematic dive into the hole without any external scroll library.",
        },
        {
          pt: "Custo de GPU é tratado como orçamento, não como detalhe: dpr é limitado a [0.75, 1], antialiasing fica desligado (compensado pelo bloom/noise do pós-processamento), e um IntersectionObserver no wrapper do Canvas alterna frameloop entre 'always' e 'never' — assim que o hero sai da viewport, o R3F para de renderizar frames por completo em vez de só ficar invisível consumindo GPU no resto do scroll. É o mesmo raciocínio de performance que se aplicaria a um dashboard com gráficos pesados: renderizar só o que está de fato na tela.",
          en: "GPU cost is treated as a budget, not an afterthought: dpr is clamped to [0.75, 1], antialiasing is off (compensated by the bloom/noise in post-processing), and an IntersectionObserver on the Canvas wrapper toggles frameloop between 'always' and 'never' — once the hero leaves the viewport, R3F stops rendering frames entirely instead of staying invisible and still burning GPU for the rest of the scroll. It's the same performance reasoning that would apply to a dashboard full of heavy charts: only render what's actually on screen.",
        },
        {
          pt: "Abaixo do hero, a loja é dados puros e componentes sem backend: seis catálogos (heróis, quadrinhos, séries, games, setup, gear) vivem em src/data/products.js como arrays simples, e o ProductCard resolve a imagem numa cadeia de fallback resiliente — tenta a foto real (.jpg, depois .png se a primeira falhar), cai pro emblema vetorial do herói se não houver foto, e cai pra um visual SVG procedural (hexágono + núcleo + partículas, gerado por accent color) se nem isso existir — nenhum card quebra por imagem ausente. A seção de Games tem filtro client-side por categoria (cat) reconstruindo o carrossel (key={filter} força reentrada animada), e toda a UI tem som: bips procedurais via WebAudio (useSound.js) sem nenhum arquivo de áudio, com AudioContext criado sob demanda no primeiro gesto do usuário — driver dos autoplay policies dos navegadores.",
          en: "Below the hero, the store is pure data and backend-free components: six catalogs (heroes, comics, series, games, setup, gear) live in src/data/products.js as plain arrays, and ProductCard resolves images through a resilient fallback chain — try the real photo (.jpg, then .png if the first fails), fall back to the hero's vector emblem if there's no photo, and fall back further to a procedural SVG visual (hexagon + core + particles, generated from the accent color) if even that's missing — no card ever breaks on a missing image. The Games section has a client-side category filter (cat) that rebuilds the carousel (key={filter} forces an animated re-entry), and the whole UI has sound: procedural blips via WebAudio (useSound.js) with no audio files at all, AudioContext created on-demand on the user's first gesture — a workaround for browser autoplay policies.",
        },
      ],
      highlights: [
        {
          label: { pt: "Buraco negro em GLSL puro", en: "Pure GLSL black hole" },
          detail: { pt: "Disco de acreção, anel de fóton e núcleo calculados por pixel com FBM — sem nenhuma textura.", en: "Accretion disk, photon ring and core computed per-pixel with FBM — no textures involved." },
        },
        {
          label: { pt: "Lente gravitacional custom", en: "Custom gravitational lensing" },
          detail: { pt: "Effect de pós-processamento próprio (deflexão ~1/d²) que curva estrelas e nebulosa ao redor do horizonte de eventos.", en: "A hand-built post-processing Effect (~1/d² deflection) that bends stars and nebula around the event horizon." },
        },
        {
          label: { pt: "Câmera scrubbed por Theatre.js", en: "Theatre.js scroll-scrubbed camera" },
          detail: { pt: "Scroll da página esfrega uma timeline de câmera keyframada, sem lib de scroll externa.", en: "Page scroll scrubs a keyframed camera timeline, with no external scroll library." },
        },
        {
          label: { pt: "GPU sob orçamento", en: "GPU on a budget" },
          detail: { pt: "IntersectionObserver desliga o frameloop do R3F fora da viewport; dpr limitado e antialiasing off.", en: "IntersectionObserver kills the R3F frameloop outside the viewport; dpr clamped and antialiasing off." },
        },
      ],
      gallery: [
        { src: "/shots/nexus-geek/hero.webp", alt: { pt: "Hero com buraco negro 3D cinematográfico", en: "Cinematic 3D black-hole hero" } },
        { src: "/shots/nexus-geek/heroes-collection.webp", alt: { pt: "Coleção de heróis com cards tilt 3D", en: "Hero collection with 3D tilt cards" } },
        { src: "/shots/nexus-geek/games.webp", alt: { pt: "Seção de games com filtro por categoria", en: "Games section with category filter" } },
      ],
    },
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
    caseStudy: {
      narrative: [
        {
          pt: "A casa que ancora o hero não é um modelo importado: é geometria procedural, montada em código com primitivas do Three.js (boxGeometry, planeGeometry, icosahedronGeometry) — laje em balanço, fachada de vidro, mobília, piscina e vegetação, tudo posicionado por coordenadas explícitas dentro de um único componente House. O motivo é prático: sem GLB para baixar, decodificar (Draco/Meshopt) ou hospedar, o hero começa a renderizar no primeiro frame do Canvas. O componente Residence já deixa a porta aberta para trocar por um modelo real — uma constante RESIDENCE_GLB e um SceneBoundary (error boundary de classe que captura falhas do WebGL/R3F) garantem que, se o GLB não existir ou falhar ao carregar, a cena cai de volta para a casa procedural sem quebrar a página.",
          en: "The house anchoring the hero isn't an imported model — it's procedural geometry, assembled in code from Three.js primitives (boxGeometry, planeGeometry, icosahedronGeometry): cantilevered slab, glass facade, furniture, pool and landscaping, all placed with explicit coordinates inside a single House component. The reasoning is practical: with no GLB to download, decode (Draco/Meshopt) or host, the hero starts rendering on the Canvas's first frame. The Residence component already leaves the door open to swap in a real model — a RESIDENCE_GLB constant plus a SceneBoundary (a class-based error boundary catching WebGL/R3F failures) guarantee that if the GLB is missing or fails to load, the scene falls back to the procedural house without breaking the page.",
        },
        {
          pt: "A câmera não segue uma timeline de biblioteca externa: é um sistema de keyframes escrito à mão em CameraRig — seis pares de posição/lookAt (fachada, entrada, sala, escada, varanda, piscina) interpolados com smoothstep conforme um valor journey.progress entre 0 e 1. Esse progresso é escrito por um ScrollTrigger do GSAP pinado na seção do hero, com o Lenis dirigindo o rAF do scroll suave e emitindo eventos que o ScrollTrigger consome (lenis.on('scroll', ScrollTrigger.update)). A ponte entre DOM e loop de render do R3F é um objeto mutável (journey.progress) fora do React, lido dentro de useFrame — evita re-render do componente a cada tick de scroll, que a 60fps seria centenas de renders por segundo.",
          en: "The camera doesn't ride an external timeline library — it's a hand-written keyframe system in CameraRig: six position/lookAt pairs (facade, entrance, living room, staircase, balcony, pool) interpolated with smoothstep against a journey.progress value between 0 and 1. That progress is written by a GSAP ScrollTrigger pinned to the hero section, with Lenis driving the smooth-scroll rAF and emitting events that ScrollTrigger consumes (lenis.on('scroll', ScrollTrigger.update)). The bridge between the DOM and the R3F render loop is a mutable object (journey.progress) living outside React, read inside useFrame — this avoids re-rendering the component on every scroll tick, which at 60fps would mean hundreds of renders per second.",
        },
        {
          pt: "Performance em WebGL no navegador foi tratada como orçamento, não como sorte. O DPR do canvas é adaptativo: um PerformanceMonitor do drei mede o fps real por ~1,2s e um hook (useAdaptiveDpr) recalcula a resolução interna dentro de uma faixa min/max — GPU fraca cai até 0.6, GPU com folga sobe até 1.6, em vez de travar a 17fps com DPR fixo. Mobile recebe uma cena mais barata por decisão explícita: material de vidro simples (reflexo transparente) em vez de MeshTransmissionMaterial com transmissão real, sombras suaves (SoftShadows/PCSS) e Bloom desligados, resolução do ContactShadows reduzida pela metade. O canvas 3D também só monta depois do primeiro paint — via requestIdleCallback com timeout de 1200ms como rede de segurança — para não pesar no LCP/TBT, e o frameloop do R3F alterna entre always/never conforme um IntersectionObserver (useInView), então a cena para de renderizar assim que sai da viewport.",
          en: "In-browser WebGL performance was treated as a budget, not luck. Canvas DPR is adaptive: a drei PerformanceMonitor measures real fps over ~1.2s and a hook (useAdaptiveDpr) recalculates the internal resolution within a min/max range — a weak GPU drops to 0.6, a GPU with headroom climbs to 1.6, instead of getting stuck at 17fps with a fixed DPR. Mobile gets a deliberately cheaper scene: a simple transparent-reflection glass material instead of MeshTransmissionMaterial with real transmission, soft PCSS shadows and Bloom turned off, ContactShadows resolution halved. The 3D canvas also only mounts after first paint — via requestIdleCallback with a 1200ms timeout as a safety net — to avoid hurting LCP/TBT, and R3F's frameloop toggles between always/never based on an IntersectionObserver (useInView), so the scene stops rendering the moment it leaves the viewport.",
        },
        {
          pt: "Acessibilidade de movimento entrou na própria cena 3D, não só nas animações de DOM: usePrefersReducedMotion desliga o parallax da câmera que segue o ponteiro e os micro-loops de vida (respiração da água na piscina, pulso da luz interna quente) tanto em CameraRig quanto em House, mantendo os valores de repouso já definidos no JSX. O scroll suave do Lenis também sai de cena inteiramente quando prefers-reduced-motion: reduce está ativo — a página volta ao scroll nativo do navegador. Esse cuidado, somado ao poster estático (mesmo enquadramento do fallback) exibido atrás do Canvas antes da montagem, foi o que manteve o hero rápido e acessível sem abrir mão do efeito cinematográfico como diferencial do produto.",
          en: "Motion accessibility was built into the 3D scene itself, not just the DOM animations: usePrefersReducedMotion turns off the pointer-following camera parallax and the ambient micro-loops (pool water breathing, warm interior light pulse) in both CameraRig and House, keeping the rest-state values already defined in JSX. Lenis's smooth scroll also gets out of the way entirely when prefers-reduced-motion: reduce is active — the page falls back to native browser scrolling. That care, combined with a static poster (same framing as the fallback) shown behind the Canvas before it mounts, is what kept the hero fast and accessible without giving up the cinematic effect as the product's differentiator.",
        },
      ],
      highlights: [
        {
          label: { pt: "Casa 100% procedural", en: "100% procedural house" },
          detail: { pt: "Nenhum GLB: volumes, vidro, mobília e piscina são geometria Three.js gerada em código, com fallback documentado para trocar por modelo real.", en: "No GLB: volumes, glass, furniture and pool are Three.js geometry generated in code, with a documented fallback path to swap in a real model." },
        },
        {
          label: { pt: "Câmera por keyframes + scroll", en: "Keyframe camera + scroll" },
          detail: { pt: "6 posições interpoladas com smoothstep, dirigidas por GSAP ScrollTrigger + Lenis fora do ciclo de render do React.", en: "6 positions interpolated with smoothstep, driven by GSAP ScrollTrigger + Lenis outside React's render cycle." },
        },
        {
          label: { pt: "DPR adaptativo por fps real", en: "Adaptive DPR from real fps" },
          detail: { pt: "PerformanceMonitor mede a GPU em ~1,2s e ajusta a resolução do canvas entre 0.6 e 1.6 automaticamente.", en: "PerformanceMonitor samples the GPU over ~1.2s and auto-tunes canvas resolution between 0.6 and 1.6." },
        },
        {
          label: { pt: "Degradação graciosa mobile/a11y", en: "Graceful mobile/a11y degradation" },
          detail: { pt: "Vidro, sombras e Bloom mais baratos no mobile; parallax e micro-loops desligam com prefers-reduced-motion.", en: "Cheaper glass, shadows and Bloom on mobile; parallax and micro-loops turn off with prefers-reduced-motion." },
        },
      ],
      gallery: [
        { src: "/shots/lumen-architecture/hero.webp", alt: { pt: "Hero 3D da Lumen com a residência procedural e headline animada", en: "Lumen's 3D hero with the procedural residence and animated headline" } },
        { src: "/shots/lumen-architecture/services.webp", alt: { pt: "Seção de serviços do estúdio de arquitetura", en: "Architecture studio's services section" } },
        { src: "/shots/lumen-architecture/interactive-model.webp", alt: { pt: "Seção de modelo 3D interativo (arraste para girar, scroll para zoom)", en: "Interactive 3D model section (drag to rotate, scroll to zoom)" } },
      ],
    },
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
    caseStudy: {
      narrative: [
        {
          pt: "Next.js 14 (App Router) sem nenhuma dependência pesada de e-commerce: zero carrinho de terceiros, zero CMS, zero state manager externo — só framer-motion, Lenis (smooth scroll) e next/font (Cormorant Garamond para os títulos editoriais, Inter para o resto). O README documenta o próprio orçamento de performance: First Load JS ≈ 156 kB na home, com todas as animações resolvidas em CSS/Framer Motion em vez de bibliotecas de canvas ou WebGL — a decisão certa para um projeto onde o produto é a fotografia, não um efeito 3D.",
          en: "Next.js 14 (App Router) with zero heavy e-commerce dependencies: no third-party cart, no CMS, no external state manager — just framer-motion, Lenis (smooth scroll) and next/font (Cormorant Garamond for editorial headings, Inter for the rest). The README documents its own performance budget: First Load JS ≈ 156 kB on the homepage, with every animation resolved in CSS/Framer Motion instead of a canvas or WebGL library — the right call for a project where the product is the photography, not a 3D effect.",
        },
        {
          pt: "O carrinho é um Context puro (CartProvider) guardando { id, size, qty }[] — a chave de identidade de uma linha é o par produto+tamanho, não só o produto, então a mesma peça em P e G vira duas linhas independentes. A persistência em localStorage usa um useRef como guarda de hidratação: o primeiro useEffect lê o storage e popula o state, e só um segundo useEffect (que checa a ref) volta a escrever — sem essa guarda, o efeito de escrita dispararia no primeiro render com array vazio e apagaria o carrinho salvo antes mesmo de ele ser lido.",
          en: "The cart is a plain Context (CartProvider) holding { id, size, qty }[] — a line's identity key is the product+size pair, not just the product, so the same item in P and G becomes two independent lines. localStorage persistence uses a useRef as a hydration guard: the first useEffect reads storage and populates state, and only a second useEffect (gated on that ref) writes back — without the guard, the write effect would fire on the very first render with an empty array and wipe the saved cart before it was ever read.",
        },
        {
          pt: "Tamanho é obrigatório antes de qualquer conversão: ProductDetail mantém um ensureSize() que bloqueia o \"Adicionar à sacola\" e acende um aviso inline se nada foi escolhido, mas o botão de WhatsApp nunca fica desabilitado — sem tamanho, ele monta a mensagem com \"a combinar\" no lugar, pra não perder o lead por fricção. No carrinho completo, orderMessage() agrega todas as linhas num único texto formatado (produto, marca, tamanho, subtotal, total em negrito markdown do WhatsApp) e abre o wa.me com encodeURIComponent — todo o fluxo de conversão termina fora do app, sem backend, sem gateway de pagamento.",
          en: "Size selection gates conversion: ProductDetail has an ensureSize() that blocks \"Add to bag\" and flashes an inline warning if nothing was picked, but the WhatsApp button is never disabled — with no size chosen it just builds the message with \"to confirm\" instead, so the lead isn't lost to friction. In the full cart, orderMessage() aggregates every line into one formatted text (product, brand, size, subtotal, bold-markdown total) and opens wa.me with encodeURIComponent — the entire conversion flow ends outside the app, with no backend and no payment gateway.",
        },
        {
          pt: "A estética \"editorial de luxo\" é construída em camadas de motion coordenadas, não em uma única lib de efeitos: LookbookScroll fixa a seção (position: sticky) e usa useScroll/useTransform do Framer Motion pra mapear o progresso de rolagem em três transforms independentes — o trilho horizontal desliza num sentido, a imagem dentro de cada card contra-desliza em outro (scale-125 + imgX) e a legenda se move num terceiro, criando parallax multicamada só com CSS transforms. O Spotlight (luz que segue o cursor em soft-light) é implementado com useMotionValue + useSpring e se desliga sozinho via matchMedia('(hover: hover) and (pointer: fine)') e useReducedMotion — luxo visual que não penaliza mobile nem acessibilidade. O toggle de tema Areia/Espresso ⇄ Branco evita flash de tema errado com um script inline e bloqueante no head que lê o localStorage e aplica data-theme antes da hidratação do React, e os detalhes \"neo-skeuomórficos\" (relevo sutil nos swatches de cor, profundidade no botão sólido) vivem isolados num único arquivo de tokens (lib/theme.ts) pra não vazar pro resto da UI, que é deliberadamente flat.",
          en: "The \"luxury editorial\" look is built from coordinated motion layers, not a single effects library: LookbookScroll pins the section (position: sticky) and uses Framer Motion's useScroll/useTransform to map scroll progress into three independent transforms — the horizontal rail slides one way, the image inside each card counter-slides another way (scale-125 + imgX), and the caption moves a third way, producing multilayer parallax with plain CSS transforms. Spotlight (a cursor-following light in soft-light blend mode) is built with useMotionValue + useSpring and turns itself off via matchMedia('(hover: hover) and (pointer: fine)') and useReducedMotion — visual luxury that doesn't penalize mobile or accessibility. The Sand/Espresso ⇄ White theme toggle avoids a wrong-theme flash with a blocking inline script in head that reads localStorage and applies data-theme before React hydrates, and the \"neo-skeuomorphic\" details (subtle swatch relief, solid-button depth) live isolated in a single token file (lib/theme.ts) so they don't leak into the rest of the UI, which is deliberately flat.",
        },
      ],
      highlights: [
        {
          label: { pt: "Carrinho por variante", en: "Per-variant cart" },
          detail: { pt: "Chave composta id+tamanho no Context, persistida em localStorage com guarda de hidratação anti-sobrescrita.", en: "Composite id+size key in the Context, persisted to localStorage with an anti-overwrite hydration guard." },
        },
        {
          label: { pt: "WhatsApp sem fricção", en: "Frictionless WhatsApp" },
          detail: { pt: "Tamanho obrigatório pro carrinho, mas o link de WhatsApp nunca trava — sem seleção, ele soma \"a combinar\".", en: "Size required for the cart, but the WhatsApp link never blocks — with no selection it falls back to \"to confirm\"." },
        },
        {
          label: { pt: "Lookbook em 3 camadas", en: "3-layer lookbook" },
          detail: { pt: "Scroll fixo com useScroll/useTransform movendo trilho, imagem e legenda em direções opostas.", en: "Sticky scroll with useScroll/useTransform moving rail, image and caption in opposite directions." },
        },
        {
          label: { pt: "Tema sem flash", en: "No-flash theme" },
          detail: { pt: "Script inline bloqueante aplica data-theme do localStorage antes da hidratação do React.", en: "Blocking inline script applies data-theme from localStorage before React hydrates." },
        },
      ],
      gallery: [
        { src: "/shots/rjjstore/home.webp", alt: { pt: "Hero editorial da RJjstore", en: "RJjstore editorial hero" } },
        { src: "/shots/rjjstore/loja.webp", alt: { pt: "Catálogo com filtros de categoria, marca e preço", en: "Catalog with category, brand and price filters" } },
        { src: "/shots/rjjstore/produto.webp", alt: { pt: "Página de produto com seleção de cor e tamanho", en: "Product page with color and size selection" } },
      ],
    },
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
    caseStudy: {
      narrative: [
        {
          pt: "A stack foge do combo padrão Next + Tailwind de propósito: SCSS Modules com um arquivo _tokens.scss central (paleta, tipografia, easings, breakpoints como variáveis Sass) e mixins compartilhados. Numa marca com identidade visual tão forte — azul como cor-mãe na proporção 60-30-10, com amarelo/verde/laranja só como acento pontual, nunca fundo chapado — utility classes do Tailwind tendem a espalhar decisões de design em className por todo o JSX. Com SCSS Modules cada seção carrega seu próprio .module.scss com escopo local, e a paleta vive num único lugar: mudar o tom do azul da marca é uma linha em _tokens.scss, não um grep por bg-blue-500 em dezenas de arquivos.",
          en: "The stack deliberately skips the standard Next + Tailwind combo: SCSS Modules with one central _tokens.scss (palette, type scale, easings, breakpoints as Sass variables) plus shared mixins. For a brand with such a strong visual identity — blue as the anchor color on a 60-30-10 ratio, with yellow/green/orange only as sparing accents, never flat backgrounds — Tailwind utility classes tend to scatter design decisions across className all over the JSX. With SCSS Modules, every section ships its own scoped .module.scss, and the palette lives in one place: retuning the brand blue is a one-line edit in _tokens.scss, not a grep for bg-blue-500 across dozens of files.",
        },
        {
          pt: "O mascote Pandito não é uma imagem — é um componente SVG (Panda.tsx) desenhado em código, com gradientes radiais para dar volume ao pelo branco e preto, blush nas bochechas e um sistema de props (look, item, sleepy) que redesenha os olhos e a cabeça em tempo real. O componente InteractivePanda captura mousemove na página inteira, mas throttla a leitura com requestAnimationFrame e só dispara setState quando o delta de posição passa de um limiar — evita re-render a cada pixel de movimento do mouse, o que importa muito pro INP numa Web Vital. Depois de 8s sem movimento o panda cochila (fecha os olhos, respiração mais lenta, some no Zzz animado), e um IntersectionObserver pausa esse processamento inteiro quando a seção sai da viewport, para não gastar CPU com um mascote que ninguém está vendo.",
          en: "The Pandito mascot isn't an image — it's an SVG component (Panda.tsx) authored in code, using radial gradients for fur volume on the white/black coat, cheek blush, and a small prop system (look, item, sleepy) that redraws the eyes and head in real time. InteractivePanda listens to mousemove across the whole page but throttles reads with requestAnimationFrame and only calls setState once the position delta clears a threshold — avoiding a re-render on every pixel of mouse movement, which matters for INP as a Web Vital. After 8s of no movement the panda dozes off (eyes close, breathing slows, an animated Zzz appears), and an IntersectionObserver pauses that whole processing loop once the section leaves the viewport, so no CPU gets burned animating a mascot nobody's looking at.",
        },
        {
          pt: "Scroll suave é Lenis sincronizado com GSAP ScrollTrigger: o raf do Lenis alimenta o ticker do GSAP (gsap.ticker.add) em vez de rodar dois loops de animação em paralelo, o que evita jank quando parallax e smooth-scroll competem pelo mesmo frame. O fundo do Hero — uma cena de fazenda inteira em SVG puro (céu com gradiente, sol, nuvens, colinas em camadas, celeiro e silo) sem nenhuma imagem raster — se move em scrollTrigger.scrub com leve yPercent e scale, dando profundidade sem pesar o carregamento. Interessante notar que o parallax do próprio panda usa MotionValue do Framer Motion em vez de GSAP, e o código documenta explicitamente por quê: animar y com animate e com um MotionValue de style na mesma div gera conflito e trava o elemento em opacity:0 — por isso a entrada (fade+scale) e o parallax de mouse ficam em wrappers motion.div separados.",
          en: "Smooth scroll is Lenis synced with GSAP's ScrollTrigger: Lenis's raf feeds GSAP's ticker (gsap.ticker.add) instead of running two animation loops side by side, avoiding jank when parallax and smooth-scroll compete for the same frame. The Hero background — an entire farm scene in pure SVG (gradient sky, sun, clouds, layered hills, barn and silo) with zero raster images — moves via scrollTrigger.scrub with a subtle yPercent and scale, adding depth without a loading cost. Notably, the panda's own parallax uses Framer Motion's MotionValue instead of GSAP, and the code explicitly documents why: animating y via animate and via a style MotionValue on the same div conflicts and locks the element at opacity:0 — so the entrance animation (fade+scale) and the mouse-parallax live in separate motion.div wrappers.",
        },
        {
          pt: "Um detalhe que passa despercebido: o site tem um seletor de \"Sabor\" na navbar que troca a paleta inteira (7 opções — leite, flocos, morango, uva, banana, coco, salada de frutas) via data-flavor no <html>, com cada variante sobrescrevendo as CSS custom properties em globals.scss. A escolha persiste em localStorage e é aplicada antes da hidratação por um script inline no <head> do layout.tsx — evita o flash da paleta padrão antes de reaplicar a cor salva. Trocar de sabor dispara uma onda de tinta (FlavorPicker) que nasce do próprio botão e cobre a tela com a cor nova antes de sumir, um recurso puramente decorativo mas que reforça a identidade lúdica da marca sem custar performance — é CSS/SVG, sem imagens.",
          en: "One detail easy to miss: the navbar has a \"Flavor\" picker that swaps the entire palette (7 options — milk, chocolate, strawberry, grape, banana, coconut, fruit salad) via a data-flavor attribute on <html>, with each variant overriding CSS custom properties in globals.scss. The choice persists to localStorage and is applied before hydration by an inline script in layout.tsx's <head> — avoiding a flash of the default palette before the saved color reapplies. Switching flavors triggers a color-wipe animation (FlavorPicker) that originates from the button itself and washes the screen in the new color before fading out — purely decorative, but it reinforces the brand's playful identity at no performance cost, since it's all CSS/SVG, no images.",
        },
      ],
      highlights: [
        {
          label: { pt: "SCSS Modules, não Tailwind", en: "SCSS Modules, not Tailwind" },
          detail: { pt: "Paleta e tipografia centralizadas em _tokens.scss — mudar a cor da marca é uma linha, não um grep no JSX.", en: "Palette and type scale centralized in _tokens.scss — retuning the brand color is a one-line edit, not a JSX grep." },
        },
        {
          label: { pt: "Mascote SVG interativo e leve", en: "Interactive, lightweight SVG mascot" },
          detail: { pt: "Panda em SVG puro que segue o cursor com requestAnimationFrame throttling e cochila após 8s parado.", en: "Pure-SVG panda that tracks the cursor with requestAnimationFrame throttling and dozes off after 8s idle." },
        },
        {
          label: { pt: "Lenis + GSAP ScrollTrigger sincronizados", en: "Lenis + GSAP ScrollTrigger, synced" },
          detail: { pt: "Um único loop de animação (raf do Lenis alimenta o ticker do GSAP) evita jank entre scroll suave e parallax.", en: "A single animation loop (Lenis raf feeds the GSAP ticker) avoids jank between smooth-scroll and parallax." },
        },
        {
          label: { pt: "Seletor de tema com 7 paletas", en: "7-palette theme picker" },
          detail: { pt: "data-flavor no <html> troca CSS custom properties, persiste em localStorage e evita flash antes da hidratação.", en: "data-flavor on <html> swaps CSS custom properties, persists to localStorage, and avoids a pre-hydration flash." },
        },
      ],
      gallery: [
        { src: "/shots/rjs-laticinios/01-hero.webp", alt: { pt: "Hero com cena de fazenda em SVG e o panda Pandito", en: "Hero with an SVG farm scene and the Pandito mascot" } },
        { src: "/shots/rjs-laticinios/02-panda-play.webp", alt: { pt: "Panda interativo seguindo o cursor", en: "Interactive panda tracking the cursor" } },
        { src: "/shots/rjs-laticinios/03-products.webp", alt: { pt: "Catálogo de produtos laticínios", en: "Dairy product catalog" } },
      ],
    },
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
    caseStudy: {
      narrative: [
        {
          pt: "O nome do repositório (rpg-mobile) é resquício do rascunho inicial — o produto final não é um RPG, é um simulador de gestão agrícola no estilo \"Brasfoot do café\": navegação por menus e telas, sem cena 3D nem sprite. Construído em React Native 0.81 + Expo SDK 54 com Expo Go pra testar direto no celular via QR code (--lan), roda 100% offline: nenhuma chamada de rede, save local em AsyncStorage. O jogo simula um cafeicultor da Zona da Mata mineira, do primeiro talhão até o império de fazendas certificadas, respeitando a fidelidade temporal real da cultura — uma lavoura nova leva cerca de 3 anos pra formar e produzir.",
          en: "The repo's name (rpg-mobile) is a leftover from the early draft — the finished product isn't an RPG, it's a farm-management sim in the \"Brasfoot for coffee\" mold: menu-and-screen navigation, no 3D scene or sprites. Built with React Native 0.81 + Expo SDK 54, tested straight on-device through Expo Go via QR code (--lan), and running 100% offline: no network calls, local save in AsyncStorage. The game simulates a coffee grower in Minas Gerais's Zona da Mata, from a first plot to a certified farming empire, respecting the crop's real time scale — a new planting takes roughly 3 years to mature and produce.",
        },
        {
          pt: "A arquitetura segue uma regra central documentada no próprio README: nenhum componente tem lógica de simulação, e nenhum módulo de logic/ importa React. src/data/ guarda catálogos puros (variedades, pragas, mercado, glossário), src/logic/ concentra ~20 módulos de funções puras e testáveis sem runtime de UI (ciclo agronômico, colheita, pós-colheita, mercado, financiamento), e só src/hooks/useJogo.jsx faz a ponte com React via useReducer + Context — sem Redux nem Zustand. O reducer central processa dezenas de ações e orquestra sistemas interligados: 11 variedades de café com traços próprios, 6 pragas com sazonalidade, classificação multi-dimensional do lote (Tipo BRASIL × Peneira × SCA), bolsa com índice oscilante e eventos macro, certificações cumulativas e financiamento subsidiado (Funcafé).",
          en: "The architecture follows one rule spelled out in the README: no component holds simulation logic, and no module in logic/ imports React. src/data/ holds pure catalogs (varieties, pests, market, glossary), src/logic/ concentrates roughly 20 pure, UI-runtime-free, testable function modules (agronomic cycle, harvest, post-harvest processing, market, financing), and only src/hooks/useJogo.jsx bridges into React via useReducer + Context — no Redux, no Zustand. The central reducer processes dozens of actions and orchestrates interlocking systems: 11 coffee varieties with their own traits, 6 seasonal pests, multi-dimensional lot classification (Brazil Type x Screen Size x SCA cupping score), a market index that fluctuates with macro events, stacking certifications, and subsidized financing (Funcafé).",
        },
        {
          pt: "Dois detalhes de engenharia resolvem problemas reais de um jogo offline. Primeiro, a aleatoriedade (clima diário, spawn de pragas, eventos extremos) usa um gerador seedável próprio (mulberry32, em src/logic/rng.js) em vez de Math.random(): o save guarda só o inteiro do estado do RNG, não o histórico de eventos, e ao recarregar o jogo reproduz exatamente o mesmo \"destino\" a partir dali. Segundo, o avanço do tempo é híbrido — passo padrão de 7 dias (1 semana), mas cai automaticamente pra 1 dia nas fases sensíveis como secagem do café, onde a umidade precisa ser acompanhada dia a dia (60% → 12%) e o \"pulo de semana\" quebraria a simulação.",
          en: "Two engineering details solve real problems for an offline game. First, all randomness (daily weather, pest spawns, extreme events) runs through a custom seedable generator (mulberry32, in src/logic/rng.js) instead of Math.random(): the save only stores the RNG's integer state, not an event log, so reloading reproduces the exact same \"fate\" going forward. Second, time advancement is hybrid — a default 7-day step (1 week), which automatically drops to 1-day steps during sensitive phases like coffee drying, where humidity must be tracked day by day (60% down to 12%) and skipping a week would break the simulation.",
        },
        {
          pt: "Persistência evoluiu de um save único pra multi-slot (3 slots, cada um com sua chave AsyncStorage), com migração automática e silenciosa do formato antigo pro slot 0 e um campo de versão (versao: 1) no JSON serializado — save de versão incompatível é descartado com log de aviso em vez de travar o app. O projeto é deliberadamente JS puro (sem TypeScript, sem lib de gráfico, sem UI kit externo — só Pressable/View/Text/StyleSheet do React Native) pra manter a barreira de entrada baixa, uma escolha explícita documentada no próprio README para facilitar contribuições futuras.",
          en: "Persistence evolved from a single save into 3 slots, each with its own AsyncStorage key, with automatic, silent migration from the legacy single-save format into slot 0 and a version field (versao: 1) in the serialized JSON — an incompatible save version is discarded with a warning log instead of crashing the app. The project is deliberately plain JS (no TypeScript, no chart library, no external UI kit — just React Native's Pressable/View/Text/StyleSheet) to keep the entry barrier low, an explicit choice documented in the README itself to ease future contributions.",
        },
      ],
      highlights: [
        {
          label: { pt: "Lógica pura, zero React", en: "Pure logic, zero React" },
          detail: { pt: "~20 módulos de simulação em logic/ não importam React — testáveis isoladamente, sem UI.", en: "~20 simulation modules in logic/ import no React — independently testable, no UI involved." },
        },
        {
          label: { pt: "RNG seedável (mulberry32)", en: "Seedable RNG (mulberry32)" },
          detail: { pt: "Clima, pragas e eventos usam um gerador próprio: o save guarda só o estado do RNG e reproduz o mesmo destino ao recarregar.", en: "Weather, pests and events run on a custom generator: the save stores only the RNG state and reproduces the same fate on reload." },
        },
        {
          label: { pt: "Tempo híbrido semana/dia", en: "Hybrid week/day time step" },
          detail: { pt: "Passo padrão de 1 semana cai pra 1 dia automaticamente durante a secagem do café, onde a umidade é crítica.", en: "Default 1-week step auto-drops to 1 day during coffee drying, where humidity tracking is critical." },
        },
        {
          label: { pt: "Save multi-slot versionado", en: "Versioned multi-slot save" },
          detail: { pt: "3 slots no AsyncStorage com migração automática do formato antigo e descarte seguro de saves incompatíveis.", en: "3 AsyncStorage slots with automatic migration from the legacy format and safe discard of incompatible saves." },
        },
      ],
    },
  },
];

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
  tags: string[];
};
export const LAB: LabClip[] = [
  {
    src: "/lab/cosmos.mp4",
    full: "/lab/full-cosmos.mp4",
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
    full: "/lab/full-explosion.mp4",
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
    full: "/lab/full-reel.mp4",
    poster: "/lab/reel.jpg",
    title: { pt: "Site em 30s", en: "Website in 30s" },
    desc: {
      pt: "Um site nascendo do zero — wireframe, componentes e dashboard, tudo animado em código.",
      en: "A website born from scratch — wireframe, components and dashboard, all animated in code.",
    },
    tags: ["Remotion", "TypeScript", "60fps"],
  },
  {
    src: "/lab/unveil.mp4",
    full: "/lab/full-unveil.mp4",
    poster: "/lab/unveil.jpg",
    title: { pt: "Revelação de Produto", en: "Product Reveal" },
    desc: {
      pt: "Um enxame de partículas se monta em um smartphone 3D — vidro, titânio e uma explosão de luz revelando o aparelho.",
      en: "A swarm of particles assembles into a 3D smartphone — glass, titanium and a burst of light revealing the device.",
    },
    tags: ["React Three Fiber", "GLSL", "GSAP"],
  },
  {
    src: "/lab/timescale.mp4",
    full: "/lab/full-timescale.mp4",
    poster: "/lab/timescale.jpg",
    title: { pt: "Escala do Tempo", en: "Timescale" },
    desc: {
      pt: "Do tique de um segundo à história da humanidade até a Terra vista do espaço — uma jornada sobre o valor do tempo, renderizada em shader.",
      en: "From the tick of a second to the history of humankind to Earth seen from space — a journey about the value of time, rendered in shader.",
    },
    tags: ["Three.js", "WebGL", "Shader"],
  },
  {
    src: "/lab/blackhole.mp4",
    full: "/lab/full-blackhole.mp4",
    poster: "/lab/blackhole.jpg",
    title: { pt: "Horizonte de Eventos", en: "Event Horizon" },
    desc: {
      pt: "Uma jornada em alta velocidade por estrelas e nebulosas até um buraco negro — lente gravitacional e disco de acreção com física real, trilha sonora sintetizada em código.",
      en: "A high-speed journey through stars and nebulae into a black hole — real gravitational lensing and accretion disk physics, with a code-synthesized score.",
    },
    tags: ["React Three Fiber", "GLSL", "Remotion"],
  },
];

/** Página /lab (destino de bio nas redes): strings próprias. */
export const LAB_PAGE = {
  metaTitle: {
    pt: "Lab MilWeb — animações e vídeos feitos 100% em código",
    en: "MilWeb Lab — animations and videos made 100% in code",
  },
  metaDescription: {
    pt: "Os filmes do Lab da MilWeb: universo, partículas e interfaces animados inteiramente em código com React, Remotion, Three.js e shaders. Veja como foram feitos.",
    en: "MilWeb Lab films: universe, particles and interfaces animated entirely in code with React, Remotion, Three.js and shaders. See how they were made.",
  },
  eyebrow: { pt: "Lab MilWeb", en: "MilWeb Lab" },
  title: { pt: "Feito de código,", en: "Made of code," },
  titleHighlight: { pt: "do primeiro ao último frame", en: "from the first frame to the last" },
  sub: {
    pt: "Nenhuma imagem de banco, nenhum editor de vídeo: cada frame destes filmes foi renderizado por código que eu escrevi — a mesma engenharia que coloco nos projetos dos clientes.",
    en: "No stock footage, no video editor: every frame of these films was rendered by code I wrote — the same engineering I put into client projects.",
  },
  madeWith: { pt: "Feito com", en: "Made with" },
  watchHint: { pt: "Toque para assistir com som", en: "Tap to watch with sound" },
  ctaTitle: { pt: "Quer esse nível de capricho no seu projeto?", en: "Want this level of craft in your project?" },
  ctaWhats: {
    pt: "Olá Rick! Vi os vídeos do Lab e quero algo nesse nível para minha marca.",
    en: "Hi Rick! I saw the Lab videos and want something at this level for my brand.",
  },
  ctaButton: { pt: "Falar no WhatsApp", en: "Chat on WhatsApp" },
  back: { pt: "Voltar para o site", en: "Back to the site" },
} as const;

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
      pt: "Não são vídeos prontos. São experiências desenvolvidas do zero — React, Three.js e shaders, o mesmo capricho técnico que vai para o seu projeto.",
      en: "These aren't stock videos. They're experiences built from scratch — React, Three.js and shaders, the same technical care that goes into your project.",
    },
    labCta: { pt: "Assistir com som e ver como foi feito", en: "Watch with sound and see how it was made" },
    labCardCta: { pt: "Explorar projeto", en: "Explore project" },
    labScrollHint: { pt: "Role para explorar a vitrine", en: "Scroll to explore the showcase" },
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
    howItWasBuilt: { pt: "Como foi construído", en: "How it was built" },
    gallery: { pt: "Mais telas", en: "More screens" },
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
