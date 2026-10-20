import type { OsTheme } from "../theme";

/**
 * O OLHO DO MILWEB OS — constantes da cena do wallpaper.
 *
 * Mesma infraestrutura do wallpaper anterior: o renderer WebGL 1
 * compartilhado (webgl/renderer.ts), um quad, um fragment shader
 * (eye-frag.ts) com as duas identidades — Gojo (claro) e Obito (escuro),
 * escolhidas pelo uniform `uTheme`. Nada de malha, nada de dependência nova.
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
  /**
   * Troca de tema: a pálpebra fecha, fica fechada enquanto a interface muda de
   * tema (a íris troca no escuro) e reabre com a identidade nova. A pausa é
   * mais longa que a do piscar comum para a transição do CSS acontecer atrás
   * da pálpebra; a reabertura, um pouco mais lenta, mostra a íris nova.
   */
  themeBlink: { close: 0.16, hold: 0.26, open: 0.46 },
  /** Piscadas espontâneas (segundos entre uma e outra, sorteadas). */
  auto: { min: 6, max: 11 },
  /** O olhar persegue o cursor com inércia (fração do caminho por frame de 60 fps). */
  gaze: { damp: 0.08 },
  fpsHigh: 40,
  fpsLow: 30,
  /** Custo (ms) do frame de sonda acima do qual o canvas não monta e fica a imagem. */
  probeBudgetMs: 5,
} as const;

/** Valor do uniform `uTheme` por identidade. */
export const EYE_THEME_UNIFORM: Record<OsTheme, number> = { gojo: 0, obito: 1 };

/**
 * Imagens estáticas (olho aberto, olhar ao centro) geradas por este mesmo
 * shader — scripts/eye-still.mjs. Uma por identidade e por enquadramento; o
 * CSS (styles/os.css › .os-eye__still) escolhe pelo tema do <html>, então só
 * a imagem do tema em vigor é baixada — nunca um olho escuro no tema claro.
 */
export const OS_EYE_STILL = {
  gojo: { desktop: "/art/eye-gojo.webp", mobile: "/art/eye-gojo-mobile.webp" },
  obito: { desktop: "/art/eye-obito.webp", mobile: "/art/eye-obito-mobile.webp" },
  size: { desktop: { w: 1600, h: 800 }, mobile: { w: 1040, h: 800 } },
} as const;
