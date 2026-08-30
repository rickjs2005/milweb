import { NOISE_GLSL } from "./noise.glsl";

/**
 * Máscara do Milo — fragment. Saída RGBA:
 *   rg = normal de vista (xy) 0..1        → direção da distorção
 *   b  = fresnel (bordas) + borda do dissolve → falloff centro→borda
 *   a  = 0 fora · 0.5 corpo · 0.5..1 = corpo + "âncora" revelada
 *        (só partes específicas da silhueta ganham contorno)
 * Dissolve por limiar de ruído no espaço do mundo com ORDEM por parte
 * (casaco e extremidades primeiro, peito e cabeça por último) e um lado do
 * torso parcialmente fragmentado (uFragment) — assinatura da silhueta.
 */
export const MASK_FRAG = /* glsl */ `
precision highp float;
uniform float uTime;
uniform float uVisibility;
uniform float uNoiseScale;
uniform float uFresnelPower;
uniform float uOrder;
uniform float uZone;
uniform float uFragment;
uniform vec3 uRoot;
uniform vec3 uRootRight;
varying vec3 vNormalView;
varying vec3 vWorldPos;
${NOISE_GLSL}
void main() {
  // dissolve com ordem: cada parte tem a sua janela dentro de (1 - visibility)
  float gone = 1.0 - uVisibility;
  float cut = clamp(gone * 1.7 - uOrder * 0.7, 0.0, 1.0);
  float n = fbm3n(vWorldPos * uNoiseScale + vec3(0.0, uTime * 0.12, 0.0));
  if (n < cut) discard;

  // lado fragmentado do torso: buracos no lado +x (esquerda do Milo)
  if (uFragment > 0.0) {
    float dx = dot(vWorldPos - uRoot, uRootRight);
    float side = smoothstep(0.04, 0.26, dx) * uFragment;
    float holes = fbm3n(vWorldPos * 5.5 + vec3(2.0, uTime * 0.05, 0.0));
    if (holes < 0.5 * side) discard;
  }

  vec3 nv = normalize(vNormalView);
  if (!gl_FrontFacing) nv = -nv;
  float fres = pow(1.0 - clamp(nv.z, 0.0, 1.0), uFresnelPower);
  float edge = 1.0 - smoothstep(cut, cut + 0.07, n);

  // âncoras: contorno só onde a zona e um ruído lento (quase estático) permitem
  float anchor = uZone * smoothstep(0.42, 0.7, fbm3n(vWorldPos * 1.7 + vec3(0.3, uTime * 0.015, 0.0)));
  gl_FragColor = vec4(nv.xy * 0.5 + 0.5, max(fres, edge), 0.5 + 0.5 * max(anchor, edge));
}
`;
