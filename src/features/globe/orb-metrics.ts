import { GLOBE_GLYPH, GLOBE_PLACE } from "./globe.config";

/** Geometria do círculo em px de CSS relativos à caixa do Hero. */
export type OrbGeom = { cx: number; cy: number; rx: number; ry: number; ok: boolean };

/**
 * Onde está o "O" da manchete, em px, medido no DOM real.
 *
 * O truque da linha de base: dentro do <span data-orb> há uma régua de largura
 * zero e altura `capEm`, alinhada a `vertical-align: baseline`. O `bottom` dela
 * é a LINHA DE BASE exata e o `top` é o topo da caixa alta — independente das
 * métricas da fonte que o navegador acabou usando (a fonte de fallback tem
 * ascent/descent diferentes, e `getBoundingClientRect` de um inline devolve a
 * caixa de conteúdo da fonte, não a caixa do glifo). Sem isso o anel do shader
 * nasce alguns px acima ou abaixo da letra e a troca texto→canvas "pisca".
 */
export function measureOrb(orb: HTMLElement | null, box: DOMRect, out: OrbGeom): OrbGeom {
  const ruler = orb?.querySelector<HTMLElement>("[data-orb-cap]");
  if (!orb || !ruler) {
    out.ok = false;
    return out;
  }
  const g = orb.getBoundingClientRect();
  const c = ruler.getBoundingClientRect();
  if (g.width < 2 || c.height < 2) {
    out.ok = false;
    return out;
  }
  const cap = c.height;
  out.cx = g.left + g.width / 2 - box.left;
  out.cy = c.bottom - cap * GLOBE_GLYPH.centerRatio - box.top;
  out.rx = (g.width / 2) * GLOBE_GLYPH.widthRatio;
  out.ry = (cap / 2) * GLOBE_GLYPH.overshoot;
  out.ok = true;
  return out;
}

/**
 * Onde o globo termina.
 *
 * Desktop: fração da caixa do Hero — a manchete ocupa ~61 % da largura e o vazio
 * da direita é estável, então dois números resolvem.
 *
 * Mobile: a posição é MEDIDA. A faixa livre fica entre a base do bloco de
 * ENTREGA (sub + CTA, que no celular é `absolute` logo abaixo da manchete) e o
 * topo do rodapé técnico — e essa faixa muda muito entre 320×568 e 430×932. Com
 * um `cy` fixo o globo passava por baixo da sub em 390×844 (texto legível, mas
 * sobre a matriz de pontos: exatamente o que a direção pediu para não acontecer).
 */
export function orbTarget(box: DOMRect, small: boolean, hero: HTMLElement | null) {
  const p = small ? GLOBE_PLACE.mobile : GLOBE_PLACE.desktop;
  if (!small) return { cx: box.width * p.cx, cy: box.height * p.cy, r: Math.min(box.width * p.rw, box.height * p.rh) };

  const pad = 16;
  const rect = (sel: string) => hero?.querySelector<HTMLElement>(sel)?.getBoundingClientRect() ?? null;
  const outro = hero?.querySelector<HTMLElement>("[data-outro]")?.parentElement?.getBoundingClientRect() ?? null;
  const ship = rect("[data-ship]");
  const h1 = rect("h1");
  const padTop = hero ? parseFloat(getComputedStyle(hero).paddingTop) || 0 : 64;

  // ABAIXO: entre a base da ENTREGA (sub + CTA) e o topo do rodapé técnico.
  const below = { a: (outro ? outro.bottom - box.top : box.height * 0.5) + pad, b: (ship ? ship.top - box.top : box.height) - pad };
  // ACIMA: entre o topo do conteúdo (onde mora o código decorativo, que a esta
  // altura já está em 12 % de opacidade) e o topo da manchete.
  const above = { a: padTop + pad, b: (h1 ? h1.top - box.top : box.height * 0.35) - pad };

  // A faixa de baixo é a leitura natural (o globo continua descendo depois da
  // frase) e é a escolhida sempre que couber. Em telas MUITO baixas — 320×568 é
  // o caso real — ENTREGA e rodapé praticamente se encostam e ali não cabe nada:
  // o globo iria para 25 vw e ainda por cima atrás do rodapé. Nessas, ele sobe
  // para a faixa do topo e mantém os ~42 vw da direção.
  const minR = box.width * 0.16;
  const band = below.b - below.a >= 2 * minR || above.b - above.a <= below.b - below.a ? below : above;
  const span = Math.max(72, band.b - band.a);
  const r = Math.min(box.width * p.rw, box.height * p.rh, span / 2);
  const cy = Math.max(band.a + r, Math.min(band.b - r, (band.a + band.b) / 2));
  return { cx: box.width * p.cx, cy, r };
}
