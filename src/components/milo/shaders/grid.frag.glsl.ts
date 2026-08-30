import { NOISE_GLSL } from "./noise.glsl";

/**
 * Fundo WebGL: papel off-white com grid técnica (menor/maior), leve textura
 * de papel, deslocamento da grid provocado pelo movimento do Milo
 * (uMilo/uMiloVel) e a linha acid lime que percorre a grid a partir do
 * ponto de contato (uPulse 0→1, uPulseAt).
 */
export const GRID_FRAG = /* glsl */ `
precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform float uCell;
uniform float uMajor;
uniform vec3 uPaper;
uniform vec3 uNeutral;
uniform vec3 uInk;
uniform vec3 uSignal;
uniform vec2 uMilo;
uniform vec2 uMiloVel;
uniform float uPulse;
uniform vec2 uPulseAt;
uniform float uEnergy;
varying vec2 vUv;
${NOISE_GLSL}

float lineMask(vec2 px, float cell, float width) {
  vec2 g = mod(px, cell);
  vec2 d = min(g, cell - g);
  return 1.0 - smoothstep(width - 0.6, width + 0.6, min(d.x, d.y));
}

void main() {
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 uv = vUv;
  // deslocamento do fundo pelo movimento do corpo (bolha de influência)
  vec2 d = (uv - uMilo) * aspect;
  float infl = exp(-dot(d, d) * 14.0);
  uv -= uMiloVel * infl * 0.5;

  vec2 px = uv * uResolution;
  float minor = lineMask(px, uCell, 0.6);
  float major = lineMask(px, uCell * uMajor, 0.7);
  float paperNoise = noise2(px * 0.35) * 0.018 - 0.009;
  vec3 col = uPaper + paperNoise;
  col = mix(col, uNeutral, minor * 0.85);
  col = mix(col, mix(uNeutral, uInk, 0.4), major * 0.6);

  // marcas de régua nos cruzamentos maiores
  vec2 gm = mod(px, uCell * uMajor);
  float cross = step(gm.x, 1.2) * step(gm.y, 5.0) + step(gm.y, 1.2) * step(gm.x, 5.0);
  col = mix(col, uInk, clamp(cross, 0.0, 1.0) * 0.35);

  // pulso: anel que corre pela grid a partir do contato
  if (uPulse > 0.0) {
    vec2 pd = (uv - uPulseAt) * aspect;
    float r = length(pd);
    float radius = uPulse * 1.6;
    float ring = 1.0 - smoothstep(0.0, 0.035, abs(r - radius));
    float onLine = max(minor, major);
    float fade = (1.0 - uPulse) * (1.0 - uPulse);
    col = mix(col, uSignal, ring * onLine * fade * 1.2);
    // faísca no centro nos primeiros instantes
    col = mix(col, uSignal, exp(-r * r * 900.0) * fade * 0.8);
  }
  gl_FragColor = vec4(col, 1.0);
}
`;
