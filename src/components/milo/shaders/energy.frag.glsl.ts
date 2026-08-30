import { NOISE_GLSL } from "./noise.glsl";

/**
 * Sinais de energia por cima do composite: wireframe fragmentado e
 * partículas. Só aparecem onde o ruído no espaço do mundo passa um limiar —
 * o limiar sobe com o dissolve (fragmentação) e desce com a energia.
 */
export const ENERGY_FRAG = /* glsl */ `
precision highp float;
uniform float uTime;
uniform float uVisibility;
uniform float uEnergy;
uniform float uNoiseScale;
uniform vec3 uInk;
uniform vec3 uSignal;
varying vec3 vWorldPos;
varying float vLime;
varying float vFade;
${NOISE_GLSL}
void main() {
  #ifdef POINTS
  vec2 c = gl_PointCoord - 0.5;
  if (dot(c, c) > 0.25) discard;
  #endif
  float n = fbm3n(vWorldPos * uNoiseScale * 1.9 + vec3(uTime * 0.18, -uTime * 0.11, 0.0));
  float thr = mix(0.86, 0.62, uEnergy) + (1.0 - uVisibility) * 0.5;
  #ifdef POINTS
  thr -= 0.45;
  #endif
  if (n < thr) discard;
  vec3 c3 = mix(uInk, uSignal, vLime * (0.35 + 0.65 * uEnergy));
  float a = smoothstep(thr, thr + 0.1, n) * vFade * 0.8;
  gl_FragColor = vec4(c3, a);
}
`;

export const WIRE_VERT = /* glsl */ `
varying vec3 vWorldPos;
varying float vLime;
varying float vFade;
uniform float uVisibility;
uniform float uLime;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  vLime = uLime;
  vFade = 0.55 + 0.45 * uVisibility;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

export const POINTS_VERT = /* glsl */ `
#define JOINTS 24
attribute float aJoint;
attribute vec3 aOffset;
attribute float aSeed;
attribute float aLime;
uniform vec3 uJoints[JOINTS];
uniform float uTime;
uniform float uVisibility;
uniform float uEnergy;
uniform float uDpr;
varying vec3 vWorldPos;
varying float vLime;
varying float vFade;
void main() {
  vec3 base = uJoints[int(aJoint)];
  float t = uTime * (0.5 + 0.4 * uEnergy) + aSeed * 6.2831;
  float away = 1.0 - uVisibility;
  vec3 wander = vec3(sin(t * 1.3 + aSeed * 3.0), cos(t * 0.9 + aSeed), sin(t * 1.7 + aSeed * 5.0)) * 0.022 * (0.35 + uEnergy);
  // campo procedural de fuga: radial + rotação + subida
  vec3 radial = normalize(aOffset + vec3(0.0001, 0.0, 0.0));
  vec3 swirl = vec3(-radial.z, 0.35, radial.x) * (0.4 + aSeed * 0.6);
  vec3 drift = (radial * (0.5 + aSeed * 0.9) + swirl * sin(aSeed * 9.0 + uTime * 0.7) + vec3(0.0, 0.6, 0.0)) * away * away * 0.9;
  vec3 p = base + aOffset * (1.0 + away * 1.8) + wander + drift;
  vWorldPos = p;
  vLime = aLime;
  vFade = (0.35 + 0.65 * uEnergy) * (1.0 - smoothstep(0.55, 1.0, away));
  vec4 mv = viewMatrix * vec4(p, 1.0);
  gl_PointSize = (1.6 + 2.4 * uEnergy + 1.6 * aLime) * uDpr * (6.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}
`;
