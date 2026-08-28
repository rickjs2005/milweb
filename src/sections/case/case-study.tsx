import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/animations/reveal";
import { CASE_CHAPTERS, CASE_EXTRAS, CASE_UI } from "@/data/case-extras";
import { SELECTED_WORK } from "@/data/work";
import { PROFILE, UI, type Project } from "@/lib/content";
import { makeT, withLocale, type Locale } from "@/lib/i18n";

type Sibling = { slug: string; title: string };

function Chapter({ n, label, children, wide = false }: { n: string; label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <Reveal as="section" className="grid-12 gap-y-4 py-12 md:py-16" >
      <div data-rule className="rule col-span-4 md:col-span-8 lg:col-span-12" />
      <p data-reveal className="t-mono col-span-4 text-ink-3 md:col-span-2">
        {n} / {label}
      </p>
      <div data-reveal className={"col-span-4 md:col-span-6 md:col-start-3 " + (wide ? "lg:col-span-10 lg:col-start-3" : "lg:col-span-7 lg:col-start-3")}>
        {children}
      </div>
    </Reveal>
  );
}

/**
 * Case study em seis capítulos: 01 Challenge → 02 Idea → 03 Experience →
 * 04 Engineering → 05 Result → 06 Selected screens. A stack só aparece no
 * capítulo técnico. Server component: zero JS além das revelações.
 */
