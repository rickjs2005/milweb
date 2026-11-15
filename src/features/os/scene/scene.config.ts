import type { OsTheme } from "../theme";

/**
 * O FUNDO DO MILWEB OS — a entidade.
 *
 * Um personagem 3D autoral (assets/entity → public/models/entity.glb) flutua
 * atrás da interface e reage à navegação: olha para o aplicativo destacado,
 * aproxima o corpo e leva a ponta do indicador até a posição REAL do ícone
 * na tela. O mesmo asset serve aos dois temas — muda a luz, o ambiente e a
 * cor da emissão:
 *
 *   dark   · tema Obito (escuro): grafite sobre carvão, emissão vermelha
 *   light  · tema Gojo (claro): grafite sobre gelo, emissão azul
 *
 * Cena em Three.js (scene/engine.ts), com um laço só — o ticker do GSAP — e
 * tempo decorrido. Tudo aqui é número de ajuste: pose, alcance, ritmo,
 * intensidade. Ver docs/milweb-os-references.md › "Revisão 17".
 */
export type Mood = "dark" | "light";

export const MOOD_OF: Record<OsTheme, Mood> = { obito: "dark", gojo: "light" };
export const THEME_OF: Record<Mood, OsTheme> = { dark: "obito", light: "gojo" };

/**
 * O modelo, com a revisão do arquivo na URL (next.config.mjs › entityRev, embutida no build): o código e o
 * GLB são sempre do mesmo par. Sem ela, um GLB antigo no cache do navegador (um dia de validade) encontrava
 * o código novo, faltava um clipe e o personagem ficava na imagem estática.
 */
const ENTITY_REV = process.env.NEXT_PUBLIC_ENTITY_REV;
export const ENTITY_URL = ENTITY_REV ? `/models/entity.glb?v=${ENTITY_REV}` : "/models/entity.glb";

export const OS_SCENE = {
  /** Troca de tema: a luz nova nasce no controle e atravessa a tela (s). */
  duration: 1.5,
  /** Progresso em que a interface adota o tema novo (a frente passa pelo meio da tela). */
  commitAt: 0.5,
  /** Câmera: campo de visão vertical (graus). Estreito: o personagem não deforma ao se deslocar. */
  fov: 24,
  /**
   * Teto de quadros: 60 sempre que algo se mexe por causa do visitante (gesto, troca de tema, ponteiro
   * andando — a cabeça o acompanha) e por `calm` s depois. Em repouso de verdade: 60 se a GPU tem folga
   * (custo do quadro ≤ `budget.smoothMs`), senão 30 — a flutuação lenta aguenta, o olhar não.
   */
  fps: { idle: 30, active: 60, calm: 2.4 },
  /**
   * Resolução: começa em min(devicePixelRatio, max); logo depois de carregar, o motor mede o custo real de
   * um quadro (sincronizado com a GPU) e, se passar de `targetMs`, baixa a resolução na proporção — com o
   * canvas ainda invisível. Se mesmo assim o quadro custar mais que `heavyMs`, os gestos ficam em 30 qps.
   * Acima de `giveUpMs` na resolução mínima a GPU não dá conta: o motor sai e fica a imagem estática.
   * Em regime, o monitor de quadros ainda a baixa em passos quando o quadro fica lento, até `min`.
   * Antialias do próprio contexto.
   */
  budget: { maxDpr: 1.5, mobileMaxDpr: 1.5, liteMaxDpr: 1.15, minDpr: 0.6, targetMs: 9, smoothMs: 6, heavyMs: 20, giveUpMs: 45, slowMs: 24, step: 0.85 },
  /** Paralaxe: a câmera anda um pouco com o mouse (unidades do mundo) — constante de tempo (s) e ociosidade (s). */
  parallax: { amount: 0.07, tau: 0.95, idle: 3.5 },
  /** Período do relógio dos shaders (s): evita perda de precisão em sessões longas. */
  timeWrap: 3600,
} as const;

