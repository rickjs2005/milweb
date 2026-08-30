/**
 * Mola amortecida escalar (semi-implícita). Dá inércia aos movimentos
 * procedurais sem depender de biblioteca: `k` rigidez, `c` amortecimento.
 */
export class Spring {
  x: number;
  v = 0;
  constructor(
    x = 0,
    public k = 26,
    public c = 8.5,
  ) {
    this.x = x;
  }
  update(target: number, dt: number) {
    const step = Math.min(dt, 1 / 30);
    this.v += (this.k * (target - this.x) - this.c * this.v) * step;
    this.x += this.v * step;
    return this.x;
  }
  snap(x: number) {
    this.x = x;
    this.v = 0;
  }
}
