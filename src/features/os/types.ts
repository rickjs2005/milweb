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
};

export type OsService = { slug: string; label: string; sub: string; href: string };

export type OsPayload = {
  locale: Locale;
  s: OsStrings;
  brand: { mark: string; name: string; tagline: string; headline: [string, string]; support: string[]; founder: string; role: string; index: string; origin: string };
  nav: { work: string; lab: string; studio: string; services: string; contact: string; menu: string; close: string; primary: string; selectLanguage: string; langNames: Record<Locale, string>; sound: { label: string; on: string; off: string } };
  /** URLs públicas localizadas das raízes de cada app. */
  hrefs: { home: string; projects: string; studio: string; lab: string; services: string; contact: string };
  projects: OsProject[];
  /** Slugs dos atalhos da área de trabalho (ordem). */
  shortcuts: string[];
  /** Slugs dos destaques (ordem da Home). */
  featured: string[];
  filters: { all: string; client: string; scroll: string; webgl: string; product: string };
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
