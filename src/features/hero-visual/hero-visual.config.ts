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

/**
 * Cena do Milo no Hero (unidades do mundo three; a câmera olha (0,1,0) de z = 5,6).
 * Os pés ficam na borda inferior da viewport (y), o corpo entra pela direita,
 * para junto da extremidade condensada de "PESSOAS." e a arrasta para a
 * direita andando de ré. Tudo função do progresso do ScrollTrigger.
 */
export const MILO_HERO = {
  /** escala e altura do root (desktop / < 720 px) */
  scale: 0.9,
  scaleMobile: 0.5,
  y: -0.35,
  yMobile: -0.42,
  /** rotação do corpo: andando (perfil, de frente para a headline) e parado (três quartos) */
  yawWalk: -1.15,
  yawRest: -0.36,
  /** distância (mundo, × escala) entre a extremidade da palavra e o root enquanto a mão a segura */
  holdOffset: 0.62,
  holdOffsetMobile: 0.5,
  /** passo nominal (mundo, × escala) — o número de ciclos é arredondado para a chegada cair em pose neutra */
  stride: 0.64,
  /** folga além da borda para o corpo (e o braço em balanço) começar totalmente fora da tela */
  offscreenPad: 0.8,
  offscreenPadMobile: 0.7,
  /** custo máximo (ms) do frame medido depois do aquecimento; acima disso volta ao SVG */
  frameBudgetMs: 14,
} as const;
