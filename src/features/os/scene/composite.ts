import { ShaderMaterial, Vector3, type Texture } from "three";
import { FULLSCREEN_VERT, GLSL_NOISE } from "./glsl";

/**
 * Composição final, em espaço de tela: junta o universo em cena (tA) e, na
 * travessia, o que chega (tB). Aqui moram os efeitos que dependem da tela
 * inteira — a onda que nasce no controle de tema, a onda pequena do clique
 * num app, a lente localizada do app destacado, a bolha de distorção e a
 * refração cromática do Vazio, as máscaras de revelação das duas
 * travessias, a vinheta, um grão de filme leve e a compressão das altas
 * luzes (o branco perolado nunca estoura).
 *
 * Coordenadas em px do buffer, y de baixo (gl_FragCoord).
 */
const COMPOSITE_FRAG = /* glsl */ `
${GLSL_NOISE}
uniform sampler2D tA;
uniform sampler2D tB;
uniform float uTrans;
uniform float uHasB;
uniform float uP;
uniform float uToVoid;
uniform float uAVoid;
uniform vec2 uRes;
uniform vec2 uC;
uniform float uR;
uniform vec3 uWave;
uniform vec4 uClick;
uniform vec4 uHover;
uniform float uHoverT;
uniform vec3 uHoverTint;
uniform float uTime;
uniform float uGrain;
uniform float uVig;
varying vec2 vUv;
const vec3 TUNNEL = vec3(0.008, 0.018, 0.06);
const vec3 HAZE = vec3(0.62, 0.075, 0.055);

/* onda: deslocamento radial (px) na frente de onda e a intensidade da frente */
vec3 ripple(vec2 frag, vec2 o, float k, float maxR, float width, float amp) {
  if (k <= 0.0 || k >= 1.0) return vec3(0.0);
  vec2 d = frag - o;
  float dist = length(d);
  float x = (dist - k * maxR) / (maxR * (width + 0.05 * k));
  float g = exp(-x * x);
  float fade = (1.0 - k) * (1.0 - k);
  vec2 dir = d / max(dist, 1.0);
  return vec3(dir * (-x * g) * uR * (amp * fade + 0.008), g * (0.3 + 0.7 * fade));
}
float streaks(vec2 q, float phase) {
  float r = length(q);
  float a = atan(q.y, q.x) / TAU + 0.5;
  vec3 h = hash32(vec2(floor(a * 160.0), 3.7));
  float lane = abs(fract(a * 160.0) - 0.5) * 2.0;
  float fz = fract(log(r + 0.04) * 1.8 - phase * (1.5 + 2.5 * h.x) + h.y * 13.0);
  return step(0.6, h.z) * smoothstep(1.0, 0.15, lane) * smoothstep(0.0, 0.05, fz) * smoothstep(0.38, 0.05, fz) * smoothstep(0.1, 0.45, r);
}
/* amostra um universo; o Vazio ganha a bolha de distorcao que passeia e franja cromatica na borda do portal */
vec3 world(sampler2D t, vec2 frag, vec2 off, float isVoid) {
  vec3 c;
  if (isVoid < 0.5) {
    c = texture2D(t, (frag + off) / uRes).rgb;
  } else {
    vec2 bc = uC + uR * 1.22 * vec2(cos(uTime * 0.045 + 1.0), 0.75 * sin(uTime * 0.06));
    vec2 bd = frag - bc;
    vec2 o2 = off - bd * exp(-dot(bd, bd) / (uR * uR * 0.05)) * 0.22;
    vec2 dc = (frag - uC) / uR;
    float rim = exp(-pow((length(dc) - 0.95) / 0.35, 2.0));
    vec2 ca = (frag - uC) * 0.0022 * (0.3 + rim);
    vec2 uv = (frag + o2) / uRes;
    c = vec3(texture2D(t, uv + ca / uRes).r, texture2D(t, uv).g, texture2D(t, uv - ca / uRes).b);
  }
  return c;
}
void main() {
  vec2 frag = vUv * uRes;
  float maxR = length(uRes) * 1.02;
  vec3 rp = ripple(frag, uWave.xy, uWave.z, maxR, 0.035, 0.055);
  /* clique: uma onda pequena (até ~1 raio do palco) que nasce no ícone e acompanha a janela abrindo */
  vec3 rc = ripple(frag, uClick.xy, uClick.z, uR * 1.05, 0.12, 0.05) * uClick.w;
  vec2 hd = frag - uHover.xy;
  float hr = length(hd) / max(uHover.w, 1.0);
  float hk = uHover.z * exp(-hr * hr);
  /* app destacado: pulsos de energia que saem dele e se expandem para dentro do cenário (um a cada 1,35 s,
     contados do início do destaque), de 0,35 a 2 raios da reação — passam do véu da coluna de apps */
  float hph = fract(uHoverT / 1.35);
  float hfront = exp(-pow((hr - mix(0.35, 2.0, hph)) / (0.16 + 0.1 * hph), 2.0)) * (1.0 - hph) * uHover.z;
  vec2 off = rp.xy + rc.xy + (hd / max(length(hd), 1.0)) * hfront * uR * 0.012 - hd * hk * 0.1;
  vec3 a = world(tA, frag, off, uAVoid);
  vec3 col = a;
  if (uTrans > 0.5) {
    float p = uP;
    vec2 dc = (frag - uC) / uR;
    float rcen = length(dc);
    if (uToVoid > 0.5) {
      /* escuro -> claro: o Tsukuyomi entra no tunel (rastros, escuro azulado), o Vazio abre do centro */
      float tun = remap(p, 0.2, 0.55);
      float gone = smoothe(remap(p, 0.3, 0.58));
      a = mix(a, TUNNEL, gone * 0.9);
      a += mix(vec3(0.5, 0.72, 1.0), vec3(1.0, 0.45, 0.35), 0.3 * (1.0 - tun)) * streaks(dc, p * 7.0) * tun * (1.0 - remap(p, 0.85, 1.0)) * 0.9;
      a += vec3(0.3, 0.5, 0.95) * rp.z * 0.1;
      col = a;
      if (uHasB > 0.5) {
        vec3 b = world(tB, frag, off, 1.0);
        float open = easeOut(remap(p, 0.5, 0.92));
        float pre = remap(p, 0.36, 0.52) * (1.0 - open);
        float rho = mix(0.05 + 0.12 * remap(p, 0.36, 0.52), 2.7, open);
        float on = remap(p, 0.34, 0.4);
        float alpha = smoothstep(rho + 0.02, rho - 0.32, rcen) * on;
        b += vec3(0.16, 0.44, 0.93) * 0.9 * exp(-rcen * rcen / 0.012) * pre;
        float fr = exp(-pow((rcen - rho) / 0.11, 2.0)) * (1.0 - remap(p, 0.76, 0.98)) * on;
        b = mix(b, vec3(0.7, 0.86, 1.0), fr * 0.45);
        alpha = max(max(alpha, fr * 0.8), remap(p, 0.9, 0.97));
        alpha = max(alpha, sat(exp(-rcen * rcen / 0.012) * pre * 1.4));
        col = mix(a, b, alpha);
      }
    } else {
      /* claro -> escuro: a luz do Vazio esfria e avermelha; uma onda vermelha parte do centro e revela a lua na nevoa */
      a = mix(a, vec3(0.36, 0.1, 0.11), remap(p, 0.38, 0.8) * 0.28);
      a += vec3(0.85, 0.18, 0.14) * rp.z * 0.08;
      col = a;
      if (uHasB > 0.5) {
        vec3 b = world(tB, frag, off, 0.0);
        float Ee = remap(p, 0.4, 0.86);
        float rho = 2.8 * easeOut(Ee);
        float on = remap(p, 0.38, 0.44);
        float alpha = smoothstep(rho + 0.02, rho - 0.3, rcen) * on;
        float behind = sat((rho - rcen) / 0.9);
        b = mix(b, vec3(0.3, 0.045, 0.04) + HAZE * 0.25, (1.0 - behind) * (1.0 - remap(p, 0.6, 1.0)) * 0.75);
        float brk = 0.5 + 0.5 * nz(dc / max(rcen, 1e-3) * 5.0 + vec2(uTime * 0.3, 0.0));
        float fade = (1.0 - remap(p, 0.7, 0.95)) * on;
        float fr = exp(-pow((rcen - rho) / 0.075, 2.0)) * brk * fade;
        float ahead = exp(-max(rcen - rho, 0.0) * 6.0) * step(rho, rcen) * fade;
        b = mix(b, vec3(0.62, 0.07, 0.05), sat(ahead * (1.0 - alpha)));
        b += vec3(0.7, 0.09, 0.06) * fr * 0.5;
        alpha = max(max(max(alpha, fr * 0.7), ahead * 0.24), remap(p, 0.9, 0.97));
        col = mix(a, b, alpha);
      }
    }
  }
  /* app destacado: brilho localizado na cor do universo e a frente dos pulsos; a do clique na mesma cor */
  col += uHoverTint * (hk * 0.22 + hfront * 0.45);
  col += uHoverTint * rc.z * 0.42;
  /* vinheta, grao, altas luzes comprimidas */
  vec2 sp = vUv - 0.5;
  sp.x *= uRes.x / uRes.y;
  col *= mix(1.0, smoothstep(1.15, 0.25, length(sp)), uVig);
  col += (hash12(frag + fract(uTime * 7.31) * 91.0) - 0.5) * uGrain;
  /* ombro suave so acima de 0,9: o perolado (0,94) fica perolado, nada passa de 1 */
  vec3 over = max(col - 0.9, 0.0);
  col = min(col, vec3(0.9)) + 0.1 * (1.0 - exp(-over * 10.0));
  gl_FragColor = vec4(col, 1.0);
}
`;

export function compositeMaterial(noise: Texture): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader: FULLSCREEN_VERT,
    fragmentShader: COMPOSITE_FRAG,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uNoise: { value: noise },
      tA: { value: null },
      tB: { value: null },
      uTrans: { value: 0 },
      uHasB: { value: 0 },
      uP: { value: 0 },
      uToVoid: { value: 0 },
      uAVoid: { value: 0 },
      uRes: { value: [1, 1] },
      uC: { value: [0, 0] },
      uR: { value: 300 },
      uWave: { value: new Vector3(0, 0, -1) },
      uClick: { value: [0, 0, -1, 0] },
      uHover: { value: [0, 0, 0, 100] },
      uHoverT: { value: 0 },
      uHoverTint: { value: new Vector3(1, 0.3, 0.15) },
      uTime: { value: 0 },
      uGrain: { value: 0.012 },
      uVig: { value: 0.5 },
    },
  });
}
