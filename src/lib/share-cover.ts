import type { Locale } from "@/i18n/config";

/**
 * Capa de compartilhamento do site (Open Graph / Twitter Card / WhatsApp).
 *
 * Fonte única do que a capa diz e de onde ela mora: `pageMetadata` (lib/seo)
 * aponta para o arquivo estático e `scripts/og-cover.mjs` o gera a partir
 * destes mesmos textos, das fontes do site e das capturas REAIS dos
 * projetos. Uma capa por idioma; nada de métricas, depoimentos ou telas
 * inventadas — só o que já está cadastrado no projeto.
 *
 * As páginas de case continuam com a própria OG (app/[lang]/work/[slug]/
 * opengraph-image.tsx), que tem prioridade sobre esta.
 *
 * Arquivos gerados (nomes por extenso para scripts/orphan-assets.mjs, que
 * procura o nome literal no código): public/og/cover-pt.jpg, cover-en.jpg,
 * cover-es.jpg.
 */
export const SHARE_COVER = {
  width: 1200,
  height: 630,
  type: "image/jpeg",
  path: (locale: Locale) => `/og/cover-${locale}.jpg`,
  text: {
    pt: {
      name: "Rick Januario",
      role: "Desenvolvedor full-stack",
      line: "Sites, sistemas e experiências digitais.",
      tag: "Estúdio de desenvolvimento",
      alt: "Rick Januario, desenvolvedor full-stack — MilWeb, estúdio de desenvolvimento. Sites, sistemas e experiências digitais; capturas dos projetos Kavita Drones e Aurex Timepieces.",
    },
    en: {
      name: "Rick Januario",
      role: "Full-stack developer",
      line: "Websites, systems and digital experiences.",
      tag: "Development studio",
      alt: "Rick Januario, full-stack developer — MilWeb, development studio. Websites, systems and digital experiences; screenshots of the Kavita Drones and Aurex Timepieces projects.",
    },
    es: {
      name: "Rick Januario",
      role: "Desarrollador full-stack",
      line: "Sitios, sistemas y experiencias digitales.",
      tag: "Estudio de desarrollo",
      alt: "Rick Januario, desarrollador full-stack — MilWeb, estudio de desarrollo. Sitios, sistemas y experiencias digitales; capturas de los proyectos Kavita Drones y Aurex Timepieces.",
    },
  } satisfies Record<Locale, { name: string; role: string; line: string; tag: string; alt: string }>,
  /** Capturas reais (public/shots) e o tipo cadastrado em data/projects.ts › DISPLAY. */
  projects: [
    { slug: "kavita-drones", label: "Kavita Drones", kind: "Interactive commerce", shot: "/shots/kavita-drones.webp" },
    { slug: "aurex-timepieces", label: "Aurex Timepieces", kind: "WebGL experience", shot: "/shots/aurex-timepieces.webp" },
  ],
} as const;
