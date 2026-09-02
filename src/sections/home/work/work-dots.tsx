import { DOT_BOX, dotsOf, type DotMode } from "./act-config";

/**
 * A MALHA. Um único componente para os quatro atos — o que muda é o que ela
 * SIGNIFICA em cada um (levantamento topográfico, grão, anchor point de CAD,
 * pivô mecânico). Ver `dotsOf` em act-config.
 *
 * Cada painel renderiza duas camadas: a sua e a do próximo ato, com a segunda
 * em opacidade 0. Na saída elas trocam de lugar — a malha "vira" a do mundo
 * seguinte antes da virada, que é o que faz as quatro parecerem o mesmo sistema
 * e não quatro enfeites. Só a opacidade do <g> é animada: nenhum ponto se move
 * individualmente, e o SVG inteiro sai do fluxo de layout.
 */
export function WorkDots({ mode, next }: { mode: DotMode; next?: DotMode }) {
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${DOT_BOX.w} ${DOT_BOX.h}`} preserveAspectRatio="xMidYMid slice">
      <Layer mode={mode} attr="data-dots" />
      {next && next !== mode ? <Layer mode={next} attr="data-dots-next" hidden /> : null}
    </svg>
  );
}

function Layer({ mode, attr, hidden = false }: { mode: DotMode; attr: string; hidden?: boolean }) {
  const dots = dotsOf(mode);
  // Toda medida vira STRING com casas fixas antes de virar atributo. O gerador
  // usa Math.sin, e o último bit de um float pode diferir entre a V8 que rende
  // no servidor e a que hidrata no navegador — o suficiente para o React
  // reclamar de mismatch de atributo. Arredondar remove a classe inteira do bug.
  // Sem `stroke` no grupo: `vector-effect` NÃO é herdado em SVG, então o
  // contorno de 1 unidade do viewBox virava ~19 px de traço em volta de cada
  // ponto, e a malha inteira lia como um pegboard pesado em todos os atos.
  // Ponto é preenchimento; só as marcas de eixo têm traço, em unidades.
  return (
    <g {...{ [attr]: "" }} fill="currentColor" stroke="none" style={hidden ? { opacity: 0 } : undefined}>
      {dots.map((d, i) =>
        d.square ? (
          <rect key={i} x={(d.x - d.r).toFixed(2)} y={(d.y - d.r).toFixed(2)} width={(d.r * 2).toFixed(2)} height={(d.r * 2).toFixed(2)} opacity={d.o.toFixed(2)} />
        ) : d.ry ? (
          // grão: elipse com eixo próprio — a irregularidade é o que separa um
          // grão de um ponto de retícula
          <ellipse key={i} cx={d.x.toFixed(2)} cy={d.y.toFixed(2)} rx={d.r.toFixed(2)} ry={d.ry.toFixed(2)} opacity={d.o.toFixed(2)} transform={`rotate(${d.rot ?? 0} ${d.x.toFixed(2)} ${d.y.toFixed(2)})`} />
        ) : (
          <circle key={i} cx={d.x.toFixed(2)} cy={d.y.toFixed(2)} r={d.r.toFixed(2)} opacity={d.o.toFixed(2)} />
        ),
      )}
      {/* marcas de eixo: o que transforma pontos soltos em instrumento de medida */}
      {dots.map((d, i) =>
        d.tick ? (
          <g key={`t${i}`} stroke="currentColor" opacity={(d.o * 0.7).toFixed(2)} strokeWidth="0.07">
            <line x1={(d.x - (d.tickLen ?? 0.85)).toFixed(2)} y1={d.y.toFixed(2)} x2={(d.x + (d.tickLen ?? 0.85)).toFixed(2)} y2={d.y.toFixed(2)} />
            <line x1={d.x.toFixed(2)} y1={(d.y - (d.tickLen ?? 0.85)).toFixed(2)} x2={d.x.toFixed(2)} y2={(d.y + (d.tickLen ?? 0.85)).toFixed(2)} />
          </g>
        ) : null,
      )}
    </g>
  );
}
