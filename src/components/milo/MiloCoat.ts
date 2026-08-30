import * as THREE from "three";
import { MILO } from "./milo.config";

/**
 * Casaco arquitetônico — BufferGeometry própria. Uma casca aberta na frente,
 * varrida dos ombros à bainha, com:
 *   · gola alta atrás do pescoço, mais alta do lado direito (assimetria);
 *   · bainha mais baixa do lado esquerdo;
 *   · um recorte diagonal na frente direita;
 *   · ombros com leve "prateleira".
 * uv.y = 0 nos ombros → 1 na bainha (o vertex shader usa como peso do balanço).
 * Coordenadas locais do PEITO (pivot no alto do tronco).
 */
export function buildCoat(): THREE.BufferGeometry {
  const c = MILO.coat;
  const rows = c.rows;
  const cols = c.cols;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const start = c.gap; // abertura frontal: θ de gap → 2π − gap (0 = frente, π = costas)
  const end = Math.PI * 2 - c.gap;

  const topEdge = (theta: number) => {
    // θ ∈ [gap, 2π-gap]; costas em torno de π
    const back = Math.max(0, 1 - Math.abs(theta - Math.PI) / (Math.PI - c.collar.spread)); // 1 nas costas, 0 onde a gola começa
    const side = theta < Math.PI ? 1 + c.collar.asym : 1 - c.collar.asym * 0.35; // direita (θ<π) mais alta
    const collar = Math.pow(THREE.MathUtils.smoothstep(back, 0, 1), 0.7) * c.collar.height * side;
    // ombros: leve prateleira nas laterais
    const shoulder = Math.exp(-Math.pow((Math.abs(theta - Math.PI / 2) % Math.PI) - 0, 2) * 3) * 0.02;
    return c.top + collar + shoulder;
  };
  const hemEdge = (theta: number) => {
    const leftness = Math.sin(theta); // >0 lado esquerdo do corpo (θ ∈ (0,π) = +x)... convenção abaixo
    let y = c.hem - Math.max(0, -leftness) * c.hemAsym; // lado com sin<0 (x negativo = esquerda do Milo) desce
    // recorte diagonal na frente direita
    const d = theta - (Math.PI * 2 + c.cut.at); // cut.at negativo → perto da abertura, lado +x
    const cutW = 0.55;
    if (Math.abs(d) < cutW) y += c.cut.depth * (1 - Math.abs(d) / cutW);
    return y;
  };

  for (let r = 0; r <= rows; r++) {
    const t = r / rows;
    for (let k = 0; k <= cols; k++) {
      const theta = THREE.MathUtils.lerp(start, end, k / cols);
      const rx = THREE.MathUtils.lerp(c.rx[0], c.rx[1], t);
      const rz = THREE.MathUtils.lerp(c.rz[0], c.rz[1], t);
      // as costas são mais planas que a frente
      const x = Math.sin(theta) * rx * (1 + 0.06 * Math.cos(theta * 2));
      const z = Math.cos(theta) * rz * (Math.cos(theta) < 0 ? 0.86 : 1);
      const y = THREE.MathUtils.lerp(topEdge(theta), hemEdge(theta), smoothT(t));
      // a gola inclina para trás no topo
      const lean = t < 0.12 && Math.cos(theta) < -0.3 ? (0.12 - t) * 0.35 : 0;
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

/** Distribuição das linhas: mais densas perto dos ombros (gola), abrindo para a bainha. */
function smoothT(t: number) {
  return t * t * (3 - 2 * t) * 0.6 + t * 0.4;
}

/** Wireframe do casaco: só as linhas horizontais e algumas verticais (estrutura, não malha). */
export function buildCoatWire(coat: THREE.BufferGeometry): THREE.BufferGeometry {
  const c = MILO.coat;
  const pos = coat.attributes.position as THREE.BufferAttribute;
  const stride = c.cols + 1;
  const out: number[] = [];
  for (let r = 0; r <= c.rows; r += 3) {
    for (let k = 0; k < c.cols; k++) {
      const a = r * stride + k;
      out.push(pos.getX(a), pos.getY(a), pos.getZ(a), pos.getX(a + 1), pos.getY(a + 1), pos.getZ(a + 1));
    }
  }
  for (let k = 0; k <= c.cols; k += 6) {
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
