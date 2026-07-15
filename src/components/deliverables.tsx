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
import Link from "next/link";
import { DELIVERABLES, UI, type Locale } from "@/lib/content";
import { SERVICES } from "@/lib/services";
import { makeT, withLocale } from "@/lib/i18n";
import { Reveal } from "./reveal";
import { REVEAL_VARIANT_ROTATION } from "./reveal-variants";

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
        <h2 data-depth="0.07" className="mt-3 text-4xl font-bold tracking-tight text-fg sm:text-5xl lg:text-6xl">
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
            <Reveal
              key={d.title.en}
              delay={(i % 3) * 80}
              variant={REVEAL_VARIANT_ROTATION[i % REVEAL_VARIANT_ROTATION.length]}
            >
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

      {/* links internos pras páginas de serviço (SEO + aprofundamento) */}
      <Reveal delay={200}>
        <p className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-fg-subtle">
          {t({ pt: "Saiba mais:", en: "Learn more:" })}
          {SERVICES.map((s, i) => (
            <span key={s.slug}>
              <Link
                href={withLocale(locale, `/${s.slug}`)}
                className="font-medium text-accent underline-offset-4 transition-colors hover:text-accent-soft hover:underline"
              >
                {t(s.label)}
              </Link>
              {i < SERVICES.length - 1 && <span className="ml-2 text-fg-subtle/50">·</span>}
            </span>
          ))}
        </p>
      </Reveal>
    </section>
  );
}
