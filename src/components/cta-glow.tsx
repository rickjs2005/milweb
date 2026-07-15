"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Glow do CTA final com "clímax": intensifica (opacidade + escala) conforme
 * a seção entra na tela (scrub). Em ponteiro grosso/reduced-motion fica no
 * estado final estático — o mesmo visual do glow fixo que existia antes.
 */
export function CtaGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const fine = window.matchMedia("(pointer: fine)").matches;
      if (reduce || !fine) return;

      gsap.fromTo(
        el,
        { opacity: 0.35, scale: 0.7 },
        {
          opacity: 1,
          scale: 1.25,
          ease: "none",
          scrollTrigger: {
            trigger: el.parentElement,
            start: "top 90%",
            end: "center 55%",
            scrub: 0.5,
          },
        },
      );
    },
    { scope: ref },
  );

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-0 h-72 w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/25 blur-[120px]"
    />
  );
}
