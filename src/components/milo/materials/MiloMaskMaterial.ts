import * as THREE from "three";
import { MASK_FRAG } from "../shaders/mask.frag.glsl";
import { MASK_VERT } from "../shaders/mask.vert.glsl";

/** Material da silhueta (render target de máscara). `coat` liga o balanço do casaco. */
export function createMaskMaterial({ coat = false, fresnelPower = 2.2 }: { coat?: boolean; fresnelPower?: number } = {}) {
  return new THREE.ShaderMaterial({
    vertexShader: MASK_VERT,
    fragmentShader: MASK_FRAG,
    defines: coat ? { COAT: 1 } : {},
    uniforms: {
      uTime: { value: 0 },
      uSway: { value: coat ? 1 : 0 },
      uVisibility: { value: 1 },
      uNoiseScale: { value: 2.6 },
      uFresnelPower: { value: fresnelPower },
    },
    side: coat ? THREE.DoubleSide : THREE.FrontSide,
    depthTest: true,
    depthWrite: true,
  });
}
