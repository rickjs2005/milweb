import * as THREE from "three";
import { createPointsMaterial } from "./materials/MiloEnergyMaterial";
import { LAYER_OVERLAY } from "./MiloRig";

/**
 * Partículas pretas e acid lime ancoradas nas articulações. Cada ponto
 * conhece a sua junta (aJoint) e o seu deslocamento; o vertex shader faz
 * o movimento (vagar, e o campo de fuga no dissolve). Só as posições das
 * juntas sobem por frame (uniform array).
 */
export function buildParticles(count: number, jointCount: number) {
  const n = Math.max(1, count);
  const joint = new Float32Array(n);
  const offset = new Float32Array(n * 3);
  const seed = new Float32Array(n);
  const lime = new Float32Array(n);
  const pos = new Float32Array(n * 3);
  let s = 1234;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < n; i++) {
    joint[i] = Math.floor(rnd() * jointCount);
    // esfera não uniforme: mais denso perto da junta
    const r = Math.pow(rnd(), 1.3) * 0.2 + 0.03;
    const th = rnd() * Math.PI * 2;
    const ph = Math.acos(rnd() * 2 - 1);
    offset[i * 3] = Math.sin(ph) * Math.cos(th) * r;
    offset[i * 3 + 1] = Math.sin(ph) * Math.sin(th) * r;
    offset[i * 3 + 2] = Math.cos(ph) * r;
    seed[i] = rnd();
    lime[i] = rnd() < 0.16 ? 1 : 0;
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
