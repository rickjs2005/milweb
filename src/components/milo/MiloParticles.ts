import * as THREE from "three";
import { createPointsMaterial } from "./materials/MiloEnergyMaterial";
import { LAYER_OVERLAY } from "./MiloRig";

/**
 * Partículas pretas e acid lime ancoradas nas articulações — concentradas
 * nas juntas de energia (ombro/cotovelo/mão ativos, pescoço) por peso; o
 * resto do corpo recebe poucas. O vertex shader faz o movimento (vagar e
 * o campo de fuga no dissolve); só as posições das juntas sobem por frame.
 */
export function buildParticles(count: number, jointWeights: number[]) {
  const n = Math.max(1, count);
  const joint = new Float32Array(n);
  const offset = new Float32Array(n * 3);
  const seed = new Float32Array(n);
  const lime = new Float32Array(n);
  const pos = new Float32Array(n * 3);
  let s = 1234;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const total = jointWeights.reduce((a, b) => a + b, 0) || 1;
  const pick = () => {
    let r = rnd() * total;
    for (let i = 0; i < jointWeights.length; i++) {
      r -= jointWeights[i];
      if (r <= 0) return i;
    }
    return jointWeights.length - 1;
  };
  for (let i = 0; i < n; i++) {
    const j = pick();
    joint[i] = j;
    const energy = jointWeights[j] > 0.5;
    const r = Math.pow(rnd(), 1.3) * (energy ? 0.16 : 0.24) + 0.03;
    const th = rnd() * Math.PI * 2;
    const ph = Math.acos(rnd() * 2 - 1);
    offset[i * 3] = Math.sin(ph) * Math.cos(th) * r;
    offset[i * 3 + 1] = Math.sin(ph) * Math.sin(th) * r;
    offset[i * 3 + 2] = Math.cos(ph) * r;
    seed[i] = rnd();
    lime[i] = energy && rnd() < 0.2 ? 1 : 0; // acid lime só nas juntas de energia (<5 % do total)
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aJoint", new THREE.BufferAttribute(joint, 1));
  g.setAttribute("aOffset", new THREE.BufferAttribute(offset, 3));
  g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  g.setAttribute("aLime", new THREE.BufferAttribute(lime, 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1, 0), 4);
  const mat = createPointsMaterial();
  const points = new THREE.Points(g, mat);
  points.layers.set(LAYER_OVERLAY);
  points.frustumCulled = false;
  return { points, material: mat, dispose: () => (g.dispose(), mat.dispose()) };
}
