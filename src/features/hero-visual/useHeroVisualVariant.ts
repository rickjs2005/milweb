import { HERO_VISUAL } from "./hero-visual.config";
import type { HeroVisualVariant } from "./hero-visual.types";

/**
 * Variante ativa. É uma constante de build (NEXT_PUBLIC_*), então serve
 * igual em Server Components e Client Components, sem hidratação divergente.
 */
export function useHeroVisualVariant(): HeroVisualVariant {
  return HERO_VISUAL;
}

export const getHeroVisualVariant = (): HeroVisualVariant => HERO_VISUAL;
