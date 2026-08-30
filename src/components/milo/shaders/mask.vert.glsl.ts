/**
 * Máscara do Milo — vertex. Normais em ESPAÇO DE VISTA (xy = direção na
 * tela, é o que o composite usa para deslocar o fundo). O casaco (COAT)
 * balança devagar e recebe uma onda curta no contato com o painel (uWave).
 */
export const MASK_VERT = /* glsl */ `
uniform float uTime;
uniform float uSway;
uniform float uWave;
varying vec3 vNormalView;
varying vec3 vWorldPos;
void main() {
  vec3 p = position;
  #ifdef COAT
  float w = uv.y * uv.y * uSway;
  p.x += sin(uTime * 0.9 + position.y * 3.2 + position.z * 2.0) * 0.014 * w;
  p.z += cos(uTime * 0.7 + position.x * 4.1) * 0.011 * w;
  p.y += sin(uTime * 0.55 + position.x * 2.3) * 0.006 * w;
  // onda do contato: percorre dos ombros à bainha e some
  float wave = sin(uv.y * 9.0 - uWave * 12.0) * uWave * (1.0 - uWave) * 4.0;
  p.x += wave * 0.025 * uv.y;
  p.z += wave * 0.012 * uv.y;
  #endif
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vWorldPos = wp.xyz;
  vNormalView = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;
