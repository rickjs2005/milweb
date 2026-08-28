import Link from "next/link";
import { Reveal } from "@/animations/reveal";
import { Footer } from "@/components/footer";
import { QuoteComposer } from "@/components/quote-composer";
import { CONTACT_PAGE } from "@/data/studio";
import { PROFILE, QUOTE, SITE_URL, type Locale, type Localized } from "@/lib/content";
import { ORG_ID } from "@/lib/inline-scripts";
import type { Service } from "@/lib/services";
import { makeT, withLocale } from "@/lib/i18n";
import { getDict, HTML_LANG } from "@/i18n";

/**
 * Página de serviço (SEO): título → benefícios → processo → FAQ → compositor
 * de mensagem. Mesmo sistema editorial do resto do site; JSON-LD de
 * Service + FAQPage + Breadcrumb preservado.
 */
export async function ServicePage({ service, locale }: { service: Service; locale: Locale }) {
  const t = makeT(locale);
  const d = getDict(locale);
  const wa = `https://wa.me/${PROFILE.whatsapp}?text=${encodeURIComponent(t(service.ctaWhats))}`;
  const home = withLocale(locale, "/");
  const path = withLocale(locale, `/${service.slug}`);
  const opt = (o: { key: string; label: Localized; phrase: Localized }) => ({ key: o.key, label: t(o.label), phrase: t(o.phrase) });

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Service", name: t(service.label), description: t(service.metaDescription), url: `${SITE_URL}${path}`, inLanguage: HTML_LANG[locale], areaServed: "BR", provider: { "@id": ORG_ID } },
      { "@type": "FAQPage", mainEntity: service.faq.map((f) => ({ "@type": "Question", name: t(f.q), acceptedAnswer: { "@type": "Answer", text: t(f.a) } })) },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "MilWeb", item: `${SITE_URL}${home}` },
          { "@type": "ListItem", position: 2, name: d.nav.services, item: `${SITE_URL}${withLocale(locale, "/services")}` },
          { "@type": "ListItem", position: 3, name: t(service.label), item: `${SITE_URL}${path}` },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="container-page pt-nav" data-inspect={`SERVICE / ${service.slug.toUpperCase()}`}>
        <header className="pt-8 md:pt-12">
          <div className="rule flex items-center justify-between pt-3 t-mono">
            <Link href={withLocale(locale, "/services")} className="link-rule">
              {d.pages.services} / {t(service.eyebrow).toUpperCase()}
            </Link>
            <a href={wa} target="_blank" rel="noopener noreferrer" className="link-rule text-ink">
              {d.pages.whatsapp} ↗
            </a>
          </div>
          <h1 className="t-display t-display-md mt-10 max-w-6xl text-ink">
            {t(service.title)} <span className="text-ink-3">{t(service.titleHighlight)}</span>
          </h1>
          <p className="t-lead mt-10 max-w-3xl text-ink-2">{t(service.sub)}</p>
        </header>

        <Reveal as="section" className="grid-12 gap-y-6 py-16 md:py-24">
          <div data-rule className="rule col-span-4 md:col-span-8 lg:col-span-12" />
          <p data-reveal className="t-mono col-span-4 text-ink-3 md:col-span-2">
            {d.pages.serviceIncluded}
          </p>
          <ul className="col-span-4 grid gap-x-gutter gap-y-8 md:col-span-6 md:col-start-3 md:grid-cols-2 lg:col-span-9 lg:col-start-3 lg:grid-cols-3">
            {service.benefits.map((b, i) => (
              <li key={i} data-reveal className="border-t border-ink pt-4">
                <p className="text-ink">{t(b.title)}</p>
                <p className="t-body mt-2 text-ink-2">{t(b.desc)}</p>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal as="section" className="grid-12 gap-y-6 py-16 md:py-24">
          <div data-rule className="rule col-span-4 md:col-span-8 lg:col-span-12" />
          <p data-reveal className="t-mono col-span-4 text-ink-3 md:col-span-2">
            {d.pages.serviceHow}
          </p>
          <ol className="col-span-4 grid gap-x-gutter gap-y-8 md:col-span-6 md:col-start-3 md:grid-cols-2 lg:col-span-9 lg:col-start-3 lg:grid-cols-4">
            {service.steps.map((s, i) => (
              <li key={i} data-reveal className="border-t border-ink pt-4">
                <p className="t-mono text-ink-3">0{i + 1}</p>
                <p className="mt-2 text-ink">{t(s.title)}</p>
                <p className="t-body mt-2 text-ink-2">{t(s.desc)}</p>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal as="section" className="grid-12 gap-y-6 py-16 md:py-24">
          <div data-rule className="rule col-span-4 md:col-span-8 lg:col-span-12" />
          <p data-reveal className="t-mono col-span-4 text-ink-3 md:col-span-2">
            03 / FAQ
          </p>
          <div className="col-span-4 md:col-span-6 md:col-start-3 lg:col-span-8 lg:col-start-3">
            {service.faq.map((f, i) => (
              <details key={i} data-reveal className="group border-b border-neutral py-4">
                <summary className="flex cursor-pointer list-none items-baseline justify-between gap-6 text-ink">
                  <span>{t(f.q)}</span>
                  <span className="t-mono text-ink-3 transition-transform duration-fast group-open:rotate-45">+</span>
                </summary>
                <p className="t-body mt-3 max-w-2xl text-ink-2">{t(f.a)}</p>
              </details>
            ))}
          </div>
        </Reveal>

        <section className="rule grid-12 gap-y-6 py-16 md:py-24">
          <p className="t-mono col-span-4 text-ink-3 md:col-span-2">{d.pages.serviceContact}</p>
          <div className="col-span-4 md:col-span-6 md:col-start-3 lg:col-span-7 lg:col-start-3">
            <QuoteComposer
              typeQuestion={t(QUOTE.typeQuestion)}
              statusQuestion={t(QUOTE.statusQuestion)}
              types={QUOTE.types.map(opt)}
              statuses={QUOTE.statuses.map(opt)}
              greeting={t(QUOTE.greeting)}
              closing={t(QUOTE.closing)}
              joiner={t(QUOTE.joiner)}
              fallback={t(service.ctaWhats)}
              previewLabel={t(QUOTE.previewLabel)}
              send={t(CONTACT_PAGE.send)}
              whatsapp={PROFILE.whatsapp}
              preselectedType={service.slug}
            />
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </>
  );
}
