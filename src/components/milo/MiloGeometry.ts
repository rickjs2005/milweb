import * as THREE from "three";
import { MILO } from "./milo.config";

/**
 * Geometrias procedurais do Milo. Cada parte devolve o par
 * { mask, wire }: a malha lisa (silhueta/máscara) e LINHAS ESTRUTURAIS
 * (não uma malha triangulada): longitudinais + anéis que revelam a
 * anatomia sem preencher a silhueta como croqui.
 * Convenção: o osso desce pelo -Y a partir da origem (a articulação).
 */
export type PartGeometry = { mask: THREE.BufferGeometry; wire: THREE.BufferGeometry };

function capsuleAlongBone(length: number, radius: number, scaleX = 1, scaleZ = 1): THREE.BufferGeometry {
  const g = new THREE.CapsuleGeometry(radius, Math.max(0.001, length - radius * 1.2), 6, 22);
  g.translate(0, -length / 2, 0);
  g.scale(scaleX, 1, scaleZ);
  return g;
}

/** Linhas estruturais de um membro: `longs` longitudinais + `rings` anéis, afinando. */
function limbWire(length: number, radius: number, taper: number, longs = 3, rings = 2, scaleX = 1, scaleZ = 1): THREE.BufferGeometry {
  const out: number[] = [];
  const rAt = (t: number) => radius * THREE.MathUtils.lerp(1, taper, t);
  const segs = 8;
  for (let l = 0; l < longs; l++) {
    const a = (l / longs) * Math.PI * 2 + 0.4;
    for (let s = 0; s < segs; s++) {
      const t0 = s / segs, t1 = (s + 1) / segs;
      out.push(Math.cos(a) * rAt(t0) * scaleX, -t0 * length, Math.sin(a) * rAt(t0) * scaleZ, Math.cos(a) * rAt(t1) * scaleX, -t1 * length, Math.sin(a) * rAt(t1) * scaleZ);
    }
  }
  const rs = 14;
  for (let r = 0; r < rings; r++) {
    const t = (r + 1) / (rings + 1);
    for (let s = 0; s < rs; s++) {
      const a0 = (s / rs) * Math.PI * 2, a1 = ((s + 1) / rs) * Math.PI * 2;
      out.push(Math.cos(a0) * rAt(t) * scaleX, -t * length, Math.sin(a0) * rAt(t) * scaleZ, Math.cos(a1) * rAt(t) * scaleX, -t * length, Math.sin(a1) * rAt(t) * scaleZ);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(out, 3));
  return g;
}

/** Membro genérico (braço, antebraço, coxa, canela). */
export function limb(length: number, radius: number, taper = 0.88, longs = 3, rings = 2): PartGeometry {
  const g = capsuleAlongBone(length, radius);
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const t = THREE.MathUtils.clamp(-pos.getY(i) / length, 0, 1);
    const s = THREE.MathUtils.lerp(1, taper, t);
    pos.setX(i, pos.getX(i) * s);
    pos.setZ(i, pos.getZ(i) * s);
  }
  g.computeVertexNormals();
  return { mask: g, wire: limbWire(length, radius, taper, longs, rings) };
}

/** Torso: cápsula larga e rasa, esterno à frente, costas planas; linhas = clavícula + 2 anéis. */
export function torso(length: number, radius: number, wx: number, wz: number): PartGeometry {
  const g = capsuleAlongBone(length, radius, wx, wz);
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const t = THREE.MathUtils.clamp(-y / length, 0, 1);
    const narrow = THREE.MathUtils.lerp(1, 0.76, t * t);
    pos.setX(i, x * narrow);
    pos.setZ(i, z > 0 ? z * (1 + 0.12 * (1 - t)) : z * 0.9);
  }
  g.computeVertexNormals();
  const wire = limbWire(length, radius, 0.78, 0, 2, wx, wz);
  // clavícula: linha frontal suave de ombro a ombro
  const cl: number[] = [];
  const n = 10;
  for (let s = 0; s < n; s++) {
    const a0 = -1 + (2 * s) / n, a1 = -1 + (2 * (s + 1)) / n;
    const f = (a: number) => [a * radius * wx * 0.95, -0.03 - Math.abs(a) * 0.02, radius * wz * (0.9 - a * a * 0.25)];
    cl.push(...f(a0), ...f(a1));
  }
  const merged = mergeLines(wire, cl);
  return { mask: g, wire: merged };
}

