import { mulberry32 } from "./trees";

/**
 * Fantasma: manto longo e esgarçado, com a cabeça mal definida, mangas que escorrem e uma barra em tiras de
 * comprimentos diferentes. A borda é vaporosa (deslocamento por ruído), a transparência é irregular (ruído
 * multiplicado no alfa) e há dobras de tecido e um halo frio. Rosto: órbitas ocas alongadas e uma boca aberta
 * e escorrida; as pupilas pálidas são elementos HTML por cima (scene.tsx › GhostEyes), movidos em direção ao ponteiro.
 * Cada fantasma tem a sua semente: formas e opacidades diferentes.
 */
function shroud(seed: number) {
  const r = mulberry32(seed);
  const W = 140, top = 14, hem = 232;
  // contorno: cabeça em cúpula, ombros, manga esquerda comprida, barra em tiras, manga direita
  const strips = Array.from({ length: 7 }, (_, i) => {
    const x = 28 + (i / 6) * 84;
    const len = hem + (r() * 34 - 8) + (i % 2 ? 10 : -4);
    return { x, y: len, w: 9 + r() * 7 };
  });
  let d = `M${W / 2} ${top}C${W / 2 - 34} ${top} ${W / 2 - 46} ${top + 30} ${W / 2 - 48} ${top + 62}`;
  d += `C${W / 2 - 62} ${top + 84} ${W / 2 - 76} ${top + 126} ${W / 2 - 66} ${top + 170}`; // manga esquerda
  d += `C${W / 2 - 60} ${top + 186} ${W / 2 - 50} ${hem - 30} ${strips[0].x - 8} ${strips[0].y}`;
  for (let i = 0; i < strips.length; i++) {
    const s = strips[i];
    const n = strips[i + 1];
    d += `L${s.x} ${s.y}`;
    if (n) d += `Q${(s.x + n.x) / 2} ${hem - 22 - r() * 12} ${n.x} ${n.y}`;
  }
  d += `C${W / 2 + 50} ${hem - 30} ${W / 2 + 60} ${top + 186} ${W / 2 + 66} ${top + 168}`; // manga direita
  d += `C${W / 2 + 74} ${top + 126} ${W / 2 + 60} ${top + 84} ${W / 2 + 48} ${top + 62}`;
  d += `C${W / 2 + 46} ${top + 30} ${W / 2 + 34} ${top} ${W / 2} ${top}Z`;
  return d;
}
function folds(seed: number) {
  const r = mulberry32(seed + 5);
  return Array.from({ length: 6 }, (_, i) => {
    const x = 40 + i * 12 + r() * 6;
    return `M${x} ${96 + r() * 20}C${x + (r() * 8 - 4)} ${140} ${x + (r() * 12 - 6)} ${190} ${x + (r() * 14 - 7)} ${222 + r() * 14}`;
  }).join("");
}

export function Ghost({ id, seed = 3 }: { id: string; seed?: number }) {
  const g = `hw-gh-${id}`;
  const path = shroud(seed);
  return (
    <svg viewBox="0 0 140 270" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${g}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4f8ff" stopOpacity=".95" />
          <stop offset=".45" stopColor="#c8d6ff" stopOpacity=".7" />
          <stop offset="1" stopColor="#8fa2ff" stopOpacity=".08" />
        </linearGradient>
        <radialGradient id={`${g}-core`} cx=".5" cy=".18" r=".6">
          <stop offset="0" stopColor="#ffffff" stopOpacity=".95" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id={`${g}-vapor`} x="-30%" y="-12%" width="160%" height="130%">
          <feTurbulence type="fractalNoise" baseFrequency=".018 .03" numOctaves="3" seed={seed} result="edge" />
          <feDisplacementMap in="SourceGraphic" in2="edge" scale="16" xChannelSelector="R" yChannelSelector="G" result="shape" />
          <feGaussianBlur in="shape" stdDeviation="1.6" result="soft" />
          <feTurbulence type="fractalNoise" baseFrequency=".012 .022" numOctaves="3" seed={seed + 7} result="holes" />
          <feColorMatrix in="holes" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.7 -.28" result="holesA" />
          <feComposite in="soft" in2="holesA" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" />
        </filter>
        <filter id={`${g}-halo`} x="-40%" y="-20%" width="180%" height="150%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>
      <path d={path} fill="#8fb2ff" opacity=".32" filter={`url(#${g}-halo)`} />
      <g filter={`url(#${g}-vapor)`}>
        <path d={path} fill={`url(#${g}-fill)`} />
        <ellipse cx="70" cy="58" rx="40" ry="46" fill={`url(#${g}-core)`} />
      </g>
      {/* dobras do tecido */}
      <path d={folds(seed)} stroke="#6f86d8" strokeOpacity=".32" strokeWidth="2" fill="none" strokeLinecap="round" filter={`url(#${g}-vapor)`} />
      {/* rosto: órbitas ocas, pupilas pálidas e a boca aberta */}
      <g>
        <path d="M45 54C45 44 54 42 58 52C60 60 56 76 51 80C46 76 44 64 45 54Z" fill="#0f0a24" opacity=".92" />
        <path d="M95 54C95 44 86 42 82 52C80 60 84 76 89 80C94 76 96 64 95 54Z" fill="#0f0a24" opacity=".92" />
        <path d="M60 94C58 104 62 124 70 132C78 124 82 104 80 94C76 98 64 98 60 94Z" fill="#0f0a24" opacity=".85" />
      </g>
    </svg>
  );
}
