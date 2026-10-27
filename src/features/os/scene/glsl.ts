/**
 * GLSL compartilhado pelos materiais da cena (Three.js, `ShaderMaterial`:
 * o Three já prefixa versão, precisão e os atributos/matrizes padrão). Sem
 * crases nos comentários do GLSL — o código vive em template literals.
 *
 * Ruído por textura: `uNoise` é a textura 256² de semente fixa (noise.ts),
 * filtro linear e repetição. Uma leitura por oitava; como ela repete a cada
 * 256 unidades, amostrar com frequências que dividem 256 produz texturas
 * assadas sem emenda (bake.ts).
 */
export const GLSL_NOISE = /* glsl */ `
uniform sampler2D uNoise;
#define TAU 6.28318530718
#define PI 3.14159265359
float sat(float x) { return clamp(x, 0.0, 1.0); }
float remap(float x, float a, float b) { return sat((x - a) / (b - a)); }
float easeOut(float x) { float k = 1.0 - sat(x); return 1.0 - k * k * k; }
float smoothe(float x) { float k = sat(x); return k * k * (3.0 - 2.0 * k); }
mat2 rot(float a) { float c = cos(a); float s = sin(a); return mat2(c, s, -s, c); }
vec3 hash32(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yxz + 33.33);
  return fract((p3.xxy + p3.yzz) * p3.zyx);
}
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
vec3 nz3(vec2 x) {
  vec2 i = floor(x);
  vec2 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return texture2D(uNoise, (i + f + 0.5) / 256.0).rgb;
}
float nz(vec2 x) { return nz3(x).r; }
float nzb(vec2 x) { return texture2D(uNoise, (x + 0.5) / 256.0).r; }
const mat2 M2 = mat2(0.80, 0.60, -0.60, 0.80);
float fbm(vec2 p) {
  float s = 0.5 * nz(p);
  float a = 0.5;
  for (int i = 0; i < 3; i++) { p = M2 * p * 2.02 + vec2(7.31, 3.17); a *= 0.5; s += a * nzb(p); }
  return s * 1.0667;
}
float fbm3(vec2 p) {
  float s = 0.5 * nz(p);
  float a = 0.5;
  for (int i = 0; i < 2; i++) { p = M2 * p * 2.03 + vec2(3.11, 9.73); a *= 0.5; s += a * nzb(p); }
  return s * 1.1429;
}
/* ruido de valor PERIODICO (periodo per, em celulas): a grade e embrulhada antes da leitura — 4 leituras */
float pnz(vec2 x, vec2 per) {
  vec2 i = floor(x);
  vec2 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  vec2 i0 = mod(i, per);
  vec2 i1 = mod(i + 1.0, per);
  float a = texture2D(uNoise, (i0 + 0.5) / 256.0).r;
  float b = texture2D(uNoise, (vec2(i1.x, i0.y) + 0.5) / 256.0).r;
  float c = texture2D(uNoise, (vec2(i0.x, i1.y) + 0.5) / 256.0).r;
  float d = texture2D(uNoise, (i1 + 0.5) / 256.0).r;
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
/* fbm periodico para assar texturas sem emenda: p cobre per celulas na textura inteira; cada oitava dobra os dois */
float pfbm(vec2 p, vec2 per, int oct) {
  float s = 0.0;
  float a = 0.5;
  float n = 0.0;
  for (int i = 0; i < 6; i++) {
    if (i >= oct) break;
    s += a * pnz(p + vec2(float(i) * 37.0, float(i) * 91.0), per);
    n += a;
    p *= 2.0;
    per *= 2.0;
    a *= 0.5;
  }
  return s / n;
}
`;

/** Triângulo de tela inteira (posição já em clip space; `vUv` 0..1 na tela). */
export const FULLSCREEN_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;
