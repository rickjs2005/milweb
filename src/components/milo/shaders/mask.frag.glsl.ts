import { NOISE_GLSL } from "./noise.glsl";

/**
 * Máscara do Milo — fragment. Saída RGBA:
 *   rg = normal de vista (xy) codificada 0..1  → direção da distorção
 *   b  = fresnel (bordas) + borda do dissolve
 *   a  = 1 onde há corpo
 * `uVisibility` dissolve por limiar de ruído no espaço do mundo (a
 * silhueta perde continuidade, não some por fade).
 */
export const MASK_FRAG = /* glsl */ `
precision highp float;
uniform float uTime;
uniform float uVisibility;
uniform float uNoiseScale;
uniform float uFresnelPower;
varying vec3 vNormalView;
varying vec3 vWorldPos;
${NOISE_GLSL}
void main() {
  float cut = 1.0 - uVisibility;
  float n = fbm3n(vWorldPos * uNoiseScale + vec3(0.0, uTime * 0.12, 0.0));
  if (n < cut) discard;
  vec3 nv = normalize(vNormalView);
  if (!gl_FrontFacing) nv = -nv;
  float fres = pow(1.0 - clamp(nv.z, 0.0, 1.0), uFresnelPower);
  float edge = 1.0 - smoothstep(cut, cut + 0.07, n);
  gl_FragColor = vec4(nv.xy * 0.5 + 0.5, max(fres, edge), 1.0);
}
`;
