"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { MILO } from "./milo.config";
import { buildRig, eachRigMaterial, resetPose } from "./MiloRig";
import { buildParticles } from "./MiloParticles";
import { applyIdle } from "./animation/idle";
import { ObserveController } from "./animation/observe";
import { TouchController } from "./animation/touch";
import { applyDissolve } from "./animation/dissolve";
import { miloFrame, useMiloStore } from "./useMiloStore";
import type { MiloQuality } from "./milo.types";

const chestWorld = new THREE.Vector3();
const tmp = new THREE.Vector3();
const anchor = new THREE.Vector3();

/**
 * O personagem: rig + casaco + partículas, e o loop de movimento
 * procedural (idle → observe → touch → dissolve, todos aditivos sobre a
 * pose de repouso). Escreve por frame em uniforms e em `miloFrame`; nada
 * aqui passa pelo estado do React.
 */
export function MiloNull({ quality, mobile }: { quality: MiloQuality; mobile: boolean }) {
  const camera = useThree((s) => s.camera);
  const rig = useMemo(() => buildRig(), []);
  const particles = useMemo(() => buildParticles(MILO.quality[quality].particles, Math.min(24, rig.joints.length)), [quality, rig]);
  const observe = useRef(new ObserveController());
  const touch = useRef(new TouchController());
  const prev = useRef({ x: 0, y: 0 });
  const frameCount = useRef(0);

  useEffect(() => {
    const t = touch.current;
    return () => {
      t.dispose();
      rig.dispose();
      particles.dispose();
    };
  }, [rig, particles]);

  const placement = mobile ? MILO.placement.mobile : MILO.placement.desktop;
  const secondaryEvery = MILO.quality[quality].secondaryEvery;

  useFrame((st, dt) => {
    const f = miloFrame;
    const time = st.clock.elapsedTime;
    frameCount.current++;
    const root = rig.root;
    root.position.set(placement.x, placement.y, placement.z);
    root.scale.setScalar(placement.scale);

    resetPose(rig);
    applyIdle(rig, time, 0.5 + f.energy * 0.5);
    observe.current.apply(rig, f.pointer, f.pointerActive, f.observe, dt);
    applyDissolve(rig, f.visibility);
    root.updateMatrixWorld(true);
    touch.current.apply(rig, f, useMiloStore.getState().targetPosition, dt);
    root.updateMatrixWorld(true);

    // juntas → partículas
    const uJ = particles.material.uniforms.uJoints.value as THREE.Vector3[];
    const n = Math.min(uJ.length, rig.joints.length);
    for (let i = 0; i < n; i++) rig.joints[i].getWorldPosition(uJ[i]);

    // uniforms compartilhados
    const p = f.params;
    eachRigMaterial(rig, (m) => {
      m.uniforms.uTime.value = time;
      m.uniforms.uVisibility.value = f.visibility;
      m.uniforms.uNoiseScale.value = p.noiseScale;
      if (m.uniforms.uEnergy) m.uniforms.uEnergy.value = f.energy;
      if (m.uniforms.uSway) m.uniforms.uSway.value = MILO.idle.coat * (0.6 + f.energy * 0.6);
    });
    const pm = particles.material.uniforms;
    pm.uTime.value = time;
    pm.uVisibility.value = f.visibility;
    pm.uEnergy.value = f.energy;
    pm.uNoiseScale.value = p.noiseScale;
    pm.uDpr.value = st.gl.getPixelRatio();

    // cálculos secundários com frequência reduzida nos níveis baixos
    if (frameCount.current % secondaryEvery === 0) {
      rig.bones.chest.group.getWorldPosition(chestWorld);
      tmp.copy(chestWorld).project(camera);
      const ux = tmp.x * 0.5 + 0.5;
      const uy = tmp.y * 0.5 + 0.5;
      const k = Math.min(1, dt * 6);
      f.milo.vx += ((ux - prev.current.x) / Math.max(dt, 1e-3) * 0.06 - f.milo.vx) * k;
      f.milo.vy += ((uy - prev.current.y) / Math.max(dt, 1e-3) * 0.06 - f.milo.vy) * k;
      prev.current.x = ux;
      prev.current.y = uy;
      f.milo.x = ux;
      f.milo.y = uy;
      const a = useMiloStore.getState().targetPosition;
      anchor.set(a[0], a[1], a[2]).applyMatrix4(root.matrixWorld).project(camera);
      f.panel.x = anchor.x * 0.5 + 0.5;
      f.panel.y = anchor.y * 0.5 + 0.5;
    }
  });

  return (
    <>
      <primitive object={rig.root} />
      <primitive object={particles.points} />
    </>
  );
}
