import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LAB, UI, type Locale } from "@/lib/content";
import { makeT, withLocale } from "@/lib/i18n";
import { Reveal } from "./reveal";
import { LabShowcase, type LabShowcaseItem } from "./lab-showcase";

/** Velocidades de parallax por card (ecoa o exemplo pedido: 0.7 / 1 / 1.3 / 0.8...). */
const SHOWCASE_SPEEDS = [0.7, 1, 1.3, 0.8, 1.15, 0.9];

/**
 * Lab — vitrine premium dos filmes autorais feitos 100% em código (Three.js,
 * shaders, física de partículas). Cada card nasce sozinho conforme o
 * scroll, com parallax de profundidade -- prova técnica de motion no
 * mesmo nível dos projetos entregues aos clientes.
 */
export function Lab({ locale }: { locale: Locale }) {
  const t = makeT(locale);

  const items: LabShowcaseItem[] = LAB.map((clip, i) => ({
    key: clip.src,
    category: clip.tags[0] ?? "Lab",
    title: t(clip.title),
    desc: t(clip.desc),
    poster: clip.poster,
    src: clip.src,
    ctaLabel: t(UI.sections.labCardCta),
    ctaHref: withLocale(locale, "/lab"),
    speed: SHOWCASE_SPEEDS[i % SHOWCASE_SPEEDS.length],
  }));

  return (
    <section id="lab" className="relative isolate scroll-mt-20 overflow-hidden bg-grid py-20 sm:py-32">
      {/* Fundo decorativo: glows azuis + linhas finas + partículas discretas.
          O grão de filme e o gradiente radial de base já são globais (body). */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-[8%] h-[28rem] w-[28rem] rounded-full bg-accent/15 blur-[140px]" />
        <div className="absolute -bottom-40 right-[6%] h-[26rem] w-[26rem] rounded-full bg-accent-deep/20 blur-[140px]" />
        <div className="absolute left-1/4 top-1/3 h-1 w-1 animate-pulse rounded-full bg-accent/70 [animation-delay:0.2s]" />
        <div className="absolute left-2/3 top-1/4 h-1.5 w-1.5 animate-pulse rounded-full bg-accent-soft/60 [animation-delay:1.1s]" />
        <div className="absolute left-1/2 top-2/3 h-1 w-1 animate-pulse rounded-full bg-accent/50 [animation-delay:0.6s]" />
        <div className="absolute left-[15%] top-3/4 h-1.5 w-1.5 animate-pulse rounded-full bg-accent-soft/50 [animation-delay:1.6s]" />
        <div className="absolute left-[85%] top-1/2 h-1 w-1 animate-pulse rounded-full bg-accent/60 [animation-delay:0.9s]" />
        <div className="absolute inset-x-0 top-1/4 h-px w-1/2 animate-line-drift bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-1/4 h-px w-1/3 translate-x-1/3 animate-line-drift bg-gradient-to-r from-transparent via-accent-soft/30 to-transparent [animation-delay:3s]" />
      </div>

      <div className="container-page">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
            <span className="text-accent/40">06 / </span>
            {t(UI.sections.labEyebrow)}
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-fg sm:text-5xl lg:text-6xl">
            {t(UI.sections.labTitle)}
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-fg-muted">{t(UI.sections.labSub)}</p>
        </Reveal>

        <div className="mt-16 sm:mt-20">
          <LabShowcase items={items} />
        </div>

        <Reveal>
          <Link
            href={withLocale(locale, "/lab")}
            className="mt-16 inline-flex items-center gap-1.5 text-sm font-semibold text-accent transition-colors hover:text-accent-soft"
          >
            {t(UI.sections.labCta)} <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
