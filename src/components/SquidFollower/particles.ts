import { PHYSICS } from "./constants";
import { noise1 } from "./physics";
import type { Particle, ParticleKind, SquidConfig } from "./types";

/**
 * Pool fixo de partículas (zero alocação por frame):
 * - ambient: pontos luminosos orbitando a cabeça com deriva de ruído
 * - bubble:  bolhas que sobem quando o polvo está em idle
 * - spark:   explosão radial suave no clique
 */
export class ParticleSystem {
  readonly pool: Particle[] = [];
  private bubbleTimer = 0;

  constructor(private readonly cfg: SquidConfig) {
    const total = cfg.particleCount + PHYSICS.sparkCount + 8; // ambientes + sparks + bolhas
    for (let i = 0; i < total; i++) {
      this.pool.push({
        kind: "ambient",
        x: 0, y: 0, vx: 0, vy: 0,
        life: 0, maxLife: 1, size: 1,
        seed: i * 13.7,
        alive: false,
      });
    }
  }

  /** Explosão do clique: leque radial com arrasto. */
  burst(x: number, y: number): void {
    for (let i = 0; i < PHYSICS.sparkCount; i++) {
      const p = this.take();
      if (!p) return;
      const a = (i / PHYSICS.sparkCount) * Math.PI * 2 + Math.random() * 0.5;
      const v = 90 + Math.random() * 160;
      this.emit(p, "spark", x, y, Math.cos(a) * v, Math.sin(a) * v,
        0.5 + Math.random() * 0.35, 1.4 + Math.random() * 1.8);
    }
  }

  update(dt: number, headX: number, headY: number, idle: boolean, time: number): void {
    // Bolhas ocasionais só em idle.
    if (idle && this.cfg.idleAnimation) {
      this.bubbleTimer -= dt;
      if (this.bubbleTimer <= 0) {
        this.bubbleTimer = PHYSICS.bubbleEvery * (0.6 + Math.random() * 0.9);
        const p = this.take();
        if (p) {
          this.emit(p, "bubble",
            headX + (Math.random() - 0.5) * this.cfg.size * 1.2,
            headY - this.cfg.size * 1.9, // nasce no ápice do manto

            0, -26 - Math.random() * 22,
            1.6 + Math.random() * 0.8, 1.5 + Math.random() * 1.8);
        }
      }
    }

    // Mantém as ambientes sempre vivas ao redor da cabeça.
    let ambientAlive = 0;
    for (const p of this.pool) if (p.alive && p.kind === "ambient") ambientAlive++;
    while (ambientAlive < this.cfg.particleCount) {
      const p = this.take();
      if (!p) break;
      const a = Math.random() * Math.PI * 2;
      const r = this.cfg.size * (1.4 + Math.random() * 1.8);
      this.emit(p, "ambient",
        headX + Math.cos(a) * r, headY + Math.sin(a) * r,
        0, 0, 2.5 + Math.random() * 3, 0.8 + Math.random() * 1.4);
      ambientAlive++;
    }

    for (const p of this.pool) {
      if (!p.alive) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.alive = false;
        continue;
      }
      if (p.kind === "ambient") {
        // Deriva orgânica via ruído + leve atração para perto da cabeça.
        p.vx = noise1(p.seed + time * 0.5) * 22 + (headX - p.x) * 0.12;
        p.vy = noise1(p.seed + 50 + time * 0.5) * 22 + (headY - p.y) * 0.12;
      } else if (p.kind === "bubble") {
        p.vx = noise1(p.seed + time * 1.2) * 18; // ziguezague de bolha
      } else {
        // spark: arrasto exponencial
        const drag = Math.exp(-3.2 * dt);
        p.vx *= drag;
        p.vy *= drag;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  /** Alpha 0..1 com fade-in/out nas bordas da vida. */
  static alpha(p: Particle): number {
    const t = 1 - p.life / p.maxLife;
    return t < 0.2 ? t / 0.2 : t > 0.75 ? (1 - t) / 0.25 : 1;
  }

  private take(): Particle | null {
    for (const p of this.pool) if (!p.alive) return p;
    return null;
  }

  private emit(
    p: Particle, kind: ParticleKind,
    x: number, y: number, vx: number, vy: number,
    life: number, size: number,
  ): void {
    p.kind = kind;
    p.x = x; p.y = y; p.vx = vx; p.vy = vy;
    p.life = p.maxLife = life;
    p.size = size;
    p.alive = true;
  }
}
