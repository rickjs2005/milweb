import { STATS, type Locale } from "@/lib/content";
import { makeT } from "@/lib/i18n";
import { Reveal, Counter } from "./reveal";

export function Stats({ locale }: { locale: Locale }) {
  const t = makeT(locale);
  return (
    <section className="container-page py-12 sm:py-16">
      <Reveal>
        <div className="grid gap-px overflow-hidden rounded-2xl border border-line/10 bg-line/10 sm:grid-cols-3">
          {STATS.map((s, i) => (
            <div key={s.label.en} className="glass p-8 text-center">
              <p className="font-display text-5xl font-bold tracking-tight text-fg sm:text-6xl">
                <Counter value={s.value} suffix={s.suffix} delay={i * 120} />
              </p>
              <p className="mt-2 text-sm text-fg-subtle">{t(s.label)}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
