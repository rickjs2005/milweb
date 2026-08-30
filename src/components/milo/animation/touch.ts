import * as THREE from "three";
import { gsap } from "@/animations/gsap";
import { MILO } from "../milo.config";
import type { MiloFrame, MiloRigHandle } from "../milo.types";
import { Spring } from "./spring";
import { solveTwoBoneIK } from "./twoBoneIK";

/**
 * Touch — o braço direito estende até a âncora do painel com IK de dois
 * ossos. A mão que se aproxima aumenta a distorção no painel
 * (`panelInfluence`) e, no contato, dispara uma linha acid lime que
 * percorre a grid (`pulse` 0→1 via GSAP; o shader do fundo desenha).
 */
const target = new THREE.Vector3();
const pole = new THREE.Vector3();
const hand = new THREE.Vector3();
const anchorLocal = new THREE.Vector3();

export class TouchController {
  private weight = new Spring(0, 14, 6.5);
  private contact = false;
  private pulseTween: gsap.core.Tween | null = null;

  apply(rig: MiloRigHandle, frame: MiloFrame, anchor: [number, number, number], dt: number) {
    const w = this.weight.update(frame.touch, dt);
    if (w < 0.002) {
      frame.panelInfluence = Math.max(0, frame.panelInfluence - dt * 2);
      this.contact = false;
      return;
    }
    anchorLocal.set(anchor[0], anchor[1], anchor[2]);
    target.copy(anchorLocal).applyMatrix4(rig.root.matrixWorld);
    pole.set(MILO.touch.pole[0], MILO.touch.pole[1], MILO.touch.pole[2]).add(anchorLocal).applyMatrix4(rig.root.matrixWorld);
    // aproximação ligeiramente curva: a mão chega por baixo
    target.y -= (1 - w) * 0.12;
    solveTwoBoneIK(rig.bones.rightArm, rig.bones.rightForearm, target, pole, w);
    // a mão inclina para "apresentar" o painel
    rig.bones.rightHand.group.rotation.x += -0.35 * w;
    rig.bones.rightHand.group.rotation.z += 0.25 * w;
    // ombro acompanha a extensão
    rig.bones.rightShoulder.group.rotation.z += -0.12 * w;
    rig.bones.chest.group.rotation.y += -0.1 * w;

    rig.rightHandTip.getWorldPosition(hand);
    const dist = hand.distanceTo(target);
    const infl = THREE.MathUtils.clamp(1 - dist / 0.45, 0, 1) * w;
    frame.panelInfluence += (infl - frame.panelInfluence) * Math.min(1, dt * 8);

    const touching = dist < MILO.touch.contact && w > 0.9;
    if (touching && !this.contact) this.fire(frame);
    if (!touching && dist > MILO.touch.contact * 2.5) this.contact = false;
  }

  private fire(frame: MiloFrame) {
    this.contact = true;
    frame.pulseAt.x = frame.panel.x;
    frame.pulseAt.y = frame.panel.y;
    this.pulseTween?.kill();
    frame.pulse = 0.001;
    this.pulseTween = gsap.to(frame, { pulse: 1, duration: 1.4, ease: "power2.out", onComplete: () => (frame.pulse = 0) });
  }

  dispose() {
    this.pulseTween?.kill();
  }
}
