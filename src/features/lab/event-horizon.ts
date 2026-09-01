/**
 * EVENT HORIZON — a singularidade do Lab, em canvas 2D.
 *
 * Não é um buraco negro de cinema: é um objeto gráfico da MilWeb. A MALHA de
 * pontos do site (a mesma retícula dos outros atos) é LENTEADA pela massa — os
 * pontos se acumulam num anel de Einstein ao redor do horizonte e somem dentro
 * dele —, algumas partículas caem para dentro,
 * o núcleo é preto sobre preto (só existe pela borda), o halo é off-white a
 * 14 %, o anel de fótons tem 1 px com um arco vivo em Signal Green, e a
 * aberração cromática é feita com dois cinzas deslocados 0,8 px (sem azul,
 * sem roxo). Tudo escala com `k` (a força do campo, 0→1, do scroll) e fecha
 * com `swallow` (o colapso final).
 *
 * Custo: ~500 pontos da malha + 26 partículas + 5 arcos por frame; nenhum WebGL — a Home tem um único
 * contexto (o globo do Hero) e este canvas só desenha enquanto a seção está na
 * tela. `getBoundingClientRect` só no resize.
 */
export type HorizonState = { k: number; swallow: number; cx: number; cy: number; t: number };

const TAU = Math.PI * 2;
const noise = (i: number, s: number) => {
  const v = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

/** A mesma curva de campo usada pela tipografia: 0 além de `r0`, 1 dentro de `r1`. */
export function falloff(d: number, r0: number, r1: number) {
  const t = Math.min(1, Math.max(0, (r0 - d) / (r0 - r1)));
  return t * t * (3 - 2 * t);
}

/**
 * Transform de uma letra sob o campo: puxada para a massa, comprimida no eixo
 * radial (aproximado por scaleX), levemente esticada, inclinada na direção da
 * massa (↘ à esquerda, ↗ à direita). Nunca gira além de `maxRot` graus nem
 * anda além de `maxPull` px — a frase continua uma frase.
 */
export function letterTransform(x: number, y: number, s: HorizonState, r0: number, r1: number, maxPull: number, maxRot = 7) {
  const dx = s.cx - x;
  const dy = s.cy - y;
  const d = Math.hypot(dx, dy) || 1;
  const ux = dx / d;
  const uy = dy / d;
  const f = falloff(d, r0, r1) * s.k;
  const pull = f * maxPull;
  // colapso: tudo vai para o centro e some
  const tx = ux * pull + dx * s.swallow;
  const ty = uy * pull + dy * s.swallow;
  const rot = ux * f * maxRot;
  const sx = (1 - 0.24 * f) * (1 - 0.85 * s.swallow);
  const sy = (1 + 0.1 * f) * (1 - 0.85 * s.swallow);
  return `translate(${tx.toFixed(2)}px,${ty.toFixed(2)}px) rotate(${rot.toFixed(2)}deg) scale(${sx.toFixed(3)},${sy.toFixed(3)})`;
}

export function createHorizon(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  let W = 0;
  let H = 0;
  // a MALHA da MilWeb (a mesma retícula de pontos dos outros atos), aqui lenteada
  // pela massa: é por ela que a distorção óptica se lê mesmo atrás das letras
  const GAP = 64;
  let grid: { x: number; y: number }[] = [];
  // e algumas partículas caindo para dentro — a vida do campo
  const N = 26;
  const dots = Array.from({ length: N }, (_, i) => ({ x: noise(i, 1), y: noise(i, 2), s: 0.8 + noise(i, 3) * 0.8, a: 0.35 + noise(i, 4) * 0.45 }));
  const signalVar = typeof getComputedStyle === "function" ? getComputedStyle(document.documentElement).getPropertyValue("--signal").trim() : "";
  const signal = /^\d+\s+\d+\s+\d+$/.test(signalVar) ? signalVar.split(/\s+/).join(",") : "240,238,232";

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    W = r.width;
    H = r.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    grid = [];
    const ox = (W % GAP) / 2;
    const oy = (H % GAP) / 2;
    for (let y = oy; y <= H; y += GAP) for (let x = ox; x <= W; x += GAP) grid.push({ x, y });
  };

  /** Raio do horizonte para um estado (também usado pela tipografia). */
  const radius = (s: HorizonState) => Math.min(W, H) * 0.075 * (0.35 + 0.65 * s.k) * (1 - s.swallow);

  const ring = (cx: number, cy: number, r: number, a0 = 0, a1 = TAU) => {
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(cx, cy, r, a0, a1);
    ctx.stroke();
  };

  const render = (s: HorizonState) => {
    if (!ctx || !W) return;
    ctx.clearRect(0, 0, W, H);
    const k = s.k;
    const rs = radius(s);
    if (k <= 0.002 || rs < 0.5) return;
    const bendK = rs * rs * 1.7;

    /* a malha lenteada: cada ponto é desenhado deslocado rumo à massa por
       rs²·k/d (a lente), sem nunca cruzar o anel — perto do horizonte a
       retícula se acumula num anel de Einstein; dentro dele, some */
    ctx.fillStyle = "#F0EEE8";
    for (const g of grid) {
      const dx = s.cx - g.x;
      const dy = s.cy - g.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < rs * 1.06) continue;
      const bend = Math.min((bendK / dist) * k, Math.max(dist - rs * 1.06, 0));
      const near = Math.min(1, (bend / (rs * 0.9)) * 1.2);
      ctx.globalAlpha = 0.22 + near * 0.5;
      ctx.beginPath();
      ctx.arc(g.x + (dx / dist) * bend, g.y + (dy / dist) * bend, 0.9 + near * 0.4, 0, TAU);
      ctx.fill();
    }

    /* as partículas: atraídas (estado) e lenteadas (desenho) */
    for (const d of dots) {
      const x = d.x * W;
      const y = d.y * H;
      const dx = s.cx - x;
      const dy = s.cy - y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < rs * 1.1) {
        // engolido: renasce longe da massa
        for (let tries = 0; tries < 3; tries++) {
          d.x = Math.random();
          d.y = Math.random();
          if (Math.hypot(s.cx - d.x * W, s.cy - d.y * H) > rs * 3) break;
        }
        continue;
      }
      const pull = (k * 1800) / Math.max(dist * dist, 400);
      d.x += ((dx / dist) * pull) / W;
      d.y += ((dy / dist) * pull) / H;
      const bend = Math.min((bendK / dist) * k, Math.max(dist - rs * 1.02, 0));
      const px = x + (dx / dist) * bend;
      const py = y + (dy / dist) * bend;
      ctx.globalAlpha = d.a * (0.45 + 0.55 * k);
      ctx.beginPath();
      ctx.arc(px, py, d.s, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    /* halo: off-white a 14 %, morre em 2,1 raios */
    const g = ctx.createRadialGradient(s.cx, s.cy, rs, s.cx, s.cy, rs * 2.1);
    g.addColorStop(0, `rgba(240,238,232,${(0.14 * k).toFixed(3)})`);
    g.addColorStop(1, "rgba(240,238,232,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(s.cx, s.cy, rs * 2.1, 0, TAU);
    ctx.fill();

    /* anel de fótons: aberração em dois cinzas deslocados, o anel, e o arco vivo */
    ctx.lineWidth = 1;
    ctx.strokeStyle = `rgba(124,124,117,${(0.32 * k).toFixed(3)})`;
    ring(s.cx - 0.8, s.cy, rs * 1.08);
    ring(s.cx + 0.8, s.cy, rs * 1.08);
    ctx.strokeStyle = `rgba(240,238,232,${(0.55 * k).toFixed(3)})`;
    ring(s.cx, s.cy, rs * 1.08);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = `rgba(${signal},${(0.32 * k).toFixed(3)})`;
    ring(s.cx, s.cy, rs * 1.08, s.t * 0.6, s.t * 0.6 + 1.9);

    /* o núcleo: preto sobre preto — só existe pela borda */
    ctx.fillStyle = "#0B0B0B";
    ctx.beginPath();
    ctx.arc(s.cx, s.cy, rs, 0, TAU);
    ctx.fill();
  };

  return {
    resize,
    render,
    radius,
    destroy: () => ctx?.clearRect(0, 0, W, H),
  };
}
