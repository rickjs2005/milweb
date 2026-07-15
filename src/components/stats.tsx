import { LIGHTHOUSE, STATS, type Locale } from "@/lib/content";
import { makeT } from "@/lib/i18n";
import { Reveal, Counter } from "./reveal";
import { LighthouseRings } from "./lighthouse-rings";

export function Stats({ locale }: { locale: Locale }) {
  const t = makeT(locale);
  const l = LIGHTHOUSE.labels;
  return (
    <section className="container-page py-12 sm:py-16">
      <div className="grid gap-px overflow-hidden rounded-2xl border border-line/10 bg-line/10 sm:grid-cols-3">
        {STATS.map((s, i) => (
          <Reveal key={s.label.en} as="div" variant="zoom" delay={i * 100} className="glass p-8 text-center">
            <p className="font-display text-5xl font-bold tracking-tight text-fg sm:text-6xl">
              <Counter value={s.value} suffix={s.suffix} delay={i * 120} />
            </p>
            <p className="mt-2 text-sm text-fg-subtle">{t(s.label)}</p>
          </Reveal>
        ))}
      </div>

      {/* Prova técnica: auditoria Lighthouse do próprio Google, 100 em tudo. */}
      <Reveal delay={100} variant="depth">
        <div className="glass mt-4 rounded-2xl p-8">
          <p className="mb-8 text-center font-mono text-xs uppercase tracking-[0.2em] text-fg-subtle">
            {t(LIGHTHOUSE.title)}
          </p>
          <LighthouseRings labels={[t(l.perf), t(l.a11y), t(l.best), t(l.seo)]} />
          <p className="mt-8 text-center text-sm text-fg-subtle">{t(LIGHTHOUSE.note)}</p>
        </div>
      </Reveal>
    </section>
  );
}
