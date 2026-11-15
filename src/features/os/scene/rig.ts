import { type Bone, MathUtils, Matrix4, type Object3D, Quaternion, Vector3 } from "three";

/**
 * O esqueleto da entidade e a IK do braço.
 *
 * Convenção do rig (definida no Blender — assets/entity/build_entity.py — e preservada pelo glTF):
 * cada osso aponta pelo +Y local. No braço, o cotovelo dobra levando o antebraço para o +Z do
 * braço, e o eixo da dobradiça é o X. Na mão, o dorso é o +X no lado direito e o −X no esquerdo.
 *
 * IK analítica de dois segmentos (ombro → cotovelo → pulso), própria, em vez do CCDIKSolver:
 * o braço tem exatamente dois ossos entre o ombro e o pulso, então a lei dos cossenos dá a solução
 * exata num passo, sem iterar; o plano da dobra sai de um vetor de polo (o cotovelo nunca inverte) e a
 * torção de cada osso é construída explicitamente (base ortonormal), o que o CCD não controla.
 * O alvo é a PONTA do indicador: a orientação da mão é resolvida primeiro e o pulso é posicionado
 * recuando da ponta pelo vetor pulso → ponta medido nos ossos naquele quadro (com o gesto dos dedos
 * que estiver valendo).
 */
export type Side = "R" | "L";

export type ArmRig = {
  side: Side;
  clavicle: Bone;
  upper: Bone;
  fore: Bone;
  hand: Bone;
  /** Marcador na ponta do indicador. */
  tip: Bone;
  /** Comprimentos ombro–cotovelo e cotovelo–pulso (unidades do modelo). */
  l1: number;
  l2: number;
};

export type Rig = {
  bones: Record<string, Bone>;
  hips: Bone;
  spine: Bone;
  chest: Bone;
  neck: Bone;
  head: Bone;
  arms: Record<Side, ArmRig>;
  frags: Bone[];
  /** Alcance do ombro à ponta do indicador com o braço estendido (unidades do modelo). */
  reach: number;
};

export function buildRig(root: Object3D): Rig | null {
  const bones: Record<string, Bone> = {};
  root.traverse((o) => {
    if ((o as Bone).isBone) bones[o.name] = o as Bone;
  });
  const need = ["hips", "spine", "chest", "neck", "head"];
  for (const side of ["R", "L"]) need.push(`clavicle_${side}`, `upper_arm_${side}`, `forearm_${side}`, `hand_${side}`, `tip_index_${side}`);
  if (need.some((n) => !bones[n])) return null;
  const arm = (side: Side): ArmRig => {
    const fore = bones[`forearm_${side}`];
    const hand = bones[`hand_${side}`];
    return { side, clavicle: bones[`clavicle_${side}`], upper: bones[`upper_arm_${side}`], fore, hand, tip: bones[`tip_index_${side}`], l1: fore.position.length(), l2: hand.position.length() };
  };
  const arms = { R: arm("R"), L: arm("L") };
  // pulso → ponta do indicador, na pose de repouso do arquivo (dedos estendidos)
  root.updateMatrixWorld(true);
  const w = arms.R.hand.getWorldPosition(new Vector3());
  const t = arms.R.tip.getWorldPosition(new Vector3());
  return {
    bones,
    hips: bones.hips,
    spine: bones.spine,
    chest: bones.chest,
    neck: bones.neck,
    head: bones.head,
    arms,
    frags: Object.keys(bones)
      .filter((n) => n.startsWith("frag_"))
      .sort()
      .map((n) => bones[n]),
    reach: arms.R.l1 + arms.R.l2 + w.distanceTo(t),
  };
}

export type ArmGoal = {
  /** Onde a ponta do indicador deve estar (mundo). */
  tip: Vector3;
  /** Para onde o dedo aponta (mundo, unitário). */
  finger: Vector3;
  /** Para onde o dorso da mão tende a ficar virado (mundo). */
  back: Vector3;
  /** Para onde o cotovelo tende a ir (mundo). */
  pole: Vector3;
};

export type ArmLimits = { elbowMin: number; elbowMax: number; wrist: number; maxStretch: number };

