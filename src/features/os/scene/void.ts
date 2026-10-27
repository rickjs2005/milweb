import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  Curve,
  CylinderGeometry,
  Group,
  Mesh,
  OctahedronGeometry,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  Scene,
  ShaderMaterial,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from "three";
import { GLSL_NOISE } from "./glsl";
import { F, OS_SCENE, VOID } from "./scene.config";
import { frameCamera, place, seeded, type FrameCtx, type World } from "./world";
import type { Baked } from "./bake";

/**
 * VAZIO ILIMITADO — o universo do tema Gojo (claro), por dentro de um túnel.
 *
 *   túnel     cilindro aberto em volta da câmera (as paredes passam das bordas da tela), que se curva
 *             devagar — o ponto de fuga passeia. Nas paredes, energia curva (filamentos assados,
 *             torcidos com a profundidade) correndo para o fundo e folhas de luz que recuam. A cor
 *             vem da profundidade: pérola perto, gelo, azul, azul profundo no centro.
 *   núcleo    brilho azul profundo no fim do túnel, girando
 *   anéis     sete toros inclinados, cada um girando no próprio sentido e ritmo, com reflexos que
 *             correm pelo anel e um halo; deslizam devagar para a câmera e renascem lá no fundo
 *   correntes oito hélices finas de luz com pulsos que viajam para o fundo
 *   partículas espiralando para o vazio; o app destacado as faz girar em volta dele
 *   névoa     três véus brancos em deriva perto da câmera
 *   estilhaços octaedros esticados, vidro (fresnel + reflexo), girando e flutuando
 *
 * Saída (leave): os anéis se contraem girando mais rápido, a luz cai e a câmera é puxada para o
 * vazio. Chegada (enter): os anéis se abrem a partir do centro, a câmera entra voando pelo túnel e
 * a luz acende do crepúsculo à pérola; o giro extra decai até o ambiente.
 */
