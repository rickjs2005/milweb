import type { Experiment } from "./types";

/**
 * GRAVITY TYPE — as palavras têm peso, colidem e se empilham, mas nunca
 * deixam de ser texto: são <span> reais (selecionáveis, legíveis por
 * leitor de tela na ordem da frase), só com transform.
 *
 * Física própria e mínima: integração semi-implícita + resolução de
 * sobreposição AABB entre pares (n ≈ 14 → 91 testes por frame, trivial) +
 * chão/paredes com restituição. Um único rAF, que pausa quando a aba some
 * ou quando o palco sai da tela.
 */
type Body = { el: HTMLElement; x: number; y: number; vx: number; vy: number; w: number; h: number; grabbed: boolean };

export const mount: Experiment = (host, opts) => {
  const stage = document.createElement("div");
  stage.className = "absolute inset-0 overflow-hidden touch-none select-none";
  host.appendChild(stage);

  const bodies: Body[] = [];
  const WORDS = opts!.strings.words;
  WORDS.forEach((word, i) => {
    const el = document.createElement("span");
    el.textContent = word;
    el.className = "absolute left-0 top-0 t-display text-paper will-change-transform";
    el.style.fontSize = `clamp(1.4rem, ${2.4 + (i % 3) * 1.1}vw, 4.5rem)`;
    el.style.fontWeight = "900";
    el.style.cursor = "grab";
    stage.appendChild(el);
  });

  let W = 0;
  let H = 0;
  const measure = () => {
    const r = host.getBoundingClientRect();
    W = r.width;
    H = r.height;
    Array.from(stage.children).forEach((child, i) => {
      const el = child as HTMLElement;
      el.style.transform = "";
      const b = el.getBoundingClientRect();
      const w = b.width;
      const h = b.height;
      const existing = bodies[i];
      const x = existing ? Math.min(existing.x, Math.max(0, W - w)) : 20 + ((i * 137) % Math.max(1, W - w - 40));
      const y = existing ? existing.y : -h - i * 90;
      bodies[i] = { el, x, y, vx: existing?.vx ?? (i % 2 ? 24 : -18), vy: existing?.vy ?? 0, w, h, grabbed: false };
    });
  };
  measure();

  const G = 2100;
  let raf = 0;
  let last = 0;
  let running = false;
  const pointer = { x: -9999, y: -9999, down: false };
  let drag: Body | null = null;
  let dragDx = 0;
  let dragDy = 0;

  const step = (dt: number) => {
    for (const b of bodies) {
      if (b.grabbed) {
        const nx = pointer.x - dragDx;
        const ny = pointer.y - dragDy;
        b.vx = (nx - b.x) / Math.max(dt, 0.001);
        b.vy = (ny - b.y) / Math.max(dt, 0.001);
        b.x = nx;
        b.y = ny;
        continue;
      }
      b.vy += G * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      // paredes
      if (b.x < 0) {
        b.x = 0;
        b.vx = Math.abs(b.vx) * 0.4;
      }
      if (b.x + b.w > W) {
        b.x = W - b.w;
        b.vx = -Math.abs(b.vx) * 0.4;
      }
      // chão
      if (b.y + b.h > H) {
        b.y = H - b.h;
        b.vy = -b.vy * 0.28;
        b.vx *= 0.82;
        if (Math.abs(b.vy) < 26) b.vy = 0;
      }
      // repulsão do cursor (sem arrastar)
      if (!pointer.down && pointer.x > -9000) {
        const cx = b.x + b.w / 2;
        const cy = b.y + b.h / 2;
        const dx = cx - pointer.x;
        const dy = cy - pointer.y;
        const d = Math.hypot(dx, dy);
        if (d < 140 && d > 0.5) {
          const f = ((140 - d) / 140) * 900 * dt;
          b.vx += (dx / d) * f;
          b.vy += (dy / d) * f;
        }
      }
    }
    // colisão par a par (separação + troca simples de velocidade)
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const a = bodies[i];
        const b = bodies[j];
        const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        if (ox <= 0 || oy <= 0) continue;
        if (ox < oy) {
          const push = ox / 2;
          const s = a.x < b.x ? -1 : 1;
          if (!a.grabbed) a.x += push * s;
          if (!b.grabbed) b.x -= push * s;
          const t = a.vx;
          if (!a.grabbed) a.vx = b.vx * 0.5;
          if (!b.grabbed) b.vx = t * 0.5;
        } else {
          const push = oy / 2;
          const s = a.y < b.y ? -1 : 1;
          if (!a.grabbed) a.y += push * s;
          if (!b.grabbed) b.y -= push * s;
          if (!a.grabbed) a.vy *= 0.4;
          if (!b.grabbed) b.vy *= 0.4;
        }
      }
    }
    for (const b of bodies) b.el.style.transform = `translate3d(${b.x.toFixed(1)}px, ${b.y.toFixed(1)}px, 0)`;
  };

  const loop = (t: number) => {
    const dt = last ? Math.min((t - last) / 1000, 1 / 30) : 1 / 60;
    last = t;
    step(dt);
    raf = requestAnimationFrame(loop);
  };
  const start = () => {
    if (running || document.hidden) return;
    running = true;
    last = 0;
    raf = requestAnimationFrame(loop);
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(raf);
    raf = 0;
  };

  const at = (e: PointerEvent) => {
    const r = stage.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const onMove = (e: PointerEvent) => {
    const p = at(e);
    pointer.x = p.x;
    pointer.y = p.y;
  };
  const onDown = (e: PointerEvent) => {
    const p = at(e);
    pointer.x = p.x;
    pointer.y = p.y;
    pointer.down = true;
    for (let i = bodies.length - 1; i >= 0; i--) {
      const b = bodies[i];
      if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) {
        b.grabbed = true;
        drag = b;
        dragDx = p.x - b.x;
        dragDy = p.y - b.y;
        b.el.style.cursor = "grabbing";
        stage.setPointerCapture(e.pointerId);
        break;
      }
    }
  };
  const onUp = () => {
    pointer.down = false;
    if (drag) {
      drag.grabbed = false;
      drag.el.style.cursor = "grab";
      drag = null;
    }
  };
  const onLeave = () => {
    pointer.x = -9999;
    pointer.y = -9999;
  };
  stage.addEventListener("pointermove", onMove);
  stage.addEventListener("pointerdown", onDown);
  stage.addEventListener("pointerleave", onLeave);
  window.addEventListener("pointerup", onUp);

  const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0.1 });
  io.observe(host);
  const onVis = () => (document.hidden ? stop() : start());
  document.addEventListener("visibilitychange", onVis);
  const ro = new ResizeObserver(measure);
  ro.observe(host);
  start();
  opts?.onReady?.();

  return {
    destroy() {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerdown", onDown);
      stage.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerup", onUp);
      stage.remove();
    },
  };
};
