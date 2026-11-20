import { RIG } from "./rig-data";

/**
 * O esqueleto da figura: tronco, cabeça e dois braços (ombro → cotovelo → punho → mão).
 *
 * Quem manda é a AÇÃO: cada braço recebe um ponto de contato na cena (a ponta da dobra, uma quina da janela
 * que está abrindo, a base de uma ficha), a orientação da mão e a forma dos dedos. O punho sai do ponto de
 * contato, o cotovelo sai de uma cinemática inversa de dois ossos, e a pele se reparte entre os ossos no
 * shader (hero-shaders.ts › FIGURE_VERT). Os valores correm até o alvo com o tempo — por isso a figura
 * sempre parte da pose em que está, mesmo quando o visitante muda de ideia no meio do gesto.
 *
 * Unidades da cena: a ponta da dobra em repouso é a origem, x para a direita, y para cima, z para quem olha.
 * O braço A (o que segura a ponta) usa a malha espelhada; o B, a malha como ela é.
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
  /** Quão depressa a mão chega (1/s). Alto = presa ao alvo (a ponta que o visitante arrasta, a quina que estica). */
  rate?: number;
};
export type Goal = { a: ArmGoal; b: ArmGoal; /** O tronco se inclina (deslocamento). */ lean: V3; /** A cabeça gira: (para os lados, para baixo), rad. */ look: [number, number] };

const SHAPES = RIG.shapes;
const BONES = 8;
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

type ArmState = { at: V3; offset: V3; fingers: V3; back: V3; pole: V3; w: number[]; elbow: V3; wrist: V3; touch: V3; reach: number };
const armOf = (g: ArmGoal): ArmState => ({ at: [...g.at], offset: v3(RIG.contact[g.contact]), fingers: norm(g.fingers), back: norm(g.back), pole: norm(g.pole), w: SHAPES.map((s) => (s === g.shape ? 1 : 0)), elbow: [0, 0, 0], wrist: [0, 0, 0], touch: [0, 0, 0], reach: 1 });

export type Rig = {
  /** 8 ossos × 3 linhas de uma matriz 3 × 4 (linha = xyz + translação), prontos para o shader. */
  readonly bones: Float32Array;
  /** Por braço: as duas formas da mão em uso (índices em RIG.shapes) e a mistura entre elas. */
  readonly hand: { a: { from: number; to: number; k: number }; b: { from: number; to: number; k: number } };
  /** Por braço: quanto o alvo está dentro do alcance (1 = alcança; menor = a mão ficou para trás). */
  readonly reach: { a: number; b: number };
  /** Onde ficaram o punho, o cotovelo e o ponto de contato de cada braço (para a cena, as medições e os testes). */
  readonly joints: { a: { wrist: V3; elbow: V3; touch: V3 }; b: { wrist: V3; elbow: V3; touch: V3 } };
  /** Algo ainda está se mexendo? */
  readonly moving: boolean;
  update(goal: Goal, dt: number): void;
  snap(goal: Goal): void;
};

export function createRig(first: Goal): Rig {
  const bones = new Float32Array(BONES * 12);
  const A = armOf(first.a);
  const B = armOf(first.b);
  let lean: V3 = [...first.lean];
  let look: [number, number] = [...first.look];
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

  const solveArm = (S: ArmState, shoulder: V3, sign: number, base: number) => {
    const X = norm(S.fingers);
    const Y = ortho(S.back, X);
    const Z = mul(cross(X, Y), sign);
    // o punho sai do ponto de contato; se o alvo está fora do alcance, a mão fica onde o braço chega
    const off = add(add(mul(X, S.offset[0]), mul(Y, S.offset[1])), mul(Z, S.offset[2]));
    let W = sub(S.at, off);
    const d = sub(W, shoulder);
    const dist = len(d);
    const max = (RIG.L1 + RIG.L2) * 0.995;
    const min = Math.abs(RIG.L1 - RIG.L2) + 0.08;
    const dir = norm(d);
    const far = Math.max(min, Math.min(max, dist));
    S.reach = dist > max ? max / dist : 1;
    W = add(shoulder, mul(dir, far));
    const a = (RIG.L1 * RIG.L1 - RIG.L2 * RIG.L2 + far * far) / (2 * far);
    const h = Math.sqrt(Math.max(RIG.L1 * RIG.L1 - a * a, 0));
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
    put(base, ux, uy, uz, shoulder);
    put(base + 1, fx, fy, fz, sub(E, mul(fx, RIG.L1)));
    put(base + 2, X, Y, Z, sub(W, mul(X, RIG.L1 + RIG.L2)));
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
    put(0, [1, 0, 0], [0, 1, 0], [0, 0, 1], lean);
    // a cabeça gira em volta do alto do pescoço
    const cy = Math.cos(look[0]), sy = Math.sin(look[0]), cx = Math.cos(look[1]), sx = Math.sin(look[1]);
    // giro em z (o rosto está de perfil: é o eixo que o faz olhar para baixo) depois em y
    const hx: V3 = [cy * cx, sx, -sy * cx];
    const hy: V3 = [-cy * sx, cx, sy * sx];
    const hz: V3 = [sy, 0, cy];
    const neck = v3(RIG.neck);
    const t = add(sub(neck, add(add(mul(hx, neck[0]), mul(hy, neck[1])), mul(hz, neck[2]))), lean);
    put(1, hx, hy, hz, t);
    solveArm(A, add(v3(RIG.shoulderA), lean), -1, 2);
    solveArm(B, add(v3(RIG.shoulderB), lean), 1, 5);
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

  const api: Rig = {
    bones,
    hand,
    reach,
    joints,
    get moving() {
      return moving;
    },
    update(goal, dt) {
      const a = chase(A, goal.a, dt);
      const b = chase(B, goal.b, dt);
      const kl = 1 - Math.exp(-dt * 5);
      const dl = len(sub(lean, goal.lean)) + Math.abs(look[0] - goal.look[0]) + Math.abs(look[1] - goal.look[1]);
      lean = mix3(lean, goal.lean, kl);
      look = [look[0] + (goal.look[0] - look[0]) * kl, look[1] + (goal.look[1] - look[1]) * kl];
      moving = !(a && b) || dl > 2e-3;
      solve();
    },
    snap(goal) {
      for (const [S, g] of [[A, goal.a], [B, goal.b]] as const) {
        S.at = [...g.at];
        S.offset = v3(RIG.contact[g.contact]);
        S.fingers = norm(g.fingers);
        S.back = norm(g.back);
        S.pole = norm(g.pole);
        S.w = SHAPES.map((s) => (s === g.shape ? 1 : 0));
      }
      lean = [...goal.lean];
      look = [...goal.look];
      moving = false;
      solve();
    },
  };
  solve();
  return api;
}
