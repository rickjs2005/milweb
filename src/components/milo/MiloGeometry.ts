import * as THREE from "three";
import { MILO } from "./milo.config";

/**
 * Geometrias procedurais do Milo. Cada parte devolve o par
 * { mask, wire }: uma versão lisa (silhueta/máscara) e uma de baixa
 * resolução para o wireframe fragmentado — a mesma forma, duas leituras.
 * Convenção: o osso desce pelo -Y a partir da origem (a articulação).
 */
export type PartGeometry = { mask: THREE.BufferGeometry; wire: THREE.BufferGeometry };

function capsuleAlongBone(length: number, radius: number, hi: boolean, scaleX = 1, scaleZ = 1): THREE.BufferGeometry {
  const g = new THREE.CapsuleGeometry(radius, Math.max(0.001, length - radius * 1.2), hi ? 6 : 3, hi ? 22 : 9);
  g.translate(0, -length / 2, 0);
  g.scale(scaleX, 1, scaleZ);
  return g;
}

/** Membro genérico (braço, antebraço, coxa, canela). */
export function limb(length: number, radius: number, taper = 0.88): PartGeometry {
  const build = (hi: boolean) => {
    const g = capsuleAlongBone(length, radius, hi);
    // afina para a extremidade distal
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const t = THREE.MathUtils.clamp(-y / length, 0, 1);
      const s = THREE.MathUtils.lerp(1, taper, t);
      pos.setX(i, pos.getX(i) * s);
      pos.setZ(i, pos.getZ(i) * s);
    }
    g.computeVertexNormals();
    return g;
  };
  return { mask: build(true), wire: build(false) };
}

/** Torso: cápsula larga e rasa, com o esterno ligeiramente à frente. */
export function torso(length: number, radius: number, wx: number, wz: number): PartGeometry {
  const build = (hi: boolean) => {
    const g = capsuleAlongBone(length, radius, hi, wx, wz);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const t = THREE.MathUtils.clamp(-y / length, 0, 1); // 0 ombros → 1 cintura
      const narrow = THREE.MathUtils.lerp(1, 0.78, t * t); // V do tronco
      pos.setX(i, x * narrow);
      // esterno levemente projetado e costas planas
      pos.setZ(i, z > 0 ? z * (1 + 0.1 * (1 - t)) : z * 0.92);
    }
    g.computeVertexNormals();
    return g;
  };
  return { mask: build(true), wire: build(false) };
}

/** Pélvis: bloco arredondado. */
export function pelvis(w: number, h: number, d: number): PartGeometry {
  const build = (hi: boolean) => {
    const g = new THREE.SphereGeometry(1, hi ? 20 : 8, hi ? 14 : 6);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      // "quadrado" suave: puxa para uma caixa arredondada
      const sq = (v: number) => Math.sign(v) * Math.pow(Math.abs(v), 0.72);
      pos.setXYZ(i, sq(x) * w * 0.5, sq(y) * h * 0.5 - h * 0.5, sq(z) * d * 0.5);
    }
    g.computeVertexNormals();
    return g;
  };
  return { mask: build(true), wire: build(false) };
}

/**
 * Cabeça: esfera deformada — levemente angular, nunca uma esfera perfeita.
 * Maxilar que estreita para o queixo, laterais achatadas, testa plana,
 * nuca alongada, coroa ligeiramente aplanada, assimetria mínima.
 */
export function head(w: number, h: number, d: number): PartGeometry {
  const build = (hi: boolean) => {
    const g = new THREE.SphereGeometry(1, hi ? 30 : 12, hi ? 22 : 9);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      // laterais mais planas (angular)
      x = Math.sign(x) * Math.pow(Math.abs(x), 0.6);
      // maxilar: abaixo do meio, estreita em x e z rumo ao queixo
      const jaw = THREE.MathUtils.clamp((-y - 0.1) / 0.9, 0, 1);
      x *= 1 - 0.48 * jaw * jaw;
      z *= 1 - 0.22 * jaw;
      // arcada da sobrancelha: plano que avança um pouco
      if (y > 0.05 && y < 0.4 && z > 0.3) z += 0.06 * (1.0 - Math.abs(y - 0.22) / 0.18);
      // queixo: achata o fundo
      if (y < -0.86) y = -0.86 - (y + 0.86) * 0.45;
      // testa/face: plano frontal suave
      if (z > 0.55 && y > -0.2) z = 0.55 + (z - 0.55) * 0.62;
      // nuca alongada, coroa aplanada
      if (z < 0 && y > 0) z *= 1.09;
      if (y > 0.78) y = 0.78 + (y - 0.78) * 0.78;
      // assimetria mínima
      x += Math.sin(y * 3.1) * 0.012;
      pos.setXYZ(i, x * w * 0.5, y * h * 0.5, z * d * 0.5);
    }
    g.translate(0, h * 0.5, 0.01);
    g.computeVertexNormals();
    return g;
  };
  return { mask: build(true), wire: build(false) };
}

/** Pescoço: cilindro ligeiramente cônico. */
export function neck(length: number, radius: number): PartGeometry {
  const build = (hi: boolean) => {
    const g = new THREE.CylinderGeometry(radius * 0.95, radius * 1.15, length, hi ? 18 : 8, 1, false);
    g.translate(0, -length / 2, 0);
    // trapézio: alarga para trás na base
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const t = THREE.MathUtils.clamp(-y / length, 0, 1);
      if (pos.getZ(i) < 0) pos.setZ(i, pos.getZ(i) * (1 + 0.5 * t));
    }
    g.computeVertexNormals();
    return g;
  };
  return { mask: build(true), wire: build(false) };
}

/** Articulação: esfera achatada ao longo do osso. */
export function joint(radius: number): PartGeometry {
  const build = (hi: boolean) => {
    const g = new THREE.SphereGeometry(radius, hi ? 16 : 7, hi ? 12 : 5);
    g.scale(1, 0.82, 1);
    return g;
  };
  return { mask: build(true), wire: build(false) };
}

/** Mão estilizada: palma achatada + polegar curto. Sem dedos nesta fase. */
export function hand(length: number, radius: number, side: 1 | -1): PartGeometry {
  const build = (hi: boolean) => {
    const palm = capsuleAlongBone(length, radius, hi, 1.25, 0.5);
    const thumb = new THREE.CapsuleGeometry(radius * 0.45, length * 0.28, hi ? 4 : 2, hi ? 10 : 6);
    thumb.rotateZ(side * 0.75);
    thumb.translate(side * radius * 1.1, -length * 0.32, radius * 0.25);
    const merged = mergeGeometries([palm, thumb]);
    merged.computeVertexNormals();
    return merged;
  };
  return { mask: build(true), wire: build(false) };
}

/** Pé: cápsula deitada, apontando para +Z após a rotação do osso. */
export function foot(length: number, radius: number): PartGeometry {
  const build = (hi: boolean) => {
    const g = capsuleAlongBone(length, radius, hi, 1.15, 0.85);
    return g;
  };
  return { mask: build(true), wire: build(false) };
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
    const p = g.attributes.position as THREE.BufferAttribute;
    const n = g.attributes.normal as THREE.BufferAttribute;
    const u = g.attributes.uv as THREE.BufferAttribute | undefined;
    pos.set(p.array as Float32Array, o * 3);
    nor.set(n.array as Float32Array, o * 3);
    if (u) uv.set(u.array as Float32Array, o * 2);
    o += p.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  out.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  out.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  parts.forEach((g, i) => g !== list[i] && g.dispose());
  return out;
}

export const PROPS = MILO.proportions;
