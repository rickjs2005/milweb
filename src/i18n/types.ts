/**
 * Contrato do dicionário de interface. Os três idiomas implementam o MESMO
 * tipo — chave faltando ou sobrando é erro de TypeScript (e de build).
 */
export type Dictionary = {
  meta: { langName: string; selectLanguage: string; siteTitle: string; siteDescription: string };
  nav: { work: string; lab: string; studio: string; services: string; contact: string; menu: string; close: string; primary: string };
  acts: { build: string; work: string; capabilities: string; lab: string; brk: string; human: string; builtWith: string; contact: string };
  boot: { tagline: string; origin: string; lines: [string, string, string, string]; skip: string; compile: string };
  hero: {
    headline: [string, string];
    /** Qual glifo da manchete vira o globo: índice da linha e do caractere DENTRO dela.
     *  Sempre o "O" que fecha a palavra do mundo — perto do FIM da linha, para o
     *  globo nascer ali e migrar pouco: PT "O MUNDO." (1,6) · EN "THE WORLD." (1,5)
     *  · ES "EL MUNDO." (1,7). É dado de idioma, não de layout. */
    orb: [number, number];
    stages: [string, string, string, string, string, string];
    support: [string, string, string];
    inspect: string; scroll: string; sub: string; cta: string;
  };
  inspect: { title: string; dev: string };
  work: {
    eyebrow: string;
    enter: string;
    all: string;
    clientWork: string;
    labels: { kavita: [string, string, string]; terral: [string, string, string]; vertex: [string, string, string, string, string]; aurex: [string, string, string]; inkvision: [string, string, string]; logistics: [string, string] };
    /** As sete etapas da jornada do Logistics Demo (nome · modal), na ordem do percurso. */
    stages: { logistics: [string, string, string, string, string, string, string] };
  };
  displayType: { "CLIENT WORK": string; "SCROLL EXPERIENCE": string; "WEBGL EXPERIENCE": string; "INTERACTIVE COMMERCE": string; "DIGITAL PRODUCT": string; "CREATIVE DEVELOPMENT": string; EXPERIMENTAL: string };
  capabilities: { eyebrow: string; items: [string, string, string, string, string]; react: { depth: string; structure: string; perspective: string; type: string; grid: string } };
  lab: { eyebrow: string; title: string; enter: string; tech: string; pageTitle: [string, string]; experiments: string };
  brk: { title: [string, string]; trigger: string; headline: [string, string]; sub: string; rebuild: string; pieces: [string, string, string, string, string] };
  human: { headline: [string, string, string]; tail: string };
  builtWith: { eyebrow: string; big: [string, string, string, string] };
  contact: { headline: [string, string]; cta: string; ctaWord: string; email: string; label: string };
  archive: { label: string; title: [string, string]; filters: { all: string; client: string; scroll: string; webgl: string; product: string }; columns: { index: string; project: string; type: string; year: string; studio: string } };
  caseUi: {
    project: string; idea: string; experience: string; hood: string; details: string; result: string; screens: string; next: string;
    client: string; studio: string; type: string; year: string; status: string; live: string; visit: string; code: string; builtWith: string; allWork: string; expand: string; similar: string; screen: string;
    heroAlt: string; day: string; scrollReverse: string; hold: string; holding: string; held: string; again: string; heldMessage: string; explode: string;
    parts: [string, string, string, string, string, string, string, string, string, string];
  };
  pages: { studio: string; services: string; contact: string; diagnostic: string; diagnosticSteps: string; serviceContact: string; serviceIncluded: string; serviceHow: string; whatsapp: string };
  errors: { notFound: [string, string]; broke: [string, string]; err404: string; err500: string };
  sound: { label: string; on: string; off: string };
  experiments: {
    eyebrow: string;
    intro: string;
    close: string;
    running: string;
    unsupported: string;
    items: { id: "tear" | "gravity" | "time"; name: string; desc: string; hint: string }[];
    /** Textos DENTRO do palco (canvas/DOM dos experimentos) — nada em inglês decorativo. */
    stage: { under: string; title: string; surfaceLabel: string; surface: string; tension: string; idle: string; words: string[]; timeWords: [string, string, string, string, string] };
  };
  footer: { email: string; year: string };
  preferred: { eyebrow: string; title: [string, string]; cta: string; loading: string; retry: string; aria: string };
};
