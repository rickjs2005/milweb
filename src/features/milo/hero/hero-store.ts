"use client";

import { create } from "zustand";

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
