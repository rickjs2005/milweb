import type { MetadataRoute } from "next";
import { PROJECTS, SITE_URL } from "@/lib/content";
import { SERVICES } from "@/lib/services";

/** Sitemap bilíngue: cada URL PT declara sua alternativa EN (e vice-versa). */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const entry = (
    path: string,
    priority: number,
  ): MetadataRoute.Sitemap[number][] => [
    {
      url: `${SITE_URL}${path === "/" ? "/" : path}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority,
      alternates: {
        languages: {
          "pt-BR": `${SITE_URL}${path === "/" ? "/" : path}`,
          en: `${SITE_URL}${path === "/" ? "/en" : `/en${path}`}`,
        },
      },
    },
    {
      url: `${SITE_URL}${path === "/" ? "/en" : `/en${path}`}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: priority - 0.1,
      alternates: {
        languages: {
          "pt-BR": `${SITE_URL}${path === "/" ? "/" : path}`,
          en: `${SITE_URL}${path === "/" ? "/en" : `/en${path}`}`,
        },
      },
    },
  ];

  return [
    ...entry("/", 1),
    ...SERVICES.flatMap((s) => entry(`/${s.slug}`, 0.9)),
    ...entry("/lab", 0.8),
    ...PROJECTS.flatMap((p) => entry(`/projetos/${p.slug}`, 0.8)),
  ];
}
