import type { HeroVisualVariant } from "./hero-visual.types";

/**
 * Feature flag do visual do Hero — `NEXT_PUBLIC_HERO_VISUAL=globe|compiler`.
 * Inlined no build (é NEXT_PUBLIC_*).
 *
 * O PADRÃO agora é `globe`: a manchete e o Hero inteiro foram escritos em
 * torno dele, então "sem variável de ambiente" tem que dar o Hero atual.
 * Só o valor explícito `compiler` volta para a escultura — inclusive o valor
 * antigo `milo`, que não existe mais, cai no padrão em vez de quebrar a Home
 * de um deploy que ainda tenha a variável antiga.
 */
export const HERO_VISUAL_DEFAULT: HeroVisualVariant = "globe";

export function resolveHeroVisual(raw: string | undefined): HeroVisualVariant {
  return raw?.trim().toLowerCase() === "compiler" ? "compiler" : HERO_VISUAL_DEFAULT;
}

export const HERO_VISUAL: HeroVisualVariant = resolveHeroVisual(process.env.NEXT_PUBLIC_HERO_VISUAL);
