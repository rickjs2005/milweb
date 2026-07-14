"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Card de uma pilha "sticky stack": fica parado (position: sticky) numa
 * altura fixa enquanto o próximo card sobe por cima dele, e recebe um leve
 * scale-down + esmaecimento conforme vai sendo coberto -- o "efeito de
 * outros sites" (Stripe/Linear/Apple costumam usar essa mesma receita:
 * sticky + leitura da posição do próximo elemento a cada frame de scroll).
 * Também cuida da entrada (fade-up ao entrar na viewport) sozinho -- não dá
 * pra usar <Reveal> por fora porque isso quebraria a cadeia de irmãos
 * diretos no DOM (`nextElementSibling`) que o cálculo do "quem está me
 * cobrindo" depende.
 *
 * Um único listener de scroll (compartilhado via closure do módulo,
 * rAF-throttled) cuida de todos os StackCard da página -- mutação direta de
 * `style` via ref, sem re-render React, pra ficar suave a 60fps.
 */
const registry = new Set<() => void>();
let rafId: number | null = null;
let listenerAttached = false;

function runAll() {
  rafId = null;
  for (const update of registry) update();
}

function requestRun() {
  if (rafId !== null) return;
  rafId = requestAnimationFrame(runAll);
}

function ensureListener() {
  if (listenerAttached || typeof window === "undefined") return;
  listenerAttached = true;
  window.addEventListener("scroll", requestRun, { passive: true });
  window.addEventListener("resize", requestRun, { passive: true });
}

export function StackCard({
  top,
  zIndex,
  delay = 0,
  className = "",
  children,
}: {
  /** offset em px onde este card gruda no topo (deve bater com o CSS `top`). */
  top: number;
  /** cards depois na lista devem cobrir os anteriores -- passe um valor crescente. */
  zIndex?: number;
  delay?: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Entrada: fade-up ao entrar na viewport (mesma receita do <Reveal />).
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            el.style.transition = `opacity 700ms ease-out ${delay}ms, transform 700ms ease-out ${delay}ms`;
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
            io.disconnect();
          }
        },
        { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
      );
      io.observe(el);
      var fallback = setTimeout(() => {
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
        io.disconnect();
      }, 1200);
    }

    // Empilhamento: esmaece/encolhe conforme o próximo card se aproxima.
    ensureListener();
    const update = () => {
      // No desktop o card vira `md:static` (grid normal, sem stack) -- só
      // roda o cálculo de cobertura enquanto o CSS realmente o deixa sticky.
      if (getComputedStyle(el).position !== "sticky") {
        el.style.setProperty("--stack-scale", "1");
        el.style.setProperty("--stack-dim", "1");
        return;
      }
      const next = el.nextElementSibling as HTMLElement | null;
      if (!next) return;
      const nextTop = next.getBoundingClientRect().top;
      // Distancia (px) de scroll ao longo da qual o proximo card "engole" este.
      const range = 220;
      const progress = Math.min(1, Math.max(0, (top + range - nextTop) / range));
      const scale = 1 - progress * 0.06;
      const dim = 1 - progress * 0.45;
      el.style.setProperty("--stack-scale", `${scale}`);
      el.style.setProperty("--stack-dim", `${dim}`);
    };
    registry.add(update);
    requestRun();

    return () => {
      registry.delete(update);
      clearTimeout(fallback);
    };
  }, [top, delay]);

  return (
    <div
      ref={ref}
      style={{
        top: `${top}px`,
        zIndex,
        transformOrigin: "top center",
        opacity: 0,
        transform: "translateY(20px) scale(var(--stack-scale, 1))",
        filter: "brightness(var(--stack-dim, 1))",
      }}
      className={className}
    >
      {children}
    </div>
  );
}
