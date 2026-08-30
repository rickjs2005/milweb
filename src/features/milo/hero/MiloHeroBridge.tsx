"use client";

import { useEffect } from "react";
import { gsap, ScrollTrigger } from "@/animations/gsap";
import { miloFrame, useMiloStore } from "@/components/milo/useMiloStore";
import { MILO } from "@/components/milo/milo.config";
import type { MiloState } from "@/components/milo/milo.types";
import type { MiloHeroInput } from "@/features/hero-visual/hero-visual.types";
import { useMiloHeroStore } from "./hero-store";
import { heroMetrics, measureHeroGrid } from "./useMiloHeroMetrics";

/**
 * Ponte Hero → Milo. Não cria ScrollTrigger: lê o `progress` do trigger
 * pinado do BuildHero (a fonte oficial) a cada tick do GSAP e deriva TUDO
 * dele — estado narrativo, presença, energia, braço, partículas, opacidade
 * da réplica da grid, curvatura, scan e dissolve — em writes imperativos em
 * `miloFrame` (nada de React por frame). Como cada valor é função do
 * progresso, rolar para trás reconstrói o Milo exatamente ao contrário.
 *
 * Boot: `mw:visual-assemble` libera a presença (gate), `mw:headline` levanta
 * a cabeça. Sair do Hero pausa o loop (store de baixa frequência).
 */
export const heroFrame = { gridOpacity: 0, bendMul: 0.3, scan: 0, bootGate: 0.35, headUp: 0 };

const STAGE_BOUNDS = [0.16, 0.32, 0.5, 0.66, 0.84, 1.0001];
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function deriveHeroInput(progress: number, pointer: { x: number; y: number }, headlineReleased: boolean, heroVisible: boolean): MiloHeroInput {
  const p = Math.min(1, Math.max(0, progress));
  let stage = 0;
  while (stage < 5 && p >= STAGE_BOUNDS[stage]) stage++;
  const lo = stage === 0 ? 0 : STAGE_BOUNDS[stage - 1];
  const hi = STAGE_BOUNDS[stage];
  const stageProgress = Math.min(1, Math.max(0, (p - lo) / (hi - lo)));
  // scan: scaleX 0→1 em 0.68–0.78, some em 0.80–0.86 (timeline do BuildHero)
  const scanProgress = p < 0.68 ? 0 : p < 0.78 ? (p - 0.68) / 0.1 : p < 0.86 ? 1 - (p - 0.8) / 0.06 : 0;
  return { stage: stage as MiloHeroInput["stage"], progress: p, stageProgress, scanProgress: Math.max(0, Math.min(1, scanProgress)), pointer, headlineReleased, heroVisible };
}

/** Progresso → valores do Milo. Puro e reversível. */
export function driveMilo(input: MiloHeroInput) {
  const f = miloFrame;
  const p = input.progress;
  const gate = heroFrame.bootGate;
  // presença: 0.55 no estágio 0 → 1 no fim do estágio 1; dissolve em 0.92–1
  const reveal = lerp(0.55, 1, smooth(0.16, 0.32, p));
  const dissolve = smooth(0.92, 1, p);
  f.visibility = reveal * gate * (1 - dissolve);
  f.energy = lerp(0.12, 0.38, smooth(0.16, 0.32, p)) + 0.28 * smooth(0.66, 0.84, p) + 0.26 * smooth(0.84, 0.9, p) - 0.7 * dissolve;
  f.energy = Math.max(0.08, f.energy);
  f.observe = (0.25 + 0.75 * smooth(0.16, 0.32, p) + heroFrame.headUp * 0.3) * (1 - dissolve);
  // braço: antecipação no estágio 3 (0.5–0.66), toque no 4 (0.66–0.84), pleno no 5
  f.touch = (0.35 * smooth(0.5, 0.66, p) + 0.65 * smooth(0.66, 0.8, p)) * (1 - dissolve);
  f.particles = lerp(0.3, 0.55, smooth(0.16, 0.32, p)) + 0.2 * smooth(0.66, 0.84, p) + 0.35 * dissolve;
  f.scroll = p;
  // scan: energia nasce na palma e corre até a célula-alvo enquanto a linha DOM passa
  f.pulse = input.scanProgress > 0 ? Math.min(0.999, 0.15 + input.scanProgress * 0.85) : 0;
  f.pulseAt.x = f.hand.x;
  f.pulseAt.y = f.hand.y;
  // réplica da grid DOM: entra com a grid (0.2–0.32) e sai no SHIP (0.84–0.94)
  heroFrame.gridOpacity = smooth(0.2, 0.32, p) * (1 - smooth(0.84, 0.94, p));
  heroFrame.bendMul = lerp(0.3, 1, smooth(0.16, 0.36, p));
  heroFrame.scan = input.scanProgress;
}

