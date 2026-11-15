import { MathUtils, type PerspectiveCamera, Quaternion, Vector3 } from "three";
import type { ClipName, Entity } from "./entity";
import { applyLean, applyLook, solveArm, type ArmGoal, type Side } from "./rig";
import { INTRO, REACH } from "./scene.config";

/**
 * A coreografia da entidade: o que ela faz com cada evento da navegação.
 *
 *   intro       apresentação, uma vez ao entrar em cena: surge, dá um giro e faz uma reverência
 *   idle        flutua; a cabeça acompanha o ponteiro de longe
 *   attention   um app foi destacado (hover/foco): olha, inclina, aproxima o corpo e leva a mão
 *               até perto do ícone
 *   reaching    um app foi ativado: a ponta do indicador vai ao ponto de contato do ícone
 *   touching    encostou: pressiona, solta a luz do contato, recua um pouco
 *   presenting  há janela aberta: recolhida ao lado, apresentando
 *   returning   volta para o repouso
 *
 * O personagem OBSERVA a navegação — nunca a comanda: os handlers dos aplicativos são os de
 * sempre e abrem na hora; aqui só chega "destacou X" e "ativou X". Por isso uma sequência
 * A → B → C termina em C sem fila: cada evento só troca o alvo, e tudo o que tem duração é
 * contado no próprio laço (nenhum timer solto que possa disparar depois).
 *
 * Ordem de um quadro (explícita, para o IK nunca ser sobrescrito pelos clipes):
 *   1. estados e pesos → mixer.update (clipes: tronco, pernas, dedos, braço de contrapeso)
 *   2. corpo: posição/giro do pivô, inclinação e olhar somados à pose do mixer
 *   3. matrizes de mundo
 *   4. IK dos braços (ombro, cotovelo, pulso) sobre a pose do mixer, com a ponta do dedo medida
 *      DEPOIS do gesto dos dedos deste quadro
 *   5. matrizes dos braços, fragmentos, luzes do contato, medição do erro
 */
export type Phase = "intro" | "idle" | "attention" | "reaching" | "touching" | "presenting" | "returning";

export type Layout = {
  /** Área do fundo (px CSS). */
  w: number;
  h: number;
  /** px por unidade do modelo. */
  k: number;
  /** Quadril em repouso (px CSS do canvas). */
  home: { x: number; y: number };
  /** Posição recolhida com janela aberta (null: a janela cobre tudo, como no telefone). */
  present: { x: number; y: number; z: number } | null;
  bounds: { x0: number; x1: number; y0: number; y1: number };
};

export type Point = { x: number; y: number };
/**
 * Placa do ícone de um app, em px CSS do canvas (y do topo). `blocked`: há outro app na mesma fileira
 * entre este e o personagem — a mão chega pelo vão acima da fileira, sem passar por trás do vizinho.
 */
export type Rect = { left: number; top: number; right: number; bottom: number; blocked?: boolean };

export type DirectorDebug = {
  phase: Phase;
  target: string | null;
  side: Side;
  /** Peso do IK do braço ativo (0..1) e quanto faltou de alcance (unidades). */
  ik: number;
  short: number;
  /** Ponta do indicador projetada, ponto de contato e a distância entre os dois (px CSS). */
  tip: Point | null;
  goal: Point | null;
  err: number | null;
  /** Quadro em que o mixer e o IK rodaram (o IK sempre depois, no mesmo quadro). */
  seq: { frame: number; mixer: number; ik: number };
  /** Toques concluídos desde o início (testes). */
  touches: number;
  body: Point;
  /**
   * Saúde das articulações dos braços (testes): maior passo angular num quadro (graus), saltos
   * (passo > 50° a mais de 1800°/s — uma inversão de cotovelo ou torção apareceria aqui) e a faixa de
   * flexão do cotovelo do braço ativo (graus; 0 = estendido).
   */
  joints: { maxStep: number; jumps: number; elbowMin: number; elbowMax: number };
};

export type Director = {
  readonly debug: DirectorDebug;
  /** Há movimento em curso que pede 60 qps? */
  readonly busy: boolean;
  /** Contato em px CSS (y do topo), progresso 0..1 e força — para a onda do fundo. */
  readonly pulse: { x: number; y: number; p: number; k: number };
  setLayout(l: Layout): void;
  /** App destacado (hover/foco) ou null. */
  attend(id: string | null): void;
  /** App ativado (clique, toque, Enter). */
  activate(id: string): void;
  /** Há janela aberta à vista (desktop/tablet)? */
  setPresenting(on: boolean): void;
  /** Olhar em repouso: ponteiro em −1..1 ou null. */
  pointer(p: Point | null): void;
  /** Apresentação (surgir, giro, reverência). Só começa a partir do repouso; qualquer interação a interrompe. */
  intro(): void;
  /** Larga o alvo sem concluir o gesto (a tela foi coberta, a aba ficou oculta): nada fica pendente. */
  release(): void;
  resetJoints(): void;
  /** Coloca tudo na pose de repouso, sem transição (primeiro quadro, imagens estáticas). */
  snap(): void;
  update(dt: number, t: number, camera: PerspectiveCamera): void;
};

