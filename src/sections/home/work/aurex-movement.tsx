/**
 * AUREX — o movimento desmontado.
 *
 * Esquema vetorial do calibre AX-01: caixa, aro, mostrador, ponte, trem de
 * engrenagens (3), gaiola do tourbillon, rotor e eixo. Tudo procedural e
 * determinístico (nada de Math.random: o servidor e o cliente têm que gerar o
 * mesmo path), desenhado uma vez e só transformado depois.
 *
 * Por que SVG e não Three.js: a decomposição é uma vista explodida ORTOGONAL —
 * uma prancha técnica, não um objeto com câmera. Um `translate` por peça e uma
 * rotação por engrenagem resolvem tudo, ficam compostos na GPU e custam zero
 * download. Uma cena 3D aqui seria peso sem ganho de leitura.
 *
 * Cada peça carrega `data-part` com o seu vetor de explosão em unidades do
 * viewBox e a razão de giro; a timeline só multiplica pelo progresso, então o
 * trem inteiro é função pura do scroll e reverte exatamente ao voltar.
 */

/** Roda dentada: `teeth` dentes trapezoidais em torno de `r`. */
function gear(r: number, teeth: number, depth: number): string {
  const f = (v: number) => v.toFixed(2);
  let d = "";
  for (let i = 0; i < teeth; i++) {
    const a0 = (i / teeth) * Math.PI * 2;
    const step = (Math.PI * 2) / teeth;
    const p = [
      [a0 + step * 0.06, r],
      [a0 + step * 0.16, r + depth],
      [a0 + step * 0.34, r + depth],
      [a0 + step * 0.44, r],
      [a0 + step * 0.94, r],
    ];
    p.forEach(([a, rr], k) => {
      d += (i === 0 && k === 0 ? "M" : "L") + f(Math.cos(a) * rr) + " " + f(Math.sin(a) * rr);
    });
  }
  return d + " Z";
}

/** Raios de uma roda (as travessas internas). */
function spokes(r: number, n: number, hub: number): string {
  const f = (v: number) => v.toFixed(2);
  let d = "";
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    d += `M${f(Math.cos(a) * hub)} ${f(Math.sin(a) * hub)} L${f(Math.cos(a) * r)} ${f(Math.sin(a) * r)} `;
  }
  return d;
}

/** Índices do mostrador (12 marcas fortes, 60 minutos). */
const TICKS = Array.from({ length: 60 }, (_, i) => {
  const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
  const long = i % 5 === 0;
  const r0 = long ? 84 : 92;
  const f = (v: number) => v.toFixed(2);
  return `M${f(Math.cos(a) * r0)} ${f(Math.sin(a) * r0)} L${f(Math.cos(a) * 99)} ${f(Math.sin(a) * 99)}`;
}).join(" ");

const GEAR_A = gear(40, 26, 5);
const GEAR_B = gear(27, 18, 4.5);
const GEAR_C = gear(19, 13, 4);

/**
 * `data-part` → vetor de explosão (dx, dy em unidades do viewBox) e razão de
 * giro. A ordem da lista é a ordem de montagem, da frente para trás.
 *
 * O leque é predominantemente HORIZONTAL: o palco de um ato tem a largura da
 * viewport e pouco mais de meia altura útil (a manchete ocupa o terço de baixo).
 * Com o leque vertical que veio primeiro, a caixa e o aro saíam pelo topo da
 * tela — a peça mais reconhecível do calibre desaparecia justo no frame em que
 * a decomposição termina.
 */
export const AUREX_PARTS = [
  { id: "case", dx: -142, dy: -58, spin: 0 },
  { id: "bezel", dx: -94, dy: -18, spin: 0 },
  { id: "dial", dx: -46, dy: 24, spin: 0 },
  { id: "bridge", dx: 58, dy: -48, spin: 0 },
  { id: "gearA", dx: 96, dy: 8, spin: 1 },
  { id: "gearB", dx: 134, dy: 50, spin: -2.1 },
  { id: "gearC", dx: 162, dy: -20, spin: 3.4 },
  { id: "tourbillon", dx: 10, dy: 68, spin: -1.6 },
  { id: "rotor", dx: -106, dy: 76, spin: 0.6 },
] as const;

