import type { Metadata } from "next";
import { Reveal } from "@/animations/reveal";
import { Footer } from "@/components/footer";
import { LabPlayer } from "@/components/lab-player";
import { LAB, LAB_PAGE, PROFILE } from "@/lib/content";
import { localeFrom, makeT, type LangParams } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { getDict } from "@/i18n";

export async function generateMetadata({ params }: { params: Promise<LangParams> }): Promise<Metadata> {
  const locale = await localeFrom(params);
  return pageMetadata({ locale, internalPath: "/lab", title: LAB_PAGE.metaTitle[locale], description: LAB_PAGE.metaDescription[locale] });
}

/**
 * /lab — cada experimento é uma entrada numerada (LAB / 00N) com o filme
 * completo (som a um toque, preload sob demanda) e a ficha técnica.
 */
export default async function LabPage({ params }: { params: Promise<LangParams> }) {
  const locale = await localeFrom(params);
  const t = makeT(locale);
  const wa = `https://wa.me/${PROFILE.whatsapp}?text=${encodeURIComponent(t(LAB_PAGE.ctaWhats))}`;
  const d = getDict(locale);

  return (
    <>
      <main className="container-page pt-nav" data-inspect="LAB">
        <header className="pt-8 md:pt-12">
          <div className="rule flex items-center justify-between pt-3 t-mono">
            <span>LAB</span>
            <span className="tnum text-ink-3">{String(LAB.length).padStart(3, "0")} {d.lab.experiments}</span>
          </div>
          <h1 className="t-display t-display-xl mt-10 text-ink">
            <span className="block">{d.lab.pageTitle[0]}</span>
            <span className="block">{d.lab.pageTitle[1]}</span>
          </h1>
          <p className="t-lead mt-10 max-w-3xl text-ink-2">{t(LAB_PAGE.sub)}</p>
        </header>

        <ol className="mt-16 md:mt-24">
          {LAB.map((clip, i) => (
            <Reveal key={clip.full} as="li" className="grid-12 gap-y-6 border-t border-ink py-12 md:py-16">
              <div data-reveal className="col-span-4 md:col-span-3 lg:col-span-4">
                <p className="t-mono text-ink-3">LAB / {String(i + 1).padStart(3, "0")}</p>
                <h2 className="t-display t-display-sm mt-3 text-ink">{t(clip.title)}</h2>
                <p className="t-body mt-5 max-w-sm text-ink-2">{t(clip.desc)}</p>
                <p className="t-mono mt-6 text-ink-3">
                  {t(LAB_PAGE.madeWith).toUpperCase()} — <span className="text-ink">{clip.tags.map((tag) => (typeof tag === "string" ? tag : t(tag))).join(" · ")}</span>
                </p>
              </div>
              <figure data-reveal className="col-span-4 md:col-span-4 md:col-start-5 lg:col-span-4 lg:col-start-7" data-inspect={`VIDEO / ${String(i + 1).padStart(3, "0")}`}>
                <div className="relative aspect-[9/16] w-full max-w-[420px] overflow-hidden bg-ink">
                  <LabPlayer src={clip.full} poster={clip.poster} label={t(clip.title)} hint={t(LAB_PAGE.watchHint)} />
                </div>
              </figure>
            </Reveal>
          ))}
        </ol>

        <section className="rule flex flex-wrap items-baseline justify-between gap-6 py-12 md:py-16">
          <h2 className="t-display t-display-md max-w-4xl text-ink">{t(LAB_PAGE.ctaTitle)}</h2>
          <a href={wa} target="_blank" rel="noopener noreferrer" className="link-rule t-mono text-ink">
            [ {d.pages.whatsapp} ↗ ]
          </a>
        </section>
      </main>
      <Footer locale={locale} />
    </>
  );
}
