"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Milo, type MiloPose } from "./milo";

const SLEEP_AFTER_MS = 12_000;
const NEAR_PX = 130;

/**
 * Milo que segue o cursor com o olhar (estilo state machine do Rive,
 * mas 100% em código): um pointermove global, com rAF, escreve as CSS
 * vars --milo-lx/--milo-ly direto no DOM — o rosto do SVG desloca até
 * ±6px na direção do mouse. Zero re-render no rastreio.
 *
 * Por cima disso, um humor interno (raro, aí sim com re-render):
 * - cursor perto (< NEAR_PX) → carinha feliz;
 * - clique/toque → acena com o braço + pulinho (funciona em touch);
 * - 12s sem mexer o mouse → cochila (zZ) e acorda assustado.
 * Em touch só o toque reage; em prefers-reduced-motion nada anima
 * (o Milo continua o de sempre).
 */
export function MiloLive({ pose, className }: { pose?: MiloPose; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [mood, setMood] = useState<MiloPose>("idle");
  const [waving, setWaving] = useState(false);
  const moodRef = useRef(mood);
  moodRef.current = mood;
  const timersRef = useRef<{ sleep?: number; wave?: number; wake?: number }>({});

  // Aceno de "oi" no clique/toque — o único gesto que também roda em touch.
  const greet = useCallback(() => {
    const t = timersRef.current;
    setWaving(true);
    setMood("happy");
    window.clearTimeout(t.wave);
    t.wave = window.setTimeout(() => {
      setWaving(false);
      setMood((m) => (m === "happy" ? "idle" : m));
    }, 1400);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;

    const timers = timersRef.current;
    const armSleep = () => {
      window.clearTimeout(timers.sleep);
      timers.sleep = window.setTimeout(() => setMood("sleepy"), SLEEP_AFTER_MS);
    };
    armSleep();

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

      // Humor por proximidade — só transiciona quando muda de verdade.
      const m = moodRef.current;
      if (dist < NEAR_PX && m === "idle") setMood("happy");
      else if (dist >= NEAR_PX && m === "happy") setMood("idle");
    };
    const onMove = (e: PointerEvent) => {
      lastX = e.clientX;
      lastY = e.clientY;
      if (!raf) raf = requestAnimationFrame(paint);
      armSleep();
      if (moodRef.current === "sleepy") {
        // Acorda assustado, depois volta ao normal.
        setMood("shocked");
        window.clearTimeout(timers.wake);
        timers.wake = window.setTimeout(() => {
          setMood((cur) => (cur === "shocked" ? "idle" : cur));
        }, 700);
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
      window.clearTimeout(timers.sleep);
      window.clearTimeout(timers.wake);
    };
  }, []);

  useEffect(() => {
    const timers = timersRef.current;
    return () => window.clearTimeout(timers.wave);
  }, []);

  return (
    <div
      ref={ref}
      className={waving ? "milo-bounce" : undefined}
      onPointerDown={greet}
      style={{ cursor: "pointer" }}
    >
      <Milo pose={pose ?? mood} waving={waving} className={className} />
    </div>
  );
}