export function AurexMovement() {
  return (
    <svg aria-hidden="true" data-movement className="pointer-events-none h-full w-full overflow-visible" viewBox="-150 -150 300 300" fill="none" stroke="currentColor" vectorEffect="non-scaling-stroke">
      {/* eixo do calibre: a linha que prova que a explosão tem uma direção */}
      <line data-axis x1="0" y1="-132" x2="0" y2="132" strokeWidth="0.5" opacity="0" strokeDasharray="3 5" />

      <g data-part="rotor" opacity="0.85">
        <path d="M-104 0 A104 104 0 0 1 104 0 L74 0 A74 74 0 0 0 -74 0 Z" strokeWidth="0.9" />
        <circle r="9" strokeWidth="0.9" />
        <path d={spokes(70, 3, 12)} strokeWidth="0.7" opacity="0.7" />
      </g>

      <g data-part="gearC">
        <path d={GEAR_C} strokeWidth="0.8" />
        <circle r="4" strokeWidth="0.8" />
        <path d={spokes(15, 4, 5)} strokeWidth="0.6" opacity="0.75" />
      </g>
      <g data-part="gearB">
        <path d={GEAR_B} strokeWidth="0.8" />
        <circle r="5" strokeWidth="0.8" />
        <path d={spokes(22, 5, 6)} strokeWidth="0.6" opacity="0.75" />
      </g>
      <g data-part="gearA">
        <path d={GEAR_A} strokeWidth="0.9" />
        <circle r="7" strokeWidth="0.9" />
        <path d={spokes(34, 6, 8)} strokeWidth="0.6" opacity="0.75" />
      </g>

      <g data-part="tourbillon">
        {/* gaiola: aro, três travessas e o balanço */}
        <circle r="30" strokeWidth="1" />
        <circle r="22" strokeWidth="0.6" opacity="0.6" />
        <path d={spokes(29, 3, 6)} strokeWidth="0.9" />
        <circle r="5.5" strokeWidth="0.9" />
        <path d="M-13 -26 A29 29 0 0 1 13 -26" strokeWidth="1.4" />
      </g>

      <g data-part="bridge" opacity="0.9">
        {/* ponte: a placa que segura o trem — forma assimétrica, como as de verdade */}
        <path d="M-72 -14 L-30 -34 L26 -30 L66 -6 L62 24 L18 36 L-28 28 L-70 12 Z" strokeWidth="1" />
        <circle cx="-44" cy="-6" r="5" strokeWidth="0.7" />
        <circle cx="34" cy="6" r="5" strokeWidth="0.7" />
        <circle cx="4" cy="-18" r="3.5" strokeWidth="0.7" />
      </g>

      <g data-part="dial">
        <circle r="99" strokeWidth="0.8" />
        <path d={TICKS} strokeWidth="0.7" opacity="0.75" />
        <circle r="34" cy="34" strokeWidth="0.6" opacity="0.55" />
      </g>
      <g data-part="bezel" opacity="0.9">
        <circle r="116" strokeWidth="1.2" />
        <circle r="108" strokeWidth="0.5" opacity="0.6" />
      </g>
      <g data-part="case">
        <circle r="132" strokeWidth="1.4" />
        {/* alças e coroa: o que faz o esquema ler como relógio, não como diagrama abstrato */}
        <path d="M-38 -130 L-34 -146 L-12 -150 L-8 -134" strokeWidth="1" />
        <path d="M38 -130 L34 -146 L12 -150 L8 -134" strokeWidth="1" />
        <path d="M-38 130 L-34 146 L-12 150 L-8 134" strokeWidth="1" />
        <path d="M38 130 L34 146 L12 150 L8 134" strokeWidth="1" />
        <path d="M132 -12 L146 -9 L146 9 L132 12" strokeWidth="1" />
      </g>
    </svg>
  );
}
