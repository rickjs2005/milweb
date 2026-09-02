import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { LD_ACCENT, NODES, ROUTE_H, ROUTE_V, UNITS, legPath, nodeAt, planPath, type NodeKey, type Note, type Route } from "./logistics-geometry";

/* ------------------------------------------------------------------ 06 LOGISTICS DEMO
   Uma operação logística internacional sendo executada dentro da interface.
   ORIGEM → CARGA → TERRESTRE / PORTO → OCEANO → HUB → AÉREO → DESTINO, e só
   então a manchete: CADA MILHA / SOB CONTROLE.

   A ROTA é o protagonista: um esquema de instrumento em SVG (horizontais,
   verticais e 45°), com o plano inteiro tracejado desde o começo e a execução
   se desenhando por cima (`stroke-dashoffset`) conforme a carga avança. Não é
   mapa: os nós são as marcações do projeto (ORG-01, HUB-02, DST-03), sem
   cidade, sem globo.

   A CARGA é um só grupo que percorre a polilinha e troca de recorte a cada
   trecho — contêiner, caminhão, navio, avião e o caminhão da última milha —
   com a mesma frota vista de cima do projeto. O ponto laranja no centro é o
   fixo de posição: o único acento, com o pulso dos nós.

   A JANELA é a superfície que a rota atravessa: o porto ao anoitecer quando a
   carga chega ao terminal, o oceano aberto quando ela embarca. Uma janela, dois
   estados — nunca quatro cards dentro do card.

   Duas composições (larga / vertical) leem a mesma geometria; só a visível
   é animada (selected-work.tsx escolhe pela largura). As anotações são HTML
   posicionado em % da caixa, para a microtipografia não escalar com o SVG. */
const MONO: CSSProperties = { fontFamily: "var(--font-mono), ui-monospace, monospace", letterSpacing: "0.14em" };

/**
 * Posição em % da caixa + deslocamento em px. O deslocamento vai em MARGEM e o
 * alinhamento no ponto fica num <span> interno: a timeline anima `y` na
 * anotação e o GSAP escreve `transform` nela — qualquer transform nosso no
 * mesmo elemento seria sobrescrito.
 */
function at(r: Route, n: Note): CSSProperties {
  return { left: `${((n.x / r.box.w) * 100).toFixed(2)}%`, top: `${((n.y / r.box.h) * 100).toFixed(2)}%`, marginLeft: n.dx, marginTop: n.dy };
}
const ALIGN: Record<Note["align"], CSSProperties> = { left: {}, center: { transform: "translateX(-50%)", textAlign: "center" }, right: { transform: "translateX(-100%)", textAlign: "right" } };

/** Uma anotação: posicionada pelo `at`, alinhada pelo <span> interno. */
function Annot({ r, n, className, attrs, children }: { r: Route; n: Note; className?: string; attrs: Record<string, string>; children: ReactNode }) {
  return (
    <span {...attrs} className={`absolute whitespace-nowrap text-[10px] leading-[1.5] opacity-0 max-md:text-[9px] ${className ?? ""}`} style={{ ...MONO, ...at(r, n) }}>
      <span className="inline-block" style={ALIGN[n.align]}>
        {children}
      </span>
    </span>
  );
}

export function LogisticsStage({ image, detail, labels, stages }: { image: string; detail: string; labels: string[]; stages: string[] }) {
  // labels[1] = "TERRESTRE · MARÍTIMO · AÉREO" — os três rótulos de perna, na ordem das pernas
  const modes = (labels[1] ?? "").split(" · ");
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      {/* A CAIXA DA ROTA — largura pela altura (teto 40 svh) para o SVG preencher exatamente a caixa e as anotações em % baterem */}
      <div
        data-media-wrap
        className="absolute left-[calc(50%_-_min(44vw,63.15svh))] top-[max(15svh,136px)] z-[2] aspect-[1200/380] w-[min(88vw,126.3svh)] max-md:left-margin max-md:top-[max(14svh,120px)] max-md:aspect-[400/430] max-md:w-[min(calc(100vw_-_2*var(--margin)),42svh)]"
        data-inspect="ROUTE"
      >
        <RouteLayer kind="h" route={ROUTE_H} image={image} detail={detail} modes={modes} stages={stages} className="max-md:hidden" />
        <RouteLayer kind="v" route={ROUTE_V} image={image} detail={detail} modes={modes} stages={stages} className="md:hidden" />

        {/* STATUS DA CARGA — uma etapa por vez (as sete da jornada do projeto), sob a caixa */}
        <div data-status className="absolute left-0 top-[calc(100%+14px)] h-4 opacity-0">
          {stages.map((s, i) => (
            <p key={s} data-step className="absolute left-0 top-0 whitespace-nowrap text-[10px] opacity-0 max-md:text-[9px]" style={MONO}>
              <span className="mr-3 inline-block h-[6px] w-[6px] -translate-y-px" style={{ background: LD_ACCENT }} />
              <span className="tnum mr-3 opacity-60">STG-0{i + 1}</span>
              {s}
            </p>
          ))}
        </div>
        {/* progresso da rota: fração do percurso já executado */}
        <p data-route-pct className="tnum absolute right-0 top-[calc(100%+14px)] whitespace-nowrap text-[10px] opacity-0 max-md:hidden" style={MONO}>
          ROUTE <span data-route-pct-n>000</span> %
        </p>

        {/* retículo do cursor (lei do mundo, só ponteiro fino) */}
        <span data-reticle-h className="pointer-events-none absolute left-0 top-0 hidden h-px w-full bg-current opacity-0 md:block" />
        <span data-reticle-v className="pointer-events-none absolute left-0 top-0 hidden h-full w-px bg-current opacity-0 md:block" />
      </div>
    </div>
  );
}

