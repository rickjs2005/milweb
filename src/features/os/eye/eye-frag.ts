/**
 * O OLHO — fragment shader (WebGL 1, quad único).
 *
 * Um olho visto de frente, em 2.5D: o globo ocular é uma esfera analítica;
 * a íris é um disco côncavo ATRÁS da córnea, alcançado por refração do raio
 * de visão (é isso que dá profundidade e paralaxe quando o olhar muda); as
 * pálpebras são duas curvas no plano, animadas pelo uniform do piscar; os
 * cílios são uma faixa escura ao longo da pálpebra superior, com a ponta
 * erguida no canto externo. Fora da abertura, a pele é grafite e esmaece
 * para o wallpaper — o olho emerge da sombra, não flutua com cor de pele
 * sobre a área de trabalho.
 *
 * Direção: a íris dos Six Eyes — azul-gelo luminoso, três anéis
 * concêntricos finos, fibras radiais discretas, facetas cristalinas, anel
 * limbar azul-marinho, pupila pequena; olho alongado com o canto externo
 * mais alto; reflexos de córnea suaves; brilho ciano contido, mais forte só
 * no instante da reabertura.
 *
 * Uniforms:
 *   uRes             canvas em px de device
 *   uAspect, uScale  enquadramento (ver eye.config.ts)
 *   uTime            segundos (microanimações)
 *   uBlink           0 aberto … 1 fechado
 *   uGaze            olhar, −1..1 em x e y (y para cima)
 *   uGlow            brilho da reabertura, 0..1
 *   uDilate          dilatação extra da pupila, 0..1
 *   uFade            opacidade global
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
uniform float uEdge;   /* onde começa o esmaecimento lateral pelo quadro (0..1 em uv) */

#define PI 3.141592653589793
#define IRIS 0.60
#define RB 1.18

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.07 + 11.3; a *= 0.5; }
  return v;
}
float bump(float x, float k) { return pow(max(0.0, 1.0 - x * x), k); }

/* pálpebras: altura em função de x (−1..1, canto a canto) e do piscar; o olho inteiro
   inclina para cima no canto externo (x > 0) */
float lidUp(float x, float b) {
  float open = 0.54 * bump(x, 0.58) * (1.0 + 0.12 * x) + 0.05 * x;
  float shut = -0.30 * bump(x, 0.85) + 0.05 * x - 0.02;
  return mix(open, shut, b);
}
float lidLow(float x, float b) {
  float open = -0.40 * bump(x, 0.72) * (1.0 - 0.08 * x) + 0.05 * x;
  float shut = -0.26 * bump(x, 0.85) + 0.05 * x;
  return mix(open, shut, b * 0.75);
}

