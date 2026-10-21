import type { Localized } from "@/lib/content";
import { PROFILE } from "@/lib/content";
import { GH } from "@/lib/content-shared";

/**
 * PERFIL PROFISSIONAL — Rick Januario como engenheiro de software, para
 * recrutadores, empresas de tecnologia e agências. Fonte única (dados +
 * textos nos três idiomas) do app Perfil do MilWeb OS e da rota /perfil.
 *
 * Integridade: tudo aqui vem de fontes declaradas — o currículo em inglês
 * (public/cv/rick-januario-senior-software-engineer-en.pdf, versão de
 * 09/2026), o export do LinkedIn (manchete e resumo), os repositórios
 * públicos em github.com/rickjs2005 e o conteúdo já publicado neste site.
 * Nada de empregador, cargo, data, formação, idioma, métrica ou escala
 * inventados. O resumo do currículo cita a Nubank, mas a experiência lista a
 * SmartSheet como trabalho atual: o resumo foi reescrito sem a referência e a
 * divergência fica registrada para revisão (ver docs/milweb-os-references.md
 * › Revisão 12).
 *
 * Cada competência guarda a origem (`cv` = currículo, `github` =
 * demonstrada nos repositórios, `site` = conteúdo já publicado na MilWeb) —
 * usada na preparação do conteúdo, não exibida.
 */
export type SkillSource = "cv" | "github" | "site";
export type Skill = { name: string | Localized; source: SkillSource[]; /** Ligada aos projetos selecionados: ganha peso visual. */ featured?: boolean; note?: Localized };
export type SkillGroup = { key: string; title: Localized; items: Skill[] };
export type ProjectStatus = "delivered" | "development" | "demo" | "live";

export type ProfileRole = {
  company: string;
  title: Localized;
  /** "MM/AAAA" como no currículo; `end` null = atual. Sem datas quando a fonte não declara (MilWeb). */
  start: string | null;
  end: string | null;
  location: Localized;
  remote?: boolean;
  /** Atuação independente (o estúdio), não emprego corporativo. */
  independent?: boolean;
  bullets: Localized[];
};

export type ProfileProject = {
  slug: string;
  name: string;
  kind: Localized;
  status: ProjectStatus;
  /** Captura real da interface (public/shots) — nunca uma tela inventada. */
  image: string;
  imageAlt: Localized;
  problem: Localized;
  contribution: Localized;
  stack: string[];
  decision: Localized;
  /** O que o código confirma (árvore, package.json, testes) × o que só o README descreve. */
  evidence: { code: Localized; readme: Localized };
  code: { label: string; url: string }[];
  /** Rota INTERNA do case na MilWeb (abre dentro de Projetos). */
  caseRoute: string | null;
  demo: string | null;
  /** Demonstração curta e silenciosa (arquivo real em public/). null enquanto não houver vídeo gravado do projeto. */
  video: { src: string; poster?: string } | null;
};

/**
 * "Engenharia em prática": três recortes do trabalho, cada um apontando para um projeto já documentado
 * em `projects` (o painel mostra a captura, o problema e os links do projeto; o recorte traz a
 * contribuição, a decisão e as tecnologias vistas por aquele ângulo). Só funcionalidades confirmadas no
 * código dos repositórios — nada de mock ou plano futuro apresentado como pronto.
 */
export type ShowcaseTrack = {
  key: "backend" | "ai" | "motion";
  label: Localized;
  /** slug em PROFILE_DATA.projects */
  project: string;
  contribution: Localized;
  decision: Localized;
  stack: string[];
};

const L = (pt: string, en: string, es: string): Localized => ({ pt, en, es });

export const CV_FILE = "/cv/rick-januario-senior-software-engineer-en.pdf";
/** Nome sugerido ao baixar (o arquivo em public/cv é rick-januario-senior-software-engineer-en.pdf). */
export const CV_DOWNLOAD_NAME = "Rick-Januario-Senior-Software-Engineer-EN.pdf";

