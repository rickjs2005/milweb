import { MILO } from "../milo.config";
import type { MiloFrame, MiloRigHandle } from "../milo.types";

/**
 * Caminhada procedural amarrada à DISTÂNCIA, não ao tempo. `phase` é o
 * número de ciclos percorridos (assinado): a ponte calcula
 * `deslocamento / passo`, então parar o scroll congela as pernas e voltar
 * o scroll anda de ré — sem clip, sem relógio.
 *
 * Um ciclo = dois passos. Cada perna passa por:
 *   apoio  (0 → 0.6)   calcanhar toca à frente → pé rola plano → impulso do dedão
 *                      (o quadril gira a taxa quase constante: é isso que segura o pé no chão)
 *   balanço (0.6 → 1)  joelho dobra cedo, a perna passa e estende antes do próximo calcanhar
 * Pélvis: sobe no meio do apoio e desce no duplo apoio (2×/ciclo), desloca para a perna
 * de apoio e gira com o passo; o tronco contra-gira; os braços balançam do ombro com o
 * cotovelo cedendo à frente; a cabeça fica nivelada.
 *
 * Amplitude do quadril derivada do passo: meio-ciclo ≈ 2·L·sin(A) ⇒ A = asin(passo / 4L).
 * Tudo aditivo sobre a pose de repouso; `amount` mistura (0 = repouso).
 */
const TWO_PI = Math.PI * 2;
const LEG = MILO.proportions.thigh.len + MILO.proportions.shin.len;
const PELVIS_BASE_Y = LEG + MILO.proportions.pelvis.h * 0.55;
const STANCE = 0.6; // fração do ciclo em apoio (duplo apoio = 0.1 de cada lado)

const frac = (x: number) => x - Math.floor(x);
const sstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const bump = (a: number, b: number, x: number) => Math.sin(Math.PI * Math.min(1, Math.max(0, (x - a) / (b - a)))); // 0→1→0

type Leg = { hip: number; knee: number; foot: number };
const L: Leg = { hip: 0, knee: 0, foot: 0 };
const R: Leg = { hip: 0, knee: 0, foot: 0 };

/** Quadril, joelho e pé de uma perna para a fração de ciclo `u` (0..1). */
function leg(u: number, A: number, out: Leg) {
  if (u < STANCE) {
    const s = u / STANCE; // 0 calcanhar → 1 dedão
    // apoio: quadril de +A (à frente) a −A (atrás), quase linear — suavizado só nas pontas
    out.hip = A * (1 - 2 * (s + 0.06 * Math.sin(s * TWO_PI)));
    // joelho: amortece na carga, estende no meio, dobra de novo no impulso
    out.knee = 0.22 * bump(0, 0.35, s) + 0.55 * sstep(0.7, 1, s);
    // pé: calcanhar levantado (dedos para cima) no toque → plano → impulso (dedos para baixo)
    out.foot = 0.3 * (1 - sstep(0, 0.25, s)) - 0.55 * sstep(0.62, 1, s);
  } else {
    const s = (u - STANCE) / (1 - STANCE); // 0 saída → 1 próximo calcanhar
    out.hip = -A + 2 * A * sstep(0, 0.9, s);
    // joelho dobra cedo (a perna passa curta) e estende antes do toque
    out.knee = 0.55 + 0.65 * bump(0, 0.55, s) - 0.55 * sstep(0.55, 1, s);
    // pé: relaxado para baixo, depois puxa os dedos para o calcanhar tocar primeiro
    out.foot = -0.55 * (1 - sstep(0, 0.5, s)) + 0.3 * sstep(0.5, 1, s);
  }
}

