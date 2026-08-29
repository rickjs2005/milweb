/**
 * Transições de rota por destino. O tipo viaja no link (`data-vt`), o
 * ViewTransitions o escreve em `<html data-vt>` e o CSS (globals.css →
 * ::view-transition-*) executa a coreografia. Nada bloqueia a navegação:
 * sem a API (Firefox), com reduced-motion ou sem JS, o link é um link.
 *
 *   scan     kavita  · a varredura revela o case da esquerda para a direita
 *   fold     terral  · o papel dobra sobre a viewport
 *   grid     vertex  · a planta implode e o case se constrói a partir da linha
 *   time     aurex   · planos temporais desmontam, uma pausa, e remontam
 *   horizon  lab     · o Event Horizon absorve a página
 */
export type VtKind = "scan" | "fold" | "grid" | "time" | "horizon";

const BY_SLUG: Record<string, VtKind> = {
  "kavita-drones": "scan",
  terral: "fold",
  "atelier-vertex": "grid",
  "aurex-timepieces": "time",
};

/** Tipo de transição para um case (slug) — os demais herdam o do arquivo. */
export function vtOfSlug(slug: string): VtKind {
  return BY_SLUG[slug] ?? "grid";
}

export const VT_LAB: VtKind = "horizon";
