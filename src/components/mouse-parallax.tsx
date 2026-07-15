"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";

/**
 * Parallax de mouse site-wide: todo elemento com `data-depth="0.3"` desliza
 * na direção oposta ao cursor, proporcional à profundidade (fundos com
 * depth alto se movem mais que conteúdo com depth baixo — é a diferença de
 * velocidade entre camadas que cria a sensação 3D). GSAP quickTo por
 * elemento (mesma técnica do magnetic/cursor-glow), um único listener de
 * pointermove. Só em desktop com ponteiro fino; reduced-motion desliga.
 *
 * IMPORTANTE: marque com data-depth apenas elementos que NÃO recebem
 * transform de outra animação (Reveal, tweens GSAP próprios) — dois
 * escritores no mesmo transform brigam. Containers de elementos animados
 * são seguros (o transform do pai não conflita com o dos filhos).
 */
const RANGE = 110; // px de deslocamento máximo por unidade de depth

export function MouseParallax() {
  const pathname = usePathname();

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;

    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-depth]"));
    if (!els.length) return;

    const setters = els.map((el) => ({
      depth: parseFloat(el.dataset.depth ?? "0") || 0,
      x: gsap.quickTo(el, "x", { duration: 0.8, ease: "power3" }),
      y: gsap.quickTo(el, "y", { duration: 0.8, ease: "power3" }),
    }));

    const move = (e: PointerEvent) => {
      const dx = e.clientX / window.innerWidth - 0.5;
      const dy = e.clientY / window.innerHeight - 0.5;
      for (const s of setters) {
        s.x(-dx * s.depth * RANGE);
        s.y(-dy * s.depth * RANGE);
      }
    };

    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      for (const s of setters) {
        s.x(0);
        s.y(0);
      }
    };
    // re-registra os alvos a cada rota (novas seções montam com data-depth)
  }, [pathname]);

  return null;
}
