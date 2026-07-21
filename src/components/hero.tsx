import Image from "next/image";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Magnetic } from "./magnetic";
import { HeroAnim } from "./hero-anim";
import { HeroCinema } from "./hero-cinema";
import { HeroScene } from "./hero-scene";
import { UI, PROFILE, type Locale } from "@/lib/content";
import { makeT } from "@/lib/i18n";

const waHref = (text: string) =>
  `https://wa.me/${PROFILE.whatsapp}?text=${encodeURIComponent(text)}`;

export function Hero({ locale }: { locale: Locale }) {
  const t = makeT(locale);

  return (
    <HeroAnim
      id="top"
      className="hero-dark relative isolate overflow-hidden border-b border-line/10 bg-bg bg-grid"
    >
      {/* Fallback e base da cena: se a imagem do HeroCinema falhar, este glow
          + o bg-grid da seção continuam segurando o fundo. */}
      <div
        aria-hidden
        data-depth="0.5"
        className="pointer-events-none absolute -top-40 left-1/2 h-[34rem] w-[52rem] -translate-x-1/2 rounded-full bg-accent/20 blur-[140px]"
      />
      <HeroCinema />
      <HeroScene />

      <div className="container-page relative z-10 flex min-h-[92vh] flex-col justify-center py-20 sm:py-28">
        <div className="max-w-3xl">
          <span
            data-hero
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent-soft backdrop-blur-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            {t(UI.hero.available)}
          </span>

          <p data-hero className="font-mono text-sm uppercase tracking-[0.2em] text-accent">
            {t(UI.hero.eyebrow)}
          </p>

          {/* Headline com stagger palavra a palavra (hero-anim anima [data-hero-word]).
              O espaço fica FORA do span animado — inline-block descarta espaço final. */}
          <h1
            data-depth="0.08"
            aria-label={
              [t(UI.hero.titleLead), t(UI.hero.titleHighlight), t(UI.hero.titleTail)]
                .filter(Boolean)
                .join(" ") + "."
            }
            className="mt-4 text-[clamp(2.4rem,5.6vw,4.8rem)] font-bold leading-[1.02] tracking-tight text-fg"
          >
            {t(UI.hero.titleLead)
              .split(" ")
              .map((word, i) => (
                <span key={i}>
                  <span data-hero-word className="inline-block">
                    {word}
                  </span>{" "}
                </span>
              ))}
            {/* O "." vai grudado na última palavra (nunca quebra sozinho). */}
            <span data-hero-word className="text-gradient inline-block">
              {t(UI.hero.titleHighlight)}
              {!t(UI.hero.titleTail) && "."}
            </span>
            {t(UI.hero.titleTail) &&
              t(UI.hero.titleTail)
                .split(" ")
                .map((word, i, arr) => (
                  <span key={`tail-${i}`}>
                    {" "}
                    <span data-hero-word className="inline-block">
                      {word}
                      {i === arr.length - 1 && "."}
                    </span>
                  </span>
                ))}
          </h1>

          <p data-hero className="mt-6 max-w-2xl text-lg text-fg-muted xl:text-xl">
            {t(PROFILE.subtitle)}
          </p>

          <div data-hero className="mt-7 flex items-center gap-3">
            <Image
              src="/avatar.png"
              alt="Rick — MilWeb"
              width={46}
              height={46}
              className="h-[46px] w-[46px] rounded-full object-cover ring-1 ring-inset ring-accent/40"
            />
            <div className="leading-tight">
              <p className="text-sm font-semibold text-fg">Rick</p>
              <p className="text-xs text-fg-subtle">Fundador da MilWeb</p>
            </div>
          </div>

          {/* UM Milo só por contexto (crítica do Rick: aparecia 3x): no
              desktop o protagonista anda pela página; no mobile o FAB é o
              Milo — o hero não adiciona outro. CTAs premium: shine varrendo
              o principal, borda cônica viva no secundário. */}
          <div data-hero className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Magnetic strength={0.5} className="w-full sm:w-auto">
              <a
                href={waHref("Olá Rick! Vim pelo site da MilWeb e quero um orçamento.")}
                target="_blank"
                rel="noopener noreferrer"
                className="cta-pulse cta-shine inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-soft sm:w-auto"
              >
                <MessageCircle className="h-4 w-4" />
                {t(UI.hero.ctaWhats)}
              </a>
            </Magnetic>
            <Magnetic strength={0.5} className="w-full sm:w-auto">
              <a
                href="#projects"
                className="cta-border inline-flex w-full items-center justify-center gap-2 rounded-lg border border-line/25 bg-bg/30 px-5 py-3 text-sm font-semibold text-fg backdrop-blur-sm transition-colors hover:border-accent/50 sm:w-auto"
              >
                {t(UI.hero.ctaProjects)}
                <ArrowRight className="h-4 w-4" />
              </a>
            </Magnetic>
          </div>
        </div>
      </div>

      {/* Indicador de scroll (decorativo — a âncora real é a própria rolagem;
          sem texto de propósito: dispensa i18n e o desenho é universal). */}
      <a
        href="#deliverables"
        aria-hidden
        tabIndex={-1}
        className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 opacity-70 transition-opacity hover:opacity-100 sm:flex"
      >
        <span className="flex h-9 w-[1.35rem] justify-center rounded-full border border-fg-subtle/60 pt-1.5">
          <span className="hero-scroll-dot h-1.5 w-1.5 rounded-full bg-accent" />
        </span>
      </a>
    </HeroAnim>
  );
}
