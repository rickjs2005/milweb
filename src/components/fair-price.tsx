import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock3, Layers, MessageCircle, SlidersHorizontal, type LucideIcon } from "lucide-react";
import { FAIR_PRICE, PROFILE, type Locale } from "@/lib/content";
import { makeT, withLocale } from "@/lib/i18n";
import { Reveal } from "./reveal";

const waHref = (text: string) =>
  `https://wa.me/${PROFILE.whatsapp}?text=${encodeURIComponent(text)}`;

/* Ícone por bullet, na ordem do FAIR_PRICE.bullets (horas, infra, faixas). */
const BULLET_ICONS: LucideIcon[] = [Clock3, Layers, SlidersHorizontal];

/**
 * 03 / PREÇO JUSTO — a prova de transparência comercial: dois prints reais da
 * calculadora de orçamento do MilLead (dados de demonstração) ao lado do
 * argumento. Mora na página /raio-x junto do Raio-X da dependência e do
 * teste do Google (decisão do Rick: nada disso pesa na home; o menu tem
 * "Orçamento" apontando direto pra esta seção via /raio-x#preco-justo).
 */
export function FairPrice({ locale }: { locale: Locale }) {
  const t = makeT(locale);

  return (
    <section id="preco" className="container-page scroll-mt-20 py-20 sm:py-32">
      <Reveal>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-warm">
          <span className="text-warm/50">03 / </span>
          {t(FAIR_PRICE.eyebrow)}
        </p>
        <h2 data-depth="0.07" className="mt-3 text-4xl font-bold tracking-tight text-fg sm:text-5xl lg:text-6xl">
          {t(FAIR_PRICE.title)}
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-fg-subtle">{t(FAIR_PRICE.sub)}</p>
      </Reveal>

      <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1.15fr_1fr]">
        {/* Prints da calculadora: o grande mostra o fluxo, o menor o painel de
            preço. object-top + aspect fixo seguem o padrão da galeria de cases. */}
        <Reveal>
          <figure>
            <div className="overflow-hidden rounded-2xl border border-line/10 glass">
              <Image
                src="/shots/millead/estimates.webp"
                alt={t({
                  pt: "Calculadora de orçamento do MilLead com horas por etapa e painel de preço",
                  en: "MilLead quote calculator with hours per stage and the price panel",
                })}
                width={1600}
                height={1000}
                className="aspect-[8/5] w-full object-cover object-top"
                sizes="(min-width: 1024px) 54vw, 100vw"
              />
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-line/10 glass sm:ml-16">
              <Image
                src="/shots/millead/estimates-calc.webp"
                alt={t({
                  pt: "Painel do cálculo: custo real e os preços mínimo, recomendado e premium",
                  en: "Calculation panel: real cost plus minimum, recommended and premium prices",
                })}
                width={1600}
                height={1000}
                className="aspect-[8/5] w-full object-cover object-top"
                sizes="(min-width: 1024px) 44vw, 100vw"
              />
            </div>
            <figcaption className="mt-3 font-mono text-[11px] uppercase tracking-wider text-fg-subtle">
              {t(FAIR_PRICE.shotCaption)}
            </figcaption>
          </figure>
        </Reveal>

        <div className="flex flex-col gap-4">
          {FAIR_PRICE.bullets.map((b, i) => {
            const Icon = BULLET_ICONS[i] ?? Clock3;
            return (
              <Reveal key={b.title.en} delay={i * 80}>
                <div className="flex items-start gap-4 rounded-2xl border border-line/10 glass p-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent ring-1 ring-inset ring-accent/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-fg">{t(b.title)}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-fg-muted">{t(b.desc)}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}

          <Reveal delay={260}>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <a
                href={waHref(t(FAIR_PRICE.ctaWhats))}
                target="_blank"
                rel="noopener noreferrer"
                className="cta-shine inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3.5 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-soft"
              >
                <MessageCircle className="h-4 w-4" />
                {t(FAIR_PRICE.cta)}
              </a>
              <Link
                href={withLocale(locale, "/work/millead")}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent transition-colors hover:text-accent-soft"
              >
                {t(FAIR_PRICE.caseLink)} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </div>

    </section>
  );
}
