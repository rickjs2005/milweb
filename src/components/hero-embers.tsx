"use client";

import { useEffect, useRef } from "react";

/**
 * Brasas subindo na escuridão do hero — fogueira na noite. Canvas 2D
 * minúsculo (~22 partículas no desktop, 10 no mobile): cada brasa nasce no
 * pé da seção, sobe devagar com balanço senoidal, cintila e apaga conforme
 * ganha altura. Pausa fora da viewport (IntersectionObserver) e não monta
 * em reduced-motion. Faz parte da identidade fogo+escuridão (12/08) — é
 * brasa de verdade, não "glow ambiente".
 */
const COLORS = ["#f2b04a", "#e8722c", "#d8430f", "#ffc37a"];

type Ember = {
  x: number;
  y: number;
  r: number;
  v: number; // px/s de subida
  sway: number; // amplitude do balanço
  phase: number;
  color: string;
  twinkle: number; // frequência da cintilação
};

export function HeroEmbers() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.max(1, w * dpr);
      canvas.height = Math.max(1, h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const count = window.matchMedia("(min-width: 768px)").matches ? 22 : 10;
    const spawn = (anywhere = false): Ember => ({
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : h + 6,
      r: 0.8 + Math.random() * 1.8,
      v: 12 + Math.random() * 22,
      sway: 6 + Math.random() * 14,
      phase: Math.random() * Math.PI * 2,
      color: COLORS[(Math.random() * COLORS.length) | 0]!,
      twinkle: 0.5 + Math.random() * 1.5,
    });
    const embers: Ember[] = Array.from({ length: count }, () => spawn(true));

    let raf = 0;
    let visible = true;
    let last = performance.now();

    const loop = () => {
      if (!visible) {
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < embers.length; i++) {
        const e = embers[i]!;
        e.y -= e.v * dt;
        e.phase += dt * e.twinkle;
        if (e.y < -8) {
          embers[i] = spawn();
          continue;
        }
        // mais viva perto do chão, apagando conforme sobe + cintilação
        const heightFade = Math.max(0, Math.min(1, e.y / h));
        const a = (heightFade * 0.55 + 0.08) * (0.6 + 0.4 * Math.sin(e.phase * 2.3));
        ctx.globalAlpha = Math.max(0.04, Math.min(0.8, a));
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(e.x + Math.sin(e.phase) * e.sway, e.y, e.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      if (visible && !raf) {
        last = performance.now();
        loop();
      }
    });
    io.observe(canvas);
    loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 z-[1] h-full w-full" />;
}