/**
 * Composição (frações da área do fundo). O personagem mede `height` unidades;
 * `k` é quantos px vale uma unidade — a câmera se afasta ou aproxima para isso.
 */
export const COMPOSE = {
  /** Altura do modelo em unidades (dos pés à ponta da crista) e altura do quadril (o pivô). */
  height: 2.12,
  hips: 1.1,
  desktop: {
    /** px por unidade = min(kH × altura, kW × largura). */
    kH: 0.35,
    kW: 0.205,
    /** Centro do corpo (quadril) em repouso. */
    home: { x: 0.565, y: 0.52 },
    /** Com janela aberta: recolhido à direita, um pouco menor na profundidade. */
    present: { x: 0.9, y: 0.56, z: -0.9 },
    /** Até onde o quadril pode ir ao se aproximar de um app (frações da área). */
    bounds: { x0: 0.2, x1: 0.92, y0: 0.52, y1: 0.575 },
  },
  /** Tablet (coluna de apps à esquerda, HUD das redes em volta do palco). */
  tablet: {
    kH: 0.3,
    kW: 0.36,
    home: { x: 0.56, y: 0.5 },
    present: { x: 0.86, y: 0.52, z: -0.9 },
    bounds: { x0: 0.26, x1: 0.9, y0: 0.2, y1: 0.8 },
  },
  /** Telefone: o personagem ocupa o palco (entre o status e a grade); `kS` × altura do palco, `kW` × largura. */
  mobile: {
    kS: 0.4,
    kW: 0.52,
    /** deslocamento do quadril em relação ao centro do palco (frações da altura do palco) */
    homeDy: 0.04,
    bounds: { x0: 0.24, x1: 0.76, y0: 0.14, y1: 0.86 },
  },
} as const;

/**
 * Alcance e coreografia. Distâncias em unidades do modelo, tempos em segundos,
 * ângulos em graus. O braço mede ~0,88 do ombro à ponta do indicador.
 */
export const REACH = {
  /** Plano onde a ponta do dedo trabalha (à frente do corpo, em direção à câmera). */
  planeZ: 0.2,
  /** Fração do comprimento do braço usada no alcance confortável (o corpo se aproxima para caber nela). */
  comfort: 0.8,
  /** Nunca trava o cotovelo: fração máxima do comprimento ombro–pulso. */
  maxStretch: 0.985,
  /**
   * O corpo chega primeiro, o braço estende depois: enquanto o corpo se aproxima, a ponta do dedo só vai
   * até esta fração do alcance a partir do ombro (o cotovelo fica dobrado, sem o braço travado à espera).
   */
  armLead: 0.9,
  /** A ponta do dedo não entra neste raio em volta do ombro (fração do alcance): ali o cotovelo dobraria demais. */
  armMin: 0.6,
  /** Atenção (hover/foco): a ponta do dedo para a esta distância do ícone. */
  hoverGap: 0.13,
  /** Toque: quanto o dedo avança sobre o ponto de contato e por quanto tempo. */
  press: { depth: 0.014, in: 0.16, hold: 0.09, out: 0.36 },
  /** De onde o dedo chega ao ícone (vetor do contato para o corpo; x é multiplicado pelo lado). */
  approachSide: { x: 0.9, y: 0.18, z: 0.4 },
  approachAbove: { x: 0.16, y: 0.9, z: 0.42 },
  /** Com um app vizinho no caminho: quase horizontal, rente ao vão acima da fileira. */
  approachOver: { x: 0.97, y: 0.1, z: 0.22 },
  /** Pelo lado: o ombro fica esta fração do alcance ABAIXO do contato (o braço sobe um pouco até o ícone). */
  bodySide: { x: 1, y: 0.1 },
  bodyAbove: { x: 0.28, y: 1 },
  /**
   * Molas (rad/s): corpo, ponta do dedo, olhar. Maior = mais rápido. Corpo e mão andam em DUAS molas em
   * série (o alvo passa antes por uma mola `lead` vezes mais rápida): a partida fica sem tranco —
   * acelera aos poucos, em vez de arrancar — e a chegada continua sem ultrapassar. Para deixar tudo mais
   * solto ou mais firme, mexa aqui: é o "quão suave" do personagem.
   */
  spring: { body: 5.6, bodyRush: 7.6, hand: 11.5, handRush: 15, look: 4.4, lead: 1.7 },
  /** Mistura dos clipes e do IK (constantes de tempo, s). */
  blend: { clip: 0.26, ik: 0.2, ikOut: 0.46 },
  /** Depois de quanto tempo sem app destacado o personagem volta ao repouso. */
  grace: 0.6,
  /** Quanto o corpo inclina na direção do alvo (graus) por unidade de deslocamento, e o teto. */
  lean: { perUnit: 7, max: 10 },
  /** Limites articulares (iguais aos gravados no .blend — assets/entity/entity_anim.py › LIMITS). */
  limits: { elbowMin: 6, elbowMax: 150, wrist: 62, headYaw: 40, headPitch: 30 },
  /** O olhar mira um ponto à frente do plano dos apps, para a cabeça não virar de perfil. */
  lookAhead: 1.25,
} as const;

