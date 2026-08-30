import * as THREE from "three";
import { MILO } from "./milo.config";

/**
 * Casaco arquitetônico — BufferGeometry própria. Casca aberta na frente,
 * varrida dos ombros à bainha, com:
 *   · gola alta atrás do pescoço, mais alta do lado direito;
 *   · DUAS ABAS de comprimentos diferentes (a esquerda desce muito mais:
 *     a linha externa longa e elegante da silhueta);
 *   · recorte diagonal na frente direita;
 *   · ombros com prateleira.
 * uv.y = 0 nos ombros → 1 na bainha (peso do balanço no vertex shader).
 * Coordenadas locais do PEITO.
 */
export function buildCoat(): THREE.BufferGeometry {
  const c = MILO.coat;
  const rows = c.rows;
  const cols = c.cols;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const start = c.gap;
  const end = Math.PI * 2 - c.gap;

  const topEdge = (theta: number) => {
    const back = Math.max(0, 1 - Math.abs(theta - Math.PI) / (Math.PI - c.collar.spread));
    const side = theta < Math.PI ? 1 + c.collar.asym : 1 - c.collar.asym * 0.3;
    const collar = Math.pow(THREE.MathUtils.smoothstep(back, 0, 1), 0.65) * c.collar.height * side;
    const shoulder = Math.exp(-Math.pow(Math.abs(Math.sin(theta)) - 1, 2) * 30) * 0.03;
    return c.top + collar + shoulder;
  };
  const hemEdge = (theta: number) => {
    const s = Math.sin(theta); // >0 → +x (direita do Milo)
    const flap = s < 0 ? c.flap.left : c.flap.right;
    const front = Math.max(0, Math.cos(theta)); // 1 na abertura frontal
    let y = THREE.MathUtils.lerp(c.hem, flap, Math.pow(front, 0.8));
    const d = theta - (Math.PI * 2 + c.cut.at);
    const cutW = 0.5;
    if (Math.abs(d) < cutW) y += c.cut.depth * (1 - Math.abs(d) / cutW);
    return y;
  };

  for (let r = 0; r <= rows; r++) {
    const t = r / rows;
    for (let k = 0; k <= cols; k++) {
      const theta = THREE.MathUtils.lerp(start, end, k / cols);
      const rx = THREE.MathUtils.lerp(c.rx[0], c.rx[1], t);
      const rz = THREE.MathUtils.lerp(c.rz[0], c.rz[1], t);
      const x = Math.sin(theta) * rx * (1 + 0.05 * Math.cos(theta * 2));
      const z = Math.cos(theta) * rz * (Math.cos(theta) < 0 ? 0.84 : 1);
      const y = THREE.MathUtils.lerp(topEdge(theta), hemEdge(theta), smoothT(t));
      const lean = t < 0.12 && Math.cos(theta) < -0.3 ? (0.12 - t) * 0.4 : 0;
      positions.push(x, y, z - lean);
      uvs.push(k / cols, t);
    }
  }
  const stride = cols + 1;
  for (let r = 0; r < rows; r++) {
    for (let k = 0; k < cols; k++) {
      const a = r * stride + k;
      const b = a + 1;
      const d = a + stride;
      const e = d + 1;
      indices.push(a, d, b, b, d, e);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

function smoothT(t: number) {
  return t * t * (3 - 2 * t) * 0.6 + t * 0.4;
}

/** Linhas do casaco: só as estruturais — gola, uma costura, bainha e as bordas das abas. */
export function buildCoatWire(coat: THREE.BufferGeometry): THREE.BufferGeometry {
  const c = MILO.coat;
  const pos = coat.attributes.position as THREE.BufferAttribute;
  const stride = c.cols + 1;
  const out: number[] = [];
  const row = (r: number) => {
    for (let k = 0; k < c.cols; k++) {
      const a = r * stride + k;
      out.push(pos.getX(a), pos.getY(a), pos.getZ(a), pos.getX(a + 1), pos.getY(a + 1), pos.getZ(a + 1));
    }
  };
  row(0);
  row(Math.round(c.rows * 0.38));
  row(c.rows);
  for (const k of [0, c.cols]) {
    for (let r = 0; r < c.rows; r++) {
      const a = r * stride + k;
      const d = a + stride;
      out.push(pos.getX(a), pos.getY(a), pos.getZ(a), pos.getX(d), pos.getY(d), pos.getZ(d));
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(out, 3));
  return g;
}
