import { UI, TECH, type Locale } from "@/lib/content";
import { makeT } from "@/lib/i18n";
import { Reveal } from "./reveal";
import { TechMarquee } from "./tech-marquee";

const ALL_TECH = TECH.flatMap((g) => g.items);

export function Tech({ locale }: { locale: Locale }) {
  const t = makeT(locale);

  return (
    <section id="tech" className="container-page scroll-mt-20 py-20 sm:py-32">
      <Reveal>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          <span className="text-accent/40">08 / </span>
          {t(UI.sections.techEyebrow)}
        </p>
        <h2 data-depth="0.07" className="mt-3 text-4xl font-bold tracking-tight text-fg sm:text-5xl lg:text-6xl">
          {t(UI.sections.techTitle)}
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-fg-subtle">{t(UI.sections.techSub)}</p>
      </Reveal>

      <Reveal delay={60}>
        <TechMarquee items={ALL_TECH} />
      </Reveal>

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        {TECH.map((g, i) => (
          <Reveal key={g.group.en} delay={i * 90}>
            <div className="h-full rounded-2xl border border-line/10 glass p-6">
              <p className="font-mono text-xs uppercase tracking-wider text-accent">{t(g.group)}</p>
              <p className="mt-3 text-sm leading-relaxed text-fg-muted">{g.items.join(" · ")}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
