/**
 * LOGISTICS DEMO — a geometria da rota. Duas composições (larga no desktop,
 * vertical no celular) que leem os MESMOS dados: três nós, três pernas, uma
 * carga. A rota é um esquema de instrumento — só horizontais, verticais e
 * 45° — e não um mapa: o projeto trabalha com marcações de origem, hub e
 * destino, nunca com cidades.
 *
 * FONTE dos nós: `eduardo/logistic/src/content/logistics.ts` (`ROTA`) —
 * coordenadas arredondadas de propósito, códigos de instrumento. O PORTO é
 * uma estação da jornada (`journey.ts`, etapa 04), sem coordenada — como lá.
 * Os recortes vistos de cima são os do projeto (`top-view/objects`),
 * reduzidos em `public/shots/logistics-demo`; todos apontam para a direita.
 */
export const NODES = {
  org: { code: "ORG-01", coord: "12°00′S 077°00′W" },
  hub: { code: "HUB-02", coord: "09°00′N 080°00′W" },
  dst: { code: "DST-03", coord: "41°00′N 074°00′W" },
} as const;

/** Acento da identidade do demo (`--ld-accent`): só na carga, no pulso e no fixo. */
export const LD_ACCENT = "#FF7A00";

export type LegMode = "ground" | "ocean" | "air";
export type NodeKey = "org" | "port" | "hub" | "dst";

/** Uma anotação em HTML posicionada na caixa da rota (x/y em unidades do viewBox, deslocamento em px). */
export type Note = { x: number; y: number; dx: number; dy: number; align: "left" | "center" | "right" };

export type Route = {
  box: { w: number; h: number };
  /** Vértices da polilinha, na ordem do percurso. */
  points: [number, number][];
  /** Índice do vértice de cada nó. */
  nodes: Record<NodeKey, number>;
  /** As pernas, cada uma entre dois vértices (podem cobrir vários segmentos). */
  legs: { mode: LegMode; from: number; to: number }[];
  /** Escala dos recortes (a caixa vertical é menor: os objetos encolhem junto). */
  unit: number;
  /** A janela de mídia (a superfície que a rota atravessa), em unidades da caixa. */
  media: { x: number; y: number; w: number; h: number };
  /** Onde cada rótulo de perna e cada legenda de nó assentam. */
  legNotes: Record<LegMode, Note>;
  nodeNotes: Record<NodeKey, Note>;
};

const legs: Route["legs"] = [
  { mode: "ground", from: 0, to: 1 },
  { mode: "ocean", from: 1, to: 3 },
  { mode: "air", from: 3, to: 5 },
];

/** DESKTOP — faixa larga 1200 × 380: origem à esquerda, destino à direita, a rota desce ao mar e sobe ao ar. */
export const ROUTE_H: Route = {
  box: { w: 1200, h: 380 },
  points: [
    [60, 100],
    [340, 100],
    [510, 270],
    [760, 270],
    [890, 140],
    [1140, 140],
  ],
  nodes: { org: 0, port: 1, hub: 3, dst: 5 },
  legs,
  unit: 1,
  media: { x: 380, y: 120, w: 420, h: 240 },
  legNotes: {
    ground: { x: 200, y: 100, dx: 0, dy: -22, align: "center" },
    ocean: { x: 635, y: 270, dx: 0, dy: 14, align: "center" },
    air: { x: 1015, y: 140, dx: 0, dy: -22, align: "center" },
  },
  nodeNotes: {
    org: { x: 60, y: 100, dx: 0, dy: 16, align: "left" },
    port: { x: 340, y: 100, dx: 0, dy: -34, align: "center" },
    hub: { x: 760, y: 270, dx: 0, dy: 16, align: "center" },
    dst: { x: 1140, y: 140, dx: 0, dy: 16, align: "right" },
  },
};

/** CELULAR — coluna 400 × 430: a rota desce; a legenda mora à direita de cada estação. */
export const ROUTE_V: Route = {
  box: { w: 400, h: 430 },
  points: [
    [80, 30],
    [80, 130],
    [190, 240],
    [190, 290],
    [300, 400],
  ],
  nodes: { org: 0, port: 1, hub: 3, dst: 4 },
  legs: [
    { mode: "ground", from: 0, to: 1 },
    { mode: "ocean", from: 1, to: 3 },
    { mode: "air", from: 3, to: 4 },
  ],
  unit: 0.72,
  media: { x: 172, y: 18, w: 216, h: 130 },
  legNotes: {
    ground: { x: 80, y: 80, dx: 14, dy: -6, align: "left" },
    ocean: { x: 135, y: 185, dx: 16, dy: -6, align: "left" },
    air: { x: 245, y: 345, dx: 16, dy: -6, align: "left" },
  },
  nodeNotes: {
    org: { x: 80, y: 30, dx: 14, dy: -6, align: "left" },
    port: { x: 80, y: 130, dx: 14, dy: -6, align: "left" },
    hub: { x: 190, y: 290, dx: 14, dy: -6, align: "left" },
    dst: { x: 300, y: 400, dx: -14, dy: -6, align: "right" },
  },
};

export type Segment = { x0: number; y0: number; x1: number; y1: number; len: number; angle: number };

/** Os segmentos entre dois vértices (com comprimento e rumo em graus, sentido horário do SVG). */
export function segments(r: Route, from: number, to: number): Segment[] {
  const out: Segment[] = [];
  for (let i = from; i < to; i++) {
    const [x0, y0] = r.points[i];
    const [x1, y1] = r.points[i + 1];
    const len = Math.hypot(x1 - x0, y1 - y0);
    if (!len) continue;
    out.push({ x0, y0, x1, y1, len, angle: (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI });
  }
  return out;
}

/** O caminho SVG de uma perna. */
export function legPath(r: Route, leg: Route["legs"][number]): string {
  return r.points
    .slice(leg.from, leg.to + 1)
    .map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`)
    .join(" ");
}

/** A rota inteira (o plano tracejado que a execução cobre). */
export function planPath(r: Route): string {
  return r.points.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
}

/** Posição de um nó. */
export function nodeAt(r: Route, key: NodeKey): [number, number] {
  return r.points[r.nodes[key]];
}

/** Rumo do último segmento que chega a um nó (para a carga pousar alinhada). */
export function headingInto(r: Route, key: NodeKey): number {
  const segs = segments(r, 0, r.nodes[key]);
  return segs.length ? segs[segs.length - 1].angle : 0;
}

/**
 * OS RECORTES — vistos de cima, fundo transparente, apontando para a direita.
 * `w`/`h` são a proporção real do arquivo; `size` é a largura na caixa 1200.
 */
export const UNITS = {
  container: { src: "/shots/logistics-demo/container.webp", w: 560, h: 203, size: 46 },
  truck: { src: "/shots/logistics-demo/truck.webp", w: 960, h: 237, size: 100 },
  ship: { src: "/shots/logistics-demo/ship.webp", w: 960, h: 169, size: 136 },
  plane: { src: "/shots/logistics-demo/plane.webp", w: 640, h: 426, size: 84 },
} as const;
export type UnitKey = keyof typeof UNITS | "truck-back";

/** Qual recorte carrega a carga em cada trecho — a mesma frota do projeto (`OBJETO_DA_ETAPA`). */
export const UNIT_OF_STAGE: UnitKey[] = ["container", "container", "truck", "container", "ship", "plane", "truck-back"];
