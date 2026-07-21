import type { SquidConfig } from "./types";

/** Defaults públicos — tudo que o componente aceita via props. */
export const DEFAULTS: SquidConfig = {
  size: 34,
  opacity: 0.65,
  speed: 1,
  tentacles: 8,
  segments: 25,
  glow: true,
  interactive: true,
  particleCount: 22,
  idleAnimation: true,
  /** Negativo: o polvo nada ATRÁS do conteúdo (textos/imagens por cima),
   *  acima só do background — mesma técnica do body::before do site. */
  zIndex: -1,
};

/**
 * Parâmetros físicos da simulação. Unidades em px, segundos e radianos.
 * `speed` (prop) multiplica a rigidez da mola da cabeça.
 */
export const PHYSICS = {
  /** Mola da cabeça: rigidez (1/s²) e atrito (1/s). Sub-amortecida de propósito. */
  headStiffness: 55,
  headDamping: 8.5,
  /** Atrito extra ao pairar sobre um elemento interativo (desacelera). */
  hoverDampingBoost: 6,
  /** A lula "nada" atrás e abaixo do cursor, nunca colada nele. */
  followOffset: { x: 34, y: 46 },
  /** Suavização da velocidade medida do mouse (1/s). */
  velSmoothing: 10,
  /** Velocidade do mouse que corresponde a speedNorm = 1 (px/s). */
  maxPointerSpeed: 2600,
  /** Impulso para trás no clique (px/s). */
  clickImpulse: 420,
  /** Segundos parado até entrar em idle. */
  idleDelay: 2.4,
  /** Amplitude da flutuação vertical em idle (px). */
  idleBobAmp: 10,
  idleBobFreq: 0.7,

  /** Braços e tentáculos ------------------------------------------- */
  /** Braços curtos: comprimento total ≈ size * armReach. */
  armReach: 3.1,
  /** Os 2 tentáculos longos de caça (com clava na ponta). */
  longReach: 6.2,
  /** Esticamento máximo dos segmentos com o mouse rápido (fração). */
  stretch: 0.85,
  /** Lag do follow-the-leader: base firme, ponta solta (1/s). */
  segmentLambdaBase: 34,
  segmentLambdaTip: 13,
  /** Queda suave dos tentáculos (px por segmento normalizado). */
  droop: 26,
  /** Ondulação senoidal: frequência (rad/s), amplitude (px) e defasagem por segmento. */
  waveFreq: 2.1,
  waveAmp: 7,
  wavePhasePerSegment: 0.42,
  /** Ruído orgânico somado à onda (px). */
  noiseAmp: 5,
  noiseSpeed: 0.35,
  /** Quanto a "correnteza" do scroll empurra as pontas (fração da velocidade). */
  scrollFlow: 0.05,
  /** Velocidade da transição do tentáculo que aponta no hover (1/s). */
  pointLambda: 5,

  /** Respiração do manto: frequência (Hz) e amplitude (fração da escala). */
  breathFreq: 0.45,
  breathAmp: 0.04,
  /** Curvatura das pontas em idle (px na ponta). */
  curlAmp: 26,
  /** Até qual segmento vai a membrana entre tentáculos vizinhos. */
  webSegment: 5,

  /** Olhos ---------------------------------------------------------- */
  blinkMin: 2.2,
  blinkMax: 5.6,
  blinkDuration: 0.14,
  /** Velocidade do olhar (1/s): rápido ao seguir, lento vagando em idle. */
  lookLambdaActive: 14,
  lookLambdaIdle: 3,

  /** Partículas ----------------------------------------------------- */
  sparkCount: 14,
  bubbleEvery: 1.6,
} as const;

/** Paleta (RGB 0-255) — azul profundo → ciano, identidade MilWeb. */
export const PALETTE = {
  headCore: [96, 165, 250],
  headMid: [29, 78, 216],
  headEdge: [9, 18, 44],
  tentacleBase: [37, 99, 235],
  tentacleTip: [34, 211, 238],
  glow: [56, 189, 248],
  eyeSclera: [235, 244, 255],
  eyePupil: [7, 12, 28],
} as const;

/** Elementos que disparam o estado de hover do polvo. */
export const HOVER_SELECTOR =
  'a, button, [role="button"], input, select, textarea, [data-octo-hover]';
