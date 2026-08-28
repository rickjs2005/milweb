import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/animations/reveal";
import { Footer } from "@/components/footer";
import { SERVICES_PAGE } from "@/data/studio";
import { DELIVERABLES, DIFFERENTIALS, PROFILE, QUOTE } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { getDict } from "@/i18n";
import { SERVICES } from "@/lib/services";
import { localeFrom, makeT, withLocale, type LangParams } from "@/lib/i18n";
import { fitLines } from "@/lib/fit";

export async function generateMetadata({ params }: { params: Promise<LangParams> }): Promise<Metadata> {
  const locale = await localeFrom(params);
  const t = makeT(locale);
  return pageMetadata({ locale, internalPath: "/services", title: t(SERVICES_PAGE.meta.title), description: t(SERVICES_PAGE.meta.description) });
}

/** /services — o hub comercial: serviços (com página própria), entregas, garantias, diagnóstico. */
export default async function ServicesPage({ params }: { params: Promise<LangParams> }) {
  const locale = await localeFrom(params);
  const t = makeT(locale);
  const wa = `https://wa.me/${PROFILE.whatsapp}?text=${encodeURIComponent(t(QUOTE.fallback))}`;
  const d = getDict(locale);
  return (
    <>
      <main className="container-page pt-nav" data-inspect="SERVICES">
        <header className="pt-8 md:pt-12">
          <div className="rule flex items-center justify-between pt-3 t-mono">
            <span>{d.pages.services}</span>
            <span className="tnum text-ink-3">{String(SERVICES.length).padStart(2, "0")}</span>
          </div>
          <h1 className="t-display t-display-xl t-fit mt-10 text-ink" style={fitLines(SERVICES_PAGE.title[locale])}>{SERVICES_PAGE.title[locale][0]}</h1>
          <p className="t-lead mt-10 max-w-3xl text-ink-2">{t(SERVICES_PAGE.intro)}</p>
        </header>

        <Reveal as="section" className="mt-16 md:mt-24">
          <p data-reveal className="t-mono mb-2 text-ink-3">
            {t(SERVICES_PAGE.list).toUpperCase()}
          </p>
          <ul data-rule className="border-t border-ink">
            {SERVICES.map((s, i) => (
              <li key={s.slug} data-reveal className="border-b border-neutral">
                <Link href={withLocale(locale, `/${s.slug}`)} className="grid-12 group items-baseline gap-y-1 py-5 transition-colors duration-fast hover:bg-paper-2 md:py-6">
                  <span className="t-mono col-span-1 tnum text-ink-3">0{i + 1}</span>
                  <span className="t-display t-display-sm col-span-3 text-ink md:col-span-4 lg:col-span-5">{t(s.label)}</span>
                  <span className="col-span-4 text-step-0 text-ink-2 md:col-span-3 lg:col-span-5">{t(s.sub)}</span>
                  <span className="t-mono col-span-4 text-ink-3 md:col-span-1 md:text-right">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal as="section" className="grid-12 gap-y-6 py-16 md:py-24">
          <div data-rule className="rule col-span-4 md:col-span-8 lg:col-span-12" />
          <p data-reveal className="t-mono col-span-4 text-ink-3 md:col-span-2">
            {t(SERVICES_PAGE.deliverables).toUpperCase()}
          </p>
          <ul className="col-span-4 grid gap-x-gutter gap-y-8 md:col-span-6 md:col-start-3 md:grid-cols-2 lg:col-span-9 lg:col-start-3 lg:grid-cols-3">
            {DELIVERABLES.map((d, i) => (
              <li key={i} data-reveal className="border-t border-ink pt-4">
                <p className="text-ink">{t(d.title)}</p>
                <p className="t-body mt-2 text-ink-2">{t(d.desc)}</p>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal as="section" className="grid-12 gap-y-6 py-16 md:py-24">
          <div data-rule className="rule col-span-4 md:col-span-8 lg:col-span-12" />
          <p data-reveal className="t-mono col-span-4 text-ink-3 md:col-span-2">
            {t(SERVICES_PAGE.differentials).toUpperCase()}
          </p>
          <ul className="col-span-4 divide-y divide-neutral md:col-span-6 md:col-start-3 lg:col-span-9 lg:col-start-3">
            {DIFFERENTIALS.map((d, i) => (
              <li key={i} data-reveal className="grid gap-1 py-3 md:grid-cols-[1fr_2fr] md:gap-6">
                <p className="text-ink">{t(d.title)}</p>
                <p className="t-body text-ink-2">{t(d.desc)}</p>
              </li>
            ))}
          </ul>
        </Reveal>

        <section className="rule grid-12 gap-y-6 py-16 md:py-24">
          <p className="t-mono col-span-4 text-ink-3 md:col-span-2">{t(SERVICES_PAGE.audit.eyebrow).toUpperCase()}</p>
          <div className="col-span-4 md:col-span-6 md:col-start-3 lg:col-span-9 lg:col-start-3">
            <h2 className="t-display t-display-md text-ink">{t(SERVICES_PAGE.audit.title)}</h2>
            <p className="t-mono mt-8 flex flex-wrap gap-8">
              <Link href={withLocale(locale, "/diagnostico")} className="link-rule text-ink">
                [ {t(SERVICES_PAGE.audit.cta).toUpperCase()} ]
              </Link>
              <a href={wa} target="_blank" rel="noopener noreferrer" className="link-rule text-ink">
                [ {t(SERVICES_PAGE.quote).toUpperCase()} ]
              </a>
            </p>
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </>
  );
}
