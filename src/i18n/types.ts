/**
 * Contrato do dicionário de interface. Os três idiomas implementam o MESMO
 * tipo — chave faltando ou sobrando é erro de TypeScript (e de build).
 */
export type Dictionary = {
  meta: { langName: string; selectLanguage: string; siteTitle: string; siteDescription: string };
  nav: { work: string; lab: string; studio: string; services: string; contact: string; profile: string; menu: string; close: string; primary: string };
  /** Leituras reais do dispositivo mostradas pela HUD do MilWeb System no nó raiz. */
  system: { fine: string; coarse: string; reduce: string; sound: string };
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
  archive: { label: string; title: [string, string]; filters: { all: string; client: string; demo: string; tourism: string; experiment: string; scroll: string; webgl: string; product: string }; columns: { index: string; project: string; type: string; year: string; studio: string } };
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
  /** MilWeb OS — camada de apresentação em janelas (desktop) e tela inicial (celular). */
  os: {
    apps: { profile: string; projects: string; studio: string; lab: string; services: string; about: string; contact: string; settings: string; search: string };
    regions: { desktop: string; icons: string; dock: string; topbar: string; windows: string; home: string; appGrid: string };
    window: { minimize: string; maximize: string; restore: string; close: string; keys: string; resize: string; running: string; focused: string };
    mobile: { back: string; home: string; open: string; apps: string; message: string };
    /** App Sobre (só no telefone): rótulos dos fatos do fundador. */
    about: { base: string; focus: string };
    /** Assinatura do wallpaper: "MILWEB® · craft · origin" e o lema (h1 da raiz). */
    sign: { craft: string; origin: string; motto: string };
    projects: {
      back: string; open: string; visit: string; code: string; stack: string; context: string; done: string; solutions: string; gallery: string; result: string;
      similar: string; next: string; prev: string; client: string; demo: string; study: string; live: string; detail: string; idea: string; experience: string;
      numbers: string; kind: string; year: string; status: string; of: string; count: string; empty: string; interactive: string;
      /** Mural de cartazes (THE BOUNTY COLLECTION): faixa do cartaz, selo por tipo, navegação e dossiê. */
      dossier: string; rank: string; collection: string; missions: string; wall: string; position: string; hint: string; swipe: string; viewAll: string; backToCollection: string;
      tier: { wanted: string; most: string; special: string };
      seal: { client: string; demo: string; experiment: string; webgl: string; product: string };
    };
    search: { title: string; placeholder: string; empty: string; hint: string; apps: string; projects: string; services: string; open: string };
    settings: {
      /** Tema: as duas identidades (Gojo claro, Obito escuro), o rótulo do interruptor da dock e o nome curto sob o ícone no telefone. */
      theme: string; gojo: string; obito: string; themeSwitch: string; themeShort: string; motion: string; motionSystem: string; motionReduce: string; mode: string; modeOs: string; modeSimple: string;
      language: string; sound: string; reset: string; about: string; saved: string;
    };
    simple: { title: string; toOs: string; skip: string; nav: string };
    /** App Perfil: rótulos de seções, ações e estados (o conteúdo mora em data/profile.ts). */
    profile: {
      eyebrow: string; about: string; experience: string; skills: string; projects: string; education: string;
      viewCv: string; downloadCv: string; contact: string; present: string; remote: string; independent: string; noDates: string;
      problem: string; contribution: string; stack: string; decision: string; details: string; evidenceCode: string; evidenceReadme: string;
      code: string; demo: string; caseLink: string; noDemo: string; status: { delivered: string; development: string; demo: string; live: string };
      studioLink: string; projectsLink: string; opensNewTab: string;
      showcase: string; tracks: string; more: string; readMore: string; readLess: string; sections: string; intro: string; projectsShort: string;
      playDemo: string; pauseDemo: string; closeDemo: string; realCapture: string;
    };
    /** Tela de carregamento do OS: a frase enquanto a home se prepara e o rodapé (o segundo item do rodapé vem de sign.origin). */
    boot: { preparing: string; studio: string };
    contact: { channels: string; lead: string; whatsapp: string; email: string; linkedin: string; github: string };
    /** Painéis das redes na área de trabalho: rótulo do grupo, microtexto por rede e a nota de nova aba. */
    social: { label: string; linkedin: string; github: string; instagram: string; external: string };
    lab: { films: string; experiments: string; watch: string };
    services: { all: string; talk: string; audit: string; deliverables: string };
    studio: { principles: string; process: string; founder: string };
    time: string;
  };
};
