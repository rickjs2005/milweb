import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { QuoteComposer } from "@/components/quote-composer";
import { CONTACT_PAGE } from "@/data/studio";
import { PROFILE, QUOTE, SITE_URL } from "@/lib/content";
import { localeFrom, makeT, type LangParams } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<LangParams> }): Promise<Metadata> {
  const locale = await localeFrom(params);
  const t = makeT(locale);
  const canonical = `${locale === "en" ? "/en" : ""}/contact`;
  return {
    title: t(CONTACT_PAGE.meta.title),
    description: t(CONTACT_PAGE.meta.description),
    alternates: { canonical, languages: { "pt-BR": "/contact", en: "/en/contact", "x-default": "/contact" } },
    openGraph: { type: "website", title: `${t(CONTACT_PAGE.meta.title)} | MilWeb`, description: t(CONTACT_PAGE.meta.description), url: `${SITE_URL}${canonical}` },
  };
}

/** /contact — a pergunta, os canais e o compositor de mensagem. */
export default async function ContactPage({ params }: { params: Promise<LangParams> }) {
  const locale = await localeFrom(params);
  const t = makeT(locale);
  const opt = (o: { key: string; label: { pt: string; en: string }; phrase: { pt: string; en: string } }) => ({ key: o.key, label: t(o.label), phrase: t(o.phrase) });
  return (
    <>
      <main className="container-page pt-nav" data-inspect="CONTACT_PAGE">
        <header className="pt-8 md:pt-12">
          <div className="rule flex items-center justify-between pt-3 t-mono">
            <span>CONTACT</span>
            <span className="tnum text-ink-3">{t(CONTACT_PAGE.location).toUpperCase()}</span>
          </div>
          <h1 className="t-display t-display-xl mt-10 text-ink">
            {CONTACT_PAGE.title.map((l) => (
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