const TUNNEL_VERT = /* glsl */ `
uniform float uTime;
uniform float uBend;
varying float vS;
varying float vA;
varying float vDepth;
void main() {
  vec3 p = position;
  float s = -p.z;
  float k = smoothstep(4.0, 70.0, s);
  p.x += uBend * k * (1.7 * sin(s * 0.034 + uTime * 0.12) + 0.6 * sin(s * 0.09 - uTime * 0.07));
  p.y += uBend * k * (1.3 * cos(s * 0.027 + uTime * 0.1) + 0.5 * cos(s * 0.08 + uTime * 0.05));
  vS = s;
  vA = uv.x;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;

const DEPTH_COLOR = /* glsl */ `
const vec3 PEARL = vec3(0.945, 0.955, 0.975);
const vec3 ICE = vec3(0.79, 0.885, 1.0);
const vec3 BLUE = vec3(0.13, 0.4, 0.93);
const vec3 DEEP = vec3(0.02, 0.085, 0.33);
const vec3 ABYSS = vec3(0.006, 0.02, 0.085);
/* a parede a d unidades aparece a 7/d raios do centro: perola fora do palco, azul a partir de ~0,8 R */
vec3 depthColor(float d) {
  vec3 c = mix(PEARL, ICE, smoothstep(5.0, 8.5, d));
  c = mix(c, BLUE, smoothstep(7.5, 13.0, d));
  c = mix(c, DEEP, smoothstep(12.5, 24.0, d));
  return mix(c, ABYSS, smoothstep(26.0, 70.0, d));
}
`;

const TUNNEL_FRAG = /* glsl */ `
${GLSL_NOISE}
${DEPTH_COLOR}
uniform sampler2D uFlow;
uniform float uTime;
uniform float uFlowSpeed;
uniform float uBoost;
uniform vec3 uLight;
varying float vS;
varying float vA;
varying float vDepth;
void main() {
  float s = vS;
  float d = vDepth;
  float fs = uFlowSpeed * (1.0 + uBoost);
  /* camadas de energia: torcidas com a profundidade, correndo para o fundo */
  vec2 f1 = vec2(vA * 4.0 + s * 0.016 + uTime * 0.018, s * 0.034 - uTime * fs);
  vec2 f2 = vec2(vA * 2.0 - s * 0.011 - uTime * 0.012, s * 0.019 - uTime * fs * 0.6);
  float fil = texture2D(uFlow, f1).r;
  float soft = texture2D(uFlow, f2).g;
  float energy = fil * (0.45 + 0.9 * soft);
  /* folhas de luz que recuam (aneis de luz ao longo do tunel, andando para o fundo) */
  float band = pow(0.5 + 0.5 * cos(s * 0.44 - uTime * 1.4 * (1.0 + uBoost)), 12.0);
  vec3 c = depthColor(d);
  float nearCalm = 1.0 - smoothstep(4.5, 11.0, d);
  /* perto: energia em azul-gelo de baixo contraste (calmo atras da interface); no meio: branco-azulado vivo;
     ao fundo: azul saturado que escurece com a distancia (o centro fica azul profundo, nunca cinza) */
  vec3 eCol = mix(vec3(0.3, 0.58, 1.0), vec3(0.95, 0.98, 1.0), smoothstep(13.0, 7.0, d));
  eCol = mix(eCol, vec3(0.1, 0.3, 0.85), smoothstep(16.0, 34.0, d));
  eCol = mix(eCol, vec3(0.72, 0.84, 0.99), nearCalm);
  float eAmt = mix(1.0, 0.42, nearCalm) * mix(1.0, 0.55, smoothstep(30.0, 70.0, d)) * smoothstep(90.0, 22.0, d);
  c = mix(c, eCol, sat(energy * eAmt));
  /* linhas do tunel: espirais que torcem com a profundidade (dao a curvatura e o fundo alem das bordas) */
  float tw = vA * 28.0 + s * 0.09 + uTime * 0.05;
  float ln = smoothstep(0.08, 0.0, abs(fract(tw) - 0.5) - 0.42);
  c = mix(c, mix(vec3(0.62, 0.78, 1.0), vec3(0.85, 0.92, 1.0), nearCalm), ln * 0.22 * smoothstep(3.0, 7.0, d) * smoothstep(60.0, 18.0, d));
  c += vec3(0.32, 0.55, 1.0) * band * 0.2 * smoothstep(3.5, 9.0, d) * smoothstep(75.0, 24.0, d);
  /* cintilacao */
  float sp = texture2D(uFlow, f1 * 1.9 + vec2(0.37, uTime * 0.05)).b;
  c += vec3(0.8, 0.92, 1.0) * sp * 0.7 * smoothstep(5.0, 12.0, d) * smoothstep(60.0, 20.0, d);
  gl_FragColor = vec4(c * uLight, 1.0);
}
`;

const CORE_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const CORE_FRAG = /* glsl */ `
${GLSL_NOISE}
uniform float uTime;
uniform vec3 uLight;
uniform float uBoost;
varying vec2 vUv;
void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  vec2 sw = rot(uTime * 0.12 * (1.0 + uBoost) + 1.2 / (r + 0.25)) * p;
  float n = nz(sw * 3.0 + 7.0) * 0.6 + nz(sw * 7.0 - uTime * 0.2) * 0.4;
  float glow = exp(-r * 4.5) * (0.45 + 0.7 * n) * smoothstep(0.0, 0.25, r + n * 0.2);
  vec3 col = vec3(0.03, 0.14, 0.6) * glow * 1.1 + vec3(0.3, 0.55, 1.0) * pow(glow, 4.0) * 0.3;
  gl_FragColor = vec4(col * uLight, 1.0);
}
`;

const RING_VERT = /* glsl */ `
varying vec2 vUv;
varying float vDepth;
varying vec3 vN;
varying vec3 vPosV;
void main() {
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vDepth = -mv.z;
  vPosV = mv.xyz;
  vN = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * mv;
}
`;

const RING_FRAG = /* glsl */ `
${GLSL_NOISE}
uniform float uTime;
uniform float uSeed;
uniform float uDir;
uniform float uFade;
uniform float uGlow;
uniform vec3 uLight;
varying vec2 vUv;
varying float vDepth;
varying vec3 vN;
varying vec3 vPosV;
void main() {
  float a = vUv.x * TAU;
  vec2 cs = vec2(cos(a), sin(a));
  float arc = 0.2 + 0.8 * smoothstep(0.25, 0.9, nz(cs * 1.8 + uSeed * 7.0 + vec2(uTime * 0.16, 0.0)));
  float glint = pow(0.5 + 0.5 * cos(a * 3.0 - uTime * 1.1 * uDir + uSeed * 4.0), 14.0);
  float fade = uFade * smoothstep(4.5, 9.0, vDepth) * smoothstep(70.0, 40.0, vDepth);
  vec3 coreC = mix(vec3(0.55, 0.8, 1.0), vec3(1.0), 0.55 + 0.45 * glint);
  float inten = (0.55 * arc + 1.1 * glint);
  if (uGlow > 0.5) {
    float f = pow(abs(dot(normalize(vN), normalize(-vPosV))), 2.0);
    inten *= f * 0.42;
    coreC = vec3(0.35, 0.6, 1.0);
  }
  gl_FragColor = vec4(coreC * inten * fade * uLight, 1.0);
}
`;

const CURRENT_FRAG = /* glsl */ `
uniform float uTime;
uniform float uSpeed;
uniform float uPh;
uniform vec3 uLight;
uniform float uBoost;
varying vec2 vUv;
varying float vDepth;
void main() {
  float x = vUv.x;
  float p = fract(x * 7.0 - uTime * uSpeed * (1.0 + uBoost) + uPh);
  float pulse = smoothstep(0.0, 0.05, p) * smoothstep(0.42, 0.05, p);
  float fade = smoothstep(5.0, 11.0, vDepth) * smoothstep(80.0, 35.0, vDepth);
  vec3 col = mix(vec3(0.45, 0.72, 1.0), vec3(1.0), pulse) * (0.14 + 1.25 * pulse) * fade;
  gl_FragColor = vec4(col * uLight, 1.0);
}
`;

const PART_VERT = /* glsl */ `
attribute vec4 aSeed;
uniform float uTime;
uniform float uFocal;
uniform float uBoost;
uniform vec4 uHover;
uniform vec2 uRes;
varying float vA;
void main() {
  float span = 88.0;
  float sp = (0.6 + 2.4 * aSeed.w) * (1.0 + uBoost);
  float s = mod(aSeed.z * span + uTime * sp, span) + 2.0;
  float ang = aSeed.y * 6.2832 + uTime * (0.08 + 0.22 * aSeed.x) * (aSeed.w > 0.5 ? 1.0 : -1.0) + s * 0.05;
  float rad = 0.35 + 2.75 * aSeed.x;
  vec3 p = vec3(cos(ang) * rad, sin(ang) * rad, -s);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vec4 clip = projectionMatrix * mv;
  vec2 ndc = clip.xy / clip.w;
  vec2 hp = (uHover.xy / uRes) * 2.0 - 1.0;
  vec2 hd = (ndc - hp) * vec2(uRes.x / uRes.y, 1.0);
  float hk = uHover.z * exp(-dot(hd, hd) / (uHover.w * uHover.w));
  float c = cos(hk * 1.6);
  float sn = sin(hk * 1.6);
  vec2 rot = vec2(c * hd.x - sn * hd.y, sn * hd.x + c * hd.y);
  clip.xy += (rot - hd) * vec2(uRes.y / uRes.x, 1.0) * clip.w;
  gl_Position = clip;
  float depth = max(-mv.z, 0.5);
  gl_PointSize = (0.02 + 0.05 * fract(aSeed.x * 11.3)) * uFocal / depth;
  vA = (0.45 + 0.55 * fract(aSeed.y * 5.7)) * smoothstep(2.5, 6.0, depth) * smoothstep(80.0, 40.0, depth) * (1.0 + 1.5 * hk);
}
`;

const PART_FRAG = /* glsl */ `
uniform vec3 uLight;
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  a *= a;
  gl_FragColor = vec4(vec3(0.62, 0.82, 1.0) * a * vA * uLight, 1.0);
}
`;

const MIST_FRAG = /* glsl */ `
uniform sampler2D uTex;
uniform float uTime;
uniform vec2 uDrift;
uniform float uSpin;
uniform float uAlpha;
uniform vec3 uLight;
uniform vec2 uC;
uniform float uR;
varying vec2 vUv;
void main() {
  vec2 c = vUv - 0.5;
  float ang = uTime * uSpin;
  vec2 r = mat2(cos(ang), sin(ang), -sin(ang), cos(ang)) * c;
  vec3 f = texture2D(uTex, r * 1.3 + uDrift * uTime + 0.5).rgb;
  vec3 g = texture2D(uTex, r * 0.8 - uDrift * uTime * 0.7 + 0.21).rgb;
  float m = f.r * 0.55 + g.g * 0.55 + f.b * 0.3;
  float edge = smoothstep(0.5, 0.18, length(c));
  /* a nevoa emoldura o portal: recua do centro (o azul profundo nao fica velado) */
  float rs = length(gl_FragCoord.xy - uC) / uR;
  float a = smoothstep(0.3, 0.9, m) * edge * uAlpha * smoothstep(0.35, 1.0, rs);
  gl_FragColor = vec4(mix(vec3(0.86, 0.92, 1.0), vec3(1.0), m) * uLight, a);
}
`;

const SHARD_VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vPosV;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vPosV = mv.xyz;
  vN = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * mv;
}
`;

