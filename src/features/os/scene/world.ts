import { BufferAttribute, BufferGeometry, type PerspectiveCamera, type Scene } from "three";
import { F } from "./scene.config";

/**
 * Contrato de um universo da cena. Tudo em px do buffer de desenho (y do
 * topo, como o DOM), exceto o que vai para o GLSL (gl_FragCoord tem y de
 * baixo — cada mundo converte).
 */
export type FrameCtx = {
  /** tempo da cena (s) e passo do quadro (s) */
  t: number;
  dt: number;
  /** paralaxe amortecida, −1..1 (x para a direita, y para cima) */
  par: { x: number; y: number };
  /** reação localizada (app destacado): posição e raio em px do buffer (y do topo), intensidade 0..1 */
  hover: { x: number; y: number; r: number; k: number };
  /** tamanho do buffer de desenho (px) */
  res: [number, number];
  /** palco: centro e raio da composição (px do buffer, y do topo) */
  stage: { x: number; y: number; r: number };
  /** travessia: saída deste universo (0 = em cena) e chegada (1 = em cena) */
  leave: number;
  enter: number;
};

export interface World {
  readonly scene: Scene;
  readonly camera: PerspectiveCamera;
  update(ctx: FrameCtx): void;
  dispose(): void;
}

/**
 * Enquadra a câmera no palco: o eixo óptico passa pelo centro do palco
 * (setViewOffset) e a distância focal é F × R px — a composição fica em
 * unidades do raio, igual em qualquer tamanho de tela (e igual às imagens
 * estáticas). Um ponto em (x, y, −z) aparece em centro + (x, y) · F / z · R.
 */
export function frameCamera(cam: PerspectiveCamera, res: [number, number], stage: { x: number; y: number; r: number }) {
  const [W, H] = res;
  const fullW = 2 * Math.max(stage.x, W - stage.x, 1);
  const fullH = 2 * Math.max(stage.y, H - stage.y, 1);
  cam.aspect = fullW / fullH;
  cam.fov = (2 * Math.atan(fullH / 2 / (F * Math.max(stage.r, 1))) * 180) / Math.PI;
  cam.setViewOffset(fullW, fullH, fullW / 2 - stage.x, fullH / 2 - stage.y, W, H);
  cam.updateProjectionMatrix();
}

/** Posição no mundo de um ponto da composição: (u, v) em raios do palco, a z unidades da câmera. */
export const place = (u: number, v: number, z: number): [number, number, number] => [(u * z) / F, (v * z) / F, -z];

/** Triângulo de tela inteira (o vértice já sai em clip space). */
export function fullscreenGeometry(): BufferGeometry {
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  return g;
}

/** Gerador pseudoaleatório com semente (mulberry32): a cena é a mesma a cada carga e nas imagens estáticas. */
export function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
