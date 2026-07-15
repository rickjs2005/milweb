import { GOOGLE_SIM, PROFILE, type Locale } from "@/lib/content";
import { makeT } from "@/lib/i18n";
import { Reveal } from "./reveal";
import { GoogleSim, type GoogleSimStrings } from "./google-sim";

/**
 * 04 / O TESTE DO GOOGLE — SERP simulada: o visitante digita o que faz e vê
 * concorrentes fictícios ocupando a posição dele. Roda sozinha se ele só
 * assistir. Fecha com a "vaga em aberto" + CTA de WhatsApp.
 */
export function Google({ locale }: { locale: Locale }) {
  const t = makeT(locale);
  const g = GOOGLE_SIM;

  const strings: GoogleSimStrings = {
    placeholder: t(g.placeholder),
    search: t(g.search),
    suggestions: t(g.suggestions).split("|"),
    autorun: t(g.autorun),
    emptyHint: t(g.emptyHint),
    r1t: t(g.r1t),
    r1d: t(g.r1d),
    r1r: t(g.r1r),
    r2t: t(g.r2t),
    r2d: t(g.r2d),
    r3t: t(g.r3t),
    r3d: t(g.r3d),
    slotTitle: t(g.slotTitle),
    slotSub: t(g.slotSub),
    slotCta: t(g.slotCta),
    slotHref: `https://wa.me/${PROFILE.whatsapp}?text=${encodeURIComponent(t(g.slotWhats))}`,
    milo: t(g.milo),
  };

  return (
    <section id="google" className="container-page scroll-mt-20 py-20 sm:py-32">
      <Reveal>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          <span className="text-accent/40">04 / </span>
          {t(g.eyebrow)}
        </p>
        <h2 data-depth="0.07" className="mt-3 text-4xl font-bold tracking-tight text-fg sm:text-5xl lg:text-6xl">
          {t(g.title)}
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-fg-subtle">{t(g.sub)}</p>
      </Reveal>

      <Reveal delay={100} variant="zoom" className="mt-10">
        <GoogleSim s={strings} />
      </Reveal>
    </section>
  );
}
