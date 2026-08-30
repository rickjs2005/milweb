import { NOISE_GLSL } from "./noise.glsl";

/**
 * Composite — a invisibilidade acontece aqui.
 *
 * Dentro da máscara: a grid é REDESENHADA nas coordenadas deslocadas
 * (linhas nítidas que se curvam; subgrade fina que adensa no centro).
 * A distorção é mais forte no centro do corpo (uFalloff), comprime nas
 * bordas (uEdgeComp), ondula com o movimento (uMotion) e puxa para a mão
 * ativa (uInteraction). Só as âncoras (alpha > 0.5) recebem contorno de
 * tinta — nada de borda constante de vidro.
 *
 * Fora da máscara: a grid curva ao redor do corpo (uGridBend, máscara
 * borrada), comprime entre a mão e o painel, sombra suave abaixo.
 */
export const COMPOSITE_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tScene;
uniform sampler2D tMask;
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform float uTime;
uniform float uBody;
uniform float uMotion;
uniform float uInteraction;
uniform float uGridBend;
uniform float uEdgeComp;
uniform float uFalloff;
uniform float uEdgeStrength;
uniform float uNoiseScale;
uniform float uNoiseSpeed;
uniform float uVisibility;
uniform float uEnergy;
uniform float uScrollProgress;
uniform float uGlitch;
uniform vec2 uMilo;
uniform vec2 uMiloVel;
uniform vec2 uHand;
uniform vec2 uPanelUv;
uniform float uPanel;
uniform vec3 uInk;
uniform vec3 uSignal;
uniform vec3 uPaper;
uniform vec3 uNeutral;
uniform float uCell;
uniform float uMajor;
varying vec2 vUv;
${NOISE_GLSL}

float maskAt(vec2 uv) { return step(0.25, texture2D(tMask, uv).a); }
float lineMask(vec2 px, float cell, float width) {
  vec2 g = mod(px, cell);
  vec2 d = min(g, cell - g);
  return 1.0 - smoothstep(width - 0.6, width + 0.6, min(d.x, d.y));
}
/** distância de p ao segmento ab (em uv corrigido por aspect) */
float segDist(vec2 p, vec2 a, vec2 b) {
  vec2 ab = b - a;
  float t = clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-5), 0.0, 1.0);
  return length(p - (a + ab * t));
}

void main() {
  vec2 uv = vUv;
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec4 m = texture2D(tMask, uv);
  float mask = step(0.25, m.a);
  float reveal = clamp((m.a - 0.5) * 2.0, 0.0, 1.0);
  vec3 col;

  // máscara borrada: curvatura da grid ao redor do corpo e sombra
  float blur = 0.0;
  float sh = 0.0;
  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    vec2 o = vec2(cos(fi * 0.785), sin(fi * 0.785)) / aspect * (0.018 + 0.022 * mod(fi, 2.0));
    blur += maskAt(uv + o);
    sh += maskAt(uv + o * 0.8 + vec2(0.006, -0.03));
  }
  blur = (blur / 8.0) * (1.0 - mask);
  sh = (sh / 8.0) * (1.0 - mask) * uVisibility;

  // compressão entre a mão ativa e o painel
  vec2 pa = uv * aspect;
  float dSeg = segDist(pa, uHand * aspect, uPanelUv * aspect);
  vec2 toPanel = normalize((uPanelUv - uHand) * aspect + 1e-5);
  vec2 squeeze = toPanel * uInteraction * uPanel * exp(-dSeg * dSeg * 900.0) * 0.8;

  if (mask > 0.5) {
    // campo de normais suavizado: evita que membros finos e a aba do casaco
    // (ângulos rasantes) virem ruído cinza na grid deslocada
    vec2 e = vec2(1.5) / uResolution;
    vec4 m2 = (texture2D(tMask, uv + vec2(e.x, 0.0)) + texture2D(tMask, uv - vec2(e.x, 0.0)) + texture2D(tMask, uv + vec2(0.0, e.y)) + texture2D(tMask, uv - vec2(0.0, e.y))) * 0.25;
    // vizinhos fora da máscara não contam (alpha 0): pesa pela cobertura
    float cov = max(m2.a, 1e-3);
    vec2 nAvg = mix(m.xy, m2.xy / cov * min(m2.a / 0.5, 1.0), 0.35 * min(m2.a / 0.5, 1.0));
    vec2 n = clamp(nAvg * 2.0 - 1.0, -1.0, 1.0);
    float fres = clamp(mix(m.z, m2.z / cov, 0.35 * min(m2.a / 0.5, 1.0)), 0.0, 1.0);
    float center = pow(1.0 - fres, uFalloff); // 1 no centro do volume, 0 na borda
    float nz = fbm3(vec3(uv * uNoiseScale * 5.0, uTime * uNoiseSpeed));

    // corpo: forte no centro, decai para a borda; comprime na borda
    vec2 off = n * uBody * (0.2 + center) * (0.92 + 0.16 * (nz - 0.5));
    off -= n * uEdgeComp * fres;
    off.y += (nz - 0.5) * 0.006;

    // movimento: deslocamento + pequenas ondas na direção do movimento
    float sp = length(uMiloVel);
    vec2 vdir = uMiloVel / max(sp, 1e-5);
    float wave = sin(dot((uv - uMilo) * aspect, vdir) * 70.0 - uTime * 9.0);
    off += uMiloVel * uMotion * 8.0 * center + vdir * wave * uMotion * 0.4 * min(sp * 30.0, 1.0) * center;

    // interação: o espaço é puxado para a mão ativa
    vec2 dh = (uv - uHand) * aspect;
    off -= normalize(dh + 1e-5) * uInteraction * exp(-dot(dh, dh) * 70.0) * (0.35 + uPanel);
    off += squeeze;

    // glitch: fatias horizontais raras
    float band = floor(uv.y * 72.0);
    float tick = floor(uTime * 9.0);
    float g = step(1.0 - uGlitch * (0.015 + 0.05 * uEnergy), hash1(band * 7.31 + tick * 3.17));
    off.x += g * (hash1(tick + band) - 0.5) * 0.04 * uEnergy;
    off *= uVisibility;

    vec2 suv = uv + off;
    vec2 px = suv * uResolution;
    float minor = lineMask(px, uCell, 0.6);
    float major = lineMask(px, uCell * uMajor, 0.8);
    col = texture2D(tScene, uv).rgb;
    col = mix(col, mix(uNeutral, uInk, 0.12 + 0.18 * center), minor * 0.95);
    col = mix(col, mix(uNeutral, uInk, 0.55), major * 0.7);
    float majorR = lineMask((suv + n * uBody * 0.06) * uResolution, uCell * uMajor, 0.8);
    col.r = mix(col.r, uInk.r, majorR * 0.2);

    // âncoras: contorno de tinta só onde revelado; acid lime só como sinal de atividade
    float edge = smoothstep(0.45, 0.92, fres) * uEdgeStrength * reveal;
    col = mix(col, uInk, edge * 0.75);
    col = mix(col, uSignal, edge * uEnergy * uEnergy * 0.35);
    // densidade: o volume escurece 4 % no centro
    col *= 1.0 - center * 0.04 * uVisibility;
  } else {
    // grid curva ao redor da cabeça e dos ombros (para fora do corpo)
    vec2 dir = normalize((uv - uMilo) * aspect + 1e-5);
    vec2 off = dir * uGridBend * blur * uVisibility + squeeze;
    col = texture2D(tScene, uv + off).rgb;
    col *= 1.0 - sh * 0.06;
  }
  gl_FragColor = vec4(col, 1.0);
}
`;
