import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  IcosahedronGeometry,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
  type IUniform,
  type Texture,
} from "three";
import { FULLSCREEN_VERT, GLSL_NOISE } from "./glsl";
import { F, TSUKU, OS_SCENE } from "./scene.config";
import { frameCamera, fullscreenGeometry, place, seeded, type FrameCtx, type World } from "./world";
import type { Baked } from "./bake";

/**
 * TSUKUYOMI — o universo do tema Obito (escuro), em profundidade real.
 *
 *   céu        triângulo de tela inteira: degradê, nebulosa, estrelas cintilando, névoa vermelha larga
 *   lua        esfera (z 12) com a superfície assada (mares, crateras com borda), relevo por derivadas,
 *              luz principal do alto à direita, aro atmosférico; gira devagar no eixo; o padrão
 *              (pupila, três anéis pontilhados, nove tomoe) pintado em espaço de tela, cada anel
 *              num ritmo e sentido; uma faixa de luz varre a superfície de tempos em tempos
 *   halo       no próprio céu, atrás da lua: halo e feixes vermelhos girando, respirando
 *   nuvens     sete faixas (z 5–11) com a textura assada, cada uma na própria velocidade e sentido,
 *              bordas finas acesas por trás quando passam na frente da lua
 *   rochas     icosaedros deformados (facetas), luz principal + aro vermelho do lado da lua,
 *              cada uma girando no próprio eixo e oscilando
 *   brasas     pontos orbitando o eixo da lua em várias profundidades, subindo e cintilando;
 *              o app destacado as puxa para perto; na saída elas explodem para a câmera
 *   névoa      dois planos de névoa em deriva, avermelhados perto da lua
 *
 * Saída (leave): a luz vermelha vira brasas que voam para fora e a câmera avança pela cena.
 * Chegada (enter): névoa espessa que se dissipa e o padrão acendendo anel por anel.
 */
const SKY = /* glsl */ `
${GLSL_NOISE}
uniform sampler2D uFog;
uniform vec2 uMoonC;
uniform float uMoonR;
uniform float uTime;
uniform float uLight;
uniform vec2 uPar;
varying vec2 vUv;
const vec3 SKY_TOP = vec3(0.008, 0.005, 0.013);
const vec3 SKY_BOT = vec3(0.052, 0.013, 0.02);
const vec3 HAZE = vec3(0.62, 0.075, 0.055);
void main() {
  vec2 q = (gl_FragCoord.xy - uMoonC) / uMoonR;
  float r = length(q);
  vec3 col = mix(SKY_BOT, SKY_TOP, smoothstep(-1.4, 1.1, q.y));
  vec2 qn = q + uPar * 0.02;
  /* nebulosa: a nevoa larga assada (uma leitura), em deriva lenta */
  col += vec3(0.08, 0.011, 0.02) * smoothstep(0.3, 1.0, texture2D(uFog, qn * 0.3 + vec2(uTime * 0.0015, 0.2)).g);
  col += HAZE * (0.24 * exp(-max(r - 1.0, 0.0) * 2.6) + 0.05 * exp(-max(r - 1.0, 0.0) * 0.7)) * uLight;
  /* halo e feixes atras da lua: giram devagar e respiram */
  vec2 dir = q / max(r, 1e-3);
  float rays = nz(rot(uTime * 0.035) * dir * 4.0 + vec2(uTime * 0.05, 0.0)) * 0.6 + nz(rot(-uTime * 0.025) * dir * 11.0 + 2.0) * 0.4;
  rays = pow(smoothstep(0.35, 0.85, rays), 2.0);
  float shaft = rays * smoothstep(0.97, 1.1, r) * exp(-(r - 1.0) * 1.15);
  float halo = exp(-max(r - 1.0, 0.0) * 3.2) * smoothstep(0.9, 1.0, r);
  float breathe = 0.86 + 0.1 * sin(uTime * 0.8) + 0.06 * sin(uTime * 2.1 + 1.3);
  col += HAZE * (halo * 0.55 + shaft * 1.05) * uLight * breathe;
  if (r > 1.04) {
    vec2 g = (qn + uPar * 0.01) * 15.0;
    vec3 h = hash32(floor(g));
    float d = length(fract(g) - 0.5 - (h.xy - 0.5) * 0.7);
    if (h.z > 0.84 && d < 0.08) {
      float tw = 0.4 + 0.6 * sin(uTime * (1.1 + 2.6 * h.x) + h.y * TAU);
      col += vec3(1.0, 0.86, 0.82) * smoothstep(0.08, 0.0, d) * tw * (0.25 + 0.65 * h.y) * smoothstep(1.04, 1.5, r);
    }
  }
  gl_FragColor = vec4(col, 1.0);
}
`;

