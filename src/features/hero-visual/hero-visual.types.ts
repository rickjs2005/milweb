/** Qual visual ocupa o Hero da Home: a escultura THE COMPILER (atual) ou o Milo Null (experimental). */
export type HeroVisualVariant = "compiler" | "milo";

/** O que o Hero entrega ao Milo por frame (derivado do ScrollTrigger oficial, nunca de um segundo trigger). */
export type MiloHeroInput = {
  stage: 0 | 1 | 2 | 3 | 4 | 5;
  progress: number;
  stageProgress: number;
  scanProgress: number;
  pointer: { x: number; y: number };
  headlineReleased: boolean;
  heroVisible: boolean;
};
