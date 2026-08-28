"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap, EASE, MQ, ScrollTrigger, SplitText, useGSAP } from "@/animations/gsap";

export type BuildHeroStrings = {
  headline: readonly string[];
  support: string[];
  stages: readonly string[];
  inspect: string;
  scroll: string;
  images: { src: string; alt: string; n: string }[];
};

/** O DOM "cru" do hero — o que o visitante vê antes de qualquer design. */
const CODE = [
  "<body>",
  "  <main data-act=\"build\">",
  "    <h1>MILWEB</h1>",
  "    <ul class=\"support\" />",
  "    <canvas id=\"webgl\" />",
  "  </main>",
  "</body>",
];

/**
 * ACT 02 — BUILD. O site se constrói enquanto o visitante rola:
 * código → wireframe → grid → tipografia (a Archivo se expande no eixo
 * wdth) → imagens → experiência → SHIP. Um único ScrollTrigger pinado
 * dirige uma timeline; os estágios são só marcas de progresso.
 *
 * Mobile / reduced-motion: sem pin. O código aparece acima da headline e a
 * expansão tipográfica roda amarrada ao scroll normal (barata) — o conceito
 * sobrevive, o custo não.
 */
export function BuildHero({ s }: { s: BuildHeroStrings }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const q = gsap.utils.selector(el);
      const stage = q<HTMLElement>("[data-stage]");
      const h1 = el.querySelector<HTMLElement>("h1")!;
      const setStage = (i: number) => stage.forEach((n, k) => n.classList.toggle("is-active", k === i));

      const mm = gsap.matchMedia();

      // ---------- DESKTOP: pin + scrub ----------
      mm.add(`${MQ.fine} and ${MQ.noReduce} and (min-width: 720px)`, () => {
        const split = SplitText.create(h1.querySelectorAll("[data-line]"), { type: "chars", mask: "chars", aria: "none" });

        gsap.set(q("[data-layer=wire] > *"), { scaleX: 0, transformOrigin: "left center" });
        gsap.set(q("[data-layer=grid] > *"), { scaleY: 0, transformOrigin: "top" });
        gsap.set(split.chars, { yPercent: 110 });
        gsap.set(h1, { fontStretch: "62%", fontWeight: 400 });
        gsap.set(q("[data-layer=images] figure"), { autoAlpha: 0, yPercent: 30 });
        gsap.set(q("[data-ship]"), { autoAlpha: 0 });
        gsap.set(q("[data-layer=scan]"), { scaleX: 0, transformOrigin: "left" });
        // O código já está escrito quando o Boot revela o hero (entrada por
        // tempo, não por scroll: o estágio 0 nunca fica vazio).
        gsap.from(q("[data-layer=code] span"), { autoAlpha: 0, x: -6, stagger: 0.07, duration: 0.3, delay: 0.3 });

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: el,
            start: "top top",
            end: "+=350%",
            pin: true,
            scrub: 0.8,
            anticipatePin: 1,
            onUpdate: (st) => {
              const p = st.progress;
              setStage(p < 0.16 ? 0 : p < 0.32 ? 1 : p < 0.5 ? 2 : p < 0.66 ? 3 : p < 0.84 ? 4 : 5);
            },
          },
        });

        // 0 STRUCTURE — o wireframe se desenha a partir do código
        tl.to(q("[data-hint]"), { autoAlpha: 0, duration: 0.05 }, 0.02);
        tl.to(q("[data-layer=wire] > *"), { scaleX: 1, stagger: 0.02, duration: 0.12, ease: EASE.outExpo }, 0.02);
        // 1 DESIGN — grid desce, código recua
        tl.to(q("[data-layer=grid] > *"), { scaleY: 1, stagger: 0.008, duration: 0.12 }, 0.2);
        tl.to(q("[data-layer=code]"), { scale: 0.55, autoAlpha: 0.35, transformOrigin: "left top", duration: 0.12 }, 0.2);
        // 2 MOTION — letras sobem e a fonte se EXPANDE (62% → 125%)
        tl.to(split.chars, { yPercent: 0, stagger: 0.006, duration: 0.14, ease: EASE.outExpo }, 0.34);
        tl.to(h1, { fontStretch: "125%", fontWeight: 900, duration: 0.18, ease: EASE.smooth }, 0.38);
        tl.to(q("[data-layer=wire] > *"), { autoAlpha: 0.25, duration: 0.1 }, 0.44);
        // 3 INTERACTION — imagens entram nas células
        tl.to(q("[data-layer=images] figure"), { autoAlpha: 1, yPercent: 0, stagger: 0.04, duration: 0.14, ease: EASE.outExpo }, 0.52);
        // 4 EXPERIENCE — varredura em signal
        tl.to(q("[data-layer=scan]"), { scaleX: 1, duration: 0.1 }, 0.68);
        tl.to(q("[data-layer=scan]"), { autoAlpha: 0, duration: 0.06 }, 0.8);
        // 5 SHIP — estrutura some, composição final
        tl.to([q("[data-layer=wire]"), q("[data-layer=grid]"), q("[data-layer=code]")], { autoAlpha: 0, duration: 0.1 }, 0.84);
        tl.to(q("[data-layer=images] figure"), { autoAlpha: 0, yPercent: -10, stagger: 0.02, duration: 0.1 }, 0.84);
        tl.to(q("[data-ship]"), { autoAlpha: 1, stagger: 0.02, duration: 0.1 }, 0.9);

        return () => split.revert();
      });

      // ---------- MOBILE / REDUCED: sem pin ----------
      mm.add(`(max-width: 719px), ${MQ.coarse}, ${MQ.reduce}`, () => {
        setStage(5);
        gsap.set(q("[data-ship]"), { autoAlpha: 1 });
        gsap.set([q("[data-layer=wire]"), q("[data-layer=grid]"), q("[data-layer=scan]"), q("[data-hint]")], { display: "none" });
        gsap.set(q("[data-layer=images]"), { display: "none" });
        // Sem tween de font-stretch aqui: re-quebrar as linhas da headline
        // muda a altura do bloco (CLS) e repinta o LCP depois da hidratação.
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="top"
      data-act="ACT 02 / BUILD"
      data-inspect="HERO"
      className="relative flex min-h-[92svh] flex-col justify-between overflow-hidden px-margin pb-6 pt-nav md:min-h-[100svh] md:pb-8"
    >
      {/* GRID 12 (camada de design) */}
      <div data-layer="grid" aria-hidden="true" className="pointer-events-none absolute inset-x-margin inset-y-0 z-0 hidden md:grid" style={{ gridTemplateColumns: "repeat(12, minmax(0, 1fr))", columnGap: "var(--gutter)" }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className="block h-full border-l border-neutral last:border-r" />
        ))}
      </div>

      {/* WIREFRAME (camada de estrutura) */}
      <div data-layer="wire" aria-hidden="true" className="pointer-events-none absolute inset-x-margin top-nav bottom-8 z-0 hidden md:block">
        <span className="absolute inset-x-0 top-0 h-10 border border-dashed border-ink/50" />
        <span className="absolute inset-x-0 top-[14%] h-[52%] border border-dashed border-ink/50" />
        <span className="absolute bottom-0 left-0 h-16 w-[30%] border border-dashed border-ink/50" />
        <span className="absolute bottom-0 right-0 h-16 w-[30%] border border-dashed border-ink/50" />
        <span className="absolute right-0 top-[14%] h-[52%] w-[28%] border border-dashed border-ink/50" />
      </div>

      {/* CÓDIGO (estado zero) */}
      <pre data-layer="code" aria-hidden="true" className="t-code relative z-10 mt-5 text-ink md:absolute md:left-margin md:top-[calc(var(--nav-h)+3rem)] md:mt-0">
        {CODE.map((l) => (
          <span key={l} className="block">
            {l}
          </span>
        ))}
      </pre>

      {/* DICA DE SCROLL (estágio 0) */}
      <p data-hint aria-hidden="true" className="t-mono absolute bottom-6 left-margin z-10 hidden text-ink-3 md:block md:bottom-8">
        ↓ {s.scroll}
      </p>

      {/* VARREDURA (experience) */}
      <span data-layer="scan" aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/2 z-20 h-px bg-signal" />

      {/* ESTÁGIOS */}
      <ol data-layer="stages" aria-hidden="true" className="t-mono absolute right-margin top-[calc(var(--nav-h)+1.25rem)] z-10 hidden text-right text-ink-3 md:block md:top-[calc(var(--nav-h)+3rem)]">
        {s.stages.map((st, i) => (
          <li key={st} data-stage className="tnum transition-colors duration-fast [&.is-active]:text-ink [&.is-active]:signal-dot">
            0{i + 1} {st}
          </li>
        ))}
      </ol>

      {/* IMAGENS (interaction) — passam pela composição e somem no SHIP */}
      <div data-layer="images" aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 hidden md:block">
        {s.images.map((im, i) => (
          <figure
            key={im.src}
            className="absolute aspect-[16/10] overflow-hidden bg-neutral"
            style={
              i === 0
                ? { right: "var(--margin)", top: "34%", width: "17%" }
                : i === 1
                  ? { right: "calc(var(--margin) + 19%)", top: "22%", width: "11%" }
                  : { right: "calc(var(--margin) + 6%)", top: "66%", width: "12%" }
            }
          >
            <Image src={im.src} alt="" fill sizes="(min-width: 1080px) 18vw, 30vw" className="object-cover object-top grayscale" />
            <figcaption className="t-mono absolute bottom-1 left-1 text-paper mix-blend-difference">{im.n}</figcaption>
          </figure>
        ))}
      </div>

      {/* TIPOGRAFIA (o LCP) */}
      <div className="relative z-10 mt-auto pt-[18svh] md:pt-[22svh]">
        <h1 className="t-display t-display-xl text-ink" data-inspect="HERO_TITLE">
          {s.headline.map((line) => (
            <span key={line} data-line className="block md:whitespace-nowrap">
              {line}
            </span>
          ))}
        </h1>
      </div>

      {/* SHIP */}
      <div className="grid-12 relative z-10 mt-8 items-end t-mono">
        <ul data-ship className="col-span-4 space-y-0.5 md:col-span-4">
          {s.support.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <p data-ship className="col-span-2 text-ink-3 md:col-span-4 md:text-center">
          MW/001
        </p>
        <p data-ship className="col-span-2 text-right text-ink-3 md:col-span-4">
          <span className="signal-dot" />
          {s.inspect}
        </p>
      </div>
    </section>
  );
}
