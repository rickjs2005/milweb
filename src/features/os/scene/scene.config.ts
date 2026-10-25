import type { OsTheme } from "../theme";

/**
 * O FUNDO DO MILWEB OS — dois universos e a travessia entre eles.
 *
 *   tsukuyomi · tema Obito (escuro): lua vermelha monumental com os anéis e
 *               os tomoe, céu profundo, névoa iluminada de vermelho, rochas
 *               suspensas, brasas em profundidade.
 *   void      · tema Gojo (claro): branco perolado e azul-gelo, túnel
 *               dimensional com centro azul profundo, anéis de luz girando
 *               em sentidos opostos, névoa fluida, estilhaços e partículas.
 *
 * Tudo é desenhado por dois fragment shaders (tsukuyomi-frag.ts, void-frag.ts)
 * no renderer WebGL 1 compartilhado (webgl/renderer.ts). Cada camada tem a
 * própria profundidade `z`: ela decide a paralaxe do mouse e quanto a camada
 * cresce quando a câmera atravessa o túnel na troca de tema — profundidade
 * real, não uma imagem inteira deslocada com zoom.
 */
export type SceneWorld = "tsukuyomi" | "void";

export const WORLD_OF: Record<OsTheme, SceneWorld> = { obito: "tsukuyomi", gojo: "void" };
export const THEME_OF: Record<SceneWorld, OsTheme> = { tsukuyomi: "obito", void: "gojo" };

export const OS_SCENE = {
  /** Travessia entre universos (s). */
  duration: 2.2,
  /**
   * Progresso em que a interface adota o tema novo, por universo de destino:
   * é quando a frente do universo novo passa pelas áreas de leitura (lema,
   * coluna de apps, microtextos do HUD). Antes disso a interface continua no
   * tema antigo, legível sobre o universo antigo.
   */
  commitAt: { void: 0.57, tsukuyomi: 0.47 } as Record<SceneWorld, number>,
  /** Onda de distorção que nasce no controle de tema (fração do progresso). */
  wave: { from: 0.02, to: 0.42 },
  /**
   * Composição. Desktop: raio da lua/portal = 0,6 × altura da área de trabalho
   * (corta em cima e embaixo). Telefone: min(0,62 × largura, 0,78 × altura do
   * palco) — corta nas laterais. O centro é sempre o centro do palco
   * (`.os-stage`, a caixa que o olho ocupava; o HUD das redes continua
   * medindo por ela).
   */
  desktopR: 0.6,
  mobileR: { w: 0.62, h: 0.78 },
  /** Paralaxe: constante de tempo do amortecimento (s); sem mouse por `idle` s, volta à deriva automática. */
  parallax: { tau: 0.42, idle: 3.5, drift: 0.32, mobileDrift: 0.42 },
  /** Teto de quadros: ambiente (lento, navegação confortável) e travessia. */
  fps: { ambient: 30, ambientHigh: 45, transition: 60 },
  /**
   * Custo de um quadro (ms) medido numa resolução reduzida e extrapolado:
   * a resolução sai do alvo; acima de `maxMs` mesmo em `minDpr`, fica a imagem.
   */
  budget: { probeDpr: 0.5, targetMs: 9, maxMs: 15, minDpr: 0.5, maxDpr: 1.25, mobileMaxDpr: 1 },
  /** Período do relógio do shader (s): evita perder precisão em sessões longas. */
  timeWrap: 3600,
} as const;

/**
 * Imagens estáticas — o MESMO shader no instante zero, sem paralaxe
 * (scripts/scene-still.mjs). Ficam por baixo do canvas, servem o primeiro
 * quadro, o movimento reduzido e quem não tem WebGL. Cada imagem é
 * desenhada em torno do centro (cx, cy) com raio r (px da imagem) e o CSS a
 * posiciona pelo centro e raio do palco (`--st-x/--st-y/--st-r`), então ela
 * coincide com o canvas em qualquer proporção de tela.
 */
export const SCENE_STILL = {
  desktop: { w: 1880, h: 820, cx: 940, cy: 360, r: 460 },
  mobile: { w: 700, h: 1520, cx: 350, cy: 520, r: 400 },
} as const;

/* ---------------------------------------------------------------------------
 * Elementos soltos de cada universo, em unidades do raio da composição
 * (centro da lua/portal = 0,0; y para cima). z > 1: atrás das nuvens do meio;
 * z < 1: mais perto da câmera (mais paralaxe, mais desfoque, passam primeiro
 * pela câmera na travessia). Os desta lista cobrem o desktop (x até ±1,4) e o
 * telefone (y de −2,3 a +1,2); os das áreas de leitura ficam de fora.
 * ------------------------------------------------------------------------- */
export type Floater = { x: number; y: number; s: number; z: number; seed: number };

/** Fragmentos de rocha suspensos (Tsukuyomi). */
export const ROCKS: Floater[] = [
  { x: -0.5, y: 0.41, s: 0.052, z: 1.5, seed: 1.3 },
  { x: 0.6, y: 0.31, s: 0.038, z: 1.6, seed: 2.7 },
  { x: 0.2, y: -0.47, s: 0.044, z: 1.4, seed: 3.9 },
  { x: 1.0, y: -0.42, s: 0.086, z: 0.86, seed: 4.4 },
  { x: -0.83, y: 0.2, s: 0.066, z: 0.92, seed: 5.8 },
  { x: -0.3, y: 0.88, s: 0.05, z: 0.95, seed: 6.1 },
  { x: 1.2, y: 0.5, s: 0.118, z: 0.6, seed: 7.7 },
  { x: -0.98, y: -0.56, s: 0.092, z: 0.64, seed: 8.2 },
  { x: 0.5, y: 1.04, s: 0.07, z: 0.72, seed: 9.5 },
  { x: -0.66, y: -0.8, s: 0.078, z: 0.7, seed: 10.4 },
];

/** Estilhaços flutuantes (Vazio Ilimitado). */
export const SHARDS: Floater[] = [
  { x: -0.64, y: 0.46, s: 0.058, z: 1.3, seed: 1.1 },
  { x: 0.72, y: 0.38, s: 0.05, z: 1.4, seed: 2.2 },
  { x: 0.32, y: -0.6, s: 0.054, z: 1.2, seed: 3.3 },
  { x: -0.88, y: -0.3, s: 0.06, z: 0.8, seed: 4.4 },
  { x: 1.12, y: -0.44, s: 0.074, z: 0.64, seed: 5.5 },
  { x: 0.96, y: 0.62, s: 0.052, z: 0.9, seed: 6.6 },
  { x: -0.42, y: 0.98, s: 0.06, z: 0.86, seed: 7.7 },
  { x: 0.54, y: -1.06, s: 0.068, z: 0.76, seed: 8.8 },
];
