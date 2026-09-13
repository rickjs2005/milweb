import { BRAND } from "./brand";
import { ALL_SLUGS, FEATURED, PROJECT_INDEX, getProject } from "./projects";
import { SELECTED_WORK } from "./work";
import { getDict } from "@/i18n";
import type { Locale } from "@/i18n/config";
import type { Localized } from "@/lib/content";

/**
 * MilWeb System — a FONTE ÚNICA de identidade dos nós do site.
 *
 * Todo `MW/NNN` que aparece em qualquer página nasce aqui. Este módulo é
 * server-only: páginas e seções (server components) leem o registro e
 * estampam os rótulos no DOM como atributos (`nodeAttrs`); o provider do
 * cliente lê o DOM, nunca este arquivo. Assim o registro e os dicionários
 * ficam fora do bundle, como o resto do conteúdo do projeto.
 *
 * Regras:
 *  - Ids contíguos a partir de MW/001, na ordem da home; depois o arquivo.
 *  - O registro DERIVA dos dados dos projetos (título, rótulos técnicos já
 *    publicados) — não duplica texto.
 *  - `readout` é sempre um fato já publicado no site. Nada aqui é telemetria
 *    decorativa. Coordenadas só quando verificadas.
 *
 * Ver docs/superpowers/specs/2026-09-12-milweb-system-design.md.
 */

export type SystemNodeType = "system" | "project" | "capabilities" | "lab" | "interaction" | "human" | "technology" | "contact";

export type SystemNode = {
  /** "MW/003" — o id que aparece em tudo. */
  id: string;
  /** 3 — ordenação e formato curto "003". */
  index: number;
  /** Chave estável usada em `data-node`: "system", slug do projeto, "lab"… */
  key: string;
  type: SystemNodeType;
  /** Título curto em caixa alta, por idioma. */
  title: Localized;
  /** Leitura secundária — sempre um fato já publicado. */
  readout?: Localized;
  /** Só quando verificada. Nenhum projeto tem coordenada por enquanto. */
  coordinates?: { lat: number; lon: number };
  /** Caminho interno; localizar com `withLocale` no consumo. */
  route?: string;
  /** Chaves de nós relacionados — preenchido no sprint do grafo LAB ↔ cases. */
  related?: string[];
};

/** Atributos prontos para o DOM. O provider do cliente lê exatamente estes. */
export type NodeAttrs = {
  "data-node": string;
  "data-node-index": number;
  "data-node-key": string;
  "data-node-title": string;
  "data-node-readout"?: string;
};

const DICTS = { pt: getDict("pt"), en: getDict("en"), es: getDict("es") } as const;
const LOCALES = ["pt", "en", "es"] as const;

/** Monta um Localized a partir de uma leitura por idioma do dicionário. */
function fromDict(read: (d: (typeof DICTS)[Locale]) => string): Localized {
  return { pt: read(DICTS.pt), en: read(DICTS.en), es: read(DICTS.es) };
}

/** Chave de `work.labels` por slug — os rótulos técnicos já publicados dos seis da home. */
const LABEL_KEY: Record<string, keyof (typeof DICTS)["pt"]["work"]["labels"]> = {
  "kavita-drones": "kavita",
  terral: "terral",
  "atelier-vertex": "vertex",
  "aurex-timepieces": "aurex",
  inkvision: "inkvision",
  "logistics-demo": "logistics",
};

function projectNode(slug: string, index: number): SystemNode {
  const p = getProject(slug);
  if (!p) throw new Error(`milweb-system: projeto sem entrada: ${slug}`);
  const selected = SELECTED_WORK.find((w) => w.slug === slug);
  const title = selected ? { pt: selected.name, en: selected.name, es: selected.name } : { pt: p.title.toUpperCase(), en: p.title.toUpperCase(), es: p.title.toUpperCase() };
  const labelKey = LABEL_KEY[slug];
  const readout: Localized = labelKey
    ? fromDict((d) => d.work.labels[labelKey][0])
    : p.year
      ? { pt: String(p.year), en: String(p.year), es: String(p.year) }
      : fromDict((d) => d.displayType[p.displayType]);
  return { id: idOf(index), index, key: slug, type: "project", title, readout, route: `/work/${slug}` };
}

