// SERVER-ONLY: importa getDict e o conteúdo inteiro. Só o layout (servidor) pode
// importar este módulo — num client component ele mandaria os três dicionários
// ao navegador (conferir com `grep -rl "ABERTO A PROJETOS" .next/static/chunks`).
import { getDict } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { BRAND } from "@/data/brand";
import { MOOD, NO_EXTERNAL, PROJECT_INDEX } from "@/data/projects";
import { SELECTED_WORK } from "@/data/work";
import { SOCIAL } from "@/data/social";
import { CONTACT_PAGE, SERVICES_PAGE, STUDIO } from "@/data/studio";
import { SERVICES } from "@/lib/services";
import { DELIVERABLES, LAB, LAB_PAGE, PROFILE, QUOTE, UI, type Localized } from "@/lib/content";
import { makeT, withLocale } from "@/lib/i18n";
import type { OsPayload, OsProject } from "./types";

/**
 * Monta a carga do MilWeb OS para um idioma. Roda no servidor (layout) e
 * entrega só texto resolvido e caminhos — nada de dicionário inteiro nem
 * narrativas dos cases (essas chegam pela própria rota do case).
 */
export function buildOsPayload(locale: Locale): OsPayload {
  const d = getDict(locale);
  const t = makeT(locale);
  const category = (c: string) =>
    t(
      (
        {
          "landing-essencial": UI.sections.projectsFilterLandingEssencial,
          "landing-premium": UI.sections.projectsFilterLandingPremium,
          institucional: UI.sections.projectsFilterInstitucional,
          "institucional-premium": UI.sections.projectsFilterInstitucionalPremium,
          "sistema-saas": UI.sections.projectsFilterSistemaSaas,
        } as Record<string, Localized>
      )[c] ?? UI.sections.projectsFilterAll,
    );

  const projects: OsProject[] = PROJECT_INDEX.map((p) => {
    const w = SELECTED_WORK.find((x) => x.slug === p.slug);
    return {
      slug: p.slug,
      title: p.title,
      name: w?.name ?? p.title,
      n: p.n,
      type: d.displayType[p.displayType],
      category: category(p.category),
      year: p.year ?? null,
      client: p.clientWork ? p.clientName ?? d.archive.filters.client : null,
      clientWork: !!p.clientWork,
      live: NO_EXTERNAL.has(p.slug) ? null : (p.live ?? null),
      image: p.image ?? "/shots/" + p.slug + ".webp",
      mood: MOOD[p.slug]?.rgb ?? null,
      focus: MOOD[p.slug]?.focus ?? null,
      tagline: t(p.tagline),
      stack: p.stack,
      featured: p.featuredOrder ?? null,
      href: withLocale(locale, `/work/${p.slug}`),
      webgl: p.displayType === "WEBGL EXPERIENCE",
      scroll: p.displayType === "SCROLL EXPERIENCE",
      product: p.displayType === "DIGITAL PRODUCT",
      tourism: p.tourism,
      kind: p.clientWork ? "client" : p.live || p.demo ? "demo" : "study",
      kindKey: p.displayType,
      status: p.status ? t(p.status) : null,
      metric: p.metric ? t(p.metric) : null,
    };
  });

  const opt = (o: { key: string; label: Localized; phrase: Localized }) => ({ key: o.key, label: t(o.label), phrase: t(o.phrase) });
  const wa = (text: string) => `https://wa.me/${PROFILE.whatsapp}?text=${encodeURIComponent(text)}`;

  return {
    locale,
    s: d.os,
    brand: {
      mark: BRAND.mark,
      name: BRAND.name,
      tagline: t(BRAND.tagline),
      headline: d.hero.headline,
      support: [...d.hero.support],
      founder: BRAND.founder,
      role: t(BRAND.founderRole),
      index: BRAND.index,
      origin: t(BRAND.origin),
    },
    nav: {
      work: d.nav.work,
      lab: d.nav.lab,
      studio: d.nav.studio,
      services: d.nav.services,
      contact: d.nav.contact,
      menu: d.nav.menu,
      close: d.nav.close,
      primary: d.nav.primary,
      selectLanguage: d.meta.selectLanguage,
      langNames: { pt: getDict("pt").meta.langName, en: getDict("en").meta.langName, es: getDict("es").meta.langName },
      sound: d.sound,
    },
    hrefs: {
      home: withLocale(locale, "/"),
      projects: withLocale(locale, "/work"),
      studio: withLocale(locale, "/studio"),
      lab: withLocale(locale, "/lab"),
      services: withLocale(locale, "/services"),
      contact: withLocale(locale, "/contact"),
    },
    projects,
    social: { linkedin: SOCIAL.linkedin, github: SOCIAL.github, instagram: SOCIAL.instagram },
    filters: d.archive.filters,
    displayType: d.displayType,
    studio: {
      manifesto: [...STUDIO.manifesto],
      intro: t(STUDIO.intro),
      beliefs: { eyebrow: t(STUDIO.beliefs.eyebrow), items: STUDIO.beliefs.items.map((b) => ({ n: b.n, title: t(b.title), body: t(b.body) })) },
      process: { eyebrow: t(STUDIO.process.eyebrow), steps: STUDIO.process.steps.map((s) => ({ n: s.n, label: s.label, body: t(s.body) })) },
      founder: { eyebrow: t(STUDIO.founder.eyebrow), body: t(STUDIO.founder.body) },
      cta: t(STUDIO.cta),
    },
    services: {
      intro: t(SERVICES_PAGE.intro),
      items: SERVICES.map((s) => ({ slug: s.slug, label: t(s.label), sub: t(s.sub), href: withLocale(locale, `/${s.slug}`) })),
      deliverables: DELIVERABLES.map((x) => ({ title: t(x.title), desc: t(x.desc) })),
      waHref: wa(t(QUOTE.fallback)),
      diagnosticHref: withLocale(locale, "/diagnostico"),
      diagnosticLabel: t(SERVICES_PAGE.audit.cta),
    },
    contact: {
      title: CONTACT_PAGE.title[locale],
      intro: t(CONTACT_PAGE.intro),
      location: t(CONTACT_PAGE.location),
      email: PROFILE.email,
      whatsapp: PROFILE.whatsapp,
      waHref: `https://wa.me/${PROFILE.whatsapp}`,
      /** Chamada curta da tela inicial do celular ("Falar no WhatsApp"), a mesma do Lab. */
      cta: t(LAB_PAGE.ctaButton),
      linkedin: PROFILE.linkedin,
      github: PROFILE.github,
      quote: {
        typeQuestion: t(QUOTE.typeQuestion),
        statusQuestion: t(QUOTE.statusQuestion),
        types: QUOTE.types.map(opt),
        statuses: QUOTE.statuses.map(opt),
        greeting: t(QUOTE.greeting),
        closing: t(QUOTE.closing),
        joiner: t(QUOTE.joiner),
        fallback: t(QUOTE.fallback),
        previewLabel: t(QUOTE.previewLabel),
        send: t(CONTACT_PAGE.send),
      },
    },
    about: {
      eyebrow: t(STUDIO.founder.eyebrow),
      body: t(STUDIO.founder.body),
      tagline: t(BRAND.tagline),
      base: t(CONTACT_PAGE.location),
      focus: t(PROFILE.role),
      stack: [...BRAND.stack],
    },
    lab: {
      intro: t(LAB_PAGE.sub),
      madeWith: t(LAB_PAGE.madeWith),
      watchHint: t(LAB_PAGE.watchHint),
      clips: LAB.map((c) => ({ title: t(c.title), desc: t(c.desc), full: c.full, poster: c.poster, tags: c.tags.map((tag) => (typeof tag === "string" ? tag : t(tag))) })),
      experiments: d.experiments,
      waHref: wa(t(LAB_PAGE.ctaWhats)),
      ctaTitle: t(LAB_PAGE.ctaTitle),
      whatsapp: d.pages.whatsapp,
    },
  };
}
