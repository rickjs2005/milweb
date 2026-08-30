import type { HeroVisualVariant } from "./hero-visual.types";

/**
 * Feature flag do visual do Hero — `NEXT_PUBLIC_HERO_VISUAL=compiler|milo`.
 * Inlined no build (é NEXT_PUBLIC_*): sem a variável, ou com valor
 * desconhecido, vale `compiler` — a Home continua exatamente como está.
 */
export const HERO_VISUAL_DEFAULT: HeroVisualVariant = "compiler";

export function resolveHeroVisual(raw: string | undefined): HeroVisualVariant {
  return raw?.trim().toLowerCase() === "milo" ? "milo" : HERO_VISUAL_DEFAULT;
}

export const HERO_VISUAL: HeroVisualVariant = resolveHeroVisual(process.env.NEXT_PUBLIC_HERO_VISUAL);

/** Colocação do Milo no Hero (fração da viewport / mundo). Referência: o Compiler vive em cx 0.68. */
export const MILO_HERO = {
  cx: 0.69,
  /** deslocamento vertical (mundo) e escala — cabeça abaixo da nav, pés dentro da viewport */
  y: -0.05,
  scale: 1.06,
  yaw: -0.36,
  /** custo máximo (ms) do frame medido depois do aquecimento; acima disso volta ao SVG */
  frameBudgetMs: 14,
  /** figura de [data-layer=images] que a mão ativa toma como alvo */
  targetAttr: "data-milo-target",
} as const;
