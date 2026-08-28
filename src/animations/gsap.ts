/**
 * Registro ÚNICO do GSAP + tokens de motion compartilhados com o CSS
 * (mesmos valores de styles/tokens.css). Importar `gsap` daqui, nunca de
 * "gsap" direto, garante que os plugins estão registrados uma vez só.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase, useGSAP);

/** Easings oficiais (equivalentes 1:1 aos --ease-* do CSS). */
export const EASE = {
  outExpo: CustomEase.create("mw-out-expo", "0.16, 1, 0.3, 1"),
  outQuint: CustomEase.create("mw-out-quint", "0.22, 1, 0.36, 1"),
  inOutQuart: CustomEase.create("mw-in-out-quart", "0.76, 0, 0.24, 1"),
  smooth: CustomEase.create("mw-smooth", "0.65, 0, 0.35, 1"),
  snap: CustomEase.create("mw-snap", "0.9, 0, 0.1, 1"),
} as const;

/** Durações em segundos (GSAP) — CSS usa ms. */
export const DUR = {
  fast: 0.2,
  medium: 0.48,
  slow: 0.9,
  cinematic: 1.6,
} as const;

/** Media queries oficiais para gsap.matchMedia. */
export const MQ = {
  fine: "(hover: hover) and (pointer: fine)",
  coarse: "(pointer: coarse)",
  reduce: "(prefers-reduced-motion: reduce)",
  noReduce: "(prefers-reduced-motion: no-preference)",
  desktop: "(min-width: 1080px)",
  tablet: "(min-width: 720px) and (max-width: 1079px)",
  mobile: "(max-width: 719px)",
} as const;

gsap.defaults({ ease: EASE.outExpo, duration: DUR.medium });

export { gsap, ScrollTrigger, SplitText, useGSAP };
