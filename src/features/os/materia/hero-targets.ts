import type { Molecules } from "./asset";
import type { Sculpt } from "./sculpt";

/**
 * Onde cada molécula fica enquanto a escultura está inteira: guardada na superfície da figura em repouso
 * (tipo 4: invisível, não custa um pixel). Quando a conversa abre, a pedra se recolhe e é dali que a prata sai
 * para formar o cérebro. Determinístico: a mesma molécula sai sempre do mesmo lugar.
 */
export function heroTargets(M: Molecules, rest: Sculpt): { pos: Float32Array; nrm: Float32Array } {
  let seed = 20261120;
  const rand = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  // do corpo e do panejamento (regiões 0–4); o bloco e a base ficam como estão
  const from: number[] = [];
  for (let i = 0; i < rest.count; i++) if (rest.meta[i * 4] <= 4) from.push(i);
  const pos = new Float32Array(M.count * 3);
  const nrm = new Float32Array(M.count * 4);
  for (let m = 0; m < M.count; m++) {
    const i = from.length > 0 ? from[Math.floor(rand() * from.length)] : Math.floor(rand() * rest.count);
    const nx = rest.na[i * 4] / 127;
    const ny = rest.na[i * 4 + 1] / 127;
    const nz = rest.na[i * 4 + 2] / 127;
    pos[m * 3] = rest.position[i * 3] + nx * 0.01;
    pos[m * 3 + 1] = rest.position[i * 3 + 1] + ny * 0.01;
    pos[m * 3 + 2] = rest.position[i * 3 + 2] + nz * 0.01;
    nrm[m * 4] = nx;
    nrm[m * 4 + 1] = ny;
    nrm[m * 4 + 2] = nz;
    nrm[m * 4 + 3] = 4;
  }
  return { pos, nrm };
}
