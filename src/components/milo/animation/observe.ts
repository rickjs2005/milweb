import { MILO } from "../milo.config";
import type { MiloRigHandle } from "../milo.types";
import { Spring } from "./spring";

/**
 * Observe — cabeça e parte superior do torso seguem o cursor com molas
 * (inércia), rotação limitada para não ficar ameaçador. O peito acompanha
 * uma fração; o pescoço divide o giro com a cabeça.
 */
export class ObserveController {
  private yaw = new Spring(0, MILO.observe.spring.k, MILO.observe.spring.c);
  private pitch = new Spring(0, MILO.observe.spring.k, MILO.observe.spring.c);

  /** `pointer` em NDC (−1..1). `weight` 0..1. Se o ponteiro está inativo, volta ao repouso. */
  apply(rig: MiloRigHandle, pointer: { x: number; y: number }, active: boolean, weight: number, dt: number) {
    const { headYaw, headPitch, chestFactor } = MILO.observe;
    // cursor à esquerda → o Milo (à direita) vira para a esquerda: sinal negativo no yaw
    const tx = active ? -pointer.x * headYaw * weight : 0;
    const ty = active ? pointer.y * headPitch * weight : 0;
    const y = this.yaw.update(tx, dt);
    const p = this.pitch.update(ty, dt);
    const b = rig.bones;
    b.head.group.rotation.y += y * 0.62;
    b.head.group.rotation.x += -p * 0.6;
    b.neck.group.rotation.y += y * 0.38;
    b.neck.group.rotation.x += -p * 0.4;
    b.chest.group.rotation.y += y * chestFactor;
    b.spine.group.rotation.y += y * chestFactor * 0.35;
    // o corpo "abre" um pouco para o lado do cursor
    b.leftShoulder.group.rotation.y += y * 0.08;
    b.rightShoulder.group.rotation.y += y * 0.08;
  }
}
