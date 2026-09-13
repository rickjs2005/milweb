/**
 * Estado de alta frequência do MilWeb System — lido a 60 Hz por quem precisa
 * (HUD hoje; Milo depois), fora do React. Mesmo padrão do store do compilador:
 * um objeto mutável + assinantes. Quem publica é o provider, uma vez por tick.
 */
export type SystemFrame = {
  /** 0–1 dentro do nó dominante. */
  nodeProgress: number;
  /** 0–1 da página inteira. */
  globalProgress: number;
  /** −1 subindo · 0 parado · 1 descendo. */
  scrollDirection: -1 | 0 | 1;
  /** px/s, suavizada. */
  scrollVelocity: number;
  scrollY: number;
};

export type SystemNodeRef = {
  id: string;
  index: number;
  key: string;
  title: string;
  readout: string | null;
};

export const systemFrame: SystemFrame = { nodeProgress: 0, globalProgress: 0, scrollDirection: 0, scrollVelocity: 0, scrollY: 0 };

type Listener = (frame: SystemFrame) => void;
const listeners = new Set<Listener>();

/** Assina o frame. Devolve o cancelamento. */
export function subscribeSystem(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function publishSystemFrame() {
  listeners.forEach((fn) => fn(systemFrame));
}
