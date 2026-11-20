import type { OsTheme } from "../theme";

/**
 * MATÉRIA — a escultura do MilWeb OS.
 *
 * Na home, uma figura de mercúrio em superfície contínua (assets/materia/build_figure.py →
 * public/models/materia-figure{,-lite}.bin) segura uma dobra da própria tela; as moléculas
 * (assets/materia/build_materia.py → public/models/materia-{a,b}.bin) ficam nas bordas de ruptura.
 * As MESMAS moléculas formam o cérebro quando a conversa abre e o busto do recorte ("Ver uma ideia
 * para o meu site"): a molécula i do busto é a molécula i do cérebro. O arco que sai do ombro,
 * contorna a nuca e entra na cabeça reaparece no cérebro — e, na home, vira a fita de metal da dobra.
 *
 *   dark   · tema Obito: prata e grafite, uma faixa estreita de luz e um recorte carmesim
 *   light  · tema Gojo: metal frio, sombras azuladas, brilho de vidro
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
/** A figura da home em malha (assets/materia/build_figure.py): a completa e a leve (telefone, GPU sem folga). */
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
  /**
   * A home: a figura segura uma dobra da tela. `form`/`sweep`: quanto leva para a figura se formar e para a
   * faixa de luz percorrer o braço até a cabeça quando a conversa abre (s). `reach`: até onde a ponta acompanha
   * o gesto (unidades da dobra). `spring`: a mola da ponta — firme enquanto o visitante segura, solta depois
   * (é a sobra dela que corre pelo metal como onda). `reveal`: a abertura cresce até a janela do case (s).
   */
  hero: { form: 1.15, sweep: 1.3, reach: 0.3, hold: { k: 150, c: 24 }, free: { k: 96, c: 7.5 }, reveal: 0.78, zone: 0.62, follow: 0.7, cover: "terral",
    /** Abrir Projetos: a outra mão alcança a borda de baixo, as duas esticam a abertura até a janela, soltam (s). */
    open: { reach: 0.32, stretch: 0.8, release: 0.34 },
    /** Apresentar uma ficha (o perfil, o briefing): a mão a ergue, gira o punho e ela cresce até a janela (s). */
    sheet: { raise: 0.42, turn: 0.3, grow: 0.46 },
    /** Trocar de projeto na coleção: uma mão apresenta a próxima peça, a outra retira a anterior (s). */
    swap: 0.75 },
} as const;

/**
 * Composição: frações da área do fundo. `k` é quantos px vale uma unidade (a cabeça mede ~1).
 * `hero` é a cena da home: `k` da figura, a altura da ponta da dobra e a distância dela até a borda DIREITA
 * (em unidades) — a figura fica ancorada na borda, e o ombro sai do quadro em qualquer largura. No tablet a
 * cena é menor e fica embaixo, à direita: o alto da tela é do HUD das redes.
 */
export const COMPOSE = {
  desktop: { kH: 0.37, kW: 0.25, home: { x: 0.6, y: 0.37 }, talk: { x: 0.5, y: 0.44, k: 1.0 }, hero: { kH: 0.412, kW: 0.2472, right: 2.3, y: 0.59 } },
  tablet: { kH: 0.3, kW: 0.4, home: { x: 0.6, y: 0.38 }, talk: { x: 0.52, y: 0.4, k: 0.95 }, hero: { kH: 0.22, kW: 0.25, right: 2.2, y: 0.81 } },
  /** Telefone: rosto e ombros de perto, dentro do palco; na conversa o cérebro sobe para a faixa livre acima da folha. */
  /** O rosto sobe um pouco: sob ele ficam os dois convites (a prévia e a conversa), sem cobrir o queixo. */
  mobile: { kS: 0.78, kW: 0.84, homeDy: -0.135, talk: { y: 0.21, kW: 0.5 }, hero: { kS: 0.46, kW: 0.55, x: 0.19, y: 0.49 } },
} as const;

/** Cores de tela (sRGB), por tema. */
export const PALETTE: Record<Mood, { base: string; deep: string; haze: string; metal: string; key: string; rim: string; accent: string; shade: string }> = {
  dark: { base: "#0a0a0c", deep: "#040405", haze: "#191316", metal: "#c9ced6", key: "#ffffff", rim: "#ff2a2a", accent: "#ff3a2a", shade: "#050507" },
  light: { base: "#f3f5f8", deep: "#dbe3ec", haze: "#c6d3e3", metal: "#aab6c6", key: "#ffffff", rim: "#5b9dff", accent: "#1f6bff", shade: "#1c2a44" },
};

/** Imagens estáticas (scripts/materia-still.mjs): o centro da cabeça fica em (cx, cy), com `k` px por unidade. */
export const MATERIA_STILL = { w: 1040, h: 1180, cx: 520, cy: 400, k: 520 } as const;
/**
 * A cena da home como imagem (a mesma do motor, com a dobra aberta, sobre a página lisa na cor do tema): a ponta
 * da dobra fica em (x, y), com `k` px por unidade. Um enquadramento só — o CSS a posiciona pela ponta e pela
 * escala de cada tela (styles/materia.css), e a cor de `PALETTE.*.base` é a de `--os-bg`: as bordas não aparecem.
 */
export const HERO_STILL = { w: 1500, h: 1100, x: 670, y: 510, k: 350 } as const;