function idOf(index: number) {
  return `MW/${String(index).padStart(3, "0")}`;
}

/* ---- A ordem da home ------------------------------------------------- */

const HOME_AFTER_PROJECTS: Omit<SystemNode, "id" | "index">[] = [
  { key: "capabilities", type: "capabilities", title: fromDict((d) => d.capabilities.eyebrow) },
  { key: "lab", type: "lab", title: { pt: "LAB", en: "LAB", es: "LAB" }, readout: fromDict((d) => d.lab.tech), route: "/lab" },
  { key: "break", type: "interaction", title: { pt: "QUEBRA", en: "BREAK", es: "RUPTURA" }, readout: fromDict((d) => d.brk.trigger) },
  { key: "human", type: "human", title: { pt: "RICK", en: "RICK", es: "RICK" }, readout: { pt: BRAND.founderRole.pt.toUpperCase(), en: BRAND.founderRole.en.toUpperCase(), es: BRAND.founderRole.es.toUpperCase() }, route: "/studio" },
  { key: "built-with", type: "technology", title: fromDict((d) => d.builtWith.eyebrow), readout: { pt: BRAND.stack.slice(0, 3).join(" · ").toUpperCase(), en: BRAND.stack.slice(0, 3).join(" · ").toUpperCase(), es: BRAND.stack.slice(0, 3).join(" · ").toUpperCase() } },
  { key: "contact", type: "contact", title: fromDict((d) => d.contact.label), readout: { pt: "ABERTO A PROJETOS", en: "OPEN TO PROJECTS", es: "ABIERTO A PROYECTOS" }, route: "/contact" },
];

const ROOT: Omit<SystemNode, "id" | "index"> = {
  key: "system",
  type: "system",
  title: { pt: "SISTEMA", en: "SYSTEM", es: "SISTEMA" },
  readout: fromDict((d) => d.hero.support[2]),
  route: "/",
};

function build(): SystemNode[] {
  const nodes: SystemNode[] = [];
  let i = 1;
  nodes.push({ ...ROOT, id: idOf(i), index: i });
  for (const slug of FEATURED) nodes.push(projectNode(slug, ++i));
  for (const n of HOME_AFTER_PROJECTS) nodes.push({ ...n, id: idOf(++i), index: i });
  // Arquivo: os demais listados na ordem editorial, depois os ocultos (têm página, não têm número).
  for (const p of PROJECT_INDEX) if (!FEATURED.includes(p.slug)) nodes.push(projectNode(p.slug, ++i));
  for (const slug of ALL_SLUGS) if (!nodes.some((n) => n.key === slug)) nodes.push(projectNode(slug, ++i));
  return nodes;
}

export const SYSTEM_NODES: readonly SystemNode[] = build();
export const ROOT_NODE = SYSTEM_NODES[0];

const BY_KEY = new Map(SYSTEM_NODES.map((n) => [n.key, n]));

export function nodeOf(key: string): SystemNode {
  const n = BY_KEY.get(key);
  if (!n) throw new Error(`milweb-system: nó desconhecido: ${key}`);
  return n;
}

export const nodeOfProject = (slug: string) => nodeOf(slug);

/** Atributos para estampar um nó no DOM. */
export function nodeAttrs(node: SystemNode, locale: Locale): NodeAttrs {
  const attrs: NodeAttrs = {
    "data-node": node.id,
    "data-node-index": node.index,
    "data-node-key": node.key,
    "data-node-title": node.title[locale],
  };
  if (node.readout) attrs["data-node-readout"] = node.readout[locale];
  return attrs;
}


/* ---- Invariantes (falham no import, como em data/projects.ts) ---------- */
{
  const ids = new Set<string>();
  SYSTEM_NODES.forEach((n, i) => {
    if (n.index !== i + 1) throw new Error(`milweb-system: índice fora de sequência em ${n.key}`);
    if (ids.has(n.id)) throw new Error(`milweb-system: id duplicado ${n.id}`);
    ids.add(n.id);
    for (const l of LOCALES) if (!n.title[l]) throw new Error(`milweb-system: ${n.key} sem título em ${l}`);
  });
  for (const slug of ALL_SLUGS) if (!BY_KEY.has(slug)) throw new Error(`milweb-system: projeto sem nó: ${slug}`);
}
