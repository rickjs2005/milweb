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

/** Wireframe fragmentado (LineSegments). `lime` = proporção acid lime (0..1). */
export function createWireMaterial(lime = 0) {
  return new THREE.ShaderMaterial({
    vertexShader: WIRE_VERT,
    fragmentShader: ENERGY_FRAG,
    uniforms: { ...shared(), uLime: { value: lime } },
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
      uJoints: { value: Array.from({ length: 24 }, () => new THREE.Vector3()) },
      uDpr: { value: 1 },
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
}
