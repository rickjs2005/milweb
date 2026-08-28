import { HOME } from "@/data/brand";
import { makeT, type Locale } from "@/lib/i18n";

/**
 * Estado final ("SHIP") do hero — a composição tipográfica que o BuildHero
 * constrói. Server component: é o LCP da página, nasce pronto no HTML.
 */
export function HeroShip({ locale }: { locale: Locale }) {
  const t = makeT(locale);
  return (
    <section
      id="top"
      data-act="ACT 02 / BUILD"
      data-inspect="HERO"
      className="container-page relative flex min-h-[100svh] flex-col justify-between pb-8 pt-nav"
    >
      <div className="rule" aria-hidden="true" />

      <h1 className="t-display t-display-xl text-ink" data-inspect="HERO_TITLE">
        {HOME.hero.headline.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </h1>

      <div className="grid-12 mt-10 items-end t-mono">
        <ul className="col-span-4 space-y-0.5 md:col-span-4">
          {HOME.hero.support.map((s) => (
            <li key={s.en}>{t(s)}</li>
          ))}
        </ul>
        <p className="col-span-4 text-ink-3 md:col-span-4 md:text-center">MW/001</p>
        <p className="col-span-4 text-ink-3 md:col-span-4 md:text-right">
          <span className="signal-dot" />
          {t(HOME.hero.inspect)}
        </p>
      </div>
    </section>
  );
}
