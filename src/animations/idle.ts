/** Roda `cb` quando o navegador estiver ocioso (fallback: timeout). Retorna cancel. */
export function onIdle(cb: () => void, timeout = 1200): () => void {
  const w = window as Window & { requestIdleCallback?: (c: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
  if (w.requestIdleCallback) {
    const id = w.requestIdleCallback(cb, { timeout });
    return () => w.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(cb, 200);
  return () => window.clearTimeout(id);
}
