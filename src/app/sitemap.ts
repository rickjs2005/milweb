import type { MetadataRoute } from "next";
import { PROJECTS, SITE_URL } from "@/lib/content";
import { SERVICES } from "@/lib/services";
import { HREFLANG, LOCALES, type Locale } from "@/i18n/config";
import { alternatesOf } from "@/i18n/routing";

/**
 * Sitemap trilíngue: cada URL (PT, EN, ES) declara as três alternativas
 * + x-default (= PT). URLs públicas vêm da tabela de rotas (localizePath).
 *
 * Sem `lastModified`: era `new Date()` do build e todas as URLs juravam ter
 * mudado a cada deploy. Melhor omitir do que mentir.
 */
const STEP: Record<Locale, number> = { pt: 0, en: 0.1, es: 0.1 };

export default function sitemap(): MetadataRoute.Sitemap {
  const entry = (internal: string, priority: number): MetadataRoute.Sitemap[number][] => {
    const alts = alternatesOf(internal);
    const languages: Record<string, string> = {};
    for (const l of LOCALES) languages[HREFLANG[l]] = `${SITE_URL}${alts[l]}`;
    languages["x-default"] = `${SITE_URL}${alts.pt}`;
    return LOCALES.map((l) => ({
      url: `${SITE_URL}${alts[l]}`,
      changeFrequency: "monthly" as const,
      priority: Math.round((priority - STEP[l]) * 10) / 10,
      alternates: { languages },
    }));
  };

  return [
    ...entry("/", 1),
    ...SERVICES.flatMap((s) => entry(`/${s.slug}`, 0.9)),
    ...entry("/diagnostico", 0.9),
    ...entry("/work", 0.9),
    ...entry("/lab", 0.8),
    ...entry("/studio", 0.8),
    ...entry("/services", 0.9),
    ...entry("/contact", 0.8),
    ...PROJECTS.flatMap((p) => entry(`/work/${p.slug}`, 0.8)),
  ];
}
