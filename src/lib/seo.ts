import type { Metadata } from "next";
import { SITE_URL } from "./content";
import { HREFLANG, OG_LOCALE, type Locale } from "@/i18n/config";
import { alternatesOf, localizePath } from "@/i18n/routing";
import { SHARE_COVER } from "./share-cover";

/** A capa de compartilhamento do idioma (arquivo estático em public/og, gerado por scripts/og-cover.mjs). */
export function shareCover(locale: Locale) {
  return { url: `${SITE_URL}${SHARE_COVER.path(locale)}`, width: SHARE_COVER.width, height: SHARE_COVER.height, type: SHARE_COVER.type, alt: SHARE_COVER.text[locale].alt };
}

/**
 * Metadata de uma página em qualquer idioma a partir do caminho INTERNO
 * ("/work/terral"): canonical na URL pública do idioma atual, hreflang das
 * três versões equivalentes + x-default apontando para o PT (raiz),
 * og:locale correto, og:url absoluta e a capa de compartilhamento do idioma
 * (URL absoluta, dimensões, tipo e texto alternativo) no Open Graph e no
 * Twitter Card. Vai aqui, e não só no layout, porque o Next NÃO funde o
 * objeto `openGraph` entre segmentos — a página que o redefine perderia a
 * imagem. Uma rota com opengraph-image.tsx próprio (os cases) continua
 * mandando: o arquivo tem prioridade sobre este objeto.
 */
export function pageMetadata({
  locale,
  internalPath,
  title,
  description,
  type = "website",
  cover = true,
}: {
  locale: Locale;
  internalPath: string;
  title: string;
  description: string;
  type?: "website" | "article";
  /**
   * false = a rota tem opengraph-image.tsx / twitter-image.tsx próprios (os cases): o Next NÃO deixa
   * o arquivo vencer uma `images` declarada no mesmo segmento, então aqui ela fica de fora.
   */
  cover?: boolean;
}): Metadata {
  const alt = alternatesOf(internalPath);
  const canonical = localizePath(locale, internalPath);
  const img = cover ? shareCover(locale) : null;
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: { [HREFLANG.pt]: alt.pt, [HREFLANG.en]: alt.en, [HREFLANG.es]: alt.es, "x-default": alt.pt },
    },
    openGraph: { type, locale: OG_LOCALE[locale], url: `${SITE_URL}${canonical === "/" ? "" : canonical}`, siteName: "MilWeb", title, description, ...(img ? { images: [img] } : {}) },
    twitter: { card: "summary_large_image", title, description, ...(img ? { images: [{ url: img.url, alt: img.alt, width: img.width, height: img.height }] } : {}) },
  };
}

/** URL absoluta pública de um caminho interno num idioma. */
export function absoluteUrl(locale: Locale, internalPath: string): string {
  const p = localizePath(locale, internalPath);
  return `${SITE_URL}${p === "/" ? "" : p}`;
}
