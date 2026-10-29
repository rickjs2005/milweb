import { deadTree, mulberry32 } from "./trees";

/**
 * Arte do cenário de Halloween — ilustrações vetoriais desenhadas em código (SVG), uma por camada, para
 * cada personagem poder se mover por conta própria. Nada aqui é imagem gravada com a interface: a frase, os
 * ícones, os nomes e os controles são HTML.
 *
 * Luz: lua alaranjada atrás (contraluz âmbar nas bordas), roxo frio nas sombras, abóboras e velas como
 * fontes quentes no primeiro plano. Cada SVG tem ids próprios (prefixo `hw-`), porque todos vivem inline na
 * mesma página.
 */

/* ---- céu e estrelas -------------------------------------------------------------------------------- */
export function Stars() {
  const rnd = mulberry32(7);
  const stars = Array.from({ length: 70 }, (_, i) => ({ x: rnd() * 100, y: rnd() * 62, r: 0.5 + rnd() * 1.1, o: 0.35 + rnd() * 0.6, t: i % 9 === 0 }));
  return (
    <svg className="hw-stars" viewBox="0 0 100 62" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r * 0.16} fill="#ffe9cf" opacity={s.o} className={s.t ? "hw-twinkle" : undefined} style={s.t ? { animationDelay: `${-(i % 7) * 1.3}s` } : undefined} />
      ))}
    </svg>
  );
}

/* ---- nuvens (contraluz alaranjado no topo) ---------------------------------------------------------- */
export function CloudBand({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 900 170" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`hw-cl-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5a3a5a" stopOpacity=".78" />
          <stop offset=".45" stopColor="#2a1540" stopOpacity=".72" />
          <stop offset="1" stopColor="#120a24" stopOpacity="0" />
        </linearGradient>
        <filter id={`hw-clb-${id}`} x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation="11" />
        </filter>
      </defs>
      <g filter={`url(#hw-clb-${id})`} fill={`url(#hw-cl-${id})`}>
        <ellipse cx="120" cy="96" rx="130" ry="40" />
        <ellipse cx="260" cy="78" rx="150" ry="46" />
        <ellipse cx="430" cy="92" rx="170" ry="42" />
        <ellipse cx="610" cy="74" rx="150" ry="48" />
        <ellipse cx="760" cy="96" rx="140" ry="38" />
      </g>
    </svg>
  );
}

