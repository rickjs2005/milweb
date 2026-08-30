/** Quad de tela inteira (posição já em clip space). Usado pelo composite e pela grid. */
export const SCREEN_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;
export const COMPOSITE_VERT = SCREEN_VERT;
