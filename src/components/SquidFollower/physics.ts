/**
 * Física implementada à mão: lerp, damping exponencial (independente de
 * frame-rate), mola 2D semi-implícita e value-noise 1D determinístico.
 * Nenhuma biblioteca externa.
 */

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const clamp = (v: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, v));

/**
 * Interpolação exponencial estável em qualquer frame-rate:
 * quanto maior `lambda`, mais rápido `a` converge para `b`.
 */
export const damp = (a: number, b: number, lambda: number, dt: number): number =>
  lerp(a, b, 1 - Math.exp(-lambda * dt));

/**
 * Mola 2D (Euler semi-implícito): cursor → força → velocidade → atrito → posição.
 * O atrito exponencial mantém a integração estável mesmo com dt irregular.
 */
export class Spring2D {
  x: number;
  y: number;
  vx = 0;
  vy = 0;

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  update(tx: number, ty: number, stiffness: number, damping: number, dt: number): void {
    this.vx += (tx - this.x) * stiffness * dt;
    this.vy += (ty - this.y) * stiffness * dt;
    const friction = Math.exp(-damping * dt);
    this.vx *= friction;
    this.vy *= friction;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  /** Empurrão instantâneo (clique): soma direto na velocidade. */
  impulse(ix: number, iy: number): void {
    this.vx += ix;
    this.vy += iy;
  }
}

/* ------------------------------------------------------------------ */
/* Value-noise 1D determinístico (permutação embaralhada via LCG).     */
/* ------------------------------------------------------------------ */

const PERM: Uint8Array = (() => {
  const base = Array.from({ length: 256 }, (_, i) => i);
  let seed = 1337;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [base[i], base[j]] = [base[j], base[i]];
  }
  const p = new Uint8Array(512);
  for (let i = 0; i < 512; i++) p[i] = base[i & 255];
  return p;
})();

const fade = (t: number): number => t * t * (3 - 2 * t);

/** Ruído 1D suave e contínuo, retorno em [-1, 1]. */
export function noise1(x: number): number {
  const xf = Math.floor(x);
  const i = xf & 255;
  const f = x - xf;
  const a = PERM[i] / 127.5 - 1;
  const b = PERM[i + 1] / 127.5 - 1;
  return lerp(a, b, fade(f));
}
