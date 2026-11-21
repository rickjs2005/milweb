import { RIG } from "./rig-data";

/**
 * O esqueleto das esculturas: peito, cabeça, dois braços (ombro → cotovelo → punho → mão) e os adereços.
 *
 * Cada figura tem o corpo esculpido já na pose (assets/materia/sculpt); o que se move são os braços, e é a AÇÃO
 * que manda neles: cada um recebe um ponto de contato na cena (a borda que se ergue, a ponta do compasso, o
 * canto da folha), a orientação da mão e a forma dos dedos. O punho sai do ponto de contato, o cotovelo sai de
 * uma cinemática inversa de dois ossos, e a pele se reparte entre os ossos no shader (hero-shaders.ts ›
 * FIGURE_VERT). Os valores correm até o alvo com o tempo — a figura sempre parte da pose em que está.
 *
 * Unidades da figura: o chão é y = 0, x para a direita de quem vê, z para quem vê. O braço A é o DIREITO da
 * figura (malha espelhada); o B, o esquerdo. `frame` troca com a figura: ombros, escala e espessura dos braços,
 * e os pivôs do peito (cintura) e da cabeça (alto do pescoço).
 *
 * Ossos: 0 parado · 1 peito · 2 cabeça · 3–5 braço A · 6–8 braço B · 9–12 adereços.
 */
export type V3 = [number, number, number];
export type Contact = keyof typeof RIG.contact;
export type Shape = (typeof RIG.shapes)[number];
export type ArmGoal = {
  /** Onde o ponto de contato da mão deve estar. */
  at: V3;
  contact: Contact;
  /** Para onde apontam os dedos e o dorso da mão (não precisam vir normalizados). */
  fingers: V3;
  back: V3;
  /** Para que lado o cotovelo dobra. */
  pole: V3;
  shape: Shape;
  /** Quão depressa a mão chega (1/s). Alto = presa ao alvo (a borda que o gesto estica). */
  rate?: number;
  /** Quanto a mão segue a linha ombro → alvo (0 = só a direção pedida). */
  align?: number;
};
export type Goal = { a: ArmGoal | null; b: ArmGoal | null; /** O peito gira a partir da cintura: (para os lados, para a frente, rolagem), rad. */ lean: V3; /** A cabeça gira: (para os lados, para baixo), rad. */ look: [number, number] };
export type RigFrame = { shoulderA: V3 | null; shoulderB: V3 | null; scaleA: number; scaleB: number; thickA: number; thickB: number; waist: V3; neck: V3 };

