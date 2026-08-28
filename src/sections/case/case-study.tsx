import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/animations/reveal";
import { CASE_LABELS, CASE_STORIES, type CaseStory } from "@/data/case-stories";
import { SELECTED_WORK } from "@/data/work";
import { TOTAL_LABEL, type ProjectEntry } from "@/data/projects";
import { PROFILE, UI } from "@/lib/content";
import { makeT, withLocale, type Locale } from "@/lib/i18n";
import { CaseExperience } from "./case-experience";
import { CaseNext } from "./case-next";

const L = CASE_LABELS;

function Chapter({ label, children, wide = false, id }: { label: string; children: React.ReactNode; wide?: boolean; id?: string }) {
  return (
    <Reveal as="section" className="grid-12 gap-y-6 py-14 md:py-24">
      <div data-rule className="rule col-span-4 md:col-span-8 lg:col-span-12" id={id} />
      <p data-reveal className="t-mono col-span-4 text-ink-3 md:col-span-2">
        {label}
      </p>
      <div data-reveal className={"col-span-4 md:col-span-6 md:col-start-3 " + (wide ? "lg:col-span-10 lg:col-start-3" : "lg:col-span-8 lg:col-start-3")}>
        {children}
      </div>
    </Reveal>
  );
}

/** Fallback editorial para projetos sem CaseStory própria — derivado dos dados existentes. */
function fallbackStory(p: ProjectEntry, locale: Locale): CaseStory {
  const t = makeT(locale);
  const gallery = p.caseStudy?.gallery ?? [];
  const imgs = [p.image, ...gallery.map((g) => g.src)].filter(Boolean) as string[];
  const layouts: CaseStory["screens"][number]["layout"][] = ["full", "offset", "wide", "crop"];
  return {
    ideaHeadline: p.tagline,
    ideaBody: p.problem,
    steps: (p.caseStudy?.highlights ?? []).slice(0, 4).map((h, i) => ({ label: String(i + 1).padStart(2, "0"), text: h.detail, image: imgs[i % Math.max(imgs.length, 1)] ?? "" })),
    fullBleed: imgs[1] ? { src: imgs[1], alt: gallery[0]?.alt ?? p.tagline } : { src: p.image ?? "", alt: p.tagline },
    hood: (p.caseStudy?.narrative ?? []).map((_, i) => ({ label: String(i + 1).padStart(2, "0"), summary: { pt: "", en: "" }, paragraph: i })),
    flow: [],
    stats: [],
    result: [p.metric ?? { pt: "", en: "" }, p.status ?? { pt: "", en: "" }],
    screens: gallery.map((g, i) => ({ src: g.src, alt: g.alt, layout: layouts[i % layouts.length] })),
    words: p.stack.slice(0, 5).map((s) => s.toUpperCase()),
  };
}

/**
 * Case study cinematográfico: 00 intro → 01 hero (mídia dominante) →
 * 02 the idea → 03 experience (sticky media + passos) → full-bleed →
 * 04 under the hood (resumo + detalhe técnico expansível + fluxo) →
 * 05 details (números reais) → 06 result → 07 selected screens (ritmo
 * editorial) → next experience (a próxima mídia entra por baixo).
 */
