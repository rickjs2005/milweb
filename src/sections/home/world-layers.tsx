/**
 * Camadas de atmosfera dos quatro mundos — todas decorativas (aria-hidden,
 * sem pointer). Server-rendered; as "leis" (world-laws.ts) só animam.
 *
 *  kavita · território sob análise cartográfica: contornos topográficos,
 *           rotas de drone, varredura que lê a própria interface, cursor
 *           com coordenadas.
 *  terral · a interface ganha matéria: papel, grão, mancha-portal, dobra.
 *  vertex · o desenho técnico constrói o espaço: guias, cotas, planta que
 *           vira perspectiva, porta.
 *  aurex  · o tempo desmontado: anéis em velocidades diferentes, planos
 *           temporais, cursor com atraso.
 */

/** Contorno topográfico procedural (determinístico) — anéis irregulares ao redor de dois centros. */
function contour(cx: number, cy: number, r: number, seed: number, wobble: number): string {
  const n = 48;
  let d = "";
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const w = 1 + wobble * (Math.sin(a * 3 + seed) * 0.5 + Math.sin(a * 5 - seed * 1.7) * 0.3 + Math.sin(a * 2 + seed * 0.4) * 0.2);
    const x = cx + Math.cos(a) * r * w;
    const y = cy + Math.sin(a) * r * w * 0.62;
    d += (i ? " L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
  }
  return d + " Z";
}

const CONTOURS = [
  ...[60, 110, 165, 225, 290, 360, 440].map((r, i) => contour(380, 520, r, 1.3 + i * 0.4, 0.16)),
  ...[70, 130, 200, 280].map((r, i) => contour(1120, 300, r, 4.1 + i * 0.6, 0.2)),
];
const ROUTES = ["M120 780 L360 560 L640 610 L920 380 L1240 300", "M200 240 L480 330 L700 200 L1010 260 L1320 140", "M80 470 L400 700 L760 760 L1080 640 L1380 720"];

