import { Palette, Code2, Search, Gauge, Server, Globe, CheckCircle2, BarChart3, type LucideIcon } from "lucide-react";
import { DIAGNOSTICO, type Locale } from "@/lib/content";
import { makeT } from "@/lib/i18n";
import { Reveal } from "./reveal";

const ICONS: Record<string, LucideIcon> = { Palette, Code2, Search, Gauge, Server, Globe, CheckCircle2, BarChart3 };

/**
 * 04 / O QUE ESTÁ INCLUSO — fecha a narrativa do /diagnostico: depois de ver
 * o problema (01-02) e a conta do preço (03), o visitante vê o que o valor
 * cobre. Id "infraestrutura" segue a âncora definida na spec do funil.
 */
export function Included({ locale }: { locale: Locale }) {
  const t = makeT(locale);
  const c = DIAGNOSTICO.included;

  return (
    <section id="infraestrutura" className="container-page scroll-mt-20 py-20 sm:py-32">
      <Reveal>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-warm">
          <span className="text-warm/50">04 / </span>
          {t(c.eyebrow)}
        </p>
        <h2 data-depth="0.07" className="mt-3 text-4xl font-bold tracking-tight text-fg sm:text-5xl lg:text-6xl">
          {t(c.title)}
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-fg-subtle">{t(c.sub)}</p>
      </Reveal>

      <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-line/10 bg-line/10 sm:grid-cols-2 lg:grid-cols-4">
        {c.items.map((item, i) => {
          const Icon = ICONS[item.icon] ?? CheckCircle2;
          return (
            <Reveal key={item.icon} delay={(i % 4) * 80}>
              <div className="flex h-full items-start gap-4 bg-bg p-6 transition-colors hover:bg-surface/60">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent ring-1 ring-inset ring-accent/20">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-fg">{t(item.title)}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-fg-muted">{t(item.desc)}</p>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
