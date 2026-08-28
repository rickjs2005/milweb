/**
 * i18n server-side pelo SEGMENTO da rota (app/[lang]/...).
 *
 * O locale é parâmetro de rota (não cookie lido no servidor), então as três
 * versões saem prontas do build e são servidas da CDN. As URLs públicas são
 * localizadas pela tabela em src/i18n/routing.ts; o middleware traduz o
 * segmento público para a pasta interna e vice-versa.
 */
import type { Locale, Localized } from "./content";
import { notFound } from "next/navigation";
import { DEFAULT_LOCALE, HTML_LANG, LOCALES, isLocale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";

export type { Locale, Localized };
export { LOCALES };

/** Params de todas as rotas sob app/[lang]. */
export type LangParams = { lang: string };

/** Converte o parâmetro cru da rota em Locale (qualquer coisa inválida = pt). */
export function normalizeLocale(lang: string | undefined): Locale {
  return isLocale(lang) ? lang : DEFAULT_LOCALE;
}

/**
 * Lê o locale dos params da rota. Usar em page/layout sob app/[lang].
 * Segmento inválido (o middleware nunca gera um, mas /_next e afins podem
 * bater direto) é 404 duro — nunca renderiza a árvore com locale inventado.
 */
export async function localeFrom(params: Promise<LangParams>): Promise<Locale> {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return lang;
}

/** `<html lang>` correspondente ao locale. */
export function htmlLang(locale: Locale): string {
  return HTML_LANG[locale];
}

/** Cria o resolvedor de texto localizado: t(localized) → string. */
export function makeT(locale: Locale) {
  return (v: Localized) => v[locale];
}

/**
 * Caminho INTERNO ("/work/terral", "/services") → URL pública localizada
 * ("/projetos/terral", "/en/work/terral", "/es/proyectos/terral").
 */
export function withLocale(locale: Locale, path: string): string {
  return localizePath(locale, path);
}

