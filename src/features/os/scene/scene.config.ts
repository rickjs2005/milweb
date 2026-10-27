import type { OsTheme } from "../theme";

/**
 * O FUNDO DO MILWEB OS — dois universos e a travessia entre eles.
 *
 *   tsukuyomi · tema Obito (escuro): lua vermelha monumental com relevo, os anéis
 *               e os tomoe girando, nuvens em camadas atravessando a lua, rochas
 *               facetadas girando e flutuando, brasas orbitando em profundidade,
 *               feixes vermelhos e névoa que respiram.
 *   void      · tema Gojo (claro): um túnel dimensional que envolve a tela, com
 *               energia curva fluindo pelas paredes até o centro azul profundo,
 *               anéis inclinados girando em sentidos opostos, correntes de luz
 *               em hélice, partículas, névoa branca, estilhaços de vidro e
 *               distorção localizada.
 *
 * Cena em Three.js (scene/engine.ts), com um laço só — o ticker do GSAP — e
 * tempo decorrido. Profundidade real: a câmera em perspectiva faz a paralaxe
 * (o que está perto anda mais) e a travessia é a câmera atravessando a cena.
 */
export type SceneWorld = "tsukuyomi" | "void";

export const WORLD_OF: Record<OsTheme, SceneWorld> = { obito: "tsukuyomi", gojo: "void" };
export const THEME_OF: Record<SceneWorld, OsTheme> = { tsukuyomi: "obito", void: "gojo" };

/**
 * Distância focal da câmera em raios do palco (f = F × R px): um ponto a z
 * unidades aparece deslocado (x, y) · F / z raios do centro. Fixo, para a
 * composição ser a mesma em qualquer tela e nas imagens estáticas.
 */
export const F = 2;

export const OS_SCENE = {
  /** Travessia entre universos (s). */
  duration: 2.2,
  /**
   * Progresso em que a interface adota o tema novo, por universo de destino:
   * quando a frente do universo novo passa pelas áreas de leitura (lema,
   * coluna de apps, microtextos do HUD).
   */
  commitAt: { void: 0.57, tsukuyomi: 0.47 } as Record<SceneWorld, number>,
  /** Onda de distorção que nasce no controle de tema (fração do progresso). */
  wave: { from: 0.02, to: 0.42 },
  /** Composição: raio do palco = 0,6 × altura (desktop); min(0,62 × largura, 0,78 × altura do palco) no telefone. */
  desktopR: 0.6,
  mobileR: { w: 0.62, h: 0.78 },
  /** Paralaxe: constante de tempo do amortecimento (s), deriva automática sem mouse (amplitude −1..1). */
  parallax: { tau: 0.55, idle: 3.5, drift: 0.45, mobileDrift: 0.55 },
  /**
   * Teto de quadros, o mesmo para o ambiente, a travessia e as reações: a
   * travessia desenha os dois universos, então subir para 60 numa GPU que
   * calibrou em 30 a satura e trava; 30 constantes valem mais que 60 aos trancos.
   */
  fps: { ambient: 30, ambientHigh: 60 },
  /**
   * Orçamento de GPU (ms de quadro medidos no ritmo do ambiente, a 30 qps;
   * a 60 qps, metade) — decide a resolução e o teto de quadros: 60 qps só
   * quando cabem em pelo menos `go60` da resolução máxima (e continuam
   * enquanto couberem em `keep60`); senão 30 qps com a imagem nítida —
   * fundo lento borrado parece parado, 30 quadros nítidos não. Medido entre
   * quadros, a GPU integrada está desacelerada: o mesmo quadro sob carga
   * custa de 1/2 a 1/3 disso (por isso 14 ms). Quadros lentos de verdade o
   * monitor pega e baixa a resolução. Abaixo de minDpr a cena continua
   * viva; só GPU por software ou sem WebGL 2 ficam com a imagem.
   */
  budget: { probeDpr: 0.5, targetMs: 14, minDpr: 0.45, maxDpr: 1.25, mobileMaxDpr: 1, go60: 0.9, keep60: 0.8 },
  /**
   * Reação a um app destacado / onda de abertura (px CSS, s). O raio passa do véu que acalma a coluna de
   * apps (~210 px): o anel que respira em volta do app aparece no cenário, ao lado dele.
   */
  hover: { radius: 190, in: 0.45, out: 0.7 },
  click: { duration: 1.1 },
  /** Período do relógio dos shaders (s): evita perda de precisão em sessões longas. */
  timeWrap: 3600,
} as const;

