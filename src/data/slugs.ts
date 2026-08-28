/**
 * Slugs públicos dos cases — lista LEVE, sem importar conteúdo, para o
 * middleware validar URLs (/projetos/<slug>) sem carregar os textos.
 * `src/data/projects.ts` confere em tempo de módulo que esta lista bate com
 * PROJECTS: divergência derruba o build, então a fonte única continua sendo
 * os dados dos projetos.
 */
export const PROJECT_SLUGS = [
  "milsaca",
  "millead",
  "inkvision",
  "rockverse",
  "aurex-motors",
  "atelier-vertex",
  "aurex-timepieces",
  "age-of-dragons",
  "terral",
  "one-piece",
  "alva-odontologia",
  "as-copas",
  "ecoa",
  "loja-iphone",
  "loja-de-iphone",
  "kavita-drones",
  "kavita-institucional",
  "ecommerce-do-agro",
  "akatsuki",
  "loja-joias",
  "nexus-geek",
  "lumen-architecture",
  "rjjstore",
  "rjs-laticinios",
  "imperio-cafe",
] as const;

export function isProjectSlug(s: string): boolean {
  return (PROJECT_SLUGS as readonly string[]).includes(s);
}
