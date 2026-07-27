import { STARFIELD } from "./constants";

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
