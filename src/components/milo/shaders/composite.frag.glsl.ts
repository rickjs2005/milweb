import { NOISE_GLSL } from "./noise.glsl";

/**
 * Composite — a invisibilidade acontece aqui (iteração 03: massa contínua).
 *
 * A máscara composta é DILATADA e BORRADA (uMaskDilate/uMaskBlur): os
 * volumes vizinhos se unem numa massa só, e o campo de direção da
 * distorção vem do GRADIENTE dessa máscara borrada (segue a forma do corpo,
 * contínuo entre cápsulas) misturado com as normais de vista. A distorção
 * é mais forte no centro (uFalloff), comprime nas bordas (uEdgeComp),
 * ondula com o movimento (uMotion) e se concentra na mão ativa
 * (uInteraction). Densidade interna (uDensity) e sombra interna
 * (uInternalShadow) dão peso sem desenhar. Contorno de tinta só nas
 * âncoras (alpha > 0.5) — nunca borda constante de vidro.
 *
 * Fora da máscara: a grid curva ao redor do corpo (uGridBend), comprime
 * entre a mão e o painel, sombra suave no chão. A linha acid lime do
 * contato nasce na palma e vai até o painel (uPulse).
 *
 * uView: 0 composite · 1 distortion only · 2 wireframe only (bypass).
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
uniform float uDensity;
uniform float uMaskBlur;
uniform float uMaskDilate;
uniform float uInternalShadow;
uniform float uView;
uniform float uPulse;
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
/** distância e parâmetro t de p ao segmento ab */
vec2 segDT(vec2 p, vec2 a, vec2 b) {
  vec2 ab = b - a;
  float t = clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-5), 0.0, 1.0);
  return vec2(length(p - (a + ab * t)), t);
}

