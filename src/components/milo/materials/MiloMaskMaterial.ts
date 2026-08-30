import * as THREE from "three";
import { MASK_FRAG } from "../shaders/mask.frag.glsl";
import { MASK_VERT } from "../shaders/mask.vert.glsl";

/**
 * Material da silhueta (render target de máscara), um por parte:
 * `order` = ordem no dissolve, `zone` = quanto contorno pode revelar,
 * `fragment` = lado do torso parcialmente fragmentado, `coat` = balanço.
 */
export function createMaskMaterial({ coat = false, fresnelPower = 2.2, order = 0.5, zone = 0.5, fragment = 0, region = 0 }: { coat?: boolean; fresnelPower?: number; order?: number; zone?: number; fragment?: number; region?: number } = {}) {
  return new THREE.ShaderMaterial({
    vertexShader: MASK_VERT,
    fragmentShader: MASK_FRAG,
    defines: coat ? { COAT: 1 } : {},
    uniforms: {
      uTime: { value: 0 },
      uSway: { value: coat ? 1 : 0 },
      uWave: { value: 0 },
      uVisibility: { value: 1 },
      uNoiseScale: { value: 2.6 },
      uFresnelPower: { value: fresnelPower },
      uOrder: { value: order },
      uZone: { value: zone },
      uFragment: { value: fragment },
      uRegion: { value: region },
      uRoot: { value: new THREE.Vector3() },
      uRootRight: { value: new THREE.Vector3(1, 0, 0) },
    },
    side: coat ? THREE.DoubleSide : THREE.FrontSide,
    depthTest: true,
    depthWrite: true,
  });
}