/**
 * Imagens estáticas — a mesma cena no instante zero (scripts/scene-still.mjs).
 * Cada uma é desenhada em volta de (cx, cy) com raio r (px da imagem); o CSS
 * a posiciona pelo centro e raio do palco (`--st-x/--st-y/--st-r`).
 */
export const SCENE_STILL = {
  desktop: { w: 1880, h: 820, cx: 940, cy: 360, r: 460 },
  mobile: { w: 700, h: 1520, cx: 350, cy: 520, r: 400 },
} as const;

/* ---------------------------------------------------------------------------
 * Conteúdo dos universos. Posições em raios do palco (u para a direita, v
 * para cima, centro da lua/portal = 0,0) e profundidade z em unidades do
 * mundo (câmera em z = 0 olhando para −z). Desktop vai de u ≈ ±1,4 (16:10)
 * até ±2 (ultrawide); o telefone, de v ≈ −2,3 a +1,2.
 * ------------------------------------------------------------------------- */

export const TSUKU = {
  moon: { z: 12, spin: 0.012 },
  /** rotação dos anéis do padrão (rad/s): o de dentro mais rápido, sentidos alternados */
  rings: [0.07, -0.05, 0.034] as const,
  /**
   * Nuvens: faixas em profundidade, cada uma com a própria velocidade (raios/s) e sentido.
   * kind: 0 fiapo, 1 banco, 2 tufo. lit: quanto a lua acende as bordas finas por trás.
   */
  clouds: [
    { v: 0.6, h: 0.36, z: 11.2, speed: 0.022, alpha: 0.6, kind: 0, lit: 1.0 },
    { v: -0.32, h: 0.46, z: 10.6, speed: -0.03, alpha: 0.62, kind: 0, lit: 1.0 },
    { v: 0.1, h: 0.24, z: 9.4, speed: 0.04, alpha: 0.32, kind: 0, lit: 0.9 },
    { v: -0.8, h: 0.66, z: 8.6, speed: 0.026, alpha: 0.96, kind: 1, lit: 0.9 },
    { v: 0.98, h: 0.42, z: 6.4, speed: -0.05, alpha: 0.5, kind: 2, lit: 0.55 },
    { v: -1.12, h: 0.78, z: 5.6, speed: 0.06, alpha: 0.92, kind: 1, lit: 0.4 },
    { v: -1.8, h: 1.3, z: 7.4, speed: 0.035, alpha: 0.96, kind: 1, lit: 0.25 },
  ],
  /** Rochas: (u, v) em raios, z, tamanho em raios, giro (rad/s), oscilação (raios) e frequência (Hz). */
  rocks: [
    { u: -0.52, v: 0.4, z: 10.4, s: 0.055, spin: 0.32, bob: 0.012, hz: 0.22 },
    { u: 0.6, v: 0.33, z: 10.8, s: 0.045, spin: -0.4, bob: 0.01, hz: 0.27 },
    { u: 0.22, v: -0.5, z: 9.8, s: 0.05, spin: 0.26, bob: 0.012, hz: 0.19 },
    { u: 1.02, v: -0.42, z: 7.4, s: 0.085, spin: -0.22, bob: 0.016, hz: 0.17 },
    { u: -0.86, v: 0.18, z: 8.0, s: 0.07, spin: 0.3, bob: 0.014, hz: 0.24 },
    { u: -0.3, v: 0.88, z: 8.5, s: 0.05, spin: -0.36, bob: 0.012, hz: 0.29 },
    { u: 1.22, v: 0.5, z: 5.4, s: 0.12, spin: 0.18, bob: 0.02, hz: 0.14 },
    { u: -1.0, v: -0.58, z: 5.8, s: 0.1, spin: -0.2, bob: 0.018, hz: 0.16 },
    { u: 0.5, v: 1.05, z: 6.4, s: 0.075, spin: 0.28, bob: 0.014, hz: 0.21 },
    { u: -0.66, v: -0.82, z: 6.2, s: 0.08, spin: -0.26, bob: 0.015, hz: 0.2 },
    { u: 1.56, v: -0.08, z: 4.2, s: 0.15, spin: 0.15, bob: 0.022, hz: 0.12 },
    { u: -1.52, v: 0.42, z: 4.6, s: 0.13, spin: -0.17, bob: 0.02, hz: 0.13 },
    { u: 0.32, v: -1.28, z: 5.0, s: 0.09, spin: 0.24, bob: 0.016, hz: 0.18 },
    { u: -0.42, v: 1.16, z: 9.0, s: 0.05, spin: -0.3, bob: 0.012, hz: 0.25 },
  ],
  embers: { high: 1500, low: 650 },
};