/* ---- castelo assombrado (contraluz da lua, janelas roxas) -------------------------------------------- */
function Battlements({ x, y, w, n, fill }: { x: number; y: number; w: number; n: number; fill: string }) {
  const step = w / n;
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <rect key={i} x={x + i * step + step * 0.12} y={y - 9} width={step * 0.56} height={10} fill={fill} />
      ))}
    </>
  );
}
const WIN = [
  [253, 176, 0], [275, 176, 1], [289, 176, 2], [176, 150, 3], [346, 138, 1], [182, 196, 2], [350, 160, 0], [112, 214, 3], [412, 222, 1],
  [190, 238, 0], [214, 238, 2], [250, 232, 1], [286, 232, 3], [318, 238, 0], [348, 238, 2],
] as const;
export function Castle() {
  const ink = "#0a0512";
  return (
    <svg viewBox="0 0 520 420" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="hw-castle-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a0d26" />
          <stop offset="1" stopColor="#07030c" />
        </linearGradient>
        <radialGradient id="hw-win-g" cx=".5" cy=".5" r=".6">
          <stop offset="0" stopColor="#f4d8ff" />
          <stop offset=".5" stopColor="#b57bff" />
          <stop offset="1" stopColor="#6b2fc4" />
        </radialGradient>
        <filter id="hw-win-b" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3.2" />
        </filter>
      </defs>
      {/* encosta */}
      <path d="M0 420V338L38 326L70 304L112 312L150 288L192 296L232 274L300 272L352 284L402 272L442 300L482 294L520 322V420Z" fill="url(#hw-castle-g)" />
      <g fill="url(#hw-castle-g)" stroke="#ff9a3c" strokeOpacity=".42" strokeWidth="1.1">
        {/* muralha e salão */}
        <rect x="132" y="236" width="258" height="50" />
        <rect x="150" y="212" width="222" height="28" />
        {/* torres menores */}
        <rect x="98" y="196" width="36" height="92" />
        <path d="M94 196L116 146L138 196Z" />
        <rect x="396" y="206" width="36" height="84" />
        <path d="M392 206L414 160L436 206Z" />
        {/* torre esquerda e direita */}
        <rect x="158" y="128" width="46" height="120" />
        <path d="M152 128L181 62L210 128Z" />
        <rect x="334" y="118" width="48" height="130" />
        <path d="M328 118L358 46L388 118Z" />
        {/* torre central (a mais alta) */}
        <rect x="236" y="138" width="72" height="116" />
        <path d="M230 138L272 74L314 138Z" />
        <path d="M265 78L272 14L279 78Z" />
      </g>
      <path d="M272 14L292 22L272 30Z" fill={ink} />
      <g fill={ink}>
        <Battlements x={150} y={212} w={222} n={13} fill={ink} />
        <Battlements x={132} y={236} w={20} n={1} fill={ink} />
      </g>
      {/* janelas */}
      {WIN.map(([x, y, k], i) => (
        <g key={i} className="hw-win" style={{ animationDelay: `${-k * 1.7}s`, animationDuration: `${3.6 + k * 0.9}s` }}>
          <ellipse cx={x} cy={y} rx="6" ry="9" fill="#a56bff" opacity=".55" filter="url(#hw-win-b)" />
          <path d={`M${x - 3.2} ${y + 7}V${y - 2}Q${x - 3.2} ${y - 7} ${x} ${y - 7}Q${x + 3.2} ${y - 7} ${x + 3.2} ${y - 2}V${y + 7}Z`} fill="url(#hw-win-g)" />
        </g>
      ))}
      {/* morcegos presos na torre */}
      <g fill={ink}>
        <circle cx="181" cy="60" r="2.4" />
        <circle cx="358" cy="44" r="2.4" />
      </g>
    </svg>
  );
}

