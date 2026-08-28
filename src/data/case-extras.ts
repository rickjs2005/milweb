import type { Localized } from "@/lib/content";

/** Rótulos do arquivo /work e utilitários de UI dos cases (os capítulos em si vivem em case-stories.ts). */

export const CASE_CHAPTERS: { n: string; label: Localized }[] = [
  { n: "01", label: { pt: "Desafio", en: "Challenge", es: "Desafío" } },
  { n: "02", label: { pt: "Ideia", en: "Idea", es: "Idea" } },
  { n: "03", label: { pt: "Experiência", en: "Experience", es: "Experiencia" } },
  { n: "04", label: { pt: "Engenharia", en: "Engineering", es: "Ingeniería" } },
  { n: "05", label: { pt: "Resultado", en: "Result", es: "Resultado" } },
  { n: "06", label: { pt: "Telas selecionadas", en: "Selected screens", es: "Pantallas seleccionadas" } },
];

export const CASE_UI = {
  visit: { pt: "Visitar o site", en: "Visit site", es: "Visitar el sitio" } as Localized,
  code: { pt: "Código", en: "Code", es: "Código" } as Localized,
  next: { pt: "Próximo", en: "Next", es: "Siguiente" } as Localized,
  allWork: { pt: "Todos os trabalhos", en: "All work", es: "Todos los trabajos" } as Localized,
  builtWith: { pt: "Construído com", en: "Built with", es: "Construido con" } as Localized,
  client: { pt: "Cliente", en: "Client", es: "Cliente" } as Localized,
  studio: { pt: "Projeto autoral", en: "Studio project", es: "Proyecto propio" } as Localized,
  similar: { pt: "Quero algo parecido", en: "I want something like this", es: "Quiero algo parecido" } as Localized,
  archiveTitle: ["ALL", "WORK."],
  archiveSub: { pt: "projetos — clientes e autorais, 2024–2026", en: "projects — client and studio work, 2024–2026", es: "proyectos — clientes y propios, 2024–2026" } as Localized,
  clientWork: { pt: "Trabalhos para clientes", en: "Client work", es: "Trabajos para clientes" } as Localized,
  studioWork: { pt: "Projetos autorais", en: "Studio work", es: "Proyectos propios" } as Localized,
};
