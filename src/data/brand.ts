import type { Localized } from "@/lib/content";

/**
 * Copy da marca (Home + navegação + páginas de experiência).
 * A MilWeb fala pouco e forte. EN é a língua-mãe da experiência; PT
 * acompanha com a mesma força, sem tradução literal.
 */
export const BRAND = {
  name: "MILWEB",
  mark: "MILWEB®",
  tagline: { pt: "Creative Development Studio", en: "Creative Development Studio" } as Localized,
  origin: { pt: "Brasil — 2026", en: "Brazil — 2026" } as Localized,
  index: "MW / 2026",
  founder: "RICK JANUARIO",
  founderRole: { pt: "Founder / Creative Developer", en: "Founder / Creative Developer" } as Localized,
};

export const NAV = {
  work: { pt: "Work", en: "Work" },
  lab: { pt: "Lab", en: "Lab" },
  studio: { pt: "Studio", en: "Studio" },
  contact: { pt: "Contact", en: "Contact" },
  menu: { pt: "Menu", en: "Menu" },
  close: { pt: "Fechar", en: "Close" },
  services: { pt: "Serviços", en: "Services" },
} satisfies Record<string, Localized>;

export const HOME = {
  boot: {
    lines: [
      "initializing experience",
      "loading structure",
      "loading motion",
      "loading interaction",
    ],
    skip: { pt: "pular", en: "skip" } as Localized,
  },
  hero: {
    stages: ["STRUCTURE", "DESIGN", "MOTION", "INTERACTION", "EXPERIENCE", "SHIP"],
    headline: ["CODE SHOULD", "MOVE PEOPLE."],
    support: [
      { pt: "Creative Development", en: "Creative Development" },
      { pt: "Experiências digitais", en: "Digital Experiences" },
      { pt: "Brasil — Mundo", en: "Brazil — Worldwide" },
    ] as Localized[],
    inspect: { pt: "Segure para inspecionar", en: "Hold to inspect" } as Localized,
    scroll: { pt: "Role para construir", en: "Scroll to build" } as Localized,
  },
  work: {
    eyebrow: { pt: "Trabalhos selecionados", en: "Selected work" } as Localized,
    enter: { pt: "Entrar na experiência", en: "Enter experience" } as Localized,
    all: { pt: "Todos os projetos", en: "All work" } as Localized,
  },
  capabilities: {
    eyebrow: { pt: "Capacidades", en: "Capabilities" } as Localized,
    items: [
      { n: "01", label: { pt: "Experiências digitais", en: "Digital Experiences" }, react: "depth" },
      { n: "02", label: { pt: "Creative Development", en: "Creative Development" }, react: "structure" },
      { n: "03", label: { pt: "WebGL & 3D", en: "WebGL & 3D" }, react: "perspective" },
      { n: "04", label: { pt: "Sistemas de motion", en: "Motion Systems" }, react: "type" },
      { n: "05", label: { pt: "Produtos digitais", en: "Digital Products" }, react: "grid" },
    ] as { n: string; label: Localized; react: "depth" | "structure" | "perspective" | "type" | "grid" }[],
  },
  lab: {
    eyebrow: "LAB / 001",
    title: "EVENT HORIZON",
    body: {
      pt: "Experimentos com shaders, física e gráficos procedurais. Cada um assume a interface por um instante.",
      en: "Experiments in shaders, physics and procedural graphics. Each one takes over the interface for a moment.",
    } as Localized,
    enter: { pt: "Entrar no Lab", en: "Enter the Lab" } as Localized,
  },
  brk: {
    trigger: { pt: "DO NOT PRESS", en: "DO NOT PRESS" } as Localized,
    headline: ["YOU BROKE", "THE INTERNET."],
    sub: { pt: "Rick can fix it.", en: "Rick can fix it." } as Localized,
    rebuild: { pt: "Rebuild", en: "Rebuild" } as Localized,
  },
  human: {
    headline: ["BEHIND", "ALL THIS", "CODE"],
    tail: "IS A HUMAN.",
    location: { pt: "MilWeb — Brasil", en: "MilWeb — Brazil" } as Localized,
  },
  builtWith: {
    eyebrow: { pt: "Feito com", en: "Built with" } as Localized,
    big: ["IDEAS", "CODE", "MOTION", "TOO MUCH COFFEE"],
    stack: ["Next.js", "React", "TypeScript", "GSAP", "Three.js", "WebGL"],
  },
  contact: {
    headline: ["HAVE SOMETHING", "WORTH BUILDING?"],
    cta: { pt: "Start a project", en: "Start a project" } as Localized,
    email: { pt: "E-mail", en: "Email" } as Localized,
    whatsapp: "WhatsApp",
  },
} as const;
