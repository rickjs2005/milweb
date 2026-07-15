"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";

/**
 * Glow radial fixo que segue o cursor pelo site inteiro (fora do fluxo,
 * pointer-events-none). Só ativa em ponteiros com hover e respeita
 * prefers-reduced-motion. Cor herda --accent do tema (dark/light).
 */
export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canHover = window.matchMedia("(hover: hover)").matches;
    if (reduce || !canHover) return;

    const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3" });

    const move = (e: MouseEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
    };
    const enter = () => gsap.to(el, { autoAlpha: 1, duration: 0.3 });
    const leave = () => gsap.to(el, { autoAlpha: 0, duration: 0.3 });

    gsap.set(el, { autoAlpha: 0, xPercent: -50, yPercent: -50 });

    window.addEventListener("mousemove", move);
    document.documentElement.addEventListener("mouseenter", enter);
    document.documentElement.addEventListener("mouseleave", leave);
    return () => {
      window.removeEventListener("mousemove", move);
      document.documentElement.removeEventListener("mouseenter", enter);
      document.documentElement.removeEventListener("mouseleave", leave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[60] h-[38vmax] w-[38vmax] rounded-full opacity-0 blur-3xl will-change-transform"
      style={{
        background:
          "radial-gradient(circle, rgb(var(--accent) / 0.16) 0%, rgb(var(--accent) / 0.06) 45%, transparent 70%)",
      }}
    />
  );
}
