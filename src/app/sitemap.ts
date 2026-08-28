import type { MetadataRoute } from "next";
import { PROJECTS, SITE_URL } from "@/lib/content";
import { SERVICES } from "@/lib/services";

/**
 * Sitemap bilíngue: cada URL PT declara sua alternativa EN (e vice-versa).
 *
 * Sem `lastModified`: era `new Date()` do build, então as 66 URLs juravam ter
 * mudado toda vez que qualquer coisa subia. lastmod só vale quando aponta
 * mudança real da página — declarado errado, é sinal que o buscador aprende
 * a ignorar. Melhor omitir do que mentir.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const entry = (
    path: string,
    priority: number,
  ): MetadataRoute.Sitemap[number][] => [
    {
      url: `${SITE_URL}${path === "/" ? "/" : path}`,
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
    // O funil inteiro fora da home: Raio-X + Google + cálculo do orçamento
    // + o que está incluso + CTA, numa página só (/raio-x redireciona).
    ...entry("/diagnostico", 0.9),
    ...entry("/work", 0.9),
    ...entry("/lab", 0.8),
    ...entry("/studio", 0.8),
    ...entry("/services", 0.9),
    ...entry("/contact", 0.8),
    ...PROJECTS.flatMap((p) => entry(`/work/${p.slug}`, 0.8)),
  ];
}
