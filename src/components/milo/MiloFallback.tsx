import type React from "react";

/**
 * Milo sem WebGL / reduced-motion: a mesma presença em SVG estático —
 * grid técnica com um "deslocamento" desenhado e a silhueta como ausência
 * de linhas (o corpo aparece porque a grid se dobra ao redor dele).
 * Server-safe, sem JS.
 */
export function MiloFallback({ className = "" }: { className?: string }) {
  const lines: React.ReactElement[] = [];
  for (let i = 0; i <= 24; i++) {
    const x = (i / 24) * 1200;
    lines.push(<line key={"v" + i} x1={x} y1={0} x2={x} y2={800} stroke="#DAD8D1" strokeWidth={i % 6 === 0 ? 1 : 0.5} />);
  }
  for (let i = 0; i <= 16; i++) {
    const y = (i / 16) * 800;
    lines.push(<line key={"h" + i} x1={0} y1={y} x2={1200} y2={y} stroke="#DAD8D1" strokeWidth={i % 4 === 0 ? 1 : 0.5} />);
  }
  return (
    <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" className={"absolute inset-0 h-full w-full bg-paper " + className} aria-hidden="true">
      {lines}
      {/* silhueta: bordas por fresnel + linhas da grid dobradas */}
      <g fill="none" stroke="#111111" strokeWidth="1.2" opacity="0.7">
        <path d="M842 128 l30 -8 l22 26 l-4 44 l-20 30 l-30 4 l-18 -26 l2 -44 z" />
        <path d="M812 236 l58 -12 l48 32 l14 120 l-8 190 l-20 110 l-22 8 l-6 -108 l-14 0 l-6 108 l-22 -6 l-22 -112 l-8 -190 l14 -118 z" strokeWidth="1" />
        <path d="M800 250 l-40 30 l-18 150 l14 96" strokeWidth="1" />
        <path d="M918 256 l56 24 l54 120 l-64 26" strokeWidth="1" />
        <path d="M838 236 l-6 -22 l40 -20 l48 26 l4 30" strokeWidth="1.4" />
      </g>
      <g stroke="#111111" strokeWidth="0.6" opacity="0.35">
        <path d="M700 300 q120 20 150 0" />
        <path d="M700 350 q140 26 170 0" />
        <path d="M700 400 q150 28 180 0" />
        <path d="M700 450 q150 24 180 0" />
      </g>
      <rect x="1006" y="384" width="6" height="6" fill="#B7FF37" />
      <path d="M1009 387 h120" stroke="#B7FF37" strokeWidth="1" />
    </svg>
  );
}
