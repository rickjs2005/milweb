import type { Localized } from "@/lib/content";

/**
 * Identidade fixa da marca. Todo texto de interface mora nos dicionários
 * tipados em src/i18n/{pt,en,es}.ts — aqui só o que é invariável ou
 * descritivo da própria marca.
 */
export const BRAND = {
  name: "MILWEB",
  mark: "MILWEB®",
  tagline: { pt: "Estúdio de desenvolvimento criativo", en: "Creative development studio", es: "Estudio de desarrollo creativo" } as Localized,
  origin: { pt: "Brasil — 2026", en: "Brazil — 2026", es: "Brasil — 2026" } as Localized,
  index: "MW / 2026",
  founder: "RICK JANUARIO",
  founderRole: { pt: "Fundador / Desenvolvedor criativo", en: "Founder / Creative developer", es: "Fundador / Desarrollador creativo" } as Localized,
  location: { pt: "MilWeb — Brasil", en: "MilWeb — Brazil", es: "MilWeb — Brasil" } as Localized,
  labBody: {
    pt: "Experimentos com shaders, física e gráficos procedurais. Cada um assume a interface por um instante.",
    en: "Experiments in shaders, physics and procedural graphics. Each one takes over the interface for a moment.",
    es: "Experimentos con shaders, física y gráficos procedurales. Cada uno toma la interfaz por un instante.",
  } as Localized,
  stack: ["Next.js", "React", "TypeScript", "GSAP", "Three.js", "WebGL"],
};
