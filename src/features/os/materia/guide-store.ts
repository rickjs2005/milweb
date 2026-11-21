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
  /** `focus`: o que recebe o foco ao chegar (um seletor dentro da janela; com "!" na frente, o elemento também é acionado). */
  | { kind: "app"; app: AppId; label: string; focus?: string }
  | { kind: "project"; slug: string; label: string }
  /** Arquivo ou endereço cadastrado no portfólio (currículo, repositório): abre em outra aba. */
  | { kind: "file"; href: string; label: string }
  /** Leva o que a pessoa contou para o pedido de proposta (Hire Rick). */
  | { kind: "brief"; label: string }
  /** Mostra a prévia preparada (idea-store.ts): no recorte do rosto da escultura, ou direto na janela. */
  | { kind: "idea"; label: string }
  /** Abre a coleção no projeto, já com o verso da peça à vista ("como foi feito"): a evidência para o recrutador. */
  | { kind: "made"; slug: string; label: string }
  /** Resposta rápida: envia `text` como se a pessoa tivesse escrito. */
  | { kind: "say"; text: string; label: string };

export type GuideMessage = { id: number; from: "you" | "materia"; text: string; actions?: GuideAction[]; card?: string };

/** O que a Matéria já sabe: serve para não perguntar duas vezes e para montar o pedido. */
export type GuideCtx = {
  role: "recruiter" | "client" | null;
  sector: string | null;
  /** Ramo dentro do setor, quando tem referência e prévia próprias (mergulho, psicologia). */
  field: string | null;
  /** O que a pessoa escolheu como prioridade (a opção do setor: "booking", "approach"…). */
  goal: string | null;
  /** "idea": a pessoa pediu para ver uma ideia e a Matéria ainda está entendendo o negócio. */
  mode: "idea" | null;
  /** Prévia já preparada nesta conversa. */
  idea: string | null;
  /** Projeto em pauta (o último recomendado ou o que está aberto). */
  project: string | null;
  shown: string[];
  /** Pergunta que a Matéria fez e ainda espera resposta. */
  asked: string | null;
  /** As duas leituras em disputa numa pergunta de desempate ("tourism/diving", "store"). */
  options: string[];
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
  /** A ideia que a escultura mostra agora no recorte do rosto (null = recorte fechado). */
  portal: "dive" | "practice" | null;
  /** Transcrição parcial enquanto a pessoa fala. */
  interim: string;
  micDenied: boolean;
  unread: boolean;
};

const KEY = "milweb:materia";
export const emptyCtx = (): GuideCtx => ({ role: null, sector: null, field: null, goal: null, mode: null, idea: null, project: null, shown: [], asked: null, options: [], facts: [], questions: [] });
const initial = (): GuideState => ({ open: false, min: false, phase: "idle", messages: [], ctx: emptyCtx(), reflect: null, portal: null, interim: "", micDenied: false, unread: false });

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

/** Os destinos que têm uma figura e um gesto próprios (materia/acts.ts). */
export type GoApp = "projects" | "profile" | "services" | "studio" | "lab" | "contact";
export const isGoApp = (v: string | null | undefined): v is GoApp => v === "projects" || v === "profile" || v === "services" || v === "studio" || v === "lab" || v === "contact";

/**
 * Ponte com a cena: os gestos da escultura nascem em elementos da interface e a cena só existe depois de
 * carregar. Quem tem a cena registra os ganchos; sem cena, não acontece nada.
 */
export const stage: {
  /** A escultura está viva (WebGL) e à vista: vale animar a travessia. */
  live: () => boolean;
  /** O motor está rodando nesta aba (mesmo com uma janela na frente): o recorte no rosto pode acontecer. */
  ready: () => boolean;
  /** Centro da figura na tela (px da janela) e px por unidade. */
  anchor: () => { x: number; y: number; k: number } | null;
  /**
   * O recorte no rosto, quadro a quadro: centro e raios (px da janela) e quanto está aberto (0..1).
   * Quem desenha a ideia dentro dele (guide-panel.tsx › MateriaPortal) registra aqui; null quando fecha.
   */
  cut: ((c: { x: number; y: number; rx: number; ry: number; open: number } | null) => void) | null;
  /** Abre a conversa e envia `text` como se a pessoa tivesse escrito (a conversa registra; a prévia vazia usa). */
  ask: ((text: string) => void) | null;
  /**
   * A Matéria leva o visitante a um destino que acabou de abrir: a escultura vira a figura dele, faz o gesto e a
   * página aparece pela passagem (materia-scene.tsx). `focus`: o que recebe o foco ao chegar (um seletor dentro da
   * janela). Devolve false quando a cena não está viva, a figura ainda não chegou do servidor ou o visitante pede
   * movimento reduzido — o destino já está inteiro na tela. Uma segunda chamada interrompe a primeira.
   */
  go: ((app: GoApp, opts?: { focus?: string }) => boolean) | null;
  /** O visitante se aproximou de um destino (ponteiro, foco): a figura dele já pode ser baixada. */
  warm: ((app: string) => void) | null;
} = { live: () => false, ready: () => false, anchor: () => null, cut: null, ask: null, go: null, warm: null };

/**
 * Leva o visitante ao destino `app` (a janela já foi aberta por quem chama): pelo gesto da escultura quando a cena
 * está viva; senão, direto. Em qualquer caso o foco chega a `focus` (um seletor dentro da janela), quando pedido.
 * É o MESMO caminho para o lançador, a busca, a conversa e a voz.
 */
export function arrive(app: string, focus?: string) {
  if (isGoApp(app) && stage.go?.(app, focus ? { focus } : undefined)) return true;
  if (focus && typeof window !== "undefined") {
    const since = performance.now();
    const seek = () => {
      const win = document.querySelector<HTMLElement>(`.os-window[data-app="${app}"]`);
      if (win && landOn(win, focus)) return;
      if (performance.now() - since < 1500) requestAnimationFrame(seek);
    };
    requestAnimationFrame(seek);
  }
  return false;
}

/**
 * Entrega o foco dentro da janela que chegou: `focus` é um seletor; com "!" na frente o elemento também é acionado
 * (uma aba que precisa ficar selecionada) e trazido para a área visível. Devolve false enquanto ele não existe.
 */
export function landOn(win: HTMLElement, focus: string): boolean {
  const press = focus.startsWith("!");
  const el = win.querySelector<HTMLElement>(press ? focus.slice(1) : focus);
  if (!el) return false;
  if (press) {
    el.click();
    el.scrollIntoView({ block: "center" });
  }
  el.focus({ preventScroll: true });
  return true;
}
