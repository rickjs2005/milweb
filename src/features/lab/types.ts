/**
 * Contrato de um experimento do Lab. Cada um é um módulo separado,
 * importado dinamicamente só quando o visitante pede — e destruído por
 * completo ao encerrar (nenhum shader, física ou listener sobra).
 */
export type ExperimentHandle = { destroy: () => void };

export type StageStrings = { under: string; title: string; surfaceLabel: string; surface: string; tension: string; idle: string; words: string[]; timeWords: readonly string[] };

export type Experiment = (host: HTMLElement, opts?: { onReady?: () => void; strings: StageStrings }) => ExperimentHandle | null;

export type ExperimentId = "tear" | "gravity" | "time";

/** Carregadores — a chave é o id que vem do dicionário. */
export const LOADERS: Record<ExperimentId, () => Promise<{ mount: Experiment }>> = {
  tear: () => import("./reality-tear"),
  gravity: () => import("./gravity-type"),
  time: () => import("./time-distortion"),
};
