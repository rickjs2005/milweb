import Image from "next/image";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Magnetic } from "./magnetic";
import { HeroAnim } from "./hero-anim";
import { MiloLive } from "./milo-live";
import { UI, PROFILE, type Locale } from "@/lib/content";
import { makeT } from "@/lib/i18n";

const waHref = (text: string) =>
  `https://wa.me/${PROFILE.whatsapp}?text=${encodeURIComponent(text)}`;

export function Hero({ locale }: { locale: Locale }) {
  const t = makeT(locale);

  return (
    <HeroAnim
      id="top"
      className="relative isolate overflow-hidden border-b border-line/10 bg-grid"
    >
      <div
        aria-hidden
        data-depth="0.5"
        className="pointer-events-none absolute -top-40 left-1/2 h-[34rem] w-[52rem] -translate-x-1/2 rounded-full bg-accent/20 blur-[140px]"
      />
      <div className="container-page relative z-10 grid min-h-[88vh] items-center gap-12 py-20 sm:py-28 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
        <div>
          <span
            data-hero
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent-soft"
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
            className="mt-4 text-[clamp(2.4rem,5.6vw,4.5rem)] font-bold leading-[1.02] tracking-tight text-fg"
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
            <span data-hero-word className="text-gradient inline-block">
              {t(UI.hero.titleHighlight)}
            </span>
            <span data-hero-word className="inline-block">
              .
            </span>
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

          <div data-hero className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Magnetic strength={0.5} className="w-full sm:w-auto">
              <a
                href={waHref("Olá Rick! Vim pelo site da MilWeb e quero um orçamento.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-soft sm:w-auto glow-accent"
              >
                <MessageCircle className="h-4 w-4" />
                {t(UI.hero.ctaWhats)}
              </a>
            </Magnetic>
            <Magnetic strength={0.5} className="w-full sm:w-auto">
              <a
                href="#projects"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-line/15 px-5 py-3 text-sm font-semibold text-fg transition-colors hover:border-accent/50 sm:w-auto"
              >
                {t(UI.hero.ctaProjects)}
                <ArrowRight className="h-4 w-4" />
              </a>
            </Magnetic>
          </div>
        </div>

        <div className="hero-visual relative w-full justify-self-center lg:justify-self-end">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-6 -z-10 rounded-3xl bg-accent/20 blur-[100px]"
          />
          <Image
            src={PROFILE.heroImage}
            alt="MilWeb — desenvolvimento de sites e sistemas"
            width={1600}
            height={894}
            priority
            sizes="(max-width: 1024px) 92vw, 46vw"
            data-depth="0.22"
            className="w-full rounded-2xl border border-line/15 ring-1 ring-inset ring-accent/20 shadow-[0_0_80px_-20px_rgb(var(--accent)/0.5)]"
          />

          {/* Milo vivo debruçado no canto da cena (pisca + flutua via CSS).
              Fica quase todo SOBRE a foto (só -bottom-3, não -bottom-10) E
              ganha um halo próprio atrás (glow-pad abaixo): sem isso, o azul
              do hoodie é parecido demais com o canto escuro da própria foto
              e com o bg-grid da seção, então ele "some" onde não há esse
              contraste — dando a falsa impressão de um corpo cortado/solto. */}
          <div className="animate-fade-up absolute -bottom-3 -left-6 z-10 hidden w-28 [animation-delay:1.2s] sm:block">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-2 bottom-0 -z-10 h-24 scale-110 rounded-full bg-accent/35 blur-2xl"
            />
            <span className="animate-fade-up absolute -top-8 left-20 whitespace-nowrap rounded-2xl rounded-bl-md border border-line/15 bg-surface-2/95 px-3.5 py-2 text-xs font-medium text-fg shadow-lg [animation-delay:2s]">
              {t(UI.hero.miloHi)}
            </span>
            <MiloLive className="w-28 drop-shadow-[0_8px_24px_rgb(var(--accent)/0.35)]" />
          </div>
        </div>
      </div>
    </HeroAnim>
  );
}
