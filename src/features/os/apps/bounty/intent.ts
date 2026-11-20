import { useSyncExternalStore } from "react";

/**
 * Um pedido para a coleção abrir um projeto já com um dos lados da peça à vista — a Matéria leva o recrutador
 * direto a "ver como foi feito"; o perfil pode fazer o mesmo. Fora do React: quem pede pode estar em outra janela.
 */
export type ProjectsIntent = { slug: string; face: "try" | "made" } | null;

let current: ProjectsIntent = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const projectsIntent = {
  set(next: NonNullable<ProjectsIntent>) {
    current = next;
    emit();
  },
  clear() {
    if (!current) return;
    current = null;
    emit();
  },
  get: () => current,
};

export function useProjectsIntent(): ProjectsIntent {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
    () => null,
  );
}