/* ---- cemitério: colina, árvores secas, lápides e grade -------------------------------------------- */
type Stone = { x: number; y: number; w: number; h: number; kind: "round" | "cross" | "slab"; tilt: number };
const STONES: Stone[] = [
  { x: 36, y: 262, w: 42, h: 66, kind: "round", tilt: -4 }, { x: 150, y: 270, w: 46, h: 60, kind: "cross", tilt: 5 },
  { x: 250, y: 280, w: 38, h: 54, kind: "slab", tilt: -3 }, { x: 330, y: 266, w: 44, h: 64, kind: "round", tilt: 3 },
  { x: 560, y: 286, w: 40, h: 56, kind: "cross", tilt: -6 }, { x: 640, y: 292, w: 44, h: 52, kind: "round", tilt: 4 },
  { x: 930, y: 288, w: 42, h: 58, kind: "slab", tilt: 5 }, { x: 1010, y: 280, w: 46, h: 64, kind: "round", tilt: -3 },
  { x: 1130, y: 268, w: 42, h: 62, kind: "cross", tilt: 4 }, { x: 1250, y: 262, w: 48, h: 70, kind: "round", tilt: -5 },
  { x: 1370, y: 272, w: 40, h: 58, kind: "slab", tilt: 3 }, { x: 1500, y: 264, w: 44, h: 66, kind: "cross", tilt: -4 },
];
function stonePath(s: Stone) {
  const { x, y, w, h } = s;
  if (s.kind === "round") return `M${x} ${y + h}V${y + w / 2}Q${x} ${y} ${x + w / 2} ${y}Q${x + w} ${y} ${x + w} ${y + w / 2}V${y + h}Z`;
  if (s.kind === "slab") return `M${x} ${y + h}V${y + 8}L${x + 8} ${y}H${x + w - 8}L${x + w} ${y + 8}V${y + h}Z`;
  const a = w * 0.3;
  return `M${x + w / 2 - a / 2} ${y + h}V${y + h * 0.42}H${x}V${y + h * 0.26}H${x + w / 2 - a / 2}V${y}H${x + w / 2 + a / 2}V${y + h * 0.26}H${x + w}V${y + h * 0.42}H${x + w / 2 + a / 2}V${y + h}Z`;
}
const TREES = [
  { seed: 11, x: 120, y: 300, h: 300, lean: 0.05 },
  { seed: 29, x: 470, y: 296, h: 210, lean: -0.1 },
  { seed: 43, x: 1090, y: 296, h: 250, lean: 0.08 },
  { seed: 57, x: 1460, y: 292, h: 320, lean: -0.04 },
];
export function Graveyard() {
  const ink = "#07040c";
  const trees = TREES.map((t) => deadTree(t.seed, t.x, t.y, t.h, t.lean));
  const pickets = (from: number, to: number) => {
    const out: number[] = [];
    for (let x = from; x <= to; x += 24) out.push(x);
    return out;
  };
  return (
    <svg viewBox="0 0 1600 380" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="hw-hill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a1640" />
          <stop offset=".55" stopColor="#0e0818" />
          <stop offset="1" stopColor="#040208" />
        </linearGradient>
        <linearGradient id="hw-stone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a2a4c" />
          <stop offset="1" stopColor="#0f0a18" />
        </linearGradient>
      </defs>
      <path d="M0 380V304C180 286 340 300 560 292C760 284 900 304 1100 294C1300 286 1460 298 1600 288V380Z" fill="url(#hw-hill)" stroke="#7a4ab8" strokeOpacity=".4" strokeWidth="2" />
      {/* árvores secas */}
      {trees.map((levels, i) => (
        <g key={i} fill="none" stroke={ink} strokeLinecap="round" strokeLinejoin="round">
          {levels.map((l, d) => (
            <path key={d} d={l.d} strokeWidth={l.w} />
          ))}
        </g>
      ))}
      {/* grade de ferro nas laterais */}
      {[[0, 430], [1120, 1600]].map(([a, b]) => (
        <g key={a} fill={ink}>
          <rect x={a} y={310} width={b - a} height={4} />
          <rect x={a} y={336} width={b - a} height={4} />
          {pickets(a, b).map((x) => (
            <g key={x}>
              <rect x={x} y={296} width={5} height={60} />
              <path d={`M${x - 2} 296L${x + 2.5} 282L${x + 7} 296Z`} />
            </g>
          ))}
        </g>
      ))}
      {/* lápides */}
      {STONES.map((s, i) => (
        <g key={i} transform={`rotate(${s.tilt} ${s.x + s.w / 2} ${s.y + s.h})`}>
          <path d={stonePath(s)} fill="url(#hw-stone)" stroke="#ff9a3c" strokeOpacity=".28" strokeWidth="1.3" />
        </g>
      ))}
      <path d="M0 380V342C260 330 520 346 800 338C1080 330 1340 346 1600 336V380Z" fill="#050309" />
    </svg>
  );
}

