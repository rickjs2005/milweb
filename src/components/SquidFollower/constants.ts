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

/** Paleta (RGB 0-255) — champagne profundo → dourado claro nas pontas,
 *  identidade MilWeb (preto+champagne, 12/08). Atenção de manutenção:
 *  varreduras de cor por hex/`rgb(r g b)` NÃO acham este arquivo — a cor
 *  mora em array com vírgula (já passou batido em trocas anteriores). */
export const PALETTE = {
  headCore: [221, 186, 116],
  headMid: [201, 164, 92],
  headEdge: [32, 26, 14],
  tentacleBase: [168, 134, 70],
  tentacleTip: [232, 202, 140],
  glow: [201, 164, 92],
  eyeSclera: [242, 237, 226],
  eyePupil: [14, 13, 11],
} as const;

/**
 * Céu ambiente desenhado atrás da Lula (ver starfield.ts).
 *
 * As opacidades são baixas de propósito: os cards do site são `.glass`,
 * translúcidos a 55%, então estrela atrás de card aparece por baixo. O teto
 * aqui é o que protege o contraste do texto, não um ajuste cosmético.
 */
export const STARFIELD = {
  /** Quantidade por modo (o touch espelha o modo leve da própria Lula). */
  count: 260,
  countAutonomous: 110,
  /** Campo virtual mais alto que a viewport: o wrap do parallax não aparece. */
  fieldHeightFactor: 1.6,
  /** Piso da cintilação: 1 = sem piscar, 0 = apaga por completo. */
  twinkleFloor: 0.45,
  twinkleFreqMin: 0.5,
  twinkleFreqMax: 1.7,
  /** Multiplicador global por tema. O claro pede MAIS, não menos: a cor do
   *  dia (--warm, #A85400) é escura sobre fundo quase branco, então some
   *  antes de incomodar. A 0.55 a poeira era literalmente imperceptível na
   *  captura. O escuro é o oposto: estrela clara sobre preto rende fácil. */
  alphaDark: 1.2, /* preto vazio aguenta estrela mais viva (12/08) */
  alphaLight: 1.6,
  /** Da mais distante (quase parada) à mais próxima (acompanha o scroll). */
  layers: [
    { minR: 0.6, maxR: 1.0, alpha: 0.30, parallax: 0.02 },
    { minR: 0.9, maxR: 1.5, alpha: 0.22, parallax: 0.06 },
    { minR: 1.3, maxR: 2.1, alpha: 0.16, parallax: 0.12 },
  ],
} as const;

/**
 * Sol e planetas — SÓ no tema escuro. No claro não fazem sentido (é dia) e
 * seriam manchas sobre fundo branco.
 *
 * Posições fixas, não sorteadas: são poucos corpos e grandes, então uma
 * composição pensada rende melhor que aleatoriedade — e o resultado é o
 * mesmo em toda visita.
 *
 * `alpha` aqui é o PICO no centro do corpo, e cai a zero na borda. O teto
 * é baixo de propósito: diferente de uma estrela de 1px, um planeta de
 * 120px atrás de um card `.glass` (translúcido a 55%) cobre texto inteiro.
 * Esse número é o que separa "atmosfera" de "mancha atrás da leitura".
 */
export const BODIES = {
  /** Direção da luz do sol, usada pra iluminar o lado certo dos planetas.
   *  Sol com alpha 0 (NÃO desenha, só dá a direção da luz): o disco
   *  dourado de 200px lavava o fundo inteiro — crítica do Rick (12/08),
   *  "espaço é preto VAZIO, aí valoriza os planetas". Pelo mesmo motivo
   *  os planetas subiram de alpha: contra o preto puro eles aguentam
   *  mais presença sem virar mancha atrás de texto. */
  sun: { nx: 0.82, ny: 0.14, r: 200, alpha: 0, parallax: 0.015, rgb: [221, 186, 116] },
  planets: [
    { nx: 0.16, ny: 0.52, r: 88, alpha: 0.28, parallax: 0.05, rgb: [220, 212, 194], ring: 0 },
    { nx: 0.68, ny: 0.78, r: 58, alpha: 0.26, parallax: 0.08, rgb: [201, 164, 92], ring: 1.9 },
    { nx: 0.40, ny: 0.28, r: 40, alpha: 0.22, parallax: 0.11, rgb: [156, 150, 138], ring: 0 },
  ],
} as const;

/** Elementos que disparam o estado de hover do polvo. */
export const HOVER_SELECTOR =
  'a, button, [role="button"], input, select, textarea, [data-octo-hover]';
