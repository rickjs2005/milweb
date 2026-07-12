import Link from "next/link";
import {
  ArrowRight,
  BadgePercent,
  CreditCard,
  Database,
  FlaskConical,
  Gauge,
  Globe,
  ImageUp,
  LifeBuoy,
  LineChart,
  Link2,
  MessageCircle,
  Package,
  Palette,
  Search,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Target,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { PROFILE, SITE_URL, type Locale } from "@/lib/content";
import type { Service } from "@/lib/services";
import { makeT, withLocale } from "@/lib/i18n";
import { Logo } from "./logo";
import { Reveal } from "./reveal";
import { Contact, Footer } from "./contact";

const ICONS: Record<string, LucideIcon> = {
  Palette, Gauge, Search, Smartphone, Globe, LifeBuoy,
  ShoppingCart, BadgePercent, ImageUp, Link2,
  Target, Zap, MessageCircle, LineChart, FlaskConical,
  CreditCard, Package, Workflow, Database, ShieldCheck,
};

/** Página de serviço (SEO): hero → benefícios → processo → FAQ → contato. */
export function ServicePage({ service, locale }: { service: Service; locale: Locale }) {
  const t = makeT(locale);
  const wa = `https://wa.me/${PROFILE.whatsapp}?text=${encodeURIComponent(t(service.ctaWhats))}`;
  const home = withLocale(locale, "/");
  const path = `${locale === "en" ? "/en" : ""}/${service.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: t(service.label),
        description: t(service.metaDescription),
        url: `${SITE_URL}${path}`,
        areaServed: "BR",
        provider: { "@type": "ProfessionalService", name: "MilWeb", url: SITE_URL },
      },
      {
        "@type": "FAQPage",
        mainEntity: service.faq.map((f) => ({
          "@type": "Question",
          name: t(f.q),
          acceptedAnswer: { "@type": "Answer", text: t(f.a) },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "MilWeb", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: t(service.label), item: `${SITE_URL}${path}` },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="sticky top-0 z-50 border-b border-line/10 glass-nav">
        <div className="container-page flex h-16 items-center justify-between">
          <Link href={home} aria-label="MilWeb — início">
            <Logo />
          </Link>
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3.5 py-2 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-soft"
          >
            <MessageCircle className="h-4 w-4" />
            {t({ pt: "Pedir orçamento", en: "Get a quote" })}
          </a>
        </div>
      </header>

      <main>
        {/* hero */}
        <section className="relative isolate overflow-hidden border-b border-line/10 bg-grid">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-40 left-1/2 h-[30rem] w-[46rem] -translate-x-1/2 rounded-full bg-accent/20 blur-[140px]"
          />
          <div className="container-page relative py-20 sm:py-28">
            <Reveal>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
                <Link href={home} className="text-accent/60 transition-colors hover:text-accent">
                  MilWeb
                </Link>{" "}
                / {t(service.eyebrow)}
              </p>
              <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight text-fg sm:text-5xl lg:text-6xl">
                {t(service.title)} <span className="text-gradient">{t(service.titleHighlight)}</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-fg-muted">{t(service.sub)}</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glow-accent inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3.5 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-soft"
                >
                  <MessageCircle className="h-4 w-4" />
                  {t({ pt: "Pedir orçamento gratuito", en: "Get a free quote" })}
                </a>
                <Link
                  href={`${home}#projects`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-line/15 px-6 py-3.5 text-sm font-semibold text-fg transition-colors hover:border-accent/50"
                >
                  {t({ pt: "Ver projetos entregues", en: "See shipped projects" })}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* benefícios */}
        <section className="container-page py-16 sm:py-24">
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">
              {t({ pt: "O que você recebe", en: "What you get" })}
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-line/10 bg-line/10 sm:grid-cols-2 lg:grid-cols-3">
            {service.benefits.map((b, i) => {
              const Icon = ICONS[b.icon] ?? Sparkles;
              return (
                <Reveal key={b.title.pt} delay={(i % 3) * 80}>
                  <div className="flex h-full items-start gap-4 bg-bg p-6 transition-colors hover:bg-surface/60">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent ring-1 ring-inset ring-accent/20">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-fg">{t(b.title)}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-fg-muted">{t(b.desc)}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* processo */}
        <section className="container-page py-16 sm:py-24">
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">
              {t({ pt: "Como funciona", en: "How it works" })}
            </h2>
          </Reveal>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {service.steps.map((s, i) => (
              <Reveal key={s.title.pt} delay={i * 90} as="li">
                <div className="glass h-full rounded-2xl p-6">
                  <span className="font-mono text-xs font-bold text-accent/60">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-2 font-semibold text-fg">{t(s.title)}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{t(s.desc)}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* FAQ do serviço */}
        <section className="container-page py-16 sm:py-24">
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">
              {t({ pt: "Perguntas frequentes", en: "Frequently asked questions" })}
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-3">
            {service.faq.map((f) => (
              <Reveal key={f.q.pt}>
                <details className="group glass rounded-2xl px-6 py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-fg [&::-webkit-details-marker]:hidden">
                    {t(f.q)}
                    <span
                      aria-hidden
                      className="text-accent transition-transform duration-300 group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-fg-muted">{t(f.a)}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ponte pro argumento da home */}
        <section className="container-page pb-8">
          <Reveal>
            <div className="glass flex flex-col items-start justify-between gap-4 rounded-2xl p-8 sm:flex-row sm:items-center">
              <p className="max-w-xl text-fg-muted">
                {t({
                  pt: "Ainda na dúvida se precisa disso? Calcule quanto a dependência de redes sociais já custa pro seu negócio.",
                  en: "Still unsure you need this? Calculate how much social media dependency already costs your business.",
                })}
              </p>
              <Link
                href={`${home}#raio-x`}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-accent/40 px-5 py-3 text-sm font-semibold text-accent transition-colors hover:bg-accent/10"
              >
                {t({ pt: "Fazer o raio-X gratuito", en: "Run the free X-ray" })}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </section>

        <Contact locale={locale} />
      </main>
      <Footer locale={locale} />
    </>
  );
}