/* ---- bruxa na vassoura (silhueta contra a lua) ------------------------------------------------------- */
export function Witch() {
  const ink = "#050208";
  return (
    <svg viewBox="0 0 250 140" aria-hidden="true" focusable="false">
      {/* vassoura: cabo e tufo de palha */}
      <path d="M26 100L228 58" stroke={ink} strokeWidth="5" strokeLinecap="round" />
      <path d="M38 96L4 78L14 92L2 100L14 106L6 120L44 104Z" fill={ink} />
      <path d="M36 92L44 106" stroke="#2a1608" strokeWidth="3" strokeLinecap="round" />
      {/* capa ao vento */}
      <path d="M108 74C112 52 136 46 148 60C154 70 150 82 140 90L100 98C84 102 66 110 50 122C64 104 82 90 108 74Z" fill={ink} />
      <path d="M96 100C74 108 58 122 40 134C60 124 84 118 104 112Z" fill={ink} />
      {/* braço e pernas */}
      <path d="M142 70L176 70" stroke={ink} strokeWidth="6" strokeLinecap="round" />
      <path d="M118 94L134 112L128 120" stroke={ink} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M130 90L150 106L146 116" stroke={ink} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* cabeça, nariz e cabelos */}
      <circle cx="146" cy="50" r="11" fill={ink} />
      <path d="M155 50L166 56L155 58Z" fill={ink} />
      <path d="M138 54C122 56 108 66 92 62C102 70 118 68 136 62Z" fill={ink} />
      <path d="M134 44C118 44 104 52 88 46C98 58 114 58 132 54Z" fill={ink} />
      {/* chapéu pontudo com a ponta dobrada */}
      <path d="M118 46C132 38 160 38 174 48C158 45 134 46 118 46Z" fill={ink} />
      <path d="M130 44L148 8C152 22 162 34 166 46Z" fill={ink} />
      <path d="M148 8C156 0 166 4 170 12C162 10 154 12 150 18Z" fill={ink} />
    </svg>
  );
}

/* ---- morcego (asas batem sozinhas por CSS) ---------------------------------------------------------- */
export function Bat() {
  const ink = "#06030b";
  const wing = "M30 16C22 6 10 5 1 12C6 12 8 14 9 18C11 16 14 16 16 19C18 17 21 18 22 22C24 20 27 20 29 22Z";
  return (
    <svg viewBox="0 0 64 32" aria-hidden="true" focusable="false">
      <g className="hw-wing hw-wing--l" fill={ink}>
        <path d={wing} />
      </g>
      <g className="hw-wing hw-wing--r" fill={ink}>
        <path d={wing} transform="translate(64 0) scale(-1 1)" />
      </g>
      <ellipse cx="32" cy="19" rx="4.4" ry="7" fill={ink} />
      <circle cx="32" cy="11.5" r="3.7" fill={ink} />
      <path d="M29.4 9L28.6 3.6L31.4 8ZM34.6 9L35.4 3.6L32.6 8Z" fill={ink} />
      <circle cx="30.8" cy="11" r=".7" fill="#ff5a3a" />
      <circle cx="33.2" cy="11" r=".7" fill="#ff5a3a" />
    </svg>
  );
}

