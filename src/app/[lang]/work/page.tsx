import type { Metadata } from "next";
import { PROJECTS, SITE_URL, UI } from "@/lib/content";
import { localeFrom, makeT, withLocale, type LangParams } from "@/lib/i18n";
import { CASE_UI } from "@/data/case-extras";
import { Footer } from "@/components/footer";
import { WorkIndex, type WorkRow } from "@/sections/work/work-index";

/**
 * /work — o acervo completo como lista editorial: número, título, uma
 * linha, tipo. Sem cards. O preview do projeto flutua no hover (desktop).
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

const CATEGORY = {
  "landing-essencial": UI.sections.projectsFilterLandingEssencial,
  "landing-premium": UI.sections.projectsFilterLandingPremium,
  institucional: UI.sections.projectsFilterInstitucional,
  "institucional-premium": UI.sections.projectsFilterInstitucionalPremium,
  "sistema-saas": UI.sections.projectsFilterSistemaSaas,
} as const;

export default async function WorkPage({ params }: { params: Promise<LangParams> }) {
  const locale = await localeFrom(params);
  const t = makeT(locale);
  const visible = PROJECTS.filter((p) => !p.hideFromLists);
  const row = (p: (typeof PROJECTS)[number], i: number): WorkRow => ({
    n: String(i + 1).padStart(2, "0"),
    slug: p.slug,
    title: p.title,
    tagline: t(p.tagline),
    kind: t(CATEGORY[p.category]).toUpperCase(),
    image: p.image ?? null,
    href: withLocale(locale, `/work/${p.slug}`),
    client: p.clientWork ? p.clientName ?? null : null,
  });
  const clients = visible.filter((p) => p.clientWork);
  const studio = visible.filter((p) => !p.clientWork);
  const rows = [...clients, ...studio].map(row);

  return (
    <>
      <main className="container-page pt-nav">
        <header className="pt-8 md:pt-12">
          <div className="rule flex items-center justify-between pt-3 t-mono">
            <span>WORK</span>
            <span className="tnum text-ink-3">
              {String(rows.length).padStart(2, "0")} {t(CASE_UI.archiveSub).toUpperCase()}
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
          groups={[
            { label: t(CASE_UI.clientWork).toUpperCase(), rows: rows.slice(0, clients.length) },
            { label: t(CASE_UI.studioWork).toUpperCase(), rows: rows.slice(clients.length) },
          ]}
        />
      </main>
      <Footer locale={locale} />
    </>
  );
}
