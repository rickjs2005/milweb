"use client";

import { create } from "zustand";
import type { MiloPlacement } from "@/components/milo/MiloNull";
import { MILO_HERO } from "@/features/hero-visual/hero-visual.config";

/** Colocação do Milo no mundo — MUTADA por frame pela ponte, lida por frame pelo MiloNull (nunca passa pelo React). */
export const heroPlacement: MiloPlacement = { x: 6, y: MILO_HERO.y, z: 0, scale: MILO_HERO.scale, yaw: MILO_HERO.yawWalk, stride: MILO_HERO.stride * MILO_HERO.scale };

/**
 * Estado de baixa frequência do Milo no Hero (muda poucas vezes por sessão):
 * visibilidade do Hero (liga/desliga o frameloop) e se o canvas já
 * apresentou um frame válido. Tudo de alta frequência vai em `miloFrame`.
 */
type MiloHeroStore = {
  heroVisible: boolean;
  ready: boolean;
  setHeroVisible: (v: boolean) => void;
  setReady: (v: boolean) => void;
};

export const useMiloHeroStore = create<MiloHeroStore>((set) => ({
  heroVisible: true,
  ready: false,
  setHeroVisible: (v) => set((s) => (s.heroVisible === v ? s : { heroVisible: v })),
  setReady: (v) => set((s) => (s.ready === v ? s : { ready: v })),
}));
