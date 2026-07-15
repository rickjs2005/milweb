"use client";

import { useRef, type ElementType } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

/**
 * Título com reveal palavra por palavra (SplitText + mask), disparado UMA
 * vez ao entrar na viewport (ScrollTrigger `toggleActions`, não scrub — o
 * mesmo padrão que corrigiu o bug de conteúdo preso invisível em /lab).
 * Só roda em ponteiro fino sem prefers-reduced-motion; fora disso o texto
 * fica estático direto (nunca aplica classe/estilo oculto fora do bloco
 * gated, então nunca pode ficar preso invisível).
 */
export function SplitHeading({
  children,
  as: Tag = "h2",
  className = "",
}: {
  children: string;
  as?: ElementType;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const fine = window.matchMedia("(pointer: fine)").matches;
      if (reduce || !fine) return;

      const split = SplitText.create(el, { type: "words", mask: "words" });
      // Perto do fim da página o range do scrub não é alcançável (não dá
      // pra rolar além do fim) -- cai pro disparo único.
      const elTop = el.getBoundingClientRect().top + window.scrollY;
      const reachable =
        elTop <= document.documentElement.scrollHeight - window.innerHeight * 0.45 - 10;
      gsap.from(split.words, {
        yPercent: 100,
        autoAlpha: 0,
        stagger: 0.06,
        duration: 0.7,
        ease: reachable ? "none" : "power4.out",
        scrollTrigger: reachable
          ? { trigger: el, start: "top 92%", end: "top 60%", scrub: 0.5 }
          : { trigger: el, start: "top 85%", toggleActions: "play none none none" },
      });
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
