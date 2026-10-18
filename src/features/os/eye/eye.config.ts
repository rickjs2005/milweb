/**
 * O OLHO DO MILWEB OS — constantes da cena do wallpaper (Six Eyes).
 *
 * Mesma infraestrutura do wallpaper anterior: o renderer WebGL 1
 * compartilhado (webgl/renderer.ts), um quad, um fragment shader
 * (eye-frag.ts). Nada de malha, nada de dependência nova.
 */
export const OS_EYE = {
  /**
   * Enquadramento: `aspect` é largura/altura do canvas e `scale` é a
   * meia-largura do olho (canto a canto) em unidades da meia-largura do
   * canvas. No desktop o olho cabe inteiro com margem para as pálpebras
   * esmaecerem; no celular ele é maior que o canvas — os cantos saem da tela
   * e a íris fica grande (close-up vertical, não uma redução do desktop).
   */
  desktop: { aspect: 2.0, scale: 0.8, edge: 0.92 },
  mobile: { aspect: 1.3, scale: 1.12, edge: 0.7 },
  /** Piscar (segundos): descida, pausa fechada, reabertura; decaimentos do brilho e da dilatação. */
  blink: { close: 0.14, hold: 0.07, open: 0.4, glow: 0.9, dilate: 1.6 },
  /** Piscadas espontâneas (segundos entre uma e outra, sorteadas). */
  auto: { min: 6, max: 11 },
  /** O olhar persegue o cursor com inércia (fração do caminho por frame de 60 fps). */
  gaze: { damp: 0.08 },
  fpsHigh: 40,
  fpsLow: 30,
  /** Custo (ms) do frame de sonda acima do qual o canvas não monta e fica a imagem. */
  probeBudgetMs: 5,
} as const;

/** Imagens estáticas (olho aberto, olhar ao centro) geradas por este mesmo shader — scripts/eye-still.mjs. */
export const OS_EYE_STILL = {
  desktop: { src: "/art/eye-still.webp", w: 1600, h: 800 },
  mobile: { src: "/art/eye-still-mobile.webp", w: 1040, h: 800 },
} as const;
