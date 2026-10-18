/**
 * O GLOBO DO MILWEB OS — constantes da cena do wallpaper.
 *
 * Independente do globo do Hero antigo (features/globe): aqui não há letra
 * "O", migração nem saída — é um objeto de fundo, sempre no mesmo lugar,
 * girando devagar e reagindo de leve ao cursor. O shader (globe-frag.ts) e
 * a máscara de terra (webgl/earth-mask.ts) são os recursos reaproveitados.
 */
export const OS_GLOBE = {
  /** Origem do estúdio — o único ponto marcado no globo (Brasil). */
  home: { lat: -15.8, lon: -47.9 },
  /** Inclinação do eixo (rad). */
  tilt: -0.3,
  /**
   * Giro de repouso (rad): com o shader deste globo, a longitude no centro
   * da tela é `spin + π/2`, então o Brasil (−47,9°) fica de frente com
   * −47,9° − 90° = −2,407 rad. É também a pose da imagem estática.
   */
  spinHome: -2.407,
  /** Rotação lenta e contínua (rad/s): uma volta em ~3,5 min. Sentido real (leste). */
  spinSpeed: 0.03,
  /** Reação ao cursor (rad por unidade de mouse normalizada) e amortecimento por frame de 60 fps. */
  pointer: { yaw: 0.3, pitch: 0.1, damp: 0.06 },
  /** Raio desenhado como fração de metade do canvas (sobra respiro para a sombra de contato). */
  fill: 0.9,
  /** Teto de quadros: movimento lento, 30–40 fps bastam. */
  fpsHigh: 40,
  fpsLow: 30,
  /** Custo (ms) do frame de sonda acima do qual o canvas não monta e fica a imagem. */
  probeBudgetMs: 4,
} as const;

/** Imagem estática do globo (gerada a partir deste mesmo shader — scripts/globe-still.mjs). */
export const OS_GLOBE_STILL = { src: "/art/globe-still.webp", small: "/art/globe-still-800.webp", size: 1600 } as const;
