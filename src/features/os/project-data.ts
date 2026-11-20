// SERVER-ONLY: importa conteúdo e dicionários. Só páginas, route handlers e o
// layout podem importar este módulo (nunca um client component).
import { CASE_STORIES } from "@/data/case-stories";
import { SELECTED_WORK } from "@/data/work";
import { PROFILE_DATA } from "@/data/profile";
import { getProject, NO_EXTERNAL, TOTAL_LABEL } from "@/data/projects";
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
  /**
   * Os dois lados da peça na coleção. `sample` é o que se experimenta: capítulos com material real do projeto, e o
   * endereço da experiência completa quando ela está no ar. `made` é o verso: o problema, o que o Rick fez e uma
   * decisão de implementação — com um lugar para conferir (código ou site) quando existe.
   */
  sample: { title: string; chapters: { label: string; text: string; image: string }[]; full: string | null };
  made: { problem: string; contribution: string; decision: { label: string; text: string }; evidence: { label: string; href: string } | null };
  prev: { title: string; href: string };
  next: { title: string; href: string };
  allHref: string;
  waHref: string;
  proposalHref: string;
  s: ReturnType<typeof getDict>["os"]["projects"];
  L: { heroAlt: string; client: string; studio: string; status: string; hold: string; holding: string; held: string; again: string; heldMessage: string };
};

const WA_MESSAGE: Record<Locale, (title: string) => string> = {
  pt: (title) => `Olá Rick! Vi o case "${title}" na MilWeb e quero algo parecido.`,
  en: (title) => `Hi Rick! I saw the "${title}" case on MilWeb and want something similar.`,
  es: (title) => `¡Hola Rick! Vi el caso "${title}" en MilWeb y quiero algo parecido.`,
};

/** TERRAL: duas fotografias reais do projeto entram na amostra, entre o terreiro e a vitrine — do grão à xícara. */
const SAMPLE_EXTRA: Record<string, { after: number; items: { label: Localized; text: Localized; image: string }[] }> = {
  terral: {
    after: 1,
    items: [
      {
        label: { pt: "TAMBOR", en: "THE DRUM", es: "TAMBOR" },
        text: { pt: "O grão cai no tambor. É fotografia real da torra: o site usa imagem viva no lugar de ilustração.", en: "The beans drop into the drum. Real roasting photography: the site uses living imagery instead of illustration.", es: "El grano cae en el tambor. Es fotografía real del tostado: el sitio usa imagen viva en lugar de ilustración." },
        image: "/shots/terral/grao.webp",
      },
      {
        label: { pt: "TORRA", en: "THE ROAST", es: "TUESTE" },
        text: { pt: "As mãos do torrador revolvem o lote. A narrativa desacelera aqui de propósito: café é sobre esperar o tempo certo.", en: "The roaster's hands turn the batch. The story slows down here on purpose: coffee is about waiting the right amount of time.", es: "Las manos del tostador remueven el lote. La historia se frena aquí a propósito: el café es esperar el tiempo justo." },
        image: "/shots/terral/torra.webp",
      },
    ],
  },
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
  const highlights = (p.caseStudy?.highlights ?? []).map((h) => ({ label: t(h.label), detail: t(h.detail) }));
  const live = NO_EXTERNAL.has(p.slug) ? null : (p.live ?? null);
  const repos = NO_EXTERNAL.has(p.slug) ? [] : (p.repos ?? []);

  // A amostra: os passos da história do case quando ela existe; senão a capa e as telas, com o que cada uma mostra.
  const chapters: { label: string; text: string; image: string }[] = story
    ? story.steps.map((st) => ({ label: t(st.label), text: t(st.text), image: st.image }))
    : [{ label: p.title, text: t(p.tagline), image: hero }, ...screens.slice(0, 4).map((sc, i) => ({ label: highlights[i]?.label ?? String(i + 2).padStart(2, "0"), text: highlights[i]?.detail ?? sc.alt, image: sc.src }))].filter((c) => c.image);
  const extra = SAMPLE_EXTRA[p.slug];
  if (extra) chapters.splice(extra.after + 1, 0, ...extra.items.map((x) => ({ label: t(x.label), text: t(x.text), image: x.image })));

  // O verso: a contribuição e a decisão do perfil profissional quando o projeto está lá; senão, do próprio case.
  const pro = PROFILE_DATA.projects.find((x) => x.slug === p.slug);
  const hood = story?.hood[0];
  const decision = pro
    ? { label: s.decision, text: t(pro.decision) }
    : hood
      ? { label: t(hood.label), text: t(hood.summary) || narrative[0]?.text || "" }
      : highlights[0]
        ? { label: highlights[0].label, text: highlights[0].detail }
        : { label: s.stack, text: p.stack.join(" · ") };
  const evidence = pro?.code[0] ? { label: pro.code[0].label, href: pro.code[0].url } : repos[0] ? { label: repos[0].label, href: repos[0].url } : live ? { label: s.live, href: live } : null;

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
    // Kavita: sem link externo nem botão de visita (NO_EXTERNAL); o texto de status continua.
    live,
    repos,
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
    highlights,
    narrative,
    screens,
    sample: { title: selected ? selected.title[locale].join(" ") : p.title, chapters, full: live },
    made: { problem: t(p.problem), contribution: pro ? t(pro.contribution) : t(p.result), decision, evidence },
    prev: { title: prev.title, href: withLocale(locale, `/work/${prev.slug}`) },
    next: { title: next.title, href: withLocale(locale, `/work/${next.slug}`) },
    allHref: withLocale(locale, "/work"),
    proposalHref: withLocale(locale, "/contact") + "?project=" + encodeURIComponent(p.slug),
    waHref: `https://wa.me/${PROFILE.whatsapp}?text=${encodeURIComponent(WA_MESSAGE[locale](p.title))}`,
    s,
    L: { heroAlt: d.caseUi.heroAlt, client: d.caseUi.client, studio: d.caseUi.studio, status: d.caseUi.status, hold: d.caseUi.hold, holding: d.caseUi.holding, held: d.caseUi.held, again: d.caseUi.again, heldMessage: d.caseUi.heldMessage },
  };
}