void main() {
  vec2 uv = vUv * 2.0 - 1.0;
  vec2 p = vec2(uv.x * uAspect, uv.y) / uScale;
  float px = 2.0 * uAspect / (uRes.x * uScale);
  float b = uBlink;

  /* ---- abertura (entre as pálpebras) ---------------------------------- */
  float yu = lidUp(p.x, b);
  float yl = lidLow(p.x, b);
  float inX = 1.0 - smoothstep(0.985, 1.0, abs(p.x));
  float dUp = yu - p.y;
  float dLow = p.y - yl;
  float dIn = min(dUp, dLow);
  float open = smoothstep(-px, px, dIn) * inX;
  /* distância ao interior também fora dos cantos (senão a borda "vaza" pela horizontal) */
  float cx = max(0.0, abs(p.x) - 1.0);
  float dOut = sqrt(max(0.0, -dIn) * max(0.0, -dIn) + cx * cx * 2.5);

  /* ---- globo ocular ---------------------------------------------------- */
  float r2 = dot(p, p);
  float z = sqrt(max(0.0, RB * RB - r2));
  vec3 P = vec3(p, z);
  vec3 N = normalize(P);
  vec3 G = normalize(vec3(uGaze.x * 0.30, uGaze.y * 0.18 - 0.10 * b, 1.0));   /* ao piscar o globo desce (Bell) */
  vec3 U = normalize(cross(vec3(0.0, 1.0, 0.0), G));
  vec3 V = cross(G, U);
  vec3 T = refract(vec3(0.0, 0.0, -1.0), N, 1.0 / 1.376);
  vec3 C = G * (RB - 0.14);
  float t = dot(C - P, G) / min(dot(T, G), -1e-4);
  vec3 Q = P + T * t;
  vec2 ip = vec2(dot(Q - C, U), dot(Q - C, V));
  float ir = length(ip) / IRIS;
  float ia = atan(ip.y, ip.x);

  float ao = smoothstep(0.0, 0.30, dIn);
  float lidShadow = 0.50 + 0.50 * smoothstep(0.0, 0.50, dUp);
  float fres = pow(1.0 - N.z, 2.2);

  /* esclera: branco frio e sombreado, azul-cinza no limbo, um nada rosado no canto interno,
     e uma sombra curta em volta da íris (o limbo tem espessura) */
  vec3 sclera = mix(vec3(0.78, 0.82, 0.88), vec3(0.38, 0.46, 0.60), fres);
  sclera = mix(sclera, vec3(0.76, 0.68, 0.70), smoothstep(-0.70, -1.0, p.x) * 0.5);
  sclera *= (0.50 + 0.50 * smoothstep(0.0, 0.40, dIn)) * lidShadow;
  sclera *= 1.0 - 0.28 * exp(-pow(max(0.0, ir - 1.0) * 7.0, 2.0));

  /* íris: borda macia (o limbo não é um recorte) */
  float irisMask = smoothstep(1.0 + 0.05, 1.0 - 0.05, ir);
  float pr = 0.24 + 0.02 * sin(uTime * 0.9) + 0.12 * uDilate;
  float pupil = smoothstep(pr + 0.03, pr - 0.01, ir);
  float fib1 = noise(vec2(ia * 10.0 + 3.0, ir * 2.5 + uTime * 0.02));
  float fib2 = noise(vec2(ia * 32.0, ir * 8.0 - uTime * 0.015));
  float fib3 = fbm(vec2(ia * 4.0, ir * 3.0));
  float fibers = 0.5 * fib1 + 0.3 * fib2 + 0.4 * fib3;
  float streak = pow(abs(sin(ia * 21.0 + fib3 * 5.0)), 14.0) * smoothstep(0.30, 0.55, ir) * smoothstep(1.0, 0.75, ir);
  float ringA = smoothstep(0.020, 0.0, abs(ir - 0.46));
  float ringB = smoothstep(0.016, 0.0, abs(ir - 0.64));
  float ringC = smoothstep(0.025, 0.0, abs(ir - 0.82));
  float ripple = 0.5 + 0.5 * sin(ir * 42.0 + fib3 * 3.0);
  float facet = smoothstep(0.45, 0.55, noise(vec2(ia * 14.0 + 2.0, ir * 9.0)));

  vec3 cIn  = vec3(0.74, 0.93, 1.00);
  vec3 cMid = vec3(0.62, 0.86, 1.00);
  vec3 cOut = vec3(0.18, 0.48, 0.90);
  vec3 iris = mix(cIn, cMid, smoothstep(0.28, 0.50, ir));
  iris = mix(iris, cOut, smoothstep(0.55, 0.95, ir));
  iris *= 0.84 + 0.28 * fibers;
  iris *= 0.95 + 0.07 * ripple;
  iris += vec3(0.80, 0.95, 1.0) * streak * 0.12;
  iris += vec3(0.85, 0.97, 1.0) * (ringA * 0.18 + ringB * 0.26 + ringC * 0.12);
  iris += vec3(0.60, 0.90, 1.0) * facet * 0.06 * (1.0 - ir);
  iris += vec3(0.80, 0.98, 1.0) * smoothstep(0.10, 0.0, abs(ir - (pr + 0.07))) * 0.22;   /* colarete */
  iris = mix(iris, vec3(0.05, 0.12, 0.30), smoothstep(0.80, 1.0, ir) * 0.72);            /* anel limbar */
  iris += vec3(0.35, 0.80, 1.0) * uGlow * (0.55 * (1.0 - ir) + 0.20);                     /* brilho da reabertura */
  iris = mix(iris, vec3(0.012, 0.02, 0.05), pupil);
  iris *= (0.78 + 0.22 * (1.0 - ir)) * lidShadow;

  vec3 eye = mix(sclera, iris, irisMask);
  eye += vec3(0.35, 0.75, 1.0) * uGlow * exp(-pow((ir - 1.0) * 3.5, 2.0)) * 0.20 * (1.0 - irisMask);

  /* reflexos da córnea: janela alta à esquerda, ponto baixo à direita, specular; linha úmida na pálpebra inferior */
  vec2 hp = p - vec2(-0.30 + 0.01 * sin(uTime * 0.37), 0.26 + 0.008 * cos(uTime * 0.29));
  float h1 = pow(smoothstep(0.20, 0.0, length(hp * vec2(1.0, 1.9))), 2.2);
  float h2 = smoothstep(0.07, 0.0, length((p - vec2(0.30, -0.24)) * vec2(1.0, 1.4)));
  vec3 L = normalize(vec3(-0.5, 0.6, 0.75));
  float spec = pow(max(dot(N, normalize(L + vec3(0.0, 0.0, 1.0))), 0.0), 90.0);
  float tear = smoothstep(0.035, 0.012, dLow) * smoothstep(0.0, 0.012, dLow);
  eye += vec3(1.0) * (h1 * 0.62 + h2 * 0.25 + spec * 0.35);
  eye += vec3(0.70, 0.80, 0.92) * tear * 0.35;
  eye += vec3(0.5, 0.7, 1.0) * fres * 0.08;

  /* ---- pálpebras (pele grafite, luz de cima, vinco) ------------------- */
  float aboveUp = max(0.0, p.y - yu);
  vec3 skin = vec3(0.070, 0.080, 0.095);
  skin *= 1.0 + 0.30 * smoothstep(-0.5, 1.2, p.y);
  skin += vec3(0.17, 0.18, 0.20) * exp(-dOut * 3.5);                                     /* volume das pálpebras */
  skin *= 1.0 - 0.55 * exp(-pow((aboveUp - 0.26) * 9.0, 2.0)) * smoothstep(1.1, 0.6, abs(p.x)) * (1.0 - b * 0.6);
  skin += vec3(0.25, 0.50, 0.90) * (0.05 + uGlow * 0.20) * exp(-dOut * 3.0);              /* a íris banha as pálpebras */

  /* cílios: finos no canto interno, grossos no externo, com a ponta erguida além do canto (uma cunha, não um fio) */
  float lw = 0.045 * (0.55 + 0.75 * smoothstep(-0.3, 0.8, p.x)) * pow(max(0.0, 1.0 - p.x * p.x * 0.90), 0.25);
  float lashUp = smoothstep(lw, lw * 0.3, abs(p.y - (yu + 0.01))) * inX;
  vec2 f0 = vec2(0.96, lidUp(0.96, b) + 0.012);
  vec2 f1 = vec2(1.17, f0.y + 0.10 - 0.08 * b);
  vec2 fd = f1 - f0;
  float ft = clamp(dot(p - f0, fd) / dot(fd, fd), 0.0, 1.0);
  float flick = smoothstep(0.055 * pow(1.0 - ft, 0.7) + 0.003, 0.0, length(p - (f0 + fd * ft)));
  lashUp = max(lashUp, flick);
  float lashLow = smoothstep(0.018, 0.005, abs(p.y - (yl - 0.012))) * bump(p.x / 1.02, 0.4) * smoothstep(-0.6, 0.2, p.x) * inX * 0.45;

  /* ---- composição ------------------------------------------------------ */
  vec3 col = mix(skin, eye, open);
  col = mix(col, vec3(0.02, 0.025, 0.04), lashUp);
  col = mix(col, vec3(0.03, 0.04, 0.06), lashLow);

  float ell = length(p * vec2(0.62, 0.95));
  float fade = 1.0 - smoothstep(0.95, 1.45, ell);
  float bloom = uGlow * exp(-ell * ell * 1.8) * 0.20;
  col += vec3(0.30, 0.65, 1.0) * bloom;
  /* grão fino: quebra o banding dos gradientes e tira o ar de vetor */
  col += (hash(floor(vUv * uRes * 0.5) + fract(uTime)) - 0.5) * 0.016;
  float a = max(max(open, fade), max(lashUp, bloom));
  a *= smoothstep(1.0, uEdge, abs(uv.x)) * smoothstep(1.0, 0.72, abs(uv.y));
  a *= uFade;
  if (a <= 0.002) { gl_FragColor = vec4(0.0); return; }
  gl_FragColor = vec4(col * a, a);
}
`;
