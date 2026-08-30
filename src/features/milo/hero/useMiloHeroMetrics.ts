"use client";

import { useEffect } from "react";

/**
 * Métricas da grid DOM do Hero (`[data-layer=grid]`) em px de CSS, medidas
 * em resize/mudança de layout (ResizeObserver + resize), nunca por frame.
 * O shader replica exatamente estas colunas dentro da máscara do Milo.
 * A grid DOM só tem linhas VERTICAIS (12 colunas com border-left e a última
 * com border-right); não há linhas horizontais — rowHeight fica 0.
 */
export type HeroGridMetrics = {
  ready: boolean;
  viewport: { w: number; h: number };
  origin: { x: number; y: number };
  size: { w: number; h: number };
  columns: number;
  columnWidth: number;
  gutter: number;
  rowHeight: number;
  lineWidth: number;
  /** figura-alvo da mão ([data-milo-target]) em px de CSS, se existir */
  target: { x: number; y: number; w: number; h: number } | null;
};

export const heroMetrics: HeroGridMetrics = {
  ready: false,
  viewport: { w: 1, h: 1 },
  origin: { x: 0, y: 0 },
  size: { w: 1, h: 1 },
  columns: 12,
  columnWidth: 1,
  gutter: 0,
  rowHeight: 0,
  lineWidth: 1,
  target: null,
};

export function measureHeroGrid(hero: HTMLElement | null) {
  const grid = hero?.querySelector<HTMLElement>("[data-layer=grid]");
  heroMetrics.viewport.w = window.innerWidth;
  heroMetrics.viewport.h = window.innerHeight;
  if (!grid) {
    heroMetrics.ready = false;
    return;
  }
  const r = grid.getBoundingClientRect();
  const first = grid.firstElementChild as HTMLElement | null;
  const cs = getComputedStyle(grid);
  const gutter = parseFloat(cs.columnGap) || 0;
  const cols = grid.children.length || 12;
  const cw = first ? first.getBoundingClientRect().width : (r.width - gutter * (cols - 1)) / cols;
  // a posição de scroll entra para o shader trabalhar em coordenadas de tela
  heroMetrics.origin.x = r.left;
  heroMetrics.origin.y = r.top;
  heroMetrics.size.w = r.width;
  heroMetrics.size.h = r.height;
  heroMetrics.columns = cols;
  heroMetrics.columnWidth = cw;
  heroMetrics.gutter = gutter;
  heroMetrics.lineWidth = first ? parseFloat(getComputedStyle(first).borderLeftWidth) || 1 : 1;
  heroMetrics.ready = true;
  const target = hero?.querySelector<HTMLElement>("[data-milo-target]");
  if (target) {
    const t = target.getBoundingClientRect();
    heroMetrics.target = { x: t.left, y: t.top, w: t.width, h: t.height };
  } else heroMetrics.target = null;
}

/** Instala os observadores; devolve o objeto mutável (mesmo `heroMetrics`). */
export function useMiloHeroMetrics(getHero: () => HTMLElement | null) {
  useEffect(() => {
    const hero = getHero();
    measureHeroGrid(hero);
    const grid = hero?.querySelector<HTMLElement>("[data-layer=grid]");
    const ro = new ResizeObserver(() => measureHeroGrid(getHero()));
    if (grid) ro.observe(grid);
    if (hero) ro.observe(hero);
    const onResize = () => measureHeroGrid(getHero());
    window.addEventListener("resize", onResize);
    document.fonts?.ready.then(onResize).catch(() => {});
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [getHero]);
  return heroMetrics;
}
