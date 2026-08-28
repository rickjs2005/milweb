/**
 * Mundo de física mínimo para o BREAK THE WEBSITE: corpos retangulares
 * com integração de Verlet, gravidade, atrito, paredes/chão elásticos,
 * rotação amortecida, repulsão de cursor e arrasto. Sem colisão
 * corpo-a-corpo (o efeito "queda + empilhamento" vem do chão e do
 * amortecimento) — barato o bastante para rodar em mobile.
 */
export type Body = {
  el: HTMLElement;
  x: number;
  y: number;
  px: number;
  py: number;
  a: number;
  pa: number;
  w: number;
  h: number;
  ox: number;
  oy: number;
  grabbed: boolean;
};

export type World = {
  bodies: Body[];
  w: number;
  h: number;
  gravity: number;
  pointer: { x: number; y: number; active: boolean };
  drag: Body | null;
};

export function createWorld(w: number, h: number): World {
  return { bodies: [], w, h, gravity: 1800, pointer: { x: -9999, y: -9999, active: false }, drag: null };
}

export function addBody(world: World, el: HTMLElement, x: number, y: number, w: number, h: number, kick = 1): Body {
  const b: Body = { el, x, y, px: x - (Math.random() - 0.5) * 8 * kick, py: y + Math.random() * 6 * kick, a: 0, pa: (Math.random() - 0.5) * 0.02 * kick, w, h, ox: x, oy: y, grabbed: false };
  world.bodies.push(b);
  return b;
}

export function step(world: World, dt: number) {
  const g = world.gravity;
  const { pointer } = world;
  for (const b of world.bodies) {
    if (b.grabbed) {
      b.px = b.x;
      b.py = b.y;
      b.x = pointer.x - b.w / 2;
      b.y = pointer.y - b.h / 2;
      b.pa = b.a;
      continue;
    }
    // verlet
    let vx = (b.x - b.px) * 0.995;
    let vy = (b.y - b.py) * 0.995;
    const va = (b.a - b.pa) * 0.985;
    // repulsão do cursor
    if (pointer.active) {
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      const dx = cx - pointer.x;
      const dy = cy - pointer.y;
      const d = Math.hypot(dx, dy);
      if (d < 160 && d > 0.1) {
        const f = ((160 - d) / 160) * 14;
        vx += (dx / d) * f;
        vy += (dy / d) * f;
      }
    }
    b.px = b.x;
    b.py = b.y;
    b.pa = b.a;
    b.x += vx;
    b.y += vy + g * dt * dt;
    b.a += va;
    // chão / paredes
    const floor = world.h - b.h;
    if (b.y > floor) {
      b.y = floor;
      b.py = b.y + vy * 0.35; // quica com perda
      b.px = b.x - vx * 0.9; // atrito
      b.pa = b.a - va * 0.6;
      // deita: a rotação tende ao múltiplo de π/2 mais perto
      const target = Math.round(b.a / (Math.PI / 2)) * (Math.PI / 2);
      b.a += (target - b.a) * 0.12;
    }
    if (b.x < 0) {
      b.x = 0;
      b.px = b.x - vx * 0.5;
    }
    if (b.x > world.w - b.w) {
      b.x = world.w - b.w;
      b.px = b.x - vx * 0.5;
    }
    if (b.y < -b.h * 2) b.y = -b.h * 2;
  }
}

export function render(world: World) {
  for (const b of world.bodies) {
    b.el.style.transform = `translate3d(${b.x - b.ox}px, ${b.y - b.oy}px, 0) rotate(${b.a}rad)`;
  }
}

export function settled(world: World, eps = 0.35) {
  return world.bodies.every((b) => Math.abs(b.x - b.px) < eps && Math.abs(b.y - b.py) < eps);
}

export function hit(world: World, x: number, y: number): Body | null {
  for (let i = world.bodies.length - 1; i >= 0; i--) {
    const b = world.bodies[i];
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b;
  }
  return null;
}
