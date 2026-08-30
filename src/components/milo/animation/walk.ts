import { MILO } from "../milo.config";
import type { MiloFrame, MiloRigHandle } from "../milo.types";

/**
 * Caminhada procedural amarrada à DISTÂNCIA, não ao tempo. `phase` é o
 * número de ciclos percorridos (assinado): a ponte calcula
 * `deslocamento / passo`, então parar o scroll congela as pernas e voltar
 * o scroll anda de ré — sem clip, sem relógio. Para o pé de apoio não
 * deslizar, a fase de apoio é LINEAR (o quadril gira a taxa constante
 * enquanto o corpo avança um meio-passo) e o balanço é curto, com o
 * joelho dobrando só na perna livre. Amplitude do quadril derivada do
 * passo: um meio-passo ≈ 2·L·A (pequenos ângulos) ⇒ A = passo / (4·L).
 *
 * Tudo aditivo sobre a pose de repouso; `amount` mistura (0 = repouso).
 */
const TWO_PI = Math.PI * 2;
const LEG = MILO.proportions.thigh.len + MILO.proportions.shin.len;
const PELVIS_BASE_Y = LEG + MILO.proportions.pelvis.h * 0.55;

const frac = (x: number) => x - Math.floor(x);
const sstep = (t: number) => t * t * (3 - 2 * t);

/** Quadril e joelho de uma perna para a fração de ciclo `u` (0..1). */
function leg(u: number, A: number, knee: number) {
  if (u < 0.5) {
    // apoio: linear (+A à frente → −A atrás)
    return { hip: A * (1 - 4 * u), knee: 0.06 * knee * Math.sin(u * TWO_PI) };
  }
  // balanço: volta para a frente com o joelho dobrado no meio
  const s = (u - 0.5) * 2;
  return { hip: -A + 2 * A * sstep(s), knee: knee * Math.sin(s * Math.PI) };
}

export function applyWalk(rig: MiloRigHandle, frame: MiloFrame, strideWorld: number) {
  const b = rig.bones;
  const { phase, amount, speed } = frame.walk;
  b.pelvis.group.position.y = PELVIS_BASE_Y;
  if (amount <= 0.001) return;
  const A = Math.min(0.42, strideWorld / (4 * LEG));
  const KNEE = 0.95;
  const L = leg(frac(phase), A, KNEE);
  const R = leg(frac(phase + 0.5), A, KNEE);

  b.leftLeg.group.rotation.x += L.hip * amount;
  b.leftShin.group.rotation.x += -L.knee * amount;
  b.leftFoot.group.rotation.x += 0.35 * L.knee * amount;
  b.rightLeg.group.rotation.x += R.hip * amount;
  b.rightShin.group.rotation.x += -R.knee * amount;
  b.rightFoot.group.rotation.x += 0.35 * R.knee * amount;
  // a perna direita da pose de repouso está aberta/à frente: durante a marcha ela alinha
  b.rightLeg.group.rotation.y += 0.22 * amount;
  b.rightLeg.group.rotation.z += 0.16 * amount;
  b.rightShin.group.rotation.x += -0.2 * amount;

  // pélvis: giro contrário às pernas e balanço vertical (dois por ciclo)
  const cyc = Math.sin(phase * TWO_PI);
  b.pelvis.group.rotation.y += 0.07 * cyc * amount;
  b.pelvis.group.position.y += -0.018 * (1 - Math.abs(Math.cos(phase * TWO_PI))) * amount;
  b.pelvis.group.rotation.z += 0.03 * cyc * amount;
  // tronco compensa o giro e inclina com a velocidade (para trás quando anda de ré)
  b.chest.group.rotation.y += -0.09 * cyc * amount;
  b.chest.group.rotation.x += 0.1 * speed * amount;
  b.spine.group.rotation.x += 0.04 * speed * amount;
  // braços em oposição às pernas (o braço direito cede ao IK quando o touch entra)
  const armFree = 1 - frame.touch;
  b.leftArm.group.rotation.x += 0.42 * cyc * amount;
  b.leftForearm.group.rotation.x += -0.25 * (0.5 + 0.5 * cyc) * amount;
  b.rightArm.group.rotation.x += -0.42 * cyc * amount * armFree;
  b.rightForearm.group.rotation.x += -0.25 * (0.5 - 0.5 * cyc) * amount * armFree;
  b.leftShoulder.group.rotation.y += 0.05 * cyc * amount;
  b.rightShoulder.group.rotation.y += -0.05 * cyc * amount;
  // cabeça estabiliza (contra-rotação leve)
  b.head.group.rotation.y += 0.04 * cyc * amount;
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
