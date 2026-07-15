import type { MiloPose } from "@/components/milo";

export type MiloSayDetail = { text: string; pose?: MiloPose; ttl?: number };

/** Faz o Milo do FAB falar de qualquer lugar do app (evento no window —
 * desacopla as ilhas client do componente do FAB). */
export function miloSay(detail: MiloSayDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<MiloSayDetail>("milo:say", { detail }));
}