const S = new Vector3();
const W = new Vector3();
const E = new Vector3();
const dir = new Vector3();
const pole = new Vector3();
const alt = new Vector3();
const tipLocal = new Vector3();
const aL = new Vector3();
const uL = new Vector3();
const cL = new Vector3();
const aW = new Vector3();
const uW = new Vector3();
const cW = new Vector3();
const X = new Vector3();
const Y = new Vector3();
const Z = new Vector3();
const tmp = new Vector3();
const mA = new Matrix4();
const mB = new Matrix4();
const qHand = new Quaternion();
const qUp = new Quaternion();
const qFore = new Quaternion();
const qParent = new Quaternion();
const qLocal = new Quaternion();
const UP = new Vector3(0, 1, 0);

/** Quaternion do mundo a partir de Y (direção do osso) e de uma dica para o Z (ortogonalizada). */
function basisYZ(y: Vector3, zHint: Vector3, out: Quaternion): boolean {
  Y.copy(y).normalize();
  Z.copy(zHint).addScaledVector(Y, -zHint.dot(Y));
  if (Z.lengthSq() < 1e-8) return false;
  Z.normalize();
  X.crossVectors(Y, Z);
  out.setFromRotationMatrix(mA.makeBasis(X, Y, Z));
  return true;
}

/**
 * Resolve o braço para a ponta do indicador chegar a `goal.tip`. As matrizes de mundo da cadeia
 * precisam estar atualizadas (depois do mixer e do corpo). `weight` mistura a solução com a pose
 * que o mixer deixou (0 = pose, 1 = IK). Devolve quanto faltou (unidades) quando o alvo está além
 * do braço — 0 quando alcança. Depois de chamar, atualize as matrizes da clavícula para baixo.
 */
