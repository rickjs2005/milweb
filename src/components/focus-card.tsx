"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * "Faixa de foco" — variação do sticky-stack do Processo (05) pensada pra
 * listas com MUITOS cards pequenos (Deliverables, Why), onde empilhar de
 * verdade (StackCard) alongaria a rolagem demais: a pista de 14vh por card
 * × 6-9 itens vira quase uma tela de "vazio" só pra ver a seção inteira.
 *
 * Aqui não há sticky nem pista: o card cresce e clareia sozinho quando
 * cruza a faixa central da tela, e encolhe/escurece ao se afastar — mesma
 * sensação de profundidade viva no scroll do Processo, sem alongar a
 * seção. Mesma receita de performance do stack-card.tsx: um listener de
 * scroll compartilhado entre todos os FocusCard da página, rAF-throttled,
 * escrevendo direto no style (zero re-render, zero GSAP/ScrollTrigger —
 * essas duas coisas já se provaram frágeis em mobile neste projeto, ver
 * comentário no hero-anim.tsx sobre o TBT/LCP que o SplitText causou).
 *
 * SÓ mobile/touch (pedido do Rick, 12/08): no ponteiro fino o Reveal em
 * modo scrub já cuida da entrada dos cards; um segundo efeito contínuo ali
 * brigaria à toa com o hover deles.
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

export function FocusCard({
  children,
  className = "",
  scale = true,
}: {
  children: ReactNode;
  className?: string;
  /** false pra listas em "tabela" com bordas/gap-px encostadas (Why): a
   *  célula crescer estoura o grid apertado e desalinha as divisórias —
   *  ali só o brilho lê "foco" sem mexer na geometria. */
  scale?: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (fine || reduce) return; // só mobile/touch — ver comentário acima

    const update = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const center = r.top + r.height / 2;
      // 0 no centro da tela, 1 na borda — banda de foco de meia tela.
      const dist = Math.min(1, Math.abs(center - vh / 2) / (vh * 0.5));
      const focus = 1 - dist; // 1 = centralizado, 0 = na borda
      el.style.setProperty("--focus-scale", scale ? `${(1 + focus * 0.035).toFixed(4)}` : "1");
      el.style.setProperty("--focus-dim", `${(0.72 + focus * 0.28).toFixed(3)}`);
    };
    registry.add(update);
    ensureListener();
    requestRun();
    return () => {
      registry.delete(update);
    };
  }, [scale]);

  return (
    <div
      ref={ref}
      style={{
        transform: "scale(var(--focus-scale, 1))",
        filter: "brightness(var(--focus-dim, 1))",
      }}
      className={className}
    >
      {children}
    </div>
  );
}
