/**
 * A escultura sem WebGL (LOW / reduced-motion / contexto indisponível):
 * a mesma silhueta em SVG — laje inclinada, placa, lâmina, barras e o anel
 * — com uma animação CSS discreta no anel (desligada em reduced-motion).
 * Server-rendered: também é o que o crawler vê.
 */
export function CompilerFallback({ className = "", state = "assembled" }: { className?: string; state?: string }) {
  return (
    <svg data-compiler-fallback data-state={state} viewBox="0 0 400 400" aria-hidden="true" className={"compiler-fallback " + className} fill="none">
      <defs>
        <linearGradient id="cf-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3A3A3A" />
          <stop offset="1" stopColor="#111111" />
        </linearGradient>
        <linearGradient id="cf-metal" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#DAD8D1" />
          <stop offset="0.5" stopColor="#8A8A86" />
          <stop offset="1" stopColor="#F2F0EA" />
        </linearGradient>
      </defs>
      {/* placa metálica superior */}
      <polygon points="70,150 330,96 352,112 92,166" fill="url(#cf-metal)" />
      {/* núcleo: laje de vidro escuro */}
      <polygon points="118,140 300,110 318,246 136,276" fill="url(#cf-glass)" />
      <polygon points="118,140 300,110 306,118 124,148" fill="#5F5F5A" opacity="0.7" />
      {/* lâmina de tinta */}
      <polygon points="92,120 104,118 150,330 138,332" fill="#111111" />
      {/* barras de interface */}
      <line x1="60" y1="300" x2="340" y2="240" stroke="#B7FF37" strokeWidth="2" />
      <line x1="250" y1="70" x2="290" y2="330" stroke="#111111" strokeWidth="1.5" />
      <line x1="40" y1="200" x2="360" y2="200" stroke="#111111" strokeWidth="1" opacity="0.5" />
      {/* anel interno com dentes */}
      <g className="compiler-fallback-ring" style={{ transformOrigin: "218px 190px" }} stroke="#DAD8D1" strokeWidth="2">
        <ellipse cx="218" cy="190" rx="54" ry="22" />
        {[0, 60, 120, 180, 240, 300].map((a) => {
          const r = (a * Math.PI) / 180;
          const x = 218 + Math.cos(r) * 54;
          const y = 190 + Math.sin(r) * 22;
          return <rect key={a} x={x - 3} y={y - 5} width="6" height="10" fill="#DAD8D1" stroke="none" />;
        })}
      </g>
    </svg>
  );
}
