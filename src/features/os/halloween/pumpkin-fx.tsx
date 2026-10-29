"use client";

import { useEffect } from "react";

/**
 * Abóboras vivas. Cada abóbora ganha, DENTRO da placa (então segue a flutuação e a inclinação), duas pupilas
 * escuras que acompanham o ponteiro de forma limitada e um punhado de faíscas que sobem no hover/foco; o
 * CSS faz o resto (luz interna mais intensa, pulso no clique). O botão (a área de clique) e o rótulo ficam
 * parados — nada aqui é focável nem intercepta o ponteiro.
 *
 * `PumpkinFxHost` (montado uma vez na área de trabalho, só durante o evento) é o único listener: no hover,
 * inclina a abóbora em direção ao ponteiro (variáveis CSS `--tx/--ty`, ±9°, em `rotateX/rotateY` — não
 * disputa o `translate/rotate` da flutuação) e move as pupilas (±3 px). No clique, marca `data-pulse` por
 * ~0,5 s para o anel de luz; a navegação não espera por isso. Movimento reduzido: sem inclinação nem pupilas
 * móveis, só o pulso de luz.
 */
export type FxVariant = "a" | "b" | "c";
export const VARIANT_OF: Record<string, FxVariant> = { projects: "a", services: "b", studio: "c", lab: "a", profile: "b", contact: "c", about: "b", settings: "a", search: "c" };

export function PumpkinFx({ variant }: { variant: FxVariant }) {
  return (
    <span className="hw-fx" data-variant={variant} aria-hidden="true">
      <i className="hw-pup hw-pup--l" />
      <i className="hw-pup hw-pup--r" />
      {[0, 1, 2, 3, 4, 5].map((k) => (
        <b key={k} className="hw-spark" style={{ ["--a" as string]: `${-115 + k * 46}deg`, ["--d" as string]: `${26 + (k % 3) * 11}px`, ["--k" as string]: k }} />
      ))}
    </span>
  );
}

export function PumpkinFxHost() {
  useEffect(() => {
    const SEL = ".os-icons .os-icon-btn, .os-launcher__apps .os-launch";
    const reduced = () => document.documentElement.dataset.osMotion === "reduce" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let px = 0;
    let py = 0;
    let hovered: HTMLElement | null = null;
    const items = () => Array.from(document.querySelectorAll<HTMLElement>(SEL)).filter((el) => el.offsetParent !== null);

    const reset = (el: HTMLElement) => {
      const icon = el.querySelector<HTMLElement>(".os-icon, .os-micon");
      icon?.style.removeProperty("--tx");
      icon?.style.removeProperty("--ty");
    };
    const frame = () => {
      raf = 0;
      const still = reduced();
      for (const el of items()) {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height * 0.4;
        const fx = el.querySelector<HTMLElement>(".hw-fx");
        // só as abóboras a menos de 420 px do ponteiro acompanham (as outras ficam paradas); valores em passos de
        // 0,25 px e só escritos quando mudam — o mouse passeando longe não suja o estilo de ninguém
        if (fx && !still) {
          const dx = px - cx;
          const dy = py - cy;
          const d = Math.hypot(dx, dy) || 1;
          const near = d < 420;
          const k = near ? Math.min(1, d / 260) * 3 : 0;
          const vx = near ? (Math.round(((dx / d) * k) * 4) / 4).toFixed(2) + "px" : "0px";
          const vy = near ? (Math.round(((dy / d) * k * 0.8) * 4) / 4).toFixed(2) + "px" : "0px";
          if (fx.dataset.v !== vx + vy) {
            fx.dataset.v = vx + vy;
            fx.style.setProperty("--px", vx);
            fx.style.setProperty("--py", vy);
          }
        }
        const icon = el.querySelector<HTMLElement>(".os-icon, .os-micon");
        if (icon && !still && el === hovered) {
          const nx = Math.max(-1, Math.min(1, (px - cx) / (r.width / 2)));
          const ny = Math.max(-1, Math.min(1, (py - (r.top + r.height * 0.45)) / (r.height / 2)));
          icon.style.setProperty("--tx", `${(nx * 9).toFixed(1)}deg`);
          icon.style.setProperty("--ty", `${(-ny * 7).toFixed(1)}deg`);
        }
      }
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      px = e.clientX;
      py = e.clientY;
      const el = (e.target as Element | null)?.closest<HTMLElement>(SEL) ?? null;
      if (el !== hovered) {
        if (hovered) reset(hovered);
        hovered = el;
      }
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const onLeave = () => {
      if (hovered) reset(hovered);
      hovered = null;
    };
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>(SEL);
      if (!el) return;
      el.dataset.pulse = "1";
      window.setTimeout(() => delete el.dataset.pulse, 520);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.addEventListener("click", onClick, { capture: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("click", onClick, { capture: true });
      for (const el of items()) {
        reset(el);
        delete el.dataset.pulse;
        el.querySelector<HTMLElement>(".hw-fx")?.style.removeProperty("--px");
        el.querySelector<HTMLElement>(".hw-fx")?.style.removeProperty("--py");
      }
    };
  }, []);
  return null;
}
