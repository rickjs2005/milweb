"use client";

import dynamic from "next/dynamic";
import { Compiler, CompilerScrollDirector } from "@/features/compiler/compiler";
import { getHeroVisualVariant } from "./useHeroVisualVariant";

/**
 * Seleção do visual do Hero por feature flag. Só UMA das ilhas é montada:
 *   compiler → <Compiler/> + <CompilerScrollDirector/>  (idêntico ao atual)
 *   milo     → <MiloHero/> + <MiloHeroBridge/>          (experimental)
 * O módulo do Milo só entra no bundle da Home pela variante `milo`
 * (import dinâmico; em `compiler` o chunk nunca é pedido).
 */
const MiloHero = dynamic(() => import("@/features/milo/hero/MiloHero").then((m) => m.MiloHero), { ssr: false });
const MiloHeroBridge = dynamic(() => import("@/features/milo/hero/MiloHeroBridge").then((m) => m.MiloHeroBridge), { ssr: false });

export function HeroVisual() {
  return getHeroVisualVariant() === "milo" ? <MiloHero /> : <Compiler />;
}

export function HeroVisualDirector() {
  return getHeroVisualVariant() === "milo" ? <MiloHeroBridge /> : <CompilerScrollDirector />;
}
