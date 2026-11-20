import type { OsTheme } from "../theme";

/**
 * MATÉRIA — a escultura do MilWeb OS.
 *
 * Um busto de prata líquida feito de moléculas (assets/materia/build_materia.py →
 * public/models/materia-{a,b}.bin). As MESMAS moléculas formam o cérebro quando a conversa abre:
 * a molécula i do busto é a molécula i do cérebro. O arco que sai do ombro, contorna a nuca e
 * entra na cabeça é a assinatura da silhueta e reaparece no cérebro.
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

export const MATERIA = {
  /** Troca de tema: a luz nova nasce no controle e atravessa a tela (s); a interface adota o tema em `commitAt`. */
  duration: 1.5,
  commitAt: 0.5,
  fov: 24,
  fps: { idle: 30, active: 60, calm: 1.6 },
  budget: { maxDpr: 1.6, mobileMaxDpr: 1.75, liteMaxDpr: 1.25, minDpr: 0.6, targetMs: 9, heavyMs: 20, giveUpMs: 45, slowMs: 24, step: 0.85 },
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
} as const;

/** Composição: frações da área do fundo. `k` é quantos px vale uma unidade (a cabeça mede ~1). */
export const COMPOSE = {
  desktop: { kH: 0.37, kW: 0.25, home: { x: 0.6, y: 0.37 }, talk: { x: 0.5, y: 0.44, k: 1.0 } },
  tablet: { kH: 0.3, kW: 0.4, home: { x: 0.6, y: 0.38 }, talk: { x: 0.52, y: 0.4, k: 0.95 } },
  /** Telefone: rosto e ombros de perto, dentro do palco; na conversa o cérebro sobe para a faixa livre acima da folha. */
  mobile: { kS: 0.78, kW: 0.86, homeDy: -0.1, talk: { y: 0.21, kW: 0.5 } },
} as const;

/** Cores de tela (sRGB), por tema. */
export const PALETTE: Record<Mood, { base: string; deep: string; haze: string; metal: string; key: string; rim: string; accent: string; shade: string }> = {
  dark: { base: "#0b0b0e", deep: "#040405", haze: "#191316", metal: "#c9ced6", key: "#ffffff", rim: "#ff2a2a", accent: "#ff3a2a", shade: "#050507" },
  light: { base: "#f1f4f8", deep: "#dbe3ec", haze: "#c6d3e3", metal: "#aab6c6", key: "#ffffff", rim: "#5b9dff", accent: "#1f6bff", shade: "#1c2a44" },
};

/** Imagens estáticas (scripts/materia-still.mjs): o centro da cabeça fica em (cx, cy), com `k` px por unidade. */
export const MATERIA_STILL = { w: 1040, h: 1180, cx: 520, cy: 400, k: 520 } as const;
