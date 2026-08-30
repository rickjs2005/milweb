import { MILO } from "../milo.config";
import type { MiloRigHandle } from "../milo.types";
import { Spring } from "./spring";

/**
 * Observe — a cabeça segue o alvo com atraso (mola); o torso acompanha
 * só 20 % da cabeça; os ombros respondem com inércia própria, mais lenta.
 * Rotação limitada para não parecer ameaçador. O alvo pode ser o cursor
 * ou o painel (a atenção migra quando o cursor se aproxima do painel).
 */
export class ObserveController {
  private yaw = new Spring(0, MILO.observe.spring.k, MILO.observe.spring.c);
  private pitch = new Spring(0, MILO.observe.spring.k, MILO.observe.spring.c);
  private shoulder = new Spring(0, MILO.observe.shoulderSpring.k, MILO.observe.shoulderSpring.c);

  /** `target` em NDC (−1..1), já misturado entre cursor e painel. `weight` 0..1. */
  apply(rig: MiloRigHandle, target: { x: number; y: number }, active: boolean, weight: number, dt: number) {
    const { headYaw, headPitch, chestFactor } = MILO.observe;
    const tx = active ? -target.x * headYaw * weight : 0;
    const ty = active ? target.y * headPitch * weight : 0;
    const y = this.yaw.update(tx, dt);
    const p = this.pitch.update(ty, dt);
    const sh = this.shoulder.update(y, dt);
    const b = rig.bones;
    b.head.group.rotation.y += y * 0.62;
    b.head.group.rotation.x += -p * 0.6;
    b.neck.group.rotation.y += y * 0.38;
    b.neck.group.rotation.x += -p * 0.4;
    b.chest.group.rotation.y += y * chestFactor;
    b.spine.group.rotation.y += y * chestFactor * 0.35;
    b.leftShoulder.group.rotation.y += sh * 0.1;
    b.rightShoulder.group.rotation.y += sh * 0.1;
    b.leftShoulder.group.rotation.z += sh * 0.05;
    b.rightShoulder.group.rotation.z += sh * 0.05;
  }
}