/** Pélvis: bloco arredondado; linha = cinto. */
export function pelvis(w: number, h: number, d: number): PartGeometry {
  const g = new THREE.SphereGeometry(1, 20, 14);
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const sq = (v: number) => Math.sign(v) * Math.pow(Math.abs(v), 0.72);
    pos.setXYZ(i, sq(pos.getX(i)) * w * 0.5, sq(pos.getY(i)) * h * 0.5 - h * 0.5, sq(pos.getZ(i)) * d * 0.5);
  }
  g.computeVertexNormals();
  return { mask: g, wire: limbWire(h, w * 0.5, 0.95, 0, 1, 1, d / w) };
}

/**
 * Cabeça — nunca uma esfera: laterais estreitas e mais planas, topo
 * ligeiramente alongado, mandíbula por planos angulares, região frontal
 * inclinada para trás, nuca alongada, coroa aplanada, assimetria mínima.
 * Sem rosto: a personalidade vem da forma e da inclinação.
 */
function deformHead(x: number, y: number, z: number): [number, number, number] {
  x = Math.sign(x) * Math.pow(Math.abs(x), 0.55);
  if (y > 0) y *= 1.08;
  const jaw = THREE.MathUtils.clamp((-y - 0.05) / 0.95, 0, 1);
  x *= 1 - 0.5 * jaw * jaw;
  z *= 1 - 0.26 * jaw;
  // planos da mandíbula
  if (jaw > 0.25 && Math.abs(x) > 0.34) x = Math.sign(x) * (0.34 + (Math.abs(x) - 0.34) * 0.5);
  if (y < -0.86) y = -0.86 - (y + 0.86) * 0.4;
  // testa inclinada para trás; plano frontal
  if (z > 0.3 && y > -0.1) z -= 0.14 * Math.max(0, y);
  if (z > 0.55) z = 0.55 + (z - 0.55) * 0.5;
  if (z < 0 && y > 0) z *= 1.1;
  if (y > 0.8) y = 0.8 + (y - 0.8) * 0.7;
  x += Math.sin(y * 3.1 + 0.4) * 0.015;
  z += Math.cos(y * 2.3) * 0.006 * Math.sign(x || 1);
  return [x, y, z];
}

export function head(w: number, h: number, d: number): PartGeometry {
  const g = new THREE.SphereGeometry(1, 30, 22);
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const [x, y, z] = deformHead(pos.getX(i), pos.getY(i), pos.getZ(i));
    pos.setXYZ(i, x * w * 0.5, y * h * 0.5, z * d * 0.5);
  }
  g.translate(0, h * 0.5 + 0.012, 0.012);
  g.computeVertexNormals();

  // linhas: perfil lateral (um lado só), linha da mandíbula, coroa
  const out: number[] = [];
  const pt = (x: number, y: number, z: number) => {
    const [a, b, c] = deformHead(x, y, z);
    return [a * w * 0.5, b * h * 0.5 + h * 0.5 + 0.012, c * d * 0.5 + 0.012];
  };
  const poly = (pts: number[][]) => {
    for (let i = 0; i < pts.length - 1; i++) out.push(...pts[i], ...pts[i + 1]);
  };
  const side: number[][] = [];
  for (let i = 0; i <= 14; i++) {
    const a = -Math.PI * 0.5 + (i / 14) * Math.PI; // de baixo a cima, lado -x
    side.push(pt(-0.999, Math.sin(a), Math.cos(a) * 0.15));
  }
  poly(side);
  const jawL: number[][] = [];
  for (let i = 0; i <= 10; i++) {
    const a = (i / 10) * Math.PI; // de -x a +x pela frente
    jawL.push(pt(-Math.cos(a) * 0.95, -0.55, Math.sin(a) * 0.95));
  }
  poly(jawL);
  const crown: number[][] = [];
  for (let i = 0; i <= 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    crown.push(pt(Math.cos(a) * 0.7, 0.72, Math.sin(a) * 0.7));
  }
  poly(crown);
  const wire = new THREE.BufferGeometry();
  wire.setAttribute("position", new THREE.Float32BufferAttribute(out, 3));
  return { mask: g, wire };
}

