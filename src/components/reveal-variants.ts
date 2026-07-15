/**
 * Registro de variantes visuais do `Reveal` (reveal.tsx): cada uma é só um
 * par de classes Tailwind (estado oculto / estado visível) — o mecanismo de
 * disparo (IntersectionObserver + `transition-all`) continua o mesmo,
 * variante nenhuma usa GSAP. Mantém `Reveal` simples pra quem só quer o
 * fade-up de sempre, e dá variedade pra quem passar `variant`.
 */
export type RevealVariant =
  | "fade-up"
  | "zoom"
  | "flip"
  | "slide-left"
  | "slide-right"
  | "rotate"
  | "stack"
  | "depth";

export const REVEAL_VARIANTS: Record<RevealVariant, { hidden: string; shown: string }> = {
  "fade-up": {
    hidden: "translate-y-5 opacity-0",
    shown: "translate-y-0 opacity-100",
  },
  zoom: {
    hidden: "scale-90 opacity-0",
    shown: "scale-100 opacity-100",
  },
  flip: {
    hidden: "[transform:perspective(1200px)_rotateY(-90deg)] opacity-0",
    shown: "[transform:perspective(1200px)_rotateY(0deg)] opacity-100",
  },
  "slide-left": {
    hidden: "-translate-x-10 opacity-0",
    shown: "translate-x-0 opacity-100",
  },
  "slide-right": {
    hidden: "translate-x-10 opacity-0",
    shown: "translate-x-0 opacity-100",
  },
  rotate: {
    hidden: "rotate-6 scale-95 opacity-0",
    shown: "rotate-0 scale-100 opacity-100",
  },
  stack: {
    hidden: "translate-y-8 scale-95 opacity-0",
    shown: "translate-y-0 scale-100 opacity-100",
  },
  depth: {
    hidden: "scale-95 opacity-0 blur-sm",
    shown: "scale-100 opacity-100 blur-none",
  },
};

/**
 * Versão GSAP de cada variante, usada pelo modo SCRUB do Reveal (desktop):
 * a montagem fica amarrada ao progresso do scroll em vez de disparar uma
 * vez. `from` é o estado desmontado; `to` o estado final.
 */
export const SCRUB_VARS: Record<
  RevealVariant,
  { from: Record<string, unknown>; to: Record<string, unknown> }
> = {
  "fade-up": { from: { y: 48, autoAlpha: 0 }, to: { y: 0, autoAlpha: 1 } },
  zoom: { from: { scale: 0.85, autoAlpha: 0 }, to: { scale: 1, autoAlpha: 1 } },
  flip: {
    from: { rotationY: -70, transformPerspective: 1200, autoAlpha: 0 },
    to: { rotationY: 0, transformPerspective: 1200, autoAlpha: 1 },
  },
  "slide-left": { from: { x: -70, autoAlpha: 0 }, to: { x: 0, autoAlpha: 1 } },
  "slide-right": { from: { x: 70, autoAlpha: 0 }, to: { x: 0, autoAlpha: 1 } },
  rotate: {
    from: { rotation: 7, scale: 0.94, autoAlpha: 0 },
    to: { rotation: 0, scale: 1, autoAlpha: 1 },
  },
  stack: {
    from: { y: 80, scale: 0.94, autoAlpha: 0 },
    to: { y: 0, scale: 1, autoAlpha: 1 },
  },
  depth: {
    from: { scale: 0.92, autoAlpha: 0, filter: "blur(8px)" },
    to: { scale: 1, autoAlpha: 1, filter: "blur(0px)" },
  },
};

/** Rotação fixa usada pelos cards de Deliverables (uma técnica por card). */
export const REVEAL_VARIANT_ROTATION: RevealVariant[] = [
  "flip",
  "slide-left",
  "zoom",
  "fade-up",
  "depth",
  "rotate",
  "stack",
  "slide-right",
];
