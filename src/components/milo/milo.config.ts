import type { BoneName, MiloQuality } from "./milo.types";

/**
 * MILO NULL — configuração única do personagem.
 * Proporções (metros), pose de repouso (radianos), colocação em cena,
 * zonas de informação, níveis de qualidade e defaults dos shaders.
 * Redesenhar o Milo = editar este arquivo; os componentes só leem daqui.
 */
export const MILO = {
  /** Altura total aproximada (pés → topo da cabeça). */
  height: 1.9,

  proportions: {
    pelvis: { w: 0.2, h: 0.13, d: 0.13 },
    spine: { len: 0.2, r: 0.1 },
    chest: { len: 0.31, r: 0.13, wx: 1.72, wz: 0.8 }, // cápsula escalada: largo e raso
    neck: { len: 0.13, r: 0.046 },
    head: { w: 0.148, h: 0.25, d: 0.19 },
    shoulderHalf: 0.245, // metade da distância entre ombros — ombros largos são assinatura
    upperArm: { len: 0.31, r: 0.046 },
    forearm: { len: 0.285, r: 0.038 },
    hand: { len: 0.185, r: 0.036 },
    thigh: { len: 0.46, r: 0.068 },
    shin: { len: 0.44, r: 0.05 },
    foot: { len: 0.26, r: 0.04 },
    /** afastamento lateral das pernas (fração da largura da pélvis) — abertura entre as pernas */
    stance: 0.46,
    joint: 1.18,
  },

  /**
   * Pose de repouso em três quartos — ninguém em T-pose: peso na perna
   * esquerda, perna direita à frente e aberta, pélvis com inclinação sutil,
   * ombro direito um pouco mais baixo, peito aberto, pescoço alongado,
   * cabeça compensa parte do giro do tronco e o queixo baixa um pouco
   * (controle, não ameaça). Euler XYZ por osso (rad).
   */
  pose: {
    pelvis: [0.0, 0.1, 0.055],
    spine: [0.01, 0.08, -0.035],
    chest: [-0.09, 0.1, -0.02],
    neck: [0.04, -0.14, 0.03],
    head: [0.1, -0.2, -0.02],
    leftShoulder: [0, 0, 0.1],
    leftArm: [0.1, 0.05, 0.16],
    leftForearm: [-0.28, 0.3, 0.02],
    leftHand: [-0.12, 0, 0.05],
    rightShoulder: [0, 0, -0.18],
    rightArm: [-0.22, 0.05, -0.1],
    rightForearm: [-0.62, -0.3, -0.05],
    rightHand: [-0.18, 0, 0],
    leftLeg: [0.0, 0, 0.04],
    leftShin: [0.02, 0, 0],
    leftFoot: [-1.55, 0.08, 0],
    rightLeg: [-0.2, -0.28, -0.2],
    rightShin: [0.26, 0, 0],
    rightFoot: [-1.5, -0.3, 0.02],
  } satisfies Record<BoneName, readonly [number, number, number]>,

  /** Colocação em cena por largura de viewport. `yaw` = rotação do corpo (três quartos). */
  placement: {
    desktop: { x: 1.0, y: -0.05, z: 0, scale: 1.06, yaw: -0.36 },
    mobile: { x: 0.12, y: -0.5, z: 0, scale: 0.86, yaw: -0.32 },
  },
  camera: { fov: 27, position: [0, 1.0, 5.6] as [number, number, number], target: [0, 1.0, 0] as [number, number, number] },

  observe: {
    headYaw: 0.42,
    headPitch: 0.22,
    chestFactor: 0.2,
    spring: { k: 22, c: 8 },
    shoulderSpring: { k: 12, c: 6 },
    panelRadius: 0.2,
  },

  touch: {
    anchor: [0.66, 1.16, 0.34] as [number, number, number],
    pole: [0.3, -0.6, 0.5] as [number, number, number],
    stopBefore: 0.07,
    contact: 0.11,
  },

  idle: { breath: 0.45, sway: 0.12, coat: 0.55 },

  /** Casaco arquitetônico (coordenadas do peito): duas abas de comprimentos diferentes. */
  coat: {
    top: 0.2,
    hem: -0.66,
    flap: { left: -1.04, right: -0.76 },
    rx: [0.32, 0.31] as [number, number],
    rz: [0.185, 0.2] as [number, number],
    collar: { height: 0.23, asym: 0.5, spread: 1.95 },
    gap: 0.4,
    cut: { at: -1.1, depth: 0.14 },
    rows: 18,
    cols: 44,
  },

  /** Zonas de informação (0 = vazio, 1 = máximo): wireframe, bordas reveladas e partículas por parte. */
  zones: {
    head: 0.35,
    neck: 0.5,
    chest: 0.08,
    spine: 0.1,
    pelvis: 0.28,
    coat: 0.3,
    leftShoulder: 0.85,
    rightShoulder: 1.0,
    leftArm: 0.22,
    leftForearm: 0.25,
    leftHand: 0.3,
    rightArm: 0.75,
    rightForearm: 0.9,
    rightHand: 1.0,
    leftLeg: 0.6,
    leftShin: 0.7,
    leftFoot: 0.5,
    rightLeg: 0.15,
    rightShin: 0.12,
    rightFoot: 0.2,
  } satisfies Record<BoneName | "coat", number>,

  /** Ordem do dissolve (0 some primeiro, 1 por último). */
  dissolveOrder: {
    coat: 0,
    leftHand: 0.1,
    leftForearm: 0.15,
    leftArm: 0.25,
    rightFoot: 0.1,
    rightShin: 0.15,
    rightLeg: 0.25,
    leftFoot: 0.2,
    leftShin: 0.3,
    leftLeg: 0.4,
    rightHand: 0.35,
    rightForearm: 0.4,
    rightArm: 0.5,
    pelvis: 0.55,
    spine: 0.65,
    leftShoulder: 0.7,
    rightShoulder: 0.7,
    chest: 0.85,
    neck: 0.92,
    head: 1,
  } satisfies Record<BoneName | "coat", number>,

  /** Juntas com energia (acid lime/partículas): pesos relativos. */
  energyJoints: { rightShoulder: 1, rightForearm: 0.9, rightHand: 1, neck: 0.5, leftShoulder: 0.25, pelvis: 0.15, leftShin: 0.15 } as Partial<Record<BoneName, number>>,

  quality: {
    high: { dpr: 1.75, scene: 1, mask: 1, particles: 260, noise: 2, secondaryEvery: 1 },
    medium: { dpr: 1.25, scene: 0.5, mask: 0.6, particles: 160, noise: 1, secondaryEvery: 2 },
    low: { dpr: 1, scene: 0.5, mask: 0.6, particles: 90, noise: 0, secondaryEvery: 3 },
  } satisfies Record<MiloQuality, { dpr: number; scene: number; mask: number; particles: number; noise: number; secondaryEvery: number }>,

  /**
   * Distorção (unidades uv da tela). Ajustados à escala real do shader:
   * uma célula da grid ≈ 0,028 uv a 1440 px — deslocamentos maiores que
   * isso viram borrão e o corpo passa a parecer vidro.
   */
  shader: {
    bodyDistortion: 0.034,
    motionDistortion: 0.03,
    interactionDistortion: 0.06,
    gridBend: 0.036,
    edgeCompression: 0.012,
    refractionFalloff: 0.65,
    edge: 0.35,
    noiseScale: 2.6,
    noiseSpeed: 0.2,
    glitch: 0.25,
  },

  /** Grid técnica do fundo (px de CSS). */
  grid: { cell: 40, major: 6 },
} as const;

export type MiloConfig = typeof MILO;
