/**
 * O GLOBO DO HERO — constantes da cena.
 *
 * Duas famílias de números, e elas não se misturam:
 *
 *  1. GLYPH  como transformar a caixa DOM do "O" na geometria do círculo.
 *     São proporções da Archivo (caixa alta, wdth 125 / wght 900) medidas na
 *     tela, não chutes: o anel do shader tem que nascer EXATAMENTE em cima do
 *     glifo, senão a troca entre texto e canvas aparece como um salto.
 *
 *  2. PLACE  onde o globo termina, em fração da caixa do Hero. Desktop usa o
 *     vazio da direita que o Milo deixou; mobile põe o globo ABAIXO da
 *     manchete, na faixa entre ela e a metadata — nunca por cima do texto.
 */
export const GLOBE_GLYPH = {
  /** altura da caixa-régua (em) usada para achar a linha de base e a altura de caixa alta */
  capEm: 0.72,
  /**
   * Os quatro números abaixo NÃO são estimativas: saíram de `measureText` com
   * `actualBoundingBox*` sobre o "O" na fonte e nos eixos reais da manchete
   * (Archivo, wght 900 / wdth 125), medidos em 1920, 1366 e 390 — ver
   * `scripts/.rsc-audit/globe/glyph-metrics.mjs`. Chutar aqui aparece: o anel
   * do canvas nasce por cima do glifo, e alguns px de diferença transformam a
   * troca contínua num piscar.
   */
  /** altura da tinta do "O" ÷ altura de caixa alta (o overshoot ótico é mínimo aqui) */
  overshoot: 1.005,
  /** largura da tinta ÷ largura de avanço da caixa (o "O" tem folga nas laterais) */
  widthRatio: 0.785,
  /** centro vertical da tinta acima da linha de base, em frações da caixa alta */
  centerRatio: 0.475,
  /** espessura da haste como fração do raio. A Archivo Black é pesadíssima: a
   *  haste horizontal mede 0,60 do raio (a contra-forma é só 40 %). 0,56 é o
   *  meio-termo com a haste de cima/baixo, que é mais fina. */
  stroke: 0.56,
} as const;

export const GLOBE_PLACE = {
  desktop: {
    /** centro final em fração da caixa do Hero */
    cx: 0.77,
    cy: 0.37,
    /** raio final: o menor entre uma fração da largura e uma da altura. Os dois
     *  tetos existem para o globo NUNCA alcançar o bloco da manchete, que ocupa
     *  ~61 % da largura útil: com cx 0,77 a borda esquerda cai em 0,63 W em
     *  qualquer proporção de tela testada (16:9, 16:10, 4:3). */
    rw: 0.145,
    rh: 0.25,
  },
  mobile: {
    cx: 0.62,
    /** só serve de piso: no celular o Y é MEDIDO na faixa livre (ver orbTarget) */
    cy: 0.62,
    /** ~42 vw de diâmetro → 0,21 de raio; os tetos por altura e pela faixa livre
     *  evitam que o globo encoste na sub, no CTA ou no rodapé em telas baixas */
    rw: 0.21,
    rh: 0.17,
  },
} as const;

export const GLOBE_MOTION = {
  /**
   * Orientação em repouso (rad). Deixa o Atlântico Sul de frente — ou seja, o
   * marcador do Brasil visível — quando o globo termina de se formar. Não é um
   * número escolhido a olho: com uTilt = −0,36, a longitude no centro da tela é
   * `spin + π/2`, então spin = −47,9° − 90° = −2,407 rad.
   */
  spinHome: -2.407,
  /** quanto a migração adiciona de giro (rad) — é a "resposta ao scroll" */
  spinFromScroll: 0.85,
  /**
   * Deriva contínua: amplitude LIMITADA (±0,22 rad ≈ ±13°) em vez de rotação
   * livre. Rotação livre daria a volta em ~2 min e deixaria o marcador atrás do
   * globo na maior parte do tempo — e um globo girando sozinho é exatamente a
   * leitura "demo de Three.js" que a direção pede para evitar. Assim o objeto
   * está vivo, os continentes andam, e o Brasil nunca sai de vista.
   */
  drift: 0.22,
  driftSpeed: 0.08,
  /** inclinação do eixo (rad) e a variação lenta de câmera em torno dela */
  tilt: -0.36,
  tiltWobble: 0.035,
  /** teto de quadros: o globo tem movimento lento, 30–40 fps bastam */
  fpsHigh: 40,
  fpsLow: 30,
  /** custo (ms) do frame de sonda acima do qual o canvas não monta */
  probeBudgetMs: 4,
} as const;

/**
 * SAÍDA — o que acontece com o globo depois que a ENTREGA entra e o pin está
 * prestes a soltar: ele cresce e escapa pela lateral, ainda visível, e a section
 * o leva embora ao rolar. No celular a fuga é bem menor: a tela é estreita, e um
 * deslocamento grande jogaria metade do globo para fora antes da hora.
 */
export const GLOBE_EXIT = {
  desktop: { scale: 1.42, dx: 0.16, dy: -0.1 },
  mobile: { scale: 1.22, dx: 0.13, dy: 0.04 },
} as const;

/**
 * O MOUSE — o globo "olha" para o cursor. Só ponteiro fino (desktop): a posição
 * do mouse na janela, normalizada em [-1, 1], vira um deslocamento de giro
 * (yaw) e de inclinação (pitch) somado ao repouso, com amortecimento no próprio
 * loop de render — acompanha com inércia e volta sozinho quando o mouse sai.
 * As amplitudes são LIMITADAS pelo mesmo motivo da deriva: com ±0,52 rad de yaw
 * o Brasil continua no hemisfério visível a partir de `spinHome`.
 */
export const GLOBE_POINTER = {
  /** rad por unidade de mouse (mouse na borda da janela = ±yaw) */
  yaw: 0.52,
  pitch: 0.16,
  /** fração do caminho percorrida por frame de 60 fps (0,07 ≈ 0,4 s até o repouso) */
  damp: 0.07,
} as const;

/**
 * A VIDA — o marcador pulsa e arcos de grande círculo saem do Brasil para o
 * mundo, com um ponto de sinal percorrendo cada um. Tudo constante, cozido no
 * shader em tempo de build (o renderer não tem uniform de array, e não precisa:
 * a rota é dado editorial, não estado). Só aparece quando o globo está formado
 * (mesmo gatilho do marcador, `uMark`). Tinta a 35 % para os arcos; o ponto que
 * viaja é o único a usar Signal Green, junto com o pulso.
 */
export const GLOBE_LIFE = {
  origin: { lat: -15.8, lon: -47.9 },
  arcs: [
    { name: "Nova York", lat: 40.7, lon: -74.0, speed: 0.11, phase: 0.0 },
    { name: "Lisboa", lat: 38.7, lon: -9.1, speed: 0.09, phase: 0.35 },
    { name: "Berlim", lat: 52.5, lon: 13.4, speed: 0.08, phase: 0.6 },
    { name: "Cidade do México", lat: 19.4, lon: -99.1, speed: 0.13, phase: 0.2 },
    { name: "Buenos Aires", lat: -34.6, lon: -58.4, speed: 0.16, phase: 0.8 },
  ],
  arcAlpha: 0.35,
  /** segundos por ciclo do anel que expande a partir do marcador */
  pulsePeriod: 2.4,
} as const;