/** G/V: ponta do dedo (posição e velocidade); L/LV: o alvo amaciado que ela persegue (primeira mola da série). */
type ArmState = { w: number; G: Vector3; V: Vector3; L: Vector3; LV: Vector3; goal: ArmGoal; live: boolean; short: number; rel: Vector3; held: boolean };

const v1 = new Vector3();
const v2 = new Vector3();
const v3 = new Vector3();
const v4 = new Vector3();
const v5 = new Vector3();
const vt = new Vector3();
const q1 = new Quaternion();
const AXIS = new Vector3();

/** Mola criticamente amortecida, integração implícita (estável com qualquer passo). */
function spring(x: number, v: number, goal: number, omega: number, dt: number): [number, number] {
  const f = 1 + 2 * dt * omega;
  const hoo = dt * omega * omega;
  const hhoo = dt * hoo;
  const inv = 1 / (f + hhoo);
  return [(f * x + dt * v + hhoo * goal) * inv, (v + hoo * (goal - x)) * inv];
}

function springV(x: Vector3, v: Vector3, goal: Vector3, omega: number, dt: number) {
  let r = spring(x.x, v.x, goal.x, omega, dt);
  x.x = r[0];
  v.x = r[1];
  r = spring(x.y, v.y, goal.y, omega, dt);
  x.y = r[0];
  v.y = r[1];
  r = spring(x.z, v.z, goal.z, omega, dt);
  x.z = r[0];
  v.z = r[1];
}

