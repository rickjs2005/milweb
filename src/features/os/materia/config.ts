import type { OsTheme } from "../theme";

/**
 * MATÉRIA — a escultura do MilWeb OS.
 *
 * Um ateliê: sobre a parede de carvão (ou de gesso, no tema claro) uma figura de mármore sustenta o peso sobre
 * uma perna, com um ombro ainda preso ao bloco bruto; entre o antebraço e o punho faltam poucos centímetros de
 * pedra, e grãos de prata sobem contra a gravidade para completar esse trecho. Cada destino do sistema tem a sua
 * figura — a Curadora (Projetos), o Arquivista (Perfil), a Arquiteta (Serviços), o Gravador (Estúdio), a Inventora
 * (Lab) e a Mensageira (Orçamento) — e o seu gesto, que abre a página de verdade (materia/acts.ts).
 *
 * As esculturas são esculpidas por distância assinada e vestidas no Blender (assets/materia/sculpt →
 * public/models/sculpt-<figura>{,-lite}.bin); os braços são articulados (assets/materia/build_figure.py →
 * materia-figure{,-lite}.bin, rig.ts). As moléculas (assets/materia/build_materia.py → materia-{a,b}.bin) são a
 * prata: ficam guardadas na pedra, formam o cérebro quando a conversa abre e o busto do recorte ("Ver uma ideia
 * para o meu site") — a molécula i do busto é a molécula i do cérebro.
 *
 *   dark   · tema Obito: carvão, luz rasante que destaca a borda da pedra
 *   light  · tema Gojo: gesso, a sombra revela o volume
 *
 * Tudo aqui é número de ajuste. O motor é materia/engine.ts; a cola com a interface, materia-scene.tsx.
 */
export type Mood = "dark" | "light";
export const MOOD_OF: Record<OsTheme, Mood> = { obito: "dark", gojo: "light" };
export const THEME_OF: Record<Mood, OsTheme> = { dark: "obito", light: "gojo" };

/** A revisão dos arquivos vai na URL (next.config.mjs › materiaRev): código e moléculas andam em par. */
const REV = process.env.NEXT_PUBLIC_MATERIA_REV;
const withRev = (url: string) => (REV ? `${url}?v=${REV}` : url);
export const MATERIA_URLS = { a: withRev("/models/materia-a.bin"), b: withRev("/models/materia-b.bin") } as const;
/** Os braços e as mãos das esculturas (assets/materia/build_figure.py): a malha completa e a leve (telefone, GPU sem folga). */
export const FIGURE_URLS = { full: withRev("/models/materia-figure.bin"), lite: withRev("/models/materia-figure-lite.bin") } as const;

export const MATERIA = {
  /** Troca de tema: a luz nova nasce no controle e atravessa a tela (s); a interface adota o tema em `commitAt`. */
  duration: 1.5,
  commitAt: 0.5,
  fov: 24,
  fps: { idle: 30, active: 60, calm: 1.6 },
  /**
   * A home parada não redesenha (o quadro fica como está): o orçamento vale para os momentos em que algo se
   * mexe. Por isso a resolução pode ficar alta: acima de `heavyMs` o motor roda a 30 quadros em vez de a baixar.
   */
  budget: { maxDpr: 1.6, mobileMaxDpr: 1.75, liteMaxDpr: 1.25, minDpr: 0.72, targetMs: 17, heavyMs: 12, giveUpMs: 55, slowMs: 30, step: 0.88 },
  timeWrap: 3600,
  /** Rosto em três quartos: giro de repouso (rad) e leve inclinação. */
  yaw: -0.6,
  /** Tamanho de uma molécula (unidades do modelo) e quanto a microesfera pesa na normal. */
  size: 0.017,
  bead: 0.24,
  /**
   * Dobrar o tempo: a cabeça segue o ponteiro (giro e inclinação máximos, rad); metade das moléculas
   * repete o trajeto `lag` s depois. `zone` é o raio em volta do rosto (unidades) em que o gesto vale.
   */
  fold: { yaw: 0.62, pitch: 0.2, lag: 0.34, zone: 1.5, follow: 9, release: 3.2 },
  /** Metamorfose busto ↔ cérebro (s) e a fenda de luz que a abre (s). */
  morph: 1.9,
  slit: 0.9,
  /**
   * O recorte no rosto ("Ver uma ideia para o meu site"): a cabeça vira de perfil (`yaw`, rad), o arco da nuca
   * desliza para a frente e a matéria se abre num vão oval — centro `c` e raios `r`, em unidades a partir do
   * centro da cabeça, como se vê na tela. A interface desenha a ideia dentro dele (um pouco menor: `inset`).
   * `sea`: na prévia de mergulho, a que altura do vão passa a linha do mar (fração da altura, de cima para baixo).
   */
  portal: { time: 1.6, close: 0.7, yaw: -1.47, c: [0.06, 0.1], r: [0.31, 0.37], inset: 0.93, sea: 0.38 },
  /** O projeto em destaque: a peça de abertura da coleção (apps/bounty/mural.tsx). */
  hero: { cover: "terral" },
  /**
   * As esculturas. `shift`: a transformação de uma figura em outra (s) — a pedra se desfaz, os grãos viajam, a
   * nova se forma. `form`/`leave`: a escultura voltando da conversa e se recolhendo para ela; `formFast`: quando
   * há um gesto à espera. `armOut`/`armIn`: os braços somem (o ombro por último) e se formam (os dedos primeiro).
   * `grain` e `silver`: o tamanho de um grão da transformação e de um grão de prata do repouso (unidades).
   */
  sculpt: { shift: 0.66, form: 1.0, formFast: 0.42, leave: 0.9, armOut: 0.15, armIn: 0.28, grain: 0.05, silver: 0.045 },
} as const;

