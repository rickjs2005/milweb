/**
 * Milo no Hero sem WebGL (HTML inicial, mobile, reduced-motion, GPU
 * reprovada): SVG inline, no mesmo lugar do canvas, sem JS. Lê como o que
 * o Milo é — linhas da grid que se curvam ao redor de uma presença — e
 * nunca como imagem quebrada. Fundo transparente: a grid DOM continua atrás.
 * Escondido (fade) por `html[data-milo="on"]` depois do primeiro frame válido.
 */
export function MiloHeroFallback() {
  const cols = [0.16, 0.32, 0.48, 0.64, 0.8];
  return (
    <svg
      viewBox="0 0 400 760"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      className="milo-hero-fallback pointer-events-none absolute right-[2%] top-[40%] z-[1] h-[32%] w-auto md:right-[4%] md:top-[9%] md:h-[84%]"
    >
      {/* linhas verticais que se curvam ao redor do corpo (a grid reagindo) */}
      {cols.map((c) => {
        const x = c * 400;
        const bend = 1 - Math.min(1, Math.abs(c - 0.5) / 0.34);
        const k = 26 * bend;
        return <path key={c} d={`M${x} 0 C${x} 170 ${x - k} 200 ${x - k * 1.4} 260 C${x - k * 1.8} 330 ${x - k * 0.4} 420 ${x - k * 0.9} 520 C${x - k * 1.2} 610 ${x - k * 0.3} 690 ${x} 760`} fill="none" stroke="#DAD8D1" strokeWidth="1" />;
      })}
      {/* presença: densidade suave, sem contorno completo */}
      <g fill="none" stroke="#111111" strokeOpacity="0.32" strokeWidth="1.1">
        <path d="M212 96 l22 -8 l16 22 l-3 40 l-14 26 l-24 2 l-12 -24 l3 -40 z" />
        <path d="M172 190 l50 -12 l52 24 l26 62 l-14 116 l-6 188 l-16 12 l-4 -110 l-14 0 l-6 112 l-18 -10 l-12 -190 l-24 -118 z" strokeOpacity="0.2" />
        <path d="M168 196 l-46 34 l-16 138 l12 88" strokeOpacity="0.28" />
        <path d="M274 202 l52 30 l42 118 l-58 30" strokeOpacity="0.28" />
        <path d="M118 236 l-14 330 l20 148" strokeOpacity="0.16" />
      </g>
      <g fill="#111111" fillOpacity="0.045">
        <path d="M180 188 l90 -6 l40 60 l-10 150 l-8 200 l-100 0 l-20 -200 l-14 -140 z" />
      </g>
      <rect x="318" y="356" width="4" height="4" fill="#B7FF37" />
    </svg>
  );
}
