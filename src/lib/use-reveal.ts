"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export type RevealVariant = "rise" | "stagger" | "clip" | "scale";

/**
 * Revela os filhos marcados com [data-reveal] quando a seção entra na viewport.
 * Cada seção escolhe uma `variant` diferente — é o que evita o "cheiro de
 * template" de uma animação única repetida em todo lugar.
 *
 * Respeita prefers-reduced-motion: sem movimento, conteúdo já visível.
 * Filosofia fail-safe: se o JS não rodar, o HTML continua visível (o estado
 * inicial escondido só é aplicado pelo GSAP, no cliente).
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  variant: RevealVariant = "rise",
) {
  const scope = useRef<T>(null);

  useGSAP(
    () => {
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (reduce) return;

      const targets = scope.current?.querySelectorAll("[data-reveal]");
      if (!targets || targets.length === 0) return;

      const trigger = {
        trigger: scope.current,
        start: "top 82%",
        once: true,
      } as const;

      if (variant === "stagger") {
        gsap.from(targets, {
          scrollTrigger: trigger,
          y: 28,
          opacity: 0,
          duration: 0.8,
          stagger: 0.08,
          ease: "power3.out",
        });
      } else if (variant === "clip") {
        gsap.from(targets, {
          scrollTrigger: trigger,
          clipPath: "inset(0 0 100% 0)",
          y: 16,
          opacity: 0,
          duration: 1,
          stagger: 0.1,
          ease: "power4.out",
        });
      } else if (variant === "scale") {
        gsap.from(targets, {
          scrollTrigger: trigger,
          scale: 0.94,
          opacity: 0,
          duration: 0.9,
          stagger: 0.1,
          ease: "power3.out",
        });
      } else {
        // rise (padrão)
        gsap.from(targets, {
          scrollTrigger: trigger,
          y: 40,
          opacity: 0,
          duration: 0.9,
          stagger: 0.12,
          ease: "power3.out",
        });
      }
    },
    { scope },
  );

  return scope;
}
