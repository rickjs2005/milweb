import { PROCESS, UI, type Locale } from "@/lib/content";
import { makeT } from "@/lib/i18n";
import { Reveal } from "./reveal";

export function Process({ locale }: { locale: Locale }) {
  const t = makeT(locale);

  return (
    <section id="process" className="container-page scroll-mt-20 py-20 sm:py-32">
      <Reveal>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          <span className="text-accent/40">04 / </span>
          {t(UI.sections.processEyebrow)}
        </p>
        <h2 className="mt-3 text-4xl font-bold tracking-tight text-fg sm:text-5xl lg:text-6xl">
          {t(UI.sections.processTitle)}
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-fg-subtle">{t(UI.sections.processSub)}</p>
      </Reveal>

      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {PROCESS.map((s, i) => (
          <Reveal key={s.n} delay={i * 90}>
            <div className="relative h-full rounded-2xl border border-line/10 glass p-6">
              <span className="font-mono text-3xl font-bold text-accent/30">{s.n}</span>
              <h3 className="mt-3 text-lg font-semibold text-fg">{t(s.title)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">{t(s.desc)}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
