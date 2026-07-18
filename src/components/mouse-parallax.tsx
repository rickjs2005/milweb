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

/** Equivalente pro touch: os MESMOS alvos [data-depth] (título de cada
 * seção, glow/foto do hero...) deslizam pela posição de SCROLL em vez do
 * cursor. Mutuamente exclusivo com o parallax de mouse acima -- ativa
 * exatamente onde aquele NÃO ativa (`!fine`), então nunca os dois escrevem
 * no mesmo transform ao mesmo tempo. Um listener de scroll passive + rAF,
 * escreve direto no style (zero setState/re-render por frame), mesma
 * técnica já validada pela barra de progresso da nav. Existia zero
 * animação contínua no mobile antes disso -- só o fade-in único do Reveal. */
const SCROLL_SCALE = 100; // px de deslocamento máximo (depth=1) ao atravessar a tela inteira

export function MouseParallax() {
  const pathname = usePathname();

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-depth]"));
    if (!els.length) return;

    if (fine) {
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
    }

    // Ramo touch: mesma lista de alvos, movidos pelo scroll.
    const items = els.map((el) => ({ el, depth: parseFloat(el.dataset.depth ?? "0") || 0 }));
    let raf = 0;
    const tick = () => {
      const vh = window.innerHeight;
      for (const { el, depth } of items) {
        const r = el.getBoundingClientRect();
        const ratio = (r.top + r.height / 2 - vh / 2) / vh; // ~-0.5..0.5 ao cruzar a tela
        el.style.transform = `translateY(${(-ratio * depth * SCROLL_SCALE).toFixed(2)}px)`;
      }
      raf = 0;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
      for (const { el } of items) el.style.transform = "";
    };
    // re-registra os alvos a cada rota (novas seções montam com data-depth)
  }, [pathname]);

  return null;
}
