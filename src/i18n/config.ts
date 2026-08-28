/** Idiomas do site. `pt` é o padrão e vive na raiz; `en` e `es` têm prefixo. */
export const LOCALES = ["pt", "en", "es"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "pt";

/** Prefixo público da URL por idioma ("" = raiz). */
export const PREFIX: Record<Locale, string> = { pt: "", en: "/en", es: "/es" };

/** Valor de <html lang> e das tags hreflang. */
export const HTML_LANG: Record<Locale, string> = { pt: "pt-BR", en: "en", es: "es" };
export const HREFLANG: Record<Locale, string> = HTML_LANG;

/** og:locale por idioma (es_419 = espanhol latino-americano). */
export const OG_LOCALE: Record<Locale, string> = { pt: "pt_BR", en: "en_US", es: "es_419" };

/** Cookie da preferência manual de idioma (1 ano). */
export const LOCALE_COOKIE = "milweb_locale";

export function isLocale(v: string | undefined | null): v is Locale {
  return v === "pt" || v === "en" || v === "es";
}
