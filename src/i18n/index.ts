import { pt } from "./pt";
import { en } from "./en";
import { es } from "./es";
import type { Dictionary } from "./types";
import type { Locale } from "./config";

const DICTS: Record<Locale, Dictionary> = { pt, en, es };

/** Dicionário de interface do idioma. Tipado — nenhuma chave pode faltar. */
export function getDict(locale: Locale): Dictionary {
  return DICTS[locale];
}

export type { Dictionary } from "./types";
export * from "./config";
export * from "./routing";
