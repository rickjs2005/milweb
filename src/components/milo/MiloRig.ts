import * as THREE from "three";
import { MILO } from "./milo.config";
import * as G from "./MiloGeometry";
import { buildCoat, buildCoatWire } from "./MiloCoat";
import { createMaskMaterial } from "./materials/MiloMaskMaterial";
import { createWireMaterial } from "./materials/MiloEnergyMaterial";
import type { Bone, BoneName, MiloRigHandle } from "./milo.types";

/**
 * Rig procedural: grupos aninhados como articulações (grupo NA junta, o
 * membro desce pelo -Y local). Cada parte tem a malha da máscara (layer 1)
 * e o wireframe de baixa resolução (layer 2). Construído imperativamente
 * — a hierarquia é dado, não JSX — e entregue ao R3F via <primitive>.
 *
 *   MiloRoot
 *   ├── Pelvis ─┬─ Spine ─ Chest ─┬─ Neck ─ Head
 *   │           │                 ├─ LeftShoulder ─ LeftArm ─ LeftForearm ─ LeftHand
 *   │           │                 └─ RightShoulder ─ RightArm ─ RightForearm ─ RightHand
 *   │           ├─ LeftLeg ─ LeftShin ─ LeftFoot
 *   │           └─ RightLeg ─ RightShin ─ RightFoot
 */
export const LAYER_BG = 0;
export const LAYER_MASK = 1;
export const LAYER_OVERLAY = 2;

