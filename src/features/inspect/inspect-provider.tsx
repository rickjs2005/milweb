"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { InspectLayer } from "./inspect-layer";

type Ctx = { active: boolean };
const InspectCtx = createContext<Ctx>({ active: false });
export const useInspect = () => useContext(InspectCtx);

const HOLD_MS = 260;
const HOLD_MS_TOUCH = 380;

/**
 * HOLD TO INSPECT — a interação-assinatura da MilWeb.
 *
 * Segurar o ponteiro (ou a tecla I) em qualquer lugar inverte a paleta
 * (data-mode="dev" no <html>: papel vira tinta, a régua vira Signal Green)
 * e a InspectLayer desenha a estrutura por cima: bounding boxes, nomes de
 * componentes, medidas, grid 12 e as coordenadas do cursor. Soltar devolve
 * o design. Não é DevTools — é uma leitura artística do processo.
 *
 * Um clique curto nunca dispara (limiar de 260 ms). Se o hold começou sobre
 * um link, o click do release é engolido para não navegar por acidente.
 */
export function InspectProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);
  const timer = useRef<number | null>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const swallowClick = useRef(false);

  useEffect(() => {
    const root = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const on = () => {
      root.setAttribute("data-mode", "dev");
      root.classList.add("inspecting");
      setActive(true);
    };
    const off = () => {
      root.removeAttribute("data-mode");
      root.classList.remove("inspecting");
      setActive(false);
    };
    const cancel = () => {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = null;
    };

    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const t = e.target as HTMLElement;
      // Campos e controles interativos de formulário ficam de fora.
      if (t?.closest?.("input, textarea, select, [data-no-inspect]")) return;
      pointer.current = { x: e.clientX, y: e.clientY };
      cancel();
      const ms = e.pointerType === "touch" ? HOLD_MS_TOUCH : HOLD_MS;
      timer.current = window.setTimeout(() => {
        swallowClick.current = true;
        on();
      }, ms);
    };
    const up = () => {
      cancel();
      if (root.hasAttribute("data-mode")) off();
    };
    const move = (e: PointerEvent) => {
      pointer.current = { x: e.clientX, y: e.clientY };
      root.style.setProperty("--ix", `${e.clientX}px`);
      root.style.setProperty("--iy", `${e.clientY}px`);
    };
    const click = (e: MouseEvent) => {
      if (!swallowClick.current) return;
      swallowClick.current = false;
      e.preventDefault();
      e.stopPropagation();
    };
    const key = (e: KeyboardEvent) => {
      if (e.repeat || e.key.toLowerCase() !== "i") return;
      const t = e.target as HTMLElement;
      if (t?.closest?.("input, textarea, select")) return;
      on();
    };
    const keyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "i") off();
    };
    // Long-press no touch abre menu de contexto — não durante o inspect.
    const ctx = (e: Event) => {
      if (root.hasAttribute("data-mode") || timer.current) e.preventDefault();
    };

    window.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });
    window.addEventListener("pointercancel", up, { passive: true });
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("click", click, { capture: true });
    window.addEventListener("contextmenu", ctx);
    window.addEventListener("blur", up);
    if (!reduce) {
      window.addEventListener("keydown", key);
      window.addEventListener("keyup", keyUp);
    }
    return () => {
      cancel();
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("click", click, { capture: true });
      window.removeEventListener("contextmenu", ctx);
      window.removeEventListener("blur", up);
      window.removeEventListener("keydown", key);
      window.removeEventListener("keyup", keyUp);
    };
  }, []);

  return (
    <InspectCtx.Provider value={{ active }}>
      {children}
      {active && <InspectLayer />}
    </InspectCtx.Provider>
  );
}
