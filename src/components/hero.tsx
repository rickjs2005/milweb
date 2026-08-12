import Image from "next/image";
import { ArrowRight, Check, MessageCircle } from "lucide-react";
import { Magnetic } from "./magnetic";
import { HeroAnim } from "./hero-anim";
import { HeroCinema } from "./hero-cinema";
import { HeroBuilder } from "./hero-builder";
import { UI, PROFILE, QUOTE, type Locale } from "@/lib/content";
import { makeT, withLocale } from "@/lib/i18n";

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
        className="pointer-events-none absolute -top-40 left-1/2 h-[34rem] w-[52rem] -translate-x-1/2 rounded-full bg-accent/10 blur-[140px]"
      />
      <HeroCinema />

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

          <p data-hero className="font-mono text-sm uppercase tracking-[0.2em] text-warm">
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

          <p data-hero className="mt-5 max-w-2xl text-lg text-fg-muted xl:text-xl">
            {t(PROFILE.subtitle)}
          </p>

          {/* Os quatro ganhos, ainda na primeira dobra. O visitante decide se
              fica antes de rolar, e até aqui a página só tinha promessa — isto
              é o que ele leva.
              Os espaçamentos daqui até os CTAs foram apertados de propósito:
              a lista custa duas linhas, e num notebook de 768px de altura ela
              empurrava o botão do WhatsApp para fora da tela. */}
          <ul data-hero className="mt-5 grid max-w-2xl gap-x-8 gap-y-2 sm:grid-cols-2">
            {UI.hero.benefits.map((b) => (
              <li key={b.pt} className="flex items-start gap-2.5 text-sm text-fg-muted sm:text-base">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                {t(b)}
              </li>
            ))}
          </ul>

          <div data-hero className="mt-5 flex items-center gap-3">
            <Image
              src="/avatar.png"
              alt={t({ pt: "Rick, fundador da MilWeb", en: "Rick, founder of MilWeb" })}
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover ring-1 ring-inset ring-accent/40"
            />
            <div className="leading-tight">
              <p className="text-sm font-semibold text-fg">Rick</p>
              <p className="text-xs text-fg-subtle">{t(UI.labels.founder)}</p>
            </div>
          </div>

          {/* UM Milo só por contexto (crítica do Rick: aparecia 3x): no
              desktop o protagonista anda pela página; no mobile o FAB é o
              Milo — o hero não adiciona outro. CTAs premium: shine varrendo
              o principal, borda cônica viva no secundário. */}
          <div data-hero className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Magnetic strength={0.5} className="w-full sm:w-auto">
              <a
                href={waHref(t(QUOTE.fallback))}
                target="_blank"
                rel="noopener noreferrer"
                className="cta-pulse cta-shine inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-soft sm:w-auto"
              >
                <MessageCircle className="h-4 w-4" />
                {t(UI.hero.ctaWhats)}
              </a>
            </Magnetic>
            <Magnetic strength={0.5} className="w-full sm:w-auto">
              {/* Secundário aponta pro diagnóstico (opção 4 do designer):
                  projetos já têm item no menu e são a próxima seção do
                  scroll; o diagnóstico é a ponte de quem ainda não está
                  pronto pra pedir orçamento. */}
              <a
                href={withLocale(locale, "/diagnostico")}
                className="cta-border inline-flex w-full items-center justify-center gap-2 rounded-lg border border-line/25 bg-bg/30 px-5 py-3 text-sm font-semibold text-fg backdrop-blur-sm transition-colors hover:border-accent/50 sm:w-auto"
              >
                {t(UI.hero.ctaDiagnosis)}
                <ArrowRight className="h-4 w-4" />
              </a>
            </Magnetic>
          </div>
        </div>
      </div>

      {/* Abaixo de xl o construtor mora aqui: irmão do container-page (não
          filho — container-page já é `relative` pra vencer o HeroCinema
          absoluto, e virar filho dele faria o builder herdar esse ancestral
          posicionado, quebrando as coordenadas de xl abaixo, tunadas contra
          a SEÇÃO inteira e não contra essa coluna). Reusa a própria classe
          `.container-page` só pra alinhar com os CTAs acima. Em xl o wrapper
          vira `display: contents` (some da árvore de caixas, então deixa de
          contar como ancestral posicionado) e o builder, xl:absolute, pula
          direto pra seção — o palco terminal→site à direita do texto. */}
      <div className="container-page relative z-10 xl:contents">
        <HeroBuilder locale={locale} />
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
