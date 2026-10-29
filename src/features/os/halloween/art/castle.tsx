/**
 * Castelo assombrado, em ruínas, contra a lua: pedra com fiadas e manchas de intemperismo, torres de alturas
 * diferentes (uma com o topo quebrado), contrafortes, rosácea, janelas em arco ogival com travessas e luz
 * interna, contraluz laranja nas arestas e uma encosta rochosa irregular. A variante `lit` é a MESMA geometria
 * (mesma caixa) com a pedra clara, as fiadas visíveis e as janelas acesas — é o que a lanterna revela.
 */
type Win = { cx: number; y: number; w: number; h: number; k: number };
const arch = (w: Win) => `M${w.cx - w.w} ${w.y + w.h}V${w.y + w.w * 0.9}Q${w.cx - w.w} ${w.y + w.w * 0.15} ${w.cx} ${w.y - w.w * 0.7}Q${w.cx + w.w} ${w.y + w.w * 0.15} ${w.cx + w.w} ${w.y + w.w * 0.9}V${w.y + w.h}Z`;

export const CASTLE_WINDOWS: Win[] = [
  { cx: 324, y: 158, w: 11, h: 44, k: 0 }, // belfry da torre central
  { cx: 177, y: 204, w: 7, h: 26, k: 1 },
  { cx: 177, y: 262, w: 7, h: 26, k: 2 },
  { cx: 472, y: 238, w: 8, h: 28, k: 3 },
  { cx: 472, y: 300, w: 8, h: 28, k: 1 },
  { cx: 226, y: 304, w: 8, h: 30, k: 2 },
  { cx: 252, y: 304, w: 8, h: 30, k: 0 },
  { cx: 400, y: 304, w: 8, h: 30, k: 3 },
  { cx: 426, y: 304, w: 8, h: 30, k: 1 },
  { cx: 310, y: 262, w: 8, h: 30, k: 2 },
  { cx: 338, y: 262, w: 8, h: 30, k: 0 },
  { cx: 96, y: 346, w: 6, h: 22, k: 3 },
  { cx: 558, y: 360, w: 6, h: 22, k: 2 },
];

const STRUCT: string[] = [
  // asas distantes
  "M30 412V322L50 302H160L182 322V412Z",
  "M24 324L106 262L190 324Z",
  "M496 412V332H592L612 352V412Z",
  "M490 334L546 296L620 342Z",
  // salão principal e telhado íngreme
  "M196 412V264H474V412Z",
  "M184 266L334 174L486 266Z",
  // torre esquerda
  "M146 412V180H208V412Z",
  "M138 182L177 78L216 182Z",
  "M174 78V50H180V78Z",
  // torre central (a mais alta)
  "M280 412V134H368V412Z",
  "M270 136L324 30L378 136Z",
  "M321 30V4H327V30Z",
  // torre direita, com o topo quebrado
  "M440 412V198H506V412Z",
  "M440 198L452 180L463 194L476 168L486 190L498 178L506 198Z",
  // guarita pendurada
  "M252 304V238H286V304Z",
  "M247 240L269 196L291 240Z",
  // contrafortes
  "M196 412V336L172 412Z",
  "M474 412V344L500 412Z",
];

const CLIFF = "M0 480V396L38 388L72 368L118 376L150 352L192 360L238 338L302 336L360 344L422 332L470 350L522 342L568 364L612 356L640 384V480Z";

function Structure({ fill }: { fill: string }) {
  return (
    <>
      {STRUCT.map((d, i) => (
        <path key={i} d={d} fill={fill} />
      ))}
    </>
  );
}

