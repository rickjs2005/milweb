import type { FigureMesh, Molecules } from "./asset";

/**
 * Onde cada molécula fica na home. A figura é uma superfície contínua; as moléculas se concentram onde
 * ela se rompe: atrás da cabeça e na borda do ombro (tipo 0, posição em unidades da figura), ao longo da
 * borda livre da aba levantada (1), da borda da página (2) e nas rugas que saem da ponta (3) — nesses
 * três, `pos` guarda parâmetros da dobra e o shader calcula o lugar, para acompanhar o gesto. A maior
 * parte fica guardada (4): invisível na home, à espera nas zonas de ruptura — é dali que sai o cérebro.
 * Determinístico: a mesma molécula vai sempre para o mesmo lugar.
 */
export function heroTargets(M: Molecules, F: FigureMesh): { pos: Float32Array; nrm: Float32Array } {
  let seed = 20261120;
  const rand = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // de onde a matéria se solta: os vértices em dissolução, pesados por quanto se desfazem
  const from: { part: number; i: number }[] = [];
  const cum: number[] = [];
  let total = 0;
  F.parts.forEach((part, k) => {
    for (let i = 0; i < part.count; i++) {
      const dis = part.meta[i * 4 + 2] / 255;
      if (dis < 0.1) continue;
      total += Math.pow(dis, 1.2);
      from.push({ part: k, i });
      cum.push(total);
    }
  });
  const pick = () => {
    const x = rand() * total;
    let lo = 0;
    let hi = cum.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] < x) lo = mid + 1;
      else hi = mid;
    }
    return from[lo];
  };

  const rays = [1.72, 2.05, 2.42, 2.78, 3.2, 3.62, 4.02, 4.36];
  const pos = new Float32Array(M.count * 3);
  const nrm = new Float32Array(M.count * 4);
  for (let m = 0; m < M.count; m++) {
    const r = rand();
    const o = m * 3;
    const q = m * 4;
    if ((r < 0.27 || r >= 0.31) && from.length > 0) {
      const hidden = r >= 0.31;
      const { part, i } = pick();
      const P = F.parts[part];
      const dis = P.meta[i * 4 + 2] / 255;
      const nx = P.na[i * 4] / 127;
      const ny = P.na[i * 4 + 1] / 127;
      const nz = P.na[i * 4 + 2] / 127;
      const y = P.position[i * 3 + 1];
      // a cabeça se desfaz para trás e para cima; o ombro e o tronco, para fora do quadro
      const drift = y > 0.15 ? [0.72 + 0.5 * nx, 0.28 + 0.5 * ny, -0.3 + 0.4 * nz] : [0.55 + 0.4 * nx, -0.42 + 0.4 * ny, 0.1 + 0.4 * nz];
      const t = hidden ? rand() * 0.06 : Math.pow(rand(), 2.1) * (0.05 + 0.85 * dis);
      const jx = (rand() - 0.5) * 0.12 * t;
      const jy = (rand() - 0.5) * 0.3 * t;
      pos[o] = P.position[i * 3] + nx * 0.008 + drift[0] * t + jx;
      pos[o + 1] = y + ny * 0.008 + drift[1] * t + jy;
      pos[o + 2] = P.position[i * 3 + 2] + nz * 0.008 + drift[2] * t;
      nrm[q] = nx;
      nrm[q + 1] = ny;
      nrm[q + 2] = nz;
      nrm[q + 3] = hidden ? 4 : 0;
      continue;
    }
    const tilt = [(rand() - 0.5) * 1.2, (rand() - 0.5) * 1.2, 0.7];
    const len = Math.hypot(tilt[0], tilt[1], tilt[2]);
    nrm[q] = tilt[0] / len;
    nrm[q + 1] = tilt[1] / len;
    nrm[q + 2] = tilt[2] / len;
    if (r < 0.295) {
      // borda livre da aba: densa perto da ponta, mais solta adiante; algumas flutuam sobre a abertura
      const d = 1.3 * Math.pow(rand(), 1.9);
      pos[o] = d;
      pos[o + 1] = (rand() - 0.42) * (0.04 + 0.22 * d) * Math.pow(rand(), 1.7);
      pos[o + 2] = 0.02 + 0.06 * rand();
      nrm[q + 3] = 1;
    } else if (r < 0.305) {
      const d = 1.0 * Math.pow(rand(), 1.8);
      pos[o] = d;
      pos[o + 1] = 0.006 - Math.pow(rand(), 1.6) * 0.07 * (0.3 + d);
      pos[o + 2] = 0.02 + 0.03 * rand();
      nrm[q + 3] = 2;
    } else {
      // rugas: fragmentos alinhados nas linhas de tensão que saem da ponta
      pos[o] = 0.03 + 0.3 * Math.pow(rand(), 2.4);
      pos[o + 1] = rays[Math.floor(rand() * rays.length)] + (rand() - 0.5) * 0.05;
      pos[o + 2] = 0.02 + 0.03 * rand();
      nrm[q + 3] = 3;
    }
  }
  return { pos, nrm };
}
