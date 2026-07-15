import { Code2, Gauge, Search, TrendingUp, Sparkles, Timer, ShieldCheck, LifeBuoy, type LucideIcon } from "lucide-react";
import { DIFFERENTIALS, UI, type Locale } from "@/lib/content";
import { makeT } from "@/lib/i18n";
import { Reveal } from "./reveal";

const ICONS: Record<string, LucideIcon> = { Code2, Gauge, Search, TrendingUp, Sparkles, Timer, ShieldCheck, LifeBuoy };

export function Why({ locale }: { locale: Locale }) {
  const t = makeT(locale);

  return (
    <section id="why" className="container-page scroll-mt-20 py-20 sm:py-32">
      <Reveal>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          <span className="text-accent/40">02 / </span>
          {t(UI.sections.whyEyebrow)}
        </p>
        <h2 data-depth="0.07" className="mt-3 text-4xl font-bold tracking-tight text-fg sm:text-5xl lg:text-6xl">
          {t(UI.sections.whyTitle)}
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-fg-subtle">{t(UI.sections.whySub)}</p>
      </Reveal>

      <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-line/10 bg-line/10 sm:grid-cols-2 lg:grid-cols-4">
        {DIFFERENTIALS.map((d, i) => {
          const Icon = ICONS[d.icon] ?? Sparkles;
          return (
            <Reveal key={d.title.en} delay={(i % 4) * 80}>
              <div className="flex h-full items-start gap-4 bg-bg p-6 transition-colors hover:bg-surface/60">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent ring-1 ring-inset ring-accent/20">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-fg">{t(d.title)}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-fg-muted">{t(d.desc)}</p>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
