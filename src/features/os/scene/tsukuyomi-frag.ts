import { ROCKS } from "./scene.config";
import { SCENE_GLSL_COMMON, floatersGLSL } from "./glsl-common";

/**
 * TSUKUYOMI — o universo do tema Obito (escuro).
 *
 * Camadas, do fundo para a frente (z = profundidade; decide paralaxe e
 * quanto a camada cresce quando a câmera atravessa o túnel):
 *   céu (z 3)         degradê profundo, nebulosa, estrelas cintilando, halo vermelho da lua
 *   lua (z 2)         superfície com mares, crateras e grão; escurecimento no limbo; o
 *                     padrão (pupila, três anéis pontilhados, nove tomoe) girando devagar,
 *                     cada anel num ritmo
 *   nuvens finas (z 1,3)  faixas na frente da lua, bordas finas acesas por trás
 *   névoa e feixes (z 1,2) luz vermelha atravessando a névoa a partir do limbo
 *   rochas distantes  silhuetas com aro de luz do lado da lua
 *   banco de nuvens (z 0,95) cobre o pé da lua, topo aceso
 *   rochas próximas   maiores, desfocadas
 *   brasas            três planos de profundidade, subindo devagar
 *   névoa próxima (z 0,62) massas escuras nos cantos e no pé (áreas de leitura calmas)
 *
 * Saída (uLeave): a luz vermelha se fragmenta em partículas que voam para fora,
 * a câmera avança (as camadas próximas passam primeiro) e rastros correm num
 * túnel azul-escuro. Chegada (uEnter): uma onda vermelha parte do centro e
 * revela a lua através de uma névoa espessa; o padrão acende anel por anel.
 */
const ROCK_BODY = /* glsl */ `
      vec4 rk = rock(lp, seed, normalize(-c + 1e-4), 1.4 / (uR * S * sc) * (1.0 + 2.8 * sat(0.82 - z)), moonBehind(c) * lightK);
      col = mix(col, rk.rgb, rk.a * (1.0 - smoothstep(2.6, 4.2, sc)));`;

