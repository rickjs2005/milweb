/** Ruído de valor 2D/3D + hash — compartilhado pelos shaders do Milo (GLSL ES 1.0). */
export const NOISE_GLSL = /* glsl */ `
float hash1(float n) { return fract(sin(n) * 43758.5453123); }
float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float hash3(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123); }
float noise2(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash2(i), hash2(i + vec2(1.0, 0.0)), f.x), mix(hash2(i + vec2(0.0, 1.0)), hash2(i + vec2(1.0, 1.0)), f.x), f.y);
}
float noise3(vec3 p) {
  vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  float n000 = hash3(i), n100 = hash3(i + vec3(1.0, 0.0, 0.0)), n010 = hash3(i + vec3(0.0, 1.0, 0.0)), n110 = hash3(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash3(i + vec3(0.0, 0.0, 1.0)), n101 = hash3(i + vec3(1.0, 0.0, 1.0)), n011 = hash3(i + vec3(0.0, 1.0, 1.0)), n111 = hash3(i + vec3(1.0, 1.0, 1.0));
  return mix(mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y), mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y), f.z);
}
float fbm3(vec3 p) { return noise3(p) * 0.62 + noise3(p * 2.1 + 3.7) * 0.26 + noise3(p * 4.3 + 9.1) * 0.12; }
/* fbm reespalhado para 0..1 (o fbm cru concentra-se em ~0,5) — limiares de dissolve/fragmentação usam este */
float fbm3n(vec3 p) { return smoothstep(0.28, 0.72, fbm3(p)); }
`;
