import { PHYSICS } from "./constants";
import { clamp, damp, lerp, noise1 } from "./physics";
import type { SquidConfig, Vec2 } from "./types";

/**
 * Um braço da lula: cadeia de segmentos onde cada ponto persegue o anterior
 * (follow-the-leader) com lag crescente da base à ponta, onda senoidal
 * perpendicular, ruído orgânico, queda suave e esticamento por velocidade.
 *
 * `long = true` marca os 2 tentáculos de caça: bem mais compridos, finos,
 * com a clava na ponta (desenhada pelo renderer).
 */
export class Tentacle {
  readonly pts: Vec2[] = [];
  /** Ângulo de ancoragem (0 = direita, π = esquerda; y+ para baixo). */
  readonly baseAngle: number;
  /** Tentáculo longo de caça (par central da lula real). */
  readonly long: boolean;
  /** 0..1 — quanto este braço está "apontando" para um alvo de hover. */
  pointAmount = 0;
  /** Alvo apontado (mantido durante a transição de saída). */
  pointTarget: Vec2 = { x: 0, y: 0 };

  private readonly phase: number;
  private readonly noiseSeed: number;
  /** Comprimento base de cada segmento (px). */
  private readonly segLen: number;

  constructor(
    index: number,
    count: number,
    private readonly cfg: SquidConfig,
    long: boolean,
  ) {
    // Leque fechado sob a cabeça: braços de lula andam juntos, em feixe.
    const t = (index + 0.5) / count;
    this.baseAngle = Math.PI * (0.22 + 0.56 * t);
    this.long = long;
    this.phase = index * 1.7;
    this.noiseSeed = index * 37.7;
    const reach = long ? PHYSICS.longReach : PHYSICS.armReach;
    this.segLen = (cfg.size * reach) / cfg.segments;

    for (let i = 0; i < cfg.segments; i++) this.pts.push({ x: 0, y: 0 });
  }

  /** Teleporta todos os segmentos (primeiro frame / resize brusco). */
  reset(x: number, y: number): void {
    for (const p of this.pts) {
      p.x = x;
      p.y = y;
    }
  }

  /**
   * @param speedNorm    velocidade do mouse normalizada 0..1
   * @param flowY        “correnteza” do scroll (px de deriva nas pontas)
   * @param curl         0..1 — enrola as pontas devagar (modo idle)
   * @param pointing     alvo de hover para este braço (ou null)
   */
  update(
    headX: number,
    headY: number,
    headVX: number,
    headVY: number,
    time: number,
    dt: number,
    speedNorm: number,
    flowY: number,
    curl: number,
    pointing: Vec2 | null,
  ): void {
    const { cfg } = this;
    const n = cfg.segments;

    // Transição suave entra/sai do estado "apontando".
    if (pointing) {
      this.pointTarget.x = pointing.x;
      this.pointTarget.y = pointing.y;
    }
    this.pointAmount = damp(this.pointAmount, pointing ? 1 : 0, PHYSICS.pointLambda, dt);

    // Âncora sob a cabeça (os braços nascem juntos, abaixo dos olhos),
    // deslocada contra o movimento (arrasto).
    const drift = clamp(headVX * 0.0004, -0.5, 0.5);
    const a = this.baseAngle + drift;
    const anchor = this.pts[0];
    anchor.x = headX + Math.cos(a) * cfg.size * 0.42 - headVX * 0.012;
    anchor.y = headY + cfg.size * 0.55 + Math.sin(a) * cfg.size * 0.22 - headVY * 0.012;

    // Mouse rápido estica os segmentos; parado, eles relaxam.
    const len = this.segLen * (1 + speedNorm * PHYSICS.stretch);
    const waveAmp = PHYSICS.waveAmp * (0.55 + speedNorm * 1.6) * (this.long ? 1.25 : 1);
    const waveT = time * PHYSICS.waveFreq + this.phase;
    const noiseT = time * PHYSICS.noiseSpeed + this.noiseSeed;

    for (let i = 1; i < n; i++) {
      const prev = this.pts[i - 1];
      const p = this.pts[i];
      const t = i / (n - 1);

      // Direção atual até o líder; mantém a distância `len` (constraint).
      let dx = p.x - prev.x;
      let dy = p.y - prev.y;
      let dist = Math.hypot(dx, dy);
      if (dist < 1e-4) {
        // Segmentos coincidentes (primeiro frame): abre na direção da âncora.
        dx = Math.cos(a);
        dy = Math.sin(a);
        dist = 1;
      }
      const k = len / dist;
      let tx = prev.x + dx * k;
      let ty = prev.y + dy * k;

      // Onda + ruído perpendiculares à direção do segmento — nunca imóvel.
      const px = -dy / dist;
      const py = dx / dist;
      const sway =
        Math.sin(waveT + i * PHYSICS.wavePhasePerSegment) * waveAmp * t +
        noise1(noiseT + i * 0.13) * PHYSICS.noiseAmp * t +
        // Idle: as pontas enrolam devagar, cada braço pro seu lado.
        curl * PHYSICS.curlAmp * t * t * Math.sin(time * 0.6 + this.phase * 3);
      tx += px * sway;
      ty += py * sway;

      // Queda natural + correnteza do scroll (mais forte nas pontas).
      ty += PHYSICS.droop * t * t * dt * 8;
      ty += flowY * t;

      // Hover: a ponta se alinha discretamente à reta âncora→alvo.
      if (this.pointAmount > 0.01) {
        const w = this.pointAmount * t * t * 0.55;
        tx = lerp(tx, lerp(anchor.x, this.pointTarget.x, t), w);
        ty = lerp(ty, lerp(anchor.y, this.pointTarget.y, t), w);
      }

      // Lag crescente: base firme, ponta preguiçosa — o "retorno lento".
      const lambda = lerp(PHYSICS.segmentLambdaBase, PHYSICS.segmentLambdaTip, t);
      p.x = damp(p.x, tx, lambda, dt);
      p.y = damp(p.y, ty, lambda, dt);
    }
  }
}
