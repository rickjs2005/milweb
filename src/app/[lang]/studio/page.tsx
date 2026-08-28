import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/animations/reveal";
import { Footer } from "@/components/footer";
import { BRAND } from "@/data/brand";
import { STUDIO } from "@/data/studio";
import { SITE_URL } from "@/lib/content";
import { localeFrom, makeT, withLocale, type LangParams } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<LangParams> }): Promise<Metadata> {
  const locale = await localeFrom(params);
  const t = makeT(locale);
  const canonical = `${locale === "en" ? "/en" : ""}/studio`;
  return {
    title: t(STUDIO.meta.title),
    description: t(STUDIO.meta.description),
    alternates: { canonical, languages: { "pt-BR": "/studio", en: "/en/studio", "x-default": "/studio" } },
    openGraph: { type: "website", title: `${t(STUDIO.meta.title)} | MilWeb`, description: t(STUDIO.meta.description), url: `${SITE_URL}${canonical}` },
  };
}

/** /studio — manifesto, princípios, processo, fundador. */
export default async function StudioPage({ params }: { params: Promise<LangParams> }) {
  const locale = await localeFrom(params);
  const t = makeT(locale);
  return (
    <>
      <main className="container-page pt-nav" data-inspect="STUDIO">
        <header className="flex min-h-[80svh] flex-col justify-between pb-10 pt-8 md:pt-12">
          <div className="rule flex items-center justify-between pt-3 t-mono">
            <span>STUDIO</span>
            <span className="tnum text-ink-3">{BRAND.index}</span>
          </div>
          <h1 className="t-display t-display-xl text-ink">
            {STUDIO.manifesto.map((l) => (
              <span key={l} className="block">
                {l}
              </span>
            ))}
          </h1>
          <p className="t-lead max-w-3xl text-ink-2">{t(STUDIO.intro)}</p>
        </header>

        <Reveal as="section" className="grid-12 gap-y-6 py-16 md:py-24">
          <div data-rule className="rule col-span-4 md:col-span-8 lg:col-span-12" />
          <p data-reveal className="t-mono col-span-4 text-ink-3 md:col-span-2">
            {t(STUDIO.beliefs.eyebrow).toUpperCase()}
          </p>
          <ol className="col-span-4 md:col-span-6 md:col-start-3 lg:col-span-9 lg:col-start-3">
            {STUDIO.beliefs.items.map((b) => (
              <li key={b.n} data-reveal className="grid gap-3 border-b border-neutral py-6 md:grid-cols-[3rem_1fr_1.2fr] md:gap-8">
                <span className="t-mono tnum text-ink-3">{b.n}</span>
                <p className="t-display t-display-sm text-ink">{t(b.title)}</p>
                <p className="t-body text-ink-2">{t(b.body)}</p>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal as="section" className="grid-12 gap-y-6 py-16 md:py-24">
          <div data-rule className="rule col-span-4 md:col-span-8 lg:col-span-12" />
          <p data-reveal className="t-mono col-span-4 text-ink-3 md:col-span-2">
            {t(STUDIO.process.eyebrow).toUpperCase()}
          </p>
          <ol className="col-span-4 grid gap-x-gutter gap-y-10 md:col-span-6 md:col-start-3 md:grid-cols-2 lg:col-span-9 lg:col-start-3 lg:grid-cols-3">
            {STUDIO.process.steps.map((s) => (
              <li key={s.n} data-reveal className="border-t border-ink pt-4">
                <p className="t-mono text-ink-3">
                  {s.n} / <span className="text-ink">{s.label}</span>
                </p>
                <p className="t-body mt-3 text-ink-2">{t(s.body)}</p>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal as="section" className="grid-12 gap-y-6 py-16 md:py-24">
          <div data-rule className="rule col-span-4 md:col-span-8 lg:col-span-12" />
          <p data-reveal className="t-mono col-span-4 text-ink-3 md:col-span-2">
            {t(STUDIO.founder.eyebrow).toUpperCase()}
          </p>
          <div data-reveal className="col-span-4 md:col-span-6 md:col-start-3 lg:col-span-6 lg:col-start-3">
            <p className="t-lead text-ink">{t(STUDIO.founder.body)}</p>
            <p className="t-mono mt-8 text-ink">{BRAND.founder}</p>
            <p className="t-mono text-ink-3">{t(BRAND.founderRole).toUpperCase()}</p>
          </div>
          <div data-reveal className="col-span-4 md:col-span-2 md:col-start-7 lg:col-span-2 lg:col-start-11 lg:justify-self-end">
            <Image src="/avatar.png" alt={BRAND.founder} width={160} height={160} sizes="160px" className="w-28 grayscale md:w-40" />
          </div>
        </Reveal>

        <div className="rule flex items-center justify-between py-8 t-mono">
          <Link href={withLocale(locale, "/services")} className="link-rule text-ink">
            {t(STUDIO.cta).toUpperCase()} →
          </Link>
          <Link href={withLocale(locale, "/contact")} className="link-rule text-ink">
            CONTACT →
          </Link>
        </div>
      </main>
      <Footer locale={locale} />
    </>
  );
}
