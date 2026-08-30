import * as THREE from "three";
import type { Bone } from "../milo.types";

/**
 * IK analítica de dois ossos (ombro → cotovelo → punho), própria.
 * Convenção do rig: cada osso desce pelo -Y local; o grupo fica na
 * articulação. O cotovelo é resolvido pela lei dos cossenos e empurrado na
 * direção do pole vector (para o braço dobrar "para fora e para baixo",
 * nunca para dentro do torso).
 *
 * `weight` mistura a solução com a pose atual (0 = pose, 1 = IK) — é o que
 * torna a extensão do braço reversível e com inércia.
 */
const DOWN = new THREE.Vector3(0, -1, 0);
const a = new THREE.Vector3();
const t = new THREE.Vector3();
const dir = new THREE.Vector3();
const pole = new THREE.Vector3();
const elbow = new THREE.Vector3();
const seg = new THREE.Vector3();
const qWorld = new THREE.Quaternion();
const qParent = new THREE.Quaternion();
const qLocal = new THREE.Quaternion();

export function solveTwoBoneIK(upper: Bone, lower: Bone, targetWorld: THREE.Vector3, poleWorld: THREE.Vector3, weight: number) {
  if (weight <= 0) return;
  upper.group.getWorldPosition(a);
  t.copy(targetWorld);
  const l1 = upper.length;
  const l2 = lower.length;
  dir.subVectors(t, a);
  let d = dir.length();
  const max = (l1 + l2) * 0.995;
  if (d > max) {
    dir.multiplyScalar(max / d);
    d = max;
    t.copy(a).add(dir);
  }
  d = Math.max(d, Math.abs(l1 - l2) + 1e-4);
  dir.normalize();

  // pole perpendicular à direção ombro→alvo
  pole.copy(poleWorld).sub(a);
  pole.addScaledVector(dir, -pole.dot(dir));
  if (pole.lengthSq() < 1e-6) pole.set(0, -1, 0).addScaledVector(dir, -DOWN.dot(dir));
  pole.normalize();

  // ângulo no ombro (lei dos cossenos)
  const cosA = THREE.MathUtils.clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1);
  const angA = Math.acos(cosA);
  elbow.copy(a).addScaledVector(dir, Math.cos(angA) * l1).addScaledVector(pole, Math.sin(angA) * l1);

  aimBone(upper, a, elbow, weight);
  upper.group.updateMatrixWorld(true);
  lower.group.getWorldPosition(a);
  aimBone(lower, a, t, weight);
  lower.group.updateMatrixWorld(true);
}

/** Roda o osso para que o seu -Y local aponte de `from` para `to` (no mundo), misturado por `weight`. */
function aimBone(bone: Bone, from: THREE.Vector3, to: THREE.Vector3, weight: number) {
  seg.subVectors(to, from).normalize();
  qWorld.setFromUnitVectors(DOWN, seg);
  const parent = bone.group.parent;
  if (parent) {
    parent.getWorldQuaternion(qParent);
    qLocal.copy(qParent).invert().multiply(qWorld);
  } else qLocal.copy(qWorld);
  bone.group.quaternion.slerp(qLocal, weight);
}
