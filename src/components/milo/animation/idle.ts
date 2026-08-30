import type { MiloRigHandle } from "../milo.types";
import { MILO } from "../milo.config";

/**
 * Idle — respiração quase imperceptível, compensação de ombros, oscilação
 * mínima da cabeça. Tudo aditivo sobre a pose de repouso (aplicada antes).
 * `amount` escala a amplitude (dormant ≈ quase imóvel).
 */
export function applyIdle(rig: MiloRigHandle, time: number, amount: number) {
  const { breath, sway } = MILO.idle;
  const b = rig.bones;
  const breathe = Math.sin(time * 1.05) * 0.5 + 0.5; // ~6 s por ciclo
  const slow = Math.sin(time * 0.37);
  const slow2 = Math.cos(time * 0.23 + 1.3);
  const br = breath * (0.35 + 0.65 * amount);

  b.chest.group.position.y += breathe * 0.005 * br;
  b.chest.group.scale.setScalar(1 + breathe * 0.01 * br);
  b.chest.group.rotation.x += -breathe * 0.01 * br;

  b.leftShoulder.group.rotation.z += slow * 0.014 * amount + breathe * 0.006 * br;
  b.rightShoulder.group.rotation.z += -slow * 0.011 * amount - breathe * 0.005 * br;

  b.head.group.rotation.y += slow2 * 0.03 * sway * amount;
  b.head.group.rotation.x += Math.sin(time * 0.51 + 0.7) * 0.016 * sway * amount;
  b.neck.group.rotation.z += slow * 0.01 * sway * amount;

  b.pelvis.group.rotation.z += slow2 * 0.008 * sway * amount;
  b.spine.group.rotation.y += slow * 0.016 * sway * amount;

  b.leftForearm.group.rotation.x += Math.sin(time * 0.6) * 0.018 * amount;
  b.rightForearm.group.rotation.x += Math.cos(time * 0.55 + 0.4) * 0.016 * amount;
}
