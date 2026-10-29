/**
 * Nuvens com volume: ruído fractal moldado por elipses suaves (o miolo escuro, roxo-ameixa), com a borda
 * superior iluminada de laranja pela lua que está atrás. Filtros estáticos — rasterizados uma vez; só o
 * contêiner anda (transform).
 */
export function CloudBand({ id, seed = 2 }: { id: string; seed?: number }) {
  const f = `hw-cf-${id}`;
  return (
    <svg viewBox="0 0 900 200" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`${f}-m`} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset=".7" stopColor="#fff" stopOpacity=".7" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <filter id={f} x="-15%" y="-60%" width="130%" height="220%">
          <feTurbulence type="fractalNoise" baseFrequency=".005 .016" numOctaves="4" seed={seed} result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 .2  0 0 0 0 .1  0 0 0 0 .3  0 0 0 1.9 -.62" result="body" />
          <feComposite in="body" in2="SourceAlpha" operator="in" result="shaped" />
          <feGaussianBlur in="shaped" stdDeviation="2.4" result="soft" />
          <feOffset in="soft" dx="0" dy="9" result="down" />
          <feComposite in="soft" in2="down" operator="out" result="rim" />
          <feColorMatrix in="rim" type="matrix" values="0 0 0 0 1  0 0 0 0 .62  0 0 0 0 .26  0 0 0 1.1 0" result="rimc" />
          <feMerge>
            <feMergeNode in="soft" />
            <feMergeNode in="rimc" />
          </feMerge>
        </filter>
      </defs>
      <g filter={`url(#${f})`}>
        <ellipse cx="150" cy="104" rx="160" ry="56" fill={`url(#${f}-m)`} />
        <ellipse cx="330" cy="86" rx="190" ry="66" fill={`url(#${f}-m)`} />
        <ellipse cx="520" cy="108" rx="200" ry="58" fill={`url(#${f}-m)`} />
        <ellipse cx="700" cy="86" rx="180" ry="64" fill={`url(#${f}-m)`} />
        <ellipse cx="830" cy="110" rx="130" ry="46" fill={`url(#${f}-m)`} />
      </g>
    </svg>
  );
}
