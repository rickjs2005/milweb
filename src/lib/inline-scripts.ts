/**
 * Textos de metadados do site + o JSON-LD do layout.
 *
 * Ficavam dentro de app/layout.tsx; saíram porque a descrição é usada nos
 * dois lugares (metadata e dados estruturados) e precisava de um dono só.
 * O <script> inline executável mora em ./theme-script.
 */
import { PROFILE, SITE_URL, type Locale } from "./content";
import { pt } from "@/i18n/pt";
import { en } from "@/i18n/en";
import { es } from "@/i18n/es";
import { HTML_LANG } from "@/i18n/config";

/**
 * A description precisa caber em 160 caracteres: acima disso o Google corta
 * a frase no meio do resultado de busca. A versão anterior tinha 195 e
 * gastava os primeiros 80 listando stack (Next.js, React, TypeScript,
 * Node.js, Supabase) — a mesma linguagem que saiu do hero, e que não diz
 * nada para o dono de negócio que está lendo o resultado da busca.
 */
export const SITE_COPY: Record<Locale, { title: string; description: string }> = {
  pt: { title: pt.meta.siteTitle, description: pt.meta.siteDescription },
  en: { title: en.meta.siteTitle, description: en.meta.siteDescription },
  es: { title: es.meta.siteTitle, description: es.meta.siteDescription },
};

/**
 * @id estável da MilWeb. Serve de âncora: as menções espalhadas pelo site
 * (o `provider` de cada página de serviço, o primeiro degrau dos
 * breadcrumbs) referenciam este mesmo nó em vez de descreverem uma
 * organização parecida cada uma por conta própria.
 */
export const ORG_ID = `${SITE_URL}/#milweb`;

/**
 * Dados estruturados do site (schema.org), injetados no <body> do layout.
 *
 * Recebe o locale: a descrição saía sempre em português, inclusive nas
 * páginas /en, e descrevia a entidade num idioma que não era o da página.
 */
export const siteJsonLd = (locale: Locale) =>
  JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": ORG_ID,
    name: "MilWeb",
    url: SITE_URL,
    email: PROFILE.email,
    // Mesmo numero dos botoes de WhatsApp do site — o canal de contato real.
    telephone: `+${PROFILE.whatsapp}`,
    logo: `${SITE_URL}${PROFILE.logo}`,
    image: `${SITE_URL}/opengraph-image`,
    description: SITE_COPY[locale].description,
    inLanguage: HTML_LANG[locale],
    areaServed: "BR",
    founder: {
      "@type": "Person",
      name: "Rick Januario",
      sameAs: [PROFILE.github, PROFILE.linkedin].filter(Boolean),
    },
    knowsAbout: ["Next.js", "React", "TypeScript", "Node.js", "Supabase", "PostgreSQL", "SEO"],
  });
