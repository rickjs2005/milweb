import type * as THREE from "three";

/** Estados narrativos do Milo (máquina simples, reversível). */
export type MiloState = "dormant" | "observe" | "touch" | "dissolve" | "transition" | "full";

/** Nível de qualidade do protótipo (derivado de lib/quality + spec do Milo). */
export type MiloQuality = "high" | "medium" | "low";

export type BoneName =
  | "pelvis"
  | "spine"
  | "chest"
  | "neck"
  | "head"
  | "leftShoulder"
  | "leftArm"
  | "leftForearm"
  | "leftHand"
  | "rightShoulder"
  | "rightArm"
  | "rightForearm"
  | "rightHand"
  | "leftLeg"
  | "leftShin"
  | "leftFoot"
  | "rightLeg"
  | "rightShin"
  | "rightFoot";

export type Bone = {
  name: BoneName;
  /** Grupo posicionado NA articulação; o membro desce pelo -Y local. */
  group: THREE.Group;
  /** Comprimento do osso (distância até a próxima articulação). */
  length: number;
  /** Quaternion da pose de repouso (a animação parte daqui a cada frame). */
  rest: THREE.Quaternion;
};

export type MiloRigHandle = {
  root: THREE.Group;
  bones: Record<BoneName, Bone>;
  /** Objetos cujas posições mundiais alimentam partículas e o painel (ordem estável). */
  joints: THREE.Object3D[];
  /** Ponta da mão direita (alvo do painel). */
  rightHandTip: THREE.Object3D;
  dispose: () => void;
};

/** Valores de alta frequência — mutados por frame, nunca passam pelo React. */
export type MiloFrame = {
  pointer: { x: number; y: number }; // NDC −1..1
  pointerUv: { x: number; y: number }; // 0..1
  pointerActive: boolean;
  /** 0 = invisível, 1 = presença total (dissolve anima isto). */
  visibility: number;
  /** 0..1 — quanto acid lime e agitação. */
  energy: number;
  /** Peso do braço no painel (0..1). */
  touch: number;
  /** Peso do acompanhamento do cursor (0..1). */
  observe: number;
  /** Influência da mão sobre o painel (distância → 0..1). */
  panelInfluence: number;
  /** Pulso acid lime na grid (0 = nada, 1 = fim do percurso). */
  pulse: number;
  pulseAt: { x: number; y: number }; // uv
  scroll: number;
  params: {
    bodyDistortion: number;
    motionDistortion: number;
    interactionDistortion: number;
    gridBend: number;
    edgeCompression: number;
    refractionFalloff: number;
    edge: number;
    noiseScale: number;
    noiseSpeed: number;
    glitch: number;
    wireframeVisibility: number;
    bodyDensity: number;
    maskBlur: number;
    maskDilation: number;
    internalShadow: number;
    particleVisibility: number;
    view: number;
    pelvisDensityMultiplier: number;
    torsoHatchingMultiplier: number;
    thighHatchingMultiplier: number;
    headDistortionMultiplier: number;
    coatFlapMultiplier: number;
    fullParticleMultiplier: number;
  };
  /** Multiplicador de partículas do estado atual (interpolado pelo GSAP). */
  particles: number;
  /** Projeção da cabeça em uv (curvatura da grid ao redor dela). */
  head: { x: number; y: number };
  /** Projeção da mão ativa em uv (interação com o painel). */
  hand: { x: number; y: number };
  /** Onda no casaco (0..1, disparada no contato). */
  coatWave: number;
  /** Projeção do peito em uv e velocidade (deslocamento do fundo). */
  milo: { x: number; y: number; vx: number; vy: number };
  /** Projeção da âncora do painel em uv. */
  panel: { x: number; y: number };
};
