/**
 * A passagem: o contorno por onde a página do destino aparece, da forma que as mãos seguram até o retângulo
 * de verdade da janela. O motor desenha a pedra em volta dele (hero-shaders.ts › PASSAGE_FRAG) e a interface
 * recorta a janela com o MESMO contorno — o que se vê por baixo é a página real, já com os links e a rolagem.
 *
 * Tudo em px CSS, y para baixo. Funções puras: a cena e os testes usam as mesmas.
 */
export type Pt = { x: number; y: number };
export type Rect = { x0: number; y0: number; x1: number; y1: number };
export type Shape = { poly: Pt[] | null; circle: { x: number; y: number; r: number } | null };

const ease = (x: number) => {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
};
const lerp = (a: Pt, b: Pt, k: number): Pt => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k });

/**
 * O contorno em `q` (0 = preso às mãos … 1 = a janela): as quinas (alto-esquerda, alto-direita, baixo-direita,
 * baixo-esquerda) viajam em linha reta até os cantos da janela — a que a mão ergueu chega primeiro. `sag`: quanto a
 * borda de cima cede entre as mãos (px, para dentro); `vee`: o bico da aba (px, para fora).
 */
export function passagePoly(quad: readonly [Pt, Pt, Pt, Pt], rect: Rect, q: number, sag: number, vee: number): Pt[] {
  const k = q * 1.34;
  const tr = lerp(quad[1], { x: rect.x1, y: rect.y0 }, ease(k));
  const tl = lerp(quad[0], { x: rect.x0, y: rect.y0 }, ease(k - 0.12));
  const br = lerp(quad[2], { x: rect.x1, y: rect.y1 }, ease(k - 0.3));
  const bl = lerp(quad[3], { x: rect.x0, y: rect.y1 }, ease(k - 0.3));
  // "para dentro" da borda de cima: o lado em que ficam as quinas de baixo
  const ex = tr.x - tl.x;
  const ey = tr.y - tl.y;
  const len = Math.hypot(ex, ey) || 1;
  let nx = -ey / len;
  let ny = ex / len;
  if (nx * ((bl.x + br.x) / 2 - tl.x) + ny * ((bl.y + br.y) / 2 - tl.y) < 0) {
    nx = -nx;
    ny = -ny;
  }
  const out: Pt[] = [tl];
  const live = 1 - ease(q);
  if (Math.abs(sag) * live > 0.5 || Math.abs(vee) * live > 0.5) {
    for (let i = 1; i < 6; i++) {
      const s = i / 6;
      const off = sag * live * 4 * s * (1 - s) - vee * live * (1 - Math.abs(2 * s - 1));
      out.push({ x: tl.x + ex * s + nx * off, y: tl.y + ey * s + ny * off });
    }
  }
  out.push(tr, br, bl);
  return out;
}

/** O aro (centro e raio) que cresce até cobrir a janela inteira. */
export function passageCircle(c: Pt, r: number, rect: Rect, q: number): { x: number; y: number; r: number } {
  const e = ease(q);
  const mid = { x: (rect.x0 + rect.x1) / 2, y: (rect.y0 + rect.y1) / 2 };
  const far = Math.hypot(rect.x1 - rect.x0, rect.y1 - rect.y0) / 2 + 2;
  const p = lerp(c, mid, e);
  return { x: p.x, y: p.y, r: r + (far - r) * e * e };
}

/**
 * Como a janela (o retângulo `rect`, já no lugar definitivo) se mostra pela abertura: encolhida para caber nela,
 * com o ponto `focal` (fração da janela) no centro da abertura, e recortada pelo contorno. Devolve o `transform`
 * e o `clip-path` (em coordenadas da própria janela). Em `q` = 1 a janela está inteira e no lugar.
 */
export function domPassage(rect: Rect, shape: Shape, q: number, focal: readonly [number, number]): { transform: string; clip: string } {
  const w = rect.x1 - rect.x0;
  const h = rect.y1 - rect.y0;
  let bx0: number, by0: number, bx1: number, by1: number;
  if (shape.circle) {
    bx0 = shape.circle.x - shape.circle.r;
    bx1 = shape.circle.x + shape.circle.r;
    by0 = shape.circle.y - shape.circle.r;
    by1 = shape.circle.y + shape.circle.r;
  } else {
    const P = shape.poly ?? [];
    bx0 = Math.min(...P.map((p) => p.x));
    bx1 = Math.max(...P.map((p) => p.x));
    by0 = Math.min(...P.map((p) => p.y));
    by1 = Math.max(...P.map((p) => p.y));
  }
  const e = ease(q);
  // a página enche a abertura; perto do fim ela já está no tamanho e no lugar dela
  const fill = Math.max((bx1 - bx0) / Math.max(w, 1), (by1 - by0) / Math.max(h, 1));
  const s = Math.min(1, Math.max(0.3, fill) + (1 - Math.max(0.3, fill)) * e * e);
  const fx = focal[0] + (0.5 - focal[0]) * e;
  const fy = focal[1] + (0.5 - focal[1]) * e;
  const cx = (bx0 + bx1) / 2 + ((rect.x0 + rect.x1) / 2 - (bx0 + bx1) / 2) * e;
  const cy = (by0 + by1) / 2 + ((rect.y0 + rect.y1) / 2 - (by0 + by1) / 2) * e;
  const tx = cx - rect.x0 - s * fx * w;
  const ty = cy - rect.y0 - s * fy * h;
  const lx = (x: number) => ((x - rect.x0 - tx) / s).toFixed(1);
  const ly = (y: number) => ((y - rect.y0 - ty) / s).toFixed(1);
  const clip = shape.circle ? `circle(${(shape.circle.r / s).toFixed(1)}px at ${lx(shape.circle.x)}px ${ly(shape.circle.y)}px)` : `polygon(${(shape.poly ?? []).map((p) => `${lx(p.x)}px ${ly(p.y)}px`).join(", ")})`;
  return { transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${s.toFixed(4)})`, clip };
}