export function solveArm(arm: ArmRig, goal: ArmGoal, weight: number, lim: ArmLimits): number {
  if (weight <= 0) return 0;
  const sgn = arm.side === "R" ? 1 : -1;
  arm.upper.getWorldPosition(S);

  // pulso → ponta, no espaço local da mão, com o gesto de dedos deste quadro
  arm.tip.getWorldPosition(tipLocal);
  arm.hand.worldToLocal(tipLocal);
  const tipLen = tipLocal.length();

  let short = 0;
  aW.copy(goal.finger).normalize();
  for (let pass = 0; pass < 2; pass++) {
    // 1) orientação da mão: o vetor pulso → ponta aponta para `finger`; o dorso procura `back`
    aL.copy(tipLocal).normalize();
    uL.set(sgn, 0, 0).addScaledVector(aL, -sgn * aL.x).normalize();
    cL.crossVectors(aL, uL);
    uW.copy(goal.back).addScaledVector(aW, -goal.back.dot(aW));
    if (uW.lengthSq() < 1e-8) uW.copy(UP).addScaledVector(aW, -UP.dot(aW));
    uW.normalize();
    cW.crossVectors(aW, uW);
    mA.makeBasis(aW, uW, cW);
    mB.makeBasis(aL, uL, cL).transpose();
    qHand.setFromRotationMatrix(mA.multiply(mB));

    // 2) pulso: recua da ponta pelo comprimento pulso → ponta
    W.copy(goal.tip).addScaledVector(aW, -tipLen);

    // 3) dois segmentos: lei dos cossenos, cotovelo no lado do polo
    dir.subVectors(W, S);
    let d = dir.length();
    const total = arm.l1 + arm.l2;
    const dMax = Math.min(total * lim.maxStretch, Math.sqrt(arm.l1 * arm.l1 + arm.l2 * arm.l2 - 2 * arm.l1 * arm.l2 * Math.cos(MathUtils.degToRad(180 - lim.elbowMin))));
    const dMin = Math.sqrt(arm.l1 * arm.l1 + arm.l2 * arm.l2 - 2 * arm.l1 * arm.l2 * Math.cos(MathUtils.degToRad(180 - lim.elbowMax)));
    short = 0;
    if (d > dMax) {
      short = d - dMax;
      d = dMax;
    } else if (d < dMin) d = dMin;
    if (dir.lengthSq() < 1e-10) dir.set(sgn > 0 ? -1 : 1, 0, 0);
    dir.normalize();
    W.copy(S).addScaledVector(dir, d);
    // Polo: a parte de `goal.pole` perpendicular ao braço. Quando o braço fica quase paralelo a ele (apontando
    // para cima ou para baixo), essa parte some e o plano da dobra giraria de uma vez: aí entra, aos poucos, um
    // polo de reserva (para fora e para trás do corpo), e a transição entre os dois é contínua.
    pole.copy(goal.pole).normalize();
    pole.addScaledVector(dir, -pole.dot(dir));
    const keep = Math.min(1, pole.length() / 0.55);
    alt.set(sgn > 0 ? -1 : 1, 0.2, -0.55).normalize();
    alt.addScaledVector(dir, -alt.dot(dir));
    if (alt.lengthSq() < 1e-8) alt.set(0, 0, -1).addScaledVector(dir, dir.z);
    alt.normalize();
    if (pole.lengthSq() > 1e-10) pole.normalize();
    pole.multiplyScalar(keep).addScaledVector(alt, 1 - keep);
    if (pole.lengthSq() < 1e-8) pole.copy(alt);
    pole.normalize();
    const cosA = MathUtils.clamp((arm.l1 * arm.l1 + d * d - arm.l2 * arm.l2) / (2 * arm.l1 * d), -1, 1);
    const sinA = Math.sqrt(1 - cosA * cosA);
    E.copy(S).addScaledVector(dir, cosA * arm.l1).addScaledVector(pole, sinA * arm.l1);

    // braço: Y para o cotovelo, Z para o lado em que o antebraço dobra (oposto ao polo)
    tmp.subVectors(W, E);
    Y.subVectors(E, S);
    if (!basisYZ(Y, tmp, qUp)) basisYZ(Y, pole.clone().negate(), qUp);
    // antebraço: Y para o pulso, mesmo eixo de dobradiça (X) do braço
    X.set(1, 0, 0).applyQuaternion(qUp);
    Y.subVectors(W, E).normalize();
    Z.crossVectors(X, Y).normalize();
    X.crossVectors(Y, Z);
    qFore.setFromRotationMatrix(mA.makeBasis(X, Y, Z));

    // 4) limite do pulso: se a mão dobrar demais em relação ao antebraço, traz o dedo para perto dele
    tmp.set(0, 1, 0).applyQuaternion(qHand);
    const ang = Math.acos(MathUtils.clamp(tmp.dot(Y), -1, 1));
    const maxW = MathUtils.degToRad(lim.wrist);
    if (pass === 0 && ang > maxW) {
      const k = (ang - maxW) / ang;
      qLocal.setFromUnitVectors(tmp, Y);
      qParent.identity().slerp(qLocal, k);
      aW.applyQuaternion(qParent).normalize();
      continue;
    }
    break;
  }

  // 5) aplica, do ombro para a mão, convertendo para o espaço local de cada osso
  arm.clavicle.getWorldQuaternion(qParent);
  qLocal.copy(qParent).invert().multiply(qUp);
  arm.upper.quaternion.slerp(qLocal, weight);
  qParent.multiply(arm.upper.quaternion);
  qLocal.copy(qParent).invert().multiply(qFore);
  arm.fore.quaternion.slerp(qLocal, weight);
  qParent.multiply(arm.fore.quaternion);
  qLocal.copy(qParent).invert().multiply(qHand);
  arm.hand.quaternion.slerp(qLocal, weight);
  return short;
}

const qy = new Quaternion();
const qx = new Quaternion();
const AX = new Vector3(1, 0, 0);
const AY = new Vector3(0, 1, 0);
const AZ = new Vector3(0, 0, 1);

/**
 * Olhar: soma guinada (yaw, + = esquerda do personagem) e inclinação (pitch, + = para baixo) à pose
 * do mixer, distribuídas por tronco, pescoço e cabeça (ossos verticais: Y = cima, X = esquerda).
 */
export function applyLook(rig: Rig, yaw: number, pitch: number) {
  const parts: [Bone, number][] = [
    [rig.chest, 0.14],
    [rig.neck, 0.34],
    [rig.head, 0.52],
  ];
  for (const [b, k] of parts) {
    qy.setFromAxisAngle(AY, yaw * k);
    qx.setFromAxisAngle(AX, pitch * k);
    b.quaternion.multiply(qy).multiply(qx);
  }
}

/** Inclina o tronco para um lado (roll, + = tomba para a direita do personagem), dividido na coluna. */
export function applyLean(rig: Rig, roll: number) {
  qy.setFromAxisAngle(AZ, roll * 0.5);
  rig.spine.quaternion.multiply(qy);
  rig.chest.quaternion.multiply(qy);
}
