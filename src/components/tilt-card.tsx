"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";

/**
 * Tilt 3D + spotlight: o card inclina sutilmente na direção do cursor
 * (GSAP quickTo, mesma técnica do magnetic.tsx) e a borda acende um
 * gradiente radial que acompanha o mouse (anel via .spotlight-ring no
 * globals). Só ativa em ponteiros finos com hover; respeita
 * prefers-reduced-motion. O conteúdo chega server-rendered via children.
 */
export function TiltCard({
  children,
  strength = 5,
  className = "",
}: {
  children: ReactNode;
  /** Inclinação máxima em graus (por eixo). */
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
      if (reduce || !fine) return;

      gsap.set(el, { transformPerspective: 900 });
      const rxTo = gsap.quickTo(el, "rotationX", { duration: 0.5, ease: "power3" });
      const ryTo = gsap.quickTo(el, "rotationY", { duration: 0.5, ease: "power3" });

      const move = (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - r.left) / r.width - 0.5;
        const dy = (e.clientY - r.top) / r.height - 0.5;
        ryTo(dx * strength * 2);
        rxTo(-dy * strength * 2);
        el.style.setProperty("--spot-x", `${e.clientX - r.left}px`);
        el.style.setProperty("--spot-y", `${e.clientY - r.top}px`);
      };
      const leave = () => {
        rxTo(0);
        ryTo(0);
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
    <div ref={ref} className={"group/tilt relative " + className}>
      {children}
      <div
        aria-hidden
        className="spotlight-ring pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover/tilt:opacity-100"
      />
    </div>
  );
}