export const PROFILE_DATA = {
  meta: {
    title: L("Rick Januario — Senior Full Stack Engineer", "Rick Januario — Senior Full Stack Engineer", "Rick Januario — Senior Full Stack Engineer"),
    description: L(
      "Perfil profissional de Rick Januario, Senior Full Stack Engineer: Python, FastAPI, React e PostgreSQL, aplicações com LLMs e agentes de IA, experiência em fintech. Experiência, competências, formação, currículo e projetos técnicos selecionados.",
      "Professional profile of Rick Januario, Senior Full Stack Engineer: Python, FastAPI, React and PostgreSQL, LLM applications and AI agents, fintech experience. Experience, skills, education, résumé and selected technical projects.",
      "Perfil profesional de Rick Januario, Senior Full Stack Engineer: Python, FastAPI, React y PostgreSQL, aplicaciones con LLMs y agentes de IA, experiencia en fintech. Experiencia, competencias, formación, currículum y proyectos técnicos seleccionados.",
    ),
  },
  name: "Rick Januario",
  title: "Senior Full Stack Engineer",
  /** Manchete do LinkedIn, reescrita para leitura (menos palavras-chave). */
  headline: L(
    "Engenharia full-stack em Python e React, com foco em backends escaláveis, aplicações com LLMs e agentes de IA. Experiência em fintech.",
    "Full-stack engineering in Python and React, focused on scalable backends, LLM applications and AI agents. Fintech experience.",
    "Ingeniería full-stack en Python y React, con foco en backends escalables, aplicaciones con LLMs y agentes de IA. Experiencia en fintech.",
  ),
  studio: L("Fundador da MilWeb · atuação independente", "Founder of MilWeb · independent work", "Fundador de MilWeb · actividad independiente"),
  /** Como no currículo atual. */
  location: L("São Paulo, SP · Brasil", "São Paulo, SP · Brazil", "São Paulo, SP · Brasil"),
  photo: { src: "/avatar.png", alt: L("Foto de Rick Januario", "Photo of Rick Januario", "Foto de Rick Januario") },
  links: { github: PROFILE.github, linkedin: PROFILE.linkedin },
  cv: { href: CV_FILE, download: CV_DOWNLOAD_NAME, lang: L("PDF em inglês · 2 páginas", "PDF in English · 2 pages", "PDF en inglés · 2 páginas") },

  /** Resumo em primeira pessoa (currículo + LinkedIn), sem a referência à Nubank. */
  about: L(
    "Sou engenheiro de software full-stack com mais de cinco anos construindo serviços de backend, APIs e aplicações web, a maior parte em Python. Boa parte da minha carreira foi em fintech, em sistemas de pagamento e financeiros na Fiserv, onde acertar os detalhes faz diferença. Trabalho em toda a stack com Django, FastAPI, PostgreSQL, React e AWS, e nos últimos tempos tenho dedicado grande parte do tempo a integrações, automações e aplicações com LLMs e agentes de IA que tiram trabalho repetitivo e manual das pessoas. Participo do ciclo inteiro: transformar requisitos soltos em software junto com o time de produto, implementar, testar, acompanhar em produção e manter simples de evoluir. Em paralelo, a MilWeb é meu estúdio independente, onde construo sites, sistemas e experiências web do início ao fim.",
    "I'm a full-stack software engineer with more than five years of experience building backend services, APIs and web applications, mostly in Python. A big part of my career has been in fintech, on payment and financial systems at Fiserv, where getting the details right really matters. I work across the stack with Django, FastAPI, PostgreSQL, React and AWS, and lately I've been spending much of my time on integrations, automations and applications with LLMs and AI agents that take repetitive, manual work off people's plates. I take part in the whole cycle: turning loose requirements into software with the product team, implementing, testing, following it in production and keeping it simple to evolve. Alongside that, MilWeb is my independent studio, where I build websites, systems and web experiences end to end.",
    "Soy ingeniero de software full-stack con más de cinco años construyendo servicios de backend, APIs y aplicaciones web, la mayor parte en Python. Buena parte de mi carrera fue en fintech, en sistemas de pagos y financieros en Fiserv, donde cuidar los detalles marca la diferencia. Trabajo en todo el stack con Django, FastAPI, PostgreSQL, React y AWS, y últimamente dedico gran parte del tiempo a integraciones, automatizaciones y aplicaciones con LLMs y agentes de IA que quitan trabajo repetitivo y manual de las manos de las personas. Participo de todo el ciclo: convertir requisitos sueltos en software junto al equipo de producto, implementar, probar, acompañar en producción y mantenerlo simple de evolucionar. En paralelo, MilWeb es mi estudio independiente, donde construyo sitios, sistemas y experiencias web de principio a fin.",
  ),

  /** Linha do tempo — cargos, períodos e responsabilidades como no currículo (traduzidos fielmente). */
  experience: [
    {
      company: "SmartSheet",
      title: L("Senior Full Stack Engineer", "Senior Full Stack Engineer", "Senior Full Stack Engineer"),
      start: "03/2025",
      end: null,
      location: L("Bellevue, Washington, EUA", "Bellevue, Washington, US", "Bellevue, Washington, EE. UU."),
      remote: true,
      bullets: [
        L("Construo e mantenho aplicações full-stack com Python, FastAPI, React e TypeScript.", "Build and maintain full-stack applications using Python, FastAPI, React, and TypeScript.", "Construyo y mantengo aplicaciones full-stack con Python, FastAPI, React y TypeScript."),
        L("Desenvolvo funcionalidades com IA e fluxos de agentes que conectam LLMs a APIs, serviços da aplicação e ferramentas internas.", "Develop AI-powered features and agent workflows that connect LLMs with APIs, application services, and internal tools.", "Desarrollo funcionalidades con IA y flujos de agentes que conectan LLMs con APIs, servicios de la aplicación y herramientas internas."),
        L("Construo serviços de backend e APIs REST que sustentam produtos voltados ao cliente e plataformas internas.", "Build backend services and REST APIs supporting customer-facing products and internal platforms.", "Construyo servicios de backend y APIs REST que sostienen productos para clientes y plataformas internas."),
        L("Modelo dados em PostgreSQL e serviços da aplicação com foco em confiabilidade e manutenibilidade.", "Design PostgreSQL data models and application services with a focus on reliability and maintainability.", "Diseño modelos de datos en PostgreSQL y servicios de la aplicación con foco en confiabilidad y mantenibilidad."),
        L("Integro APIs externas, serviços de IA e fluxos de negócio em aplicações em produção.", "Integrate external APIs, AI services, and business workflows into production applications.", "Integro APIs externas, servicios de IA y flujos de negocio en aplicaciones en producción."),
        L("Melhoro a qualidade da aplicação com testes automatizados, revisão de código, monitoramento e fluxos de CI/CD.", "Improve application quality through automated testing, code reviews, monitoring, and CI/CD workflows.", "Mejoro la calidad de la aplicación con pruebas automatizadas, revisión de código, monitoreo y flujos de CI/CD."),
      ],
    },
    {
      company: "Fiserv",
      title: L("Senior Software Engineer", "Senior Software Engineer", "Senior Software Engineer"),
      start: "05/2022",
      end: "02/2025",
      location: L("São Paulo, SP, Brasil", "São Paulo, SP, Brazil", "São Paulo, SP, Brasil"),
      bullets: [
        L("Desenvolvi serviços de backend em Python e APIs REST para aplicações de tecnologia financeira e pagamentos.", "Developed Python backend services and REST APIs for financial technology and payment-related applications.", "Desarrollé servicios de backend en Python y APIs REST para aplicaciones de tecnología financiera y pagos."),
        L("Construí fluxos assistidos por IA e serviços baseados em agentes para automatizar processos repetitivos e conectar LLMs a APIs internas e dados da aplicação.", "Built AI-assisted workflows and agent-based services to automate repetitive business processes and connect LLMs with internal APIs and application data.", "Construí flujos asistidos por IA y servicios basados en agentes para automatizar procesos repetitivos y conectar LLMs con APIs internas y datos de la aplicación."),
        L("Modelei e mantive dados em PostgreSQL, consultas e integrações que sustentam fluxos de aplicações financeiras.", "Designed and maintained PostgreSQL data models, queries, and integrations supporting financial application workflows.", "Diseñé y mantuve modelos de datos en PostgreSQL, consultas e integraciones que sostienen flujos de aplicaciones financieras."),
        L("Implementei testes automatizados e fluxos de CI/CD para melhorar a qualidade do software e o processo de release.", "Implemented automated testing and CI/CD workflows to improve software quality and release processes.", "Implementé pruebas automatizadas y flujos de CI/CD para mejorar la calidad del software y el proceso de release."),
        L("Colaborei com os times de engenharia e produto para resolver problemas em produção e entregar funcionalidades escaláveis.", "Collaborated with engineering and product teams to troubleshoot production issues and deliver scalable application features.", "Colaboré con los equipos de ingeniería y producto para resolver problemas en producción y entregar funcionalidades escalables."),
      ],
    },
    {
      company: "GoWorks",
      title: L("Software Engineer", "Software Engineer", "Software Engineer"),
      start: "05/2020",
      end: "04/2022",
      location: L("São Paulo, SP, Brasil", "São Paulo, SP, Brazil", "São Paulo, SP, Brasil"),
      bullets: [
        L("Desenvolvi aplicações web e serviços de backend com Python, Django, APIs REST e SQL.", "Developed web applications and backend services using Python, Django, REST APIs, and SQL.", "Desarrollé aplicaciones web y servicios de backend con Python, Django, APIs REST y SQL."),
        L("Construí funcionalidades do requisito à implementação, testes e deploy.", "Built application features from requirements through implementation, testing, and deployment.", "Construí funcionalidades desde el requisito hasta la implementación, las pruebas y el deploy."),
        L("Modelei dados em PostgreSQL e integrações com serviços de terceiros.", "Designed PostgreSQL data models and integrations with third-party services.", "Diseñé modelos de datos en PostgreSQL e integraciones con servicios de terceros."),
        L("Usei Docker, Git e fluxos de CI/CD para manter ambientes de desenvolvimento e deploy consistentes.", "Used Docker, Git, and CI/CD workflows to support consistent development and deployment environments.", "Usé Docker, Git y flujos de CI/CD para mantener entornos de desarrollo y deploy consistentes."),
      ],
    },
    {
      // Atuação independente: sem data de início (nenhuma fonte a declara) e sem logo — não é emprego corporativo.
      company: "MilWeb",
      title: L("Fundador e desenvolvedor", "Founder and developer", "Fundador y desarrollador"),
      start: null,
      end: null,
      location: L("Brasil · remoto", "Brazil · remote", "Brasil · remoto"),
      independent: true,
      bullets: [
        L("Estúdio de desenvolvimento de uma pessoa: sites, sistemas e experiências web para empresas no Brasil, do briefing ao deploy, com contrato e suporte pós-entrega.", "One-person development studio: websites, systems and web experiences for companies in Brazil, from briefing to deploy, with a contract and post-launch support.", "Estudio de desarrollo de una persona: sitios, sistemas y experiencias web para empresas en Brasil, del briefing al deploy, con contrato y soporte posentrega."),
        L("Produtos próprios em TypeScript — MilLead (CRM da operação), InkVision e Milsaca (SaaS multi-tenant) — e projetos autorais com WebGL e 3D.", "Own products in TypeScript — MilLead (the studio's CRM), InkVision and Milsaca (multi-tenant SaaS) — plus studio projects with WebGL and 3D.", "Productos propios en TypeScript — MilLead (CRM de la operación), InkVision y Milsaca (SaaS multi-tenant) — y proyectos propios con WebGL y 3D."),
      ],
    },
  ] as ProfileRole[],

  /** Competências por grupo. `featured` = ligada aos projetos selecionados. */
  skills: [
    {
      key: "languages",
      title: L("Linguagens", "Languages", "Lenguajes"),
      items: [
        { name: "Python", source: ["cv"], featured: true },
        { name: "TypeScript", source: ["cv", "github"], featured: true },
        { name: "JavaScript", source: ["cv", "github"] },
        { name: "SQL", source: ["cv", "github"], featured: true },
        { name: "Java", source: ["cv"] },
      ],
    },
    {
      key: "backend",
      title: L("Backend e APIs", "Backend and APIs", "Backend y APIs"),
      items: [
        { name: "FastAPI", source: ["cv"], featured: true },
        { name: "Django", source: ["cv"] },
        { name: "Flask", source: ["cv"] },
        { name: "Node.js", source: ["cv", "github"], featured: true },
        { name: "Express", source: ["github"], featured: true },
        { name: "REST APIs", source: ["cv", "github"], featured: true, note: L("desenho de API, integração de sistemas", "API design, system integration", "diseño de API, integración de sistemas") },
        { name: "Microservices", source: ["cv"] },
        { name: "Prisma", source: ["github"], featured: true },
        { name: "Socket.IO", source: ["github"] },
        { name: "pg-boss · BullMQ", source: ["github"], note: L("filas e workers", "queues and workers", "colas y workers") },
      ],
    },
    {
      key: "frontend",
      title: L("Frontend", "Frontend", "Frontend"),
      items: [
        { name: "React", source: ["cv", "github"], featured: true },
        { name: "Next.js", source: ["github", "site"], featured: true },
        { name: "TypeScript", source: ["cv", "github"] },
        { name: "HTML · CSS", source: ["cv", "github"] },
        { name: "Tailwind CSS", source: ["github"] },
        { name: "React Native · Expo", source: ["github"] },
      ],
    },
    {
      key: "databases",
      title: L("Bancos de dados", "Databases", "Bases de datos"),
      items: [
        { name: "PostgreSQL", source: ["cv", "github"], featured: true },
        { name: "MySQL", source: ["cv", "github"], featured: true },
        { name: "Redis", source: ["cv", "github"] },
        { name: "MongoDB", source: ["cv"] },
        { name: "Supabase", source: ["github"], note: L("Postgres com RLS, edge functions", "Postgres with RLS, edge functions", "Postgres con RLS, edge functions") },
        { name: "Multi-tenant · RLS", source: ["github"], featured: true },
      ],
    },
    {
      key: "ai",
      title: L("IA e LLMs", "AI and LLMs", "IA y LLMs"),
      items: [
        { name: "LLM applications", source: ["cv"], featured: true },
        { name: "AI agents · agent workflows", source: ["cv"], featured: true },
        { name: "Tool calling", source: ["cv"] },
        { name: "Prompt engineering", source: ["cv"] },
        { name: "OpenAI APIs", source: ["cv"] },
        { name: "RAG", source: ["cv"] },
        { name: "Anthropic SDK (Claude)", source: ["github"], note: L("score de leads e rascunhos no MilLead", "lead scoring and drafts in MilLead", "score de leads y borradores en MilLead") },
      ],
    },
    {
      key: "cloud",
      title: L("Cloud, ferramentas e entrega", "Cloud, tooling and delivery", "Cloud, herramientas y entrega"),
      items: [
        { name: "AWS", source: ["cv"] },
        { name: "Docker", source: ["cv", "github"], featured: true },
        { name: "CI/CD · GitHub Actions", source: ["cv", "github"], featured: true },
        { name: "Linux", source: ["cv"] },
        { name: "Git · GitHub", source: ["cv", "github"] },
        { name: L("Testes automatizados", "Automated testing", "Pruebas automatizadas"), source: ["cv", "github"], featured: true, note: L("Jest, Supertest, Vitest, Playwright", "Jest, Supertest, Vitest, Playwright", "Jest, Supertest, Vitest, Playwright") },
        { name: "Vercel · Render", source: ["github", "site"] },
        { name: "Postman · Jira", source: ["cv"] },
      ],
    },
    {
      key: "creative",
      title: L("Desenvolvimento criativo", "Creative development", "Desarrollo creativo"),
      items: [
        { name: "WebGL · GLSL", source: ["site", "github"], featured: true },
        { name: "Three.js · React Three Fiber", source: ["github", "site"] },
        { name: "GSAP · Lenis", source: ["github", "site"] },
        { name: L("Motion e interação", "Motion and interaction", "Motion e interacción"), source: ["site"] },
      ],
    },
  ] as SkillGroup[],

  /** Projetos técnicos selecionados — repositórios públicos examinados em 20/10/2026. */
  projects: [
    {
      slug: "millead",
      name: "MilLead",
      kind: L("CRM e gestão da operação · produto próprio", "CRM and operations · own product", "CRM y gestión de la operación · producto propio"),
      status: "delivered",
      image: "/shots/millead.webp",
      imageAlt: L("Painel do MilLead", "MilLead dashboard", "Panel de MilLead"),
      problem: L(
        "Prospectar e operar a agência era manual: achar negócios com site fraco, avaliar um por um, escrever cada abordagem, fechar contrato e acompanhar o projeto em planilhas.",
        "Prospecting and running the studio was manual: finding businesses with weak websites, assessing each one, writing every outreach, closing contracts and tracking projects in spreadsheets.",
        "Prospectar y operar la agencia era manual: encontrar negocios con sitio débil, evaluarlos uno a uno, escribir cada abordaje, cerrar contratos y seguir los proyectos en planillas.",
      ),
      contribution: L(
        "Projeto solo: arquitetura do monorepo, API, modelagem do banco, frontend, filas e deploy. Em uso na operação da MilWeb.",
        "Solo project: monorepo architecture, API, database modelling, frontend, queues and deploy. In use in MilWeb's own operation.",
        "Proyecto solo: arquitectura del monorepo, API, modelado de la base, frontend, colas y deploy. En uso en la operación de MilWeb.",
      ),
      stack: ["Next.js 15", "React 19", "TypeScript", "Node.js", "Express", "PostgreSQL", "Prisma", "pg-boss", "Turborepo"],
      decision: L(
        "Fila de jobs no próprio Postgres (pg-boss) no lugar de Redis + BullMQ: um serviço a menos para operar no free tier, e auditoria de sites, PDFs de contrato e a automação pós-fechamento rodam como workers dentro da mesma API.",
        "Job queue inside Postgres itself (pg-boss) instead of Redis + BullMQ: one less service to run on the free tier, and site audits, contract PDFs and the post-closing automation run as workers inside the same API.",
        "Cola de jobs en el propio Postgres (pg-boss) en lugar de Redis + BullMQ: un servicio menos que operar en el free tier, y la auditoría de sitios, los PDF de contrato y la automatización poscierre corren como workers dentro de la misma API.",
      ),
      evidence: {
        code: L(
          "Clean Architecture na API (domain, application, infrastructure e interfaces), migrations do Prisma, filas pg-boss de auditoria, briefing, contrato e pós-venda, serviço de IA com score do lead, relatório executivo e rascunho de mensagem (adaptadores Anthropic e OpenAI-compatível, desligado sem chave), Zod, Helmet, JWT, pdf-lib e três workflows de CI.",
          "Clean Architecture in the API (domain, application, infrastructure and interfaces), Prisma migrations, pg-boss queues for audits, briefings, contracts and post-sale, an AI service with lead scoring, executive report and message drafts (Anthropic and OpenAI-compatible adapters, off without a key), Zod, Helmet, JWT, pdf-lib and three CI workflows.",
          "Clean Architecture en la API (domain, application, infrastructure e interfaces), migrations de Prisma, colas pg-boss de auditoría, briefing, contrato y posventa, servicio de IA con score del lead, informe ejecutivo y borrador de mensaje (adaptadores Anthropic y compatible con OpenAI, apagado sin clave), Zod, Helmet, JWT, pdf-lib y tres workflows de CI.",
        ),
        readme: L(
          "Auditoria de sites em seis categorias, score de leads e rascunhos por IA, contratos com assinatura eletrônica, automação pós-fechamento e multi-tenant com RLS.",
          "Website audits in six categories, AI lead scoring and drafts, contracts with electronic signature, post-closing automation and multi-tenancy with RLS.",
          "Auditoría de sitios en seis categorías, score de leads y borradores por IA, contratos con firma electrónica, automatización poscierre y multi-tenant con RLS.",
        ),
      },
      code: [{ label: "GitHub", url: `${GH}/millead` }],
      // O case /work/millead existe, mas o projeto é oculto das listas (ferramenta interna) e o mural de Projetos não o exibe.
      caseRoute: null,
      demo: null,
      video: null,
    },
    {
      slug: "inkvision",
      name: "InkVision",
      kind: L("SaaS multi-tenant para estúdios de tatuagem", "Multi-tenant SaaS for tattoo studios", "SaaS multi-tenant para estudios de tatuajes"),
      status: "development",
      image: "/shots/inkvision.webp",
      imageAlt: L("Página inicial do InkVision", "InkVision home page", "Página inicial de InkVision"),
      problem: L(
        "O cliente de tatuagem decide no escuro: só vê como a arte fica na pele durante a sessão. Faltava um fluxo de pedido, orçamento, aprovação e agendamento num só lugar.",
        "Tattoo clients decide in the dark: they only see how the art looks on skin during the session. Ordering, quoting, approval and scheduling had no single place to live.",
        "El cliente de tatuajes decide a ciegas: solo ve cómo queda el arte en la piel durante la sesión. Faltaba un flujo de pedido, presupuesto, aprobación y agenda en un solo lugar.",
      ),
      contribution: L(
        "Projeto solo: modelagem do domínio, Clean Architecture, serviço de tempo real, camada de IA com provedores plugáveis, testes e empacotamento em Docker.",
        "Solo project: domain modelling, Clean Architecture, real-time service, AI layer with pluggable providers, tests and Docker packaging.",
        "Proyecto solo: modelado del dominio, Clean Architecture, servicio en tiempo real, capa de IA con proveedores intercambiables, pruebas y empaquetado en Docker.",
      ),
      stack: ["Next.js 15", "React 19", "TypeScript", "Prisma", "PostgreSQL", "Redis", "Socket.IO", "BullMQ", "Better Auth", "Docker"],
      decision: L(
        "O pedido é uma máquina de estados no domínio (transições validadas fora do framework), o Socket.IO vive num processo próprio e os jobs num worker — WebSocket de longa duração e fila não convivem com o modelo serverless do Next — e pagamento, storage e IA são portas com implementação simulada por padrão.",
        "The order is a state machine in the domain (transitions validated outside the framework), Socket.IO lives in its own process and jobs in a worker — long-lived WebSockets and queues don't fit Next's serverless model — and payments, storage and AI are ports with mock implementations by default.",
        "El pedido es una máquina de estados en el dominio (transiciones validadas fuera del framework), Socket.IO vive en un proceso propio y los jobs en un worker — WebSocket de larga duración y colas no conviven con el modelo serverless de Next — y pagos, storage e IA son puertos con implementación simulada por defecto.",
      ),
      evidence: {
        code: L(
          "Máquina de estados do pedido em packages/core, políticas de RLS versionadas (rls.sql), apps realtime e worker separados, testes unitários e cinco specs e2e em Playwright, Dockerfiles e CI.",
          "Order state machine in packages/core, versioned RLS policies (rls.sql), separate realtime and worker apps, unit tests plus five Playwright e2e specs, Dockerfiles and CI.",
          "Máquina de estados del pedido en packages/core, políticas de RLS versionadas (rls.sql), apps realtime y worker separadas, pruebas unitarias y cinco specs e2e en Playwright, Dockerfiles y CI.",
        ),
        readme: L(
          "Doze sprints concluídos, dezesseis estados do pedido, simulação da tatuagem na foto do cliente por IA, LGPD, 59 testes. Sem deploy público; provedores simulados por padrão.",
          "Twelve sprints completed, sixteen order states, AI tattoo simulation on the client's photo, LGPD, 59 tests. No public deployment; mock providers by default.",
          "Doce sprints concluidos, dieciséis estados del pedido, simulación del tatuaje en la foto del cliente por IA, LGPD, 59 pruebas. Sin deploy público; proveedores simulados por defecto.",
        ),
      },
      code: [{ label: "GitHub", url: `${GH}/inkvision` }],
      caseRoute: "/work/inkvision",
      demo: null,
      video: null,
    },
    {
      slug: "ecommerce-do-agro",
      name: "Kavita Platform",
      kind: L("API REST + plataforma de e-commerce do agro", "REST API + agribusiness e-commerce platform", "API REST + plataforma de e-commerce del agro"),
      status: "demo",
      image: "/shots/kavita.webp",
      imageAlt: L("Loja da Kavita Platform", "Kavita Platform storefront", "Tienda de Kavita Platform"),
      problem: L(
        "Um negócio do agro precisava de mais que uma loja: vendas, pagamento, entregas e gestão por papel (admin, cliente, corretora e produtor) numa plataforma só.",
        "An agribusiness needed more than a store: sales, payment, deliveries and role-based management (admin, customer, broker and producer) in a single platform.",
        "Un negocio del agro necesitaba más que una tienda: ventas, pago, entregas y gestión por rol (admin, cliente, corredora y productor) en una sola plataforma.",
      ),
      contribution: L(
        "Backend e frontend em dois repositórios que só se falam por HTTP: API em camadas (rota, controller, service, repository), autenticação por contexto, uploads, pagamentos e documentação; protótipo de estudo, não produto de cliente.",
        "Backend and frontend in two repositories that only talk over HTTP: layered API (route, controller, service, repository), per-context authentication, uploads, payments and docs; a study prototype, not a client product.",
        "Backend y frontend en dos repositorios que solo se hablan por HTTP: API en capas (ruta, controller, service, repository), autenticación por contexto, uploads, pagos y documentación; prototipo de estudio, no producto de cliente.",
      ),
      stack: ["Node.js", "Express", "MySQL", "Zod", "JWT", "Redis", "Jest · Supertest", "Swagger", "Docker", "Next.js 15"],
      decision: L(
        "Quatro contextos de autenticação independentes (admin, cliente, corretora, produtor), cada um com cookie HttpOnly, middleware e login próprios, coexistindo no mesmo navegador; acesso a dados com mysql2 em pool, e o Sequelize restrito à CLI de migrations.",
        "Four independent authentication contexts (admin, customer, broker, producer), each with its own HttpOnly cookie, middleware and login, coexisting in the same browser; data access through a raw mysql2 pool, with Sequelize restricted to the migrations CLI.",
        "Cuatro contextos de autenticación independientes (admin, cliente, corredora, productor), cada uno con cookie HttpOnly, middleware y login propios, conviviendo en el mismo navegador; acceso a datos con mysql2 en pool, y Sequelize limitado a la CLI de migrations.",
      ),
      evidence: {
        code: L(
          "199 arquivos de teste (150 unitários, 49 de integração) em Jest e Supertest, rotas separadas por contexto (admin, public, corretoraPanel), Swagger, Helmet, rate limit com Redis, Mercado Pago, CI/CD e Dockerfile.",
          "199 test files (150 unit, 49 integration) in Jest and Supertest, routes split by context (admin, public, corretoraPanel), Swagger, Helmet, Redis-backed rate limiting, Mercado Pago, CI/CD and a Dockerfile.",
          "199 archivos de prueba (150 unitarias, 49 de integración) en Jest y Supertest, rutas separadas por contexto (admin, public, corretoraPanel), Swagger, Helmet, rate limit con Redis, Mercado Pago, CI/CD y Dockerfile.",
        ),
        readme: L(
          "Contrato de resposta único da API, tratamento de erros padronizado, autenticação dupla por cookie HttpOnly e assinatura eletrônica de contratos via ClickSign com webhook validado por HMAC.",
          "Single API response contract, standardised error handling, dual HttpOnly-cookie authentication and electronic contract signing through ClickSign with an HMAC-validated webhook.",
          "Contrato de respuesta único de la API, manejo de errores estandarizado, autenticación doble por cookie HttpOnly y firma electrónica de contratos vía ClickSign con webhook validado por HMAC.",
        ),
      },
      code: [
        { label: "Backend", url: `${GH}/ecommerce-do-agro-backend` },
        { label: "Frontend", url: `${GH}/ecommerce-do-agro-frontend` },
      ],
      caseRoute: "/work/ecommerce-do-agro",
      demo: null,
      video: null,
    },
    {
      slug: "milweb-os",
      name: "MilWeb OS",
      kind: L("Desenvolvimento criativo · este site", "Creative development · this website", "Desarrollo creativo · este sitio"),
      status: "live",
      image: "/shots/milweb-os.webp",
      imageAlt: L("Área de trabalho do MilWeb OS com o olho em WebGL", "MilWeb OS desktop with the WebGL eye", "Escritorio de MilWeb OS con el ojo en WebGL"),
      problem: L(
        "Apresentar o estúdio e o trabalho como uma experiência própria — um sistema operacional com janelas, apps e um olho vivo — sem abrir mão de rotas compartilháveis, três idiomas, SEO e acessibilidade.",
        "Present the studio and its work as an experience of its own — an operating system with windows, apps and a living eye — without giving up shareable routes, three languages, SEO and accessibility.",
        "Presentar el estudio y el trabajo como una experiencia propia — un sistema operativo con ventanas, apps y un ojo vivo — sin renunciar a rutas compartibles, tres idiomas, SEO y accesibilidad.",
      ),
      contribution: L(
        "Projeto solo: design, Next.js App Router trilíngue, gerenciador de janelas em Zustand, olho 2.5D em GLSL (refração, pálpebras, cílios fio a fio), temas claro e escuro e uma suíte Playwright com mais de 400 verificações.",
        "Solo project: design, trilingual Next.js App Router, a Zustand window manager, a 2.5D eye in GLSL (refraction, eyelids, strand-by-strand lashes), light and dark themes and a Playwright suite with 400+ checks.",
        "Proyecto solo: diseño, Next.js App Router trilingüe, gestor de ventanas en Zustand, ojo 2.5D en GLSL (refracción, párpados, pestañas hilo a hilo), temas claro y oscuro y una suite Playwright con más de 400 verificaciones.",
      ),
      stack: ["Next.js 15", "React 19", "TypeScript", "Zustand", "WebGL · GLSL", "GSAP", "Playwright"],
      decision: L(
        "O olho é um fragment shader analítico (esfera, íris refratada, pálpebras por curvas) em vez de uma malha 3D: nenhuma dependência pesada, a imagem estática é gerada pelo mesmo shader como fallback e a troca de tema acontece com a pálpebra fechada.",
        "The eye is an analytic fragment shader (sphere, refracted iris, curve-based eyelids) instead of a 3D mesh: no heavy dependency, the static fallback image is rendered by the same shader, and the theme switch happens while the eyelid is shut.",
        "El ojo es un fragment shader analítico (esfera, iris refractado, párpados por curvas) en lugar de una malla 3D: sin dependencias pesadas, la imagen estática se genera con el mismo shader como fallback y el cambio de tema ocurre con el párpado cerrado.",
      ),
      evidence: {
        code: L(
          "Tudo neste repositório: shader em features/os/eye, store em features/os/store.ts, rotas localizadas em i18n/routing.ts e a suíte em scripts/os-check.mjs.",
          "All in this repository: the shader in features/os/eye, the store in features/os/store.ts, localised routes in i18n/routing.ts and the suite in scripts/os-check.mjs.",
          "Todo en este repositorio: el shader en features/os/eye, el store en features/os/store.ts, las rutas localizadas en i18n/routing.ts y la suite en scripts/os-check.mjs.",
        ),
        readme: L("A documentação de decisões vive em docs/milweb-os-references.md.", "Design decisions are documented in docs/milweb-os-references.md.", "La documentación de decisiones vive en docs/milweb-os-references.md."),
      },
      code: [{ label: "GitHub", url: `${GH}/milweb` }],
      caseRoute: null,
      demo: "https://milweb.com.br",
      video: null,
    },
  ] as ProfileProject[],

  /** Engenharia em prática — recortes lidos no código em 21/10/2026 (millead: ai-service, lead-ai, infrastructure/ai, infrastructure/queue). */
  showcase: [
    {
      key: "backend",
      label: L("Backend & APIs", "Backend & APIs", "Backend y APIs"),
      project: "ecommerce-do-agro",
      contribution: L(
        "API REST em camadas (rota, controller, service, repository) com autenticação por contexto, uploads, pagamento via Mercado Pago, documentação Swagger e 199 arquivos de teste em Jest e Supertest; o frontend em Next.js fica em outro repositório e só fala com a API por HTTP.",
        "Layered REST API (route, controller, service, repository) with per-context authentication, uploads, Mercado Pago payments, Swagger docs and 199 test files in Jest and Supertest; the Next.js frontend lives in its own repository and only talks to the API over HTTP.",
        "API REST en capas (ruta, controller, service, repository) con autenticación por contexto, uploads, pago vía Mercado Pago, documentación Swagger y 199 archivos de prueba en Jest y Supertest; el frontend en Next.js vive en otro repositorio y solo habla con la API por HTTP.",
      ),
      decision: L(
        "Quatro contextos de autenticação independentes (admin, cliente, corretora e produtor), cada um com cookie HttpOnly, middleware e login próprios, convivendo no mesmo navegador; acesso a dados com mysql2 em pool e o Sequelize restrito à CLI de migrations.",
        "Four independent authentication contexts (admin, customer, broker and producer), each with its own HttpOnly cookie, middleware and login, coexisting in the same browser; data access through a raw mysql2 pool, with Sequelize restricted to the migrations CLI.",
        "Cuatro contextos de autenticación independientes (admin, cliente, corredora y productor), cada uno con cookie HttpOnly, middleware y login propios, conviviendo en el mismo navegador; acceso a datos con mysql2 en pool y Sequelize limitado a la CLI de migrations.",
      ),
      stack: ["Node.js", "Express", "MySQL", "Zod", "JWT", "Redis", "Jest · Supertest", "Swagger", "Docker"],
    },
    {
      key: "ai",
      label: L("IA & automações", "AI & automations", "IA y automatizaciones"),
      project: "millead",
      contribution: L(
        "A camada de IA do CRM: score do lead com justificativa gravada na linha do tempo, relatório executivo e rascunho de mensagem por canal, montados a partir do contexto real do lead (empresa, última auditoria do site, atividades recentes). E as automações em filas no Postgres: auditoria de sites, briefing, PDF de contrato e pós-venda.",
        "The CRM's AI layer: lead scoring with the rationale logged to the timeline, an executive report and per-channel message drafts, all built from the lead's real context (company, latest site audit, recent activity). Plus the automations as Postgres-backed queues: site audits, briefings, contract PDFs and post-sale.",
        "La capa de IA del CRM: score del lead con justificación registrada en la línea de tiempo, informe ejecutivo y borrador de mensaje por canal, armados a partir del contexto real del lead (empresa, última auditoría del sitio, actividades recientes). Y las automatizaciones en colas sobre Postgres: auditoría de sitios, briefing, PDF de contrato y posventa.",
      ),
      decision: L(
        "A IA é uma porta do domínio (LeadAi) com dois adaptadores, Anthropic e qualquer API compatível com OpenAI, e nasce desligada quando não há chave: o CRM funciona inteiro sem ela, e trocar de modelo é configuração, não código.",
        "AI is a domain port (LeadAi) with two adapters, Anthropic and any OpenAI-compatible API, and it starts switched off when no key is set: the CRM works fully without it, and changing models is configuration, not code.",
        "La IA es un puerto del dominio (LeadAi) con dos adaptadores, Anthropic y cualquier API compatible con OpenAI, y nace apagada cuando no hay clave: el CRM funciona entero sin ella, y cambiar de modelo es configuración, no código.",
      ),
      stack: ["Node.js", "Express", "TypeScript", "PostgreSQL", "Prisma", "pg-boss", "Anthropic SDK", "Zod"],
    },
    {
      key: "motion",
      label: L("Interfaces & motion", "Interfaces & motion", "Interfaces y motion"),
      project: "milweb-os",
      contribution: L(
        "Gerenciador de janelas em Zustand com a URL mandando no foco, o telefone como launcher com histórico próprio, olho 2.5D em GLSL com dois temas, tela de carregamento com prontidão real e a suíte Playwright que valida tudo isso, com mais de 400 verificações.",
        "A Zustand window manager where the URL drives focus, the phone as a launcher with its own history, a 2.5D eye in GLSL with two themes, a loading screen tied to real readiness and the Playwright suite that validates all of it, with 400+ checks.",
        "Gestor de ventanas en Zustand con la URL mandando en el foco, el teléfono como launcher con historial propio, ojo 2.5D en GLSL con dos temas, pantalla de carga con disponibilidad real y la suite Playwright que valida todo eso, con más de 400 verificaciones.",
      ),
      decision: L(
        "O olho é um fragment shader analítico (esfera, íris refratada, pálpebras por curvas) em vez de uma malha 3D: nenhuma dependência pesada, a imagem estática é gerada pelo mesmo shader como fallback e a troca de tema acontece com a pálpebra fechada.",
        "The eye is an analytic fragment shader (sphere, refracted iris, curve-based eyelids) instead of a 3D mesh: no heavy dependency, the static fallback image is rendered by the same shader, and the theme switch happens while the eyelid is shut.",
        "El ojo es un fragment shader analítico (esfera, iris refractado, párpados por curvas) en lugar de una malla 3D: sin dependencias pesadas, la imagen estática se genera con el mismo shader como fallback y el cambio de tema ocurre con el párpado cerrado.",
      ),
      stack: ["Next.js 15", "React 19", "TypeScript", "Zustand", "WebGL · GLSL", "GSAP", "Playwright"],
    },
  ] as ShowcaseTrack[],

  education: [
    {
      degree: L("Bacharelado em Ciência da Computação", "Bachelor of Science in Computer Science", "Licenciatura en Ciencias de la Computación"),
      school: L("Universidade de São Paulo", "University of São Paulo", "Universidad de São Paulo"),
      start: "08/2017",
      end: "12/2021",
    },
  ],
  /**
   * Idiomas: nenhuma das fontes declara fluência (o currículo estar em inglês não é
   * declaração). Certificações listadas no LinkedIn sem emissor ficam fora até revisão.
   */
  languages: [] as { name: Localized; level: Localized }[],
};
