import { BufferAttribute, BufferGeometry, Color, Mesh, OrthographicCamera, Scene, ShaderMaterial, Vector2, Vector3, Vector4 } from "three";
import { PALETTE, type Mood } from "./scene.config";

/**
 * O ambiente atrás da entidade: um plano de tela inteira (um draw call, sem textura).
 * Carvão no tema escuro, gelo no claro — base, um halo atrás do corpo que o acompanha,
 * névoa lenta em duas oitavas, um reflexo/sombra sob os pés, vinheta e pontilhado contra faixas.
 * Na troca de tema os dois ambientes são calculados e a frente do novo avança em círculo a
 * partir do controle de tema. O toque num app solta uma onda curta no ponto de contato.
 *
 * As cores saem prontas para a tela (sRGB): este material não passa por tone mapping.
 */
const VERT = /* glsl */ `
void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const FRAG = /* glsl */ `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uBaseA, uDeepA, uGlowA, uHazeA, uAccentA;
uniform vec3 uBaseB, uDeepB, uGlowB, uHazeB, uAccentB;
uniform float uLightA, uLightB;   // 0 = ambiente escuro, 1 = claro
uniform float uP;                 // progresso da troca (0 = só A, 1 = só B)
uniform vec2 uOrigin;             // origem da frente (px, y de baixo)
uniform vec3 uBody;               // quadril (px, y de baixo) e px por unidade
uniform vec4 uPulse;              // contato: xy (px), progresso 0..1, força
uniform float uGrain;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}

vec3 ambient(vec2 px, vec3 base, vec3 deep, vec3 glow, vec3 haze, vec3 accent, float light) {
  vec2 uv = px / uRes;
  float k = uBody.z;
  // base: do centro para as bordas
  vec2 c = (px - uRes * 0.5) / max(uRes.x, uRes.y);
  vec3 col = mix(base, deep, smoothstep(0.18, 0.78, length(c * vec2(1.0, 1.25))));
  // halo atrás do corpo
  vec2 d = (px - (uBody.xy + vec2(0.0, 0.25 * k))) / vec2(1.25 * k, 1.5 * k);
  float h = exp(-dot(d, d) * 1.5);
  col = mix(col, glow, h * mix(0.62, 0.9, light));
  // névoa lenta
  float n = noise(px / (1.9 * k) + vec2(uTime * 0.012, -uTime * 0.007)) * 0.62 + noise(px / (0.74 * k) - vec2(uTime * 0.02, 0.0)) * 0.38;
  col += (haze - col) * (n - 0.42) * mix(0.22, 0.16, light) * smoothstep(1.4, 0.2, length(d));
  // sob os pés: reflexo quente no escuro, sombra suave no claro
  vec2 f = (px - (uBody.xy - vec2(0.0, 1.32 * k))) / vec2(0.95 * k, 0.11 * k);
  float e = exp(-dot(f, f));
  col = mix(col + accent * e * 0.09, col * (1.0 - 0.13 * e), light);
  // vinheta
  col *= 1.0 - mix(0.42, 0.07, light) * smoothstep(0.35, 0.95, length(c * vec2(1.0, 1.3)));
  return col;
}

void main() {
  vec2 px = gl_FragCoord.xy;
  vec3 col = ambient(px, uBaseA, uDeepA, uGlowA, uHazeA, uAccentA, uLightA);
  vec3 accent = uAccentA;
  if (uP > 0.0) {
    float reach = length(max(uOrigin, uRes - uOrigin)) * 1.08;
    float front = uP * reach;
    float dist = length(px - uOrigin);
    float w = 0.08 * reach;
    float m = 1.0 - smoothstep(front - w, front + w * 0.25, dist);
    vec3 b = ambient(px, uBaseB, uDeepB, uGlowB, uHazeB, uAccentB, uLightB);
    col = mix(col, b, m);
    accent = mix(uAccentA, uAccentB, m);
    // a crista da frente acende na cor do tema que chega
    float crest = exp(-pow((dist - front) / (0.022 * reach), 2.0)) * smoothstep(0.0, 0.08, uP) * smoothstep(1.0, 0.7, uP);
    col += uAccentB * crest * mix(0.5, 0.28, uLightB);
  }
  // onda do toque
  if (uPulse.w > 0.0) {
    float r = length(px - uPulse.xy);
    float rad = uPulse.z * 0.62 * uBody.z;
    float ring = exp(-pow((r - rad) / (0.035 * uBody.z), 2.0)) * (1.0 - uPulse.z);
    float core = exp(-r * r / pow(0.12 * uBody.z, 2.0)) * pow(1.0 - uPulse.z, 2.0);
    col += accent * (ring * 0.55 + core * 0.5) * uPulse.w;
  }
  col += (hash(px + fract(uTime) * 61.0) - 0.5) * uGrain;
  gl_FragColor = vec4(col, 1.0);
}
`;

export type Backdrop = {
  scene: Scene;
  camera: OrthographicCamera;
  /** Ambiente em cena (e o que chega, durante a troca). */
  set(a: Mood, b: Mood | null, p: number, origin: [number, number]): void;
  frame(res: [number, number], time: number, body: [number, number, number], pulse: [number, number, number, number], grain: number): void;
  dispose(): void;
};

export function createBackdrop(): Backdrop {
  const geo = new BufferGeometry();
  geo.setAttribute("position", new BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  const col = () => ({ value: new Vector3() });
  const mat = new ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    uniforms: {
      uRes: { value: new Vector2(1, 1) },
      uTime: { value: 0 },
      uBaseA: col(), uDeepA: col(), uGlowA: col(), uHazeA: col(), uAccentA: col(),
      uBaseB: col(), uDeepB: col(), uGlowB: col(), uHazeB: col(), uAccentB: col(),
      uLightA: { value: 0 },
      uLightB: { value: 0 },
      uP: { value: 0 },
      uOrigin: { value: new Vector2() },
      uBody: { value: new Vector3(0, 0, 300) },
      uPulse: { value: new Vector4(0, 0, 0, 0) },
      uGrain: { value: 0.012 },
    },
  });
  const mesh = new Mesh(geo, mat);
  mesh.frustumCulled = false;
  const scene = new Scene();
  scene.add(mesh);
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const c = new Color();
  // cor de tela (sRGB) direto para o uniform: nada de conversão para linear aqui
  const put = (u: { value: Vector3 }, hex: string) => {
    c.set(hex);
    c.convertLinearToSRGB();
    u.value.set(c.r, c.g, c.b);
  };
  const fill = (s: "A" | "B", m: Mood) => {
    const P = PALETTE[m];
    const u = mat.uniforms;
    put(u[`uBase${s}`], P.base);
    put(u[`uDeep${s}`], P.deep);
    put(u[`uGlow${s}`], P.glow);
    put(u[`uHaze${s}`], P.haze);
    put(u[`uAccent${s}`], P.accent);
    u[`uLight${s}`].value = m === "light" ? 1 : 0;
  };
  return {
    scene,
    camera,
    set(a, b, p, origin) {
      fill("A", a);
      fill("B", b ?? a);
      mat.uniforms.uP.value = b ? p : 0;
      mat.uniforms.uOrigin.value.set(origin[0], origin[1]);
    },
    frame(res, time, body, pulse, grain) {
      const u = mat.uniforms;
      u.uRes.value.set(res[0], res[1]);
      u.uTime.value = time;
      u.uBody.value.set(body[0], body[1], body[2]);
      u.uPulse.value.set(pulse[0], pulse[1], pulse[2], pulse[3]);
      u.uGrain.value = grain;
    },
    dispose() {
      geo.dispose();
      mat.dispose();
    },
  };
}
