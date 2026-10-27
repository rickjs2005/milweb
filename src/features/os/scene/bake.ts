import {
  BufferAttribute,
  BufferGeometry,
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  OrthographicCamera,
  RGBAFormat,
  RepeatWrapping,
  ClampToEdgeWrapping,
  Scene,
  ShaderMaterial,
  UnsignedByteType,
  WebGLRenderTarget,
  type Texture,
  type WebGLRenderer,
} from "three";
import { FULLSCREEN_VERT, GLSL_NOISE } from "./glsl";
import { NOISE_SIZE, noiseData } from "./noise";

/**
 * Texturas assadas na GPU uma vez, no boot (e de novo se o contexto for
 * perdido): o trabalho caro de ruído sai do quadro e vira uma leitura de
 * textura. Todas usam a textura de ruído de semente fixa, então o canvas e
 * as imagens estáticas (scripts/scene-still.mjs) veem exatamente o mesmo.
 *
 *   moon   1024×512  equiretangular, repete em x: albedo (rgb) + relevo (a) — mares, crateras com borda, grão
 *   clouds 1024×512  repete em x e y: r = fiapos, g = bancos, b = tufos (densidade)
 *   fog     512×512  repete: r = névoa macia, g = névoa larga, b = fios de névoa
 *   flow    512×512  repete: r = filamentos de energia, g = fluxo macio, b = cintilação
 */
export type Baked = { moon: Texture; clouds: Texture; fog: Texture; flow: Texture; noise: Texture; dispose: () => void };

export function makeNoiseTexture(): DataTexture {
  const t = new DataTexture(noiseData(), NOISE_SIZE, NOISE_SIZE, RGBAFormat, UnsignedByteType);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.magFilter = LinearFilter;
  t.minFilter = LinearFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
}

/* lua: crateras por celulas (24 x 12, periodicas em x) — depressao com borda elevada — sobre mares em fbm */
const MOON_FRAG = /* glsl */ `
${GLSL_NOISE}
varying vec2 vUv;
/* crateras em duas grades (grandes e rasas, pequenas e marcadas), periodicas em x; poucas celulas ocupadas */
vec2 craters(vec2 uv, vec2 cells, float occ, float seed) {
  vec2 g = uv * cells;
  vec2 id = floor(g);
  vec2 f = fract(g);
  float h = 0.0;
  float dark = 0.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 o = vec2(float(i), float(j));
      vec2 cid = vec2(mod(id.x + o.x, cells.x), id.y + o.y);
      vec3 r = hash32(cid + seed);
      if (r.z > occ) continue;
      vec2 c = o + 0.2 + 0.6 * r.xy;
      float k = r.z / occ;
      float rad = 0.12 + 0.36 * k * k * k;
      float d = length(f - c) / rad;
      float depth = (0.4 + 0.6 * r.x) * mix(1.0, 0.45, k);
      h += (smoothstep(1.0, 0.15, d) * -0.42 + exp(-pow((d - 1.0) / 0.14, 2.0)) * 0.2) * depth;
      dark += smoothstep(1.0, 0.35, d) * 0.16 * depth;
    }
  }
  return vec2(h, dark);
}
vec2 crater(vec2 uv) {
  vec2 big = craters(uv, vec2(20.0, 10.0), 0.3, 17.0);
  vec2 small = craters(uv, vec2(56.0, 28.0), 0.26, 53.0);
  return big + small * 0.7;
}
void main() {
  vec2 p = vec2(vUv.x * 16.0, vUv.y * 8.0);
  float w = pfbm(p * 0.5 + vec2(3.0, 5.0), vec2(8.0, 9999.0), 4);
  float m = pfbm(p + vec2(w * 2.0, w * 1.3), vec2(16.0, 9999.0), 5);
  float maria = smoothstep(0.40, 0.64, m);
  float hi = smoothstep(0.52, 0.78, w);
  vec2 cr = crater(vUv);
  float grain = pfbm(vec2(vUv.x * 128.0, vUv.y * 64.0), vec2(128.0, 9999.0), 2);
  vec3 A = vec3(0.80, 0.30, 0.21);
  vec3 B = vec3(0.46, 0.13, 0.10);
  vec3 C = vec3(1.00, 0.58, 0.41);
  vec3 col = mix(A, B, maria * 0.9);
  col = mix(col, C, hi * 0.42);
  col *= 1.0 - cr.y * 0.7;
  col *= 0.84 + 0.3 * grain;
  float height = 0.55 - maria * 0.22 + cr.x * 0.5 + (grain - 0.5) * 0.14;
  gl_FragColor = vec4(col, sat(height));
}
`;

