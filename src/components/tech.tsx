import { Cloud, Code2, Server } from "lucide-react";
import { UI, TECH, type Locale } from "@/lib/content";
import { makeT } from "@/lib/i18n";
import { Reveal } from "./reveal";
import { TechMarquee } from "./tech-marquee";

const ALL_TECH = TECH.flatMap((g) => g.items);

/** Um ícone + tinta por grupo (ordem fixa de TECH: Front-end/Back-end/Infra)
 * -- só pra tirar as 3 caixas idênticas, sem precisar de campo novo em content.ts. */
const GROUP_STYLE = [
  { Icon: Code2, tint: "text-accent", ring: "border-accent/20" },
  { Icon: Server, tint: "text-emerald-400", ring: "border-emerald-400/20" },
  { Icon: Cloud, tint: "text-amber-400", ring: "border-amber-400/20" },
];

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
        {TECH.map((g, i) => {
          const { Icon, tint, ring } = GROUP_STYLE[i % GROUP_STYLE.length]!;
          return (
            <Reveal key={g.group.en} delay={i * 90} variant={i % 2 === 0 ? "fade-up" : "zoom"}>
              <div className={"h-full rounded-2xl border glass p-6 " + ring}>
                <div className={"mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2/70 " + tint}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className={"font-mono text-xs uppercase tracking-wider " + tint}>{t(g.group)}</p>
                <p className="mt-3 text-sm leading-relaxed text-fg-muted">{g.items.join(" · ")}</p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
