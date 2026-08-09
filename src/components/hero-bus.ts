/**
 * Pub/sub mínimo entre a cena 3D e o terminal do hero. Módulo e não Context:
 * a cena monta via dynamic ssr:false e o terminal é DOM comum — um Context
 * exigiria provider acima dos dois e re-render a cada evento; aqui nada
 * re-renderiza, os dois lados só trocam sinais imperativos por frame.
 */
export type HeroBusEvents = {
  "scene-ready": { index: number };
  "line-executed": { index: number; origin: { x: number; y: number } };
  "collapse-done": { index: number };
  "collapse-request": undefined;
};

type Handler = (data: never) => void;
const handlers = new Map<keyof HeroBusEvents, Set<Handler>>();

export function on<K extends keyof HeroBusEvents>(ev: K, fn: (data: HeroBusEvents[K]) => void): () => void {
  if (!handlers.has(ev)) handlers.set(ev, new Set());
  handlers.get(ev)!.add(fn as Handler);
  return () => handlers.get(ev)?.delete(fn as Handler);
}

export function emit<K extends keyof HeroBusEvents>(ev: K, data: HeroBusEvents[K]): void {
  handlers.get(ev)?.forEach((fn) => (fn as (d: HeroBusEvents[K]) => void)(data));
}
