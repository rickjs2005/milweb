/**
 * INKVISION — a geometria do braço. Tudo em pixels da placa (1600 × 1067):
 * o eixo do antebraço (cotovelo → punho), o raio do cilindro, e daí saem o
 * contorno de detecção, a malha paramétrica, os tracking points e as
 * transformações das fatias que "enrolam" o desenho na pele.
 *
 * A malha e o warp usam a mesma superfície: um cilindro de raio `r` em torno
 * do eixo. Um ponto a `u` px do eixo (medido na superfície, isto é, arco)
 * aparece na foto a `r·sin(u/r)` do eixo e comprimido por `cos(u/r)` — é a
 * projeção que faz a malha ler como volume e o desenho ler como tatuagem, e
 * não como adesivo. O termo `BEND` desloca as bordas ao longo do eixo (a
 * elipse dos anéis vista de cima), o que dá a curvatura visível.
 */
export const PLATE = { w: 1600, h: 1067 } as const;

/** Eixo do antebraço e raio, em px da placa. */
export const ARM = { x0: 480, y0: 272, x1: 1540, y1: 873, r: 165 } as const;

/** Onde o desenho nasce plano (a "folha"), antes de ir para a pele. */
export const SHEET = { x: 300, y: 760 } as const;

/** O desenho vive num quadrado de 200 unidades; `scale` leva para a placa. */
export const DESIGN = { size: 200, scale: 1.35, strips: 10 } as const;
const BEND = 0.3;

const len = Math.hypot(ARM.x1 - ARM.x0, ARM.y1 - ARM.y0);
/** Versor ao longo do eixo (u) e normal (n). */
export const AXIS = { ux: (ARM.x1 - ARM.x0) / len, uy: (ARM.y1 - ARM.y0) / len, len };
export const NORMAL = { nx: -AXIS.uy, ny: AXIS.ux };

/** Ponto na superfície: `t` ao longo do eixo (0 → 1), `phi` em radianos ao redor dele. */
export function surface(t: number, phi: number): [number, number] {
  const s = Math.sin(phi);
  const c = Math.cos(phi);
  const along = AXIS.len * t + ARM.r * (1 - c) * BEND;
  const across = ARM.r * s;
  return [ARM.x0 + AXIS.ux * along + NORMAL.nx * across, ARM.y0 + AXIS.uy * along + NORMAL.ny * across];
}

const f = (v: number) => v.toFixed(1);
const pt = (p: [number, number]) => `${f(p[0])} ${f(p[1])}`;

/** As linhas da malha: longitudinais (fixas em φ) e anéis (fixos em t). */
export function meshPaths(): { d: string; kind: "long" | "ring" }[] {
  const out: { d: string; kind: "long" | "ring" }[] = [];
  for (const deg of [-72, -48, -24, 0, 24, 48, 72]) {
    const phi = (deg * Math.PI) / 180;
    out.push({ d: `M${pt(surface(0.04, phi))} L${pt(surface(0.97, phi))}`, kind: "long" });
  }
  for (let i = 0; i < 9; i++) {
    const t = 0.08 + (i * 0.86) / 8;
    let d = "";
    for (let k = 0; k <= 12; k++) {
      const phi = -Math.PI / 2 + (k * Math.PI) / 12;
      d += (k ? " L" : "M") + pt(surface(t, phi));
    }
    out.push({ d, kind: "ring" });
  }
  return out;
}

/** O contorno de detecção: a silhueta do cilindro, com as pontas arredondadas. */
export function contourPath(): string {
  const top = [0.02, 0.98].map((t) => surface(t, -Math.PI / 2));
  const bot = [0.98, 0.02].map((t) => surface(t, Math.PI / 2));
  const r = ARM.r;
  return `M${pt(top[0])} L${pt(top[1])} A${f(r * 0.55)} ${f(r)} 0 0 1 ${pt(bot[0])} L${pt(bot[1])} A${f(r * 0.55)} ${f(r)} 0 0 1 ${pt(top[0])} Z`;
}

/** Tracking points: nos dois bordos, em cinco estações — e um no eixo, no centro. */
export function trackPoints(): { x: number; y: number; key: boolean }[] {
  const out: { x: number; y: number; key: boolean }[] = [];
  [0.08, 0.3, 0.52, 0.74, 0.94].forEach((t, i) => {
    for (const phi of [-Math.PI / 2, Math.PI / 2]) {
      const [x, y] = surface(t, phi);
      out.push({ x, y, key: i === 2 });
    }
  });
  const [cx, cy] = surface(0.5, 0);
  out.push({ x: cx, y: cy, key: true });
  return out;
}

/** Onde o desenho assenta na pele e com que rotação (x do desenho = através do braço). */
export function tattooPose() {
  const [x, y] = surface(0.5, 0);
  const rotation = (Math.atan2(NORMAL.ny, NORMAL.nx) * 180) / Math.PI;
  return { x, y, rotation };
}

/**
 * Alvos das fatias (em unidades do desenho, origem no centro do desenho): a
 * fatia `i` cobre `u ∈ [i·w, (i+1)·w]` através do braço; enrolada, seu centro
 * vai para `r·sin(φ)`, ela encolhe por `cos(φ)` e desce `r·(1−cos φ)·BEND`
 * ao longo do eixo. Tudo escalado de volta para unidades do desenho.
 */
export function stripTargets(): { cx: number; x: number; y: number; scaleX: number }[] {
  const { size, scale, strips } = DESIGN;
  const w = size / strips;
  const rd = ARM.r / scale; // raio em unidades do desenho
  return Array.from({ length: strips }, (_, i) => {
    const cx = i * w + w / 2; // centro da fatia no desenho (0 → 200)
    const u = cx - size / 2;
    const phi = u / rd;
    return { cx, x: rd * Math.sin(phi) - u, y: rd * (1 - Math.cos(phi)) * BEND, scaleX: Math.max(0.05, Math.cos(phi)) };
  });
}
