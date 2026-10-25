import { SHARDS } from "./scene.config";
import { SCENE_GLSL_COMMON, floatersGLSL } from "./glsl-common";

/**
 * VAZIO ILIMITADO — o universo do tema Gojo (claro).
 *
 * Camadas, do fundo para a frente:
 *   pérola (z 3)       branco perolado com reflexos iridescentes lentos
 *   túnel (z 2)        centro azul profundo, degradê azul → gelo → pérola, camadas
 *                      de luz que recuam em perspectiva; lente e refração cromática
 *                      discreta na borda do portal; uma bolha de distorção que passeia
 *   anéis (z 2 → 1,55) quatro anéis de luz, elípticos, cada um girando num sentido
 *   névoa (z 1,2)      névoa fluida girando em vórtice em volta do portal
 *   estilhaços         fragmentos de cristal flutuando (refratam o túnel atrás deles)
 *   partículas         fluxo puxado para o centro (espaço log-polar: encolhem ao se afastar)
 *                      e poeira clara mais perto
 *
 * O azul profundo fica contido no miolo (r < 0,3): o lema, a coluna de apps e os
 * microtextos do HUD ficam sobre gelo e pérola, onde o texto escuro do tema lê bem.
 *
 * Chegada (uEnter): um ponto azul aparece no fim do túnel, os anéis se abrem a partir
 * do centro (com uma leve sobra) e a luz perolada inunda a tela; giro e brilho extras
 * decaem até a animação ambiente. Saída (uLeave): os anéis se contraem girando mais
 * rápido, o vazio engole a luz do centro para fora e a iluminação cai aos poucos.
 */
const SHARD_BODY = /* glsl */ `
      vec2 nA;
      float d = shard(lp, seed, nA);
      float saa = 1.4 / (uR * S * sc) * (1.0 + 2.6 * sat(0.82 - z));
      float a = smoothstep(saa, -saa, d);
      if (a > 0.0) {
        vec2 Ld = c / max(length(c), 1e-3);
        float facet = dot(nA, -Ld) * 0.5 + 0.5;
        float rim = smoothstep(-0.12, 0.0, d);
        vec3 glass = mix(col, vec3(0.70, 0.84, 1.0), 0.32);
        glass = mix(glass, vec3(1.0), pow(facet, 8.0) * 0.55);
        glass = mix(glass, vec3(0.24, 0.46, 0.86), rim * (1.0 - facet) * 0.6);
        glass = mix(glass, vec3(1.0), rim * facet * 0.8);
        col = mix(col, glass, a * (1.0 - smoothstep(2.6, 4.2, sc)));
      }`;

