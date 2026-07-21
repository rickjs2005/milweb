/** Vetor 2D mutável usado em toda a simulação (evita alocação por frame). */
export interface Vec2 {
  x: number;
  y: number;
}

/** Props públicas do componente <SquidFollower />. */
export interface SquidFollowerProps {
  /** Raio base da cabeça em px (manto e tentáculos escalam junto). */
  size?: number;
  /** Opacidade global do canvas (0..1). */
  opacity?: number;
  /** Multiplicador de resposta da mola da cabeça (1 = padrão). */
  speed?: number;
  /** Quantidade de braços (os 2 tentáculos longos saem desse total). */
  tentacles?: number;
  /** Segmentos por tentáculo. */
  segments?: number;
  /** Liga glow/sombra difusa (desligue em máquinas fracas). */
  glow?: boolean;
  /** Reage a hover em links/botões e a cliques. */
  interactive?: boolean;
  /** Partículas luminosas ambientes ao redor da cabeça. */
  particleCount?: number;
  /** Flutuação + bolhas quando o mouse fica parado. */
  idleAnimation?: boolean;
  /** z-index do canvas fixo. */
  zIndex?: number;
}

/** Config resolvida (props + defaults), imutável durante a vida do engine. */
export type SquidConfig = Required<SquidFollowerProps>;

/** Estado da cabeça entregue ao renderer a cada frame. */
export interface HeadState {
  x: number;
  y: number;
  /** Inclinação em radianos (deriva da velocidade horizontal). */
  tilt: number;
  /** Achatamento 0..1 proporcional à velocidade (squash & stretch). */
  squash: number;
  /** Direção normalizada do olhar (-1..1 em cada eixo). */
  lookX: number;
  lookY: number;
  /** 0 = olho aberto, 1 = fechado (piscada). */
  blink: number;
  /** Fator de respiração do manto (≈1, oscila alguns %). */
  breath: number;
  /** Progresso do pulso de clique (0 = início do flash, 1 = terminado). */
  clickPulse: number;
}

/** Tipos de partícula do sistema. */
export type ParticleKind = "ambient" | "bubble" | "spark";

export interface Particle {
  kind: ParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Vida restante em segundos. */
  life: number;
  maxLife: number;
  size: number;
  /** Semente individual para ruído/fase. */
  seed: number;
  alive: boolean;
}
