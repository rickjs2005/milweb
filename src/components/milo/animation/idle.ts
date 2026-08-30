import type { MiloRigHandle } from "../milo.types";
import { MILO } from "../milo.config";

/**
 * Idle — respiração quase imperceptível, compensação de ombros, oscilação
 * mínima da cabeça. Tudo aditivo sobre a pose de repouso (aplicada antes).
 * `amount` escala a amplitude (energia); `time` em segundos.
 */
export function applyIdle(rig: MiloRigHandle, time: number, amount: number) {
  const { breath, sway } = MILO.idle;
  const b = rig.bones;
  const breathe = Math.sin(time * 1.15) * 0.5 + 0.5; // ~5,5 s por ciclo
  const slow = Math.sin(time * 0.37);
  const slow2 = Math.cos(time * 0.23 + 1.3);

  // peito sobe/expande na inspiração
  b.chest.group.position.y += breathe * 0.006 * breath;
  b.chest.group.scale.setScalar(1 + breathe * 0.012 * breath);
  b.chest.group.rotation.x += -breathe * 0.012 * breath;

  // ombros compensam: um sobe enquanto o outro relaxa
  b.leftShoulder.group.rotation.z += slow * 0.018 * amount + breathe * 0.008;
  b.rightShoulder.group.rotation.z += -slow * 0.014 * amount - breathe * 0.006;

  // cabeça oscila muito pouco, fora de fase com o corpo
  b.head.group.rotation.y += slow2 * 0.035 * sway;
  b.head.group.rotation.x += Math.sin(time * 0.51 + 0.7) * 0.02 * sway;
  b.neck.group.rotation.z += slow * 0.012 * sway;

  // peso oscila entre as pernas
  b.pelvis.group.rotation.z += slow2 * 0.01 * sway;
  b.spine.group.rotation.y += slow * 0.02 * sway;

  // mãos respiram com o corpo
  b.leftForearm.group.rotation.x += Math.sin(time * 0.6) * 0.02 * amount;
  b.rightForearm.group.rotation.x += Math.cos(time * 0.55 + 0.4) * 0.02 * amount;
}
