import type { MiloQuality } from "./milo.types";

/**
 * MILO NULL — configuração única do personagem.
 * Proporções (metros), pose de repouso (radianos), colocação em cena,
 * níveis de qualidade e defaults dos shaders. Redesenhar o Milo = editar
 * este arquivo; os componentes só leem daqui.
 */
export const MILO = {
  /** Altura total aproximada (pés → topo da cabeça). */
  height: 1.88,

  proportions: {
    pelvis: { w: 0.19, h: 0.13, d: 0.13 },
    spine: { len: 0.2, r: 0.1 },
    chest: { len: 0.3, r: 0.13, wx: 1.55, wz: 0.82 }, // cápsula escalada: largo e raso
    neck: { len: 0.1, r: 0.05 },
    head: { w: 0.158, h: 0.235, d: 0.19 },
    shoulderHalf: 0.215, // metade da distância entre ombros
    upperArm: { len: 0.31, r: 0.046 },
    forearm: { len: 0.285, r: 0.038 },
    hand: { len: 0.185, r: 0.036 },
    thigh: { len: 0.46, r: 0.068 },
    shin: { len: 0.44, r: 0.05 },
    foot: { len: 0.26, r: 0.04 },
    joint: 1.18, // fator do raio das esferas de articulação em relação ao osso
  },

  /**
   * Pose de repouso — assimétrica de propósito: peso na perna esquerda,
   * pé direito aberto à frente, mão esquerda solta atrás, direita levemente
   * à frente, cabeça 6° para o lado. Euler XYZ por osso (rad).
   */
  pose: {
    pelvis: [0, 0.06, 0.05],
    spine: [0.02, 0, -0.03],
    chest: [-0.04, -0.08, -0.02],
    neck: [0.06, 0, 0.02],
    head: [-0.02, 0.1, 0],
    leftShoulder: [0, 0, 0.14],
    leftArm: [0.08, 0, 0.13],
    leftForearm: [-0.32, 0.25, 0],
    leftHand: [-0.1, 0, 0],
    rightShoulder: [0, 0, -0.1],
    rightArm: [-0.28, 0, -0.12],
    rightForearm: [-0.7, -0.35, 0],
    rightHand: [-0.15, 0, 0],
    leftLeg: [0.02, 0, 0.03],
    leftShin: [0.03, 0, 0],
    leftFoot: [-1.55, 0.05, 0],
    rightLeg: [-0.14, -0.22, -0.16],
    rightShin: [0.22, 0, 0],
    rightFoot: [-1.5, -0.2, 0],
  } as const,

  /** Colocação em cena por largura de viewport. */
  placement: {
    desktop: { x: 0.9, y: -0.02, z: 0, scale: 1 },
    mobile: { x: 0.22, y: 0.36, z: 0, scale: 0.6 },
  },
  camera: { fov: 27, position: [0, 0.98, 5.6] as [number, number, number], target: [0, 0.96, 0] as [number, number, number] },

  observe: {
    headYaw: 0.5,
    headPitch: 0.26,
    chestFactor: 0.32,
    spring: { k: 26, c: 8.5 },
  },

  touch: {
    /** Âncora do painel em coordenadas do MiloRoot (à direita, altura do peito, à frente). */
    anchor: [0.62, 1.12, 0.32] as [number, number, number],
    /** Direção do cotovelo (pole vector) em coordenadas do root. */
    pole: [0.35, -0.55, 0.45] as [number, number, number],
    /** Distância mão→âncora abaixo da qual há contato (pulso na grid). */
    contact: 0.075,
  },

  idle: { breath: 0.55, sway: 0.16, coat: 0.7 },

  /** Casaco arquitetônico (coordenadas do peito). */
  coat: {
    top: 0.19, // altura da linha dos ombros em relação ao pivot do peito
    hem: -0.72, // bainha média
    hemAsym: 0.2, // quanto o lado esquerdo desce a mais
    rx: [0.29, 0.31] as [number, number], // raio lateral ombro → bainha
    rz: [0.175, 0.2] as [number, number],
    collar: { height: 0.17, asym: 0.45, spread: 2.05 }, // gola: altura, assimetria (lado direito mais alto), abertura angular (rad) onde começa
    gap: 0.42, // abertura frontal (rad, meio ângulo)
    cut: { at: -1.05, depth: 0.16 }, // recorte diagonal da bainha (frente direita)
    rows: 18,
    cols: 44,
  },

  quality: {
    high: { dpr: 1.75, scene: 1, mask: 1, particles: 420, noise: 2, secondaryEvery: 1 },
    medium: { dpr: 1.25, scene: 0.5, mask: 0.6, particles: 220, noise: 1, secondaryEvery: 2 },
    low: { dpr: 1, scene: 0.5, mask: 0.6, particles: 110, noise: 0, secondaryEvery: 3 },
  } satisfies Record<MiloQuality, { dpr: number; scene: number; mask: number; particles: number; noise: number; secondaryEvery: number }>,

  shader: { distortion: 0.026, edge: 0.42, noiseScale: 2.6, noiseSpeed: 0.22, glitch: 0.35 },

  /** Grid técnica do fundo (px de CSS). */
  grid: { cell: 40, major: 6 },
} as const;

export type MiloConfig = typeof MILO;
