"use client";

import { useEffect } from "react";

const CODE = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
  "b", "a",
];

const COLORS = ["#38bdf8", "#7dd3fc", "#a78bfa", "#34d399", "#fbbf24", "#fb7185"];

/** Explosão de confete em canvas — sem dependências, remove-se sozinha. */
function burstConfetti() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.createElement("canvas");
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  canvas.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:100;";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }

  const cx = innerWidth / 2;
  const cy = innerHeight * 0.35;
  const parts = Array.from({ length: 140 }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 5 + Math.random() * 11;
    return {
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 4,
      w: 5 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.35,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      life: 1,
    };
  });

  let raf = 0;
  const tick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = 0;
    for (const p of parts) {
      p.vy += 0.22;
      p.vx *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life -= 0.008;
      if (p.life <= 0 || p.y > canvas.height + 40) continue;
      alive++;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.4));
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (alive > 0) {
      raf = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(raf);
      canvas.remove();
    }
  };
  raf = requestAnimationFrame(tick);
}

/**
 * Easter egg: o Konami code (↑↑↓↓←→←→BA) liga o "modo festa" (paleta girando
 * em hue + confete). Uma dica fica no console pra quem abrir o DevTools —
 * dev curioso é exatamente o tipo de visitante que indica a MilWeb.
 */
export function Konami() {
  useEffect(() => {
    console.info(
      "%c🤖 Milo diz: oi, dev! Curioso, hein?\n%c↑ ↑ ↓ ↓ ← → ← → B A — experimenta.\n%cFeito pela MilWeb → https://milweb.com.br",
      "color:#38bdf8;font-size:14px;font-weight:bold",
      "color:#94a3b8",
      "color:#64748b",
    );

    let i = 0;
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      i = key === CODE[i] ? i + 1 : key === CODE[0] ? 1 : 0;
      if (i === CODE.length) {
        i = 0;
        document.documentElement.classList.toggle("party");
        burstConfetti();
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  return null;
}
