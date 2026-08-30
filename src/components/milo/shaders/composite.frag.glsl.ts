import { NOISE_GLSL } from "./noise.glsl";

/**
 * Composite — a invisibilidade acontece aqui.
 * Fora da máscara: o fundo como está (+ sombra suave abaixo do corpo).
 * Dentro: as UVs do fundo são deslocadas na direção da normal de vista
 * (refração localizada), com ruído procedural, separação cromática mínima,
 * Fresnel de tinta nas bordas, um pouco de grão escuro em algumas regiões
 * e falhas digitais raras controladas por `uEnergy`/`uGlitch`.
 * O painel (uPanel, uPanelUv) ganha uma ondulação extra à medida que a mão
 * se aproxima.
 */
export const COMPOSITE_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tScene;
uniform sampler2D tMask;
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform float uTime;
uniform float uDistortionStrength;
uniform float uEdgeStrength;
uniform float uNoiseScale;
uniform float uNoiseSpeed;
uniform float uVisibility;
uniform float uEnergy;
uniform float uScrollProgress;
uniform float uGlitch;
uniform float uPanel;
uniform vec2 uPanelUv;
uniform vec3 uInk;
uniform vec3 uSignal;
uniform vec3 uPaper;
uniform vec3 uNeutral;
uniform float uCell;
uniform float uMajor;
varying vec2 vUv;
${NOISE_GLSL}

float maskAt(vec2 uv) { return texture2D(tMask, uv).a; }
float lineMask(vec2 px, float cell, float width) {
  vec2 g = mod(px, cell);
  vec2 d = min(g, cell - g);
  return 1.0 - smoothstep(width - 0.6, width + 0.6, min(d.x, d.y));
}

void main() {
  vec2 uv = vUv;
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec4 m = texture2D(tMask, uv);
  float mask = m.a;
  vec3 col;

  // sombra suave: máscara borrada, deslocada para baixo/direita
  vec2 so = vec2(0.006, -0.03);
  float sh = 0.0;
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    vec2 o = vec2(cos(fi * 1.05), sin(fi * 1.05)) * 0.012 * (0.5 + fi * 0.2);
    sh += maskAt(uv + so + o);
  }
  sh = (sh / 6.0) * (1.0 - mask) * uVisibility * 0.5;

  // ondulação do painel: cresce com a aproximação da mão
  vec2 pd = (uv - uPanelUv) * aspect;
  float pr = length(pd);
  float ripple = uPanel * exp(-pr * pr * 60.0) * sin(pr * 90.0 - uTime * 5.0) * 0.006;
  vec2 panelOff = normalize(pd + 1e-5) * ripple;

  if (mask > 0.5) {
    vec2 n = m.xy * 2.0 - 1.0;
    float fres = m.z;
    float nz = fbm3(vec3(uv * uNoiseScale * 5.0, uTime * uNoiseSpeed));
    float strength = uDistortionStrength * (0.7 + 0.8 * fres) * (0.92 + 0.16 * (nz - 0.5)) * uVisibility;
    vec2 off = n * strength;
    // deslocamento vertical de "fluxo" — o espaço escorre ao longo do corpo
    off.y += (nz - 0.5) * 0.006 * uVisibility;
    // glitch: fatias horizontais raras
    float band = floor(uv.y * 72.0);
    float tick = floor(uTime * 9.0);
    float g = step(1.0 - uGlitch * (0.02 + 0.06 * uEnergy), hash1(band * 7.31 + tick * 3.17));
    off.x += g * (hash1(tick + band) - 0.5) * 0.05 * uEnergy;
    off += panelOff;
    vec2 suv = uv + off;
    // Dentro do corpo a grid é redesenhada NAS COORDENADAS DESLOCADAS — linhas
    // nítidas que se curvam ao redor da presença, mais uma subgrade fina:
    // o espaço fica mais denso onde ele está (não é vidro, é código).
    vec2 px = suv * uResolution;
    float minor = lineMask(px, uCell, 0.6);
    float fine = lineMask(px, uCell * 0.5, 0.5) * (1.0 - minor);
    float major = lineMask(px, uCell * uMajor, 0.8);
    col = texture2D(tScene, uv).rgb; // papel (com o grão) sem deslocar
    col = mix(col, uNeutral, minor * 0.95);
    col = mix(col, mix(uNeutral, uInk, 0.35), fine * (0.35 + 0.35 * uEnergy));
    col = mix(col, mix(uNeutral, uInk, 0.55), major * 0.7);
    // separação cromática mínima nas linhas maiores
    float majorR = lineMask((suv + n * strength * 0.06) * uResolution, uCell * uMajor, 0.8);
    col.r = mix(col.r, uInk.r, majorR * 0.25);
    // Fresnel: tinta nas bordas, um sinal ácido com energia
    float edge = pow(fres, 1.6) * uEdgeStrength;
    col = mix(col, uInk, edge * 0.6);
    col = mix(col, uSignal, edge * edge * uEnergy * 0.5);
    // grão escuro em regiões (o corpo "lembra" a grid)
    float grain = step(0.66, noise2(uv * uResolution * 0.045 + uTime * 0.15)) * smoothstep(0.25, 0.7, fres);
    col = mix(col, uInk, grain * 0.14 * uVisibility);
    // ligeira densidade no centro do volume: escurece o papel 3%
    col *= 1.0 - (1.0 - fres) * 0.055 * uVisibility;
  } else {
    col = texture2D(tScene, uv + panelOff).rgb;
    col *= 1.0 - sh * 0.06;
  }
  gl_FragColor = vec4(col, 1.0);
}
`;
