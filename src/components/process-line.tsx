"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Linha de timeline do Processo (desktop lg+, onde o grid tem 4 colunas):
 * cresce com o scroll (scrub) e acende um ponto no centro de cada etapa.
 * Mobile usa o sticky-stack do StackCard e não renderiza isto; ponteiro
 * grosso/reduced-motion recebem a linha completa estática (fallback
 * honesto, nunca escondida).
 */
export function ProcessLine({ steps = 4 }: { steps?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const fine = window.matchMedia("(pointer: fine)").matches;
      if (reduce || !fine) return; // fica no estado estático completo

      const line = root.querySelector<HTMLElement>("[data-line]");
      const dots = root.querySelectorAll<HTMLElement>("[data-dot]");
      if (!line) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top 80%",
          end: "top 35%",
          scrub: 0.5,
        },
      });
      tl.fromTo(line, { scaleX: 0 }, { scaleX: 1, ease: "none", duration: 1 }, 0);
      dots.forEach((dot, i) => {
        tl.fromTo(
          dot,
          { scale: 0, autoAlpha: 0 },
          { scale: 1, autoAlpha: 1, duration: 0.08, ease: "back.out(2)" },
          // o ponto acende quando a linha alcança o centro da etapa
          ((i + 0.5) / steps) * 0.92,
        );
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} aria-hidden className="relative mb-6 hidden h-3 lg:block">
      {/* trilho apagado */}
      <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-line/15" />
      {/* linha que cresce */}
      <div
        data-line
        className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 origin-left bg-gradient-to-r from-accent via-accent to-accent-soft shadow-[0_0_12px_rgb(var(--accent)/0.6)]"
      />
      {/* um ponto no centro de cada etapa */}
      {Array.from({ length: steps }).map((_, i) => (
        <span
          key={i}
          data-dot
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent bg-bg shadow-[0_0_10px_rgb(var(--accent)/0.8)]"
          style={{ left: `${((i + 0.5) / steps) * 100}%` }}
        >
          <span className="absolute inset-[3px] rounded-full bg-accent" />
        </span>
      ))}
    </div>
  );
}
