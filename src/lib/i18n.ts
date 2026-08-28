/**
 * i18n server-side pelo SEGMENTO da rota (app/[lang]/...).
 *
 * O locale vinha de um cookie lido com `cookies()`. Funcionava, mas cookie é
 * API dinâmica: bastava lê-lo para a página inteira deixar de ser
 * pré-renderizável, e o site todo virava SSR por request (os números estão
 * na nota longa em src/lib/csp.ts). Como parâmetro de rota, o mesmo conteúdo
 * sai pronto do build nos dois idiomas.
 *
 * As Server Components continuam renderizando um idioma só — o content.ts
 * fica fora do bundle do client e o HTML sai monolíngue.
 */
import type { Locale, Localized } from "./content";
export type { Locale, Localized };

/** Os dois idiomas viram os dois valores possíveis de [lang]. */
export const LOCALES = ["pt", "en"] as const;

/** Params de todas as rotas sob app/[lang]. */
export type LangParams = { lang: string };

/** Converte o parâmetro cru da rota em Locale (qualquer coisa != "en" = pt). */
function normalizeLocale(lang: string | undefined): Locale {
  return lang === "en" ? "en" : "pt";
}

/** Lê o locale dos params da rota. Usar em page/layout sob app/[lang]. */
export async function localeFrom(params: Promise<LangParams>): Promise<Locale> {
  return normalizeLocale((await params).lang);
}

/** `<html lang>` correspondente ao locale. */
export function htmlLang(locale: Locale): string {
  return locale === "pt" ? "pt-BR" : "en";
}

/** Cria o resolvedor de texto bilíngue pro locale dado: t(localized) → string. */
export function makeT(locale: Locale) {
  return (v: Localized) => v[locale];
}

/** Prefixa um path interno com o locale da URL (en → /en/..., pt → sem prefixo). */
export function withLocale(locale: Locale, path: string): string {
  if (locale !== "en") return path;
  return path === "/" ? "/en" : `/en${path}`;
}
