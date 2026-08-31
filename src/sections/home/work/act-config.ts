/**
 * SELECTED WORK — o sistema dos quatro atos.
 *
 * A seção é UM filme em quatro atos, não quatro cards. Este arquivo é o
 * contrato compartilhado: paleta, faixas de progresso e o modo do sistema de
 * pontos. Cada ato tem linguagem própria, mas todos leem estes mesmos números.
 */
export type ActSlug = "kavita-drones" | "terral" | "atelier-vertex" | "aurex-timepieces";

/**
 * FAIXAS DE PROGRESSO — uma ScrollTrigger por ato, `progress` 0→1, e todo
 * comportamento derivado dele. Nada de setTimeout, delay ou número mágico.
 *
 * O trilho de cada ato tem 200 svh com o conteúdo `sticky` dentro, e a trigger
 * cobre `top bottom` → `bottom top` (3 svh de percurso):
 *
 *   0.00–0.18  ENTRADA      o ato sobe e cobre o anterior
 *   0.18–0.36  CONSTRUÇÃO   o mundo se monta (guias, contornos, matéria)
 *   0.36–0.70  EXPERIÊNCIA  o ato está PARADO e sozinho na tela — é aqui que ele acontece
 *   0.70–0.86  PREPARAÇÃO   o mundo começa a se desfazer no motivo do próximo
 *   0.86–1.00  TRANSIÇÃO    o próximo cobre; cor, textura e pontos já são dele
 *
 * O terço do meio existir é o que separa "showreel" de "carrossel": no layout
 * anterior os painéis tinham 100 svh e o seguinte começava a subir no mesmo
 * frame em que o atual grudava — nenhum ato ficava sozinho em tela nenhuma vez.
 */
export const ACT = {
  enter: 0.18,
  build: 0.36,
  hold: 0.7,
  prepare: 0.86,
} as const;

/** Interpola dentro de uma faixa do roteiro e devolve 0→1 (com clamp). */
export const range = (p: number, a: number, b: number) => Math.min(1, Math.max(0, (p - a) / (b - a)));

/**
 * A ATMOSFERA. A progressão de cor é o fio que costura os quatro atos:
 * off-white técnico → papel quente → papel limpo/frio → grafite → preto.
 * `bleed` é a cor do PRÓXIMO ato: cada painel a revela na saída, então no frame
 * da virada os dois mundos já têm a mesma cor e não existe corte.
 */
export const SKIN: Record<ActSlug, { bg: string; ink: string; ink2: string; rule: string; dots: DotMode }> = {
  "kavita-drones": { bg: "#F2F0EA", ink: "#111111", ink2: "#5F5F5A", rule: "#111111", dots: "survey" },
  terral: { bg: "#E9E0CF", ink: "#1F1710", ink2: "#6B5B49", rule: "#1F1710", dots: "grain" },
  "atelier-vertex": { bg: "#EFEFEC", ink: "#111111", ink2: "#5F5F5A", rule: "#111111", dots: "anchor" },
  "aurex-timepieces": { bg: "#0F0F0F", ink: "#F2F0EA", ink2: "#8C8C87", rule: "#F2F0EA", dots: "pivot" },
};

export const ACT_ORDER: ActSlug[] = ["kavita-drones", "terral", "atelier-vertex", "aurex-timepieces"];

/** A cor com que cada ato termina — é a do próximo (o último cede à página). */
export const bleedOf = (slug: ActSlug): string => {
  const next = ACT_ORDER[ACT_ORDER.indexOf(slug) + 1];
  return next ? SKIN[next].bg : "rgb(var(--paper))";
};

/**
 * SISTEMA DE PONTOS — o MESMO elemento com quatro significados. Não é uma
 * decoração repetida: é a única malha do sistema MilWeb sendo relida por cada
 * mundo. Muda distribuição, raio, opacidade e se os pontos se ligam por linha.
 *
 *   survey  pontos topográficos / cotas de levantamento (retícula regular + cruzetas)
 *   grain   grãos de café (dispersão irregular, raios variados, sem ordem)
 *   anchor  anchor points de CAD (retícula precisa, quadrados, com marca de eixo)
 *   pivot   pivôs mecânicos (distribuição radial em torno de um centro)
 */
export type DotMode = "survey" | "grain" | "anchor" | "pivot";

export type Dot = { x: number; y: number; r: number; o: number; square?: boolean; tick?: boolean };

/**
 * A malha vive num viewBox 100 x 56 (a proporcao de uma viewport larga) desenhado
 * com `slice`, e NAO num quadrado esticado: com `preserveAspectRatio="none"` cada
 * ponto virava uma elipse deitada de 11 x 6 px - pesada e visivelmente errada.
 */
export const DOT_BOX = { w: 100, h: 56 } as const;

/** Ruído determinístico (mesma saída no servidor e no cliente — nada de Math.random). */
const noise = (i: number, s: number) => {
  const v = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

/** Gera a malha de um modo, ja em coordenadas de DOT_BOX. */
export function dotsOf(mode: DotMode): Dot[] {
  const { w, h } = DOT_BOX;
  const out: Dot[] = [];
  if (mode === "survey" || mode === "anchor") {
    const cols = mode === "survey" ? 11 : 13;
    const rows = mode === "survey" ? 6 : 7;
    for (let i = 0; i < cols * rows; i++) {
      out.push({
        x: ((i % cols) + 0.5) * (w / cols),
        y: (Math.floor(i / cols) + 0.5) * (h / rows),
        r: mode === "survey" ? 0.13 : 0.12,
        o: mode === "survey" ? 0.55 : 0.68,
        square: mode === "anchor",
        // cruzetas/eixos so em alguns nos: a malha respira em vez de pulsar inteira
        tick: mode === "survey" ? i % 7 === 3 : i % 5 === 0,
      });
    }
    return out;
  }
  if (mode === "grain") {
    for (let i = 0; i < 90; i++) {
      out.push({ x: noise(i, 1) * w, y: noise(i, 2) * h, r: 0.09 + noise(i, 3) * 0.22, o: 0.28 + noise(i, 4) * 0.5 });
    }
    return out;
  }
  // pivot: aneis concentricos ao redor do centro do movimento (mesmo ponto do calibre)
  for (let ring = 0; ring < 5; ring++) {
    const n = 6 + ring * 6;
    const rad = 4.6 + ring * 5.2;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + ring * 0.35;
      out.push({ x: 50 + Math.cos(a) * rad, y: 24.6 + Math.sin(a) * rad, r: 0.11, o: 0.55 - ring * 0.07 });
    }
  }
  return out;
}
