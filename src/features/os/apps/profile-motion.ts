"use client";

import { useEffect, useLayoutEffect, type RefObject } from "react";

/**
 * Movimento do app Perfil: entrada uma vez por abertura, leitura (rolagem do
 * corpo da janela) e altura animada para resumo e acordeões. Tudo respeita
 * `prefers-reduced-motion` e Ajustes › movimento reduzido (`html[data-os-motion]`),
 * e cada gancho limpa listeners, observers e tweens ao fechar o app.
 */

/** Sem movimento: preferência do sistema ou Ajustes. */
export function noMotion(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.osMotion === "reduce";
}

const EASE_OUT = "cubic-bezier(.16, 1, .3, 1)";

/**
 * Entrada: foto e nome → cargo e resumo → ações e navegação, com opacidade e deslocamento pequeno
 * (340–420 ms, sobrepostos). Uma vez por montagem (= por abertura); nunca em re-render.
 * Os alvos nascem visíveis no HTML (SSR, sem JS, movimento reduzido) e só ficam ocultos no instante
 * em que o módulo do GSAP assume — sem flash. Só a opacidade muda: os botões continuam no DOM,
 * clicáveis e focáveis durante a entrada. Com a tela de carregamento à frente (acesso direto), a
 * sequência espera a marca `data-os-booted` para não acontecer atrás da cortina. Rede de segurança:
 * se o módulo demorar, a marca cai sozinha e tudo aparece.
 */
export function useEntrance(root: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const el = root.current;
    if (!el || noMotion()) return;
    const steps = [1, 2, 3].map((n) => [...el.querySelectorAll<HTMLElement>(`[data-enter="${n}"]`)]);
    if (!steps[0].length) return;
    el.dataset.entering = "1";
    let cancelled = false;
    let tl: { kill(): void } | null = null;
    let mo: MutationObserver | null = null;
    const reveal = () => {
      delete el.dataset.entering;
      for (const group of steps) {
        for (const node of group) {
          node.style.removeProperty("opacity");
          node.style.removeProperty("transform");
        }
      }
    };
    const safety = window.setTimeout(reveal, 4000);
    const start = () => {
      import("@/animations/gsap")
        .then(({ gsap, EASE }) => {
          if (cancelled) return;
          const t = gsap.timeline({
            defaults: { ease: EASE.outExpo },
            onComplete: () => {
              window.clearTimeout(safety);
              reveal();
            },
          });
          t.fromTo(steps[0], { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.42, stagger: 0.06 }, 0.06)
            .fromTo(steps[1], { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.05 }, "-=0.3")
            .fromTo(steps[2], { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.34, stagger: 0.035 }, "-=0.28");
          tl = t;
          // o GSAP já gravou opacity 0 inline (fromTo renderiza de imediato): a marca de CSS pode sair.
          delete el.dataset.entering;
        })
        .catch(() => {
          window.clearTimeout(safety);
          reveal();
        });
    };
    const booted = () => !!document.documentElement.dataset.osBooted;
    if (booted()) start();
    else {
      mo = new MutationObserver(() => {
        if (!booted()) return;
        mo?.disconnect();
        mo = null;
        start();
      });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-os-booted"] });
    }
    return () => {
      cancelled = true;
      window.clearTimeout(safety);
      mo?.disconnect();
      tl?.kill();
      reveal();
    };
  }, [root]);
}

/**
 * Leitura: chama `onFrame` (no máximo uma vez por frame) a cada rolagem ou redimensionamento, com a
 * altura visível e o contêiner de rolagem — o corpo da janela (`data-os-scroller`) ou, no modo
 * simples, a própria página (null).
 */
export function useReading(root: RefObject<HTMLElement | null>, onFrame: (viewH: number, scroller: HTMLElement | null) => void) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const scroller = el.closest<HTMLElement>("[data-os-scroller]");
    const target: EventTarget = scroller ?? window;
    let raf = 0;
    const run = () => {
      raf = 0;
      onFrame(scroller ? scroller.clientHeight : window.innerHeight, scroller);
    };
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(run);
    };
    target.addEventListener("scroll", queue, { passive: true });
    const ro = new ResizeObserver(queue);
    ro.observe(el);
    // a janela (desktop) e a tela (telefone) entram com transform: as medidas feitas na montagem saem
    // deslocadas. Recalcular quando a animação/transição da janela termina e em dois instantes de segurança.
    const frame = scroller?.closest<HTMLElement>(".os-window") ?? null;
    frame?.addEventListener("animationend", queue);
    frame?.addEventListener("transitionend", queue);
    const timers = [600, 1400].map((ms) => window.setTimeout(queue, ms));
    run();
    return () => {
      target.removeEventListener("scroll", queue);
      frame?.removeEventListener("animationend", queue);
      frame?.removeEventListener("transitionend", queue);
      for (const t of timers) window.clearTimeout(t);
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [root, onFrame]);
}

/**
 * Anima a altura de um bloco entre dois estados (WAAPI; transform/opacity não servem para altura).
 * `onDone` roda no fim, antes de a animação ser cancelada — é o momento de confirmar o estado no DOM
 * (fechar o details, recolher o resumo) sem um frame de salto. Devolve null sem movimento.
 */
export function animateHeight(el: HTMLElement, from: number, to: number, onDone?: () => void, ms = 280): Animation | null {
  if (noMotion() || Math.abs(from - to) < 1 || typeof el.animate !== "function") return null;
  el.style.overflow = "hidden";
  const a = el.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: ms, easing: EASE_OUT, fill: "both" });
  const clear = () => el.style.removeProperty("overflow");
  a.addEventListener("finish", () => {
    onDone?.();
    a.cancel();
    clear();
  });
  a.addEventListener("cancel", clear);
  return a;
}
