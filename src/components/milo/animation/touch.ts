import * as THREE from "three";
import { gsap } from "@/animations/gsap";
import { MILO } from "../milo.config";
import type { MiloFrame, MiloRigHandle } from "../milo.types";
import { Spring } from "./spring";
import { solveTwoBoneIK } from "./twoBoneIK";

/**
 * Touch — antecipação curta no ombro, depois o braço direito estende até
 * o painel com IK de dois ossos; a palma para poucos px antes (stopBefore);
 * a aproximação aumenta a compressão da grid (panelInfluence); no contato,
 * a linha acid lime atravessa o painel e segue pela grid (pulse) e uma
 * onda curta percorre o casaco (coatWave).
 */
const target = new THREE.Vector3();
const pole = new THREE.Vector3();
const hand = new THREE.Vector3();
const anchorLocal = new THREE.Vector3();

export class TouchController {
  private weight = new Spring(0, 11, 6.2);
  private contact = false;
  private pulseTween: gsap.core.Tween | null = null;
  private waveTween: gsap.core.Tween | null = null;

  apply(rig: MiloRigHandle, frame: MiloFrame, anchor: [number, number, number], dt: number) {
    const w = this.weight.update(frame.touch, dt);
    if (w < 0.002) {
      frame.panelInfluence = Math.max(0, frame.panelInfluence - dt * 2);
      this.contact = false;
      return;
    }
    // antecipação: o ombro recua e sobe um pouco antes de o braço partir
    const antic = Math.sin(Math.min(w * 2.2, 1) * Math.PI) * (1 - w) * 0.16;
    rig.bones.rightShoulder.group.rotation.z += antic;
    rig.bones.rightShoulder.group.rotation.y += -antic * 0.5;
    const reach = THREE.MathUtils.smoothstep(w, 0.18, 1);

    anchorLocal.set(anchor[0] - MILO.touch.stopBefore, anchor[1], anchor[2] - MILO.touch.stopBefore * 0.4);
    target.copy(anchorLocal).applyMatrix4(rig.root.matrixWorld);
    pole.set(MILO.touch.pole[0], MILO.touch.pole[1], MILO.touch.pole[2]).add(anchorLocal).applyMatrix4(rig.root.matrixWorld);
    // a mão chega por baixo e desacelera (reach já é suave; o arco reforça)
    target.y -= (1 - reach) * 0.14;
    solveTwoBoneIK(rig.bones.rightArm, rig.bones.rightForearm, target, pole, reach);
    rig.bones.rightHand.group.rotation.x += -0.4 * reach;
    rig.bones.rightHand.group.rotation.z += 0.3 * reach;
    rig.bones.rightShoulder.group.rotation.z += -0.1 * reach;
    rig.bones.chest.group.rotation.y += -0.08 * reach;

    rig.rightHandTip.getWorldPosition(hand);
    const dist = hand.distanceTo(target);
    const infl = THREE.MathUtils.clamp(1 - dist / 0.5, 0, 1) * reach;
    frame.panelInfluence += (infl - frame.panelInfluence) * Math.min(1, dt * 8);

    const touching = dist < MILO.touch.contact && reach > 0.92;
    if (touching && !this.contact) this.fire(frame);
    if (!touching && dist > MILO.touch.contact * 2.5) this.contact = false;
  }

  private fire(frame: MiloFrame) {
    this.contact = true;
    frame.pulseAt.x = frame.panel.x;
    frame.pulseAt.y = frame.panel.y;
    this.pulseTween?.kill();
    this.waveTween?.kill();
    frame.pulse = 0.001;
    frame.coatWave = 0.001;
    this.pulseTween = gsap.to(frame, { pulse: 1, duration: 1.5, ease: "power2.out", onComplete: () => (frame.pulse = 0) });
    this.waveTween = gsap.to(frame, { coatWave: 1, duration: 1.1, ease: "sine.out", onComplete: () => (frame.coatWave = 0) });
  }

  dispose() {
    this.pulseTween?.kill();
    this.waveTween?.kill();
  }
}