/**
 * Apresentação — uma vez, quando o personagem entra em cena: surge (sobe e cresce, com os fragmentos
 * convergindo), dá um giro completo e faz uma reverência (clipe `Bow`). Tempos em segundos a partir do início.
 * Qualquer interação do visitante interrompe e o corpo assenta sozinho.
 */
export const INTRO = {
  /** Surgir: duração, de quanto abaixo vem (unidades) e de que escala parte. */
  appear: 1.0,
  rise: 0.55,
  scaleFrom: 0.62,
  /** Giro: início, duração e número de voltas. */
  spinAt: 0.55,
  spin: 1.7,
  turns: 1,
  /** Reverência: início (o clipe dura ~2,1 s) e fim da apresentação. */
  bowAt: 2.35,
  end: 4.6,
} as const;

/** Cores por tema (sRGB). A emissão do modelo, a luz de recorte e o ponto de contato usam `accent`. */
export const PALETTE: Record<Mood, { base: string; deep: string; glow: string; haze: string; accent: string; key: string; rim: string; fill: string; sky: string; ground: string }> = {
  dark: { base: "#0a0a0c", deep: "#050506", glow: "#3a0b0a", haze: "#1a1012", accent: "#ff3a2a", key: "#fff1e6", rim: "#ff2a1c", fill: "#3a4a66", sky: "#20222a", ground: "#0b0606" },
  light: { base: "#f3f5f8", deep: "#dfe6ee", glow: "#ffffff", haze: "#cfdbe8", accent: "#1f6bff", key: "#ffffff", rim: "#3d8bff", fill: "#b8c6d8", sky: "#c9d4e2", ground: "#5d6878" },
};

/** Luz e material por tema: intensidades (three, unidades físicas desligadas) e exposição. */
export const LOOK: Record<Mood, { exposure: number; key: number; rim: number; hemi: number; env: number; emissive: number; particles: number }> = {
  dark: { exposure: 1.2, key: 3.3, rim: 5.0, hemi: 0.6, env: 1.3, emissive: 1.0, particles: 0.5 },
  light: { exposure: 1.0, key: 2.4, rim: 4.2, hemi: 0.5, env: 1.15, emissive: 1.0, particles: 0.35 },
};

/**
 * Imagens estáticas (scripts/entity-still.mjs): o personagem em repouso, fundo transparente,
 * desenhado com o quadril em (cx, cy) e `k` px por unidade. O CSS as posiciona por
 * `--en-x/--en-y/--en-k` (styles/os.css › .os-scene__still).
 */
export const SCENE_STILL = { w: 760, h: 1040, cx: 380, cy: 540, k: 430 } as const;