function stateFor(input: MiloHeroInput): Exclude<MiloState, "transition"> {
  if (input.progress >= 0.92) return "dissolve";
  if (input.stage === 5) return "full";
  if (input.stage === 4) return "touch";
  if (input.stage >= 1) return "observe";
  return "dormant";
}

export function MiloHeroBridge() {
  useEffect(() => {
    const hero = document.getElementById("top");
    if (!hero) return;
    measureHeroGrid(hero);
    const grid = hero.querySelector<HTMLElement>("[data-layer=grid]");
    const ro = new ResizeObserver(() => measureHeroGrid(hero));
    ro.observe(hero);
    if (grid) ro.observe(grid);
    const onResize = () => measureHeroGrid(hero);
    window.addEventListener("resize", onResize);
    document.fonts?.ready.then(onResize).catch(() => {});

    // Boot: presença cresce no assemble; cabeça sobe com a headline
    const root = document.documentElement;
    const gateTo = (v: number, d: number) => gsap.to(heroFrame, { bootGate: v, duration: d, ease: "power2.out", overwrite: "auto" });
    if (root.classList.contains("booted") || !document.getElementById("mw-boot")) heroFrame.bootGate = 1;
    const onAssemble = () => gateTo(1, 1.6);
    const onHeadline = () => {
      gateTo(1, 0.9);
      gsap.fromTo(heroFrame, { headUp: 1 }, { headUp: 0, duration: 2.2, ease: "power2.out", overwrite: "auto" });
    };
    window.addEventListener("mw:visual-assemble", onAssemble);
    window.addEventListener("mw:headline", onHeadline);
    if (root.dataset.headline === "1") heroFrame.bootGate = 1;

    let st: ScrollTrigger | null = null;
    let lastState: MiloState | null = null;
    let lastVisible: boolean | null = null;
    let lastMeasure = 0;
    const store = useMiloStore.getState();
    const heroStore = useMiloHeroStore.getState();
    // alvo de repouso do braço = âncora do laboratório até a célula existir
    store.setTarget([...MILO.touch.anchor] as [number, number, number]);

    const tick = () => {
      if (!st) st = ScrollTrigger.getAll().find((t) => t.trigger === hero && !!t.vars.pin) ?? null;
      const progress = st ? st.progress : 0;
      const r = hero.getBoundingClientRect();
      const visible = r.bottom > 0 && r.top < window.innerHeight;
      const input = deriveHeroInput(progress, miloFrame.pointer, root.dataset.headline === "1", visible);
      driveMilo(input);

      // célula-alvo: borda esquerda da figura marcada (medida a cada ~250 ms, não por frame)
      const now = performance.now();
      if (now - lastMeasure > 250) {
        lastMeasure = now;
        const t = hero.querySelector<HTMLElement>("[data-milo-target]");
        if (t) {
          const b = t.getBoundingClientRect();
          heroMetrics.target = { x: b.left, y: b.top, w: b.width, h: b.height };
          miloFrame.panel.x = (b.left - 10) / window.innerWidth;
          miloFrame.panel.y = 1 - (b.top + b.height * 0.55) / window.innerHeight;
        }
      }

      const state = stateFor(input);
      if (state !== lastState) {
        lastState = state;
        useMiloStore.setState({ state, pending: null });
      }
      if (visible !== lastVisible) {
        lastVisible = visible;
        heroStore.setHeroVisible(visible);
      }
    };
    gsap.ticker.add(tick);
    if (process.env.NODE_ENV === "development") {
      // gancho de QA: window.__miloHero.frame / .store / .heroFrame
      (window as unknown as { __miloHero: unknown }).__miloHero = { frame: miloFrame, store: useMiloStore, heroStore: useMiloHeroStore, heroFrame };
    }
    return () => {
      gsap.ticker.remove(tick);
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mw:visual-assemble", onAssemble);
      window.removeEventListener("mw:headline", onHeadline);
    };
  }, []);
  return null;
}
