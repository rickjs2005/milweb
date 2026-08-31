"use client";

import { Compiler, CompilerScrollDirector } from "@/features/compiler/compiler";
import { getHeroVisualVariant } from "./useHeroVisualVariant";

/**
 * Visual de PÁGINA. Só a variante `compiler` monta alguma coisa aqui: a
 * escultura é um canvas fixo que atravessa a Home inteira.
 *
 * Na variante `globe` (padrão) não há canvas de página nenhum — o globo é do
 * HERO, vive dentro da section pinada e é montado por lá
 * (`features/globe/HeroGlobe`). Nunca há dois contextos WebGL na Home.
 */
export function HeroVisual() {
  return getHeroVisualVariant() === "compiler" ? <Compiler /> : null;
}

export function HeroVisualDirector() {
  return getHeroVisualVariant() === "compiler" ? <CompilerScrollDirector /> : null;
}
