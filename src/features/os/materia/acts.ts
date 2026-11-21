import type { ArmGoal, Goal, V3 } from "./rig";
import { SCULPT } from "./sculpt-data";
import type { SculptId } from "./sculpt";

/**
 * Os seis gestos. Cada destino tem a sua figura, o seu adereço e a sua ABERTURA — o contorno por onde a página
 * de verdade aparece (materia-scene.tsx recorta a janela com ele):
 *
 *   projects  a Curadora   uma mão encontra a borda do chão, a outra a ergue pela ponta oposta: a pele mineral
 *                          da página sobe como tecido e a coleção aparece por baixo
 *   profile   o Arquivista segura a lombada do fólio e desliza a folha na direção de quem visita
 *   services  a Arquiteta  abre o compasso sobre o pedestal: as pontas delimitam as colunas
 *   studio    o Gravador   gira o braço da prensa e puxa a folha recém-impressa
 *   lab       a Inventora  faz girar o giroscópio com a ponta do dedo: o aro enquadra o experimento
 *   contact   a Mensageira rompe o lacre com o polegar e o envelope se desdobra no briefing
 *
 * Um gesto tem três tempos: ALCANÇAR (`r`: as mãos chegam ao contato), PUXAR (`p`: a superfície resiste e cede;
 * a abertura cresce presa às mãos) e SOLTAR (`q`: as mãos largam e a abertura segue sozinha até as coordenadas
 * reais da janela — isso o motor faz, em px). Tudo aqui é em unidades da figura (sculpt-data.ts).
 */
export type ActId = "projects" | "profile" | "services" | "studio" | "lab" | "contact";
export const ACT_IDS: ActId[] = ["projects", "profile", "services", "studio", "lab", "contact"];
/** Segundos de cada tempo: alcançar, puxar, soltar. O gesto principal (alcançar + puxar) dura ~0,85 s. */
export const ACT_TIME = { reach: 0.3, pull: 0.55, release: 0.34 } as const;
export type Quad = [V3, V3, V3, V3];
export type ActFrame = {
  goal: Goal;
  /** A abertura: um quadrilátero (alto-esquerda, alto-direita, baixo-direita, baixo-esquerda) ou um círculo. */
  quad: Quad | null;
  circle: { c: V3; r: number } | null;
  /** A borda de cima cede entre as mãos (unidades, para baixo); a altura da pedra erguida; o bico da aba (para cima). */
  sag: number;
  flap: number;
  vee: number;
  /** Adereços articulados (ossos 9…): matriz 3 × 4 em linhas, ou null. */
  props: (number[] | null)[];
  /** O material da borda: 0 a pele mineral da página, 1 papel, 2 mármore. */
  stone: 0 | 1 | 2;
  /** Que ponto da janela aparece primeiro pela abertura (fração da largura e da altura). */
  focal: [number, number];
};

