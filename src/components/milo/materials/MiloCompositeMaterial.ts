import * as THREE from "three";
import { COMPOSITE_FRAG } from "../shaders/composite.frag.glsl";
import { COMPOSITE_VERT } from "../shaders/composite.vert.glsl";
import { GRID_FRAG } from "../shaders/grid.frag.glsl";
import { MILO } from "../milo.config";

export function createCompositeMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: COMPOSITE_VERT,
    fragmentShader: COMPOSITE_FRAG,
    uniforms: {
      tScene: { value: null },
      tMask: { value: null },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uTime: { value: 0 },
      uDistortionStrength: { value: MILO.shader.distortion },
      uEdgeStrength: { value: MILO.shader.edge },
      uNoiseScale: { value: MILO.shader.noiseScale },
      uNoiseSpeed: { value: MILO.shader.noiseSpeed },
      uVisibility: { value: 1 },
      uEnergy: { value: 0 },
      uScrollProgress: { value: 0 },
      uGlitch: { value: MILO.shader.glitch },
      uPanel: { value: 0 },
      uPanelUv: { value: new THREE.Vector2(0.7, 0.45) },
      uInk: { value: new THREE.Color("#111111") },
      uSignal: { value: new THREE.Color("#B7FF37") },
      uPaper: { value: new THREE.Color("#F2F0EA") },
      uNeutral: { value: new THREE.Color("#DAD8D1") },
      uCell: { value: MILO.grid.cell },
      uMajor: { value: MILO.grid.major },
    },
    depthTest: false,
    depthWrite: false,
  });
}

export function createGridMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: COMPOSITE_VERT,
    fragmentShader: GRID_FRAG,
    uniforms: {
      uResolution: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uCell: { value: MILO.grid.cell },
      uMajor: { value: MILO.grid.major },
      uPaper: { value: new THREE.Color("#F2F0EA") },
      uNeutral: { value: new THREE.Color("#DAD8D1") },
      uInk: { value: new THREE.Color("#111111") },
      uSignal: { value: new THREE.Color("#B7FF37") },
      uMilo: { value: new THREE.Vector2(0.6, 0.5) },
      uMiloVel: { value: new THREE.Vector2(0, 0) },
      uPulse: { value: 0 },
      uPulseAt: { value: new THREE.Vector2(0.5, 0.5) },
      uEnergy: { value: 0 },
    },
    depthTest: false,
    depthWrite: false,
  });
}