export function CaseStudy({ project: p, next, index, total, locale }: { project: Project; next?: Sibling; index: number; total: number; locale: Locale }) {
  const t = makeT(locale);
  const ch = CASE_CHAPTERS.map((c) => ({ n: c.n, label: t(c.label).toUpperCase() }));
  const extra = CASE_EXTRAS[p.slug];
  const selected = SELECTED_WORK.find((w) => w.slug === p.slug);
  const title = selected ? selected.title[locale] : [p.title];
  const n = String(index + 1).padStart(2, "0");
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

  return (
    <article className="container-page pt-nav" data-inspect={`CASE / ${p.slug.toUpperCase()}`}>
      {/* HERO */}
      <header className="pt-8 md:pt-12">
        <div className="rule flex items-center justify-between pt-3 t-mono">
          <span>
            {n} / {p.title.toUpperCase()}
          </span>
          <span className="tnum text-ink-3">
            {n} / {String(total).padStart(2, "0")}
          </span>
        </div>
        <h1 className="t-display t-display-lg mt-10 text-ink" data-inspect="CASE_TITLE">
          {title.map((l) => (
            <span key={l} className="block">
              {l}
            </span>
          ))}
        </h1>
        <div className="grid-12 mt-10 gap-y-6 t-mono">
          <p className="t-lead col-span-4 normal-case tracking-normal text-ink-2 md:col-span-5 lg:col-span-6" style={{ fontFamily: "var(--font-display)" }}>
            {t(p.tagline)}
          </p>
          <dl className="col-span-4 grid grid-cols-2 gap-y-3 md:col-span-3 md:col-start-6 lg:col-span-4 lg:col-start-8">
            <dt className="text-ink-3">{p.clientWork ? t(CASE_UI.client) : t(CASE_UI.studio)}</dt>
            <dd>{p.clientWork && p.clientName ? p.clientName : "MILWEB"}</dd>
            <dt className="text-ink-3">TYPE</dt>
            <dd>{category}</dd>
            {p.live && (
              <>
                <dt className="text-ink-3">URL</dt>
                <dd>
                  <a href={p.live} target="_blank" rel="noopener noreferrer" className="link-rule text-ink">
                    {t(CASE_UI.visit)} ↗
                  </a>
                </dd>
              </>
            )}
          </dl>
        </div>
      </header>

      {p.image && (
        <figure className="mt-10 aspect-[16/10] overflow-hidden bg-neutral md:mt-14" style={{ viewTransitionName: `case-${p.slug}` }} data-inspect="IMG / HERO">
          <Image src={p.image} alt={t({ pt: `Tela inicial de ${p.title}`, en: `${p.title} home screen` })} width={1440} height={900} priority sizes="100vw" className="h-full w-full object-cover object-top" />
        </figure>
      )}

      {/* CAPÍTULOS */}
      <div className="mt-6">
        <Chapter n={ch[0].n} label={ch[0].label}>
          <p className="t-lead text-ink">{t(p.problem)}</p>
        </Chapter>

        <Chapter n={ch[1].n} label={ch[1].label}>
          <p className="t-lead text-ink">{extra ? t(extra.idea) : t(p.tagline)}</p>
        </Chapter>

        <Chapter n={ch[2].n} label={ch[2].label}>
          {extra ? (
            <p className="t-body text-ink-2">{t(extra.experience)}</p>
          ) : p.caseStudy?.highlights?.length ? (
            <ul className="divide-y divide-neutral">
              {p.caseStudy.highlights.map((h, i) => (
                <li key={i} className="grid gap-1 py-4 md:grid-cols-[1fr_2fr] md:gap-6">
                  <p className="text-ink">{t(h.label)}</p>
                  <p className="t-body text-ink-2">{t(h.detail)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="t-body text-ink-2">{t(p.result)}</p>
          )}
        </Chapter>

        <Chapter n={ch[3].n} label={ch[3].label}>
          <div className="space-y-5">
            {(p.caseStudy?.narrative ?? []).map((para, i) => (
              <p key={i} className="t-body text-ink-2">
                {t(para)}
              </p>
            ))}
            {extra && p.caseStudy?.highlights?.length ? (
              <ul className="divide-y divide-neutral border-t border-neutral">
                {p.caseStudy.highlights.map((h, i) => (
                  <li key={i} className="grid gap-1 py-3 md:grid-cols-[1fr_2fr] md:gap-6">
                    <p className="text-ink">{t(h.label)}</p>
                    <p className="t-body text-ink-2">{t(h.detail)}</p>
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="t-mono pt-2 text-ink-3">
              {t(CASE_UI.builtWith).toUpperCase()} — <span className="text-ink">{p.stack.join(" · ")}</span>
            </p>
            {p.repos?.length ? (
              <p className="t-mono">
                {p.repos.map((r) => (
                  <a key={r.url} href={r.url} target="_blank" rel="noopener noreferrer" className="link-rule mr-6 text-ink">
                    {t(CASE_UI.code).toUpperCase()} ↗
                  </a>
                ))}
              </p>
            ) : null}
          </div>
        </Chapter>

        <Chapter n={ch[4].n} label={ch[4].label}>
          <p className="t-lead text-ink">{t(p.result)}</p>
          {p.metric && (
            <p className="t-mono mt-6">
              <span className="signal-dot" />
              {t(p.metric)}
            </p>
          )}
        </Chapter>

        {p.caseStudy?.gallery?.length ? (
          <Chapter n={ch[5].n} label={ch[5].label} wide>
            <div className="space-y-10">
              {p.caseStudy.gallery.map((g, i) => (
                <figure key={i} data-inspect={`SCREEN_${String(i + 1).padStart(2, "0")}`}>
                  <Image src={g.src} alt={t(g.alt)} width={1440} height={900} loading="lazy" sizes="(min-width: 1080px) 70vw, 100vw" className="w-full bg-neutral object-cover" />
                  <figcaption className="t-mono mt-3 flex gap-4 text-ink-3">
                    <span className="tnum">{String(i + 1).padStart(2, "0")}</span>
                    <span className="normal-case tracking-normal">{t(g.alt)}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </Chapter>
        ) : null}
      </div>

      {/* FECHO */}
      <div className="rule mt-8 grid-12 gap-y-8 py-12 md:py-20">
        <div className="col-span-4 md:col-span-4 lg:col-span-5">
          <a href={wa} target="_blank" rel="noopener noreferrer" className="link-rule t-mono text-ink">
            [ {t(CASE_UI.similar).toUpperCase()} ]
          </a>
        </div>
        {next && (
          <Link href={withLocale(locale, `/work/${next.slug}`)} className="group col-span-4 md:col-span-4 lg:col-span-7" data-inspect="NEXT_CASE">
            <p className="t-mono text-ink-3">{t(CASE_UI.next).toUpperCase()} →</p>
            <p className="t-display t-display-md mt-3 text-ink transition-colors duration-medium group-hover:text-ink-3">{next.title}</p>
          </Link>
        )}
        <Link href={withLocale(locale, "/work")} className="link-rule t-mono col-span-4 text-ink-3 md:col-span-8 lg:col-span-12">
          {t(CASE_UI.allWork).toUpperCase()}
        </Link>
      </div>
    </article>
  );
}
