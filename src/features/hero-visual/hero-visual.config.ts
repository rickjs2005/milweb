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
 * Cena do Milo no Hero (unidades do mundo three; a câmera olha (0,1,0) de z = 5,6,
 * a viewport tem 2·1,344 de altura no plano z = 0 em qualquer resolução).
 * O corpo entra pela direita, para nas colunas 8–10 junto da extremidade de
 * "PESSOAS." e a puxa ~1 coluna para si. Tudo função do progresso do ScrollTrigger.
 */
const VIEW_H = 2 * 5.6 * Math.tan((27 * Math.PI) / 360);
export const MILO_HERO = {
  /** altura do Milo como fração da viewport (desktop) → escala do root (altura nominal 1,9) */
  heightSvh: 0.78,
  scale: (0.78 * VIEW_H) / 1.9,
  /** mobile: Milo é claramente MENOR que o bloco do headline (~34 % da altura útil — era 0,72,
   * ≈51 % da viewport, competindo com a manchete). A cabeça não pode chegar perto das linhas
   * superiores da headline nem tocar o texto durante a entrada. */
  heightSvhMobile: 0.34,
  scaleMobile: (0.34 * VIEW_H) / 1.9,
  /** y do root (pés): borda inferior da viewport no plano z=0 é 1 − VIEW_H/2; + respiro. Mobile:
   * pés ficam mais alto que no desktop (o corpo é bem menor) — a "zona de interação" abaixo da
   * headline, acima da metadata, não o rodapé da tela. */
  y: 1 - VIEW_H / 2 + 0.08,
  yMobile: -0.66,
  /** rotação do corpo: andando (perfil, de frente para a headline) e parado (três quartos) */
  yawWalk: -1.15,
  yawRest: -0.36,
  /** distância (mundo, × escala) entre a extremidade da palavra e o root enquanto a mão a segura —
   * reduzida (era 0,68): o torso ficava livre demais da palavra (~1,5 coluna), um vão grande
   * demais para o braço "ler" como alcançando-a; mais perto, o braço cobre a distância que falta */
  holdOffset: 0.52,
  holdOffsetMobile: 0.72,
  /** passo nominal (mundo, × escala) — o número de ciclos é arredondado para a chegada cair em pose neutra */
  stride: 1.35, // um ciclo = dois passos de ~0,68 (≈ 0,75 × perna de 0,9) — passo humano, não passinho
  /** folga além da borda para o corpo (e o braço em balanço) começar totalmente fora da tela */
  offscreenPad: 0.8,
  offscreenPadMobile: 0.6,
  /** custo máximo (ms) do frame medido depois do aquecimento; acima disso volta ao SVG */
  frameBudgetMs: 14,
} as const;