const SHAPES = RIG.shapes;
export const BONES = 13;
export const PROP_BONE = 9;
const v3 = (a: readonly number[], o = 0): V3 => [a[o], a[o + 1], a[o + 2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const norm = (a: V3): V3 => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
/** `y` sem a parte que aponta para `x` (x já normalizado). */
const ortho = (y: V3, x: V3): V3 => norm(sub(y, mul(x, dot(y, x))));
const mix3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
/** Matriz de giro (colunas) para ângulos pequenos ou grandes: y, depois x, depois z. */
const euler = (yaw: number, pitch: number, roll: number): [V3, V3, V3] => {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cx = Math.cos(pitch), sx = Math.sin(pitch), cz = Math.cos(roll), sz = Math.sin(roll);
  return [
    [cy * cz + sy * sx * sz, cx * sz, -sy * cz + cy * sx * sz],
    [-cy * sz + sy * sx * cz, cx * cz, sy * sz + cy * sx * cz],
    [sy * cx, -sx, cy * cx],
  ];
};
const apply = (m: [V3, V3, V3], p: V3): V3 => [m[0][0] * p[0] + m[1][0] * p[1] + m[2][0] * p[2], m[0][1] * p[0] + m[1][1] * p[1] + m[2][1] * p[2], m[0][2] * p[0] + m[1][2] * p[1] + m[2][2] * p[2]];

type ArmState = { at: V3; offset: V3; fingers: V3; back: V3; pole: V3; align: number; w: number[]; elbow: V3; wrist: V3; touch: V3; reach: number };
const armOf = (g: ArmGoal): ArmState => ({ at: [...g.at], offset: v3(RIG.contact[g.contact]), fingers: norm(g.fingers), back: norm(g.back), pole: norm(g.pole), align: g.align ?? 0, w: SHAPES.map((s) => (s === g.shape ? 1 : 0)), elbow: [0, 0, 0], wrist: [0, 0, 0], touch: [0, 0, 0], reach: 1 });
const IDLE: ArmGoal = { at: [0, 2, 1], contact: "palm", fingers: [0, -1, 0.2], back: [0, 0.2, 1], pole: [0, 0, -1], shape: "relax" };

export type Rig = {
  /** 13 ossos × 3 linhas de uma matriz 3 × 4 (linha = xyz + translação), prontos para o shader. */
  readonly bones: Float32Array;
  /** Por braço: as duas formas da mão em uso (índices em RIG.shapes) e a mistura entre elas. */
  readonly hand: { a: { from: number; to: number; k: number }; b: { from: number; to: number; k: number } };
  /** Por braço: quanto o alvo está dentro do alcance (1 = alcança; menor = a mão ficou para trás). */
  readonly reach: { a: number; b: number };
  /** Onde ficaram o punho, o cotovelo e o ponto de contato de cada braço (para a cena, as medições e os testes). */
  readonly joints: { a: { wrist: V3; elbow: V3; touch: V3 }; b: { wrist: V3; elbow: V3; touch: V3 } };
  /** Algo ainda está se mexendo? */
  readonly moving: boolean;
  /** A figura mudou: ombros, escala dos braços e pivôs. */
  setFrame(f: RigFrame): void;
  /** Um adereço articulado (0..3): matriz 3 × 4 em linhas, ou null para devolvê-lo ao lugar. */
  setProp(i: number, rows: readonly number[] | null): void;
  update(goal: Goal, dt: number): void;
  snap(goal: Goal): void;
};

export function createRig(frame0: RigFrame): Rig {
  const bones = new Float32Array(BONES * 12);
  let frame = frame0;
  const A = armOf(IDLE);
  const B = armOf(IDLE);
  let lean: V3 = [0, 0, 0];
  let look: [number, number] = [0, 0];
  let moving = false;
  const hand = { a: { from: 0, to: 0, k: 0 }, b: { from: 0, to: 0, k: 0 } };
  const reach = { a: 1, b: 1 };
  const joints = { a: { wrist: A.wrist, elbow: A.elbow, touch: A.touch }, b: { wrist: B.wrist, elbow: B.elbow, touch: B.touch } };

  const put = (i: number, x: V3, y: V3, z: V3, t: V3) => {
    const o = i * 12;
    bones[o] = x[0]; bones[o + 1] = y[0]; bones[o + 2] = z[0]; bones[o + 3] = t[0];
    bones[o + 4] = x[1]; bones[o + 5] = y[1]; bones[o + 6] = z[1]; bones[o + 7] = t[1];
    bones[o + 8] = x[2]; bones[o + 9] = y[2]; bones[o + 10] = z[2]; bones[o + 11] = t[2];
  };
  const identity = (i: number) => put(i, [1, 0, 0], [0, 1, 0], [0, 0, 1], [0, 0, 0]);
  for (let i = 0; i < BONES; i++) identity(i);

  const solveArm = (S: ArmState, shoulder: V3, sign: number, base: number, scale: number, thick: number) => {
    const l1 = RIG.L1 * scale;
    const l2 = RIG.L2 * scale;
    let X = norm(S.fingers);
    if (S.align > 0) X = norm(mix3(X, norm(sub(S.at, shoulder)), S.align));
    const Y = ortho(S.back, X);
    const Z = mul(cross(X, Y), sign);
    // o punho sai do ponto de contato; se o alvo está fora do alcance, a mão fica onde o braço chega
    const off = add(add(mul(X, S.offset[0] * scale), mul(Y, S.offset[1] * scale)), mul(Z, S.offset[2] * scale));
    let W = sub(S.at, off);
    const d = sub(W, shoulder);
    const dist = len(d);
    const max = (l1 + l2) * 0.995;
    const min = Math.abs(l1 - l2) + 0.08;
    const dir = norm(d);
    const far = Math.max(min, Math.min(max, dist));
    S.reach = dist > max ? max / dist : 1;
    W = add(shoulder, mul(dir, far));
    const a = (l1 * l1 - l2 * l2 + far * far) / (2 * far);
    const h = Math.sqrt(Math.max(l1 * l1 - a * a, 0));
    const E = add(add(shoulder, mul(dir, a)), mul(ortho(S.pole, dir), h));
    S.elbow[0] = E[0]; S.elbow[1] = E[1]; S.elbow[2] = E[2];
    S.wrist[0] = W[0]; S.wrist[1] = W[1]; S.wrist[2] = W[2];
    S.touch[0] = W[0] + off[0]; S.touch[1] = W[1] + off[1]; S.touch[2] = W[2] + off[2];
    // antebraço: segue o giro da mão (sem torcer a pele no punho); braço: segue o antebraço
    const fx = norm(sub(W, E));
    const fy = ortho(Y, fx);
    const fz = mul(cross(fx, fy), sign);
    const ux = norm(sub(E, shoulder));
    const uy = ortho(fy, ux);
    const uz = mul(cross(ux, uy), sign);
    const k = scale * thick;
    put(base, mul(ux, scale), mul(uy, k), mul(uz, k), shoulder);
    put(base + 1, mul(fx, scale), mul(fy, k), mul(fz, k), sub(E, mul(fx, l1)));
    put(base + 2, mul(X, scale), mul(Y, scale), mul(Z, scale), sub(W, mul(X, l1 + l2)));
  };

  const pair = (S: ArmState, out: { from: number; to: number; k: number }) => {
    let i = 0;
    for (let k = 1; k < S.w.length; k++) if (S.w[k] > S.w[i]) i = k;
    let j = i === 0 ? 1 : 0;
    for (let k = 0; k < S.w.length; k++) if (k !== i && S.w[k] > S.w[j]) j = k;
    // a forma mais presente é a base; a mistura nunca passa da metade (quando passa, as duas trocam de papel)
    out.from = i;
    out.to = j;
    out.k = S.w[j] / Math.max(1e-4, S.w[i] + S.w[j]);
  };

  const solve = () => {
    // o peito gira em volta da cintura; a cabeça, em volta do alto do pescoço (que o peito leva junto)
    const C = euler(lean[0], lean[1], lean[2]);
    const waist = frame.waist;
    const ct = sub(waist, apply(C, waist));
    put(1, C[0], C[1], C[2], ct);
    const onChest = (p: V3): V3 => add(apply(C, p), ct);
    const H0 = euler(look[0], look[1], 0);
    const H: [V3, V3, V3] = [apply(C, H0[0]), apply(C, H0[1]), apply(C, H0[2])];
    const neck = onChest(frame.neck);
    put(2, H[0], H[1], H[2], sub(neck, apply(H, frame.neck)));
    if (frame.shoulderA) solveArm(A, onChest(frame.shoulderA), -1, 3, frame.scaleA, frame.thickA);
    if (frame.shoulderB) solveArm(B, onChest(frame.shoulderB), 1, 6, frame.scaleB, frame.thickB);
    pair(A, hand.a);
    pair(B, hand.b);
    reach.a = A.reach;
    reach.b = B.reach;
  };

  const chase = (S: ArmState, g: ArmGoal, dt: number) => {
    const k = 1 - Math.exp(-dt * (g.rate ?? 9));
    const ko = 1 - Math.exp(-dt * Math.min(g.rate ?? 9, 14));
    const before = S.at[0] + S.at[1] + S.at[2];
    S.at = mix3(S.at, g.at, k);
    S.offset = mix3(S.offset, v3(RIG.contact[g.contact]), ko);
    S.fingers = norm(mix3(S.fingers, norm(g.fingers), ko));
    S.back = norm(mix3(S.back, norm(g.back), ko));
    S.pole = norm(mix3(S.pole, norm(g.pole), 1 - Math.exp(-dt * 6)));
    S.align += ((g.align ?? 0) - S.align) * ko;
    let still = Math.abs(S.at[0] + S.at[1] + S.at[2] - before) < 2e-4 && len(sub(S.at, g.at)) < 2e-3;
    const ks = 1 - Math.exp(-dt * 10);
    for (let i = 0; i < S.w.length; i++) {
      const want = SHAPES[i] === g.shape ? 1 : 0;
      if (Math.abs(S.w[i] - want) > 0.004) still = false;
      S.w[i] += (want - S.w[i]) * ks;
    }
    if (len(sub(S.fingers, norm(g.fingers))) > 0.004 || len(sub(S.back, norm(g.back))) > 0.004) still = false;
    return still;
  };
  const place = (S: ArmState, g: ArmGoal) => {
    S.at = [...g.at];
    S.offset = v3(RIG.contact[g.contact]);
    S.fingers = norm(g.fingers);
    S.back = norm(g.back);
    S.pole = norm(g.pole);
    S.align = g.align ?? 0;
    S.w = SHAPES.map((s) => (s === g.shape ? 1 : 0));
  };

  const api: Rig = {
    bones,
    hand,
    reach,
    joints,
    get moving() {
      return moving;
    },
    setFrame(f) {
      frame = f;
      solve();
    },
    setProp(i, rows) {
      if (!rows) return identity(PROP_BONE + i);
      bones.set(rows, (PROP_BONE + i) * 12);
    },
    update(goal, dt) {
      const a = goal.a ? chase(A, goal.a, dt) : true;
      const b = goal.b ? chase(B, goal.b, dt) : true;
      const kl = 1 - Math.exp(-dt * 5);
      const dl = len(sub(lean, goal.lean)) + Math.abs(look[0] - goal.look[0]) + Math.abs(look[1] - goal.look[1]);
      lean = mix3(lean, goal.lean, kl);
      look = [look[0] + (goal.look[0] - look[0]) * kl, look[1] + (goal.look[1] - look[1]) * kl];
      moving = !(a && b) || dl > 2e-3;
      solve();
    },
    snap(goal) {
      if (goal.a) place(A, goal.a);
      if (goal.b) place(B, goal.b);
      lean = [...goal.lean];
      look = [...goal.look];
      moving = false;
      solve();
    },
  };
  solve();
  return api;
}
