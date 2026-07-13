import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LAB, UI, type Locale } from "@/lib/content";
import { makeT, withLocale } from "@/lib/i18n";
import { Reveal } from "./reveal";
import { LabVideo } from "./lab-video";
import { LabCarousel } from "./lab-carousel";

/**
 * Lab — vitrine dos filmes autorais feitos 100% em código (Remotion,
 * Three.js, shaders). Prova técnica de motion, no formato vertical de
 * Reels, tocando em loop mudo quando entram na viewport.
 */
export function Lab({ locale }: { locale: Locale }) {
  const t = makeT(locale);

  return (
    <section id="lab" className="container-page scroll-mt-20 py-20 sm:py-32">
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

      {/* Carrossel horizontal: cards no tamanho original (3 por tela em
          telas sm+), os demais aparecem rolando -- em vez de espremer
          todos os clipes numa grade fixa e encolher os cards. figcaption em
          coluna com as tags em mt-auto: como as descrições têm tamanhos bem
          diferentes entre si, só dar altura mínima ao título não bastava --
          as tags ficavam em alturas diferentes de card pra card. Com altura
          mínima no bloco inteiro + tags empurradas pro fim, tudo alinha
          na mesma linha não importa quantas linhas a descrição ocupe. */}
      <LabCarousel className="mt-12">
        {LAB.map((clip, i) => (
          <Reveal
            key={clip.src}
            delay={i * 0.08}
            className="w-[82%] shrink-0 snap-start sm:w-[calc((100%-3rem)/3)]"
          >
            <figure data-lab-card className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line/10 bg-surface-2/60">
              <div className="relative aspect-[9/16] overflow-hidden">
                <LabVideo src={clip.src} poster={clip.poster} label={t(clip.title)} />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg/80 to-transparent"
                />
              </div>
              <figcaption className="flex min-h-[13.5rem] flex-1 flex-col gap-2 p-5">
                <p className="text-lg font-semibold text-fg">{t(clip.title)}</p>
                <p className="text-sm text-fg-muted">{t(clip.desc)}</p>
                <p className="mt-auto flex flex-wrap gap-1.5 pt-1">
                  {clip.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border border-line/15 bg-bg/50 px-2 py-0.5 font-mono text-[11px] text-fg-subtle"
                    >
                      {tag}
                    </span>
                  ))}
                </p>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </LabCarousel>

      <Reveal>
        <Link
          href={withLocale(locale, "/lab")}
          className="mt-10 inline-flex items-center gap-1.5 text-sm font-semibold text-accent transition-colors hover:text-accent-soft"
        >
          {t(UI.sections.labCta)} <ArrowRight className="h-4 w-4" />
        </Link>
      </Reveal>
    </section>
  );
}
