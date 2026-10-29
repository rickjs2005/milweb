/**
 * Árvores secas procedurais: galhos que se bifurcam com sorteio determinístico (mulberry32), um traço por
 * profundidade — o tronco é grosso, os ramos afinam. Sai como dados de <path>; a semente fixa o desenho, então
 * servidor e cliente (e capturas de teste) veem sempre a mesma árvore.
 */
export function mulberry32(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type TreeStroke = { d: string; w: number };

/** Uma árvore com o pé em (x, y), `h` de altura aproximada e uma inclinação inicial (rad). */
export function deadTree(seed: number, x: number, y: number, h: number, lean = 0, depth = 6): TreeStroke[] {
  const rnd = mulberry32(seed);
  const levels: string[][] = Array.from({ length: depth + 1 }, () => []);
  const baseW = h * 0.05;
  const branch = (px: number, py: number, ang: number, len: number, d: number) => {
    const nx = px + Math.sin(ang) * len;
    const ny = py - Math.cos(ang) * len;
    levels[d].push(`M${px.toFixed(1)} ${py.toFixed(1)}L${nx.toFixed(1)} ${ny.toFixed(1)}`);
    if (d === depth) return;
    const n = d < 2 ? 2 : rnd() < 0.3 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const spread = (rnd() - 0.5) * 1.1 + (i === 0 ? -0.4 : i === 1 ? 0.4 : 0);
      branch(nx, ny, ang + spread * (d < 2 ? 0.7 : 1), len * (0.66 + rnd() * 0.16), d + 1);
    }
  };
  branch(x, y, lean, h * 0.3, 0);
  return levels.map((segs, d) => ({ d: segs.join(""), w: Math.max(0.8, baseW * Math.pow(0.66, d)) }));
}
