"use client";

import type { OsPayload } from "../types";
import { briefNotes } from "./brain";
import { guide } from "./guide-store";

/**
 * A passagem para o Hire Rick: escreve o rascunho do pedido de proposta (o mesmo que o guia usa, em
 * localStorage) com o que a conversa já sabe e, quando vem da prévia, com a direção escolhida ali.
 * Nada é enviado: a pessoa cai na revisão do pedido e decide o canal.
 */
const BRIEF_KEY = "milweb:project-brief";
const BRIEF_DAYS = 30;

export function writeBrief(payload: OsPayload, opts: { /** Linhas a acrescentar (a direção vista na prévia). */ lines?: string[]; /** Começos de linha que estas substituem: a escolha anterior não fica no pedido. */ replace?: string[]; project?: string | null } = {}): boolean {
  const ctx = guide.get().ctx;
  const catalog = [...payload.projects, ...payload.authorial];
  try {
    const saved = JSON.parse(localStorage.getItem(BRIEF_KEY) ?? "null") ?? {};
    const prev = typeof saved.at === "number" && Date.now() - saved.at <= BRIEF_DAYS * 864e5 ? saved : {};
    const text = (v: unknown) => (typeof v === "string" ? v : "");
    const stale = (line: string) => (opts.replace ?? []).some((start) => line.startsWith(start));
    const old = text(prev.notes).split("\n").filter((line) => line.trim() && !stale(line));
    const fresh = [...briefNotes(ctx, payload.materia.say.briefQuestion).split("\n").filter((line) => !stale(line)), ...(opts.lines ?? [])].filter((line, i, all) => line && !old.includes(line) && all.indexOf(line) === i);
    const project = catalog.find((p) => p.slug === (opts.project ?? ctx.project))?.slug ?? text(prev.project);
    const draft = {
      goalId: project === text(prev.project) ? text(prev.goalId) : "",
      status: text(prev.status), budget: text(prev.budget), when: text(prev.when),
      notes: [...old, ...fresh].join("\n").slice(0, 1400),
      project, service: project ? "" : text(prev.service), review: true, at: Date.now(),
    };
    localStorage.setItem(BRIEF_KEY, JSON.stringify(draft));
    window.dispatchEvent(new Event("milweb:brief"));
    return true;
  } catch {
    /* sem armazenamento: o pedido abre vazio e a conversa continua visível para copiar */
    return false;
  }
}
