import { PROJECTS, type Project } from "@/lib/content";
import { PROJECT_SLUGS } from "./slugs";

/**
 * FONTE ÚNICA de ordem, numeração e taxonomia de exibição dos projetos.
 *
 * `content.ts` continua dono dos TEXTOS (problem/result/narrative/gallery) e
 * da taxonomia comercial (`category` = businessType, usada em /services e no
 * MilLead). Aqui mora tudo que diz respeito a COMO o portfólio apresenta:
 * ordem do arquivo, número do case, total (derivado — nunca hardcoded),
 * displayType criativo, ano quando conhecido, e a cadeia prev/next.
 */
export type DisplayType =
  | "CLIENT WORK"
  | "SCROLL EXPERIENCE"
  | "WEBGL EXPERIENCE"
  | "INTERACTIVE COMMERCE"
  | "DIGITAL PRODUCT"
  | "CREATIVE DEVELOPMENT"
  | "EXPERIMENTAL";

export type ProjectEntry = Project & {
  /** Posição no arquivo (1-based). */
  order: number;
  /** "01".."24" — só projetos listados recebem número. */
  n: string;
  displayType: DisplayType;
  /** Só quando o fato é conhecido — nunca inventado. */
  year?: number;
  /** 1..4 para os Selected Works da Home. */
  featuredOrder?: number;
  prevSlug: string;
  nextSlug: string;
};

/** Ordem editorial do arquivo: os 4 selecionados abrem (a cadeia next segue a narrativa da Home), depois cliente e autorais por força visual. */
const ORDER = [
  "kavita-drones",
  "terral",
  "atelier-vertex",
  "aurex-timepieces",
  "kavita-institucional",
  "aurex-motors",
  "lumen-architecture",
  "alva-odontologia",
  "as-copas",
  "age-of-dragons",
  "one-piece",
  "rockverse",
  "inkvision",
  "milsaca",
  "ecoa",
  "loja-iphone",
  "loja-de-iphone",
  "ecommerce-do-agro",
  "akatsuki",
  "loja-joias",
  "nexus-geek",
  "rjjstore",
  "rjs-laticinios",
  "imperio-cafe",
];

const FEATURED = ["kavita-drones", "terral", "atelier-vertex", "aurex-timepieces", "inkvision"];

/** displayType explícito para os casos em que a categoria comercial não descreve o trabalho. */
const DISPLAY: Record<string, DisplayType> = {
  "kavita-drones": "INTERACTIVE COMMERCE",
  "kavita-institucional": "CLIENT WORK",
  terral: "SCROLL EXPERIENCE",
  "atelier-vertex": "SCROLL EXPERIENCE",
  "aurex-timepieces": "WEBGL EXPERIENCE",
  "aurex-motors": "WEBGL EXPERIENCE",
  "as-copas": "WEBGL EXPERIENCE",
  "lumen-architecture": "WEBGL EXPERIENCE",
  milsaca: "DIGITAL PRODUCT",
  millead: "DIGITAL PRODUCT",
};

/** Anos confirmados (brief do Rick, 28/08/2026). */
const YEAR: Record<string, number> = { "kavita-drones": 2026 };

function inferDisplay(p: Project): DisplayType {
  if (DISPLAY[p.slug]) return DISPLAY[p.slug];
  const webgl = p.stack.some((s) => /three|r3f|webgl|glsl|fiber/i.test(s));
  if (webgl) return "WEBGL EXPERIENCE";
  switch (p.category) {
    case "sistema-saas":
      return "DIGITAL PRODUCT";
    case "landing-premium":
      return "SCROLL EXPERIENCE";
    case "institucional-premium":
      return "CREATIVE DEVELOPMENT";
    default:
      return p.clientWork ? "CLIENT WORK" : "CREATIVE DEVELOPMENT";
  }
}

const bySlug = new Map(PROJECTS.map((p) => [p.slug, p]));
const listed = [...ORDER.filter((s) => bySlug.has(s) && !bySlug.get(s)!.hideFromLists), ...PROJECTS.filter((p) => !ORDER.includes(p.slug) && !p.hideFromLists).map((p) => p.slug)];

/** Todos os projetos listados, na ordem do arquivo. TOTAL = length. */
export const PROJECT_INDEX: ProjectEntry[] = listed.map((slug, i) => {
  const p = bySlug.get(slug)!;
  return {
    ...p,
    order: i + 1,
    n: String(i + 1).padStart(2, "0"),
    displayType: inferDisplay(p),
    year: YEAR[slug],
    featuredOrder: FEATURED.includes(slug) ? FEATURED.indexOf(slug) + 1 : undefined,
    prevSlug: listed[(i - 1 + listed.length) % listed.length],
    nextSlug: listed[(i + 1) % listed.length],
  };
});

export const TOTAL = PROJECT_INDEX.length;
export const TOTAL_LABEL = String(TOTAL).padStart(2, "0");

/** Os quatro da Home, em ordem de featuredOrder. */
export const SELECTED = FEATURED.map((s) => PROJECT_INDEX.find((p) => p.slug === s)!).filter(Boolean);

/** Case por slug — inclui projetos ocultos (página existe, mas sem número). */
export function getProject(slug: string): ProjectEntry | undefined {
  const listedEntry = PROJECT_INDEX.find((p) => p.slug === slug);
  if (listedEntry) return listedEntry;
  const p = bySlug.get(slug);
  if (!p) return undefined;
  return { ...p, order: 0, n: "—", displayType: inferDisplay(p), prevSlug: listed[listed.length - 1], nextSlug: listed[0] };
}

/** Todos os slugs com página (listados + ocultos) — para generateStaticParams. */
export const ALL_SLUGS = PROJECTS.map((p) => p.slug);

// data/slugs.ts é a cópia leve usada pelo middleware; divergência derruba o build.
{
  const a = [...ALL_SLUGS].sort().join(",");
  const b = [...PROJECT_SLUGS].sort().join(",");
  if (a !== b) throw new Error(`data/slugs.ts desatualizado — esperado: ${a}`);
}
