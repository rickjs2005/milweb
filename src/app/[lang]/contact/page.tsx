import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { QuoteComposer } from "@/components/quote-composer";
import { CONTACT_PAGE } from "@/data/studio";
import { PROFILE, QUOTE, type Localized } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { getDict } from "@/i18n";
import { localeFrom, makeT, type LangParams } from "@/lib/i18n";
import { fitLines } from "@/lib/fit";

export async function generateMetadata({ params }: { params: Promise<LangParams> }): Promise<Metadata> {
  const locale = await localeFrom(params);
  const t = makeT(locale);
  return pageMetadata({ locale, internalPath: "/contact", title: t(CONTACT_PAGE.meta.title), description: t(CONTACT_PAGE.meta.description) });
}

/** /contact — a pergunta, os canais e o compositor de mensagem. */
export default async function ContactPage({ params }: { params: Promise<LangParams> }) {
  const locale = await localeFrom(params);
  const t = makeT(locale);
  const opt = (o: { key: string; label: Localized; phrase: Localized }) => ({ key: o.key, label: t(o.label), phrase: t(o.phrase) });
  const d = getDict(locale);
  return (
    <>
      <main className="container-page pt-nav" data-inspect="CONTACT_PAGE">
        <header className="pt-8 md:pt-12">
          <div className="rule flex items-center justify-between gap-4 pt-3 t-mono">
            <span>{d.pages.contact}</span>
            <span className="tnum text-right text-ink-3 [&_span]:whitespace-nowrap">{t(CONTACT_PAGE.location).toUpperCase().split(" · ").map((part, i) => <span key={part}>{i > 0 ? " · " : ""}{part}</span>)}</span>
          </div>
          <h1 className="t-display t-display-xl t-fit mt-10 text-ink" style={fitLines(CONTACT_PAGE.title[locale])}>
            {CONTACT_PAGE.title[locale].map((l) => (
              <span key={l} className="block">
                {l}
              </span>
            ))}
          </h1>
          <p className="t-lead mt-10 max-w-3xl text-ink-2">{t(CONTACT_PAGE.intro)}</p>
        </header>

        <div className="grid-12 mt-16 gap-y-12 pb-24 md:mt-24">
          <aside className="col-span-4 md:col-span-3 lg:col-span-4">
            <p className="t-mono text-ink-3">{t(CONTACT_PAGE.channels).toUpperCase()}</p>
            <ul className="t-mono mt-4 space-y-3">
              <li>
                <a href={`https://wa.me/${PROFILE.whatsapp}`} target="_blank" rel="noopener noreferrer" className="link-rule text-ink">
                  WHATSAPP ↗
                </a>
              </li>
              <li>
                <a href={`mailto:${PROFILE.email}`} className="link-rule normal-case text-ink">
                  {PROFILE.email}
                </a>
              </li>
              <li>
                <a href={PROFILE.linkedin} target="_blank" rel="noopener noreferrer" className="link-rule text-ink">
                  LINKEDIN ↗
                </a>
              </li>
              <li>
                <a href={PROFILE.github} target="_blank" rel="noopener noreferrer" className="link-rule text-ink">
                  GITHUB ↗
                </a>
              </li>
            </ul>
          </aside>
          <div className="col-span-4 md:col-span-5 lg:col-span-7 lg:col-start-6">
            <QuoteComposer
              typeQuestion={t(QUOTE.typeQuestion)}
              statusQuestion={t(QUOTE.statusQuestion)}
              types={QUOTE.types.map(opt)}
              statuses={QUOTE.statuses.map(opt)}
              greeting={t(QUOTE.greeting)}
              closing={t(QUOTE.closing)}
              joiner={t(QUOTE.joiner)}
              fallback={t(QUOTE.fallback)}
              previewLabel={t(QUOTE.previewLabel)}
              send={t(CONTACT_PAGE.send)}
              whatsapp={PROFILE.whatsapp}
            />
          </div>
        </div>
      </main>
      <Footer locale={locale} />
    </>
  );
}
