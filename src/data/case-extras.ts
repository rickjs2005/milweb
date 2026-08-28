import type { Localized } from "@/lib/content";

/** Rótulos do arquivo /work e utilitários de UI dos cases (os capítulos em si vivem em case-stories.ts). */

export const CASE_CHAPTERS: { n: string; label: Localized }[] = [
  { n: "01", label: { pt: "Desafio", en: "Challenge" } },
  { n: "02", label: { pt: "Ideia", en: "Idea" } },
  { n: "03", label: { pt: "Experiência", en: "Experience" } },
  { n: "04", label: { pt: "Engenharia", en: "Engineering" } },
  { n: "05", label: { pt: "Resultado", en: "Result" } },
  { n: "06", label: { pt: "Telas selecionadas", en: "Selected screens" } },
];

export const CASE_UI = {
  visit: { pt: "Visitar o site", en: "Visit site" } as Localized,
  code: { pt: "Código", en: "Code" } as Localized,
  next: { pt: "Próximo", en: "Next" } as Localized,
  allWork: { pt: "Todos os trabalhos", en: "All work" } as Localized,
  builtWith: { pt: "Construído com", en: "Built with" } as Localized,
  client: { pt: "Cliente", en: "Client" } as Localized,
  studio: { pt: "Projeto autoral", en: "Studio project" } as Localized,
  similar: { pt: "Quero algo parecido", en: "I want something like this" } as Localized,
  archiveTitle: ["ALL", "WORK."],
  archiveSub: { pt: "projetos — clientes e autorais, 2024–2026", en: "projects — client and studio work, 2024–2026" } as Localized,
  clientWork: { pt: "Trabalhos para clientes", en: "Client work" } as Localized,
  studioWork: { pt: "Projetos autorais", en: "Studio work" } as Localized,
};