export function WorldLayers({ slug }: { slug: string }) {
  if (slug === "kavita-drones")
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" data-depth-map>
        <svg data-topo className="absolute inset-0 h-full w-full text-ink" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" fill="none" stroke="currentColor" strokeWidth="0.75">
          {CONTOURS.map((d, i) => (
            <path key={i} data-contour d={d} pathLength="1" opacity={0.28 - (i % 7) * 0.025} />
          ))}
          {ROUTES.map((d, i) => (
            <path key={"r" + i} data-route d={d} pathLength="1" strokeDasharray="2 6" opacity="0.5" />
          ))}
          {ROUTES.map((_, i) => (
            <g key={"d" + i} data-drone opacity="0">
              <circle r="3.5" fill="rgb(var(--signal))" />
              <circle r="9" stroke="rgb(var(--signal))" strokeWidth="0.75" opacity="0.6" />
            </g>
          ))}
          {[[380, 520], [1120, 300]].map(([x, y], i) => (
            <g key={"c" + i} opacity="0.7">
              <line x1={x - 8} y1={y} x2={x + 8} y2={y} />
              <line x1={x} y1={y - 8} x2={x} y2={y + 8} />
            </g>
          ))}
        </svg>
        {/* a varredura lê a interface: por trás dela, a estrutura da seção aparece */}
        <div data-scan-reveal className="absolute inset-0" style={{ clipPath: "inset(0 100% 0 0)" }}>
          <div className="absolute inset-x-margin top-nav bottom-8 border border-dashed border-ink/40" />
          <span className="t-mono absolute left-margin top-[calc(var(--nav-h)+0.5rem)] text-ink/60">[SECTION] world.kavita</span>
          <span className="t-mono absolute right-margin bottom-10 text-ink/60">grid 12 · 4 rotas · 26 itens</span>
        </div>
        <span data-scan className="absolute top-0 h-full w-px bg-signal" style={{ left: "0%" }}>
          <span className="absolute inset-y-0 -left-10 w-10 bg-gradient-to-r from-transparent to-signal/25" />
        </span>
        {/* cursor cartográfico: coordenadas vivas (só ponteiro fino) */}
        <div data-map-cursor className="t-mono absolute left-0 top-0 hidden text-ink opacity-0 md:block">
          <span className="absolute -left-4 top-0 h-px w-8 bg-ink" />
          <span className="absolute left-0 -top-4 h-8 w-px bg-ink" />
          <span data-map-xy className="absolute left-3 top-2 whitespace-nowrap bg-paper px-1 text-[10px] tracking-[0.06em]">
            X 0000 · Y 0000
          </span>
        </div>
      </div>
    );
  if (slug === "terral")
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <span data-grain className="grain absolute inset-0 opacity-0" />
        {/* fibra do papel */}
        <span className="absolute inset-0 opacity-[0.35]" style={{ backgroundImage: "repeating-linear-gradient(94deg, rgba(31,23,16,0.035) 0 1px, transparent 1px 7px), repeating-linear-gradient(2deg, rgba(31,23,16,0.025) 0 1px, transparent 1px 11px)" }} />
        <svg data-dots className="absolute inset-0 h-full w-full opacity-0" viewBox="0 0 120 80" preserveAspectRatio="xMidYMid slice">
          {Array.from({ length: 12 * 8 }).map((_, k) => (
            <circle key={k} cx={5 + (k % 12) * 10} cy={14 + Math.floor(k / 12) * 9} r="0.3" fill="currentColor" />
          ))}
        </svg>
        {/* rastro de grãos atrás do cursor */}
        <div data-grains className="absolute inset-0 hidden md:block">
          {Array.from({ length: 14 }).map((_, k) => (
            <span key={k} data-grain-dot className="absolute left-0 top-0 block rounded-full bg-[#1F1710] opacity-0" style={{ width: 3 + (k % 3), height: 3 + (k % 3) }} />
          ))}
        </div>
      </div>
    );
  if (slug === "atelier-vertex")
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" data-plan-space style={{ perspective: "1400px" }}>
        <svg data-guides className="absolute inset-0 h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="none" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" vectorEffect="non-scaling-stroke" style={{ transformOrigin: "50% 100%" }}>
          {[120, 360, 600, 840, 1080, 1320].map((x) => (
            <line key={x} data-guide x1={x} y1="0" x2={x} y2="900" pathLength="1" />
          ))}
          {[150, 450, 750].map((y) => (
            <line key={y} data-guide x1="0" y1={y} x2="1440" y2={y} pathLength="1" />
          ))}
          {/* planta: paredes de um pavimento tipo */}
          <g data-plan opacity="0.9">
            <rect x="420" y="240" width="600" height="420" pathLength="1" data-guide />
            <line x1="420" y1="420" x2="760" y2="420" pathLength="1" data-guide />
            <line x1="760" y1="240" x2="760" y2="560" pathLength="1" data-guide />
            <line x1="760" y1="560" x2="1020" y2="560" pathLength="1" data-guide />
            <rect x="860" y="300" width="100" height="60" pathLength="1" data-guide />
          </g>
        </svg>
        {/* cotas — dados reais do case (ESC 1:75, pavimento tipo) */}
        <div data-dims className="t-mono absolute inset-x-margin top-[calc(var(--nav-h)+4.5rem)] hidden text-ink-3 opacity-0 md:block">
          <div className="flex items-center gap-3">
            <span className="h-px w-24 bg-ink-3" />
            <span>ESC 1:75 · PAV. TIPO</span>
            <span className="h-px flex-1 bg-ink-3/40" />
            <span>132 DIAS</span>
          </div>
        </div>
      </div>
    );
  if (slug === "aurex-timepieces")
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 text-paper">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" fill="none" stroke="currentColor">
          <g data-ring data-speed="0.35" opacity="0.35" style={{ transformOrigin: "900px 450px" }}>
            <circle cx="900" cy="450" r="420" strokeWidth="0.75" strokeDasharray="2 10" />
          </g>
          <g data-ring data-speed="-0.6" opacity="0.5" style={{ transformOrigin: "900px 450px" }}>
            <circle cx="900" cy="450" r="330" strokeWidth="0.75" />
            {Array.from({ length: 60 }).map((_, k) => {
              const a = (k / 60) * Math.PI * 2;
              const r1 = k % 5 === 0 ? 316 : 324;
              const f = (v: number) => v.toFixed(1);
              return <line key={k} x1={f(900 + Math.cos(a) * r1)} y1={f(450 + Math.sin(a) * r1)} x2={f(900 + Math.cos(a) * 330)} y2={f(450 + Math.sin(a) * 330)} strokeWidth="0.75" />;
            })}
          </g>
          <g data-ring data-speed="1" opacity="0.7" style={{ transformOrigin: "900px 450px" }}>
            <circle cx="900" cy="450" r="240" strokeWidth="1" strokeDasharray="40 24" />
          </g>
        </svg>
        {/* cursor com atraso temporal: quatro fantasmas */}
        <div data-time-cursor className="absolute inset-0 hidden md:block">
          {[0, 1, 2, 3].map((k) => (
            <span key={k} data-ghost className="absolute left-0 top-0 block h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-paper opacity-0" style={{ opacity: 0 }} />
          ))}
        </div>
      </div>
    );
  return null;
}