export const TSUKUYOMI_FRAG = /* glsl */ `${SCENE_GLSL_COMMON}
const vec3 SKY_TOP = vec3(0.007, 0.004, 0.012);
const vec3 SKY_BOT = vec3(0.050, 0.013, 0.019);
const vec3 HAZE = vec3(0.62, 0.075, 0.055);
const vec3 MOON_A = vec3(0.78, 0.285, 0.20);
const vec3 MOON_B = vec3(0.47, 0.13, 0.10);
const vec3 MOON_C = vec3(1.0, 0.58, 0.40);
const vec3 INK = vec3(0.105, 0.020, 0.028);
const vec3 EMBER = vec3(1.0, 0.40, 0.20);
const vec3 TUNNEL = vec3(0.008, 0.018, 0.060);

float gTrav;
float lightK;

float scl(float z) { return z / max(z - gTrav, 0.06); }
vec2 lay(vec2 q, float z, float par) { return (q + uPar * par) / scl(z); }

/* brilho da lua atras de um ponto (disco + halo): acende as bordas finas das nuvens e o aro das rochas */
float moonBehind(vec2 qm) {
  float r = length(qm);
  return smoothstep(1.04, 0.86, r) * 0.9 + exp(-max(r - 1.0, 0.0) * 3.0) * 0.32;
}

vec3 moonSurface(vec2 q, float r, float t) {
  float z = sqrt(max(1.0 - r * r, 0.0));
  vec2 uv = q / (0.55 + 0.45 * z);
  float tt = t * 0.0045;
  float w = fbm3(uv * 1.5 + vec2(tt, -0.6 * tt));
  float m = fbm(uv * 2.4 + w * 1.5 + vec2(-0.7 * tt, tt) + 11.0);
  vec3 c = mix(MOON_A, MOON_B, smoothstep(0.40, 0.78, m) * 0.8);
  c = mix(c, MOON_C, smoothstep(0.50, 0.86, w) * 0.42);
  c *= 0.88 + 0.22 * nzb(uv * 30.0 + 3.0);
  c *= 1.0 - smoothstep(0.66, 0.82, nz(uv * 6.5 + 5.0)) * 0.22;
  float key = dot(vec3(q, z), vec3(0.384, 0.526, 0.759));
  c *= mix(0.42, 1.0, pow(z, 0.5)) * (0.64 + 0.44 * key);
  /* sombras de nuvens altas correndo pela superficie */
  c *= 1.0 - smoothstep(0.55, 0.86, nz(q * 1.9 + vec2(t * 0.012, t * 0.003) + 40.0)) * 0.24;
  /* brilho difuso no alto a direita */
  vec2 sb = q - vec2(0.36, 0.66);
  vec2 sd = sb / max(length(sb), 1e-4);
  float rays = nz(sd * 3.0 + 1.0);
  c += MOON_C * exp(-dot(sb, sb) * 3.2) * (0.24 + 0.26 * rays * rays * smoothstep(0.02, 0.3, length(sb)));
  /* aro atmosferico */
  c += vec3(0.85, 0.22, 0.13) * pow(1.0 - z, 2.4) * 0.42;
  return c * (0.97 + 0.03 * sin(t * 0.7));
}

/* tomoe: peixe do yin-yang (cabeca na origem, raio h; cauda subindo pelo lado esquerdo), cauda encurtada */
float tomoe(vec2 p, float h) {
  vec2 pp = vec2(p.x, p.y > 0.0 ? p.y * 1.12 : p.y);
  float d = max(length(pp - vec2(0.0, h)) - 2.0 * h, pp.x);
  d = min(d, length(pp) - h);
  return max(d, h - length(pp - vec2(0.0, 2.0 * h)));
}
/* um anel do padrao: os pontos e o tomoe mais proximo (repeticao angular: 3 por anel, um so calculado por pixel) */
float ringPart(float r, float ang, float R, float base, float ph, float h) {
  float n = floor(TAU * R / 0.0205);
  float cell = (ang + ph) / TAU * n;
  vec3 hh = hash32(vec2(mod(floor(cell), n), R * 97.0));
  float along = (fract(cell) - 0.5) * TAU * R / n;
  float across = r - R - (hh.x - 0.5) * 0.004;
  float d = length(vec2(along * 0.78, across)) - 0.0050 * (0.75 + 0.5 * hh.y);
  float sec = TAU / 3.0;
  float al = mod(ang - base + ph + sec * 0.5, sec) - sec * 0.5;
  vec2 p = r * vec2(cos(al), sin(al)) - vec2(R, 0.0);
  return min(d, tomoe(vec2(dot(p, vec2(0.4794, -0.8776)), dot(p, vec2(0.8776, 0.4794))), h));
}
/* varredura que acende um anel no sentido horario a partir do topo (v: 0..1) */
float sweep(float ang, float v) {
  float a = fract((1.5708 - ang) / TAU + 1.0);
  return smoothstep(v, v - 0.05, a) * step(0.001, v);
}
/* padrao: devolve (cobertura da tinta, distancia minima) */
vec2 pattern(vec2 q, float r, float t, float spin, vec3 vis, float aa) {
  float ang = atan(q.y, q.x);
  float h = 0.056;
  float dm = r - 0.072 + (1.0 - smoothe(vis.x * 1.6)) * 0.08;
  bool lit = vis.z >= 1.0;
  if (abs(r - 0.262) < 0.17) {
    float d1 = ringPart(r, ang, 0.262, 1.5708, t * 0.011 - spin, h);
    dm = min(dm, lit ? d1 : d1 + (1.0 - sweep(ang, vis.x * 1.06)) * 0.2);
  }
  if (abs(r - 0.462) < 0.17) {
    float d2 = ringPart(r, ang, 0.462, 0.5236, -t * 0.008 + spin * 0.75, h);
    dm = min(dm, lit ? d2 : d2 + (1.0 - sweep(ang, vis.y * 1.06)) * 0.2);
  }
  if (abs(r - 0.742) < 0.17) {
    float d3 = ringPart(r, ang, 0.742, 1.5708, t * 0.0055 - spin * 0.5, h);
    dm = min(dm, lit ? d3 : d3 + (1.0 - sweep(ang, vis.z * 1.06)) * 0.2);
  }
  return vec2(smoothstep(aa, -aa, dm), dm);
}

/* fragmento de rocha: poligono irregular (7 faces), sombreado por face e aro aceso do lado da lua */
vec4 rock(vec2 p, float seed, vec2 L2, float aa, float lit) {
  float d = -1e3;
  vec2 nA = vec2(0.0, 1.0);
  for (int i = 0; i < 7; i++) {
    float fi = float(i);
    float a = fi * 0.8976 + (hash12(vec2(seed, fi)) - 0.5) * 0.55;
    vec2 n = vec2(cos(a), sin(a));
    float di = dot(p, n) - (0.60 + 0.42 * hash12(vec2(fi, seed * 1.37)));
    if (di > d) { d = di; nA = n; }
  }
  d += (nz(p * 4.5 + seed * 7.0) - 0.5) * 0.16;
  float a = smoothstep(aa, -aa, d);
  if (a <= 0.0) return vec4(0.0);
  float facet = max(dot(nA, L2), 0.0);
  float rim = smoothstep(-0.12, 0.0, d) * (0.30 + 0.70 * facet);
  vec3 c = vec3(0.028, 0.011, 0.015) * (0.65 + 0.7 * nz(p * 8.0 + seed));
  c += vec3(0.42, 0.09, 0.06) * facet * facet * 0.5 * lit;
  c += vec3(1.0, 0.40, 0.24) * rim * lit * 1.3;
  return vec4(c, a);
}

/* brasas: um plano de profundidade (celulas com uma particula cada); burst/streak = fragmentacao e tunel */
vec3 embers(vec2 q, float z, float cs, float dens, float t, float burst, float streak) {
  vec2 p = lay(q, z, 0.03 / z);
  vec2 dir = vec2(0.0, 1.0);
  if (burst > 0.0 || streak > 0.0) {
    dir = p / max(length(p), 1e-3);
    p -= dir * burst;
  }
  p.y -= t * 0.010 / z;
  vec2 g = p / cs;
  vec3 h = hash32(floor(g) + z * 17.0);
  if (h.z > dens) return vec3(0.0);
  vec2 dv = (fract(g) - 0.22 - 0.56 * h.xy) * cs;
  float size = (0.0022 + 0.0035 * h.x) / z;
  float reach = (size * 2.4 + 0.10 * cs) * (1.0 + streak);
  if (dot(dv, dv) > reach * reach) return vec3(0.0);
  dv -= 0.10 * cs * vec2(sin(t * 0.5 + h.x * TAU), cos(t * 0.43 + h.y * TAU));
  float d = streak > 0.0 ? length(vec2(dot(dv, dir) / (1.0 + streak), dot(dv, vec2(-dir.y, dir.x)))) : length(dv);
  float tw = 0.45 + 0.55 * sin(t * (0.6 + h.y) + h.x * 30.0);
  return mix(EMBER, vec3(1.0, 0.72, 0.5), h.y * h.y) * smoothstep(size * 2.4, size * 0.4, d) * tw * (0.35 + 0.65 * h.y);
}

/* o halo vermelho vira particulas que voam para fora (saida): poucas, irregulares, nascidas no limbo */
vec3 shatter(vec2 q, float k) {
  float r = length(q);
  vec2 dir = q / max(r, 1e-3);
  vec2 g = (q - dir * (0.75 * k * k)) / 0.034;
  vec2 id = floor(g);
  vec3 h = hash32(id + 41.0);
  if (h.z < 0.74) return vec3(0.0);
  float r0 = length((id + 0.5) * 0.034);
  float src = exp(-abs(r0 - 1.02) * 5.0) + 0.25 * exp(-max(r0 - 1.0, 0.0) * 1.5) * step(1.0, r0);
  vec2 dv = fract(g) - 0.5 - (h.xy - 0.5) * 0.7;
  float d = length(vec2(dot(dv, dir) / (1.0 + 1.5 * k), dot(dv, vec2(-dir.y, dir.x))));
  float sz = 0.06 + 0.10 * h.x;
  float life = smoothstep(0.0, 0.2, k) * (1.0 - smoothstep(0.55, 1.0, k));
  return mix(EMBER, vec3(1.0, 0.78, 0.6), h.y) * smoothstep(sz, sz * 0.2, d) * src * life * 2.2;
}

/* rastros do tunel: tracos radiais correndo para fora */
float streaks(vec2 q, float phase) {
  float r = length(q);
  float a = atan(q.y, q.x) / TAU + 0.5;
  vec3 h = hash32(vec2(floor(a * 160.0), 3.7));
  float lane = abs(fract(a * 160.0) - 0.5) * 2.0;
  float fz = fract(log(r + 0.04) * 1.8 - phase * (1.5 + 2.5 * h.x) + h.y * 13.0);
  return step(0.6, h.z) * smoothstep(1.0, 0.15, lane) * smoothstep(0.0, 0.05, fz) * smoothstep(0.38, 0.05, fz) * smoothstep(0.10, 0.45, r);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec3 rp = ripple(frag);
  vec2 q = (frag + rp.xy - uC) / uR;
  float t = uTime;
  float aa = 1.3 / uR;

  float L = uLeave;
  float E = uEnter;
  gTrav = 0.42 * pow(remap(L, 0.16, 0.60), 1.5);
  float shat = remap(L, 0.06, 0.40) * waveBehind(frag);
  float tun = remap(L, 0.20, 0.55);
  float gone = smoothe(remap(L, 0.30, 0.58));
  float Ee = remap(E, 0.40, 0.86);
  float rho = 2.8 * easeOut(Ee);
  float spin = 2.4 * pow(1.0 - remap(E, 0.40, 1.0), 2.0) + 1.2 * tun;
  lightK = 1.0 - shat * 0.85;

  /* ---- ceu ---- */
  vec2 qs = lay(q, 3.0, 0.004);
  float rs = length(qs);
  vec3 col = mix(SKY_BOT, SKY_TOP, smoothstep(-1.4, 1.1, qs.y));
  col += vec3(0.07, 0.010, 0.018) * smoothstep(0.45, 0.9, nz(qs * 1.4 + vec2(t * 0.003, 2.0)));
  col += HAZE * (0.32 * exp(-max(rs - 1.0, 0.0) * 2.6) + 0.05 * exp(-max(rs - 1.0, 0.0) * 0.7)) * lightK * (0.92 + 0.08 * sin(t * 0.37));
  if (rs > 1.05) {
    vec2 g = qs * 16.0;
    vec3 h = hash32(floor(g));
    float d = length(fract(g) - 0.5 - (h.xy - 0.5) * 0.7);
    if (h.z > 0.86 && d < 0.07) {
      float tw = 0.55 + 0.45 * sin(t * (0.8 + 2.2 * h.x) + h.y * TAU);
      col += vec3(1.0, 0.86, 0.82) * smoothstep(0.07, 0.0, d) * tw * (0.25 + 0.6 * h.y) * smoothstep(1.05, 1.6, rs);
    }
  }

  /* ---- lua ---- */
  vec2 qm = lay(q, 2.0, 0.012);
  float rm = length(qm);
  if (rm < 1.02) {
    vec3 mc = moonSurface(qm, min(rm, 1.0), t);
    vec3 vis = vec3(remap(Ee, 0.30, 0.62), remap(Ee, 0.42, 0.74), remap(Ee, 0.54, 0.86));
    vec2 pt = pattern(qm, rm, t, spin, vis, aa);
    float hatch = nzb(rot(1.1) * qm * vec2(70.0, 150.0));
    float scr = smoothstep(0.70, 0.90, nz(qm * 46.0 + 3.0));
    vec3 inkC = INK * (0.8 + 0.45 * hatch) + mc * 0.12 + vec3(0.32, 0.08, 0.07) * scr * 0.22;
    mc *= 1.0 - smoothstep(0.03, 0.0, pt.y) * 0.25 * (1.0 - pt.x);
    mc = mix(mc, inkC, pt.x * 0.94);
    mc *= 1.0 - shat * 0.35;
    col = mix(col, mc, smoothstep(1.0 + aa * 1.5, 1.0 - aa * 1.5, rm));
  }

  /* ---- nuvens finas na frente da lua ---- */
  {
    vec2 qf = lay(q, 1.3, 0.017);
    float band = smoothstep(0.30, 0.0, abs(qf.y + 0.40)) + 0.75 * smoothstep(0.17, 0.0, abs(qf.y - 0.60 - 0.08 * qf.x)) + 0.5 * smoothstep(0.13, 0.0, abs(qf.y - 0.30 + 0.12 * qf.x));
    if (band > 0.002) {
      vec2 pf = qf * vec2(1.1, 3.3) + vec2(t * 0.008, 0.0);
      float df = fbm3(pf + nz(pf * 0.8 + 2.0) * 0.9);
      float a = smoothstep(0.44, 0.74, df) * sat(band) * 0.8;
      float thin = 1.0 - smoothstep(0.44, 0.68, df);
      vec3 c = mix(vec3(0.045, 0.011, 0.015), vec3(0.98, 0.33, 0.20), sat(thin * moonBehind(qf * 0.98) * lightK * 1.05 + 0.04));
      col = mix(col, c, a);
    }
  }

  /* ---- nevoa vermelha e feixes atravessando a nevoa ---- */
  {
    vec2 qr = lay(q, 1.2, 0.013);
    float rr = length(qr);
    vec2 dr = qr / max(rr, 1e-3);
    float rays = nz(rot(t * 0.004) * dr * 4.0 + vec2(t * 0.02, 0.0)) * 0.6 + nz(rot(-t * 0.003) * dr * 11.0 + 2.0) * 0.4;
    rays = pow(smoothstep(0.35, 0.85, rays), 2.2);
    float mist = fbm3(qr * 1.3 + vec2(-t * 0.006, t * 0.004) + 20.0);
    float shaft = rays * smoothstep(0.97, 1.12, rr) * exp(-(rr - 1.0) * 1.2) * (0.3 + 0.9 * mist);
    float fog = smoothstep(0.35, 0.85, mist) * exp(-max(rr - 1.0, 0.0) * 0.8) * 0.22;
    float veil = smoothstep(0.42, 0.0, abs(qr.y + 0.56 + 0.05 * sin(qr.x * 2.0 + t * 0.05))) * smoothstep(0.30, 0.78, mist) * smoothstep(1.25, 0.6, abs(qr.x));
    col += HAZE * (shaft * 0.95 + fog + veil * 0.32) * lightK;
  }

  /* ---- rochas distantes ---- */
${floatersGLSL(
  ROCKS.filter((r) => r.z > 1.05),
  ROCK_BODY,
)}

  /* ---- banco de nuvens: cobre o pe da lua, topo aceso ---- */
  {
    vec2 qc = lay(q, 0.95, 0.030);
    if (qc.y < -0.12) {
      vec2 pc = qc * 1.55 + vec2(t * 0.011, 0.0);
      float wv = nz(pc * 0.7 + 7.0);
      float dc = fbm(pc + vec2(wv * 1.2, wv * 0.5));
      float top = -0.60 + 0.20 * (nz(vec2(qc.x * 1.6 + t * 0.004, 3.0)) - 0.5);
      float body = smoothstep(top + 0.06, top - 0.40, qc.y);
      float dens = dc * 0.62 + body * 0.58;
      float a = smoothstep(0.42, 0.62, dens);
      float edge = 1.0 - smoothstep(0.42, 0.58, dens - 0.05);
      vec3 c = mix(vec3(0.026, 0.008, 0.012), vec3(0.88, 0.24, 0.14), sat(edge * moonBehind(qc * 1.02) * lightK * 1.2));
      c += vec3(0.10, 0.015, 0.02) * (1.0 - body) * 0.3;
      col = mix(col, c, a);
    }
  }

  /* ---- rochas proximas ---- */
${floatersGLSL(
  ROCKS.filter((r) => r.z <= 1.05),
  ROCK_BODY,
)}

  /* ---- brasas (dois planos atras da nevoa proxima) ---- */
  float burst = 0.5 * shat * shat;
  float streak = 2.5 * tun;
  float boostE = 1.0 + 2.0 * shat * (1.0 - gone);
  col += embers(q, 1.4, 0.085, 0.30 + 0.35 * shat, t, burst, streak) * 0.55 * boostE;
  col += embers(q, 0.95, 0.12, 0.26 + 0.30 * shat, t, burst, streak) * 0.75 * boostE;

  /* ---- nevoa proxima: massas escuras no pe e nos cantos ---- */
  {
    vec2 qn = lay(q, 0.62, 0.052);
    if (qn.y < -0.35 || abs(qn.x) > 0.85) {
      float dn = fbm3(qn * 0.85 + vec2(t * 0.016, -t * 0.003));
      float low = smoothstep(-0.55, -1.15, qn.y);
      float side = smoothstep(0.95, 1.6, abs(qn.x)) * 0.6;
      float a = smoothstep(0.30, 0.80, dn * 0.7 + max(low, side) * 0.55) * 0.82;
      vec3 c = mix(vec3(0.020, 0.006, 0.009), vec3(0.20, 0.035, 0.035), sat((dn - 0.45) * 2.0) * 0.45 * lightK);
      col = mix(col, c, a);
    }
  }

  /* ---- brasas proximas (bokeh) ---- */
  col += embers(q, 0.55, 0.20, 0.20 + 0.25 * shat, t, burst * 1.6, streak * 1.5) * 0.9 * boostE;

  /* ---- saida: luz em particulas, tunel ---- */
  if (L > 0.0) {
    col += shatter(lay(q, 1.6, 0.013), shat) * (1.0 - gone);
    col = mix(col, TUNNEL, gone * 0.9);
    col += mix(vec3(0.50, 0.72, 1.0), vec3(1.0, 0.45, 0.35), 0.3 * (1.0 - tun)) * streaks(q, L * 7.0) * tun * (1.0 - remap(L, 0.85, 1.0)) * 0.9;
    col += vec3(0.30, 0.50, 0.95) * rp.z * 0.10;
  }

  col *= mix(1.0, vignette(frag), 0.55);

  /* ---- chegada: onda vermelha a partir do centro, a lua aparece atraves da nevoa ---- */
  float alpha = 1.0;
  if (E < 1.0) {
    float on = remap(E, 0.38, 0.44);
    vec2 dc = (frag - uC) / uR;
    float rc = length(dc);
    alpha = smoothstep(rho + 0.02, rho - 0.30, rc) * on;
    float behind = sat((rho - rc) / 0.9);
    col = mix(col, vec3(0.30, 0.045, 0.040) + HAZE * 0.25, (1.0 - behind) * (1.0 - remap(E, 0.6, 1.0)) * 0.75);
    /* a frente: luz vermelha que atravessa a nevoa, quebrada pelo ruido, com um brilho fraco correndo na frente */
    float brk = 0.5 + 0.5 * nz(dc / max(rc, 1e-3) * 5.0 + vec2(t * 0.3, 0.0));
    float fade = (1.0 - remap(E, 0.70, 0.95)) * on;
    float fr = exp(-pow((rc - rho) / 0.075, 2.0)) * brk * fade;
    float ahead = exp(-max(rc - rho, 0.0) * 6.0) * step(rho, rc) * fade;
    col = mix(col, vec3(0.62, 0.07, 0.05), sat(ahead * (1.0 - alpha)));
    col += vec3(0.70, 0.09, 0.06) * fr * 0.5;
    alpha = max(max(max(alpha, fr * 0.7), ahead * 0.24), remap(E, 0.90, 0.97));
  }
  gl_FragColor = vec4(min(col, vec3(1.0)) * alpha, alpha);
}
`;
