/**
 * Estado do globo por frame. É um objeto MUTÁVEL, não estado do React: a
 * timeline do Hero (scrubada) tweena estes campos e o canvas lê no rAF.
 * Todo campo é função pura do progresso do ScrollTrigger → rolar para trás
 * desfaz a cena exatamente ao contrário.
 */
export const globeFrame = {
  /** 0 = letra "O" (anel na espessura da haste) · 1 = esfera */
  morph: 0,
  /** sombreado do volume */
  depth: 0,
  /** continentes */
  land: 0,
  /** meridianos/paralelos */
  mesh: 0,
  /** marcador do Brasil */
  mark: 0,
  /** opacidade global do canvas */
  fade: 0,
  /**
   * Opacidade do glifo "O" no DOM — o outro lado da mesma troca. É um valor da
   * cena (e não um tween direto no elemento) porque só pode ser aplicado quando
   * o canvas realmente montou: sem GPU o anel nunca aparece, e apagar a letra
   * deixaria a manchete lendo "MUND." para sempre.
   */
  glyph: 1,
  /** 0 = na letra · 1 = na posição final · >1 = saída lateral */
  migrate: 0,
};

/** Ponte com o canvas (preenchida pelo <HeroGlobe/>; no-ops quando ele não montou). */
export const globe = {
  mounted: false,
  invalidate: () => {},
  /** liga/desliga frames contínuos conforme `fade` — chamado pelo ScrollTrigger do Hero */
  sync: () => {},
};

export function resetGlobeFrame() {
  globeFrame.morph = 0;
  globeFrame.depth = 0;
  globeFrame.land = 0;
  globeFrame.mesh = 0;
  globeFrame.mark = 0;
  globeFrame.fade = 0;
  globeFrame.glyph = 1;
  globeFrame.migrate = 0;
}