const ease = (x: number) => {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
};
const add = (a: readonly number[], b: readonly number[], k = 1): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const mix = (a: readonly number[], b: readonly number[], k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const v = (a: readonly number[]): V3 => [a[0], a[1], a[2]];
const arm = (at: V3, contact: ArmGoal["contact"], fingers: V3, back: V3, pole: V3, shape: ArmGoal["shape"], rate = 12, align = 0.45): ArmGoal => ({ at, contact, fingers, back, pole, shape, rate, align });
const fromPose = (g: { at: readonly number[]; contact: string; fingers: readonly number[]; back: readonly number[]; pole: readonly number[]; shape: string; align: number }, rate = 8): ArmGoal => ({ at: v(g.at), contact: g.contact as ArmGoal["contact"], fingers: v(g.fingers), back: v(g.back), pole: v(g.pole), shape: g.shape as ArmGoal["shape"], rate, align: g.align });

/** Giro de `ang` (rad) em volta do eixo unitário `ax` que passa por `c`, mais um deslocamento: matriz 3 × 4 em linhas. */
function turn(ax: readonly number[], ang: number, c: readonly number[], move: readonly number[] = [0, 0, 0]): number[] {
  const [x, y, z] = ax;
  const co = Math.cos(ang), si = Math.sin(ang), t = 1 - co;
  const m = [t * x * x + co, t * x * y - si * z, t * x * z + si * y, t * x * y + si * z, t * y * y + co, t * y * z - si * x, t * x * z - si * y, t * y * z + si * x, t * z * z + co];
  const tx = c[0] - (m[0] * c[0] + m[1] * c[1] + m[2] * c[2]) + move[0];
  const ty = c[1] - (m[3] * c[0] + m[4] * c[1] + m[5] * c[2]) + move[1];
  const tz = c[2] - (m[6] * c[0] + m[7] * c[1] + m[8] * c[2]) + move[2];
  return [m[0], m[1], m[2], tx, m[3], m[4], m[5], ty, m[6], m[7], m[8], tz];
}
const applyRows = (m: number[], p: readonly number[]): V3 => [m[0] * p[0] + m[1] * p[1] + m[2] * p[2] + m[3], m[4] * p[0] + m[5] * p[1] + m[6] * p[2] + m[7], m[8] * p[0] + m[9] * p[1] + m[10] * p[2] + m[11]];

/** A figura parada (antes e depois do gesto, e a Matéria em repouso): respira, e as mãos ficam perto do trabalho. */
export function idle(id: SculptId, time: number): Goal {
  const breath = Math.sin(time * 0.7);
  if (id === "rest") {
    const g = fromPose(SCULPT.rest.poses.R.rest, 4);
    g.at = add(g.at, [0.01, 0.035 * breath, 0]);
    return { a: g, b: null, lean: [0, 0.006 * breath, 0], look: [0.03 * Math.sin(time * 0.31), 0.02 * breath] };
  }
  const f = actAt(id as ActId, 0, 0, 0, time);
  return f.goal;
}

/** O quadro do gesto: `r`, `p`, `q` de 0 a 1 (alcançar, puxar, soltar). */
export function actAt(id: ActId, r: number, p: number, q: number, time: number): ActFrame {
  const er = ease(r);
  const ep = ease(p);
  const eq = ease(q);
  const breath = Math.sin(time * 0.7) * (1 - er);
  const out: ActFrame = { goal: { a: null, b: null, lean: [0, 0, 0], look: [0, 0] }, quad: null, circle: null, sag: 0, flap: 0, vee: 0, props: [null, null, null, null], stone: 0, focal: [0.5, 0.5] };
  const held = er * (1 - eq);

  if (id === "projects") {
    const [A0, B0] = SCULPT.projects.marks.edge;
    const floor = 0.06;
    // a mão esquerda dela (à direita de quem vê) ergue a ponta em diagonal; a direita segura a borda e só depois sobe
    const lift = add(B0, [0.3, 2.45, -0.25], ep);
    const hold = add(A0, [-0.18, 0.95, -0.05], ease((p - 0.42) / 0.58));
    const up = 0.55 * (1 - er);
    const away = eq * 0.6;
    out.goal.a = arm(add(hold, [-0.25 * away, up + 0.35 * away, -0.5 * away]), "pinch", [-0.15, -0.85, 0.5], [-0.5, 0.35, 0.8], [-0.9, 0.3, -0.5], held > 0.5 ? "pinch" : eq > 0.3 ? "relax" : "open", r < 1 ? 17 : 40);
    out.goal.b = arm(add(lift, [0.25 * away, up + 0.3 * away, -0.5 * away]), "pinch", [0.2, -0.82, 0.5], [0.5, 0.35, 0.8], [0.9, 0.35, -0.5], held > 0.5 ? "pinch" : eq > 0.3 ? "relax" : "open", r < 1 ? 17 : 40);
    out.goal.lean = [0.05 * ep, -0.12 * ep * (1 - 0.5 * eq) + 0.008 * breath, -0.03 * ep];
    out.goal.look = [0.22 * held, 0.12 * held];
    out.quad = [hold, lift, [B0[0] + 0.2, floor, B0[2]], [A0[0] - 0.2, floor, A0[2]]];
    out.sag = (0.34 - 0.14 * ep) * (1 - eq);
    out.flap = (0.35 + 0.75 * ep) * (1 - eq);
    out.focal = [0.5, 0.5];
    return out;
  }

  if (id === "profile") {
    const M = SCULPT.profile.marks;
    const S = M.sheet;
    // a mão direita dele segura a lombada; a esquerda pinça o canto da folha e a traz para quem visita. Na tela a face
    // do fólio se vê de viés: a borda presa é a da frente (à esquerda de quem vê) e a que desliza sai pela direita
    const pull = [2.3 * ep, -0.5 * ep, 1.35 * ep] as const;
    const corner = add(S[0], pull);
    const idleB = v(SCULPT.profile.poses.L.contact.at);
    out.goal.a = fromPose(SCULPT.profile.poses.R.contact, 9);
    out.goal.b = arm(add(mix(idleB, corner, er), [0.3 * eq, 0.25 * eq, -0.3 * eq]), "pinch", [0.45, -0.6, 0.6], [0.45, 0.76, 0.46], [0.95, -0.1, -0.3], held > 0.5 ? "pinch" : "relax", r < 1 ? 17 : 40);
    out.goal.lean = [0.04 * ep, 0.05 * ep + 0.006 * breath, 0];
    out.goal.look = [0.16 * held, 0.1 * held];
    out.quad = [v(S[1]), corner, add(S[3], [pull[0] * 0.94, pull[1] - 0.55 * ep, pull[2]]), add(S[2], [0, -0.5 * ep, 0.1 * ep])];
    out.sag = -0.08 * ep * (1 - eq);
    out.stone = 1;
    out.focal = [0.32, 0.26];
    return out;
  }

  if (id === "services") {
    const M = SCULPT.services.marks;
    const H0 = M.hinge;
    const L = H0[1] - M.top[1];
    const half0 = Math.asin((M.tips[1][0] - M.tips[0][0]) / 2 / Math.hypot(L, (M.tips[1][0] - M.tips[0][0]) / 2));
    // o compasso abre: as pontas correm pelo pedestal e a articulação desce com a mão que a segura
    const half = half0 + (0.62 - half0) * ep;
    const len = Math.hypot(L, (M.tips[1][0] - M.tips[0][0]) / 2);
    const drop = len * Math.cos(half) - L;
    const H = add(H0, [0, drop, 0]);
    const spread = len * Math.sin(half);
    const tA: V3 = [H0[0] - spread, M.top[1], H0[2]];
    const tB: V3 = [H0[0] + spread, M.top[1], H0[2]];
    out.props[0] = turn([0, 0, 1], -(half - half0), H0, [0, drop, 0]);
    out.props[1] = turn([0, 0, 1], half - half0, H0, [0, drop, 0]);
    out.props[2] = turn([0, 0, 1], 0, H0, [0, drop, 0]);
    out.goal.a = arm(add(H, [0.02, 0.3 + 0.25 * (1 - er) + 0.4 * eq, 0.1]), "pinch", [-0.75, -0.6, 0.25], [-0.45, 0.75, 0.48], [0.2, -0.5, 0.9], held > 0.5 ? "pinch" : "open", r < 1 ? 17 : 40);
    const on = mix(H, tB, 0.4);
    out.goal.b = arm(add(on, [0.1 * (1 - er) + 0.35 * eq, 0.1 * (1 - er) + 0.2 * eq, 0.08 + 0.3 * (1 - er)]), "pinch", [-0.8, -0.45, -0.1], [-0.2, 0.6, 0.78], [0.3, -0.8, 0.5], held > 0.5 ? "pinch" : "open", r < 1 ? 17 : 40);
    out.goal.lean = [0, 0.05 * ep + 0.006 * breath, 0];
    out.goal.look = [0, 0.14 * held];
    const rise = 0.12 + 3.1 * ep;
    out.quad = [add(tA, [0, rise, 0]), add(tB, [0, rise, 0]), tB, tA];
    out.stone = 2;
    out.focal = [0.5, 0.42];
    return out;
  }

  if (id === "studio") {
    const M = SCULPT.studio.marks;
    // o braço da prensa gira em volta do fuso; a outra mão puxa a folha para fora, para a frente
    const ang = -0.28 * er + 1.75 * ep;
    const spin = turn([0, 1, 0], ang, M.handle);
    out.props[0] = spin;
    const grip = applyRows(spin, M.ends[0]);
    out.goal.a = arm(add(grip, [0, 0.02 + 0.35 * (1 - er) + 0.3 * eq, 0.02]), "palm", [0.55, -0.35, 0.75], [-0.3, 0.9, 0.3], [-0.9, -0.2, -0.3], held > 0.4 ? "pinch" : "relax", r < 1 ? 17 : 40);
    // a folha sai pela frente do prato e sobe com a mão que a segura pelo canto
    const d = [0.55 * ep, 0.8 * ep, 0.45 * ep] as const;
    const corner = add(M.slot[1], d);
    const idleB = v(SCULPT.studio.poses.L.contact.at);
    out.goal.b = arm(add(mix(idleB, corner, er), [0.3 * eq, 0.2 * eq, -0.2 * eq]), "pinch", [0.6, -0.5, 0.6], [0.3, 0.86, 0.4], [0.6, -0.4, -0.7], held > 0.5 ? "pinch" : "relax", r < 1 ? 17 : 40);
    out.goal.lean = [0.03 * ep, -0.05 * ep + 0.006 * breath, 0];
    out.goal.look = [0.14 * held, 0.1 * held];
    out.quad = [add(M.slot[0], [d[0] * 0.8, d[1] * 0.92, d[2]]), corner, v(M.slot[2]), v(M.slot[3])];
    out.sag = -0.06 * ep * (1 - eq);
    out.stone = 1;
    out.focal = [0.5, 0.3];
    return out;
  }

  if (id === "lab") {
    const M = SCULPT.lab.marks;
    // o indicador toca o aro e dá o impulso; o rotor gira no eixo inclinado
    const flick = Math.sin(Math.PI * Math.min(1, p * 1.6));
    const touch = add(M.touch, [0.06 * flick, -0.42 * ep, 0.04]);
    out.goal.b = arm(add(touch, [0.5 * (1 - er) + 0.5 * eq, 0.25 * (1 - er) + 0.2 * eq, 0.1]), "tips", [-0.9, 0.3 - 0.5 * ep, 0.1], [0.1, 0.5, 0.86], [0.2, -1, 0.3], "open", r < 1 ? 17 : 30);
    out.goal.a = fromPose(SCULPT.lab.poses.R.contact, 8);
    out.props[0] = turn(M.axis, time * 0.9 + 14 * ep * ep + 9 * eq, M.ring);
    out.goal.lean = [0, -0.04 * ep + 0.008 * breath, 0];
    out.goal.look = [-0.12 * held, -0.06 * held];
    out.circle = { c: v(M.ring), r: M.radius[0] * (0.2 + 0.74 * er) };
    out.stone = 2;
    out.focal = [0.5, 0.45];
    return out;
  }

  // contact
  const M = SCULPT.contact.marks;
  const E = M.env;
  const top = mix(E[0], E[1], 0.5);
  const upv: V3 = [E[0][0] - E[3][0], E[0][1] - E[3][1], E[0][2] - E[3][2]];
  const axis = (() => {
    const d = [E[1][0] - E[0][0], E[1][1] - E[0][1], E[1][2] - E[0][2]];
    const l = Math.hypot(d[0], d[1], d[2]);
    return [d[0] / l, d[1] / l, d[2] / l];
  })();
  // o polegar rompe o lacre; a aba gira para cima e o envelope se desdobra
  const open = ease((p - 0.18) / 0.82);
  out.props[0] = turn(axis, -2.5 * open, top);
  out.goal.a = fromPose(SCULPT.contact.poses.R.contact, 10);
  const seal = add(M.seal, [0, 0.0, 0.06]);
  out.goal.b = arm(add(mix(add(seal, [0.5, 0.3, 0.4]), seal, er), [0.35 * open + 0.3 * eq, 0.75 * open + 0.2 * eq, 0.25 * open]), "pinch", [-0.8, 0.1, 0.59], [0.2, 0.9, 0.38], [0.6, -0.7, 0.3], held > 0.4 && open < 0.5 ? "pinch" : "open", r < 1 ? 17 : 30);
  out.goal.lean = [0, -0.03 * ep + 0.006 * breath, 0];
  out.goal.look = [-0.1 * held, 0.08 * held];
  const grow = 1 + 0.35 * open;
  const c = mix(mix(E[0], E[2], 0.5), [0, 0, 0], 0);
  const g = (pt: readonly number[]): V3 => [c[0] + (pt[0] - c[0]) * grow, c[1] + (pt[1] - c[1]) * grow, c[2] + (pt[2] - c[2]) * grow];
  out.quad = [g(E[0]), g(E[1]), g(E[2]), g(E[3])];
  out.vee = (-0.55 + 1.3 * open) * Math.hypot(upv[0], upv[1], upv[2]) * 0.55 * (1 - eq);
  out.stone = 1;
  out.focal = [0.5, 0.34];
  return out;
}
