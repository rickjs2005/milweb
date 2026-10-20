/**
 * O OLHO — fragment shader (WebGL 1, quad único), com DUAS identidades.
 *
 * Um olho visto de frente, em 2.5D, com anatomia de verdade:
 *   · globo ocular = esfera analítica; a íris é um disco côncavo ATRÁS da
 *     córnea, alcançado por refração do raio de visão (profundidade e
 *     paralaxe reais quando o olhar muda);
 *   · pálpebras = duas curvas no plano com PELE opaca (volume, vinco, sombra
 *     da órbita, textura fina) que esmaece para o papel de parede — ao piscar
 *     a pálpebra desce como pele, o olho nunca é comprimido;
 *   · cílios fio a fio (raiz na borda da pálpebra, três segmentos curvando
 *     para fora, mais longos no canto externo; giram para baixo quando a
 *     pálpebra fecha) sobre a sombra densa da base; cílios inferiores curtos;
 *   · esclera com sombreamento esférico, sombra projetada e sombra de contato
 *     da pálpebra superior, vasos finos na periferia, carúncula no canto
 *     interno e a linha úmida (waterline) na pálpebra inferior;
 *   · íris com fibras radiais (ruído PERIÓDICO em polares — sem emenda),
 *     criptas, colarete, sulcos de contração, franja da pupila, anel limbar e
 *     luz atravessando a íris do lado oposto ao reflexo;
 *   · córnea com o reflexo macio de uma janela, um ponto secundário, brilho
 *     especular largo e o menisco da lágrima na borda inferior.
 *
 * uTheme escolhe a identidade (ramo uniforme — a GPU executa só um lado):
 *   0 · GOJO (tema claro): pele clara quase da cor do papel de parede (a
 *     forma vem das sombras, não de uma mancha), íris azul intensa dos Six
 *     Eyes (núcleo ciano luminoso, meio azul saturado, borda marinho) com
 *     fibras claras, anel luminoso e brilho azul na reabertura.
 *   1 · OBITO (tema escuro): pele em penumbra quente, íris vermelha com
 *     fibras e o Mangekyō Sharingan de Obito em tinta — pupila ligada a três
 *     lâminas curvas em cata-vento, estreitas junto à pupila e alargando até a
 *     borda, girando no sentido horário — e brilho vermelho na reabertura.
 *
 * Uniforms: uRes · uAspect/uScale (enquadramento) · uTime · uBlink (0 aberto
 * … 1 fechado) · uGaze (−1..1) · uGlow (reabertura) · uDilate · uFade ·
 * uEdge (esmaecimento lateral pelo quadro) · uTheme (0 Gojo · 1 Obito).
 * (Nada de crase nos comentários do GLSL: o shader vive numa template literal.)
 */
export const OS_EYE_FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv;

uniform vec2  uRes;
uniform float uAspect;
uniform float uScale;
uniform float uTime;
uniform float uBlink;
uniform vec2  uGaze;
uniform float uGlow;
uniform float uDilate;
uniform float uFade;
uniform float uEdge;
uniform float uTheme;