export function Castle({ lit = false, id = "c" }: { lit?: boolean; id?: string }) {
  const p = (s: string) => `hw-${s}-${id}`;
  const crenel = Array.from({ length: 11 }, (_, i) => 200 + i * 25);
  return (
    <svg viewBox="0 0 640 480" aria-hidden="true" focusable="false" data-lit={lit ? "1" : "0"}>
      <defs>
        <linearGradient id={p("stone")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lit ? "#806a52" : "#241533"} />
          <stop offset=".55" stopColor={lit ? "#483a2e" : "#120a1c"} />
          <stop offset="1" stopColor={lit ? "#1c1412" : "#06030a"} />
        </linearGradient>
        <linearGradient id={p("far")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lit ? "#5e4e40" : "#3a2550"} />
          <stop offset="1" stopColor={lit ? "#2a2018" : "#150c20"} />
        </linearGradient>
        <linearGradient id={p("cliff")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lit ? "#4a3a30" : "#1a0f26"} />
          <stop offset="1" stopColor="#040208" />
        </linearGradient>
        <radialGradient id={p("win")} cx=".5" cy=".6" r=".7">
          <stop offset="0" stopColor={lit ? "#fff2c8" : "#f2dcff"} />
          <stop offset=".5" stopColor={lit ? "#ffb04a" : "#b57bff"} />
          <stop offset="1" stopColor={lit ? "#c8531a" : "#5f27b8"} />
        </radialGradient>
        <pattern id={p("brick")} width="15" height="10" patternUnits="userSpaceOnUse">
          <path d="M0 10H15M7.5 0V10" stroke="#ffffff" strokeOpacity={lit ? 0.11 : 0.05} strokeWidth=".7" fill="none" />
        </pattern>
        <filter id={p("weather")} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency=".03 .05" numOctaves="3" seed="4" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1.6 -.55" />
        </filter>
        <filter id={p("rough")} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency=".045" numOctaves="3" seed="9" result="t" />
          <feDisplacementMap in="SourceGraphic" in2="t" scale="9" />
        </filter>
        <filter id={p("glow")} x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="3.4" />
        </filter>
        <clipPath id={p("clip")}>
          {STRUCT.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </clipPath>
        <linearGradient id={p("mist")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b8a0d8" stopOpacity="0" />
          <stop offset="1" stopColor="#b8a0d8" stopOpacity={lit ? 0.55 : 0.3} />
        </linearGradient>
      </defs>

      {/* encosta rochosa */}
      <path d={CLIFF} fill={`url(#${p("cliff")})`} filter={`url(#${p("rough")})`} />

      {/* asas distantes (perspectiva atmosférica: mais claras) */}
      <g opacity=".92">
        <path d={STRUCT[0]} fill={`url(#${p("far")})`} />
        <path d={STRUCT[1]} fill={`url(#${p("far")})`} />
        <path d={STRUCT[2]} fill={`url(#${p("far")})`} />
        <path d={STRUCT[3]} fill={`url(#${p("far")})`} />
      </g>

      {/* corpo principal */}
      <Structure fill={`url(#${p("stone")})`} />
      <g clipPath={`url(#${p("clip")})`}>
        <rect width="640" height="480" fill={`url(#${p("brick")})`} />
        <rect width="640" height="480" fill="#000" opacity={lit ? 0.32 : 0.5} filter={`url(#${p("weather")})`} />
      </g>

      {/* ameias do salão e da torre quebrada */}
      <g fill={lit ? "#54443a" : "#0c0614"}>
        {crenel.slice(0, 10).map((x) => (
          <rect key={x} x={x} y={256} width="12" height="9" />
        ))}
      </g>

      {/* rosácea */}
      <g>
        <circle cx="334" cy="224" r="17" fill="#0a0512" stroke="#ff9a3c" strokeOpacity={lit ? 0.6 : 0.3} strokeWidth="1.4" />
        <circle cx="334" cy="224" r="14" fill={`url(#${p("win")})`} opacity={lit ? 0.9 : 0.55} className="hw-win" data-win="rose" />
        <path d="M334 210V238M320 224H348M324 214L344 234M344 214L324 234" stroke="#0a0512" strokeWidth="1.6" />
      </g>

      {/* janelas em arco ogival */}
      {CASTLE_WINDOWS.map((w, i) => (
        <g key={i} className="hw-win" data-win={i} style={{ animationDelay: `${-w.k * 1.7}s`, animationDuration: `${3.6 + w.k * 0.9}s` }}>
          <ellipse cx={w.cx} cy={w.y + w.h * 0.5} rx={w.w + 4} ry={w.h * 0.7} fill={lit ? "#ffa13a" : "#a56bff"} opacity={lit ? 0.5 : 0.45} filter={`url(#${p("glow")})`} />
          <path d={arch(w)} fill={`url(#${p("win")})`} />
          <path d={`M${w.cx} ${w.y - w.w * 0.6}V${w.y + w.h}M${w.cx - w.w} ${w.y + w.h * 0.5}H${w.cx + w.w}`} stroke="#0a0512" strokeWidth="1.3" />
        </g>
      ))}

      {/* silhueta que aparece na janela da torre central (só na descoberta) */}
      <g className="hw-figure" opacity="0" style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}>
        <path d="M324 160c-4 0-6 3-6 7s2 6 3 8c-7 2-9 9-9 17v10h24v-10c0-8-2-15-9-17 1-2 3-4 3-8s-2-7-6-7z" fill="#05020a" />
        <path d="M333 190l9-14" stroke="#05020a" strokeWidth="2.6" strokeLinecap="round" />
      </g>

      {/* contraluz da lua nas arestas */}
      <g fill="none" stroke="#ff9a3c" strokeOpacity={lit ? 0.5 : 0.4} strokeWidth="1.2" strokeLinejoin="round">
        <path d="M138 182L177 78L216 182" />
        <path d="M270 136L324 30L378 136" />
        <path d="M184 266L334 174L486 266" />
        <path d="M440 198L452 180L463 194L476 168L486 190L498 178L506 198" />
        <path d="M247 240L269 196L291 240" />
      </g>

      {/* morcegos presos nos beirais */}
      <g fill="#05020a">
        <circle cx="177" cy="80" r="2.4" />
        <circle cx="324" cy="32" r="2.4" />
        <circle cx="476" cy="170" r="2.2" />
      </g>

      {/* névoa na base */}
      <rect x="0" y="360" width="640" height="120" fill={`url(#${p("mist")})`} />
    </svg>
  );
}

/** Posição (em % da caixa do castelo) de onde os morcegos saem: o alto da torre esquerda. */
export const CASTLE_TOWER = { x: 177 / 640, y: 84 / 480 };