export const VOID = {
  /** túnel: raio, comprimento, quanto ele se curva (o ponto de fuga passeia) */
  tunnel: { radius: 3.5, length: 110, bend: 1 },
  /** Anéis: profundidade, raio, espessura, inclinação (rad), giro (rad/s, sinal = sentido), deriva para a câmera (unid./s). */
  rings: [
    { d: 7.5, r: 2.55, w: 0.022, tx: 0.42, ty: -0.18, spin: 0.34, flow: 0.55 },
    { d: 10.5, r: 2.85, w: 0.018, tx: -0.3, ty: 0.36, spin: -0.22, flow: 0.55 },
    { d: 14.5, r: 3.0, w: 0.02, tx: 0.16, ty: 0.48, spin: 0.46, flow: 0.55 },
    { d: 19.5, r: 2.9, w: 0.016, tx: -0.5, ty: -0.12, spin: -0.3, flow: 0.55 },
    { d: 26, r: 2.75, w: 0.018, tx: 0.28, ty: -0.42, spin: 0.2, flow: 0.55 },
    { d: 34, r: 2.6, w: 0.016, tx: -0.2, ty: 0.22, spin: -0.4, flow: 0.55 },
    { d: 44, r: 2.4, w: 0.014, tx: 0.36, ty: 0.3, spin: 0.26, flow: 0.55 },
  ],
  /** Correntes de luz em hélice: raio, voltas por 10 unid., fase, velocidade do pulso, espessura. */
  currents: [
    { r: 1.4, turns: 0.32, ph: 0.0, speed: 0.34, w: 0.012 },
    { r: 2.1, turns: -0.26, ph: 1.7, speed: 0.28, w: 0.014 },
    { r: 2.7, turns: 0.21, ph: 3.1, speed: 0.4, w: 0.012 },
    { r: 1.8, turns: -0.38, ph: 4.4, speed: 0.31, w: 0.01 },
    { r: 3.05, turns: 0.17, ph: 5.6, speed: 0.36, w: 0.013 },
    { r: 2.35, turns: 0.29, ph: 2.4, speed: 0.26, w: 0.011 },
    { r: 1.1, turns: -0.45, ph: 0.9, speed: 0.44, w: 0.009 },
    { r: 2.9, turns: -0.2, ph: 3.9, speed: 0.3, w: 0.012 },
  ],
  /** Estilhaços: (u, v) em raios, z, tamanho em raios, giro (rad/s). */
  shards: [
    { u: -0.66, v: 0.46, z: 7.5, s: 0.09, spin: 0.4 },
    { u: 0.74, v: 0.38, z: 8.2, s: 0.08, spin: -0.33 },
    { u: 0.34, v: -0.62, z: 6.8, s: 0.085, spin: 0.46 },
    { u: -0.9, v: -0.3, z: 5.2, s: 0.1, spin: -0.28 },
    { u: 1.14, v: -0.46, z: 4.4, s: 0.12, spin: 0.24 },
    { u: 0.98, v: 0.64, z: 5.6, s: 0.09, spin: -0.38 },
    { u: -0.42, v: 1.0, z: 6.0, s: 0.085, spin: 0.3 },
    { u: 0.56, v: -1.1, z: 5.4, s: 0.095, spin: -0.26 },
    { u: -1.4, v: 0.2, z: 3.8, s: 0.14, spin: 0.2 },
    { u: 0.2, v: 1.3, z: 7.2, s: 0.08, spin: 0.36 },
  ],
  particles: { high: 1800, low: 750 },
};