/** Pescoço: mais longo, mais fino, transição definida para a cabeça e trapézio atrás. */
export function neck(length: number, radius: number): PartGeometry {
  const g = new THREE.CylinderGeometry(radius * 0.88, radius * 1.2, length, 18, 2, false);
  g.translate(0, -length / 2, 0);
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const t = THREE.MathUtils.clamp(-y / length, 0, 1);
    if (pos.getZ(i) < 0) pos.setZ(i, pos.getZ(i) * (1 + 0.7 * t));
    if (Math.abs(pos.getX(i)) > 0) pos.setX(i, pos.getX(i) * (1 + 0.25 * t));
  }
  g.computeVertexNormals();
  return { mask: g, wire: limbWire(length, radius, 1.15, 2, 1) };
}

/** Articulação: esfera achatada ao longo do osso. */
export function joint(radius: number): PartGeometry {
  const g = new THREE.SphereGeometry(radius, 16, 12);
  g.scale(1, 0.82, 1);
  return { mask: g, wire: limbWire(radius * 1.6, radius, 1, 0, 1) };
}

/** Mão estilizada: palma achatada + polegar curto; linhas = contorno da palma + 3 dedos sugeridos. */
export function hand(length: number, radius: number, side: 1 | -1): PartGeometry {
  const palm = capsuleAlongBone(length, radius, 1.25, 0.5);
  const thumb = new THREE.CapsuleGeometry(radius * 0.45, length * 0.28, 4, 10);
  thumb.rotateZ(side * 0.75);
  thumb.translate(side * radius * 1.1, -length * 0.32, radius * 0.25);
  const merged = mergeGeometries([palm, thumb]);
  merged.computeVertexNormals();
  const out: number[] = [];
  // contorno da palma (elipse) + dedos: 3 traços a partir do fim da palma
  for (let s = 0; s < 12; s++) {
    const a0 = (s / 12) * Math.PI * 2, a1 = ((s + 1) / 12) * Math.PI * 2;
    out.push(Math.cos(a0) * radius * 1.2, -length * 0.55 + Math.sin(a0) * length * 0.3, 0, Math.cos(a1) * radius * 1.2, -length * 0.55 + Math.sin(a1) * length * 0.3, 0);
  }
  for (const fx of [-0.6, 0, 0.6]) out.push(fx * radius, -length * 0.82, 0, fx * radius * 1.15, -length * 1.05, 0.004);
  const wire = new THREE.BufferGeometry();
  wire.setAttribute("position", new THREE.Float32BufferAttribute(out, 3));
  return { mask: merged, wire };
}

/** Pé: cápsula deitada; linhas = uma aresta lateral. */
export function foot(length: number, radius: number): PartGeometry {
  return { mask: capsuleAlongBone(length, radius, 1.15, 0.85), wire: limbWire(length, radius, 0.85, 1, 1, 1.15, 0.85) };
}

function mergeLines(a: THREE.BufferGeometry, extra: number[]): THREE.BufferGeometry {
  const base = Array.from(a.attributes.position.array as Float32Array);
  a.dispose();
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(base.concat(extra), 3));
  return g;
}

/** Une geometrias não indexadas (posição/normal/uv) — evita importar examples/. */
function mergeGeometries(list: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const parts = list.map((g) => (g.index ? g.toNonIndexed() : g));
  const total = parts.reduce((n, g) => n + g.attributes.position.count, 0);
  const pos = new Float32Array(total * 3);
  const nor = new Float32Array(total * 3);
  const uv = new Float32Array(total * 2);
  let o = 0;
  for (const g of parts) {
    pos.set(g.attributes.position.array as Float32Array, o * 3);
    nor.set(g.attributes.normal.array as Float32Array, o * 3);
    const u = g.attributes.uv as THREE.BufferAttribute | undefined;
    if (u) uv.set(u.array as Float32Array, o * 2);
    o += g.attributes.position.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  out.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  out.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  parts.forEach((g, i) => g !== list[i] && g.dispose());
  return out;
}

export const PROPS = MILO.proportions;
