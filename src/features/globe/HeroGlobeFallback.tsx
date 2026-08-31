/**
 * O globo sem WebGL — HTML inicial, GPU reprovada e, principalmente,
 * `prefers-reduced-motion`: ali a regra é "manchete inteira + globo no estado
 * FINAL, estático". É o mesmo desenho do shader traduzido para SVG: silhueta
 * fina, paralelos/meridianos, continentes em matriz de pontos e o marcador do
 * Brasil em Signal Green, na mesma orientação em que o canvas assenta.
 *
 * Os continentes aqui são elipses grosseiras, não a máscara de
 * `webgl/earth-mask` — essa é carregada sob demanda junto do renderer, e trazê-la
 * para o bundle inicial só para desenhar um fallback que a maioria nunca vê
 * seria pagar caro pelo caminho errado.
 *
 * Fica invisível por padrão (`.hero-globe-fallback`) e só aparece com
 * `html[data-globe="off"]` ou sob reduced-motion — no caminho normal quem
 * desenha é o canvas, e o globo tem que NASCER do "O", não já estar na tela.
 */
const HOME = { lon: -47.9, lat: -15.8 };
const TILT = -0.36;
const R = 94;

/** Elipses em (lon, lat) que aproximam as massas de terra. */
const BLOBS: [number, number, number, number][] = [
  [-60, -8, 15, 14], // América do Sul (norte)
  [-64, -30, 9, 16], // cone sul
  [-100, 45, 22, 15], // América do Norte
  [-82, 33, 12, 10], // sudeste dos EUA
  [-142, 62, 18, 8], // Alasca / noroeste
  [-42, 73, 12, 8], // Groenlândia
  [16, 4, 16, 14], // África equatorial
  [22, -20, 12, 14], // África austral
  [-2, 12, 12, 10], // oeste africano
  [18, 50, 20, 9], // Europa
  [85, 52, 40, 17], // Ásia setentrional
  [104, 26, 18, 12], // sudeste asiático
  [58, 32, 15, 12], // Oriente Médio / Ásia central
  [78, 20, 8, 11], // Índia
  [134, -25, 14, 8], // Austrália
];

/** Projeção ortográfica do ponto (lon, lat) para a face visível do disco. */
function project(lonDeg: number, latDeg: number) {
  const lat = (latDeg * Math.PI) / 180;
  const a = ((lonDeg - HOME.lon) * Math.PI) / 180;
  const x = Math.cos(lat) * Math.sin(a);
  const z = Math.cos(lat) * Math.cos(a);
  const y = Math.sin(lat);
  const yr = y * Math.cos(TILT) - z * Math.sin(TILT);
  const zr = y * Math.sin(TILT) + z * Math.cos(TILT);
  return { x: 100 + x * R, y: 100 - yr * R, z: zr };
}

const DOTS = (() => {
  const out: { x: number; y: number; r: number }[] = [];
  for (let lat = -78; lat <= 80; lat += 7) {
    const cols = Math.max(4, Math.round(46 * Math.cos((lat * Math.PI) / 180)));
    for (let i = 0; i < cols; i++) {
      const lon = -180 + (360 / cols) * (i + 0.5);
      const land = BLOBS.some(([cl, ca, rl, ra]) => {
        const d = ((lon - cl + 540) % 360) - 180;
        return (d / rl) ** 2 + ((lat - ca) / ra) ** 2 < 1;
      });
      if (!land) continue;
      const p = project(lon, lat);
      if (p.z < 0.06) continue;
      out.push({ x: p.x, y: p.y, r: 1.1 + p.z * 1.0 });
    }
  }
  return out;
})();

const MARK = project(HOME.lon, HOME.lat);

export function HeroGlobeFallback() {
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true" className="hero-globe-fallback pointer-events-none absolute left-1/2 top-[56%] z-[2] w-[42vw] -translate-x-1/2 md:left-[77%] md:top-[37%] md:w-[28%] md:max-w-[540px] md:-translate-y-1/2">
      <circle cx="100" cy="100" r={R} fill="none" stroke="rgb(var(--ink))" strokeOpacity="0.72" strokeWidth="0.6" />
      <g fill="none" stroke="rgb(var(--ink))" strokeOpacity="0.14" strokeWidth="0.6">
        <ellipse cx="100" cy="100" rx={R} ry="32" transform={`rotate(${(TILT * 180) / Math.PI} 100 100)`} />
        <ellipse cx="100" cy="100" rx={R} ry="64" transform={`rotate(${(TILT * 180) / Math.PI} 100 100)`} />
        <ellipse cx="100" cy="100" rx="31" ry={R} />
        <ellipse cx="100" cy="100" rx="63" ry={R} />
      </g>
      <g fill="rgb(var(--ink))" fillOpacity="0.4">
        {DOTS.map((d, i) => (
          <circle key={i} cx={d.x.toFixed(1)} cy={d.y.toFixed(1)} r={d.r.toFixed(2)} />
        ))}
      </g>
      <circle cx={MARK.x.toFixed(1)} cy={MARK.y.toFixed(1)} r="2.2" fill="#B7FF37" />
      <circle cx={MARK.x.toFixed(1)} cy={MARK.y.toFixed(1)} r="6" fill="none" stroke="#B7FF37" strokeWidth="0.7" />
    </svg>
  );
}
