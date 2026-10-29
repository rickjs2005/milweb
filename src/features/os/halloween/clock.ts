"use client";

import { useSyncExternalStore } from "react";
import { isHalloweenActive, msUntilNextChange } from "./config";
import { HALLOWEEN_POLICY } from "./policy";

/**
 * O relógio do evento no cliente: uma fonte única de "o Halloween está ligado agora?".
 *
 * Nunca congela na data do build: o estado é reavaliado no instante exato da virada (timer até a
 * próxima fronteira, com teto de 30 s), ao voltar para a aba (visibilitychange, focus, pageshow) e
 * quando o ambiente muda de estado. Ao mudar, espelha `data-os-event` no <html> — o CSS do evento, a
 * frase e as abóboras dependem só desse atributo — e avisa quem assina (cena, som, tema do shell).
 *
 * Hidratação: o snapshot do servidor é sempre `false` (o HTML pré-renderizado é o normal); o React troca
 * para o valor do cliente logo depois, sem erro de hidratação. Antes de pintar, o script inline do layout
 * já marcou o <html>, então o CSS mostra o evento no primeiro quadro.
 *
 * `data-os-hidden` no <html> pausa as animações do evento enquanto a aba está oculta.
 */
let active: boolean | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
const subs = new Set<() => void>();

function mirror(on: boolean) {
  const h = document.documentElement;
  if (on) h.dataset.osEvent = "halloween";
  else delete h.dataset.osEvent;
}

function evaluate() {
  const next = isHalloweenActive(Date.now(), HALLOWEEN_POLICY);
  if (next === active) return;
  active = next;
  mirror(next);
  subs.forEach((f) => f());
}

function syncHidden() {
  const h = document.documentElement;
  if (document.hidden) h.dataset.osHidden = "1";
  else delete h.dataset.osHidden;
}

function schedule() {
  if (timer) clearTimeout(timer);
  timer = null;
  const left = msUntilNextChange(Date.now(), HALLOWEEN_POLICY);
  if (left === null) return;
  timer = setTimeout(() => {
    evaluate();
    schedule();
  }, Math.min(30_000, left + 25));
}

function onWake() {
  syncHidden();
  evaluate();
  schedule();
}

/** O valor do cliente agora (para efeitos): não passa pelo snapshot de hidratação. */
export function readHalloweenNow(): boolean {
  if (typeof window === "undefined") return false;
  if (active === null) active = isHalloweenActive(Date.now(), HALLOWEEN_POLICY);
  return active;
}

function subscribe(fn: () => void) {
  subs.add(fn);
  if (subs.size === 1) {
    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("focus", onWake);
    window.addEventListener("pageshow", onWake);
    onWake();
  }
  return () => {
    subs.delete(fn);
    if (subs.size === 0) {
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("focus", onWake);
      window.removeEventListener("pageshow", onWake);
      if (timer) clearTimeout(timer);
      timer = null;
      delete document.documentElement.dataset.osHidden;
    }
  };
}

/** true durante o evento. Servidor e primeira renderização de hidratação: false. */
export function useHalloweenActive(): boolean {
  return useSyncExternalStore(subscribe, readHalloweenNow, () => false);
}
