import type { Metadata } from "next";
import { SITE_URL } from "./content";
import { HREFLANG, OG_LOCALE, type Locale } from "@/i18n/config";
import { alternatesOf, localizePath } from "@/i18n/routing";

/**
 * Metadata de uma página em qualquer idioma a partir do caminho INTERNO
 * ("/work/terral"): canonical na URL pública do idioma atual, hreflang das
 * três versões equivalentes + x-default apontando para o PT (raiz),
 * og:locale correto e og:url absoluta.
 */
export function pageMetadata({
  locale,
  internalPath,
  title,
  description,
  type = "website",
}: {
  locale: Locale;
  internalPath: string;
  title: string;
  description: string;
  type?: "website" | "article";
}): Metadata {
  const alt = alternatesOf(internalPath);
  const canonical = localizePath(locale, internalPath);
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: { [HREFLANG.pt]: alt.pt, [HREFLANG.en]: alt.en, [HREFLANG.es]: alt.es, "x-default": alt.pt },
    },
    openGraph: { type, locale: OG_LOCALE[locale], url: `${SITE_URL}${canonical === "/" ? "" : canonical}`, siteName: "MilWeb", title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}

/** URL absoluta pública de um caminho interno num idioma. */
export function absoluteUrl(locale: Locale, internalPath: string): string {
  const p = localizePath(locale, internalPath);
  return `${SITE_URL}${p === "/" ? "" : p}`;
}
