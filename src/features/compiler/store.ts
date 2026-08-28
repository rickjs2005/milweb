/**
 * Estado único da escultura — um objeto mutável que o GSAP interpola e o
 * renderer lê por frame. Quem manda: o Compiler (scroll da Home), o Boot
 * (introdução), o Break (ruptura). Ninguém cria canvas: só escreve aqui.
 */
export type CompilerStateName = "boot" | "assembled" | "kavita" | "terral" | "vertex" | "aurex" | "lab" | "collapsed";

export type CompilerValues = {
  assemble: number;
  spread: number;
  flatten: number;
  warm: number;
  ringSpd: number;
  scan: number;
  collapse: number;
  anomaly: number;
  lab: number;
  ink: number;
  /** centro na tela, 0–1 (x da esquerda, y de baixo). */
  cx: number;
  cy: number;
  /** raio como fração da altura da viewport. */
  scale: number;
  /** opacidade global (esconde sem desmontar). */
  opacity: number;
};

export const PRESETS: Record<CompilerStateName, Partial<CompilerValues>> = {
  boot: { assemble: 0, spread: 0.3, flatten: 0, warm: 0, ringSpd: 0.2, scan: 0, collapse: 0, lab: 0 },
  assembled: { assemble: 1, spread: 0.25, flatten: 0, warm: 0, ringSpd: 0.35, scan: 0, collapse: 0, lab: 0 },
  kavita: { assemble: 1, spread: 0.75, flatten: 0.55, warm: 0, ringSpd: 0.15, scan: 1, collapse: 0, lab: 0 },
  terral: { assemble: 1, spread: 0.15, flatten: 0.1, warm: 1, ringSpd: 0.08, scan: 0, collapse: 0, lab: 0 },
  vertex: { assemble: 1, spread: 0.05, flatten: 0.9, warm: 0, ringSpd: 0.25, scan: 0, collapse: 0, lab: 0 },
  aurex: { assemble: 1, spread: 1, flatten: 0, warm: 0, ringSpd: 1, scan: 0, collapse: 0, lab: 0 },
  lab: { assemble: 1, spread: 0.4, flatten: 0.2, warm: 0, ringSpd: 0.6, scan: 0, collapse: 0, lab: 1 },
  collapsed: { assemble: 1, spread: 0, flatten: 1, warm: 0, ringSpd: 0, scan: 0, collapse: 1, lab: 0 },
};

type Listener = () => void;

class CompilerStore {
  values: CompilerValues = { assemble: 0, spread: 0.3, flatten: 0, warm: 0, ringSpd: 0.2, scan: 0, collapse: 0, anomaly: 0, lab: 0, ink: 0, cx: 0.68, cy: 0.5, scale: 0.34, opacity: 0 };
  state: CompilerStateName = "boot";
  /** ponteiro normalizado −1..1 (suavizado pelo renderer). */
  pointer = { x: 0, y: 0 };
  /** true enquanto o canvas está montado e desenhando. */
  mounted = false;
  private listeners = new Set<Listener>();
  /** Pede um frame ao renderer (ligado pelo Compiler). */
  invalidate: () => void = () => {};
  /** Segura frames contínuos (ligado pelo Compiler). Retorna release. */
  hold: () => () => void = () => () => {};

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  notify() {
    this.listeners.forEach((l) => l());
  }
}

export const compiler = new CompilerStore();