export function createDirector(entity: Entity, resolve: (id: string) => Rect | null, onTouch: (id: string) => void): Director {
  const rig = entity.rig;
  let layout: Layout = { w: 1, h: 1, k: 300, home: { x: 0.5, y: 0.5 }, present: null, bounds: { x0: 0, x1: 1, y0: 0, y1: 1 } };
  let cam: PerspectiveCamera | null = null;

  let phase: Phase = "idle";
  let phaseT = 0;
  let target: string | null = null;
  let hover: string | null = null;
  let hoverLost = 0;
  let presenting = false;
  let side: Side = "R";
  let frame = 0;
  let touches = 0;
  let ptr: Point | null = null;
  let snapNext = true;

  const pos = new Vector3();
  const vel = new Vector3();
  /** O alvo do corpo amaciado: a primeira das duas molas em série. */
  const lead = new Vector3();
  const leadV = new Vector3();
  /** Quanto o pivô andou neste quadro: a mão é simulada acompanhando o corpo, não parada no mundo. */
  const carry = new Vector3();
  const prevPivot = new Vector3();
  const posGoal = new Vector3();
  const contact = new Vector3();
  let hasContact = false;
  const contactPx: Point = { x: 0, y: 0 };
  /** O alvo fica abaixo do corpo (grade do telefone, dock): a mão chega por cima; senão, pelo lado. */
  let above = false;
  /** Pelo lado, com um app vizinho no caminho: a mão chega rente à borda de cima da placa. */
  let over = false;
  let roll = 0;
  let rollV = 0;
  let yawBody = 0;
  let yawBodyV = 0;
  let lookYaw = 0;
  let lookYawV = 0;
  let lookPitch = 0;
  let lookPitchV = 0;
  let crouch = 0;
  /** Apresentação: giro acumulado (rad), escala e subida do corpo, e se a reverência já disparou. */
  let spinNow = 0;
  let spinV = 0;
  let introScale = 1;
  let introRise = 0;
  let bowed = false;
  /** 0 = a mão espera o corpo (braço dobrado) · 1 = o braço pode estender até o fim. */
  let armFree = 0;
  const pulse = { x: 0, y: 0, p: 1, k: 0 };
  let flash = 0;

  const mkArm = (): ArmState => ({ w: 0, G: new Vector3(), V: new Vector3(), L: new Vector3(), LV: new Vector3(), goal: { tip: new Vector3(), finger: new Vector3(-1, 0, 0), back: new Vector3(0, 0.75, 0.66), pole: new Vector3(0, -1, -0.35) }, live: false, short: 0, rel: new Vector3(), held: false });
  const arms: Record<Side, ArmState> = { R: mkArm(), L: mkArm() };

  const debug: DirectorDebug = { phase, target, side, ik: 0, short: 0, tip: null, goal: null, err: null, seq: { frame: 0, mixer: 0, ik: 0 }, touches: 0, body: { x: 0, y: 0 }, joints: { maxStep: 0, jumps: 0, elbowMin: 180, elbowMax: 0 } };
  const jointBones = [rig.arms.R.upper, rig.arms.R.fore, rig.arms.R.hand, rig.arms.L.upper, rig.arms.L.fore, rig.arms.L.hand];
  const jointPrev = jointBones.map((b) => b.quaternion.clone());
  let jointsLive = false;

  // ---- tela ↔ mundo -------------------------------------------------------------------------
  /** Ponto do canvas (px CSS, y do topo) → mundo, no plano z. */
  const toWorld = (px: number, py: number, z: number, out: Vector3) => {
    const c = cam!;
    vt.set((px / layout.w) * 2 - 1, 1 - (py / layout.h) * 2, 0.5).unproject(c).sub(c.position);
    const s = (z - c.position.z) / vt.z;
    return out.copy(c.position).addScaledVector(vt, s);
  };
  const toPx = (w: Vector3, out: Point) => {
    vt.copy(w).project(cam!);
    out.x = (vt.x * 0.5 + 0.5) * layout.w;
    out.y = (0.5 - vt.y * 0.5) * layout.h;
    return out;
  };

  const enter = (p: Phase) => {
    if (p === phase) return;
    phase = p;
    phaseT = 0;
  };
  const rest = () => (presenting && layout.present ? "presenting" : "returning") as Phase;

  /**
   * Ponto de contato na borda da placa do ícone — nunca sobre o rótulo, que fica embaixo:
   * pelo lado, a borda voltada para o corpo, um pouco acima do meio; por cima, o meio da borda superior.
   */
  const aim = (r: Rect, out: Point) => {
    const cx = (r.left + r.right) / 2;
    const cy = (r.top + r.bottom) / 2;
    above = cy - layout.home.y > 0.95 * layout.k;
    over = !above && !!r.blocked;
    if (above) {
      out.x = cx;
      out.y = r.top - 1;
    } else if (over) {
      out.x = cx + (cx < layout.home.x ? 0.2 : -0.2) * (r.right - r.left);
      out.y = r.top - 1;
    } else {
      out.x = cx < layout.home.x ? r.right + 1 : r.left - 1;
      out.y = r.top + 0.42 * (r.bottom - r.top);
    }
    return out;
  };

  /** Escolhe a mão do lado do alvo (com folga, para não ficar trocando de mão ao passar pelo meio). */
  const pickSide = (id: string) => {
    const r = resolve(id);
    if (!r || !cam) return;
    const p = aim(r, contactPx);
    if (above) {
      toWorld(p.x, p.y, REACH.planeZ, v1);
      const dx = v1.x - pos.x;
      if (Math.abs(dx) > 0.06) side = dx < 0 ? "R" : "L";
    } else side = p.x < layout.home.x ? "R" : "L"; // pelo lado: a mão do lado em que o alvo está
  };

  const api: Director = {
    debug,
    get busy() {
      return phase !== "idle" && !(phase === "presenting" && phaseT > 1.2);
    },
    pulse,
    setLayout(l) {
      layout = l;
    },
    attend(id) {
      hover = id;
      if (!id) return;
      hoverLost = 0;
      if (phase === "reaching" || phase === "touching") return; // um toque em curso termina antes
      if (target !== id) {
        target = id;
        pickSide(id);
      }
      enter("attention");
    },
    activate(id) {
      if (target !== id || phase === "idle" || phase === "returning" || phase === "presenting") {
        target = id;
        pickSide(id);
      }
      const fresh = phase !== "attention";
      phase = "reaching";
      phaseT = 0;
      if (fresh) entity.fire("Anticipate");
    },
    setPresenting(on) {
      presenting = on;
      if (!on && phase === "presenting") enter("returning");
      else if (on && layout.present && (phase === "idle" || phase === "returning")) enter("presenting");
    },
    pointer(p) {
      ptr = p;
    },
    intro() {
      if (phase !== "idle" && phase !== "returning") return;
      phase = "intro";
      phaseT = 0;
      bowed = false;
      spinNow = 0;
      spinV = 0;
      flash = 1;
    },
    release() {
      hover = null;
      if (phase === "attention" || phase === "reaching" || phase === "touching") {
        target = null;
        enter(rest());
      }
    },
    resetJoints() {
      debug.joints.maxStep = 0;
      debug.joints.jumps = 0;
      debug.joints.elbowMin = 180;
      debug.joints.elbowMax = 0;
    },
    snap() {
      snapNext = true;
    },
    update(dt, t, camera) {
      cam = camera;
      frame++;
      phaseT += dt;
      const L = layout;
      const reach = rig.reach;

      // ---- 1. estados ---------------------------------------------------------------------
      let cp: Point | null = null;
      if (target && (phase === "attention" || phase === "reaching" || phase === "touching")) {
        const r = resolve(target);
        if (r) cp = aim(r, contactPx);
        else {
          // o alvo saiu da tela (layout mudou, modo trocou): larga
          target = null;
          enter(rest());
        }
      }
      if (phase === "attention") {
        if (hover !== target) {
          hoverLost += dt;
          if (hover) {
            target = hover;
            pickSide(hover);
            hoverLost = 0;
          } else if (hoverLost > REACH.grace) {
            target = null;
            enter(rest());
          }
        } else hoverLost = 0;
      }
      hasContact = false;
      if (cp && target) {
        toWorld(cp.x, cp.y, REACH.planeZ, contact);
        hasContact = true;
      }
      const act = arms[side];
      if (phase === "reaching" && hasContact) {
        const near = act.G.distanceTo(contact) < 0.014 && act.w > 0.96 && act.short < 0.012;
        if (near || phaseT > 2.2) {
          enter("touching");
          entity.fire(side === "R" ? "Touch_R" : "Touch_L");
          touches++;
          pulse.x = contactPx.x;
          pulse.y = contactPx.y;
          pulse.p = 0;
          pulse.k = 1;
          flash = 1;
          onTouch(target!);
        }
      } else if (phase === "touching") {
        const P = REACH.press;
        if (phaseT > P.in + P.hold + P.out) {
          if (presenting && L.present) enter("presenting");
          else if (hover && hover === target) enter("attention");
          else {
            target = null;
            enter(rest());
          }
        }
      } else if (phase === "returning") {
        if (presenting && L.present) enter("presenting");
        else if (phaseT > 0.5 && pos.distanceTo(posGoal) < 0.04 && vel.length() < 0.08) enter("idle");
      } else if (phase === "idle" && presenting && L.present) enter("presenting");
      else if (phase === "intro" && (phaseT > INTRO.end || (presenting && L.present))) enter(presenting && L.present ? "presenting" : "idle");
      if (phase === "intro" && !bowed && phaseT >= INTRO.bowAt) {
        bowed = true;
        entity.fire("Bow");
      }
      if (phase === "returning" && phaseT === dt) entity.fire("Return");

      // ---- pesos dos clipes e mixer ---------------------------------------------------------
      const RS: ClipName = side === "R" ? "Reach_R" : "Reach_L";
      const TS: ClipName = side === "R" ? "Touch_R" : "Touch_L";
      let W: Partial<Record<ClipName, number>>;
      if (phase === "intro") W = bowed && phaseT < INTRO.bowAt + 2.0 ? { Bow: 1 } : { Idle: 0.55, Attention: 0.45 };
      else if (phase === "idle") W = { Idle: 1 };
      else if (phase === "attention") W = { Idle: 0.14, Attention: 0.14, [RS]: 0.72 };
      else if (phase === "reaching") W = { [RS]: 0.86, Idle: 0.14, Anticipate: phaseT < 0.16 ? 0.24 : 0 };
      else if (phase === "touching") W = { [TS]: 0.86, Idle: 0.14 };
      else if (phase === "presenting") W = { Present: 1 };
      else W = { Idle: 1, Return: phaseT < 0.45 ? 0.3 : 0 };
      // por cima (telefone): as pernas recolhem enquanto a mão desce até a grade
      const wantCrouch = above && (phase === "attention" || phase === "reaching" || phase === "touching") ? 0.42 : 0;
      crouch += (wantCrouch - crouch) * (1 - Math.exp(-dt / 0.16));
      if (crouch > 0.01 && !W.Anticipate) W.Anticipate = crouch;
      entity.blend(W, dt, snapNext ? 1e-4 : REACH.blend.clip);
      entity.mixer.update(dt);
      debug.seq.mixer = frame;

      // ---- 2. corpo -------------------------------------------------------------------------
      const reaching = phase === "attention" || phase === "reaching" || phase === "touching";
      toWorld(L.home.x, L.home.y, 0, v1);
      const homeX = v1.x;
      const homeY = v1.y;
      let zGoal = 0;
      let sx = 0;
      if (reaching && hasContact) {
        // onde o ombro precisa estar para o alcance ser confortável; o quadril segue por diferença
        sx = above ? (side === "R" ? 1 : -1) : contact.x < homeX ? 1 : -1;
        const r = reach * REACH.comfort;
        const arm = rig.arms[side];
        arm.upper.getWorldPosition(v2); // ombro neste quadro
        const offX = v2.x - pos.x;
        const offY = v2.y - pos.y;
        let gx: number;
        let gy: number;
        if (above) {
          const n = Math.hypot(REACH.bodyAbove.x, REACH.bodyAbove.y);
          gx = contact.x + (sx * REACH.bodyAbove.x * r) / n - offX;
          gy = contact.y + (REACH.bodyAbove.y * r) / n - offY;
        } else {
          gy = contact.y - REACH.bodySide.y * r - offY;
          gx = 0; // resolvido depois de limitar a altura
        }
        // limites de composição (px → mundo no plano do corpo)
        toWorld(L.bounds.x0, L.bounds.y1, 0, v3);
        toWorld(L.bounds.x1, L.bounds.y0, 0, v4);
        const yLo = v3.y;
        const yHi = v4.y;
        const xLo = v3.x;
        const xHi = v4.x;
        gy = MathUtils.clamp(gy, yLo, yHi);
        if (!above) {
          const dy = gy + offY - contact.y;
          const dx = Math.sqrt(Math.max(r * r - dy * dy, (0.35 * r) ** 2));
          gx = contact.x + sx * dx - offX;
        }
        gx = MathUtils.clamp(gx, xLo, xHi);
        posGoal.set(gx, gy, 0);
      } else if (phase === "presenting" && L.present) {
        toWorld(L.present.x, L.present.y, L.present.z, posGoal);
        zGoal = L.present.z;
        posGoal.z = zGoal;
      } else posGoal.set(homeX, homeY, 0);

      const rush = phase === "reaching" || phase === "touching";
      if (snapNext) {
        pos.copy(posGoal);
        vel.set(0, 0, 0);
        lead.copy(posGoal);
        leadV.set(0, 0, 0);
      } else {
        // duas molas em série: o alvo amaciado (`lead`) e o corpo atrás dele — parte sem tranco
        const w = rush ? REACH.spring.bodyRush : REACH.spring.body;
        springV(lead, leadV, posGoal, w * REACH.spring.lead, dt);
        springV(pos, vel, lead, w, dt);
      }

      // inclinação na direção do alvo (proporcional ao deslocamento) e leve giro do corpo
      const disp = pos.x - homeX;
      const leanGoal = reaching ? MathUtils.clamp(-disp * REACH.lean.perUnit + sx * 4.5, -REACH.lean.max, REACH.lean.max) : phase === "presenting" ? -3 : 0;
      const yawGoal = reaching ? -sx * 5 : 0;
      [roll, rollV] = spring(roll, rollV, leanGoal, REACH.spring.body, dt);
      [yawBody, yawBodyV] = spring(yawBody, yawBodyV, yawGoal, REACH.spring.body, dt);
      if (snapNext) {
        roll = leanGoal;
        yawBody = yawGoal;
        rollV = yawBodyV = 0;
      }
      // apresentação: surge de baixo crescendo, dá o giro; fora dela, escala/subida/giro assentam sozinhos
      const ease3 = (x: number) => {
        const u = Math.max(0, Math.min(1, x));
        return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
      };
      let scaleGoal = 1;
      let riseGoal = 0;
      if (phase === "intro") {
        const a = Math.max(0, Math.min(1, phaseT / INTRO.appear));
        const out = 1 - Math.pow(1 - a, 3);
        // passa um pouco do tamanho final e assenta (easeOutBack)
        const back = 1 + 2.2 * Math.pow(a - 1, 3) + 1.2 * Math.pow(a - 1, 2);
        scaleGoal = INTRO.scaleFrom + (1 - INTRO.scaleFrom) * back;
        riseGoal = -INTRO.rise * (1 - out);
        introScale = scaleGoal;
        introRise = riseGoal;
        spinNow = Math.PI * 2 * INTRO.turns * ease3((phaseT - INTRO.spinAt) / INTRO.spin);
        spinV = 0;
      } else {
        introScale += (1 - introScale) * (1 - Math.exp(-dt / 0.18));
        introRise += (0 - introRise) * (1 - Math.exp(-dt / 0.18));
        // interrompida no meio do giro: termina pela volta mais próxima
        const wrapped = Math.atan2(Math.sin(spinNow), Math.cos(spinNow));
        if (Math.abs(wrapped) < 1e-4 && Math.abs(spinV) < 1e-3) spinNow = 0;
        else {
          spinNow = wrapped;
          [spinNow, spinV] = spring(spinNow, spinV, 0, REACH.spring.body, dt);
        }
      }
      if (snapNext) {
        introScale = 1;
        introRise = 0;
        spinNow = 0;
      }
      const calm = phase === "idle" || phase === "presenting" ? 1 : phase === "intro" ? 0.2 : 0.35;
      const bobY = 0.034 * Math.sin(t * 0.92) * calm;
      const bobX = 0.014 * Math.sin(t * 0.47 + 1.1) * calm;
      const P = entity.pivot;
      P.position.set(pos.x + bobX, pos.y + bobY + introRise, pos.z);
      P.scale.setScalar(introScale);
      // velocidade lateral inclina um pouco contra o movimento (inércia)
      const drag = MathUtils.clamp(-vel.x * 1.5, -5, 5);
      P.rotation.set(MathUtils.degToRad(1.5 * Math.sin(t * 0.6) * calm), MathUtils.degToRad(yawBody + 2.5 * Math.sin(t * 0.31) * calm) + spinNow, MathUtils.degToRad(roll * 0.42 + drag + 1.1 * Math.sin(t * 0.52 + 0.4) * calm));
      applyLean(rig, MathUtils.degToRad(roll * 0.58));
      if (snapNext) carry.set(0, 0, 0);
      else carry.copy(P.position).sub(prevPivot);
      prevPivot.copy(P.position);

      // olhar: para o app; em repouso, o ponteiro (de longe) ou uma deriva lenta
      let yawL = 0;
      let pitchL = 0;
      rig.head.getWorldPosition(v2);
      if (reaching && hasContact) {
        yawL = Math.atan2(contact.x - v2.x, REACH.lookAhead);
        pitchL = Math.atan2(-(contact.y - v2.y), Math.hypot(contact.x - v2.x, REACH.lookAhead));
      } else if (phase === "idle" || phase === "returning") {
        if (ptr) {
          yawL = ptr.x * 0.42;
          pitchL = -ptr.y * 0.2;
        } else {
          yawL = 0.16 * Math.sin(t * 0.23);
          pitchL = 0.05 * Math.sin(t * 0.31 + 1);
        }
      }
      const yMax = MathUtils.degToRad(REACH.limits.headYaw);
      const pMax = MathUtils.degToRad(REACH.limits.headPitch);
      yawL = MathUtils.clamp(yawL, -yMax, yMax);
      pitchL = MathUtils.clamp(pitchL, -pMax, pMax);
      [lookYaw, lookYawV] = spring(lookYaw, lookYawV, yawL, REACH.spring.look, dt);
      [lookPitch, lookPitchV] = spring(lookPitch, lookPitchV, pitchL, REACH.spring.look, dt);
      if (snapNext) {
        lookYaw = yawL;
        lookPitch = pitchL;
        lookYawV = lookPitchV = 0;
      }
      applyLook(rig, lookYaw, lookPitch);

      // ---- 3. matrizes de mundo --------------------------------------------------------------
      P.updateMatrixWorld(true);

      // ---- 4. IK dos braços -------------------------------------------------------------------
      for (const s of ["R", "L"] as const) {
        const a = arms[s];
        const arm = rig.arms[s];
        const on = reaching && hasContact && s === side;
        if (on) {
          const armX = s === "R" ? -1 : 1;
          const ap = above ? REACH.approachAbove : over ? REACH.approachOver : REACH.approachSide;
          // vetor do contato para fora (de onde o dedo chega); x acompanha o lado do corpo
          v1.set((above ? -armX : sx) * ap.x, ap.y, ap.z).normalize();
          v5.copy(v1).negate(); // direção final do dedo: para dentro do ícone
          if (above) {
            a.goal.back.set(armX * -0.15, 0.3, 0.94);
            a.goal.pole.set(armX * 0.9, 0.3, -0.35);
          } else {
            a.goal.back.set(0, 0.75, 0.66);
            a.goal.pole.set(0, -1, -0.35);
          }
          let gap: number = REACH.hoverGap;
          if (phase === "reaching") gap = phaseT < 0.06 ? REACH.hoverGap + 0.04 : 0;
          else if (phase === "touching") {
            const Pp = REACH.press;
            const k = phaseT < Pp.in ? phaseT / Pp.in : phaseT < Pp.in + Pp.hold ? 1 : Math.max(0, 1 - (phaseT - Pp.in - Pp.hold) / Pp.out);
            gap = -Pp.depth * k * k * (3 - 2 * k);
          }
          v2.copy(contact).addScaledVector(v1, gap);
          // o corpo chega primeiro: a mão não corre na frente além do que o braço alcança dobrado
          arm.upper.getWorldPosition(v3);
          v4.subVectors(v2, v3);
          const far = v4.length();
          // …mas num alcance/toque o limite se solta em ~0,7 s: se a composição não deixa o corpo chegar mais perto,
          // o braço termina de estender e encosta do mesmo jeito
          armFree = Math.max(0, Math.min(1, armFree + (rush ? dt / 0.7 : -dt / 0.5)));
          const lim = reach * (REACH.armLead + (1 - REACH.armLead) * armFree);
          if (far > lim) v2.copy(v3).addScaledVector(v4, lim / far);
          if (a.held) {
            // voltou a ter alvo com o IK ainda se desfazendo: continua de onde a mão está
            a.held = false;
            a.V.set(0, 0, 0);
            a.L.copy(a.G);
            a.LV.set(0, 0, 0);
          }
          if (!a.live || a.w < 0.02) {
            // a mão parte de onde está: sem salto ao ligar o IK
            arm.tip.getWorldPosition(a.G);
            a.V.set(0, 0, 0);
            a.L.copy(a.G);
            a.LV.set(0, 0, 0);
            a.live = true;
          }
          if (snapNext) {
            a.G.copy(v2);
            a.V.set(0, 0, 0);
            a.L.copy(v2);
            a.LV.set(0, 0, 0);
          } else {
            // longe do ícone a mão anda junto com o corpo (senão fica para trás num deslocamento rápido e contorna
            // o ombro); perto dele, fica presa ao ponto do mundo — o ícone não se mexe
            const ride = 0.92 * MathUtils.smoothstep(a.G.distanceTo(contact), 0.14, 0.6);
            a.G.addScaledVector(carry, ride);
            a.L.addScaledVector(carry, ride);
            const w = rush ? REACH.spring.handRush : REACH.spring.hand;
            springV(a.L, a.LV, v2, w * REACH.spring.lead, dt);
            springV(a.G, a.V, a.L, w, dt);
          }
          // preso ao ícone durante o toque: o erro restante das molas some aos poucos, sem estalo
          if (phase === "touching") {
            const k = 1 - Math.exp(-dt / 0.09);
            a.L.lerp(v2, k);
            a.G.lerp(v2, k);
          }
          // a ponta nunca entra na zona em volta do ombro em que o cotovelo dobraria demais…
          v4.subVectors(a.G, v3);
          const dG = v4.length();
          const minR = reach * REACH.armMin;
          if (dG > 1e-5 && dG < minR) a.G.copy(v3).addScaledVector(v4, minR / dG);
          // …e o dedo só assume a direção de chegada perto do ícone: longe dele, aponta na linha do próprio braço
          v4.subVectors(a.G, v3).normalize();
          const nearK = 1 - MathUtils.smoothstep(a.G.distanceTo(contact), 0.14, 0.6);
          a.goal.finger.copy(v4).lerp(v5, 0.25 + 0.75 * nearK).normalize();
        } else if (a.live) {
          // sem alvo: a mão fica onde estava EM RELAÇÃO AO CORPO enquanto o IK se desfaz. Presa a um ponto do
          // mundo, o corpo passaria por ele ao voltar e o braço viraria do avesso.
          if (!a.held) {
            a.rel.copy(a.G);
            P.worldToLocal(a.rel);
            a.held = true;
          }
          a.G.copy(a.rel).applyMatrix4(P.matrixWorld);
        }
        const wGoal = on ? 1 : 0;
        a.w += (wGoal - a.w) * (1 - Math.exp(-dt / (on ? REACH.blend.ik : REACH.blend.ikOut)));
        if (snapNext) a.w = wGoal;
        if (a.w < 0.002) {
          a.w = 0;
          a.live = false;
          a.held = false;
          a.short = 0;
          continue;
        }
        a.goal.tip.copy(a.G);
        a.short = solveArm(arm, a.goal, a.w * a.w * (3 - 2 * a.w), { elbowMin: REACH.limits.elbowMin, elbowMax: REACH.limits.elbowMax, wrist: REACH.limits.wrist, maxStretch: REACH.maxStretch });
        // ---- 5. matrizes do braço ----
        arm.clavicle.updateMatrixWorld(true);
        debug.seq.ik = frame;
      }
      debug.seq.frame = frame;

      // ---- fragmentos: deriva em volta do repouso, atraso por inércia, sopro no toque ----------
      flash = Math.max(0, flash - dt / 0.5);
      for (let i = 0; i < rig.frags.length; i++) {
        const b = rig.frags[i];
        const r0 = entity.fragRest[i];
        const ph = i * 1.7;
        const amp = 0.04;
        v1.set(Math.sin(t * (0.31 + i * 0.05) + ph), Math.cos(t * (0.27 + i * 0.04) + ph * 1.3), Math.sin(t * (0.22 + i * 0.03) + ph * 0.7)).multiplyScalar(amp);
        // o osso pai (root) usa Y para cima e Z para a frente: mesma base do mundo, a menos do giro do pivô
        v1.x -= vel.x * 0.11;
        v1.y -= vel.y * 0.11;
        v2.copy(r0).setY(r0.y - 1.1).normalize();
        v1.addScaledVector(v2, 0.07 * flash + 0.9 * (1 - Math.min(1, (introScale - INTRO.scaleFrom) / (1 - INTRO.scaleFrom))));
        b.position.copy(r0).add(v1);
        AXIS.set(Math.sin(ph), Math.cos(ph * 1.9), Math.sin(ph * 0.6 + 1)).normalize();
        b.quaternion.copy(q1.setFromAxisAngle(AXIS, t * (0.16 + i * 0.03) + ph));
        b.updateMatrixWorld(true);
      }

      // ---- luzes do contato -----------------------------------------------------------------
      pulse.p = Math.min(1, pulse.p + dt / 0.75);
      if (pulse.p >= 1) pulse.k = 0;
      const sm = entity.spark.material;
      const rm = entity.ring.material;
      const k = act.w;
      if (k > 0.02) {
        rig.arms[side].tip.getWorldPosition(v1);
        entity.spark.position.copy(v1);
        const base = phase === "reaching" ? 0.5 : phase === "touching" ? 0.75 : 0.2;
        sm.opacity = k * (base + 0.9 * flash);
        const sc = 0.1 + 0.3 * flash;
        entity.spark.scale.set(sc, sc, 1);
      } else sm.opacity = 0;
      if (pulse.k > 0 && hasContact) {
        entity.ring.position.copy(contact);
        const sc = 0.06 + 0.5 * pulse.p;
        entity.ring.scale.set(sc, sc, 1);
        rm.opacity = (1 - pulse.p) * 0.85;
      } else rm.opacity = 0;
      entity.visor.material.opacity = 0.42 + 0.08 * Math.sin(t * 1.3) + 0.35 * flash;

      // ---- saúde das articulações: passo angular por quadro e flexão do cotovelo ---------------
      for (let i = 0; i < jointBones.length; i++) {
        const q = jointBones[i].quaternion;
        if (jointsLive && dt > 0) {
          const step = MathUtils.radToDeg(2 * Math.acos(Math.min(1, Math.abs(q.dot(jointPrev[i])))));
          if (step > debug.joints.maxStep) debug.joints.maxStep = step;
          if (step > 50 && step / dt > 1800) debug.joints.jumps++;
        }
        jointPrev[i].copy(q);
      }
      jointsLive = !snapNext;
      if (act.w > 0.5) {
        v1.set(0, 1, 0).applyQuaternion(rig.arms[side].fore.quaternion); // direção do antebraço no espaço do braço
        const flex = MathUtils.radToDeg(Math.acos(MathUtils.clamp(v1.y, -1, 1)));
        debug.joints.elbowMin = Math.min(debug.joints.elbowMin, flex);
        debug.joints.elbowMax = Math.max(debug.joints.elbowMax, flex);
      }

      // ---- medição (ponta do dedo × ponto de contato do DOM, em px) -------------------------
      debug.phase = phase;
      debug.target = target;
      debug.side = side;
      debug.ik = act.w;
      debug.short = act.short;
      debug.touches = touches;
      toPx(pos, debug.body);
      if (act.w > 0.02 && hasContact) {
        rig.arms[side].tip.getWorldPosition(v1);
        debug.tip = toPx(v1, debug.tip ?? { x: 0, y: 0 });
        debug.goal = { x: contactPx.x, y: contactPx.y };
        debug.err = Math.hypot(debug.tip.x - contactPx.x, debug.tip.y - contactPx.y);
      } else {
        debug.tip = null;
        debug.goal = null;
        debug.err = null;
      }
      snapNext = false;
    },
  };
  return api;
}
