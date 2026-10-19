// SERVER-ONLY: importa conteúdo e dicionários. Só páginas, route handlers e o
// layout podem importar este módulo (nunca um client component).
import { CASE_STORIES } from "@/data/case-stories";
import { SELECTED_WORK } from "@/data/work";
import { getProject, TOTAL_LABEL } from "@/data/projects";
import { getDict } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { PROFILE, UI, type Localized } from "@/lib/content";
import { makeT, withLocale } from "@/lib/i18n";

/**
 * Dados do case prontos para desenhar (project-detail-view.tsx), todos já
 * localizados e serializáveis. A página canônica monta isto no servidor; a
 * janela de Projetos sem foco pede o mesmo JSON a /api/os/project/[lang]/[slug].
 */
export type ProjectDetailData = {
  slug: string;
  title: string;
  titleLines: string[];
  tagline: string;
  n: string;
  total: string;
  type: string;
  category: string;
  year: number | null;
  clientName: string | null;
  kind: "client" | "demo" | "study";
  status: string | null;
  live: string | null;
  repos: { label: string; url: string }[];
  stack: string[];
  hero: string;
  problem: string;
  result: string;
  metric: string | null;
  note: string | null;
  story: { variant: string; ideaHeadline: string; ideaBody: string; steps: { label: string; text: string; image: string }[]; flow: string[]; stats: { value: string; label: string }[]; result: [string, string] } | null;
  highlights: { label: string; detail: string }[];
  narrative: { label: string; summary: string; text: string }[];
  screens: { src: string; alt: string }[];
  prev: { title: string; href: string };
  next: { title: string; href: string };
  allHref: string;
  waHref: string;
  s: ReturnType<typeof getDict>["os"]["projects"];
  L: { heroAlt: string; client: string; studio: string; status: string; hold: string; holding: string; held: string; again: string; heldMessage: string };
};

const WA_MESSAGE: Record<Locale, (title: string) => string> = {
  pt: (title) => `Olá Rick! Vi o case "${title}" na MilWeb e quero algo parecido.`,
  en: (title) => `Hi Rick! I saw the "${title}" case on MilWeb and want something similar.`,
  es: (title) => `¡Hola Rick! Vi el caso "${title}" en MilWeb y quiero algo parecido.`,
};

const CATEGORY: Record<string, Localized> = {
  "landing-essencial": UI.sections.projectsFilterLandingEssencial,
  "landing-premium": UI.sections.projectsFilterLandingPremium,
  institucional: UI.sections.projectsFilterInstitucional,
  "institucional-premium": UI.sections.projectsFilterInstitucionalPremium,
  "sistema-saas": UI.sections.projectsFilterSistemaSaas,
};

export function buildProjectDetail(slug: string, locale: Locale): ProjectDetailData | null {
  const p = getProject(slug);
  if (!p) return null;
  const t = makeT(locale);
  const d = getDict(locale);
  const s = d.os.projects;
  const story = CASE_STORIES[p.slug];
  const selected = SELECTED_WORK.find((w) => w.slug === p.slug);
  const hero = p.image ?? story?.fullBleed.src ?? "";
  const prev = getProject(p.prevSlug)!;
  const next = getProject(p.nextSlug)!;
  const gallery = (p.caseStudy?.gallery ?? []).map((g) => ({ src: g.src, alt: t(g.alt) }));
  const screens = [...gallery, ...(story?.screens ?? []).map((sc) => ({ src: sc.src, alt: t(sc.alt) }))].filter((sc, i, arr) => sc.src && sc.src !== hero && arr.findIndex((x) => x.src === sc.src) === i);
  const narrative = (p.caseStudy?.narrative ?? []).map((para, i) => {
    const hood = story?.hood[i];
    return { label: hood ? t(hood.label) : String(i + 1).padStart(2, "0"), summary: hood ? t(hood.summary) : "", text: t(para) };
  });

  return {
    slug: p.slug,
    title: p.title,
    titleLines: selected ? [...selected.title[locale]] : [p.title],
    tagline: t(p.tagline),
    n: p.n,
    total: TOTAL_LABEL,
    type: d.displayType[p.displayType],
    category: t(CATEGORY[p.category] ?? UI.sections.projectsFilterAll),
    year: p.year ?? null,
    clientName: p.clientWork ? p.clientName ?? null : null,
    kind: p.clientWork ? "client" : p.live || p.demo ? "demo" : "study",
    status: p.live ? s.live : p.status ? t(p.status) : null,
    live: p.live ?? null,
    repos: p.repos ?? [],
    stack: p.stack,
    hero,
    problem: t(p.problem),
    result: t(p.result),
    metric: p.metric ? t(p.metric) : null,
    note: p.note ? t(p.note) : null,
    story: story
      ? {
          variant: story.variant,
          ideaHeadline: t(story.ideaHeadline),
          ideaBody: t(story.ideaBody),
          steps: story.steps.map((st) => ({ label: t(st.label), text: t(st.text), image: st.image })),
          flow: story.flow[locale],
          stats: story.stats.map((st) => ({ value: st.value, label: t(st.label) })),
          result: [t(story.result[0]), t(story.result[1])],
        }
      : null,
    highlights: (p.caseStudy?.highlights ?? []).map((h) => ({ label: t(h.label), detail: t(h.detail) })),
    narrative,
    screens,
    prev: { title: prev.title, href: withLocale(locale, `/work/${prev.slug}`) },
    next: { title: next.title, href: withLocale(locale, `/work/${next.slug}`) },
    allHref: withLocale(locale, "/work"),
    waHref: `https://wa.me/${PROFILE.whatsapp}?text=${encodeURIComponent(WA_MESSAGE[locale](p.title))}`,
    s,
    L: { heroAlt: d.caseUi.heroAlt, client: d.caseUi.client, studio: d.caseUi.studio, status: d.caseUi.status, hold: d.caseUi.hold, holding: d.caseUi.holding, held: d.caseUi.held, again: d.caseUi.again, heldMessage: d.caseUi.heldMessage },
  };
}
