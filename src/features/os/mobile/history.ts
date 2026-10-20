import { APPS, isAppId, type AppId } from "../registry";

/**
 * Histórico do navegador no telefone.
 *
 * O App Router escreve o próprio estado em `history.state` (`__NA` + a árvore
 * da rota). Aqui cada entrada ganha, por cima disso, uma marca nossa:
 *
 *   mwDepth   quantas entradas foram empilhadas desde a tela inicial (0 = home
 *             ou entrada de link direto): fechar um app faz `history.go(-depth)`
 *             e volta à home SEM deixar entradas repetidas;
 *   mwPrev    o caminho interno de onde esta entrada foi empilhada: o Voltar do
 *             cabeçalho usa `history.back()` quando o pai é mesmo a entrada
 *             anterior, em vez de empilhar o pai de novo;
 *   mwOverlay app sem URL própria (Sobre, Ajustes) aberto por cima desta URL:
 *             uma entrada a mais com a mesma URL, para o Voltar do navegador
 *             fechá-lo como fecharia qualquer outro app.
 *
 * `pushState`/`replaceState` do Next só interceptam estados SEM `__NA`; como
 * sempre partimos do estado atual, o roteador continua dono da entrada.
 * Nada disso roda fora do telefone (quem chama já conferiu o modo).
 */
type NextState = { __NA?: boolean; mwDepth?: number; mwPrev?: string | null; mwOverlay?: string } | null;

export type HistoryMark = { depth: number; prev: string | null; overlay: AppId | null };

const current = (): NextState => (typeof window === "undefined" ? null : (window.history.state as NextState));

export function readMark(): HistoryMark {
  const st = current();
  const o = st?.mwOverlay;
  return { depth: st?.mwDepth ?? 0, prev: st?.mwPrev ?? null, overlay: isAppId(o) && APPS[o].route === null ? o : null };
}

/** Marca a entrada atual (uma vez): profundidade a partir da home e de onde veio. Devolve a marca em vigor. */
export function stampEntry(internal: string, last: { internal: string; depth: number }): HistoryMark {
  const st = current();
  if (!st?.__NA) return readMark();
  if (st.mwDepth !== undefined) return readMark();
  // Primeira entrada da sessão (last.depth = −1) ou a raiz: 0. Empilhada da home: 1. Senão, uma a mais.
  const depth = internal === "/" ? 0 : last.internal === "/" ? 1 : Math.max(0, last.depth + 1);
  try {
    window.history.replaceState({ ...st, mwDepth: depth, mwPrev: depth === 0 ? null : last.internal }, "");
  } catch {}
  return { depth, prev: depth === 0 ? null : last.internal, overlay: null };
}

/** App sem URL própria aberto: uma entrada a mais com a mesma URL, para o Voltar fechá-lo. */
export function pushOverlay(id: AppId): boolean {
  const st = current();
  if (!st?.__NA) return false;
  try {
    window.history.pushState({ ...st, mwOverlay: id }, "");
    return true;
  } catch {
    return false;
  }
}

/** A URL pública atual é a raiz de algum idioma? */
function atHome(): boolean {
  const p = window.location.pathname.replace(/^\/(pt|en|es)(?=\/|$)/, "").replace(/\/+$/, "");
  return p === "";
}

/**
 * Sai do app para a tela inicial pelo histórico: a entrada do app sem URL some
 * com `back()`; um app com URL desfaz as `depth` entradas de uma vez. Sem marca
 * (link direto, entrada antiga) cai no `fallback` (um replace para a raiz).
 */
export function leaveToHome(id: AppId, fallback: () => void) {
  const m = readMark();
  if (m.overlay === id) {
    window.history.back();
    return;
  }
  if (m.depth > 0 && m.depth < window.history.length) {
    window.history.go(-m.depth);
    // Rede de segurança: se o salto não chegou à raiz (histórico editado por fora), um replace resolve.
    window.setTimeout(() => {
      if (!atHome()) fallback();
    }, 700);
    return;
  }
  fallback();
}
