/**
 * Textos de metadados do site + o JSON-LD do layout.
 *
 * Ficavam dentro de app/layout.tsx; saíram porque a descrição é usada nos
 * dois lugares (metadata e dados estruturados) e precisava de um dono só.
 * O <script> inline executável mora em ./theme-script.
 */
import { PROFILE, SITE_URL } from "./content";

/**
 * A description precisa caber em 160 caracteres: acima disso o Google corta
 * a frase no meio do resultado de busca. A versão anterior tinha 195 e
 * gastava os primeiros 80 listando stack (Next.js, React, TypeScript,
 * Node.js, Supabase) — a mesma linguagem que saiu do hero, e que não diz
 * nada para o dono de negócio que está lendo o resultado da busca.
 */
export const SITE_COPY = {
  pt: {
    title: "MilWeb | Sites e sistemas que dão resultado",
    description:
      "Sites e sistemas que fazem seu negócio vender: mais orçamentos no WhatsApp, mais visibilidade no Google e páginas que abrem em menos de 2 segundos.",
  },
  en: {
    title: "MilWeb | Websites and systems that deliver results",
    description:
      "Websites and systems that make your business sell: more WhatsApp enquiries, more visibility on Google and pages that load in under 2 seconds.",
  },
} as const;

/** Dados estruturados do site (schema.org), injetados no <body> do layout. */
export const SITE_JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "MilWeb",
  url: SITE_URL,
  email: `mailto:${PROFILE.email}`,
  image: `${SITE_URL}/opengraph-image`,
  description: SITE_COPY.pt.description,
  areaServed: "BR",
  founder: {
    "@type": "Person",
    name: "Rick",
    sameAs: [PROFILE.github, PROFILE.linkedin].filter(Boolean),
  },
  knowsAbout: ["Next.js", "React", "TypeScript", "Node.js", "Supabase", "PostgreSQL", "SEO"],
});
