import * as THREE from "three";
import { SCREEN_VERT } from "@/components/milo/shaders/composite.vert.glsl";

/**
 * Réplica WebGL da grid DOM do Hero (render target de fundo). Desenha o
 * papel do Hero + as 12 colunas exatamente nas posições medidas
 * (uGridOrigin/uGridColumnWidth/uGridGutter, em px de dispositivo). Só é
 * vista onde o composite precisa cobrir a grid DOM — dentro da silhueta
 * e no halo curvado ao redor dela. Linhas horizontais: a grid DOM não tem
 * (uGridRowHeight = 0 desliga).
 */
export const HERO_GRID_FRAG = /* glsl */ `
precision highp float;
uniform vec2 uViewport;
uniform vec2 uGridOrigin;
uniform vec2 uGridSize;
uniform float uGridColumns;
uniform float uGridColumnWidth;
uniform float uGridGutter;
uniform float uGridRowHeight;
uniform float uGridLineWidth;
uniform vec3 uGridLineColor;
uniform float uGridOpacity;
uniform vec3 uHeroBackground;
varying vec2 vUv;

float heroLines(vec2 px) {
  // px em coordenadas de tela (y para baixo), px de dispositivo
  vec2 g = px - uGridOrigin;
  if (g.x < -1.0 || g.x > uGridSize.x + 1.0 || g.y < 0.0 || g.y > uGridSize.y) return 0.0;
  float pitch = uGridColumnWidth + uGridGutter;
  float local = mod(g.x, pitch);
  float w = max(uGridLineWidth, 1.0);
  float left = 1.0 - smoothstep(w * 0.5, w * 0.5 + 0.8, abs(local - w * 0.5));
  float right = 1.0 - smoothstep(w * 0.5, w * 0.5 + 0.8, abs(local - uGridColumnWidth + w * 0.5));
  // a borda direita só existe na última coluna
  float col = floor(g.x / pitch);
  right *= step(uGridColumns - 1.0, col);
  float rows = 0.0;
  if (uGridRowHeight > 0.5) rows = 1.0 - smoothstep(w * 0.5, w * 0.5 + 0.8, abs(mod(g.y, uGridRowHeight) - w * 0.5));
  return max(max(left, right), rows);
}

void main() {
  vec2 px = vec2(vUv.x, 1.0 - vUv.y) * uViewport;
  float l = heroLines(px) * uGridOpacity;
  gl_FragColor = vec4(mix(uHeroBackground, uGridLineColor, l), 1.0);
}
`;

export function createHeroGridMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: SCREEN_VERT,
    fragmentShader: HERO_GRID_FRAG,
    uniforms: {
      uViewport: { value: new THREE.Vector2(1, 1) },
      uGridOrigin: { value: new THREE.Vector2(0, 0) },
      uGridSize: { value: new THREE.Vector2(1, 1) },
      uGridColumns: { value: 12 },
      uGridColumnWidth: { value: 1 },
      uGridGutter: { value: 0 },
      uGridRowHeight: { value: 0 },
      uGridLineWidth: { value: 1 },
      uGridLineColor: { value: new THREE.Color("#DAD8D1") },
      uGridOpacity: { value: 0 },
      uHeroBackground: { value: new THREE.Color("#F2F0EA") },
    },
    depthTest: false,
    depthWrite: false,
  });
}
