"use client";

import { useSyncExternalStore } from "react";

/**
 * Estado da prévia ("Ver uma ideia para o meu site"). Vive fora do React, como a conversa: a Matéria
 * prepara a ideia, a escultura a mostra no recorte do rosto, a janela (apps/idea) deixa a pessoa
 * experimentar — e as escolhas continuam lá ao voltar do case, da conversa ou do orçamento.
 * Fica na aba (sessionStorage), junto da conversa.
 */
export type IdeaKind = "dive" | "practice";
export type IdeaState = {
  kind: IdeaKind | null;
  /** Projeto de referência (slug do catálogo). */
  reference: string | null;
  /** Consultório: a direção da página. */
  priority: "booking" | "approach";
  /** Mergulho: o tipo escolhido, quantos mergulham, quando (índice das opções) e se o pedido foi iniciado. */
  site: "reef" | "wreck" | null;
  divers: number;
  when: number;
  started: boolean;
};

const KEY = "milweb:idea";
const initial = (): IdeaState => ({ kind: null, reference: null, priority: "booking", site: null, divers: 2, when: 0, started: false });

let state: IdeaState = initial();
let restored = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const save = () => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* sem armazenamento: a prévia vale só em memória */
  }
};

export const idea = {
  get: (): IdeaState => state,
  set(patch: Partial<IdeaState>) {
    state = { ...state, ...patch };
    save();
    emit();
  },
  /** A Matéria prepara uma ideia: a mesma de antes mantém as escolhas; outra começa do zero. */
  prepare(kind: IdeaKind, reference: string | null, priority: string | null) {
    const same = state.kind === kind;
    state = { ...(same ? state : initial()), kind, reference, priority: priority === "approach" ? "approach" : priority === "booking" ? "booking" : same ? state.priority : "booking" };
    save();
    emit();
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  /** Depois da hidratação: retoma a prévia da aba. */
  restore() {
    if (restored || typeof window === "undefined") return;
    restored = true;
    try {
      const saved = JSON.parse(sessionStorage.getItem(KEY) ?? "null");
      if (saved && (saved.kind === "dive" || saved.kind === "practice")) {
        state = {
          ...initial(),
          kind: saved.kind,
          reference: typeof saved.reference === "string" ? saved.reference : null,
          priority: saved.priority === "approach" ? "approach" : "booking",
          site: saved.site === "reef" || saved.site === "wreck" ? saved.site : null,
          divers: Number.isInteger(saved.divers) ? Math.max(1, Math.min(6, saved.divers)) : 2,
          when: Number.isInteger(saved.when) ? Math.max(0, Math.min(2, saved.when)) : 0,
          started: saved.started === true,
        };
        emit();
      }
    } catch {
      /* navegação privada pode bloquear o armazenamento */
    }
  },
  reset() {
    state = initial();
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      /* nada a limpar */
    }
    emit();
  },
};

const server = initial();
export function useIdea<T>(selector: (s: IdeaState) => T): T {
  return useSyncExternalStore(idea.subscribe, () => selector(state), () => selector(server));
}
