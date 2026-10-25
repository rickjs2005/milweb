import type { Floater } from "./scene.config";

/**
 * GLSL comum aos dois universos (WebGL 1 / GLSL ES 1.0). Sem crases em
 * comentários do GLSL: o shader vive numa template literal.
 *
 * Espaço da composição: q = (pixel − uC) / uR — a lua/o portal têm raio 1 e
 * centro em 0,0; y para cima. Tudo é posicionado nesse espaço, então o mesmo
 * shader serve o desktop (lua cortada em cima e embaixo), o telefone (cortada
 * nas laterais) e as imagens estáticas.
 *
 * Uniforms da travessia (os dois mundos recebem os mesmos nomes):
 *   uLeave  0..1  progresso da saída deste mundo (0 = em cena)
 *   uEnter  0..1  progresso da chegada (1 = em cena)
 *   uWave   xy = origem da onda (o controle de tema, px do canvas), z = progresso da onda 0..1
 *           (0 = ainda não saiu, 1 = já passou por tudo; −1 = sem travessia)
 */
export const SCENE_GLSL_COMMON = /* glsl */ `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;
uniform vec2 uC;
uniform float uR;
uniform float uTime;
uniform vec2 uPar;
uniform float uEnter;
uniform float uLeave;
uniform vec3 uWave;
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

/* ruído de valor suave: uma leitura da textura (filtro linear + interpolação suavizada) */
vec3 nz3(vec2 x) {
  vec2 i = floor(x);
  vec2 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return texture2D(uNoise, (i + f + 0.5) / 256.0).rgb;
}
float nz(vec2 x) { return nz3(x).r; }
/* oitava alta: leitura bilinear crua (a interpolacao suavizada so importa nas oitavas baixas) */
float nzb(vec2 x) { return texture2D(uNoise, (x + 0.5) / 256.0).r; }

const mat2 M2 = mat2(0.80, 0.60, -0.60, 0.80);
float fbm(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  s += a * nz(p);
  for (int i = 0; i < 3; i++) { p = M2 * p * 2.02 + vec2(7.31, 3.17); a *= 0.5; s += a * nzb(p); }
  return s * 1.0667;
}
float fbm3(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  s += a * nz(p);
  for (int i = 0; i < 2; i++) { p = M2 * p * 2.03 + vec2(3.11, 9.73); a *= 0.5; s += a * nzb(p); }
  return s * 1.1429;
}

/* Onda que nasce no controle de tema: deslocamento radial (px) na frente de onda e a intensidade da frente. */
vec3 ripple(vec2 frag) {
  float k = uWave.z;
  if (k <= 0.0 || k >= 1.0) return vec3(0.0);
  vec2 d = frag - uWave.xy;
  float dist = length(d);
  float maxR = length(uRes) * 1.02;
  float x = (dist - k * maxR) / (maxR * (0.035 + 0.05 * k));
  float g = exp(-x * x);
  float fade = (1.0 - k) * (1.0 - k);
  vec2 dir = d / max(dist, 1.0);
  return vec3(dir * (-x * g) * uR * (0.055 * fade + 0.01), g * (0.3 + 0.7 * fade));
}

/* 1 onde a onda já passou (ou sem travessia), 0 à frente dela */
float waveBehind(vec2 frag) {
  float k = uWave.z;
  if (k < 0.0 || k >= 1.0) return 1.0;
  float maxR = length(uRes) * 1.02;
  return smoothstep(k * maxR + maxR * 0.03, k * maxR - maxR * 0.12, length(frag - uWave.xy));
}

/* vinheta e coordenadas de tela 0..1 */
float vignette(vec2 frag) {
  vec2 sp = frag / uRes - 0.5;
  sp.x *= uRes.x / uRes.y;
  return smoothstep(1.15, 0.25, length(sp));
}
`;

/** Número GLSL (sempre com ponto decimal). */
export const f = (n: number) => {
  const s = (Math.round(n * 1e5) / 1e5).toString();
  return s.includes(".") || s.includes("e") ? s : s + ".0";
};

/**
 * Gera um bloco GLSL por elemento solto (rochas, estilhaços): posição,
 * flutuação e giro vêm da semente — o desenho fica na função `body`, que
 * recebe o nome das variáveis locais (lp, c, sc, S, seed, z).
 */
export function floatersGLSL(list: Floater[], body: string): string {
  return list
    .map((r) => {
      const bob = 0.006 + 0.01 * ((r.seed * 7.13) % 1);
      const w = 0.22 + 0.25 * ((r.seed * 3.71) % 1);
      const rot0 = ((r.seed * 2.39) % 1) * 6.2832;
      return `{
    float z = ${f(r.z)};
    float S = ${f(r.s)};
    float seed = ${f(r.seed)};
    float sc = scl(z);
    vec2 c = vec2(${f(r.x)}, ${f(r.y)} + ${f(bob)} * sin(uTime * ${f(w)} + seed * 3.0));
    vec2 rp = lay(q, z, 0.032 / z);
    vec2 lp = rot(${f(rot0)} + 0.07 * sin(uTime * ${f(w * 0.63)} + seed)) * (rp - c) / S;
    if (dot(lp, lp) < 2.9) {
${body}
    }
  }`;
    })
    .join("\n");
}