/**
 * O enquadramento de cada escultura: o ponto da figura que fica no centro do quadro (`c`, unidades dela) e a
 * meia altura do quadro (`half`). O chão (y = 0) cai na mesma altura da tela em todas: a base não salta na troca.
 */
export const FRAMES: Record<string, { c: readonly [number, number]; half: number }> = {
  rest: { c: [0.25, 4.1], half: 4.75 },
  projects: { c: [0.0, 2.6], half: 3.25 },
  profile: { c: [0.0, 3.3], half: 3.95 },
  services: { c: [-0.25, 4.25], half: 4.9 },
  studio: { c: [0.2, 3.6], half: 4.25 },
  lab: { c: [-0.2, 3.1], half: 3.75 },
  contact: { c: [-0.1, 4.05], half: 4.7 },
};

/**
 * Composição: frações da área do fundo. `k` é quantos px vale uma unidade (a cabeça mede ~1).
 * `hero` é a cena da home: `k` da figura, a altura da ponta da dobra e a distância dela até a borda DIREITA
 * (em unidades) — a figura fica ancorada na borda, e o ombro sai do quadro em qualquer largura. No tablet a
 * cena é menor e fica embaixo, à direita: o alto da tela é do HUD das redes.
 */
export const COMPOSE = {
  /** `hero`: o quadro da escultura — o centro (frações da área) e a altura (fração da altura, limitada pela largura). */
  desktop: { kH: 0.37, kW: 0.25, home: { x: 0.6, y: 0.37 }, talk: { x: 0.5, y: 0.44, k: 1.0 }, hero: { x: 0.665, y: 0.5, h: 0.93, wMax: 0.62 } },
  tablet: { kH: 0.3, kW: 0.4, home: { x: 0.6, y: 0.38 }, talk: { x: 0.52, y: 0.4, k: 0.95 }, hero: { x: 0.6, y: 0.5, h: 0.86, wMax: 0.8 } },
  /** Telefone: rosto e ombros de perto, dentro do palco; na conversa o cérebro sobe para a faixa livre acima da folha. */
  /** O rosto sobe um pouco: sob ele ficam os dois convites (a prévia e a conversa), sem cobrir o queixo. */
  /** `hero`: a escultura ocupa o palco — centro (frações do palco) e altura (fração da altura dele, limitada pela largura). */
  mobile: { kS: 0.78, kW: 0.84, homeDy: -0.135, talk: { y: 0.21, kW: 0.5 }, hero: { x: 0.56, y: 0.5, h: 1.06, wMax: 1.5 } },
} as const;

/** Cores de tela (sRGB), por tema. */
export const PALETTE: Record<Mood, { base: string; deep: string; haze: string; metal: string; key: string; rim: string; accent: string; shade: string }> = {
  dark: { base: "#0a0a0c", deep: "#040405", haze: "#191316", metal: "#c9ced6", key: "#ffffff", rim: "#ff2a2a", accent: "#ff3a2a", shade: "#050507" },
  light: { base: "#f3f5f8", deep: "#dbe3ec", haze: "#c6d3e3", metal: "#aab6c6", key: "#ffffff", rim: "#5b9dff", accent: "#1f6bff", shade: "#1c2a44" },
};

/** Imagens estáticas (scripts/materia-still.mjs): o centro da cabeça fica em (cx, cy), com `k` px por unidade. */
export const MATERIA_STILL = { w: 1040, h: 1180, cx: 520, cy: 400, k: 520 } as const;
/**
 * A cena como imagem (a mesma do motor: a escultura em repouso e a luz do ateliê, sobre a parede lisa na cor do
 * tema): o centro do quadro da figura fica em (x, y) e o quadro mede `fh` px de altura. Um enquadramento só — o
 * CSS a posiciona pelo centro e pela altura do quadro em cada tela (styles/materia.css › --mh-x/--mh-y/--mh-h), e
 * a luz do ateliê se apaga antes das bordas: fora da imagem o fundo continua na cor de `--os-bg`.
 */
export const HERO_STILL = { w: 2100, h: 1250, x: 1050, y: 625, fh: 1000 } as const;
