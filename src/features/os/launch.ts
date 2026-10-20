"use client";

import { useEffect, useState, type MouseEvent } from "react";
import type { Locale } from "@/i18n/config";
import { APPS, type AppId } from "./registry";
import { useOs } from "./os-shell";
import { pushOverlay } from "./mobile/history";

/**
 * Ganchos compartilhados entre a área de trabalho, o launcher do telefone e
 * os apps (sem importar desktop.tsx, para não fechar um ciclo de módulos).
 */

/** Relógio do visitante — só depois de montar (nunca no HTML do servidor). */
export function useClock(locale: Locale): string | null {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    const fmt = () => setTime(new Date().toLocaleTimeString(locale === "pt" ? "pt-BR" : locale, { hour: "2-digit", minute: "2-digit" }));
    fmt();
    const t = window.setInterval(fmt, 20_000);
    return () => window.clearInterval(t);
  }, [locale]);
  return time;
}

/** Abre um app a partir de um controle (ícone, dock, busca). Mantém Ctrl/Cmd-clique nativo (nova aba). */
export function useLaunch() {
  const { store } = useOs();
  return (e: MouseEvent<HTMLElement>, id: AppId, route?: string) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const el = e.currentTarget;
    // A transição ícone → tela parte da placa do ícone (telefone), não do item inteiro com o rótulo.
    const r = (el.querySelector<HTMLElement>(".os-micon, .os-icon") ?? el).getBoundingClientRect();
    const st = store.getState();
    const w = st.wins[id];
    const mobile = st.shell === "mobile";
    if (w.open && route === undefined && !mobile) {
      st.restore(id, { mode: "push" });
      return;
    }
    // Telefone: reabrir passa por `open` (mesma geometria/rolagem) para a tela entrar do ícone de novo.
    st.open(id, { route: route ?? w.route, origin: { x: r.left, y: r.top, w: r.width, h: r.height }, openedBy: el.id || null, source: "user", mode: "push" });
    // App sem URL própria (Sobre, Ajustes) no telefone: uma entrada no histórico, para o Voltar fechá-lo.
    if (mobile && APPS[id].route === null) pushOverlay(id);
  };
}
