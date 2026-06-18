"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";

/**
 * Envolve um elemento e o faz "seguir" sutilmente o cursor (efeito magnético).
 * Só ativa em ponteiros com hover (desktop) e respeita prefers-reduced-motion.
 */
export function Magnetic({
  children,
  strength = 0.4,
  className = "",
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const canHover = window.matchMedia("(hover: hover)").matches;
      if (reduce || !canHover) return;

      const xTo = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3" });

      const move = (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * strength);
        yTo((e.clientY - r.top - r.height / 2) * strength);
      };
      const leave = () => {
        xTo(0);
        yTo(0);
      };

      el.addEventListener("mousemove", move);
      el.addEventListener("mouseleave", leave);
      return () => {
        el.removeEventListener("mousemove", move);
        el.removeEventListener("mouseleave", leave);
      };
    },
    { scope: ref },
  );

  return (
    <span ref={ref} className={"inline-block " + className}>
      {children}
    </span>
  );
}
