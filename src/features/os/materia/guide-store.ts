"use client";

import { useSyncExternalStore } from "react";
import type { AppId } from "../registry";

/**
 * Estado da conversa com a Matéria. Vive fora do React e fora do store das janelas: a conversa
 * continua enquanto o visitante navega pelo OS, e a cena (materia-scene.tsx) lê daqui o que precisa
 * — aberta ou não, escutando, respondendo, que capa refletir — sem passar por render.
 *
 * A conversa e o que a Matéria já sabe do visitante ficam na aba (sessionStorage): voltar de um case,
 * do PDF do currículo ou recarregar a página retoma do mesmo ponto.
 */
export type GuideAction =
  | { kind: "app"; app: AppId; label: string }
  | { kind: "project"; slug: string; label: string }
  /** Arquivo ou endereço cadastrado no portfólio (currículo, repositório): abre em outra aba. */
  | { kind: "file"; href: string; label: string }
  /** Leva o que a pessoa contou para o pedido de proposta (Hire Rick). */
  | { kind: "brief"; label: string }
  /** Resposta rápida: envia `text` como se a pessoa tivesse escrito. */
  | { kind: "say"; text: string; label: string };

export type GuideMessage = { id: number; from: "you" | "materia"; text: string; actions?: GuideAction[]; card?: string };

/** O que a Matéria já sabe: serve para não perguntar duas vezes e para montar o pedido. */
export type GuideCtx = {
  role: "recruiter" | "client" | null;
  sector: string | null;
  /** Projeto em pauta (o último recomendado ou o que está aberto). */
  project: string | null;
  shown: string[];
  /** Pergunta que a Matéria fez e ainda espera resposta. */
  asked: string | null;
  /** O que a pessoa contou, nas palavras dela, e as respostas às perguntas da Matéria. */
  facts: string[];
  /** Dúvidas que só o Rick responde. */
  questions: string[];
};

export type GuidePhase = "idle" | "listening" | "thinking" | "speaking";
export type GuideState = {
  open: boolean;
  /** Recolhida numa pílula: a conversa continua, o destino fica à vista. */
  min: boolean;
  phase: GuidePhase;
  messages: GuideMessage[];
  ctx: GuideCtx;
  /** Projeto cuja capa a escultura reflete agora. */
  reflect: string | null;
  /** Transcrição parcial enquanto a pessoa fala. */
  interim: string;
  micDenied: boolean;
  unread: boolean;
};

const KEY = "milweb:materia";
export const emptyCtx = (): GuideCtx => ({ role: null, sector: null, project: null, shown: [], asked: null, facts: [], questions: [] });
const initial = (): GuideState => ({ open: false, min: false, phase: "idle", messages: [], ctx: emptyCtx(), reflect: null, interim: "", micDenied: false, unread: false });

let state: GuideState = initial();
let restored = false;
const listeners = new Set<() => void>();

function restore() {
  if (restored || typeof window === "undefined") return;
  restored = true;
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY) ?? "null");
    if (saved && Array.isArray(saved.messages) && saved.ctx && Array.isArray(saved.ctx.facts)) {
      state = { ...state, messages: saved.messages, ctx: { ...emptyCtx(), ...saved.ctx }, min: saved.messages.length > 0 && !!saved.min, open: !!saved.open && saved.messages.length > 0 };
    }
  } catch {
    /* navegação privada pode bloquear o armazenamento: a conversa vale só em memória */
  }
}

export const guide = {
  get: (): GuideState => state,
  set(patch: Partial<GuideState> | ((s: GuideState) => Partial<GuideState>)) {
    const next = typeof patch === "function" ? patch(state) : patch;
    state = { ...state, ...next };
    if (next.messages || next.ctx || "open" in next || "min" in next) {
      try {
        sessionStorage.setItem(KEY, JSON.stringify({ messages: state.messages.slice(-40), ctx: state.ctx, open: state.open, min: state.min }));
      } catch {
        /* sem armazenamento: segue em memória */
      }
    }
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  /** Depois da hidratação: retoma a conversa da aba. */
  restore() {
    const before = state;
    restore();
    if (state !== before) listeners.forEach((l) => l());
  },
  reset() {
    state = { ...initial(), open: state.open };
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      /* nada a limpar */
    }
    listeners.forEach((l) => l());
  },
};

const server = initial();
export function useGuide<T>(selector: (s: GuideState) => T): T {
  return useSyncExternalStore(guide.subscribe, () => selector(state), () => selector(server));
}

/**
 * Ponte com a cena: o gesto sobre a escultura (dobrar o tempo) nasce em elementos da interface e a
 * cena só existe depois de carregar. Quem tem a cena registra os ganchos; sem cena, não acontece nada.
 */
export const stage: {
  /** Gesto ao lado do rosto (−1..1) ou null ao soltar. */
  pull: ((p: { x: number; y: number } | null) => void) | null;
  /** A escultura está viva (WebGL) e à vista: vale animar a travessia. */
  live: () => boolean;
  /** Centro da figura na tela (px da janela) e px por unidade. */
  anchor: () => { x: number; y: number; k: number } | null;
} = { pull: null, live: () => false, anchor: () => null };