export function buildRig(): MiloRigHandle {
  const P = MILO.proportions;
  const maskMat = createMaskMaterial({ fresnelPower: 2.2 });
  const coatMat = createMaskMaterial({ coat: true, fresnelPower: 1.7 });
  const wireMat = createWireMaterial(0.12);
  const wireLimeMat = createWireMaterial(0.55);
  const disposables: { dispose: () => void }[] = [maskMat, coatMat, wireMat, wireLimeMat];

  const bones = {} as Record<BoneName, Bone>;
  const joints: THREE.Object3D[] = [];

  const part = (parent: THREE.Object3D, name: BoneName, length: number, geo: G.PartGeometry | null, jointR = 0, lime = false) => {
    const group = new THREE.Group();
    group.name = name;
    parent.add(group);
    if (geo) {
      const m = new THREE.Mesh(geo.mask, maskMat);
      m.layers.set(LAYER_MASK);
      m.frustumCulled = false;
      group.add(m);
      const w = new THREE.LineSegments(new THREE.WireframeGeometry(geo.wire), lime ? wireLimeMat : wireMat);
      w.layers.set(LAYER_OVERLAY);
      w.frustumCulled = false;
      group.add(w);
      disposables.push(geo.mask, geo.wire, w.geometry);
    }
    if (jointR > 0) {
      const jg = G.joint(jointR);
      const jm = new THREE.Mesh(jg.mask, maskMat);
      jm.layers.set(LAYER_MASK);
      group.add(jm);
      disposables.push(jg.mask, jg.wire);
    }
    const e = MILO.pose[name];
    const rest = new THREE.Quaternion().setFromEuler(new THREE.Euler(e[0], e[1], e[2], "XYZ"));
    group.quaternion.copy(rest);
    bones[name] = { name, group, length, rest };
    joints.push(group);
    return group;
  };

  const root = new THREE.Group();
  root.name = "MiloRoot";

  // altura do pivot da pélvis = pernas
  const legLen = P.thigh.len + P.shin.len;
  const pelvisG = part(root, "pelvis", P.pelvis.h, G.pelvis(P.pelvis.w, P.pelvis.h, P.pelvis.d));
  pelvisG.position.set(0, legLen + P.pelvis.h * 0.55, 0);

  const spineG = part(pelvisG, "spine", P.spine.len, G.limb(P.spine.len, P.spine.r, 1.05));
  spineG.position.set(0, P.spine.len - P.pelvis.h * 0.1, 0);
  const chestG = part(spineG, "chest", P.chest.len, G.torso(P.chest.len, P.chest.r, P.chest.wx, P.chest.wz));
  chestG.position.set(0, P.chest.len - 0.02, 0);

  const neckG = part(chestG, "neck", P.neck.len, G.neck(P.neck.len, P.neck.r));
  neckG.position.set(0, P.neck.len + 0.02, 0.01);
  const headG = part(neckG, "head", P.head.h, G.head(P.head.w, P.head.h, P.head.d));
  headG.position.set(0, 0.01, 0);

  // braços
  const arm = (side: 1 | -1) => {
    const pre = side > 0 ? "left" : "right";
    const sh = part(chestG, `${pre}Shoulder` as BoneName, 0.05, null, P.upperArm.r * 1.25);
    sh.position.set(side * P.shoulderHalf, -0.01, -0.01);
    const up = part(sh, `${pre}Arm` as BoneName, P.upperArm.len, G.limb(P.upperArm.len, P.upperArm.r, 0.86), 0);
    up.position.set(side * 0.02, -0.02, 0);
    const fo = part(up, `${pre}Forearm` as BoneName, P.forearm.len, G.limb(P.forearm.len, P.forearm.r, 0.8), P.forearm.r * 1.15, true);
    fo.position.set(0, -P.upperArm.len, 0);
    const ha = part(fo, `${pre}Hand` as BoneName, P.hand.len, G.hand(P.hand.len, P.hand.r, side), P.hand.r * 1.05);
    ha.position.set(0, -P.forearm.len, 0);
    return ha;
  };
  arm(1);
  const rightHand = arm(-1);
  const rightHandTip = new THREE.Object3D();
  rightHandTip.position.set(0, -P.hand.len * 0.9, 0);
  rightHand.add(rightHandTip);

  // pernas
  const leg = (side: 1 | -1) => {
    const pre = side > 0 ? "left" : "right";
    const th = part(pelvisG, `${pre}Leg` as BoneName, P.thigh.len, G.limb(P.thigh.len, P.thigh.r, 0.78), P.thigh.r * 1.05);
    th.position.set(side * P.pelvis.w * 0.32, -P.pelvis.h * 0.45, 0);
    const sh = part(th, `${pre}Shin` as BoneName, P.shin.len, G.limb(P.shin.len, P.shin.r, 0.72), P.shin.r * 1.2, true);
    sh.position.set(0, -P.thigh.len, 0);
    const ft = part(sh, `${pre}Foot` as BoneName, P.foot.len, G.foot(P.foot.len, P.foot.r), 0);
    ft.position.set(0, -P.shin.len + 0.02, 0.01);
  };
  leg(1);
  leg(-1);

  // casaco: filho do peito
  const coatGeo = buildCoat();
  const coat = new THREE.Mesh(coatGeo, coatMat);
  coat.name = "coat";
  coat.layers.set(LAYER_MASK);
  coat.frustumCulled = false;
  coat.position.set(0, -0.16, 0);
  chestG.add(coat);
  const coatWireGeo = buildCoatWire(coatGeo);
  const coatWire = new THREE.LineSegments(coatWireGeo, wireMat);
  coatWire.layers.set(LAYER_OVERLAY);
  coatWire.position.copy(coat.position);
  coatWire.frustumCulled = false;
  chestG.add(coatWire);
  disposables.push(coatGeo, coatWireGeo);

  root.updateMatrixWorld(true);

  return {
    root,
    bones,
    joints,
    rightHandTip,
    dispose: () => disposables.forEach((d) => d.dispose()),
  };
}

/** Reaplica a pose de repouso e limpa offsets — chamado no início de cada frame. */
export function resetPose(rig: MiloRigHandle) {
  for (const name in rig.bones) {
    const b = rig.bones[name as BoneName];
    b.group.quaternion.copy(b.rest);
    b.group.rotation.setFromQuaternion(b.rest, "XYZ");
  }
  rig.bones.chest.group.scale.setScalar(1);
  rig.bones.chest.group.position.y = MILO.proportions.chest.len - 0.02;
}

/** Percorre os materiais do rig para atualizar uniforms compartilhados. */
export function eachRigMaterial(rig: MiloRigHandle, fn: (m: THREE.ShaderMaterial) => void) {
  const seen = new Set<THREE.Material>();
  rig.root.traverse((o) => {
    const mat = (o as THREE.Mesh).material as THREE.ShaderMaterial | undefined;
    if (mat && !seen.has(mat)) {
      seen.add(mat);
      fn(mat);
    }
  });
}