export const VOID_FRAG = /* glsl */ `${SCENE_GLSL_COMMON}
const vec3 PEARL = vec3(0.953, 0.961, 0.973);
const vec3 ICE = vec3(0.78, 0.89, 1.0);
const vec3 BLUE = vec3(0.16, 0.44, 0.93);
const vec3 DEEP = vec3(0.020, 0.075, 0.25);
const vec3 ABYSS = vec3(0.004, 0.012, 0.045);
const vec3 GLOW = vec3(0.50, 0.74, 1.0);

float gTrav;
float rw;

float scl(float z) { return z / max(z - gTrav, 0.06); }
vec2 lay(vec2 q, float z, float par) { return (q + uPar * par) / scl(z); }

/* degrade do tunel pelo raio normalizado (1 = borda do portal) */
vec3 wallC(float r) {
  vec3 c = mix(ABYSS, DEEP, smoothstep(0.0, 0.24, r));
  c = mix(c, BLUE, smoothstep(0.16, 0.42, r));
  c = mix(c, ICE, smoothstep(0.36, 0.64, r));
  return mix(c, PEARL, smoothstep(0.60, 1.02, r));
}

/* bracos do vortice: espiral logaritmica de 3 bracos, quebrada por ruido; giram e afundam devagar */
float arms(vec2 q, float r, float t, float spin) {
  float a = atan(q.y, q.x);
  float ph = a * 3.0 + log(max(r, 0.02)) * 7.0 - t * 0.32 - spin * 2.0;
  float arm = pow(0.5 + 0.5 * cos(ph), 2.5);
  float brk = nz(rot(t * 0.03 + spin) * q * 7.0 + 3.0);
  return arm * (0.35 + 0.65 * brk) * smoothstep(0.03, 0.22, r) * (1.0 - smoothstep(0.50, 0.92, r));
}

vec3 pearl(vec2 q, float t) {
  float n = nz(q * 0.8 + vec2(t * 0.004, -t * 0.003) + 30.0);
  vec3 iri = 0.5 + 0.5 * cos(TAU * (n * 0.9 + vec3(0.0, 0.33, 0.67)));
  vec3 c = PEARL * (0.975 + 0.05 * iri);
  /* nuvens perolizadas: veios gelo para dar profundidade, claros quase brancos */
  float cl = fbm3(q * 1.05 + vec2(-t * 0.006, t * 0.004) + 50.0);
  c = mix(c, vec3(0.85, 0.90, 0.985), smoothstep(0.55, 0.86, cl) * 0.5);
  return mix(c, vec3(1.0, 0.985, 1.0), smoothstep(0.38, 0.12, cl) * 0.4);
}

/* costelas de luz do tunel: faixas que torcem com a profundidade e correm para o fundo */
float ribs(vec2 q, float r, float t, float spin) {
  float dpt = 0.22 / max(r, 0.012);
  float u = (atan(q.y, q.x) + dpt * 1.25 + t * 0.03 + spin * 0.5) / TAU * 64.0;
  vec3 h = hash32(vec2(mod(floor(u), 64.0), 5.0));
  float lane = abs(fract(u) - 0.5) * 2.0;
  float flow = fract(dpt * 0.55 - t * (0.05 + 0.07 * h.x) + h.y * 7.0);
  float dash = smoothstep(0.0, 0.1, flow) * smoothstep(0.75, 0.12, flow);
  return step(0.62, h.z) * smoothstep(0.34, 0.0, lane) * dash * smoothstep(0.05, 0.22, r) * (1.0 - smoothstep(0.34, 0.62, r));
}

/* camadas de luz que recuam: folhas a profundidade constante (1/r), andando para o fundo */
float sheets(vec2 q, float r, float t, float spin) {
  float dpt = 0.22 / max(r, 0.012);
  float ph = dpt * 1.35 - t * 0.11;
  float fb = fract(ph);
  float s = smoothstep(0.0, 0.05, fb) * smoothstep(0.62, 0.05, fb);
  vec2 dir = q / max(r, 1e-4);
  float brk = nz(rot(dpt * 0.5 - t * 0.02 - spin * 0.25) * dir * 2.6 + vec2(floor(ph) * 5.7, 1.3));
  s *= 0.22 + 0.78 * smoothstep(0.30, 0.86, brk);
  return s * smoothstep(0.035, 0.20, r) * (1.0 - smoothstep(0.62, 1.0, r));
}

/* anel de luz eliptico: nucleo com franja cromatica + brilho; arcos mais fortes giram com o anel */
void ringLight(vec2 p, float R, float w, float ell, float tilt, float ph, float seed, out vec3 core, out float glow) {
  vec2 pp = rot(tilt) * p;
  pp.y /= ell;
  float rr = length(pp);
  core = vec3(0.0);
  glow = 0.0;
  if (abs(rr - R) > w * 60.0) return;
  vec2 dir = pp / max(rr, 1e-4);
  float arc = 0.16 + 0.84 * smoothstep(0.22, 0.86, nz(rot(ph) * dir * 1.8 + seed * 7.0));
  vec3 d = abs(vec3(rr) - R * vec3(1.010, 1.0, 0.990));
  core = exp(-(d * d) / (w * w)) * arc;
  glow = exp(-abs(rr - R) / (w * 9.0)) * arc;
}

/* estilhaco: quadrilatero fino e comprido; devolve a distancia e a normal da face ativa */
float shard(vec2 p, float seed, out vec2 nA) {
  float d = -1e3;
  nA = vec2(0.0, 1.0);
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    float a = fi * 1.2566 + (hash12(vec2(seed, fi * 1.7)) - 0.5) * 0.8;
    vec2 n = normalize(vec2(cos(a) * 3.4, sin(a)));
    float di = dot(p, n) - (0.34 + 0.30 * hash12(vec2(fi, seed)));
    if (di > d) { d = di; nA = n; }
  }
  return d;
}

/* particulas puxadas para o centro: celulas em espaco log-polar (perspectiva: encolhem ao se afastar) */
float inflow(vec2 q, float t, float speed) {
  float r = length(q);
  if (r < 0.04) return 0.0;
  vec2 g = vec2(log(r) * 3.2 + t * 0.09 * speed, (atan(q.y, q.x) / TAU + 0.5) * 56.0 + t * 0.35 * speed);
  vec2 id = floor(g);
  vec3 h = hash32(vec2(id.x, mod(id.y, 56.0)) + 9.0);
  if (h.z > 0.30) return 0.0;
  float d = length(fract(g) - 0.5 - (h.xy - 0.5) * 0.6);
  if (d > 0.16) return 0.0;
  float tw = 0.5 + 0.5 * sin(t * (1.0 + h.x) + h.y * 20.0);
  return smoothstep(0.16, 0.02, d) * smoothstep(0.08, 0.35, r) * (1.0 - smoothstep(1.4, 2.4, r)) * tw * (0.5 + 0.5 * h.y);
}

/* poeira clara mais perto da camera */
float dust(vec2 q, float z, float cs, float t) {
  vec2 p = lay(q, z, 0.03 / z);
  p += vec2(t * 0.006, t * 0.004) / z;
  vec2 g = p / cs;
  vec3 h = hash32(floor(g) + z * 13.0);
  if (h.z > 0.26) return 0.0;
  vec2 dv = (fract(g) - 0.22 - 0.56 * h.xy) * cs;
  float size = (0.0020 + 0.0030 * h.x) / z;
  float reach = size * 2.4 + 0.08 * cs;
  if (dot(dv, dv) > reach * reach) return 0.0;
  dv -= 0.08 * cs * vec2(sin(t * 0.4 + h.x * TAU), cos(t * 0.33 + h.y * TAU));
  return smoothstep(size * 2.4, size * 0.4, length(dv)) * (0.4 + 0.6 * h.y);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec3 rp = ripple(frag);
  vec2 q = (frag + rp.xy - uC) / uR;
  float t = uTime;

  float L = uLeave;
  float E = uEnter;
  gTrav = 0.0;
  float open = easeOut(remap(E, 0.50, 0.92));
  float over = 1.0 + 0.07 * sin(PI * remap(E, 0.64, 1.0));
  float pre = remap(E, 0.36, 0.52) * (1.0 - open);
  float rho = mix(0.05 + 0.12 * remap(E, 0.36, 0.52), 2.7, open);
  float boost = 1.0 - remap(E, 0.64, 1.0);
  float contr = smoothe(remap(L, 0.04, 0.50));
  float dim = smoothe(remap(L, 0.12, 0.60));
  float spin = 3.0 * pow(1.0 - remap(E, 0.50, 1.0), 2.0) + 5.0 * contr;
  /* os aneis abrem junto com a frente; o degrade do tunel cresce um pouco atras dela (o miolo azul domina no comeco) */
  float rs = clamp(rho, 0.06, 1.0) * over * mix(1.0, 0.10, contr);
  rw = clamp(rho * 0.62, 0.05, 1.0) / (1.0 + 2.4 * contr);

  /* ---- perola ---- */
  vec3 col = pearl(lay(q, 3.0, 0.004), t);

  /* ---- tunel, com lente na borda do portal e uma bolha de distorcao ---- */
  vec2 qt = lay(q, 2.0, 0.011);
  float r0 = length(qt);
  vec2 vp = vec2(0.075, 0.05) - uPar * 0.05;
  qt -= vp * smoothstep(0.95, 0.0, r0 / max(rw, 0.05));
  r0 = length(qt);
  float edge = exp(-pow((r0 - rw) / (0.12 * max(rw, 0.2)), 2.0));
  vec2 lens = qt * (1.0 - 0.065 * edge);
  if (edge > 0.02) lens += (nz3(qt * 9.0 + vec2(t * 0.08, -t * 0.06)).xy - 0.5) * 0.014 * edge;
  vec2 bd = lens - 1.22 * vec2(cos(t * 0.045 + 1.0), 0.75 * sin(t * 0.06));
  lens -= bd * exp(-dot(bd, bd) / 0.05) * 0.22;
  float rt = length(lens) / max(rw, 0.02);
  vec2 dirT = lens / max(length(lens), 1e-4);
  rt *= 1.0 + (nz(rot(t * 0.02) * dirT * 2.4 + 9.0) - 0.5) * 0.22 * smoothstep(0.25, 0.75, rt);
  float ca = 0.012 * edge + 0.006;
  vec3 wall = vec3(wallC(rt * (1.0 + ca)).r, wallC(rt).g, wallC(rt * (1.0 - ca)).b);
  col = mix(col, wall, 1.0 - smoothstep(0.85, 1.25, rt));
  if (rt < 1.02) {
    float sh = sheets(lens, rt, t, spin) * (1.0 + 0.8 * boost);
    col += mix(vec3(0.42, 0.66, 1.0), vec3(1.0), smoothstep(0.25, 0.9, rt)) * sh * (0.42 + 0.22 * smoothstep(0.2, 0.7, rt));
    col += vec3(0.55, 0.78, 1.0) * ribs(lens, rt, t, spin) * (0.40 + 0.5 * boost);
    float arm = arms(lens, rt, t, spin) * (1.0 + 0.7 * boost);
    col = mix(col, vec3(0.62, 0.82, 1.0), sat(arm * 0.42));
    col += vec3(0.30, 0.45, 0.80) * arm * 0.10;
  }

  /* ---- aneis luminosos, cada um num sentido ---- */
  vec3 core;
  float glow;
  float rk = 1.0 + 0.6 * boost;
  ringLight(lay(q, 2.0, 0.011) * (1.0 - 0.05 * edge), 0.36 * rs, 0.0045, 0.96, 0.30, t * 0.050 + spin, 1.0, core, glow);
  col = mix(col, GLOW, sat(glow * 0.52 * rk));
  col = mix(col, vec3(1.0), clamp(core * 0.95 * rk, 0.0, 1.0));
  ringLight(lay(q, 1.85, 0.013), 0.53 * rs, 0.0040, 0.92, -0.45 + t * 0.004, -t * 0.034 - spin * 0.8, 2.0, core, glow);
  col = mix(col, GLOW, sat(glow * 0.36 * rk));
  col = mix(col, vec3(1.0), clamp(core * 0.88 * rk, 0.0, 1.0));
  ringLight(lay(q, 1.7, 0.015), 0.72 * rs, 0.0036, 0.97, 1.10, t * 0.022 + spin * 0.6, 3.0, core, glow);
  col = mix(col, GLOW, sat(glow * 0.34 * rk));
  col = mix(col, vec3(1.0), clamp(core * 0.84 * rk, 0.0, 1.0));
  ringLight(lay(q, 1.55, 0.017) * (1.0 - 0.04 * edge), 0.95 * rs, 0.0032, 0.94, -1.30 - t * 0.003, -t * 0.014 - spin * 0.45, 4.0, core, glow);
  col = mix(col, GLOW, sat(glow * 0.32 * rk));
  col = mix(col, vec3(1.0), clamp(core * 0.80 * rk, 0.0, 1.0));

  /* ---- particulas puxadas para o fundo do tunel ---- */
  col = mix(col, mix(GLOW, vec3(1.0), smoothstep(0.2, 0.6, rt)), sat(inflow(lay(q, 1.8, 0.012), t, 1.0 + 3.0 * boost + 2.0 * contr)) * 0.85);

  /* ---- nevoa fluida em vortice ---- */
  {
    vec2 qm = lay(q, 1.2, 0.022);
    float rm = length(qm);
    vec2 pm = rot(0.95 / (rm + 0.35) - t * 0.016 - spin * 0.2) * qm;
    float m1 = fbm3(pm * 1.8 + vec2(t * 0.011, -t * 0.007));
    float m2 = nz(pm * 4.0 - vec2(t * 0.018, 0.0) + m1 * 1.5);
    float mist = smoothstep(0.50, 0.88, m1 * 0.62 + m2 * 0.48);
    vec3 mc = mix(vec3(0.60, 0.79, 1.0), vec3(0.93, 0.96, 1.0), smoothstep(0.30, 0.92, rm / max(rw, 0.05)));
    float rimMist = exp(-pow((rm - 0.9) / 0.32, 2.0));
    col = mix(col, mc, mist * (0.18 + 0.22 * smoothstep(0.22, 0.8, rm) + 0.12 * rimMist) * (1.0 - 0.6 * smoothstep(1.1, 1.9, rm)));
  }

  /* ---- estilhacos ---- */
${floatersGLSL(SHARDS, SHARD_BODY)}

  /* ---- poeira proxima ---- */
  col = mix(col, vec3(0.62, 0.80, 1.0), sat(dust(q, 0.9, 0.12, t)) * 0.7);
  col = mix(col, vec3(0.70, 0.86, 1.0), sat(dust(q, 0.55, 0.20, t)) * 0.55);

  /* ---- saida: a luz cai e esfria, um vermelho fraco se insinua; a frente da onda tinge de vermelho ---- */
  if (L > 0.0) {
    col = mix(col, col * vec3(0.50, 0.54, 0.66), dim * 0.9);
    col = mix(col, vec3(0.36, 0.10, 0.11), remap(L, 0.38, 0.80) * 0.28);
    col += vec3(0.85, 0.18, 0.14) * rp.z * 0.08;
  }
  col *= mix(1.0, vignette(frag), 0.10);
  /* chegada: o universo acende enquanto os aneis se abrem (azul crepuscular -> perola), sem clarao */
  if (E < 1.0) col *= mix(vec3(0.46, 0.58, 0.86), vec3(1.0), smoothe(remap(E, 0.48, 0.84)));

  /* ---- chegada: ponto azul no fim do tunel, depois a abertura a partir do centro ---- */
  float alpha = 1.0;
  if (E < 1.0) {
    float on = remap(E, 0.34, 0.40);
    float rc = length((frag - uC) / uR);
    alpha = smoothstep(rho + 0.02, rho - 0.32, rc) * on;
    col += BLUE * 0.9 * exp(-rc * rc / 0.012) * pre;
    float fr = exp(-pow((rc - rho) / 0.11, 2.0)) * (1.0 - remap(E, 0.76, 0.98)) * on;
    col = mix(col, vec3(0.70, 0.86, 1.0), fr * 0.45);
    alpha = max(max(alpha, fr * 0.8), remap(E, 0.90, 0.97));
    alpha = max(alpha, sat(exp(-rc * rc / 0.012) * pre * 1.4));
  }
  gl_FragColor = vec4(min(col, vec3(1.0)) * alpha, alpha);
}
`;