export function applyWalk(rig: MiloRigHandle, frame: MiloFrame, strideWorld: number) {
  const b = rig.bones;
  const { phase, amount, speed } = frame.walk;
  b.pelvis.group.position.y = PELVIS_BASE_Y;
  b.pelvis.group.position.x = 0;
  if (amount <= 0.001) return;
  const A = Math.asin(Math.min(0.8, strideWorld / (4 * LEG)));
  leg(frac(phase), A, L);
  leg(frac(phase + 0.5), A, R);

  b.leftLeg.group.rotation.x += L.hip * amount;
  b.leftShin.group.rotation.x += -L.knee * amount;
  b.leftFoot.group.rotation.x += L.foot * amount;
  b.rightLeg.group.rotation.x += R.hip * amount;
  b.rightShin.group.rotation.x += -R.knee * amount;
  b.rightFoot.group.rotation.x += R.foot * amount;
  // a perna direita da pose de repouso está aberta/à frente: durante a marcha ela alinha
  b.rightLeg.group.rotation.y += 0.26 * amount;
  b.rightLeg.group.rotation.z += 0.18 * amount;
  b.rightShin.group.rotation.x += -0.22 * amount;
  b.rightFoot.group.rotation.y += 0.28 * amount;
  b.leftLeg.group.rotation.z += -0.03 * amount;

  // pélvis: 2 oscilações verticais por ciclo (alta no meio do apoio), deslocamento para a
  // perna de apoio, queda do lado em balanço e rotação com o passo
  const c1 = Math.sin(phase * TWO_PI); // + quando a perna esquerda vai à frente
  const c2 = Math.cos(phase * 2 * TWO_PI);
  b.pelvis.group.position.y += (-0.022 + 0.022 * c2) * amount;
  b.pelvis.group.position.x += 0.022 * Math.sin(phase * TWO_PI + Math.PI * 0.5) * amount;
  b.pelvis.group.rotation.z += 0.045 * c1 * amount;
  b.pelvis.group.rotation.y += 0.11 * c1 * amount;
  // coluna e peito: contra-rotação, leve inclinação com a velocidade, tronco firme
  b.spine.group.rotation.y += -0.05 * c1 * amount;
  b.chest.group.rotation.y += -0.09 * c1 * amount;
  b.chest.group.rotation.z += -0.02 * c1 * amount;
  b.chest.group.rotation.x += (0.06 + 0.06 * speed) * amount;
  b.spine.group.rotation.x += 0.03 * speed * amount;
  // braços: do ombro, em oposição às pernas; o cotovelo cede quando o braço vai à frente
  const armFree = 1 - frame.touch;
  const lf = 0.5 + 0.5 * c1; // 1 = braço esquerdo à frente
  // (pose de repouso já tem os braços um pouco à frente: o balanço é curto e o cotovelo
  // nunca trava — braço reto esticado à frente não existe numa caminhada)
  // os antebraços ficam quase soltos (a pose de repouso já dobra o direito 0,62 — na marcha
  // ele se estende, e só cede um pouco quando o braço vai à frente)
  b.leftShoulder.group.rotation.y += 0.04 * c1 * amount;
  b.leftArm.group.rotation.x += (0.26 * c1 - 0.1) * amount;
  b.leftArm.group.rotation.z += -0.08 * amount;
  b.leftForearm.group.rotation.x += (0.16 - 0.14 * lf) * amount;
  b.rightShoulder.group.rotation.y += -0.04 * c1 * amount;
  b.rightArm.group.rotation.x += (-0.26 * c1 + 0.12) * amount * armFree;
  b.rightArm.group.rotation.z += 0.06 * amount * armFree;
  b.rightForearm.group.rotation.x += (0.42 - 0.14 * (1 - lf)) * amount * armFree;
  b.rightHand.group.rotation.x += 0.12 * amount * armFree;
  // cabeça nivelada: compensa a rotação da pélvis+peito e o balanço vertical mínimo
  b.neck.group.rotation.y += 0.05 * c1 * amount;
  b.head.group.rotation.y += 0.04 * c1 * amount;
  b.head.group.rotation.z += -0.02 * c1 * amount;
}

/**
 * Pose de cena do Hero (aditiva): inclinação do tronco (alcance / peso
 * puxando), recuo curto no impacto e ligeira "firmeza" quando a presença
 * fica sólida. Tudo função dos valores do frame (reversível).
 */
export function applyHeroBody(rig: MiloRigHandle, frame: MiloFrame) {
  const b = rig.bones;
  const lean = frame.lean;
  if (Math.abs(lean) > 1e-4) {
    b.chest.group.rotation.x += lean * 0.7;
    b.spine.group.rotation.x += lean * 0.3;
    b.pelvis.group.rotation.x += lean * 0.12;
    b.neck.group.rotation.x += -lean * 0.35; // o olhar continua na palavra
  }
  const r = frame.recoil;
  if (r > 1e-4) {
    b.chest.group.rotation.x += -0.07 * r;
    b.rightShoulder.group.rotation.z += 0.12 * r;
    b.rightArm.group.rotation.x += -0.18 * r;
    b.rightForearm.group.rotation.x += -0.3 * r;
    b.head.group.rotation.x += -0.05 * r;
  }
  const s = frame.solid;
  if (s > 1e-4) {
    b.leftShoulder.group.rotation.z += -0.03 * s;
    b.rightShoulder.group.rotation.z += 0.03 * s;
    b.chest.group.rotation.x += -0.02 * s;
  }
}