const SHARD_FRAG = /* glsl */ `
uniform vec3 uKey;
uniform vec3 uLight;
varying vec3 vN;
varying vec3 vPosV;
void main() {
  vec3 n = normalize(vN);
  vec3 V = normalize(-vPosV);
  float fres = pow(1.0 - abs(dot(n, V)), 2.0);
  float spec = pow(max(dot(reflect(-uKey, n), V), 0.0), 28.0);
  float key = max(dot(n, uKey), 0.0);
  /* vidro no branco: corpo azulado e aresta mais escura aparecem; o reflexo e o brilho */
  vec3 body = mix(vec3(0.4, 0.54, 0.8), vec3(0.74, 0.84, 0.98), key);
  vec3 col = mix(body, vec3(0.3, 0.42, 0.68), fres * 0.55) + vec3(1.0) * spec * 0.9;
  float a = 0.4 + 0.4 * fres + spec * 0.5;
  gl_FragColor = vec4(min(col, vec3(1.0)) * uLight, clamp(a, 0.0, 0.95));
}
`;

class Helix extends Curve<Vector3> {
  constructor(private r: number, private turns: number, private ph: number, private s0: number, private s1: number) {
    super();
  }
  getPoint(t: number, target = new Vector3()) {
    const s = this.s0 + (this.s1 - this.s0) * t;
    const a = this.ph + s * this.turns * 0.6283;
    return target.set(Math.cos(a) * this.r, Math.sin(a) * this.r, -s);
  }
}

