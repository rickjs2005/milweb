import { PHYSICS, HOVER_SELECTOR } from "./constants";
import { clamp, damp } from "./physics";

/**
 * Rastreia o ponteiro: posição, velocidade suavizada, tempo parado (idle),
 * elemento interativo sob o cursor, cliques e "correnteza" do scroll.
 * Não conhece o polvo — só entrega números por frame via `update(dt)`.
 */
export class PointerTracker {
  /** Posição bruta do cursor (última vista). */
  x: number;
  y: number;
  /** Velocidade suavizada (px/s) e módulo. */
  vx = 0;
  vy = 0;
  speed = 0;
  /** speed normalizada 0..1 contra PHYSICS.maxPointerSpeed. */
  speedNorm = 0;
  /** Segundos desde o último movimento relevante. */
  idleTime = 0;
  /** Já vimos algum evento de mouse? (evita o polvo nascer correndo). */
  seen = false;
  /** Elemento interativo sob o cursor (ou null). */
  hoverEl: Element | null = null;
  /** Velocidade vertical do scroll suavizada (px/s). */
  scrollVel = 0;

  /** Callback disparado em pointerdown (posição do clique). */
  onClick: ((x: number, y: number) => void) | null = null;

  private lastX: number;
  private lastY: number;
  private lastScrollY: number;
  private rawScrollDelta = 0;
  private readonly interactive: boolean;
  private readonly listeners: Array<() => void> = [];

  constructor(interactive: boolean) {
    this.interactive = interactive;
    this.x = this.lastX = window.innerWidth / 2;
    this.y = this.lastY = window.innerHeight / 2;
    this.lastScrollY = window.scrollY;

    this.bind(window, "pointermove", (e) => {
      const p = e as PointerEvent;
      if (p.pointerType && p.pointerType !== "mouse") return;
      if (!this.seen) {
        // Primeiro evento: teleporta a referência pra não gerar pico de velocidade.
        this.lastX = p.clientX;
        this.lastY = p.clientY;
        this.seen = true;
      }
      this.x = p.clientX;
      this.y = p.clientY;
    });

    this.bind(window, "pointerdown", (e) => {
      const p = e as PointerEvent;
      if (p.pointerType && p.pointerType !== "mouse") return;
      this.onClick?.(p.clientX, p.clientY);
    });

    if (interactive) {
      this.bind(window, "pointerover", (e) => {
        const t = e.target;
        this.hoverEl = t instanceof Element ? t.closest(HOVER_SELECTOR) : null;
      });
    }

    this.bind(window, "scroll", () => {
      this.rawScrollDelta += window.scrollY - this.lastScrollY;
      this.lastScrollY = window.scrollY;
    }, { passive: true });
  }

  /** Retângulo central do elemento em hover (recalculado sob demanda). */
  hoverCenter(): { x: number; y: number } | null {
    if (!this.hoverEl || !this.hoverEl.isConnected) return null;
    const r = this.hoverEl.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  update(dt: number): void {
    // Velocidade instantânea → suavizada (evita jitter do mousemove).
    const ivx = (this.x - this.lastX) / dt;
    const ivy = (this.y - this.lastY) / dt;
    this.lastX = this.x;
    this.lastY = this.y;
    this.vx = damp(this.vx, ivx, PHYSICS.velSmoothing, dt);
    this.vy = damp(this.vy, ivy, PHYSICS.velSmoothing, dt);
    this.speed = Math.hypot(this.vx, this.vy);
    this.speedNorm = clamp(this.speed / PHYSICS.maxPointerSpeed, 0, 1);

    this.idleTime = this.speed > 30 ? 0 : this.idleTime + dt;

    // Scroll acumulado no frame vira velocidade suavizada (decai sozinha).
    this.scrollVel = damp(this.scrollVel, this.rawScrollDelta / dt, 8, dt);
    this.rawScrollDelta = 0;
  }

  dispose(): void {
    for (const off of this.listeners) off();
    this.listeners.length = 0;
    this.onClick = null;
    this.hoverEl = null;
  }

  private bind(
    target: Window,
    type: string,
    handler: (e: Event) => void,
    options?: AddEventListenerOptions,
  ): void {
    target.addEventListener(type, handler, options);
    this.listeners.push(() => target.removeEventListener(type, handler, options));
  }
}
