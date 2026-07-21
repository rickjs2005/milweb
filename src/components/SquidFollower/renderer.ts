import { PALETTE, PHYSICS } from "./constants";
import { lerp } from "./physics";
import { ParticleSystem } from "./particles";
import type { Tentacle } from "./tentacle";
import type { HeadState, SquidConfig } from "./types";

const rgba = (c: readonly number[], a: number): string =>
  `rgba(${c[0]},${c[1]},${c[2]},${a})`;

/**
 * Renderização Canvas 2D — visual translúcido, como se a lula nadasse
 * atrás da interface. Só curvas (quadratic/bezierCurveTo), nenhuma reta.
 * Manto em torpedo com nadadeiras e respiração, cabeça baixa com olhos,
 * braços curtos em feixe + 2 tentáculos longos com clava na ponta.
 */
export class Renderer {
  /** Cores por segmento (azul → ciano, ficando mais etéreo), pré-calculadas. */
  private readonly segColor: string[] = [];
  private readonly sprite: HTMLCanvasElement;
  private w = 0;
  private h = 0;

  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly cfg: SquidConfig,
  ) {
    for (let i = 0; i < cfg.segments; i++) {
      const t = i / (cfg.segments - 1);
      const r = Math.round(lerp(PALETTE.tentacleBase[0], PALETTE.tentacleTip[0], t));
      const g = Math.round(lerp(PALETTE.tentacleBase[1], PALETTE.tentacleTip[1], t));
      const b = Math.round(lerp(PALETTE.tentacleBase[2], PALETTE.tentacleTip[2], t));
      this.segColor.push(`rgba(${r},${g},${b},${(0.55 - t * 0.28).toFixed(3)})`);
    }
    this.sprite = Renderer.makeGlowSprite();
  }

  resize(w: number, h: number, dpr: number): void {
    this.w = w;
    this.h = h;
    const canvas = this.ctx.canvas;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.w, this.h);
  }

  /**
   * Membrana translúcida só entre os braços curtos vizinhos — os dois
   * tentáculos longos de caça ficam soltos, como na lula de verdade.
   */
  drawWebbing(tentacles: Tentacle[]): void {
    const { ctx } = this;
    const arms = tentacles.filter((t) => !t.long);
    const k = Math.min(PHYSICS.webSegment, this.cfg.segments - 1);
    const mid = Math.max(1, Math.floor(k / 2));
    ctx.beginPath();
    for (let i = 0; i < arms.length - 1; i++) {
      const a = arms[i].pts;
      const b = arms[i + 1].pts;
      ctx.moveTo(a[0].x, a[0].y);
      ctx.quadraticCurveTo(a[mid].x, a[mid].y, a[k].x, a[k].y);
      // Vale da membrana: afunda entre os dois braços.
      const vx = (a[k].x + b[k].x) / 2;
      const vy = (a[k].y + b[k].y) / 2 + this.cfg.size * 0.16;
      ctx.quadraticCurveTo(vx, vy, b[k].x, b[k].y);
      ctx.quadraticCurveTo(b[mid].x, b[mid].y, b[0].x, b[0].y);
      ctx.closePath();
    }
    ctx.fillStyle = rgba(PALETTE.headMid, 0.14);
    ctx.fill();
  }

  drawTentacle(t: Tentacle): void {
    const { ctx, cfg } = this;
    const pts = t.pts;
    const n = pts.length;
    // Tentáculos de caça são bem mais finos que os braços.
    const baseW = cfg.size * (t.long ? 0.17 : 0.4);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Passe de glow: silhueta única, larga e translúcida (barata: 1 stroke).
    if (cfg.glow) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < n - 1; i++) {
        const mx = (pts[i].x + pts[i + 1].x) / 2;
        const my = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
      }
      ctx.strokeStyle = rgba(PALETTE.glow, 0.045);
      ctx.lineWidth = baseW * 2.4;
      ctx.stroke();
    }

    // Corpo: fatias curvas, largura e cor afunilando até a ponta fina.
    for (let i = 1; i < n - 1; i++) {
      const p0 = pts[i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const taper = 1 - i / (n - 1);
      // Braço afunila até quase nada; tentáculo longo mantém corpo de "cabo".
      const width = t.long
        ? Math.max(1, baseW * (0.55 + taper * 0.45))
        : Math.max(0.6, baseW * taper * taper + 0.7);

      ctx.beginPath();
      ctx.moveTo((p0.x + p1.x) / 2, (p0.y + p1.y) / 2);
      ctx.quadraticCurveTo(p1.x, p1.y, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
      ctx.strokeStyle = this.segColor[i];
      ctx.lineWidth = width;
      ctx.stroke();

      // Núcleo claro por dentro: dá volume de "carne" translúcida.
      if (width > 2.4) {
        ctx.strokeStyle = rgba(PALETTE.tentacleTip, 0.14);
        ctx.lineWidth = width * 0.38;
        ctx.stroke();
      }
    }

    // Clava na ponta do tentáculo de caça (a "raquete" da lula).
    if (t.long) {
      const tip = pts[n - 1];
      const prev = pts[n - 3] ?? pts[n - 2];
      const ang = Math.atan2(tip.y - prev.y, tip.x - prev.x);
      ctx.save();
      ctx.translate(tip.x, tip.y);
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.ellipse(cfg.size * 0.06, 0, cfg.size * 0.22, cfg.size * 0.09, 0, 0, Math.PI * 2);
      ctx.fillStyle = rgba(PALETTE.tentacleTip, 0.4);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cfg.size * 0.06, 0, cfg.size * 0.13, cfg.size * 0.05, 0, 0, Math.PI * 2);
      ctx.fillStyle = rgba(PALETTE.eyeSclera, 0.25);
      ctx.fill();
      ctx.restore();
    }
  }

  drawParticles(system: ParticleSystem): void {
    const { ctx } = this;
    for (const p of system.pool) {
      if (!p.alive) continue;
      const a = ParticleSystem.alpha(p);
      const s = p.size * (p.kind === "spark" ? 5 : 7);
      if (p.kind === "bubble") {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.2, 0, Math.PI * 2);
        ctx.strokeStyle = rgba(PALETTE.glow, 0.3 * a);
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        ctx.globalAlpha = a * (p.kind === "spark" ? 0.7 : 0.4);
        ctx.drawImage(this.sprite, p.x - s / 2, p.y - s / 2, s, s);
        ctx.globalAlpha = 1;
      }
    }
  }

  drawHead(s: HeadState): void {
    const { ctx, cfg } = this;
    const r = cfg.size;

    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.tilt);
    // Respiração do manto (jato): contrai na largura, alonga na altura.
    const sx = (1 + s.squash * 0.1) / s.breath;
    const sy = (1 - s.squash * 0.08) * s.breath;
    ctx.scale(sx, sy);

    // Pulso do clique: anel radial que expande e some.
    if (s.clickPulse < 1) {
      const pr = r * (1.4 + s.clickPulse * 1.7);
      ctx.beginPath();
      ctx.arc(0, -r * 0.6, pr, 0, Math.PI * 2);
      ctx.strokeStyle = rgba(PALETTE.glow, 0.35 * (1 - s.clickPulse));
      ctx.lineWidth = 2 + 5 * (1 - s.clickPulse);
      ctx.stroke();
    }

    const grad = ctx.createRadialGradient(-r * 0.3, -r * 1.3, r * 0.15, 0, -r * 0.7, r * 2.4);
    grad.addColorStop(0, rgba(PALETTE.headCore, 0.55));
    grad.addColorStop(0.45, rgba(PALETTE.headMid, 0.52));
    grad.addColorStop(1, rgba(PALETTE.headEdge, 0.66));

    // Nadadeiras: par de "folhas" perto do ápice, batendo com a respiração.
    const flap = 1 + (s.breath - 1) * 6; // amplifica o pulso só nas nadadeiras
    ctx.beginPath();
    ctx.moveTo(-r * 0.26, -r * 1.35);
    ctx.bezierCurveTo(-r * 0.95 * flap, -r * 1.55, -r * 0.85 * flap, -r * 2.1, -r * 0.04, -r * 2.32);
    ctx.bezierCurveTo(-r * 0.3, -r * 2.05, -r * 0.32, -r * 1.7, -r * 0.26, -r * 1.35);
    ctx.moveTo(r * 0.26, -r * 1.35);
    ctx.bezierCurveTo(r * 0.95 * flap, -r * 1.55, r * 0.85 * flap, -r * 2.1, r * 0.04, -r * 2.32);
    ctx.bezierCurveTo(r * 0.3, -r * 2.05, r * 0.32, -r * 1.7, r * 0.26, -r * 1.35);
    ctx.fillStyle = rgba(PALETTE.headMid, 0.42);
    ctx.fill();

    if (cfg.glow) {
      ctx.shadowColor = rgba(PALETTE.glow, 0.4);
      ctx.shadowBlur = r * 0.8;
    }

    // Manto em torpedo: cone alongado subindo até o ápice.
    ctx.beginPath();
    ctx.moveTo(-r * 0.58, r * 0.22);
    ctx.bezierCurveTo(-r * 0.74, -r * 0.62, -r * 0.5, -r * 1.72, 0, -r * 2.28);
    ctx.bezierCurveTo(r * 0.5, -r * 1.72, r * 0.74, -r * 0.62, r * 0.58, r * 0.22);
    ctx.bezierCurveTo(r * 0.3, r * 0.42, -r * 0.3, r * 0.42, -r * 0.58, r * 0.22);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Cabeça baixa (onde ficam os olhos), entre o manto e os braços.
    ctx.beginPath();
    ctx.ellipse(0, r * 0.42, r * 0.5, r * 0.36, 0, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Brilho interno difuso ao longo do eixo do manto (bioluminescência).
    const inner = ctx.createRadialGradient(0, -r * 0.9, 0, 0, -r * 0.9, r * 1.5);
    inner.addColorStop(0, rgba(PALETTE.glow, 0.15));
    inner.addColorStop(1, rgba(PALETTE.glow, 0));
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.85, r * 0.55, r * 1.45, 0, 0, Math.PI * 2);
    ctx.fillStyle = inner;
    ctx.fill();

    // Reflexo especular no flanco do manto.
    ctx.beginPath();
    ctx.ellipse(-r * 0.26, -r * 1.25, r * 0.11, r * 0.52, 0.14, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.09)";
    ctx.fill();

    this.drawEye(-r * 0.3, r * 0.42, r, s);
    this.drawEye(r * 0.3, r * 0.42, r, s);

    ctx.restore();
  }

  private drawEye(ex: number, ey: number, r: number, s: HeadState): void {
    const { ctx } = this;
    const open = 1 - s.blink;
    ctx.save();
    ctx.translate(ex, ey);
    ctx.scale(1, Math.max(0.06, open));

    // Esclera translúcida — lula tem olhos grandes em relação à cabeça.
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.16, r * 0.18, 0, 0, Math.PI * 2);
    ctx.fillStyle = rgba(PALETTE.eyeSclera, 0.8);
    ctx.fill();

    // Pálpebra: sombra suave na metade de cima.
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.085, r * 0.16, r * 0.095, 0, Math.PI, 0);
    ctx.fillStyle = rgba(PALETTE.headEdge, 0.28);
    ctx.fill();

    // Pupila segue o olhar.
    const px = s.lookX * r * 0.06;
    const py = s.lookY * r * 0.07;
    ctx.beginPath();
    ctx.ellipse(px, py, r * 0.08, r * 0.09, 0, 0, Math.PI * 2);
    ctx.fillStyle = rgba(PALETTE.eyePupil, 0.95);
    ctx.fill();

    // Ponto especular.
    ctx.beginPath();
    ctx.arc(px - r * 0.028, py - r * 0.033, r * 0.024, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fill();

    ctx.restore();
  }

  /** Sprite radial pré-renderizado (glow barato via drawImage). */
  private static makeGlowSprite(): HTMLCanvasElement {
    const size = 64;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, rgba(PALETTE.eyeSclera, 0.9));
    grad.addColorStop(0.3, rgba(PALETTE.glow, 0.5));
    grad.addColorStop(1, rgba(PALETTE.glow, 0));
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
    return c;
  }
}
