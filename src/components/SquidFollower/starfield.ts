import { BODIES, STARFIELD } from "./constants";

/**
 * Céu ambiente atrás da Lula. Vive no MESMO canvas dela (fixed inset-0,
 * z-index -1), então não custa um segundo requestAnimationFrame nem um
 * segundo elemento: é uma passada de desenho antes do mascote.
 *
 * Não conhece a Lula, e a Lula não conhece o céu — a única ponte é o
 * renderer, que desenha um antes do outro.
 */

export interface Star {
  /** Posição normalizada no campo virtual (0..1 em x, 0..1 em y). */
  nx: number;
  ny: number;
  /** Camada de profundidade (0 = mais longe). */
  layer: number;
  /** Raio em px, antes do DPR. */
  r: number;
  /** Fase e período próprios: nenhuma estrela pisca junto da outra. */
  phase: number;
  freq: number;
}

/**
 * Distribui as estrelas pelas camadas. As de trás são menores, mais
 * numerosas e quase não se movem; as da frente são maiores e acompanham
 * mais o scroll — é o que cria profundidade sem WebGL.
 */
export function createStarfield(count: number): Star[] {
  const stars: Star[] = [];
  const layers = STARFIELD.layers;
  for (let i = 0; i < count; i++) {
    // Camadas de trás recebem mais estrelas (peso decrescente).
    const layer = i % layers.length;
    const L = layers[layer];
    stars.push({
      nx: Math.random(),
      ny: Math.random(),
      layer,
      r: L.minR + Math.random() * (L.maxR - L.minR),
      phase: Math.random() * Math.PI * 2,
      freq: STARFIELD.twinkleFreqMin +
        Math.random() * (STARFIELD.twinkleFreqMax - STARFIELD.twinkleFreqMin),
    });
  }
  return stars;
}

/**
 * Desenha o campo. `scrollY` entra como deslocamento por camada e o
 * módulo mantém o céu infinito: numa página longa ele nunca "acaba".
 *
 * `rgb` é lido dos tokens do tema pelo renderer (--accent-soft no escuro,
 * --warm no claro), então a cor acompanha a paleta sozinha.
 */
export function drawStarfield(
  ctx: CanvasRenderingContext2D,
  stars: readonly Star[],
  w: number,
  h: number,
  t: number,
  scrollY: number,
  rgb: readonly number[],
  alphaScale: number,
): void {
  if (alphaScale <= 0) return;
  const layers = STARFIELD.layers;
  // Campo virtual mais alto que a viewport pra o wrap não ser perceptível.
  const fieldH = h * STARFIELD.fieldHeightFactor;
  const color = `${rgb[0]},${rgb[1]},${rgb[2]}`;

  for (const s of stars) {
    const L = layers[s.layer];
    // Módulo positivo: JS deixa % negativo, o que jogaria estrela pra fora.
    let y = (s.ny * fieldH - scrollY * L.parallax) % fieldH;
    if (y < 0) y += fieldH;
    if (y > h) continue; // fora da tela: nem chega a pintar

    const twinkle = 0.5 + 0.5 * Math.sin(t * s.freq + s.phase);
    const a = L.alpha * (STARFIELD.twinkleFloor + (1 - STARFIELD.twinkleFloor) * twinkle) * alphaScale;
    if (a < 0.012) continue; // invisível: não vale a chamada de path

    ctx.fillStyle = `rgba(${color},${a.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(s.nx * w, y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Mesmo wrap das estrelas: mantém o corpo no campo virtual infinito. */
function wrapY(ny: number, fieldH: number, scrollY: number, parallax: number): number {
  let y = (ny * fieldH - scrollY * parallax) % fieldH;
  if (y < 0) y += fieldH;
  return y;
}

/**
 * Sol e planetas, só no tema escuro. Desenhados ANTES das estrelas para
 * que elas fiquem por cima — corpo grande cobrindo estrela lê como um
 * disco recortado, e não como algo distante.
 *
 * Cada corpo é um gradiente radial que morre na borda, sem contorno duro:
 * o que precisa acontecer é presença, não desenho de planeta.
 */
export function drawBodies(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  scrollY: number,
): void {
  const fieldH = h * STARFIELD.fieldHeightFactor;
  const margin = 260; // corpo grande entra em cena antes do centro cruzar a borda

  const sun = BODIES.sun;
  const sunX = sun.nx * w;
  const sunY = wrapY(sun.ny, fieldH, scrollY, sun.parallax);

  // Sol: núcleo quente que se dissolve numa corona larga.
  if (sunY > -margin && sunY < h + margin) {
    const g = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sun.r);
    const c = `${sun.rgb[0]},${sun.rgb[1]},${sun.rgb[2]}`;
    g.addColorStop(0, `rgba(${c},${sun.alpha})`);
    g.addColorStop(0.18, `rgba(${c},${sun.alpha * 0.55})`);
    g.addColorStop(1, `rgba(${c},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sun.r, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const p of BODIES.planets) {
    const x = p.nx * w;
    const y = wrapY(p.ny, fieldH, scrollY, p.parallax);
    if (y < -margin || y > h + margin) continue;

    // O foco do gradiente é deslocado NA DIREÇÃO DO SOL: o lado iluminado
    // do planeta aponta pra fonte de luz, em vez de brilhar por igual.
    const dx = sunX - x;
    const dy = sunY - y;
    const d = Math.hypot(dx, dy) || 1;
    const lx = x + (dx / d) * p.r * 0.45;
    const ly = y + (dy / d) * p.r * 0.45;

    // O corpo se mantém quase cheio até perto da borda e só então cai: é o
    // que faz ler como DISCO. Se a queda começa no centro, vira mancha de
    // brilho, que foi o primeiro resultado aqui.
    const c = `${p.rgb[0]},${p.rgb[1]},${p.rgb[2]}`;
    const g = ctx.createRadialGradient(lx, ly, p.r * 0.05, x, y, p.r);
    g.addColorStop(0, `rgba(${c},${p.alpha})`);
    g.addColorStop(0.72, `rgba(${c},${(p.alpha * 0.78).toFixed(3)})`);
    g.addColorStop(0.93, `rgba(${c},${(p.alpha * 0.30).toFixed(3)})`);
    g.addColorStop(1, `rgba(${c},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, p.r, 0, Math.PI * 2);
    ctx.fill();

    if (p.ring > 0) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-0.42);
      ctx.scale(1, 0.26); // elipse: o anel visto quase de perfil
      ctx.beginPath();
      ctx.arc(0, 0, p.r * p.ring, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${c},${(p.alpha * 0.5).toFixed(3)})`;
      ctx.lineWidth = p.r * 0.16;
      ctx.stroke();
      ctx.restore();
    }
  }
}
