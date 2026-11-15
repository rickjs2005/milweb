/**
 * Atalhos sociais em 3D — parâmetros de ajuste (geometria, material, luz, interação).
 *
 * As peças são geradas no navegador (social-3d.ts) a partir dos vetores de social-paths.ts:
 * base quadrada de cantos arredondados com espessura e chanfro, moldura que deixa a face
 * rebaixada, símbolo da marca extrudado em metal claro e um filete que acende na cor do tema.
 * Medidas em frações do lado da placa (1 = o lado do ícone HTML, hoje 38 px), ângulos em graus,
 * tempos em segundos.
 */
export const SOCIAL3D = {
  /** Folga do canvas em volta do grupo (px): a inclinação e a elevação não podem cortar na borda. */
  pad: 18,
  /** Resolução do canvas: devicePixelRatio × `dprBoost`, entre `dprMin` e `dprMax` — os ícones são pequenos e precisam de nitidez. */
  dprBoost: 2,
  dprMin: 2,
  dprMax: 3,
  /** Câmera longe e de campo estreito: quase ortográfica, para os quatro ficarem iguais. Distância em px. */
  cameraDistance: 1500,

  base: {
    /** Lado da base em relação à placa HTML (1 = mesmo tamanho) e raio dos cantos. */
    size: 1.0,
    radius: 0.27,
    /** Espessura do corpo e chanfro das arestas. */
    depth: 0.17,
    bevel: 0.034,
    bevelSegments: 3,
  },
  /** Moldura da face: largura da borda e quanto ela sobe (é o rebaixo da face). */
  rim: { inset: 0.085, height: 0.026, bevel: 0.01 },
  symbol: {
    /** Altura do relevo do símbolo e chanfro (pequeno: detalhes finos não podem fechar). */
    depth: 0.05,
    bevel: 0.011,
    bevelSegments: 2,
    curveSegments: 6,
    /** Tamanho de cada marca dentro da face (maior dimensão, fração da placa) — ajuste óptico por símbolo. */
    size: { linkedin: 0.46, github: 0.56, instagram: 0.5, whatsapp: 0.56 } as Record<string, number>,
  },
  /** Filete que acende na base (largura, altura, posição vertical). */
  line: { w: 0.4, h: 0.024, y: -0.335 },

  material: {
    graphite: { color: "#1e2126", metalness: 0.58, roughness: 0.4 },
    /** Prata acetinada: metal parcial, para a luz difusa manter o símbolo claro mesmo sem reflexo forte. */
    silver: { color: "#f1f4f8", metalness: 0.55, roughness: 0.3 },
    env: 1.5,
  },
  light: {
    /** Luz principal (vem de cima, à esquerda e à frente): direção, intensidade e sombra do relevo. */
    key: { dir: [-0.5, 0.8, 1.0] as [number, number, number], intensity: 3.4 },
    fill: 0.85,
    /** Reflexo na cor do tema por baixo de cada peça: intensidade máxima no hover/foco. */
    glow: 26,
    shadowMap: 1024,
  },

  /** Pose de repouso: leve perspectiva para a espessura aparecer (graus). */
  rest: { rx: -11, ry: 9 },
  hover: {
    /** Inclinação máxima seguindo o cursor (graus), elevação (px) e escala. */
    tilt: 8,
    lift: 4,
    forward: 7,
    scale: 1.045,
  },
  /** Pressionado: recuo como uma tecla (px) e escala. */
  press: { sink: 3.2, scale: 0.965 },
  /** Constantes de tempo das transições (s). */
  ease: { tilt: 0.09, lift: 0.13, pressIn: 0.05, pressOut: 0.12, glow: 0.2 },
} as const;