/* ---- fantasma translúcido ----------------------------------------------------------------------------- */
export function Ghost({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 120 170" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`hw-gh-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f2f6ff" stopOpacity=".92" />
          <stop offset=".6" stopColor="#c9d8ff" stopOpacity=".62" />
          <stop offset="1" stopColor="#a9b8ff" stopOpacity=".05" />
        </linearGradient>
        <filter id={`hw-ghb-${id}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      <path d="M60 8C30 8 14 32 14 64V132C14 144 22 150 28 140C34 130 40 152 48 152C56 152 56 134 62 134C68 134 68 152 76 152C84 152 90 130 96 140C102 150 108 144 108 132V64C108 32 90 8 60 8Z" fill="#9fb4ff" opacity=".5" filter={`url(#hw-ghb-${id})`} />
      <path d="M60 8C30 8 14 32 14 64V132C14 144 22 150 28 140C34 130 40 152 48 152C56 152 56 134 62 134C68 134 68 152 76 152C84 152 90 130 96 140C102 150 108 144 108 132V64C108 32 90 8 60 8Z" fill={`url(#hw-gh-${id})`} />
      <path d="M16 84C4 84 0 98 8 104C14 108 20 100 18 92Z" fill={`url(#hw-gh-${id})`} />
      <path d="M104 84C116 84 120 98 112 104C106 108 100 100 102 92Z" fill={`url(#hw-gh-${id})`} />
      <ellipse cx="44" cy="62" rx="8" ry="11" fill="#1a1230" opacity=".88" />
      <ellipse cx="76" cy="62" rx="8" ry="11" fill="#1a1230" opacity=".88" />
      <ellipse cx="60" cy="92" rx="7" ry="11" fill="#1a1230" opacity=".82" />
    </svg>
  );
}

/* ---- vampiro (capa balança, olhos pulsam) ------------------------------------------------------------- */
export function Vampire() {
  return (
    <svg viewBox="0 0 260 470" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="hw-v-cape" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2a1a38" />
          <stop offset=".4" stopColor="#120a1c" />
          <stop offset="1" stopColor="#07030c" />
        </linearGradient>
        <linearGradient id="hw-v-lining" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b01c34" />
          <stop offset="1" stopColor="#3a0612" />
        </linearGradient>
        <radialGradient id="hw-v-skin" cx=".4" cy=".35" r=".8">
          <stop offset="0" stopColor="#f4e8e2" />
          <stop offset=".7" stopColor="#c9b4b0" />
          <stop offset="1" stopColor="#8a7480" />
        </radialGradient>
        <filter id="hw-v-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      <g className="hw-cape">
        <path d="M130 74C80 80 36 132 20 232C10 312 6 392 0 470H260C254 392 250 312 240 232C224 132 180 80 130 74Z" fill="url(#hw-v-cape)" stroke="#ff9a3c" strokeOpacity=".4" strokeWidth="1.5" />
        <path d="M130 108C102 150 80 250 72 470H132Z" fill="url(#hw-v-lining)" />
        <path d="M130 108C158 150 180 250 188 470H128Z" fill="url(#hw-v-lining)" opacity=".9" />
      </g>
      {/* casaco e camisa */}
      <path d="M94 124L166 124L178 308L172 470H88L82 308Z" fill="#0c0713" />
      <path d="M116 124L144 124L130 236Z" fill="#e9e2e4" />
      <circle cx="130" cy="150" r="5" fill="#c4122b" />
      <circle cx="130" cy="150" r="2" fill="#ff7a8a" />
      {/* gola alta */}
      <path d="M96 128L82 54L120 98Z" fill="#1c0e28" stroke="#b01c34" strokeWidth="2" strokeLinejoin="round" />
      <path d="M164 128L178 54L140 98Z" fill="#1c0e28" stroke="#b01c34" strokeWidth="2" strokeLinejoin="round" />
      {/* cabeça */}
      <ellipse cx="130" cy="88" rx="27" ry="34" fill="url(#hw-v-skin)" />
      <path d="M103 80C103 46 157 46 157 80C149 68 141 64 130 72C119 64 111 68 103 80Z" fill="#07030c" />
      <path d="M103 84L97 94L106 92ZM157 84L163 94L154 92Z" fill="#c9b4b0" />
      <path d="M113 80L125 84M147 80L135 84" stroke="#07030c" strokeWidth="2.6" strokeLinecap="round" />
      <g className="hw-eyes">
        <ellipse cx="119" cy="88" rx="5.2" ry="3.4" fill="#ff2a3a" filter="url(#hw-v-glow)" />
        <ellipse cx="141" cy="88" rx="5.2" ry="3.4" fill="#ff2a3a" filter="url(#hw-v-glow)" />
        <ellipse cx="119" cy="88" rx="3.4" ry="2.2" fill="#ff8a8a" />
        <ellipse cx="141" cy="88" rx="3.4" ry="2.2" fill="#ff8a8a" />
      </g>
      <path d="M130 90L127 100L133 100" stroke="#8a7480" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d="M118 108Q130 114 142 108" stroke="#5a1a28" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M124 110L126 118L128 110ZM132 110L134 118L136 110Z" fill="#fff" />
      {/* mãos pálidas segurando a capa */}
      <g fill="#d8c8c4">
        <path d="M76 304L66 322L72 334L84 324L94 310Z" />
        <path d="M184 304L194 322L188 334L176 324L166 310Z" />
      </g>
    </svg>
  );
}

/* ---- zumbi saindo da terra: mão, corpo e montículo são camadas separadas (mesma caixa 280 × 320) ----------- */
const Z_DEFS = (
  <defs>
    <radialGradient id="hw-z-skin" cx=".42" cy=".35" r=".8">
      <stop offset="0" stopColor="#b4cf84" />
      <stop offset=".65" stopColor="#7e9a58" />
      <stop offset="1" stopColor="#445c32" />
    </radialGradient>
    <linearGradient id="hw-z-soil" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#2a1a12" />
      <stop offset="1" stopColor="#0b0604" />
    </linearGradient>
    <filter id="hw-z-glow" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="2.6" />
    </filter>
  </defs>
);
export function ZombieHand() {
  return (
    <svg viewBox="0 0 280 320" aria-hidden="true" focusable="false">
      <path d="M192 310L202 160L210 98L222 100L216 164L230 310Z" fill="url(#hw-z-skin)" stroke="#33441f" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M206 100L196 70L202 68L212 96M214 98L212 62L219 62L220 98M222 100L228 66L234 68L228 104M226 106L246 84L250 90L230 112" fill="url(#hw-z-skin)" stroke="#33441f" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M196 226L184 238L230 244L228 228Z" fill="#4a5640" />
    </svg>
  );
}
export function ZombieBody() {
  return (
    <svg viewBox="0 0 280 320" aria-hidden="true" focusable="false">
      {Z_DEFS}
      <path d="M52 320L62 236C66 208 96 192 124 192C152 192 182 208 186 236L196 320Z" fill="#4c5a40" />
      <path d="M70 250L82 272L92 248L104 276L116 250M138 252L150 280L162 252L172 272" stroke="#2a3326" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M88 196L124 214L160 196L150 232L98 232Z" fill="#6f8a52" />
      <ellipse cx="124" cy="134" rx="46" ry="54" fill="url(#hw-z-skin)" stroke="#33441f" strokeWidth="1.6" />
      <path d="M80 116C78 82 108 72 130 80C150 72 172 86 168 116C158 104 146 100 134 106C122 98 96 98 80 116Z" fill="#2a2a30" />
      <path d="M88 96L84 78M152 90L158 72M120 80L122 64" stroke="#2a2a30" strokeWidth="3" strokeLinecap="round" />
      <path d="M96 150C100 156 108 158 116 154" stroke="#33441f" strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="106" cy="132" rx="11" ry="13" fill="#10150a" />
      <ellipse cx="144" cy="132" rx="11" ry="13" fill="#10150a" />
      <g className="hw-zeyes">
        <circle cx="106" cy="134" r="5" fill="#ffe14a" filter="url(#hw-z-glow)" />
        <circle cx="144" cy="134" r="5" fill="#ffe14a" filter="url(#hw-z-glow)" />
        <circle cx="106" cy="134" r="2.6" fill="#fff7b0" />
        <circle cx="144" cy="134" r="2.6" fill="#fff7b0" />
      </g>
      <path d="M124 140L119 154L129 154Z" fill="#33441f" opacity=".6" />
      <path d="M100 168C112 182 138 182 150 168C146 188 104 188 100 168Z" fill="#1a0c0c" />
      <path d="M106 170L109 177L112 171L116 178L120 172L124 179L128 172L132 178L136 171L140 177L143 170" stroke="#e8e0c0" strokeWidth="2.4" fill="none" strokeLinejoin="round" />
    </svg>
  );
}
export function Mound() {
  return (
    <svg viewBox="0 0 280 320" aria-hidden="true" focusable="false">
      <path d="M0 320V292C30 280 52 266 86 270C106 272 120 284 150 280C184 276 212 266 244 276C262 282 272 290 280 296V320Z" fill="url(#hw-z-soil)" />
      <g fill="#1d120c">
        <ellipse cx="60" cy="276" rx="14" ry="6" />
        <ellipse cx="222" cy="278" rx="16" ry="6" />
        <ellipse cx="132" cy="288" rx="12" ry="5" />
      </g>
      <path d="M30 276L26 262L36 274M236 274L242 258L246 274" stroke="#1d3a14" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/* ---- aranha, teias e velas ---------------------------------------------------------------------------- */
export function Spider() {
  return (
    <svg viewBox="0 0 40 44" aria-hidden="true" focusable="false">
      <g stroke="#08040c" strokeWidth="1.6" fill="none" strokeLinecap="round">
        <path d="M15 22C7 16 4 10 2 4M14 26C5 24 2 19 1 14M14 30C5 33 3 38 3 43M17 33C10 38 10 41 9 44" />
        <path d="M25 22C33 16 36 10 38 4M26 26C35 24 38 19 39 14M26 30C35 33 37 38 37 43M23 33C30 38 30 41 31 44" />
      </g>
      <ellipse cx="20" cy="28" rx="7" ry="9" fill="#08040c" />
      <circle cx="20" cy="17" r="4.6" fill="#08040c" />
      <circle cx="18.2" cy="16.4" r=".9" fill="#ff4a3a" />
      <circle cx="21.8" cy="16.4" r=".9" fill="#ff4a3a" />
      <path d="M20 22L20 34" stroke="#3a1a2a" strokeWidth="1.2" />
    </svg>
  );
}

export function Web() {
  const R = [40, 78, 116, 154, 190];
  const A = [0, 15, 30, 45, 60, 75, 90].map((d) => (d * Math.PI) / 180);
  const pt = (r: number, a: number) => [r * Math.cos(a), r * Math.sin(a)] as const;
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true" focusable="false">
      <g stroke="#e8e2ff" strokeOpacity=".42" fill="none" strokeLinecap="round">
        {A.map((a, i) => {
          const [x, y] = pt(196, a);
          return <path key={i} d={`M0 0L${x.toFixed(1)} ${y.toFixed(1)}`} strokeWidth=".8" />;
        })}
        {R.map((r) =>
          A.slice(0, -1).map((a, i) => {
            const [x1, y1] = pt(r, a);
            const [x2, y2] = pt(r, A[i + 1]);
            const mx = ((x1 + x2) / 2) * 0.86;
            const my = ((y1 + y2) / 2) * 0.86;
            return <path key={`${r}-${i}`} d={`M${x1.toFixed(1)} ${y1.toFixed(1)}Q${mx.toFixed(1)} ${my.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`} strokeWidth={r > 150 ? 0.7 : 0.9} />;
          }),
        )}
      </g>
    </svg>
  );
}

export function Candle({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 44 100" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`hw-wax-${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="#b9a47c" />
          <stop offset=".45" stopColor="#f6e9cc" />
          <stop offset="1" stopColor="#a8926a" />
        </linearGradient>
        <radialGradient id={`hw-fl-${id}`} cx=".5" cy=".7" r=".6">
          <stop offset="0" stopColor="#fff6c8" />
          <stop offset=".45" stopColor="#ffc844" />
          <stop offset="1" stopColor="#ff6a10" />
        </radialGradient>
        <radialGradient id={`hw-gl-${id}`}>
          <stop offset="0" stopColor="#ffb040" stopOpacity=".65" />
          <stop offset="1" stopColor="#ff7a10" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle className="hw-candle-glow" cx="22" cy="24" r="22" fill={`url(#hw-gl-${id})`} />
      <rect x="11" y="38" width="22" height="58" rx="3" fill={`url(#hw-wax-${id})`} />
      <path d="M11 42Q22 48 33 42V44Q30 54 28 44Q24 52 22 44Q20 58 17 44Q14 50 11 44Z" fill="#fff3d8" opacity=".85" />
      <path d="M22 38V30" stroke="#2a1608" strokeWidth="1.6" strokeLinecap="round" />
      <g className="hw-flame">
        <path d="M22 8C28 17 30 25 22 31C14 25 16 17 22 8Z" fill={`url(#hw-fl-${id})`} />
        <path d="M22 17C25 21 25 26 22 29C19 26 19 21 22 17Z" fill="#fffbe6" opacity=".9" />
      </g>
    </svg>
  );
}
