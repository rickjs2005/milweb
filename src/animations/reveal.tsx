"use client";

import { useRef, type ReactNode } from "react";
import { gsap, EASE, MQ, useGSAP } from "@/animations/gsap";

/**
 * Primitiva de motion SECUNDÁRIO: revela uma vez ao entrar na viewport.
 * Usar com parcimônia — capítulos de case, listas editoriais. Nunca em
 * toda seção. `rule` também desenha a régua-filha ([data-rule]) da esquerda.
 */
export function Reveal({ children, className = "", as: Tag = "div", delay = 0 }: { children: ReactNode; className?: string; as?: "div" | "section" | "li" | "figure"; delay?: number }) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const el = ref.current!;
      const mm = gsap.matchMedia();
      mm.add(MQ.noReduce, () => {
        const rule = el.querySelector<HTMLElement>("[data-rule]");
        const items = el.querySelectorAll<HTMLElement>("[data-reveal]");
        const targets = items.length ? items : [el];
        const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 85%", once: true }, delay });
        if (rule) tl.from(rule, { scaleX: 0, transformOrigin: "left", duration: 0.9, ease: EASE.outExpo }, 0);
        tl.from(targets, { y: 24, autoAlpha: 0, stagger: 0.08, duration: 0.8, ease: EASE.outExpo }, 0.05);
      });
      return () => mm.revert();
    },
    { scope: ref },
  );
  const T = Tag as "div";
  return (
    <T ref={ref as React.Ref<HTMLDivElement>} className={className}>
      {children}
    </T>
  );
}
