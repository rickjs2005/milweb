import type { Metadata } from "next";
import { SITE_URL, UI } from "@/lib/content";
import { PROJECT_INDEX, TOTAL_LABEL } from "@/data/projects";
import { localeFrom, makeT, withLocale, type LangParams } from "@/lib/i18n";
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
  const canonical = `${locale === "en" ? "/en" : ""}/work`;
  const title = t(UI.sections.projectsAllTitle);
  const description = t(UI.sections.projectsAllSub);
  return {
    title,
    description,
    alternates: { canonical, languages: { "pt-BR": "/work", en: "/en/work", "x-default": "/work" } },
    openGraph: { type: "website", title: `${title} | MilWeb`, description, url: `${SITE_URL}${canonical}` },
    twitter: { card: "summary_large_image", title: `${title} | MilWeb`, description },
  };
}

export default async function WorkPage({ params }: { params: Promise<LangParams> }) {
  const locale = await localeFrom(params);
  const t = makeT(locale);
  const rows: WorkRow[] = PROJECT_INDEX.map((p) => ({
    n: p.n,
    slug: p.slug,
    title: p.title,
    tagline: t(p.tagline),
    displayType: p.displayType,
    year: p.year ?? null,
    image: p.image ?? null,
    href: withLocale(locale, `/work/${p.slug}`),
    client: p.clientWork ? (p.clientName ?? "CLIENT") : null,
    webgl: p.displayType === "WEBGL EXPERIENCE",
    scroll: p.displayType === "SCROLL EXPERIENCE",
    product: p.displayType === "DIGITAL PRODUCT",
  }));

  return (
    <>
      <main className="container-page pt-nav" data-inspect="WORK_ARCHIVE">
        <header className="pt-8 md:pt-12">
          <div className="rule flex items-center justify-between pt-3 t-mono">
            <span>WORK / ARCHIVE</span>
            <span className="tnum text-ink-3">
              {TOTAL_LABEL} {t(CASE_UI.archiveSub).toUpperCase()}
            </span>
          </div>
          <h1 className="t-display t-display-xl mt-10 text-ink">
            {CASE_UI.archiveTitle.map((l) => (
              <span key={l} className="block">
                {l}
              </span>
            ))}
          </h1>
        </header>

        <WorkIndex
          rows={rows}
          labels={{
            all: "ALL",
            client: "CLIENT",
            scroll: "SCROLL EXPERIENCES",
            webgl: "WEBGL / 3D",
            product: "DIGITAL PRODUCTS",
            index: "INDEX",
            project: "PROJECT",
            type: "TYPE",
            year: "YEAR",
            studio: "STUDIO",
          }}
        />
      </main>
      <Footer locale={locale} />
    </>
  );
}
