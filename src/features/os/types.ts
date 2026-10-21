import type { Dictionary } from "@/i18n/types";
import type { Locale } from "@/i18n/config";

/**
 * Carga de dados do MilWeb OS para UM idioma — tudo que as ilhas client
 * precisam para desenhar os apps sem importar conteúdo/dicionários
 * (que são server-only e pesados). Montada em payload.ts (servidor).
 */

export type OsStrings = Dictionary["os"];

export type OsProject = {
  slug: string;
  title: string;
  /** Nome curto de exibição (KAVITA, TERRAL…) quando existe; senão o título. */
  name: string;
  n: string;
  /** Tipo criativo, já localizado (EXPERIÊNCIA NO SCROLL…). */
  type: string;
  /** Categoria comercial, já localizada. */
  category: string;
  year: number | null;
  client: string | null;
  clientWork: boolean;
  live: string | null;
  /** Captura principal (public/shots). */
  image: string;
  tagline: string;
  stack: string[];
  /** Posição entre os selecionados da Home (1..6) quando houver. */
  featured: number | null;
  /** URL pública localizada do case. */
  href: string;
  webgl: boolean;
  scroll: boolean;
  product: boolean;
  /** Turismo e guias (filtro próprio). */
  tourism: boolean;
  /** Selo do cartaz: cliente pagante, demonstração/proposta, projeto autoral. */
  kind: "client" | "demo" | "study";
  /** Chave do tipo criativo (para o rótulo de "missão" do cartaz). */
  kindKey: keyof Dictionary["displayType"];
  /** Status honesto já localizado ("Proposta comercial · demo"), quando existe. */
  status: string | null;
  /** Métrica/fato de destaque, já localizado. */
  metric: string | null;
  /** Luz do cartaz no mural ("r g b") e foco do recorte do hero — direção de arte (data/projects.ts › MOOD). */
  mood: string | null;
  focus: string | null;
};

export type OsService = { slug: string; label: string; sub: string; href: string };

/** Perfil profissional já localizado (data/profile.ts → payload.ts). */
export type OsProfile = {
  name: string;
  title: string;
  headline: string;
  studio: string;
  location: string;
  photo: { src: string; alt: string };
  links: { github: string; linkedin: string };
  cv: { href: string; download: string; lang: string };
  about: string;
  experience: { company: string; title: string; start: string | null; end: string | null; location: string; remote: boolean; independent: boolean; bullets: string[] }[];
  skills: { key: string; title: string; items: { name: string; featured: boolean; note: string | null }[] }[];
  projects: {
    slug: string;
    name: string;
    kind: string;
    status: "delivered" | "development" | "demo" | "live";
    image: string;
    imageAlt: string;
    problem: string;
    contribution: string;
    stack: string[];
    decision: string;
    evidence: { code: string; readme: string };
    code: { label: string; url: string }[];
    caseRoute: string | null;
    demo: string | null;
    video: { src: string; poster: string | null } | null;
  }[];
  /** Engenharia em prática: três recortes apontando para um projeto de `projects`. */
  showcase: { key: "backend" | "ai" | "motion"; label: string; project: string; contribution: string; decision: string; stack: string[] }[];
  education: { degree: string; school: string; start: string; end: string }[];
};

export type OsPayload = {
  locale: Locale;
  s: OsStrings;
  brand: { mark: string; name: string; tagline: string; headline: [string, string]; support: string[]; founder: string; role: string; index: string; origin: string };
  nav: { work: string; lab: string; studio: string; services: string; contact: string; profile: string; menu: string; close: string; primary: string; selectLanguage: string; langNames: Record<Locale, string>; sound: { label: string; on: string; off: string } };
  /** URLs públicas localizadas das raízes de cada app. */
  hrefs: { home: string; profile: string; projects: string; studio: string; lab: string; services: string; contact: string };
  /** Perfil profissional (app Perfil / rota /profile). */
  profile: OsProfile;
  projects: OsProject[];
  /** Redes do estúdio (data/social.ts). null = sem URL confirmada: o painel não aparece. */
  social: { linkedin: string | null; github: string | null; instagram: string | null };
  filters: Dictionary["archive"]["filters"];
  displayType: Record<string, string>;
  studio: {
    manifesto: string[];
    intro: string;
    beliefs: { eyebrow: string; items: { n: string; title: string; body: string }[] };
    process: { eyebrow: string; steps: { n: string; label: string; body: string }[] };
    founder: { eyebrow: string; body: string };
    cta: string;
  };
  services: {
    intro: string;
    items: OsService[];
    deliverables: { title: string; desc: string }[];
    waHref: string;
    diagnosticHref: string;
    diagnosticLabel: string;
  };
  contact: {
    title: string[];
    intro: string;
    location: string;
    email: string;
    whatsapp: string;
    waHref: string;
    /** "Falar no WhatsApp" — chamada da tela inicial do celular. */
    cta: string;
    linkedin: string;
    github: string;
    quote: {
      typeQuestion: string;
      statusQuestion: string;
      types: { key: string; label: string; phrase: string }[];
      statuses: { key: string; label: string; phrase: string }[];
      greeting: string;
      closing: string;
      joiner: string;
      fallback: string;
      previewLabel: string;
      send: string;
    };
  };
  /** Sobre (telefone): quem faz, com fatos já localizados; os canais vêm de `contact` e `social`. */
  about: { eyebrow: string; body: string; tagline: string; base: string; focus: string; stack: string[] };
  lab: {
    intro: string;
    madeWith: string;
    watchHint: string;
    clips: { title: string; desc: string; full: string; poster: string; tags: string[] }[];
    experiments: Dictionary["experiments"];
    waHref: string;
    ctaTitle: string;
    whatsapp: string;
  };
};