function RouteLayer({ kind, route: r, image, detail, modes, stages, className }: { kind: "h" | "v"; route: Route; image: string; detail: string; modes: string[]; stages: string[]; className: string }) {
  const { w, h } = r.box;
  const pct = (v: number, total: number) => `${((v / total) * 100).toFixed(2)}%`;
  const [ox, oy] = nodeAt(r, "org");
  const nodeKeys: NodeKey[] = ["org", "port", "hub", "dst"];
  const unitBox = (k: keyof typeof UNITS) => {
    const u = UNITS[k];
    const uw = u.size;
    const uh = (u.size * u.h) / u.w;
    return { href: u.src, width: uw, height: uh, x: -uw / 2, y: -uh / 2 };
  };
  return (
    <div {...{ [`data-route-${kind}`]: "" }} className={`absolute inset-0 ${className}`}>
      {/* A JANELA — a superfície: porto ao anoitecer → oceano aberto */}
      <div
        data-media
        className="absolute overflow-hidden"
        style={{ left: pct(r.media.x, w), top: pct(r.media.y, h), width: pct(r.media.w, w), height: pct(r.media.h, h), clipPath: "inset(50% 0 50% 0)", viewTransitionName: "case-media-logistics-demo" }}
        data-inspect="MEDIA"
      >
        <span data-plate-a className="absolute -inset-[3%] block">
          <Image src={image} alt="" fill loading="lazy" sizes={kind === "h" ? "40vw" : "60vw"} className="object-cover object-[50%_60%]" />
        </span>
        <span data-plate-b className="absolute -inset-[3%] block opacity-0">
          <Image src={detail} alt="" fill loading="lazy" sizes={kind === "h" ? "40vw" : "60vw"} className="object-cover object-[55%_50%]" />
        </span>
        {/* o grafite do demo por cima: a foto é superfície, não protagonista */}
        <span className="absolute inset-0 block bg-[#0F1318] opacity-30" />
        <span data-frame className="pointer-events-none absolute inset-0 block border border-current opacity-30" />
        <span className="absolute left-2 top-2 whitespace-nowrap text-[9px] opacity-70 max-md:hidden" style={MONO}>
          TOP-DOWN · 90°
        </span>
      </div>

      {/* A ROTA */}
      <svg data-route-svg className="absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet" fill="none" stroke="currentColor">
        {/* o plano: a rota inteira, tracejada — o que ainda não foi executado */}
        <path data-plan d={planPath(r)} strokeWidth="1" strokeDasharray="2 6" strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity="0" />
        {/* a execução: cada perna se desenha conforme a carga avança */}
        {r.legs.map((leg) => (
          <path key={leg.mode} data-leg data-mode={leg.mode} d={legPath(r, leg)} pathLength="1" strokeWidth="1.5" strokeDasharray="1" strokeDashoffset="1" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity="0.9" />
        ))}
        {/* os nós: ponto cheio + anel; o pulso laranja acende UMA vez quando a carga chega */}
        {nodeKeys.map((k) => {
          const [x, y] = nodeAt(r, k);
          return (
            <g key={k} data-node={k} transform={`translate(${x} ${y})`} opacity="0">
              <circle r="9" strokeWidth="1" vectorEffect="non-scaling-stroke" opacity="0.5" />
              <circle r={k === "port" ? 3 : 4.5} fill="currentColor" stroke="none" />
              <circle data-pulse r="9" stroke={LD_ACCENT} strokeWidth="1.2" vectorEffect="non-scaling-stroke" opacity="0" />
            </g>
          );
        })}
        {/* A CARGA — um grupo, cinco recortes; só um aceso por vez */}
        <g data-cargo transform={`translate(${ox} ${oy})`} opacity="0">
          <g data-cargo-rot>
            <g transform={`scale(${r.unit})`}>
              <g data-unit="container" opacity="0">
                <image {...unitBox("container")} />
              </g>
              <g data-unit="truck" opacity="0">
                <image {...unitBox("truck")} />
              </g>
              <g data-unit="ship" opacity="0">
                <image {...unitBox("ship")} />
              </g>
              <g data-unit="plane" opacity="0">
                <image {...unitBox("plane")} />
              </g>
              {/* última milha: o mesmo caminhão, espelhado — como no projeto (truckBack) */}
              <g data-unit="truck-back" opacity="0" transform="scale(-1 1)">
                <image {...unitBox("truck")} />
              </g>
            </g>
            {/* o fixo de posição */}
            <circle data-fix r="2.6" fill={LD_ACCENT} stroke="none" />
            <circle r="7" stroke={LD_ACCENT} strokeWidth="1" vectorEffect="non-scaling-stroke" opacity="0.55" />
          </g>
        </g>
      </svg>

      {/* ANOTAÇÕES — rótulos de perna e legendas de nó, em HTML (a microtipografia não escala) */}
      {r.legs.map((leg, i) => (
        <Annot key={leg.mode} r={r} n={r.legNotes[leg.mode]} attrs={{ "data-leg-label": "", "data-mode": leg.mode }}>
          {modes[i] ?? leg.mode.toUpperCase()}
        </Annot>
      ))}
      {(["org", "hub", "dst"] as const).map((k) => (
        <Annot key={k} r={r} n={r.nodeNotes[k]} attrs={{ "data-node-cap": k }}>
          {NODES[k].code}
          <br />
          <span className="tnum opacity-60">{NODES[k].coord}</span>
        </Annot>
      ))}
      <Annot r={r} n={r.nodeNotes.port} attrs={{ "data-node-cap": "port" }}>
        {(stages[3] ?? "PORT").split(" · ")[0]}
      </Annot>
    </div>
  );
}
