"use client";

import { create } from "zustand";
import { gsap } from "@/animations/gsap";
import { MILO } from "./milo.config";
import type { MiloFrame, MiloQuality, MiloState } from "./milo.types";

/**
 * Valores de alta frequência: mutados a cada frame (ponteiro, pesos,
 * uniforms). Nunca entram no React — os componentes leem daqui em useFrame.
 */
export const miloFrame: MiloFrame = {
  pointer: { x: 0, y: 0 },
  pointerUv: { x: 0.5, y: 0.5 },
  pointerActive: false,
  visibility: 1,
  energy: 0.18,
  touch: 0,
  observe: 0.35,
  panelInfluence: 0,
  pulse: 0,
  pulseAt: { x: 0.5, y: 0.5 },
  scroll: 0,
  params: { ...MILO.shader },
  milo: { x: 0.6, y: 0.5, vx: 0, vy: 0 },
  panel: { x: 0.7, y: 0.45 },
  hand: { x: 0.65, y: 0.4 },
  coatWave: 0,
  particles: 0.4,
  head: { x: 0.7, y: 0.8 },
};

/** Alvos de cada estado — o que o GSAP interpola em miloFrame. */
const TARGETS: Record<Exclude<MiloState, "transition">, { visibility: number; energy: number; touch: number; observe: number; particles: number }> = {
  dormant: { visibility: 0.92, energy: 0.12, touch: 0, observe: 0.25, particles: 0.35 },
  observe: { visibility: 1, energy: 0.38, touch: 0, observe: 1, particles: 0.55 },
  touch: { visibility: 1, energy: 0.66, touch: 1, observe: 0.5, particles: 0.75 },
  full: { visibility: 1, energy: 0.92, touch: 1, observe: 1, particles: MILO.shader.fullParticleMultiplier },
  dissolve: { visibility: 0, energy: 0.12, touch: 0, observe: 0, particles: 1 },
};

/** Ordem do botão "próximo estado". */
export const STATE_CYCLE: Exclude<MiloState, "transition">[] = ["dormant", "observe", "touch", "full", "dissolve"];

type MiloStore = {
  state: MiloState;
  /** Estado de destino enquanto `transition` está em curso. */
  pending: MiloState | null;
  visibility: number;
  energy: number;
  pointerInfluence: number;
  scrollProgress: number;
  targetPosition: [number, number, number];
  isReducedMotion: boolean;
  quality: MiloQuality;
  setState: (next: Exclude<MiloState, "transition">) => void;
  nextState: () => void;
  setTarget: (p: [number, number, number]) => void;
  setQuality: (q: MiloQuality) => void;
  setReducedMotion: (v: boolean) => void;
  /** Sincroniza os campos de baixa frequência (chamado ~4×/s pelo canvas, não por frame). */
  syncFromFrame: () => void;
};

let tween: gsap.core.Tween | null = null;

export const useMiloStore = create<MiloStore>((set, get) => ({
  state: "dormant",
  pending: null,
  visibility: 1,
  energy: miloFrame.energy,
  pointerInfluence: 0,
  scrollProgress: 0,
  targetPosition: [...MILO.touch.anchor] as [number, number, number],
  isReducedMotion: false,
  quality: "high",

  setState: (next) => {
    const target = TARGETS[next];
    tween?.kill();
    set({ state: "transition", pending: next });
    const reduce = get().isReducedMotion;
    tween = gsap.to(miloFrame, {
      visibility: target.visibility,
      energy: target.energy,
      touch: target.touch,
      observe: target.observe,
      particles: target.particles,
      duration: reduce ? 0.01 : next === "dissolve" || get().visibility < 0.5 ? 1.6 : 1.1,
      ease: next === "dissolve" ? "power2.inOut" : "power3.out",
      overwrite: true,
      onComplete: () => set({ state: next, pending: null, visibility: miloFrame.visibility, energy: miloFrame.energy }),
    });
  },

  nextState: () => {
    const cur = get().pending ?? get().state;
    const i = STATE_CYCLE.indexOf(cur as Exclude<MiloState, "transition">);
    get().setState(STATE_CYCLE[(i + 1) % STATE_CYCLE.length]);
  },

  setTarget: (p) => set({ targetPosition: p }),
  setQuality: (q) => set({ quality: q }),
  setReducedMotion: (v) => set({ isReducedMotion: v }),
  syncFromFrame: () =>
    set({
      visibility: Math.round(miloFrame.visibility * 100) / 100,
      energy: Math.round(miloFrame.energy * 100) / 100,
      pointerInfluence: Math.round(miloFrame.observe * (miloFrame.pointerActive ? 1 : 0) * 100) / 100,
      scrollProgress: miloFrame.scroll,
    }),
}));
