import type { Metadata } from "next";
import { UI } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { getDict } from "@/i18n";
import { PROJECT_INDEX, TOTAL_LABEL } from "@/data/projects";
import { localeFrom, makeT, withLocale, type LangParams } from "@/lib/i18n";
import { fitLines } from "@/lib/fit";
import { CASE_UI } from "@/data/case-extras";
import { Footer } from "@/components/footer";
import { WorkIndex, type WorkRow } from "@/sections/work/work-index";

/**
 * /work — o ARQUIVO. Lista editorial eficiente: índice, projeto, tipo,
 * cliente/studio. Filtros poucos e claros; preview no hover (desktop).
 * A curadoria mora na Home; a profundidade, no case.
 */
export async function generateMetadata({ params }: { params: Promise<LangParams> }): Promise<Metadata> {
  const locale = await localeFrom(params);
  const t = makeT(locale);
  return pageMetadata({ locale, internalPath: "/work", title: t(UI.sections.projectsAllTitle), description: t(UI.sections.projectsAllSub) });
}

export default async function WorkPage({ params }: { params: Promise<LangParams> }) {
  const locale = await localeFrom(params);
  const t = makeT(locale);
  const d = getDict(locale);
  const rows: WorkRow[] = PROJECT_INDEX.map((p) => ({
    n: p.n,
    slug: p.slug,
    title: p.title,
    tagline: t(p.tagline),
    displayType: d.displayType[p.displayType],
    year: p.year ?? null,
    image: p.image ?? null,
    href: withLocale(locale, `/work/${p.slug}`),
    client: p.clientWork ? (p.clientName ?? d.archive.filters.client) : null,
    webgl: p.displayType === "WEBGL EXPERIENCE",
    scroll: p.displayType === "SCROLL EXPERIENCE",
    product: p.displayType === "DIGITAL PRODUCT",
  }));

  return (
    <>
      <main className="container-page pt-nav" data-inspect="WORK_ARCHIVE">
        <header className="pt-8 md:pt-12">
          <div className="rule flex items-center justify-between pt-3 t-mono">
            <span>{d.archive.label}</span>
            <span className="tnum text-ink-3">
              {TOTAL_LABEL} {t(CASE_UI.archiveSub).toUpperCase()}
            </span>
          </div>
          <h1 className="t-display t-display-xl t-fit mt-10 text-ink" style={fitLines(d.archive.title)}>
            {d.archive.title.map((l) => (
              <span key={l} className="block">
                {l}
              </span>
            ))}
          </h1>
        </header>

        <WorkIndex
          rows={rows}
          labels={{ ...d.archive.filters, ...d.archive.columns }}
        />
      </main>
      <Footer locale={locale} />
    </>
  );
}
