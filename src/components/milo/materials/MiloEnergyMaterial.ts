import * as THREE from "three";
import { ENERGY_FRAG, POINTS_VERT, WIRE_VERT } from "../shaders/energy.frag.glsl";

const shared = () => ({
  uTime: { value: 0 },
  uVisibility: { value: 1 },
  uEnergy: { value: 0 },
  uNoiseScale: { value: 2.6 },
  uInk: { value: new THREE.Color("#111111") },
  uSignal: { value: new THREE.Color("#B7FF37") },
});

/** Linhas estruturais (LineSegments). `zone` = densidade, `lime` = proporção acid lime, `order` = dissolve. */
export function createWireMaterial({ zone = 0.5, lime = 0, order = 0.5 }: { zone?: number; lime?: number; order?: number } = {}) {
  return new THREE.ShaderMaterial({
    vertexShader: WIRE_VERT,
    fragmentShader: ENERGY_FRAG,
    uniforms: { ...shared(), uLime: { value: lime }, uZone: { value: zone }, uOrder: { value: order } },
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
}

/** Partículas (Points) ancoradas nas articulações. */
export function createPointsMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: POINTS_VERT,
    fragmentShader: ENERGY_FRAG,
    defines: { POINTS: 1 },
    uniforms: {
      ...shared(),
      uZone: { value: 0.9 },
      uOrder: { value: 0.3 },
      uJoints: { value: Array.from({ length: 24 }, () => new THREE.Vector3()) },
      uDpr: { value: 1 },
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
}