void main() {
  vec2 uv = vUv;
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 texel = 1.0 / uResolution;
  vec4 m = texture2D(tMask, uv);
  float mask = step(0.25, m.a);
  float reveal = clamp((m.a - 0.5) * 2.0, 0.0, 1.0);

  if (uView > 1.5) { gl_FragColor = vec4(texture2D(tScene, uv).rgb, 1.0); return; }

  // saída rápida: longe do corpo (4 taps largos vazios) só há grid, sombra e a linha do contato
  float near = m.a + maskAt(uv + vec2(0.03, 0.0) / aspect) + maskAt(uv - vec2(0.03, 0.0) / aspect) + maskAt(uv + vec2(0.0, 0.04)) + maskAt(uv - vec2(0.0, 0.04));
  if (near < 0.001) {
    vec2 paF = uv * aspect;
    vec2 dtF = segDT(paF, uHand * aspect, uPanelUv * aspect);
    vec2 toPanelF = normalize((uPanelUv - uHand) * aspect + 1e-5);
    vec2 sq = toPanelF * uInteraction * uPanel * exp(-dtF.x * dtF.x * 900.0) * 0.8;
    vec3 c0 = texture2D(tScene, uv + sq).rgb;
    if (uPulse > 0.0 && uView < 0.5) {
      float headF = smoothstep(uPulse * 1.25, uPulse * 1.25 - 0.08, dtF.y);
      float ll = (1.0 - smoothstep(0.0, 0.0022, dtF.x)) * headF * (1.0 - uPulse * uPulse);
      c0 = mix(c0, uSignal, ll);
    }
    gl_FragColor = vec4(c0, 1.0);
    return;
  }

  // ---- máscara composta: dilatação + borrão (massa contínua) e gradiente (direção)
  float soft = 0.0;      // máscara borrada (raio uMaskBlur px)
  float dil = 0.0;       // máscara dilatada (raio uMaskDilate px)
  vec2 grad = vec2(0.0); // aponta para dentro do corpo
  float wide = 0.0;      // borrão largo: curvatura da grid fora do corpo
  float sh = 0.0;        // sombra no chão
  vec4 nAcc = vec4(0.0); // normais/fresnel vizinhos
  for (int i = 0; i < 12; i++) {
    float fi = float(i);
    float ring = fi < 6.0 ? 0.55 : 1.0;
    vec2 d = vec2(cos(fi * 1.0472 + ring * 0.5), sin(fi * 1.0472 + ring * 0.5)) * ring;
    float a = maskAt(uv + d * texel * uMaskBlur);
    soft += a;
    grad += d * a;
    dil = max(dil, maskAt(uv + d * texel * uMaskDilate));
    wide += maskAt(uv + d / aspect * 0.028);
    sh += maskAt(uv + d / aspect * 0.02 + vec2(0.006, -0.03));
    nAcc += texture2D(tMask, uv + d * texel * uMaskBlur * 0.6);
  }
  soft /= 12.0;
  wide = (wide / 12.0) * (1.0 - mask);
  sh = (sh / 12.0) * (1.0 - mask) * uVisibility;
  float inside = max(mask, dil);
  // direção pela forma: gradiente da máscara borrada (para fora), suavizado
  vec2 shape = -grad / max(length(grad), 1e-4);
  float shapeW = smoothstep(0.02, 0.35, length(grad) / 12.0); // 0 no interior profundo
  float cov = max(nAcc.a, 1e-3);
  vec2 nSmooth = nAcc.xy / cov;
  vec2 n = clamp(mix(m.xy, nSmooth, 0.5) * 2.0 - 1.0, -1.0, 1.0);
  n = normalize(mix(n, shape, shapeW * 0.6) + 1e-5) * min(length(n) + shapeW, 1.0);
  float fres = clamp(mix(m.z, nAcc.z / cov, 0.5), 0.0, 1.0);
  if (mask < 0.5) fres = 0.85; // pixels ganhos pela dilatação são borda

  // compressão entre a mão ativa e o painel + linha lime do contato
  vec2 pa = uv * aspect;
  vec2 dt = segDT(pa, uHand * aspect, uPanelUv * aspect);
  vec2 toPanel = normalize((uPanelUv - uHand) * aspect + 1e-5);
  vec2 squeeze = toPanel * uInteraction * uPanel * exp(-dt.x * dt.x * 900.0) * 0.8;
  float limeLine = 0.0;
  if (uPulse > 0.0 && uView < 0.5) {
    float head = smoothstep(uPulse * 1.25, uPulse * 1.25 - 0.08, dt.y);
    limeLine = (1.0 - smoothstep(0.0, 0.0022, dt.x)) * head * (1.0 - uPulse * uPulse);
  }

  // fundo (sempre): grid curva ao redor do corpo, compressão mão→painel, sombra no chão
  vec2 dirOut = normalize((uv - uMilo) * aspect + 1e-5);
  vec3 bg = texture2D(tScene, uv + dirOut * uGridBend * wide * uVisibility + squeeze).rgb;
  bg *= 1.0 - sh * 0.06;
  // peso da massa: borda suave (anti-alias da dilatação) em vez de degrau
  float bodyW = max(mask, smoothstep(0.12, 0.42, soft));
  vec3 col = bg;
  if (bodyW > 0.02) {
    float center = pow(1.0 - fres, uFalloff) * mix(0.6, 1.0, soft);
    float nz = fbm3(vec3(uv * uNoiseScale * 5.0, uTime * uNoiseSpeed));

    vec2 off = n * uBody * (0.2 + center) * (0.92 + 0.16 * (nz - 0.5));
    off -= n * uEdgeComp * fres;
    off.y += (nz - 0.5) * 0.006;

    float sp = length(uMiloVel);
    vec2 vdir = uMiloVel / max(sp, 1e-5);
    float wave = sin(dot((uv - uMilo) * aspect, vdir) * 70.0 - uTime * 9.0);
    off += uMiloVel * uMotion * 8.0 * center + vdir * wave * uMotion * 0.4 * min(sp * 30.0, 1.0) * center;

    vec2 dh = (uv - uHand) * aspect;
    off -= normalize(dh + 1e-5) * uInteraction * exp(-dot(dh, dh) * 70.0) * (0.35 + uPanel);
    off += squeeze;

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
    col = mix(col, mix(uNeutral, uInk, 0.07 + 0.11 * center), minor * 0.92);
    col = mix(col, mix(uNeutral, uInk, 0.55), major * 0.7);
    float majorR = lineMask((suv + n * uBody * 0.06) * uResolution, uCell * uMajor, 0.8);
    col.r = mix(col.r, uInk.r, majorR * 0.2);

    // densidade: o volume adensa no centro; sombra interna vinda de cima/esquerda
    col *= 1.0 - center * uDensity * uVisibility;
    float above = (texture2D(tMask, uv + vec2(-0.004, 0.014)).a + texture2D(tMask, uv + vec2(-0.008, 0.026)).a + texture2D(tMask, uv + vec2(-0.012, 0.038)).a) / 3.0;
    above = smoothstep(0.05, 0.45, above);
    col *= 1.0 - uInternalShadow * (1.0 - above) * soft * uVisibility;

    // âncoras: contorno de tinta só onde revelado; lime só como sinal de atividade
    float edge = smoothstep(0.45, 0.92, fres) * uEdgeStrength * reveal * mask;
    col = mix(col, uInk, edge * 0.7);
    if (uView < 0.5) col = mix(col, uSignal, edge * uEnergy * uEnergy * 0.3);
    col = mix(bg, col, bodyW);
  }
  col = mix(col, uSignal, limeLine);
  gl_FragColor = vec4(col, 1.0);
}
`;
