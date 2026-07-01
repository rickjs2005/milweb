/**
 * i18n server-side (cookie). O locale é resolvido NO SERVIDOR a partir do
 * cookie `lang`; as Server Components renderizam só o idioma escolhido — assim
 * o content.ts fica fora do bundle do client e o HTML sai com 1 idioma só.
 * A troca de idioma (client) grava o cookie e faz router.refresh().
 */
import { cookies } from "next/headers";
import type { Locale, Localized } from "./content";

export const LOCALE_COOKIE = "lang";

/** Lê o locale do cookie (default = pt). Usar só em Server Components. */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return store.get(LOCALE_COOKIE)?.value === "en" ? "en" : "pt";
}

/** `<html lang>` correspondente ao locale. */
export function htmlLang(locale: Locale): string {
  return locale === "pt" ? "pt-BR" : "en";
}

/** Cria o resolvedor de texto bilíngue pro locale dado: t(localized) → string. */
export function makeT(locale: Locale) {
  return (v: Localized) => v[locale];
}
