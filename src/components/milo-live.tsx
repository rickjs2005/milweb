"use client";

import { useEffect, useRef } from "react";
import { Milo, type MiloPose } from "./milo";

/**
 * Milo que segue o cursor com o olhar (estilo state machine do Rive,
 * mas 100% em código): um pointermove global, com rAF, escreve as CSS
 * vars --milo-lx/--milo-ly direto no DOM — o rosto do SVG desloca até
 * ±6px na direção do mouse. Zero re-render; nada roda em touch nem em
 * prefers-reduced-motion (o Milo continua o de sempre).
 */
export function MiloLive({ pose, className }: { pose?: MiloPose; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let lastX = 0;
    let lastY = 0;
    const paint = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      if (!r.width) return;
      // Centro da "cabeça" (parte de cima do SVG), não do wrapper todo.
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height * 0.3;
      const dx = lastX - cx;
      const dy = lastY - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const reach = Math.min(1, dist / 260);
      el.style.setProperty("--milo-lx", `${((dx / dist) * 6 * reach).toFixed(1)}px`);
      el.style.setProperty("--milo-ly", `${((dy / dist) * 4 * reach).toFixed(1)}px`);
    };
    const onMove = (e: PointerEvent) => {
      lastX = e.clientX;
      lastY = e.clientY;
      if (!raf) raf = requestAnimationFrame(paint);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref}>
      <Milo pose={pose} className={className} />
    </div>
  );
}
