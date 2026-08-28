import { DEFAULT_LOCALE, LOCALES, PREFIX, isLocale, type Locale } from "./config";
import { isProjectSlug } from "@/data/slugs";

/**
 * Rotas localizadas. A chave é o segmento INTERNO (a pasta em app/[lang]/…);
 * o valor é o segmento PÚBLICO por idioma. O middleware traduz público →
 * interno; `localizePath` faz o caminho inverso para links, canonical,
 * hreflang e sitemap. Uma única tabela, sem duplicar páginas.
 */
export const ROUTES = {
  work: { pt: "projetos", en: "work", es: "proyectos" },
  lab: { pt: "lab", en: "lab", es: "lab" },
  studio: { pt: "estudio", en: "studio", es: "estudio" },
  services: { pt: "servicos", en: "services", es: "servicios" },
  contact: { pt: "contato", en: "contact", es: "contacto" },
  diagnostico: { pt: "diagnostico", en: "business-audit", es: "diagnostico" },
  "criacao-de-sites": { pt: "criacao-de-sites", en: "website-development", es: "desarrollo-web" },
  "catalogo-whatsapp": { pt: "catalogo-whatsapp", en: "whatsapp-catalog", es: "catalogo-whatsapp" },
  "landing-pages": { pt: "landing-pages", en: "landing-pages", es: "landing-pages" },
  "loja-virtual": { pt: "loja-virtual", en: "online-store", es: "tienda-online" },
  "sistemas-sob-medida": { pt: "sistemas-sob-medida", en: "custom-systems", es: "sistemas-a-medida" },
} as const satisfies Record<string, Record<Locale, string>>;

export type RouteKey = keyof typeof ROUTES;

/** Segmento público → chave interna, por idioma (tabela invertida). */
const PUBLIC_TO_INTERNAL: Record<Locale, Record<string, RouteKey>> = { pt: {}, en: {}, es: {} };
for (const key of Object.keys(ROUTES) as RouteKey[]) {
  for (const l of LOCALES) PUBLIC_TO_INTERNAL[l][ROUTES[key][l]] = key;
}

/**
 * URLs antigas ou de outro idioma → chave interna. Qualquer segmento conhecido
 * (chave interna ou segmento público de qualquer idioma) que não seja o público
 * do idioma corrente redireciona 308 direto para a canônica — cobre as URLs já
 * publicadas (/work, /studio, /en/diagnostico…) e cruzamentos (/es/work, /es/projetos).
 */
const ANY_SEGMENT: Record<string, RouteKey> = {};
for (const key of Object.keys(ROUTES) as RouteKey[]) {
  ANY_SEGMENT[key] = key;
  for (const l of LOCALES) ANY_SEGMENT[ROUTES[key][l]] = key;
}
export const LEGACY_SEGMENTS: Record<Locale, Record<string, RouteKey>> = { pt: {}, en: {}, es: {} };
for (const l of LOCALES) for (const seg of Object.keys(ANY_SEGMENT)) if (!PUBLIC_TO_INTERNAL[l][seg]) LEGACY_SEGMENTS[l][seg] = ANY_SEGMENT[seg];

/** Caminho INTERNO (ex.: "/work/terral") → URL pública no idioma. */
export function localizePath(locale: Locale, internalPath: string): string {
  const clean = internalPath.replace(/^\/(pt|en|es)(?=\/|$)/, "") || "/";
  const [, first = "", ...rest] = clean.split("/");
  const key = first as RouteKey;
  const seg = first && (ROUTES as Record<string, Record<Locale, string>>)[key] ? ROUTES[key][locale] : first;
  const path = seg ? `/${[seg, ...rest].join("/")}` : "/";
  const prefixed = `${PREFIX[locale]}${path}`;
  return prefixed === "" ? "/" : prefixed.replace(/\/$/, "") || "/";
}

/** URL pública → { locale, internal }. `internal` sem prefixo ("/work/terral"). */
export function internalizePath(publicPath: string): { locale: Locale; internal: string; legacy?: boolean } {
  const parts = publicPath.split("/");
  let locale: Locale = DEFAULT_LOCALE;
  if (isLocale(parts[1]) && parts[1] !== "pt") {
    locale = parts[1];
    parts.splice(1, 1);
  }
  const first = parts[1] ?? "";
  if (!first) return { locale, internal: "/" };
  const key = PUBLIC_TO_INTERNAL[locale][first];
  if (key) return { locale, internal: `/${[key, ...parts.slice(2)].join("/")}` };
  const legacy = LEGACY_SEGMENTS[locale][first];
  if (legacy) return { locale, internal: `/${[legacy, ...parts.slice(2)].join("/")}`, legacy: true };
  return { locale, internal: `/${parts.slice(1).join("/")}` };
}

/** As três URLs equivalentes de um caminho interno (para hreflang e o seletor). */
export function alternatesOf(internalPath: string): Record<Locale, string> {
  return { pt: localizePath("pt", internalPath), en: localizePath("en", internalPath), es: localizePath("es", internalPath) };
}

/**
 * Caminho interno existe como rota? Tabela de rotas + slugs dos cases
 * (lista leve em data/slugs.ts). Usado pelo middleware para mandar URL
 * desconhecida ao catch-all já com status 404.
 */
export function isKnownInternalPath(internal: string): boolean {
  if (internal === "/") return true;
  const [, first = "", second, ...rest] = internal.split("/");
  if (!(first in ROUTES)) return false;
  if (first === "work") return second === undefined || (isProjectSlug(second) && rest.length === 0);
  return second === undefined;
}