export function createVoid(baked: Baked, opts: { particles: number }): World {
  const scene = new Scene();
  scene.background = new Color(0.004, 0.012, 0.045);
  const camera = new PerspectiveCamera(40, 1, 0.05, 400);
  const rnd = seeded(0x60f0);
  const disposables: { dispose(): void }[] = [];
  const shared = {
    uTime: { value: 0 },
    uLight: { value: new Vector3(1, 1, 1) },
    uBoost: { value: 0 },
    uNoise: { value: baked.noise },
    uKey: { value: new Vector3(-0.35, 0.6, 0.72).normalize() },
    /* centro e raio do palco em px do buffer (gl_FragCoord: y de baixo) */
    uC: { value: [0, 0] as [number, number] },
    uR: { value: 300 },
  };

  // ---- túnel ----
  const T = VOID.tunnel;
  const tunnelGeo = new CylinderGeometry(T.radius, T.radius, T.length, 160, 220, true);
  tunnelGeo.rotateX(Math.PI / 2);
  tunnelGeo.translate(0, 0, -T.length / 2 + 4);
  const tunnelMat = new ShaderMaterial({
    vertexShader: TUNNEL_VERT,
    fragmentShader: TUNNEL_FRAG,
    side: BackSide,
    uniforms: { ...pickU(shared, "uTime", "uLight", "uBoost", "uNoise"), uFlow: { value: baked.flow }, uFlowSpeed: { value: 0.075 }, uBend: { value: T.bend } },
  });
  const tunnel = new Mesh(tunnelGeo, tunnelMat);
  tunnel.frustumCulled = false;
  tunnel.renderOrder = -100;
  scene.add(tunnel);
  disposables.push(tunnelGeo, tunnelMat);

  // ---- núcleo ----
  const coreGeo = new PlaneGeometry(26, 26);
  const coreMat = new ShaderMaterial({ vertexShader: CORE_VERT, fragmentShader: CORE_FRAG, transparent: true, depthWrite: false, blending: AdditiveBlending, uniforms: pickU(shared, "uTime", "uLight", "uBoost", "uNoise") });
  const core = new Mesh(coreGeo, coreMat);
  core.position.set(0, 0, -92);
  core.renderOrder = -90;
  scene.add(core);
  disposables.push(coreGeo, coreMat);

  // ---- anéis (núcleo fino + halo), cada um no próprio grupo: inclinação no grupo, giro no toro ----
  const rings = VOID.rings.map((c, i) => {
    const group = new Group();
    const coreGeoR = new TorusGeometry(c.r, c.w, 6, 220);
    const glowGeo = new TorusGeometry(c.r, c.w * 7, 8, 160);
    const mk = (glow: number) =>
      new ShaderMaterial({
        vertexShader: RING_VERT,
        fragmentShader: RING_FRAG,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: { ...pickU(shared, "uTime", "uLight", "uNoise"), uSeed: { value: i * 1.37 + 0.4 }, uDir: { value: Math.sign(c.spin) }, uFade: { value: 1 }, uGlow: { value: glow } },
      });
    const mCore = mk(0);
    const mGlow = mk(1);
    const torus = new Mesh(coreGeoR, mCore);
    const halo = new Mesh(glowGeo, mGlow);
    const spinner = new Group();
    spinner.add(torus, halo);
    group.add(spinner);
    group.rotation.set(c.tx, c.ty, 0);
    scene.add(group);
    torus.renderOrder = halo.renderOrder = 20 + i;
    disposables.push(coreGeoR, glowGeo, mCore, mGlow);
    return { group, spinner, mats: [mCore, mGlow], c, d0: c.d, wob: rnd() * 6.28 };
  });

  // ---- correntes de luz ----
  const currentMats: ShaderMaterial[] = [];
  VOID.currents.forEach((c, i) => {
    const geo = new TubeGeometry(new Helix(c.r, c.turns, c.ph, 2.5, 84), 520, c.w, 4, false);
    const mat = new ShaderMaterial({
      vertexShader: RING_VERT,
      fragmentShader: CURRENT_FRAG,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: { ...pickU(shared, "uTime", "uLight", "uBoost"), uSpeed: { value: c.speed }, uPh: { value: c.ph } },
    });
    const m = new Mesh(geo, mat);
    m.frustumCulled = false;
    m.renderOrder = 10 + i;
    scene.add(m);
    currentMats.push(mat);
    disposables.push(geo, mat);
  });

  // ---- partículas ----
  const n = opts.particles;
  const seeds = new Float32Array(n * 4);
  for (let i = 0; i < seeds.length; i++) seeds[i] = rnd();
  const partGeo = new BufferGeometry();
  partGeo.setAttribute("position", new BufferAttribute(new Float32Array(n * 3), 3));
  partGeo.setAttribute("aSeed", new BufferAttribute(seeds, 4));
  const partMat = new ShaderMaterial({
    vertexShader: PART_VERT,
    fragmentShader: PART_FRAG,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: { ...pickU(shared, "uTime", "uLight", "uBoost"), uFocal: { value: 600 }, uHover: { value: [0, 0, 0, 0.2] }, uRes: { value: [1, 1] } },
  });
  const parts = new Points(partGeo, partMat);
  parts.frustumCulled = false;
  parts.renderOrder = 30;
  scene.add(parts);
  disposables.push(partGeo, partMat);

  // ---- névoa branca perto da câmera ----
  const mists = [
    { u: -0.95, v: 0.3, z: 3.2, s: 2.6, drift: [0.012, 0.004] as [number, number], spin: 0.03, alpha: 0.42 },
    { u: 0.9, v: -0.45, z: 4.6, s: 3.0, drift: [-0.01, 0.006] as [number, number], spin: -0.024, alpha: 0.36 },
    { u: 0.2, v: 0.85, z: 6.4, s: 3.4, drift: [0.008, -0.005] as [number, number], spin: 0.02, alpha: 0.3 },
  ];
  mists.forEach((c, i) => {
    const size = (c.s * c.z) / F;
    const geo = new PlaneGeometry(size, size);
    const mat = new ShaderMaterial({
      vertexShader: CORE_VERT,
      fragmentShader: MIST_FRAG,
      transparent: true,
      depthWrite: false,
      uniforms: { ...pickU(shared, "uTime", "uLight", "uC", "uR"), uTex: { value: baked.fog }, uDrift: { value: c.drift }, uSpin: { value: c.spin }, uAlpha: { value: c.alpha } },
    });
    const m = new Mesh(geo, mat);
    const [x, y, z] = place(c.u, c.v, c.z);
    m.position.set(x, y, z);
    m.renderOrder = 60 + i;
    scene.add(m);
    disposables.push(geo, mat);
  });

  // ---- estilhaços ----
  const shardMat = new ShaderMaterial({ vertexShader: SHARD_VERT, fragmentShader: SHARD_FRAG, transparent: true, depthWrite: false, uniforms: pickU(shared, "uLight", "uKey") });
  disposables.push(shardMat);
  const shards = VOID.shards.map((c, i) => {
    const geo = shardGeometry(seeded(0x7a0 + i * 17));
    const m = new Mesh(geo, shardMat);
    const [x, y, z] = place(c.u, c.v, c.z);
    m.position.set(x, y, z);
    m.scale.setScalar((c.s * c.z) / F);
    m.rotation.set(rnd() * 6, rnd() * 6, rnd() * 6);
    m.renderOrder = 50 + i;
    scene.add(m);
    disposables.push(geo);
    return { m, base: [x, y, z] as const, axis: new Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize(), spin: c.spin, ph: rnd() * 6.28, hz: 0.12 + rnd() * 0.12, amp: ((0.01 + rnd() * 0.012) * c.z) / F };
  });

  const dusk = new Vector3(0.46, 0.58, 0.86);

  return {
    scene,
    camera,
    update(ctx: FrameCtx) {
      const { t, dt, res, stage, par, leave, enter, hover } = ctx;
      frameCamera(camera, res, stage);
      // chegada: a câmera entra voando pelo túnel; saída: é puxada para o vazio
      const flyIn = enter < 1 ? 7 * (1 - easeOut(remap(enter, 0.34, 1))) : 0;
      const contract = smoothe(remap(leave, 0.04, 0.5));
      camera.position.set(par.x * 0.13, par.y * 0.09, flyIn - 5 * contract);
      camera.updateMatrixWorld();
      shared.uTime.value = t % OS_SCENE.timeWrap;
      shared.uC.value = [stage.x, res[1] - stage.y];
      shared.uR.value = stage.r;
      // luz: acende na chegada (crepúsculo → pérola), cai na saída
      const lightUp = enter < 1 ? smoothe(remap(enter, 0.48, 0.84)) : 1;
      const dim = smoothe(remap(leave, 0.12, 0.6));
      const L = shared.uLight.value;
      L.set(dusk.x + (1 - dusk.x) * lightUp, dusk.y + (1 - dusk.y) * lightUp, dusk.z + (1 - dusk.z) * lightUp);
      L.multiplyScalar(1 - 0.5 * dim);
      L.x *= 1 - 0.12 * dim;
      shared.uBoost.value = (enter < 1 ? 2 * (1 - remap(enter, 0.64, 1)) : 0) + 3 * contract;
      // anéis: abrem na chegada, contraem na saída; giram cada um no seu sentido e deslizam para a câmera
      const open = enter < 1 ? easeOut(remap(enter, 0.5, 0.92)) : 1;
      const over = 1 + 0.07 * Math.sin(Math.PI * remap(enter, 0.64, 1));
      const scale = (0.12 + 0.88 * open) * over * (1 - 0.85 * contract);
      const boost = 1 + shared.uBoost.value * 1.5;
      for (const rg of rings) {
        const span = 52;
        const d = ((rg.d0 - t * rg.c.flow - 5) % span + span) % span + 5;
        rg.group.position.set(0, 0, -d);
        rg.group.rotation.x = rg.c.tx + 0.08 * Math.sin(t * 0.21 + rg.wob);
        rg.group.rotation.y = rg.c.ty + 0.08 * Math.cos(t * 0.17 + rg.wob);
        rg.spinner.rotation.z += rg.c.spin * boost * dt;
        rg.spinner.scale.setScalar(scale);
        const fade = smoothe(remap(d, 5.5, 9)) * smoothe(remap(56 - d, 0, 6));
        rg.mats.forEach((m) => (m.uniforms.uFade.value = fade));
      }
      // estilhaços: giro + flutuação
      for (const s of shards) {
        s.m.position.set(s.base[0] + s.amp * 0.6 * Math.cos(t * s.hz * 4.4 + s.ph), s.base[1] + s.amp * Math.sin(t * s.hz * 6.28 + s.ph), s.base[2]);
        s.m.rotateOnAxis(s.axis, s.spin * dt * (1 + contract * 3));
      }
      const pu = partMat.uniforms;
      pu.uFocal.value = F * stage.r;
      pu.uRes.value = res;
      pu.uHover.value = [hover.x, res[1] - hover.y, hover.k, (2 * hover.r) / res[1]];
    },
    dispose() {
      disposables.forEach((d) => d.dispose());
    },
  };
}

function remap(x: number, a: number, b: number) {
  return Math.max(0, Math.min(1, (x - a) / (b - a)));
}
const easeOut = (x: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);
const smoothe = (x: number) => {
  const k = Math.max(0, Math.min(1, x));
  return k * k * (3 - 2 * k);
};
function pickU<T extends Record<string, { value: unknown }>, K extends keyof T>(o: T, ...keys: K[]): Pick<T, K> {
  const out = {} as Pick<T, K>;
  for (const k of keys) out[k] = o[k];
  return out;
}

/** Estilhaço: octaedro esticado e torto, facetas planas. */
function shardGeometry(r: () => number): BufferGeometry {
  const g = new OctahedronGeometry(1, 0);
  const pos = g.getAttribute("position") as BufferAttribute;
  const sx = 0.34 + r() * 0.26;
  const sz = 0.12 + r() * 0.1;
  const v = new Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const j = 1 + Math.sin(v.x * 9 + v.y * 7 + v.z * 5) * 0.18;
    pos.setXYZ(i, v.x * sx * j, v.y * (0.8 + 0.4 * Math.abs(v.y)) * j, v.z * sz * j);
  }
  g.computeVertexNormals();
  return g;
}