/* nuvens: tres densidades em canais; todas repetem nos dois eixos (frequencias que dividem 256) */
const CLOUD_FRAG = /* glsl */ `
${GLSL_NOISE}
varying vec2 vUv;
void main() {
  vec2 uv = vUv;
  // fiapos: manchas alongadas na horizontal, quebradas, com dominio torcido (a torcao tambem e periodica)
  float tw = pfbm(vec2(uv.x * 4.0, uv.y * 4.0) + 11.0, vec2(4.0), 3);
  float wisp = pfbm(vec2(uv.x * 6.0 + tw * 1.2, uv.y * 12.0 + tw * 1.5), vec2(6.0, 12.0), 5);
  /* mascara larga: a faixa se quebra em nuvens separadas, com ceu entre elas */
  float mask = pfbm(vec2(uv.x * 3.0, uv.y * 6.0) + 5.0, vec2(3.0, 6.0), 2);
  wisp = smoothstep(0.4, 0.7, wisp) * smoothstep(0.36, 0.58, mask);
  // bancos: volumosos (couve-flor)
  float bw = pfbm(vec2(uv.x * 4.0, uv.y * 4.0) + 23.0, vec2(4.0), 3);
  float bank = pfbm(vec2(uv.x * 8.0 + bw * 3.0, uv.y * 8.0 + bw * 2.0), vec2(8.0), 5);
  bank = smoothstep(0.36, 0.7, bank);
  // tufos: soltos
  float puff = pfbm(vec2(uv.x * 10.0, uv.y * 10.0) + 41.0, vec2(10.0), 5);
  puff = smoothstep(0.52, 0.8, puff);
  gl_FragColor = vec4(wisp, bank, puff, 1.0);
}
`;

const FOG_FRAG = /* glsl */ `
${GLSL_NOISE}
varying vec2 vUv;
void main() {
  vec2 uv = vUv;
  float soft = pfbm(uv * 8.0 + 5.0, vec2(8.0), 5);
  float wide = pfbm(uv * 4.0 + 19.0, vec2(4.0), 4);
  float w = pfbm(uv * 8.0 + 31.0, vec2(8.0), 3);
  float strands = pfbm(vec2(uv.x * 8.0 + w * 2.0, uv.y * 32.0), vec2(8.0, 32.0), 4);
  strands = 1.0 - abs(strands * 2.0 - 1.0);
  gl_FragColor = vec4(smoothstep(0.30, 0.80, soft), smoothstep(0.32, 0.78, wide), pow(strands, 3.0), 1.0);
}
`;

/* energia do Vazio: filamentos (ruido em crista), fluxo macio, cintilacao esparsa */
const FLOW_FRAG = /* glsl */ `
${GLSL_NOISE}
varying vec2 vUv;
void main() {
  vec2 uv = vUv;
  float w = pfbm(uv * 4.0 + 7.0, vec2(4.0), 3);
  float n = pfbm(uv * 8.0 + vec2(w * 2.0, w), vec2(8.0), 5);
  float ridge = 1.0 - abs(n * 2.0 - 1.0);
  float fil = pow(ridge, 5.0);
  float soft = pfbm(uv * 4.0 + 29.0, vec2(4.0), 4);
  vec3 h = hash32(floor(uv * 128.0));
  float spark = step(0.985, h.x) * h.y;
  gl_FragColor = vec4(fil, soft, spark, 1.0);
}
`;

function fullscreenTriangle(): BufferGeometry {
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  return g;
}

function bakeOne(renderer: WebGLRenderer, noise: Texture, frag: string, w: number, h: number, repeatX: boolean, repeatY: boolean): WebGLRenderTarget {
  const rt = new WebGLRenderTarget(w, h, { type: UnsignedByteType, format: RGBAFormat, depthBuffer: false, stencilBuffer: false });
  rt.texture.wrapS = repeatX ? RepeatWrapping : ClampToEdgeWrapping;
  rt.texture.wrapT = repeatY ? RepeatWrapping : ClampToEdgeWrapping;
  rt.texture.magFilter = LinearFilter;
  rt.texture.minFilter = LinearMipmapLinearFilter;
  rt.texture.generateMipmaps = true;
  const mat = new ShaderMaterial({ vertexShader: FULLSCREEN_VERT, fragmentShader: frag, uniforms: { uNoise: { value: noise } }, depthTest: false, depthWrite: false });
  const geo = fullscreenTriangle();
  const mesh = new Mesh(geo, mat);
  mesh.frustumCulled = false;
  const scene = new Scene();
  scene.add(mesh);
  const cam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const prev = renderer.getRenderTarget();
  renderer.setRenderTarget(rt);
  renderer.render(scene, cam);
  renderer.setRenderTarget(prev);
  geo.dispose();
  mat.dispose();
  return rt;
}

export function bakeAll(renderer: WebGLRenderer, small = false): Baked {
  const noise = makeNoiseTexture();
  const k = small ? 0.5 : 1;
  const moon = bakeOne(renderer, noise, MOON_FRAG, 1024 * k, 512 * k, true, false);
  const clouds = bakeOne(renderer, noise, CLOUD_FRAG, 1024 * k, 512 * k, true, true);
  const fog = bakeOne(renderer, noise, FOG_FRAG, 512 * k, 512 * k, true, true);
  const flow = bakeOne(renderer, noise, FLOW_FRAG, 512 * k, 512 * k, true, true);
  return {
    moon: moon.texture,
    clouds: clouds.texture,
    fog: fog.texture,
    flow: flow.texture,
    noise,
    dispose: () => {
      moon.dispose();
      clouds.dispose();
      fog.dispose();
      flow.dispose();
      noise.dispose();
    },
  };
}
