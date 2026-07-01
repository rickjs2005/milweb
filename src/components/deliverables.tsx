import {
  Rocket,
  Globe,
  MessageCircle,
  AppWindow,
  LayoutDashboard,
  Boxes,
  Zap,
  Bug,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { DELIVERABLES, UI, type Locale } from "@/lib/content";
import { makeT } from "@/lib/i18n";
import { Reveal } from "./reveal";

const ICONS: Record<string, LucideIcon> = {
  Rocket,
  Globe,
  MessageCircle,
  AppWindow,
  LayoutDashboard,
  Boxes,
  Zap,
  Bug,
  Wrench,
};

export function Deliverables({ locale }: { locale: Locale }) {
  const t = makeT(locale);

  return (
    <section id="deliverables" className="container-page scroll-mt-20 py-20 sm:py-32">
      <Reveal>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          <span className="text-accent/40">01 / </span>
          {t(UI.sections.deliverablesEyebrow)}
        </p>
        <h2 className="mt-3 text-4xl font-bold tracking-tight text-fg sm:text-5xl lg:text-6xl">
          {t(UI.sections.deliverablesTitle)}
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-fg-subtle">
          {t(UI.sections.deliverablesSub)}
        </p>
      </Reveal>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DELIVERABLES.map((d, i) => {
          const Icon = ICONS[d.icon] ?? Rocket;
          return (
            <Reveal key={d.title.en} delay={(i % 3) * 80}>
              <div className="group h-full rounded-2xl border border-line/10 glass p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-[0_0_44px_-12px_rgb(var(--accent)/0.4)]">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent ring-1 ring-inset ring-accent/20 transition-colors group-hover:bg-accent/20">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-fg">{t(d.title)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">{t(d.desc)}</p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
