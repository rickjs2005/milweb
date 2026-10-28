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
  /** 1..6 para os Selected Works da Home. */
  featuredOrder?: number;
  /** Turismo e guias (filtro "Turismo & guias" da pasta Projetos). */
  tourism: boolean;
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
  // turismo e guias (demos comerciais e conceitos de 2026)
  "debby-tour",
  "ace-diving-miami",
  "legends-of-hollywood-tours",
  "said-zanzibar",
  "mabrouk-zanzibar",
  "serengeti-wildlife-safaris",
  "as-copas",
  "age-of-dragons",
  "one-piece",
  "rockverse",
  "inkvision",
  "logistics-demo",
  "milsaca",
  "millead",
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

/**
 * Projetos autorais (fã-arte, jogo, estudo visual): saem do arquivo /projetos e do mural,
 * mas a página do case continua aberta e eles aparecem no app Lab (pedido do Rick, 28/10/2026).
 */
export const AUTORAIS = ["panico-de-estado", "atlas-politico", "akatsuki", "one-piece", "rockverse", "age-of-dragons", "as-copas", "imperio-cafe", "nexus-geek"];
const AUTORAL = new Set(AUTORAIS);

/** Os seis da Home, na ordem da galeria — também a ordem dos nós MW/002–007 (data/milweb-system.ts). */
export const FEATURED = ["kavita-drones", "terral", "atelier-vertex", "aurex-timepieces", "inkvision", "logistics-demo"];

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
  // o globo é Three.js, mas a peça é scrollytelling (esteira sticky, 72 frames em canvas, rota que se desenha)
  "logistics-demo": "SCROLL EXPERIENCE",
  milsaca: "DIGITAL PRODUCT",
  millead: "DIGITAL PRODUCT",
  // rolar é descer (controlador próprio) / três atos presos ao scroll
  "ace-diving-miami": "SCROLL EXPERIENCE",
  "serengeti-wildlife-safaris": "SCROLL EXPERIENCE",
  "mabrouk-zanzibar": "CLIENT WORK",
};

/**
 * Luz de cada cartaz do mural (rgb) e, quando o alto do hero não é o melhor recorte, o foco da
 * imagem. Direção de arte (não fato): sem entrada, o cartaz usa o grafite neutro.
 */
export const MOOD: Record<string, { rgb: string; focus?: string }> = {
  "kavita-drones": { rgb: "46 140 96" },
  "kavita-institucional": { rgb: "40 128 92" },
  terral: { rgb: "122 74 40" },
  "atelier-vertex": { rgb: "112 110 104" },
  "aurex-timepieces": { rgb: "128 136 150" },
  "aurex-motors": { rgb: "96 104 118" },
  "lumen-architecture": { rgb: "150 140 120" },
  "alva-odontologia": { rgb: "70 150 170" },
  "debby-tour": { rgb: "34 118 104", focus: "center 30%" },
  "ace-diving-miami": { rgb: "16 122 176", focus: "center 40%" },
  "legends-of-hollywood-tours": { rgb: "178 122 36", focus: "center 35%" },
  "said-zanzibar": { rgb: "16 152 146", focus: "center 30%" },
  "mabrouk-zanzibar": { rgb: "204 112 72", focus: "center 30%" },
  "serengeti-wildlife-safaris": { rgb: "192 122 52", focus: "center 35%" },
  "as-copas": { rgb: "40 120 70" },
  "age-of-dragons": { rgb: "150 60 30" },
  "one-piece": { rgb: "186 42 42" },
  rockverse: { rgb: "96 44 124" },
  inkvision: { rgb: "66 44 116" },
  "logistics-demo": { rgb: "204 92 40" },
  milsaca: { rgb: "40 110 150" },
  millead: { rgb: "60 120 110" },
  ecoa: { rgb: "60 130 80" },
  "loja-iphone": { rgb: "70 80 96" },
  "loja-de-iphone": { rgb: "80 88 100" },
  "ecommerce-do-agro": { rgb: "56 130 70" },
  akatsuki: { rgb: "160 32 44" },
  "loja-joias": { rgb: "166 130 70" },
  "nexus-geek": { rgb: "80 60 150" },
  rjjstore: { rgb: "60 90 140" },
  "rjs-laticinios": { rgb: "90 120 160" },
  "imperio-cafe": { rgb: "110 70 40" },
};

/** Kavita (drones e institucional): sem link externo nem botão de visita no OS — pedido do Rick (18/10/2026). O case continua aberto. */
export const NO_EXTERNAL = new Set(["kavita-drones", "kavita-institucional"]);

/** Turismo e guias — demos comerciais e conceitos (Melbourne, Miami, Los Angeles, Zanzibar, Tanzânia). */
export const TOURISM = new Set(["debby-tour", "ace-diving-miami", "legends-of-hollywood-tours", "said-zanzibar", "mabrouk-zanzibar", "serengeti-wildlife-safaris"]);

/** Anos confirmados (brief do Rick, 28/08/2026; demos de turismo: repositórios e READMEs de set–out/2026). */
const YEAR: Record<string, number> = {
  "kavita-drones": 2026,
  "debby-tour": 2026,
  "ace-diving-miami": 2026,
  "legends-of-hollywood-tours": 2026,
  "said-zanzibar": 2026,
  "mabrouk-zanzibar": 2026,
  "serengeti-wildlife-safaris": 2026,
};

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
const isListed = (p: Project) => !p.hideFromLists && !AUTORAL.has(p.slug);
const listed = [...ORDER.filter((s) => bySlug.has(s) && isListed(bySlug.get(s)!)), ...PROJECTS.filter((p) => !ORDER.includes(p.slug) && isListed(p)).map((p) => p.slug)];

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
    tourism: TOURISM.has(slug),
    prevSlug: listed[(i - 1 + listed.length) % listed.length],
    nextSlug: listed[(i + 1) % listed.length],
  };
});

export const TOTAL = PROJECT_INDEX.length;
export const TOTAL_LABEL = String(TOTAL).padStart(2, "0");

/** Os seis da Home, em ordem de featuredOrder. */
export const SELECTED = FEATURED.map((s) => PROJECT_INDEX.find((p) => p.slug === s)!).filter(Boolean);

/** Case por slug — inclui projetos ocultos (página existe, mas sem número). */
export function getProject(slug: string): ProjectEntry | undefined {
  const listedEntry = PROJECT_INDEX.find((p) => p.slug === slug);
  if (listedEntry) return listedEntry;
  const p = bySlug.get(slug);
  if (!p) return undefined;
  return { ...p, order: 0, n: "—", displayType: inferDisplay(p), tourism: TOURISM.has(slug), prevSlug: listed[listed.length - 1], nextSlug: listed[0] };
}

/** Os autorais do Lab, na ordem de AUTORAIS (sem número: n = "—"). */
export const AUTORAL_INDEX: ProjectEntry[] = AUTORAIS.map((s) => getProject(s)).filter((p): p is ProjectEntry => !!p);

/** Todos os slugs com página (listados + ocultos) — para generateStaticParams. */
export const ALL_SLUGS = PROJECTS.map((p) => p.slug);

// data/slugs.ts é a cópia leve usada pelo middleware; divergência derruba o build.
{
  const a = [...ALL_SLUGS].sort().join(",");
  const b = [...PROJECT_SLUGS].sort().join(",");
  if (a !== b) throw new Error(`data/slugs.ts desatualizado — esperado: ${a}`);
}