export function CaseStudy({ project: p, next, locale }: { project: ProjectEntry; next: ProjectEntry; locale: Locale }) {
  const t = makeT(locale);
  const story = CASE_STORIES[p.slug] ?? fallbackStory(p, locale);
  const selected = SELECTED_WORK.find((w) => w.slug === p.slug);
  const title = selected ? selected.title[locale] : [p.title];
  const wa = `https://wa.me/${PROFILE.whatsapp}?text=${encodeURIComponent(t({ pt: `Olá Rick! Vi o case "${p.title}" na MilWeb e quero algo parecido.`, en: `Hi Rick! I saw the "${p.title}" case on MilWeb and want something similar.` }))}`;
  const category = t(
    {
      "landing-essencial": UI.sections.projectsFilterLandingEssencial,
      "landing-premium": UI.sections.projectsFilterLandingPremium,
      institucional: UI.sections.projectsFilterInstitucional,
      "institucional-premium": UI.sections.projectsFilterInstitucionalPremium,
      "sistema-saas": UI.sections.projectsFilterSistemaSaas,
    }[p.category],
  );
  const hero = p.image ?? story.fullBleed.src;
  const narrative = p.caseStudy?.narrative ?? [];
  const hasNumber = p.n !== "—";

  return (
    <article className="case" data-world={p.slug} data-inspect={`CASE / ${p.slug.toUpperCase()}`}>
      {/* 00 — INTRO + 01 — HERO */}
      <header className="container-page pt-nav">
        <div className="rule flex items-center justify-between pt-3 t-mono">
          <span>
            MW / {hasNumber ? p.n : "LAB"} — {p.title.toUpperCase()}
          </span>
          <span className="tnum text-ink-3">
            {p.clientWork ? L.client : L.studio}
            {p.year ? ` — ${p.year}` : ""}
            {hasNumber && <span className="hidden md:inline"> · {p.n} / {TOTAL_LABEL}</span>}
          </span>
        </div>
        <h1 className="t-display mt-8 text-ink md:mt-12" style={{ viewTransitionName: `case-title-${p.slug}`, fontSize: "clamp(2.1rem, 0.6rem + 7.4vw, 9.5rem)" }} data-inspect="CASE_TITLE">
          {title.map((l) => (
            <span key={l} className="block">
              {l}
            </span>
          ))}
        </h1>
      </header>

      <figure className="case-hero relative mt-8 md:mt-12" data-inspect="HERO_MEDIA">
        <div className="relative mx-margin aspect-[16/10] max-h-[78svh] overflow-hidden bg-neutral" style={{ viewTransitionName: `case-media-${p.slug}` }}>
          <Image src={hero} alt={t({ pt: `${p.title} — tela inicial`, en: `${p.title} — home screen` })} fill priority sizes="100vw" className="object-cover object-top" />
        </div>
      </figure>

      <div className="container-page">
        <dl className="grid-12 mt-6 gap-y-4 t-mono md:mt-8">
          <div className="col-span-2 md:col-span-2">
            <dt className="text-ink-3">{p.clientWork ? L.client : L.studio}</dt>
            <dd className="mt-1 text-ink">{p.clientWork && p.clientName ? p.clientName.toUpperCase() : "MILWEB"}</dd>
          </div>
          <div className="col-span-2 md:col-span-2">
            <dt className="text-ink-3">{L.type}</dt>
            <dd className="mt-1 text-ink">{p.displayType}</dd>
          </div>
          {p.year && (
            <div className="col-span-2 md:col-span-2">
              <dt className="text-ink-3">{L.year}</dt>
              <dd className="mt-1 text-ink">{p.year}</dd>
            </div>
          )}
          <div className="col-span-2 md:col-span-2">
            <dt className="text-ink-3">{L.status}</dt>
            <dd className="mt-1 text-ink">{p.live ? L.live : (p.status ? t(p.status).toUpperCase() : "—")}</dd>
          </div>
          {p.live && (
            <div className="col-span-4 md:col-span-2 md:col-start-11 md:text-right">
              <dd>
                <a href={p.live} target="_blank" rel="noopener noreferrer" className="link-rule text-ink" data-inspect="CTA / VISIT">
                  {L.visit} ↗
                </a>
              </dd>
            </div>
          )}
        </dl>

        {/* 02 — THE IDEA */}
        <Chapter label={L.idea}>
          <h2 className="t-display t-display-sm max-w-4xl text-ink">{t(story.ideaHeadline)}</h2>
          <p className="t-lead mt-8 max-w-3xl text-ink-2">{t(story.ideaBody)}</p>
        </Chapter>
      </div>

      {/* 03 — EXPERIENCE (sticky media + passos) */}
      {story.steps.length > 0 && (
        <CaseExperience label={L.experience} steps={story.steps.map((s) => ({ label: s.label, text: t(s.text), image: s.image }))} title={p.title} />
      )}

      {/* FULL BLEED */}
      {story.fullBleed.src && (
        <figure className="relative mt-12 h-[70svh] w-full overflow-hidden bg-neutral md:mt-20 md:h-[100svh]" data-inspect="FULL_BLEED">
          <Image src={story.fullBleed.src} alt={t(story.fullBleed.alt)} fill loading="lazy" sizes="100vw" className="object-cover" />
        </figure>
      )}

      <div className="container-page">
        {/* 04 — UNDER THE HOOD */}
        <Chapter label={L.hood} wide>
          {story.flow.length > 0 && (
            <ol className="flex flex-wrap items-center gap-x-3 gap-y-3 t-mono" data-inspect="FLOW" aria-label="Flow">
              {story.flow.map((f, i) => (
                <li key={f} className="flex items-center gap-3">
                  <span className="border border-ink px-3 py-2 text-ink">{f}</span>
                  {i < story.flow.length - 1 && <span className="text-ink-3">→</span>}
                </li>
              ))}
            </ol>
          )}
          <ul className={"divide-y divide-neutral border-t border-ink " + (story.flow.length ? "mt-10" : "")}>
            {story.hood.map((h, i) => {
              const para = narrative[h.paragraph];
              const summary = t(h.summary);
              return (
                <li key={i}>
                  <details className="group">
                    <summary className="grid cursor-pointer list-none gap-2 py-5 md:grid-cols-[10rem_1fr_2rem] md:gap-8">
                      <span className="t-mono text-ink">{h.label}</span>
                      <span className="t-body text-ink-2">{summary || (para ? t(para).slice(0, 140) + "…" : "")}</span>
                      <span className="t-mono text-ink-3 transition-transform duration-fast group-open:rotate-45 md:text-right">+</span>
                    </summary>
                    {para && (
                      <div className="pb-6 md:grid md:grid-cols-[10rem_1fr_2rem] md:gap-8">
                        <span className="t-mono hidden text-ink-3 md:block">{t(L.expand).toUpperCase()}</span>
                        <p className="t-body max-w-3xl text-ink-2">{t(para)}</p>
                      </div>
                    )}
                  </details>
                </li>
              );
            })}
          </ul>
          <p className="t-mono mt-8 text-ink-3">
            {L.builtWith} — <span className="text-ink">{p.stack.join(" · ")}</span>
            {p.repos?.map((r) => (
              <a key={r.url} href={r.url} target="_blank" rel="noopener noreferrer" className="link-rule ml-6 text-ink">
                {L.code} ↗
              </a>
            ))}
          </p>
        </Chapter>

        {/* 05 — DETAILS (números reais) */}
        {story.stats.length > 0 && (
          <Chapter label={L.details} wide>
            <ul className="grid grid-cols-2 gap-x-gutter gap-y-10 md:grid-cols-4" data-inspect="STATS">
              {story.stats.map((s, i) => (
                <li key={i} className="border-t border-ink pt-4">
                  <p className="t-display t-display-sm tnum text-ink">{s.value}</p>
                  <p className="t-mono mt-3 text-ink-3">{t(s.label).toUpperCase()}</p>
                </li>
              ))}
            </ul>
          </Chapter>
        )}

        {/* 06 — RESULT */}
        <Chapter label={L.result}>
          <p className="t-display t-display-sm text-ink">{t(story.result[0])}</p>
          {t(story.result[1]) && <p className="t-mono mt-4 text-ink-3">{t(story.result[1]).toUpperCase()}</p>}
          <p className="t-mono mt-8">
            <a href={wa} target="_blank" rel="noopener noreferrer" className="link-rule text-ink">
              [ {t({ pt: "Quero algo parecido", en: "I want something like this" }).toUpperCase()} ]
            </a>
          </p>
        </Chapter>
      </div>

      {/* 07 — SELECTED SCREENS (ritmo editorial) */}
      {story.screens.length > 0 && (
        <section className="container-page py-14 md:py-24" data-inspect="SELECTED_SCREENS">
          <div className="rule pt-3 t-mono text-ink-3">{L.screens}</div>
          <div className="mt-10 space-y-12 md:mt-16 md:space-y-24">
            {story.screens.map((s, i) => {
              const cls =
                s.layout === "full"
                  ? "w-full"
                  : s.layout === "wide"
                    ? "w-full md:w-[70%]"
                    : s.layout === "offset"
                      ? "w-full md:ml-[30%] md:w-[60%]"
                      : "w-full md:w-[42%]";
              return (
                <figure key={i} className={cls} data-inspect={`SCREEN_${String(i + 1).padStart(2, "0")}`}>
                  <div className={"relative overflow-hidden bg-neutral " + (s.layout === "crop" ? "aspect-[4/5]" : "aspect-[16/10]")}>
                    <Image src={s.src} alt={t(s.alt)} fill loading="lazy" sizes={s.layout === "full" ? "100vw" : "70vw"} className={"object-cover " + (s.layout === "crop" ? "object-left-top scale-[1.35] origin-top-left" : "object-top")} />
                  </div>
                  <figcaption className="t-mono mt-3 flex gap-4 text-ink-3">
                    <span className="tnum">SCREEN {String(i + 1).padStart(2, "0")}</span>
                    <span className="normal-case tracking-normal">{t(s.alt)}</span>
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </section>
      )}

      {/* NEXT EXPERIENCE */}
      <CaseNext
        label={L.next}
        title={(SELECTED_WORK.find((w) => w.slug === next.slug)?.title[locale] ?? [next.title]) as string[]}
        name={next.title}
        n={next.n}
        image={next.image ?? ""}
        href={withLocale(locale, `/work/${next.slug}`)}
        slug={next.slug}
        allHref={withLocale(locale, "/work")}
        allLabel={L.allWork}
      />
      <span className="sr-only">
        <Link href={withLocale(locale, "/work")}>{L.allWork}</Link>
      </span>
    </article>
  );
}