const MOON_VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vPosV;
varying vec3 vObjN;
void main() {
  vObjN = normal;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vPosV = mv.xyz;
  vN = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * mv;
}
`;

const MOON_FRAG = /* glsl */ `
${GLSL_NOISE}
uniform sampler2D uAlb;
uniform vec2 uMoonC;
uniform float uMoonR;
uniform float uTime;
uniform float uSpin;
uniform vec3 uKey;
uniform float uLight;
uniform vec3 uRings;
uniform vec3 uVis;
uniform float uSpinBoost;
uniform float uShat;
varying vec3 vN;
varying vec3 vPosV;
varying vec3 vObjN;
const vec3 INK = vec3(0.10, 0.018, 0.026);

/* tomoe: peixe do yin-yang (cabeca na origem, raio h), cauda encurtada */
float tomoe(vec2 p, float h) {
  vec2 pp = vec2(p.x, p.y > 0.0 ? p.y * 1.12 : p.y);
  float d = max(length(pp - vec2(0.0, h)) - 2.0 * h, pp.x);
  d = min(d, length(pp) - h);
  return max(d, h - length(pp - vec2(0.0, 2.0 * h)));
}
/* um anel: pontos + o tomoe mais proximo (repeticao angular, 3 por anel) */
float ringPart(float r, float ang, float R, float base, float ph, float h) {
  float n = floor(TAU * R / 0.0205);
  float cell = (ang + ph) / TAU * n;
  vec3 hh = hash32(vec2(mod(floor(cell), n), R * 97.0));
  float along = (fract(cell) - 0.5) * TAU * R / n;
  float across = r - R - (hh.x - 0.5) * 0.004;
  float pulse = 0.85 + 0.3 * sin(ang * 3.0 - uTime * 1.3 + R * 9.0);
  float d = length(vec2(along * 0.78, across)) - 0.0050 * (0.75 + 0.5 * hh.y) * pulse;
  float sec = TAU / 3.0;
  float al = mod(ang - base + ph + sec * 0.5, sec) - sec * 0.5;
  vec2 p = r * vec2(cos(al), sin(al)) - vec2(R, 0.0);
  return min(d, tomoe(vec2(dot(p, vec2(0.4794, -0.8776)), dot(p, vec2(0.8776, 0.4794))), h));
}
float sweep(float ang, float v) {
  float a = fract((1.5708 - ang) / TAU + 1.0);
  return smoothstep(v, v - 0.05, a) * step(0.001, v);
}
vec2 dHdxy(vec2 uv) {
  vec2 dx = dFdx(uv);
  vec2 dy = dFdy(uv);
  float h0 = texture2D(uAlb, uv).a;
  return vec2(texture2D(uAlb, uv + dx).a - h0, texture2D(uAlb, uv + dy).a - h0);
}
vec3 bump(vec3 pos, vec3 n, vec2 dh) {
  vec3 sx = normalize(dFdx(pos));
  vec3 sy = normalize(dFdy(pos));
  vec3 r1 = cross(sy, n);
  vec3 r2 = cross(n, sx);
  float det = dot(sx, r1);
  vec3 grad = sign(det) * (dh.x * r1 + dh.y * r2);
  return normalize(abs(det) * n - grad);
}
void main() {
  vec3 n0 = normalize(vN);
  vec3 V = normalize(-vPosV);
  float ang0 = atan(vObjN.x, vObjN.z);
  vec2 uv = vec2(ang0 / TAU + 0.5 + uTime * uSpin, acos(clamp(vObjN.y, -1.0, 1.0)) / PI);
  vec4 tex = texture2D(uAlb, uv);
  vec3 n = bump(vPosV, n0, dHdxy(uv) * 9.0);
  float ndl = dot(n, uKey);
  float wrap = pow(sat((ndl + 0.18) / 1.18), 1.35);
  float facing = sat(dot(n0, V));
  vec3 col = tex.rgb * (0.1 + 1.28 * wrap);
  col += tex.rgb * vec3(0.4, 0.07, 0.05) * (1.0 - wrap) * 0.5;
  col *= mix(0.4, 1.0, pow(facing, 0.5));
  /* a lua do Tsukuyomi brilha por conta propria: um pouco de emissao quente no centro */
  col += tex.rgb * vec3(0.22, 0.07, 0.05) * pow(facing, 2.0);
  /* sombras de nuvens altas atravessando a superficie */
  vec2 q = (gl_FragCoord.xy - uMoonC) / uMoonR;
  col *= 1.0 - smoothstep(0.55, 0.86, nz(q * 1.9 + vec2(uTime * 0.05, uTime * 0.012) + 40.0)) * 0.22;
  /* faixa de luz que varre a lua a cada ~14 s */
  float ph = fract(uTime / 14.0) * 3.4 - 1.7;
  col += vec3(0.42, 0.14, 0.08) * exp(-pow((dot(q, vec2(0.8, 0.6)) - ph) / 0.28, 2.0)) * 0.22 * uLight;
  /* aro atmosferico */
  col += vec3(0.9, 0.24, 0.14) * pow(1.0 - facing, 2.4) * 0.5 * uLight;
  /* o padrao */
  float r = length(q);
  float ang = atan(q.y, q.x);
  float aa = 1.4 / uMoonR;
  float h = 0.056;
  vec3 spin = uRings * uTime + vec3(-uSpinBoost, uSpinBoost * 0.75, -uSpinBoost * 0.5);
  float dm = r - 0.072 + (1.0 - smoothe(uVis.x * 1.6)) * 0.08;
  bool lit = uVis.z >= 1.0;
  if (abs(r - 0.262) < 0.17) { float d1 = ringPart(r, ang, 0.262, 1.5708, spin.x, h); dm = min(dm, lit ? d1 : d1 + (1.0 - sweep(ang, uVis.x * 1.06)) * 0.2); }
  if (abs(r - 0.462) < 0.17) { float d2 = ringPart(r, ang, 0.462, 0.5236, spin.y, h); dm = min(dm, lit ? d2 : d2 + (1.0 - sweep(ang, uVis.y * 1.06)) * 0.2); }
  if (abs(r - 0.742) < 0.17) { float d3 = ringPart(r, ang, 0.742, 1.5708, spin.z, h); dm = min(dm, lit ? d3 : d3 + (1.0 - sweep(ang, uVis.z * 1.06)) * 0.2); }
  float ink = smoothstep(aa, -aa, dm);
  float hatch = nzb(rot(1.1) * q * vec2(70.0, 150.0));
  vec3 inkC = INK * (0.8 + 0.45 * hatch) * (0.55 + 0.6 * wrap) + col * 0.1;
  col *= 1.0 - smoothstep(0.03, 0.0, dm) * 0.22 * (1.0 - ink);
  col = mix(col, inkC, ink * 0.94);
  col *= (0.97 + 0.03 * sin(uTime * 0.7)) * (1.0 - uShat * 0.35);
  gl_FragColor = vec4(col, 1.0);
}
`;

const PLANE_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const CLOUD_FRAG = /* glsl */ `
uniform sampler2D uTex;
uniform vec2 uMoonC;
uniform float uMoonR;
uniform float uTime;
uniform float uSpeed;
uniform float uRepeat;
uniform float uOffset;
uniform float uAlpha;
uniform float uLit;
uniform float uLight;
uniform float uMist;
uniform vec3 uKind;
uniform vec2 uScale;
varying vec2 vUv;
float sat(float x) { return clamp(x, 0.0, 1.0); }
/* densidade da camada: o canal do tipo; bancos ganham corpo embaixo e um topo recortado */
float dens(vec2 uv, float y) {
  float d = dot(texture2D(uTex, uv).rgb, uKind);
  return d + uKind.y * ((1.0 - y) * 0.55 - 0.18);
}
void main() {
  vec2 uv = vec2(vUv.x * uRepeat + uOffset + uTime * uSpeed, vUv.y * 0.5 + uOffset * 0.37);
  float d = dens(uv, vUv.y);
  float prof = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.62, vUv.y);
  vec2 q = (gl_FragCoord.xy - uMoonC) / uMoonR;
  float rq = length(q);
  /* a lua e a fonte de luz: na frente do disco ela vem de tras (as bordas finas acendem);
     fora dele vem do lado da lua (o lado voltado para ela clareia, a densidade cai nessa direcao) */
  vec2 toMoon = -q / max(rq, 1e-3);
  float d2 = dens(uv + toMoon * uScale * 0.035, vUv.y + toMoon.y * uScale.y * 0.07);
  float inMoon = smoothstep(1.03, 0.9, rq);
  float nearMoon = exp(-max(rq - 0.95, 0.0) * 2.2);
  float a = smoothstep(0.06, 0.55, d) * prof * uAlpha;
  float rim = smoothstep(0.0, 0.16, d) * (1.0 - smoothstep(0.14, 0.72, d));
  float face = sat((d - d2) * 6.0) * (1.0 - inMoon * 0.6);
  float L = uLit * uLight;
  vec3 core = mix(vec3(0.035, 0.01, 0.014), vec3(0.1, 0.022, 0.026), nearMoon * 0.8);
  core *= 0.65 + 0.9 * face * L;
  vec3 glow = vec3(1.0, 0.36, 0.2) * (rim * inMoon * 0.8 + face * nearMoon * 0.5) * L;
  /* alfa pre-multiplicado: o corpo cobre, a borda acesa soma luz quase sem cobrir */
  vec3 col = core * a + glow * prof * uAlpha * 0.85;
  col = mix(col, vec3(0.34, 0.05, 0.045) * a, uMist * 0.5);
  gl_FragColor = vec4(col, clamp(a * (1.0 + uMist * 0.6), 0.0, 1.0));
}
`;

const FOG_FRAG = /* glsl */ `
uniform sampler2D uTex;
uniform vec2 uMoonC;
uniform float uMoonR;
uniform float uTime;
uniform vec2 uDrift;
uniform float uAlpha;
uniform float uLight;
uniform float uMist;
varying vec2 vUv;
void main() {
  vec2 uv = vUv * vec2(2.0, 1.2) + uDrift * uTime;
  /* uma leitura por plano: os dois planos, em profundidades e derivas diferentes, fazem a nevoa evoluir */
  vec3 f = texture2D(uTex, uv).rgb;
  float m = f.r * 0.7 + f.g * 0.45 + f.b * 0.25;
  float edge = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x) * smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
  vec2 q = (gl_FragCoord.xy - uMoonC) / uMoonR;
  float near = exp(-max(length(q) - 0.7, 0.0) * 1.4);
  vec3 col = mix(vec3(0.05, 0.012, 0.016), vec3(0.5, 0.08, 0.06), near * uLight * 0.8);
  float a = smoothstep(0.25, 0.85, m) * edge * uAlpha * (1.0 + uMist * 2.2);
  gl_FragColor = vec4(col, clamp(a, 0.0, 0.92));
}
`;

const ROCK_VERT = /* glsl */ `
attribute vec3 aTint;
varying vec3 vN;
varying vec3 vPosV;
varying vec3 vTint;
void main() {
  vTint = aTint;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vPosV = mv.xyz;
  vN = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * mv;
}
`;

const ROCK_FRAG = /* glsl */ `
uniform vec3 uKey;
uniform vec3 uMoonV;
uniform float uLight;
uniform float uFade;
varying vec3 vN;
varying vec3 vPosV;
varying vec3 vTint;
void main() {
  vec3 n = normalize(vN);
  vec3 V = normalize(-vPosV);
  vec2 toMoon = normalize(uMoonV.xy - vPosV.xy + 1e-4);
  float key = max(dot(n, uKey), 0.0);
  float side = max(dot(n.xy, toMoon), 0.0);
  float rim = pow(1.0 - abs(dot(n, V)), 2.0);
  vec3 base = vec3(0.075, 0.046, 0.046) * vTint;
  vec3 col = base * (0.28 + 0.85 * key);
  col += vec3(0.55, 0.13, 0.08) * side * 0.45 * uLight;
  col += vec3(1.0, 0.38, 0.22) * rim * (0.3 + 0.7 * side) * 1.35 * uLight;
  gl_FragColor = vec4(col * uFade, 1.0);
}
`;

const EMBER_VERT = /* glsl */ `
attribute vec4 aSeed;
uniform float uTime;
uniform float uFocal;
uniform float uBurst;
uniform vec4 uHover;
uniform vec2 uRes;
varying float vA;
varying vec3 vCol;
const float F = ${F.toFixed(1)};
void main() {
  float z = mix(2.2, 15.0, aSeed.z * aSeed.z);
  float dir = fract(aSeed.w * 7.13) > 0.5 ? 1.0 : -1.0;
  float ang = aSeed.y * 6.2832 + uTime * (0.035 + 0.13 * aSeed.w) * dir;
  float rad = (0.45 + 2.3 * aSeed.x) * z / F;
  vec3 p = vec3(cos(ang) * rad, sin(ang) * rad * 0.58, -z);
  float span = 4.0 * z / F;
  p.y += mod(aSeed.w * span + uTime * (0.03 + 0.08 * aSeed.x) * z / F, span) - span * 0.5;
  p.x += sin(uTime * (0.6 + aSeed.x) + aSeed.y * 9.0) * 0.05 * z / F;
  /* saida: as brasas explodem para fora e passam pela camera */
  p.xy *= 1.0 + 1.6 * uBurst * uBurst;
  p.z += uBurst * uBurst * 9.0 * (0.4 + aSeed.z);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vec4 clip = projectionMatrix * mv;
  /* app destacado: as brasas perto dele sao puxadas e acendem */
  vec2 ndc = clip.xy / clip.w;
  vec2 hp = (uHover.xy / uRes) * 2.0 - 1.0;
  vec2 hd = (hp - ndc) * vec2(uRes.x / uRes.y, 1.0);
  float hk = uHover.z * exp(-dot(hd, hd) / (uHover.w * uHover.w));
  clip.xy += (hp - ndc) * hk * 0.45 * clip.w;
  gl_Position = clip;
  float depth = max(-mv.z, 0.4);
  gl_PointSize = (0.016 + 0.05 * fract(aSeed.x * 13.7)) * uFocal / depth;
  float tw = 0.55 + 0.45 * sin(uTime * (1.3 + 2.5 * aSeed.w) + aSeed.y * 20.0);
  vA = tw * (0.35 + 0.65 * fract(aSeed.y * 3.1)) * (1.0 + 1.6 * hk) * (1.0 + 1.4 * uBurst) * smoothstep(0.4, 1.6, depth);
  vCol = mix(vec3(1.0, 0.36, 0.16), vec3(1.0, 0.74, 0.5), fract(aSeed.z * 5.3) * fract(aSeed.z * 5.3));
}
`;

const EMBER_FRAG = /* glsl */ `
varying float vA;
varying vec3 vCol;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.05, d);
  a *= a;
  gl_FragColor = vec4(vCol * a * vA, 1.0);
}
`;

type U = Record<string, IUniform>;

export function createTsukuyomi(baked: Baked, opts: { particles: number }): World {
  const scene = new Scene();
  const camera = new PerspectiveCamera(40, 1, 0.1, 400);
  const rnd = seeded(0x51a1);
  const disposables: { dispose(): void }[] = [];
  const shared = {
    uTime: { value: 0 },
    uLight: { value: 1 },
    uMoonC: { value: [0, 0] as [number, number] },
    uMoonR: { value: 300 },
    uNoise: { value: baked.noise },
    uKey: { value: new Vector3(0.76, 0.46, 0.46).normalize() },
    uMist: { value: 0 },
  };

  // ---- céu ----
  const skyGeo = fullscreenGeometry();
  const skyMat = new ShaderMaterial({ vertexShader: FULLSCREEN_VERT, fragmentShader: SKY, depthTest: false, depthWrite: false, uniforms: { ...pick(shared, "uTime", "uLight", "uMoonC", "uMoonR", "uNoise"), uFog: { value: baked.fog }, uPar: { value: [0, 0] } } });
  const sky = new Mesh(skyGeo, skyMat);
  sky.frustumCulled = false;
  sky.renderOrder = -100;
  scene.add(sky);
  disposables.push(skyGeo, skyMat);

  // ---- lua ----
  const moonZ = TSUKU.moon.z;
  const moonRW = moonZ / Math.sqrt(F * F + 1); // raio cuja silhueta projeta exatamente 1 raio do palco
  const moonGeo = new SphereGeometry(moonRW, 96, 64);
  // A lua é pano de fundo: não escreve profundidade (a frente da esfera fica a 0,55 × a distância dela e
  // esconderia nuvens e rochas que estão "na frente"); a ordem das camadas fica com a profundidade de cada uma.
  const moonMat = new ShaderMaterial({
    vertexShader: MOON_VERT,
    fragmentShader: MOON_FRAG,
    depthWrite: false,
    uniforms: {
      ...pick(shared, "uTime", "uLight", "uMoonC", "uMoonR", "uNoise", "uKey"),
      uAlb: { value: baked.moon },
      uSpin: { value: TSUKU.moon.spin },
      uRings: { value: new Vector3(...TSUKU.rings) },
      uVis: { value: new Vector3(1, 1, 1) },
      uSpinBoost: { value: 0 },
      uShat: { value: 0 },
    },
  });
  const moon = new Mesh(moonGeo, moonMat);
  moon.position.set(0, 0, -moonZ);
  moon.renderOrder = -50;
  scene.add(moon);
  disposables.push(moonGeo, moonMat);

  // ---- nuvens (de trás para a frente) ----
  const clouds = [...TSUKU.clouds].sort((a, b) => b.z - a.z);
  const cloudMats: ShaderMaterial[] = [];
  clouds.forEach((c, i) => {
    const widthR = 6.2; // largura em raios (cobre ultrawide + paralaxe + deriva)
    const w = (widthR * c.z) / F;
    const h = (c.h * c.z) / F;
    const geo = new PlaneGeometry(w, h);
    const repeat = widthR / 1.6;
    const mat = new ShaderMaterial({
      vertexShader: PLANE_VERT,
      fragmentShader: CLOUD_FRAG,
      transparent: true,
      premultipliedAlpha: true,
      depthWrite: false,
      uniforms: {
        ...pick(shared, "uTime", "uLight", "uMoonC", "uMoonR", "uMist"),
        uTex: { value: baked.clouds },
        uSpeed: { value: (c.speed / widthR) * repeat },
        uRepeat: { value: repeat },
        uOffset: { value: rnd() * 10 },
        uAlpha: { value: c.alpha },
        uLit: { value: c.lit },
        uKind: { value: new Vector3(c.kind === 0 ? 1 : 0, c.kind === 1 ? 1 : 0, c.kind === 2 ? 1 : 0) },
        // textura por raio de tela (u, v): para dar um passo em direção à lua na própria textura
        uScale: { value: [repeat / widthR, 0.5 / c.h] },
      },
    });
    const m = new Mesh(geo, mat);
    const [x, y, z] = place(0, c.v, c.z);
    m.position.set(x, y, z);
    m.renderOrder = -30 + i;
    scene.add(m);
    cloudMats.push(mat);
    disposables.push(geo, mat);
  });

  // ---- névoa ----
  const fogs = [
    { z: 7.2, v: -0.2, alpha: 0.22, drift: [0.006, 0.002] as [number, number] },
    { z: 4.4, v: -0.5, alpha: 0.2, drift: [-0.009, 0.003] as [number, number] },
  ];
  fogs.forEach((f, i) => {
    const geo = new PlaneGeometry((6 * f.z) / F, (4.6 * f.z) / F);
    const mat = new ShaderMaterial({ vertexShader: PLANE_VERT, fragmentShader: FOG_FRAG, transparent: true, depthWrite: false, uniforms: { ...pick(shared, "uTime", "uLight", "uMoonC", "uMoonR", "uMist"), uTex: { value: baked.fog }, uDrift: { value: f.drift }, uAlpha: { value: f.alpha } } });
    const m = new Mesh(geo, mat);
    const [x, y, z] = place(0, f.v, f.z);
    m.position.set(x, y, z);
    m.renderOrder = -12 + i * 8;
    scene.add(m);
    disposables.push(geo, mat);
  });

  // ---- rochas ----
  const rockMat = new ShaderMaterial({ vertexShader: ROCK_VERT, fragmentShader: ROCK_FRAG, uniforms: { ...pick(shared, "uLight", "uKey"), uMoonV: { value: new Vector3() }, uFade: { value: 1 } } });
  disposables.push(rockMat);
  const rocks = TSUKU.rocks.map((c, i) => {
    const geo = rockGeometry(seeded(0x900 + i * 31));
    const m = new Mesh(geo, rockMat);
    const [x, y, z] = place(c.u, c.v, c.z);
    const size = (c.s * 1.3 * c.z) / F;
    m.position.set(x, y, z);
    m.scale.setScalar(size);
    m.rotation.set(rnd() * 6, rnd() * 6, rnd() * 6);
    const axis = new Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize();
    scene.add(m);
    disposables.push(geo);
    return { m, base: [x, y, z] as const, axis, spin: c.spin, bob: (c.bob * c.z) / F, hz: c.hz, ph: rnd() * 6.28 };
  });

  // ---- brasas ----
  const n = opts.particles;
  const seeds = new Float32Array(n * 4);
  for (let i = 0; i < seeds.length; i++) seeds[i] = rnd();
  const emberGeo = new BufferGeometry();
  emberGeo.setAttribute("position", new BufferAttribute(new Float32Array(n * 3), 3));
  emberGeo.setAttribute("aSeed", new BufferAttribute(seeds, 4));
  const emberMat = new ShaderMaterial({
    vertexShader: EMBER_VERT,
    fragmentShader: EMBER_FRAG,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: { uTime: shared.uTime, uFocal: { value: 600 }, uBurst: { value: 0 }, uHover: { value: [0, 0, 0, 0.2] }, uRes: { value: [1, 1] } },
  });
  const embers = new Points(emberGeo, emberMat);
  embers.frustumCulled = false;
  embers.renderOrder = 10;
  scene.add(embers);
  disposables.push(emberGeo, emberMat);

  const moonCenter = new Vector3(0, 0, -moonZ);
  const tmp = new Vector3();
  const baseCam = new Vector3();

  return {
    scene,
    camera,
    update(ctx: FrameCtx) {
      const { t, res, stage, par, leave, enter, hover } = ctx;
      frameCamera(camera, res, stage);
      // saída: a câmera avança pela cena; paralaxe: o que está perto anda mais
      const travel = 8.5 * Math.pow(remap(leave, 0.16, 0.6), 1.5);
      baseCam.set(par.x * 0.16, par.y * 0.11, -travel);
      camera.position.copy(baseCam);
      camera.updateMatrixWorld();
      const tw = t % OS_SCENE.timeWrap;
      shared.uTime.value = tw;
      // luz vermelha: respira sempre; na saída cede às brasas
      const shat = remap(leave, 0.06, 0.4);
      shared.uLight.value = (0.93 + 0.05 * Math.sin(t * 0.37) + 0.03 * Math.sin(t * 1.13 + 2)) * (1 - shat * 0.85);
      // chegada: névoa espessa que se dissipa, padrão acendendo anel por anel, giro que desacelera
      const Ee = remap(enter, 0.4, 0.86);
      shared.uMist.value = enter < 1 ? 1 - remap(enter, 0.55, 0.98) : 0;
      const mu = moonMat.uniforms;
      mu.uVis.value.set(remap(Ee, 0.3, 0.62), remap(Ee, 0.42, 0.74), remap(Ee, 0.54, 0.86));
      mu.uSpinBoost.value = 2.4 * Math.pow(1 - remap(enter, 0.4, 1), 2) + 1.2 * remap(leave, 0.2, 0.55);
      mu.uShat.value = shat;
      // centro e raio da lua projetados (gl_FragCoord: y de baixo)
      tmp.copy(moonCenter).project(camera);
      const cx = (tmp.x * 0.5 + 0.5) * res[0];
      const cy = (tmp.y * 0.5 + 0.5) * res[1];
      const dist = camera.position.distanceTo(moonCenter);
      const focal = F * stage.r;
      shared.uMoonC.value = [cx, cy];
      shared.uMoonR.value = (focal * moonRW) / Math.sqrt(Math.max(dist * dist - moonRW * moonRW, 1e-3));
      (skyMat.uniforms.uPar.value as [number, number])[0] = par.x;
      (skyMat.uniforms.uPar.value as [number, number])[1] = par.y;
      // rochas: giro no próprio eixo + oscilação
      for (const rk of rocks) {
        rk.m.position.set(rk.base[0], rk.base[1] + rk.bob * Math.sin(t * rk.hz * 6.2832 + rk.ph), rk.base[2]);
        rk.m.rotateOnAxis(rk.axis, rk.spin * ctx.dt);
      }
      tmp.copy(moonCenter).applyMatrix4(camera.matrixWorldInverse);
      rockMat.uniforms.uMoonV.value.copy(tmp);
      rockMat.uniforms.uFade.value = 1 - remap(leave, 0.5, 0.8) * 0.6;
      // brasas
      const eu = emberMat.uniforms;
      eu.uFocal.value = focal;
      eu.uBurst.value = shat;
      eu.uRes.value = res;
      eu.uHover.value = [hover.x, res[1] - hover.y, hover.k, (2 * hover.r) / res[1]];
    },
    dispose() {
      disposables.forEach((d) => d.dispose());
    },
  };
}

function remap(x: number, a: number, b: number) {
  return Math.max(0, Math.min(1, (x - a) / (b - a)));
}

function pick<T extends U, K extends keyof T>(o: T, ...keys: K[]): Pick<T, K> {
  const out = {} as Pick<T, K>;
  for (const k of keys) out[k] = o[k];
  return out;
}

/** Rocha: icosaedro deformado (função da posição — vértices repetidos andam juntos), facetas planas, tom por face. */
function rockGeometry(r: () => number): BufferGeometry {
  const g = new IcosahedronGeometry(1, 1);
  const pos = g.getAttribute("position") as BufferAttribute;
  const k = [r() * 10, r() * 10, r() * 10];
  const stretch = [0.75 + r() * 0.6, 0.6 + r() * 0.5, 0.75 + r() * 0.5];
  const v = new Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    const n = Math.sin(v.x * 3.1 + k[0]) * Math.sin(v.y * 2.7 + k[1]) * Math.sin(v.z * 3.4 + k[2]);
    const d = 0.78 + 0.3 * n + 0.08 * Math.sin(v.x * 7 + v.y * 5 + k[0]);
    pos.setXYZ(i, v.x * d * stretch[0], v.y * d * stretch[1], v.z * d * stretch[2]);
  }
  g.computeVertexNormals();
  const tint = new Float32Array(pos.count * 3);
  for (let f = 0; f < pos.count; f += 3) {
    const c = 0.75 + r() * 0.5;
    for (let j = 0; j < 3; j++) tint.set([c, c * (0.92 + r() * 0.08), c * (0.92 + r() * 0.08)], (f + j) * 3);
  }
  g.setAttribute("aTint", new BufferAttribute(tint, 3));
  return g;
}