#define PI 3.141592653589793
#define TAU 6.283185307179586
#define IRIS 0.60
#define RB 1.18

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
/* ruído periódico em x (período inteiro per): fibras radiais sem emenda no ângulo */
float noiseA(vec2 p, float per) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float x0 = mod(i.x, per), x1 = mod(i.x + 1.0, per);
  return mix(mix(hash(vec2(x0, i.y)), hash(vec2(x1, i.y)), f.x), mix(hash(vec2(x0, i.y + 1.0)), hash(vec2(x1, i.y + 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.07 + 11.3; a *= 0.5; }
  return v;
}
float bump(float x, float k) { return pow(max(0.0, 1.0 - x * x), k); }
/* distância a um segmento + posição ao longo dele (0..1) */
vec2 seg(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return vec2(length(pa - ba * h), h);
}
vec2 rot(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }

/* pálpebras: altura em função de x (−1..1, canto a canto) e do piscar; o olho inteiro
   inclina para cima no canto externo (x > 0) */
float lidUp(float x, float b) {
  float open = 0.54 * bump(x, 0.58) * (1.0 + 0.06 * x) + 0.05 * x;
  float shut = -0.30 * bump(x, 0.85) + 0.05 * x - 0.02;
  return mix(open, shut, b);
}
float lidLow(float x, float b) {
  float open = -0.40 * bump(x, 0.72) * (1.0 + 0.02 * x) + 0.05 * x;
  float shut = -0.26 * bump(x, 0.85) + 0.05 * x;
  return mix(open, shut, b * 0.75);
}

/* ---- cílios fio a fio ------------------------------------------------------------------- */
/* Um fio: raiz p0, direção inicial dir, comprimento len, três segmentos que vão curvando por curl;
   espessura w0 na raiz afinando até quase zero na ponta. Devolve cobertura (0..1). */
float strand(vec2 p, vec2 p0, vec2 dir, float len, float curl, float w0, float px) {
  if (length(p - p0) > len * 1.05 + w0) return 0.0;
  float m = 0.0;
  vec2 a = p0;
  vec2 d = dir;
  for (int k = 0; k < 5; k++) {
    float t0 = float(k) / 5.0, t1 = float(k + 1) / 5.0;
    vec2 bq = a + d * len * 0.2;
    vec2 sg = seg(p, a, bq);
    float w = w0 * mix(1.0 - t0 * t0 * 0.95, 1.0 - t1 * t1 * 0.95, sg.y) + 0.0004;
    m = max(m, smoothstep(w + px * 1.2, w - px * 0.8, sg.x));
    a = bq;
    d = rot(d, curl * 0.45);
  }
  return m;
}
/* Superiores: 22 fios com raiz na borda da pálpebra, inclinados para fora e curvando; mais longos e
   grossos no canto externo, curtos e finos no interno. Ao fechar, giram para baixo com a pálpebra. */
float lashesUp(vec2 p, float b, float px) {
  float m = 0.0;
  for (int i = 0; i < 38; i++) {
    float fi = float(i);
    bool back = i >= 24;                                   /* segunda fileira: curtos, finos, mais inclinados */
    float n = back ? 14.0 : 24.0;
    float j = back ? fi - 24.0 : fi;
    float x0 = -0.96 + 1.92 * (j + (back ? 0.9 : 0.5)) / n + 0.03 * (hash(vec2(fi, 1.0)) - 0.5);
    float y0 = lidUp(x0, b) + (back ? 0.010 : 0.003);
    float dy = (lidUp(x0 + 0.01, b) - lidUp(x0 - 0.01, b)) * 50.0;
    vec2 tang = normalize(vec2(1.0, dy));
    vec2 nrm = vec2(-tang.y, tang.x);
    float outer = smoothstep(-0.95, 0.95, x0);
    float len = (0.07 + 0.17 * outer) * (0.75 + 0.5 * hash(vec2(fi, 2.0))) * (back ? 0.55 : 1.0);
    float ang = 0.20 + 0.62 * outer + 0.30 * (hash(vec2(fi, 3.0)) - 0.5) + (back ? 0.25 : 0.0) + b * 2.3;
    vec2 dir = normalize(nrm * cos(ang) + tang * sin(ang));
    float curl = 0.30 + 0.30 * outer + 0.20 * (hash(vec2(fi, 4.0)) - 0.5);
    float w0 = (0.0042 + 0.0032 * outer) * (0.8 + 0.4 * hash(vec2(fi, 7.0))) * (back ? 0.7 : 1.0);
    m = max(m, strand(p, vec2(x0, y0), dir, len, curl, w0, px));
  }
  return m;
}
/* Inferiores: 10 fios curtos e finos apontando para baixo e para fora. */
float lashesLow(vec2 p, float b, float px) {
  float m = 0.0;
  for (int i = 0; i < 14; i++) {
    float fi = float(i);
    float x0 = -0.55 + 1.45 * (fi + 0.5) / 14.0 + 0.03 * (hash(vec2(fi, 5.0)) - 0.5);
    float y0 = lidLow(x0, b) - 0.006;
    float len = (0.035 + 0.045 * smoothstep(-0.3, 0.9, x0)) * (0.8 + 0.4 * hash(vec2(fi, 8.0)));
    float ang = 0.25 + 0.40 * smoothstep(0.0, 0.9, x0) + 0.25 * (hash(vec2(fi, 6.0)) - 0.5);
    vec2 dir = vec2(sin(ang), -cos(ang));
    m = max(m, strand(p, vec2(x0, y0), dir, len, 0.22, 0.0026, px));
  }
  return m * (1.0 - b * 0.7);
}

/* ---- íris: estrutura comum (fibras, criptas, colarete, sulcos), cor por tema ------------ */
/* a01 = ângulo normalizado 0..1 (periódico); todo ruído angular usa períodos INTEIROS — sem emenda */
void irisStructure(float ir, float a01, vec2 ipn, float t, out float fib, out float crypt, out float coll, out float furrow) {
  float warp = fbm(ipn * 1.6 + 2.0) - 0.5;
  float f1 = noiseA(vec2(a01 * 56.0 + warp * 3.0, ir * 5.0 + t * 0.01), 56.0);
  float f2 = noiseA(vec2(a01 * 140.0 - warp * 2.0, ir * 12.0 + 3.0), 140.0);
  float f3 = noiseA(vec2(a01 * 22.0 + 7.0, ir * 2.5), 22.0);
  float f4 = noiseA(vec2(a01 * 90.0 + 11.0, ir * 30.0), 90.0);
  float strandN = pow(abs(sin(a01 * PI * 31.0 + warp * 5.0 + f3 * 3.0)), 10.0);
  fib = 0.40 * f1 + 0.30 * f2 + 0.25 * f3 + 0.15 * f4 + 0.22 * strandN * smoothstep(0.30, 0.55, ir) * smoothstep(1.0, 0.75, ir);
  crypt = smoothstep(0.62, 0.80, noiseA(vec2(a01 * 18.0 + 3.0, ir * 4.0 + 1.5), 18.0)) * smoothstep(0.42, 0.62, ir) * smoothstep(0.98, 0.80, ir);
  float cr = 0.42 + 0.04 * (noiseA(vec2(a01 * 26.0, 2.0), 26.0) - 0.5);
  coll = smoothstep(0.05, 0.0, abs(ir - cr));
  furrow = smoothstep(0.80, 1.0, sin(ir * 52.0 + warp * 6.0)) * smoothstep(0.58, 0.78, ir) * smoothstep(0.98, 0.85, ir);
}

void main() {
  vec2 uv = vUv * 2.0 - 1.0;
  vec2 p = vec2(uv.x * uAspect, uv.y) / uScale;
  float px = 2.0 * uAspect / (uRes.x * uScale);
  float b = uBlink;
  bool gojo = uTheme < 0.5;

  /* ---- abertura (entre as pálpebras) ---------------------------------- */
  float yu = lidUp(p.x, b);
  float yl = lidLow(p.x, b);
  float inX = 1.0 - smoothstep(0.985, 1.0, abs(p.x));
  float dUp = yu - p.y;            /* > 0 abaixo da pálpebra superior (dentro) */
  float dLow = p.y - yl;           /* > 0 acima da pálpebra inferior (dentro) */
  float dIn = min(dUp, dLow);
  float open = smoothstep(-px, px, dIn) * inX;
  float cx = max(0.0, abs(p.x) - 1.0);
  float dOut = sqrt(max(0.0, -dIn) * max(0.0, -dIn) + cx * cx * 2.5);
  float dAbove = -dUp;             /* > 0 acima da pálpebra superior (pele) */
  float dBelow = -dLow;            /* > 0 abaixo da pálpebra inferior (pele) */
  float yuOpen = lidUp(p.x, 0.0);
  float aboveOpen = p.y - yuOpen;  /* vinco e sombra presos à pele, não ao piscar */

  /* ---- globo ocular ---------------------------------------------------- */
  float r2 = dot(p, p);
  float z = sqrt(max(0.0, RB * RB - r2));
  vec3 P = vec3(p, z);
  vec3 N = normalize(P);
  vec3 G = normalize(vec3(uGaze.x * 0.30, uGaze.y * 0.18 - 0.10 * b, 1.0));
  vec3 U = normalize(cross(vec3(0.0, 1.0, 0.0), G));
  vec3 V = cross(G, U);
  vec3 T = refract(vec3(0.0, 0.0, -1.0), N, 1.0 / 1.376);
  vec3 C = G * (RB - 0.14);
  float t = dot(C - P, G) / min(dot(T, G), -1e-4);
  vec3 Q = P + T * t;
  vec2 ip = vec2(dot(Q - C, U), dot(Q - C, V));
  float ir = length(ip) / IRIS;
  float ia = atan(ip.y, ip.x);
  vec2 ipn = ip / IRIS;
  float aa = px / IRIS * 1.3;

  vec3 L = normalize(vec3(-0.45, 0.65, 0.70));
  float ndl = max(dot(N, L), 0.0);
  float fres = pow(1.0 - N.z, 2.2);
  /* sombra projetada pela pálpebra superior (macia) + sombra de contato fina junto à borda */
  float lidShadow = 1.0 - 0.34 * smoothstep(0.28, 0.0, dUp) - 0.08 * smoothstep(0.7, 0.0, dUp) - 0.30 * smoothstep(0.035, 0.0, dUp);
  float socketAO = 0.86 + 0.14 * smoothstep(0.0, 0.25, dIn);

  /* ---- esclera ---------------------------------------------------------- */
  vec3 sclBase = gojo ? vec3(0.985, 0.975, 0.960) : vec3(0.82, 0.81, 0.80);
  vec3 sclera = sclBase * (0.90 + 0.10 * ndl);
  sclera = mix(sclera, sclera * vec3(0.80, 0.82, 0.88), fres * 0.35);
  sclera *= socketAO;
  sclera = mix(sclera, sclera * vec3(0.92, 0.84, 0.84), smoothstep(-0.55, -1.0, p.x) * 0.5);
  /* vasos: fios finos, avermelhados, só na periferia, convergindo para os cantos */
  float ang2 = atan(p.y, p.x);
  float rad2 = length(p);
  float veinN = fbm(p * 5.0 + 3.0);
  float vein = smoothstep(0.030, 0.0, abs(sin(ang2 * 7.0 + veinN * 4.0)) * 0.6) * smoothstep(0.72, 1.0, rad2) * smoothstep(0.45, 0.8, veinN + 0.2) * smoothstep(0.35, 0.7, abs(p.x));
  float vein2 = 0.0;
  float car = smoothstep(0.085, 0.02, length((p - vec2(-0.90, -0.06)) * vec2(1.0, 1.4)));
  sclera = mix(sclera, sclera * vec3(0.78, 0.36, 0.34), clamp(vein + vein2, 0.0, 1.0) * (gojo ? 0.20 : 0.30) * (1.0 - car) * smoothstep(-0.95, -0.55, p.x));
  /* limbo com espessura: sombra curta em volta da íris */
  sclera *= 1.0 - 0.28 * exp(-pow(max(0.0, ir - 1.0) * 6.5, 2.0));
  /* carúncula: pequena e macia, no vértice do canto interno */
  sclera = mix(sclera, vec3(0.90, 0.68, 0.66) * (0.85 + 0.15 * ndl), car * 0.45);
  sclera *= lidShadow;
  sclera *= 1.0 - 0.10 * smoothstep(0.16, 0.0, dUp) * smoothstep(-0.2, 0.7, p.x);
  sclera += vec3(1.0) * pow(max(dot(N, normalize(L + vec3(0.0, 0.0, 1.0))), 0.0), 18.0) * 0.10;

  /* ---- íris ---------------------------------------------------------- */
  float irisMask = smoothstep(1.0 + 0.045, 1.0 - 0.045, ir);
  float a01 = ia / TAU + 0.5;
  float fib, crypt, coll, furrow;
  irisStructure(ir, a01, ipn, uTime, fib, crypt, coll, furrow);
  float prBase = (gojo ? 0.21 : 0.22) + 0.02 * sin(uTime * 0.9) + 0.12 * uDilate;
  float pr = prBase + 0.006 * (noiseA(vec2(a01 * 24.0, 9.0), 24.0) - 0.5);
  /* luz atravessando a íris do lado oposto ao reflexo (embaixo à direita) */
  float through = smoothstep(-0.3, 1.0, dot(normalize(ipn + 1e-4), vec2(0.62, -0.78))) * smoothstep(0.25, 0.9, ir);
  vec3 iris;
  vec3 glowCol;
  if (gojo) {
    vec3 cCore = vec3(0.58, 0.90, 1.00);
    vec3 cMid  = vec3(0.14, 0.54, 0.98);
    vec3 cOut  = vec3(0.05, 0.25, 0.78);
    iris = mix(cCore, cMid, smoothstep(0.30, 0.54, ir));
    iris = mix(iris, cOut, smoothstep(0.66, 0.92, ir));
    iris *= 0.74 + 0.46 * fib;
    iris = mix(iris, iris * vec3(0.55, 0.62, 0.78), crypt * 0.75);
    iris = mix(iris, iris * vec3(0.72, 0.78, 0.9), furrow * 0.5);
    iris += vec3(0.75, 0.95, 1.0) * coll * 0.16 * (0.5 + 0.5 * fib);
    iris += vec3(0.40, 0.75, 1.0) * through * 0.42;
    iris += vec3(0.80, 0.97, 1.0) * smoothstep(0.03, 0.0, abs(ir - 0.60)) * 0.20 * (0.6 + 0.4 * fib);   /* anel luminoso dos Six Eyes */
    iris = mix(iris, vec3(0.02, 0.07, 0.30), smoothstep(0.84, 1.0, ir) * 0.90);
    iris = mix(iris, iris * 0.55, smoothstep(0.06, 0.0, ir - pr) * 0.6);
    glowCol = vec3(0.35, 0.80, 1.0);
    iris += glowCol * uGlow * (0.55 * (1.0 - ir) + 0.18);
  } else {
    vec3 cCore = vec3(0.98, 0.20, 0.17);
    vec3 cMid  = vec3(0.76, 0.07, 0.09);
    vec3 cOut  = vec3(0.38, 0.02, 0.04);
    iris = mix(cCore, cMid, smoothstep(0.26, 0.60, ir));
    iris = mix(iris, cOut, smoothstep(0.68, 0.98, ir));
    iris *= 0.76 + 0.44 * fib;
    iris = mix(iris, iris * vec3(0.55, 0.45, 0.45), crypt * 0.7);
    iris = mix(iris, iris * vec3(0.72, 0.6, 0.6), furrow * 0.5);
    iris += vec3(1.0, 0.45, 0.35) * coll * 0.12;
    iris += vec3(1.0, 0.40, 0.30) * through * 0.40;
    /* Mangekyō de Obito: pupila + três lâminas curvas em cata-vento (tinta com corpo) */
    float rr = clamp((ir - pr) / (0.94 - pr), 0.0, 1.0);
    float blade = 0.0;
    for (int k = 0; k < 3; k++) {
      float ak = 0.35 + float(k) * 2.0943951 - 1.25 * rr;
      float d = ia - ak;
      d = atan(sin(d), cos(d));
      float arc = abs(d) * max(ir, 0.05);
      float w = 0.10 + 0.34 * rr;
      blade = max(blade, smoothstep(w + aa, w - aa, arc));
    }
    blade *= smoothstep(pr - 0.03, pr + 0.02, ir) * smoothstep(0.965, 0.925, ir);
    iris = mix(iris, vec3(0.20, 0.0, 0.02), smoothstep(0.0, 1.0, blade) * 0.9);
    iris = mix(iris, vec3(0.025, 0.004, 0.01), smoothstep(0.35, 1.0, blade));
    iris += vec3(0.35, 0.08, 0.08) * blade * (0.3 + 0.7 * fib) * 0.25;
    iris = mix(iris, vec3(0.08, 0.01, 0.02), smoothstep(0.84, 1.0, ir) * 0.85);
    glowCol = vec3(1.0, 0.24, 0.26);
    iris += glowCol * uGlow * (0.42 * (1.0 - ir) + 0.12);
  }
  float pupil = smoothstep(pr + aa * 1.5, pr - aa, ir);
  iris = mix(iris, vec3(0.01, 0.012, 0.02), pupil);
  iris *= (0.82 + 0.18 * (1.0 - ir)) * lidShadow;

  vec3 eye = mix(sclera, iris, irisMask);
  eye += glowCol * uGlow * exp(-pow((ir - 1.0) * 3.5, 2.0)) * 0.18 * (1.0 - irisMask);
  /* o limbo pega luz do lado de baixo (a córnea é uma lente) */
  eye += (gojo ? vec3(0.55, 0.80, 1.0) : vec3(1.0, 0.45, 0.4)) * smoothstep(0.10, 0.0, abs(ir - 1.0)) * through * 0.14;

  /* ---- córnea: reflexo de janela macio, ponto secundário, especular largo, menisco ------- */
  vec2 hp = p - vec2(-0.30 + 0.01 * sin(uTime * 0.37), 0.27 + 0.008 * cos(uTime * 0.29));
  float spec = pow(max(dot(N, normalize(L + vec3(0.0, 0.0, 1.0))), 0.0), 110.0);
  vec2 q = mat2(0.97, 0.24, -0.24, 0.97) * hp * vec2(1.0, 1.25);
  vec2 hw = vec2(0.070, 0.105);
  float sd = length(max(abs(q) - hw + 0.03, 0.0)) - 0.03;
  float win = smoothstep(0.022, -0.012, sd);
  float bar = smoothstep(0.014, 0.004, abs(q.y + 0.012)) * 0.45;
  win *= 1.0 - bar;
  float winGlow = smoothstep(0.14, 0.0, sd) * 0.14;
  float h2 = smoothstep(0.050, 0.014, length((p - vec2(0.32, -0.25)) * vec2(1.0, 1.35)));
  float tear = smoothstep(0.045, 0.012, dLow) * smoothstep(0.0, 0.012, dLow) * (0.5 + 0.5 * bump(p.x, 0.5));
  eye = mix(eye, vec3(1.0), (win * 0.82 + winGlow) * open);
  eye += vec3(1.0) * (h2 * 0.55 + spec * 0.35);
  eye += vec3(0.92, 0.96, 1.0) * tear * 0.40;
  eye += vec3(0.6, 0.75, 1.0) * fres * 0.05;

  /* ---- pele: opaca, com volume, vinco, sombra da órbita e textura fina ------------------ */
  float tex = fbm(p * 14.0 + 5.0) - 0.5;
  float pores = noise(p * 90.0) - 0.5;
  vec3 skin;
  float skinA;
  float ell = length(p * vec2(0.62, 0.95));
  float lidLight = exp(-dOut * 3.2);
  /* vinco (dobra da pálpebra) preso à posição aberta; acima dele a pele da órbita recua para a sobrancelha */
  float creaseD = aboveOpen - 0.16 - 0.03 * p.x;
  float crease = exp(-pow(creaseD * 9.0, 2.0)) * smoothstep(1.05, 0.45, abs(p.x)) * smoothstep(0.0, 0.05, aboveOpen) * (1.0 - 0.3 * b);
  float fold = smoothstep(0.0, 0.26, creaseD) * smoothstep(1.0, 0.5, abs(p.x));          /* acima do vinco: dobra em sombra suave */
  float brow = smoothstep(0.55, 1.25, p.y);
  float bag = smoothstep(0.0, 0.30, dBelow) * smoothstep(0.60, 0.10, dBelow) * smoothstep(1.1, 0.4, abs(p.x));
  float lidPlat = smoothstep(0.0, 0.06, dAbove) * smoothstep(0.17, 0.08, aboveOpen) * smoothstep(1.12, 0.85, abs(p.x)); /* plataforma da pálpebra: pega luz */
  if (gojo) {
    /* base quase da cor do papel de parede (longe do olho ela some); a quentura fica só em volta do olho */
    skin = vec3(0.955, 0.951, 0.951);
    skin = mix(skin, skin * vec3(1.0, 0.968, 0.950), smoothstep(0.95, 0.35, ell));
    skin *= 1.0 - 0.13 * crease - 0.025 * fold - 0.03 * brow - 0.03 * bag;
    skin *= 1.0 + 0.012 * lidPlat + 0.010 * lidLight;
    /* pálpebra fechada = volume convexo contínuo: clara junto ao vinco, escurecendo até a costura e para os cantos */
    float bulge = smoothstep(0.16, -0.50, aboveOpen) * smoothstep(1.1, 0.5, abs(p.x));
    skin *= 1.0 - b * (0.07 * bulge + 0.05 * smoothstep(0.32, 0.0, dAbove) * smoothstep(1.05, 0.6, abs(p.x)) + 0.04 * smoothstep(0.5, 1.0, abs(p.x)));
    skin *= 1.0 - 0.12 * exp(-dOut * 6.0) * (0.5 + 0.5 * smoothstep(-0.3, 0.6, p.y));  /* sombra de contato */
    skin = mix(skin, skin * vec3(0.98, 0.88, 0.86), smoothstep(-0.6, -1.05, p.x) * 0.45); /* canto interno */
    skin = mix(skin, skin * vec3(1.0, 0.92, 0.90), bag * 0.5);                           /* olheira levemente rosada */
    skin *= 1.0 + tex * 0.022 + pores * 0.014;
    skinA = 1.0 - smoothstep(0.90, 1.45, ell);
  } else {
    /* penumbra: só as pálpebras pegam uma luz rasante; o resto dissolve no carvão */
    skin = vec3(0.055, 0.046, 0.046);
    skin *= 1.0 + 0.25 * smoothstep(-0.5, 1.2, p.y);
    skin += vec3(0.19, 0.14, 0.12) * (lidLight * 0.9 + lidPlat * 0.20);
    skin *= 1.0 - 0.45 * crease - 0.20 * fold - 0.30 * brow - 0.15 * bag;
    skin *= 1.0 - b * 0.30 * smoothstep(0.16, -0.50, aboveOpen) * smoothstep(1.1, 0.5, abs(p.x));
    skin *= 1.0 + tex * 0.05 + pores * 0.025;
    skin += vec3(0.60, 0.10, 0.12) * (0.035 + uGlow * 0.22) * exp(-dOut * 3.0);
    skinA = 1.0 - smoothstep(0.85, 1.42, ell);
  }
  /* linha úmida da pálpebra inferior (waterline): faixa fina logo abaixo da borda */
  float water = smoothstep(0.020, 0.004, dBelow) * step(0.0, dBelow) * (1.0 - open) * bump(p.x / 1.02, 0.5) * (1.0 - b);
  skin = mix(skin, gojo ? vec3(0.96, 0.84, 0.84) : vec3(0.55, 0.36, 0.36), water * 0.8);
  /* borda da pálpebra superior com espessura: faixa fina logo acima da borda, um pouco mais clara */
  float margin = smoothstep(0.028, 0.005, dAbove) * step(0.0, dAbove) * inX;
  skin *= 1.0 + 0.10 * margin;

  /* cílios: sombra densa da base + fios individuais (superiores e inferiores) */
  float lw = 0.012 * (0.5 + 0.8 * smoothstep(-0.3, 0.8, p.x)) * pow(max(0.0, 1.0 - p.x * p.x * 0.90), 0.3);
  float lashBase = smoothstep(lw, lw * 0.2, abs(p.y - (yu + 0.004))) * inX * 0.85;
  vec2 f0 = vec2(0.96, lidUp(0.96, b) + 0.012);
  vec2 f1 = vec2(1.10, f0.y + 0.065 - 0.05 * b);
  vec2 fd = f1 - f0;
  float ft = clamp(dot(p - f0, fd) / dot(fd, fd), 0.0, 1.0);
  float flick = smoothstep(0.028 * pow(1.0 - ft, 0.7) + 0.002, 0.0, length(p - (f0 + fd * ft)));
  float lashUp = max(lashBase, flick);
  if (p.y > yu - 0.32 && p.y < yu + 0.42 && abs(p.x) < 1.25) lashUp = max(lashUp, lashesUp(p, b, px));
  float lashLow = 0.0;
  if (p.y < yl + 0.02 && p.y > yl - 0.16) lashLow = lashesLow(p, b, px);
  vec3 lashCol = gojo ? vec3(0.09, 0.075, 0.08) : vec3(0.02, 0.018, 0.02);
  vec3 lashLowCol = gojo ? vec3(0.24, 0.20, 0.21) : vec3(0.05, 0.04, 0.045);

  /* ---- composição premultiplicada: pele → olho → cílios → bloom ------- */
  vec3 pm = skin * skinA;
  float a = skinA;
  pm = eye * open + pm * (1.0 - open);                 a = open + a * (1.0 - open);
  pm = lashLowCol * lashLow + pm * (1.0 - lashLow);    a = lashLow + a * (1.0 - lashLow);
  pm = lashCol * lashUp + pm * (1.0 - lashUp);         a = lashUp + a * (1.0 - lashUp);
  float bloom = uGlow * exp(-ell * ell * 1.8) * (gojo ? 0.16 : 0.20);
  pm += glowCol * bloom;                               a = max(a, bloom);
  pm += (hash(floor(vUv * uRes * 0.5) + fract(uTime)) - 0.5) * 0.012 * a;
  float edge = smoothstep(1.0, uEdge, abs(uv.x)) * smoothstep(1.0, 0.72, abs(uv.y)) * uFade;
  a *= edge;
  pm *= edge;
  if (a <= 0.002) { gl_FragColor = vec4(0.0); return; }
  gl_FragColor = vec4(pm, a);
}
`;
