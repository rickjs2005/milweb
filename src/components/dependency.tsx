import { DEPENDENCY, PROFILE, type Locale } from "@/lib/content";
import { makeT } from "@/lib/i18n";
import { Reveal } from "./reveal";
import { DependencyCalc, type CalcStrings } from "./dependency-calc";
import { DependencyWidgets, type WidgetStrings } from "./dependency-widgets";

/**
 * 03 / RAIO-X DA DEPENDÊNCIA — bloco interativo de conversão: calculadora de
 * prejuízo + mini-dashboard. Constrói a dor ("depender de rede social é
 * risco") e aponta pra solução que eu vendo (site próprio) com CTA direto.
 */
export function Dependency({ locale }: { locale: Locale }) {
  const t = makeT(locale);
  const c = DEPENDENCY.calc;
  const w = DEPENDENCY.widgets;

  const calcStrings: CalcStrings = {
    locale,
    title: t(c.title),
    revenue: t(c.revenue),
    ig: t(c.ig),
    wa: t(c.wa),
    clients: t(c.clients),
    duration: t(c.duration),
    h24: t(c.h24),
    d7: t(c.d7),
    lose: t(c.lose),
    loseSub: t(c.loseSub),
    orders: t(c.orders),
    leads: t(c.leads),
    messages: t(c.messages),
    hours: t(c.hours),
    note: t(c.note),
    milo: [t(c.milo0), t(c.milo1), t(c.milo2)],
  };

  const widgetStrings: WidgetStrings = {
    risk: t(w.risk),
    riskHigh: t(w.riskHigh),
    live: t(w.live),
    channels: t(w.channels),
    ownSite: t(w.ownSite),
    channelsNote: t(w.channelsNote),
    salesOrigin: t(w.salesOrigin),
    referral: t(w.referral),
    googleSite: t(w.googleSite),
    outage: t(w.outage),
    outageAxis: t(w.outageAxis),
    outageWindow: t(w.outageWindow),
  };

  const wa = `https://wa.me/${PROFILE.whatsapp}?text=${encodeURIComponent(t(DEPENDENCY.ctaWhats))}`;

  return (
    <section id="raio-x" className="container-page scroll-mt-20 py-20 sm:py-32">
      <Reveal>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          <span className="text-accent/40">03 / </span>
          {t(DEPENDENCY.eyebrow)}
        </p>
        <h2 className="mt-3 text-4xl font-bold tracking-tight text-fg sm:text-5xl lg:text-6xl">
          {t(DEPENDENCY.title)}
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-fg-subtle">{t(DEPENDENCY.sub)}</p>
      </Reveal>

      <Reveal delay={100} className="mt-10">
        <DependencyCalc s={calcStrings} />
      </Reveal>

      <Reveal delay={100} className="mt-4">
        <DependencyWidgets s={widgetStrings} />
      </Reveal>

      <Reveal delay={100} className="mt-12 text-center">
        <p className="mx-auto max-w-2xl font-display text-2xl font-bold leading-snug text-fg sm:text-3xl">
          {t(DEPENDENCY.punch)}
        </p>
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="glow-accent mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 text-sm font-semibold text-accent-fg transition-transform hover:scale-[1.03]"
        >
          {t(DEPENDENCY.cta)}
          <span aria-hidden>→</span>
        </a>
      </Reveal>
    </section>
  );
}
