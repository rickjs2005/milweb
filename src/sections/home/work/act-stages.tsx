import Image from "next/image";
import { AurexMovement } from "./aurex-movement";
import type { ActSlug } from "./act-config";

/**
 * OS PALCOS. Cada ato tem um palco próprio — a experiência visual principal da
 * anatomia — e todos obedecem ao mesmo contrato:
 *
 *  · ocupam a faixa superior do painel e podem SANGRAR para fora do
 *    enquadramento (é o que tira a leitura de "screenshot dentro de um card");
 *  · a caixa `[data-media]` carrega o `view-transition-name` que viaja até o
 *    hero do case — mexer nela quebra a transição de rota;
 *  · a marcação é estática: a timeline do ato (selected-work.tsx) é a única
 *    dona de cada propriedade animada.
 */

/** Todas as capturas dos projetos têm este tamanho. */
const SHOT = { w: 1440, h: 900 } as const;

/**
 * RECORTE. Recebe a região da captura original em PIXELS e devolve o
 * posicionamento de uma camada que mostra exatamente aquilo dentro da caixa.
 *
 * Por que em left/top/width/height e não em `transform: scale()` com
 * `transform-origin`: o recorte por transform funciona, mas ocupa a MESMA
 * propriedade que a timeline usa para parallax e zoom — e quem escreve por
 * último ganha. Foi assim que a Terral perdeu o recorte: o `scale` do CSS era
 * sobrescrito pelo `scale` do GSAP e a caixa voltava a mostrar o frame inteiro,
 * com a tipografia do site dentro. Aqui o recorte é geometria e o `transform`
 * fica inteiramente livre para o movimento.
 *
 * ARMADILHA DO `sizes`: ele descreve a largura da imagem INTEIRA depois do
 * recorte, não a da caixa. Declarando a caixa (30vw) o Next serve uma variante
 * de 640 px para uma imagem que aparece com 2000 px — e todo recorte fechado
 * sai borrado.
 */
function crop(x0: number, y0: number, x1: number, y1: number) {
  const w = x1 - x0;
  const h = y1 - y0;
  const pct = (v: number) => `${(v * 100).toFixed(2)}%`;
  return { left: pct(-x0 / w), top: pct(-y0 / h), width: pct(SHOT.w / w), height: pct(SHOT.h / h) };
}

/** Camada de recorte: a caixa clipa, esta camada posiciona, a imagem preenche. */
function Crop({ src, region, sizes, className }: { src: string; region: [number, number, number, number]; sizes: string; className?: string }) {
  return (
    <span data-crop className="absolute block" style={crop(...region)}>
      <Image src={src} alt="" fill loading="lazy" sizes={sizes} className={`object-cover ${className ?? ""}`} />
    </span>
  );
}

/** Contorno topográfico procedural (determinístico) — anéis irregulares ao redor de um centro. */
function contour(cx: number, cy: number, r: number, seed: number, wobble: number): string {
  const n = 44;
  let d = "";
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const w = 1 + wobble * (Math.sin(a * 3 + seed) * 0.5 + Math.sin(a * 5 - seed * 1.7) * 0.3 + Math.sin(a * 2 + seed * 0.4) * 0.2);
    d += (i ? " L" : "M") + (cx + Math.cos(a) * r * w).toFixed(1) + " " + (cy + Math.sin(a) * r * w * 0.62).toFixed(1);
  }
  return d + " Z";
}

const CONTOURS = [...[70, 130, 200, 285, 380, 490].map((r, i) => contour(300, 620, r, 1.3 + i * 0.4, 0.16)), ...[80, 150, 235].map((r, i) => contour(1180, 250, r, 4.1 + i * 0.6, 0.2))];
const ROUTES = ["M60 800 L330 570 L640 630 L980 380 L1420 290", "M120 210 L460 330 L720 190 L1060 250 L1400 120"];

/** Faixa da fachada usada pelo Vertex: abaixo da manchete e do botão do site. */
const VERTEX_CROP = { x0: 400, y0: 460, w: 1040, h: 390 } as const;

export function ActStage({ slug, image, detail }: { slug: ActSlug; image: string; detail: string }) {
  if (slug === "kavita-drones") return <KavitaStage image={image} detail={detail} />;
  if (slug === "terral") return <TerralStage image={image} detail={detail} />;
  if (slug === "atelier-vertex") return <VertexStage image={image} detail={detail} />;
  return <AurexStage image={image} />;
}

/* ------------------------------------------------------------------ 01 KAVITA
   Território sob análise. A lavoura entra como faixa que sangra pela direita e
   o equipamento vem à frente, isolado e com marcação de alvo: campo atrás,
   tecnologia na frente, topografia lendo o terreno. */
function KavitaStage({ image, detail }: { image: string; detail: string }) {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <svg data-topo className="absolute inset-0 h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" fill="none" stroke="currentColor" strokeWidth="0.75">
        {CONTOURS.map((d, i) => (
          <path key={i} data-contour d={d} pathLength="1" opacity={(0.3 - (i % 6) * 0.03).toFixed(2)} />
        ))}
        {ROUTES.map((d, i) => (
          <path key={"r" + i} data-route d={d} pathLength="1" strokeDasharray="3 7" opacity="0.45" />
        ))}
        {ROUTES.map((_, i) => (
          <g key={"d" + i} data-drone opacity="0">
            <circle r="3" fill="rgb(var(--signal))" stroke="none" />
            <circle r="10" stroke="rgb(var(--signal))" strokeWidth="0.75" opacity="0.55" />
          </g>
        ))}
        {[[300, 620], [1180, 250]].map(([x, y], i) => (
          <g key={"c" + i} data-crosshair opacity="0.55">
            <line x1={x - 12} y1={y} x2={x + 12} y2={y} />
            <line x1={x} y1={y - 12} x2={x} y2={y + 12} />
          </g>
        ))}
      </svg>

      {/* A LAVOURA — a única região da captura que é fotografia pura: no frame
          original a copy do site cobre a metade esquerda e desce até 47 % da
          altura, então o enquadramento honesto é o alto à direita. */}
      <div data-media className="absolute right-[-6%] top-[11%] z-[2] h-[25%] w-[44%] overflow-hidden max-md:left-margin max-md:right-margin max-md:w-auto max-md:top-[13%] max-md:h-[20%]" style={{ viewTransitionName: "case-media-kavita-drones" }} data-inspect="MEDIA">
        <Crop src={image} region={[900, 85, 1440, 258]} sizes="100vw" />
        {/* varredura: a linha que lê o território */}
        <span data-scan className="absolute inset-y-0 w-px bg-signal" style={{ left: "0%" }}>
          <span className="absolute inset-y-0 -left-16 w-16 bg-gradient-to-r from-transparent to-signal/30" />
        </span>
        <span data-frame className="absolute inset-0 border border-ink/25" />
      </div>

      {/* O EQUIPAMENTO — protagonista, isolado do frame de produtos. `multiply`
          no invólucro (e não na imagem: o z-index do invólucro cria contexto de
          empilhamento, e ali dentro a mistura não teria com o que se misturar)
          dissolve o card claro no papel: o drone fica impresso na página. */}
      <div data-media-b className="absolute right-[9%] top-[25%] z-[3] h-[22%] w-[26%] overflow-hidden mix-blend-multiply max-md:right-[6%] max-md:top-[31%] max-md:h-[17%] max-md:w-[58%]">
        <Crop src={detail} region={[570, 445, 875, 590]} sizes="100vw" className="contrast-[1.18]" />
      </div>
      <div data-target aria-hidden="true" className="absolute right-[9%] top-[25%] z-[4] h-[22%] w-[26%] opacity-0 max-md:right-[6%] max-md:top-[31%] max-md:h-[17%] max-md:w-[58%]">
        <span className="absolute left-0 top-0 h-4 w-4 border-l border-t border-current opacity-70" />
        <span className="absolute right-0 top-0 h-4 w-4 border-r border-t border-current opacity-70" />
        <span className="absolute bottom-0 left-0 h-4 w-4 border-b border-l border-current opacity-70" />
        <span className="absolute bottom-0 right-0 h-4 w-4 border-b border-r border-current opacity-70" />
        <span className="t-mono absolute -bottom-5 right-0 text-[10px] tracking-[0.14em] opacity-60">DJI AGRAS T70P</span>
      </div>

      {/* leituras técnicas: aparecem no scroll, ao longo da varredura */}
      <div data-readout className="t-mono absolute right-[6%] top-[54%] z-[4] hidden text-right md:block">
        {["ALT 42 M", "SWATH 7,0 M", "COV 14,6 HA/H"].map((t) => (
          <p key={t} data-coord className="tnum opacity-0">
            {t}
          </p>
        ))}
      </div>

      {/* cursor cartográfico (lei do mundo, só ponteiro fino) */}
      <div data-map-cursor className="t-mono absolute left-0 top-0 z-[4] hidden opacity-0 md:block">
        <span className="absolute -left-5 top-0 h-px w-10 bg-current" />
        <span className="absolute left-0 -top-5 h-10 w-px bg-current" />
        <span data-map-xy className="absolute left-3 top-2 whitespace-nowrap px-1 text-[10px] tracking-[0.06em]">
          X 0000 · Y 0000
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ 02 TERRAL
   Matéria. Duas fotografias sobrepostas em velocidades diferentes: a macro dos
   grãos (A, atrás, à direita) e o tambor do torrador (B, à frente, à esquerda).
   O papel é FUNDO — nunca um filtro por cima de tudo, que era o que deixava
   manchete, mídia e textura todos no mesmo plano visual. */
function TerralStage({ image, detail }: { image: string; detail: string }) {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      {/* fibra do papel: só no fundo, atrás de tudo */}
      <span data-fibre className="absolute inset-0 opacity-[0.5]" style={{ backgroundImage: "repeating-linear-gradient(94deg, rgba(31,23,16,0.045) 0 1px, transparent 1px 7px), repeating-linear-gradient(2deg, rgba(31,23,16,0.03) 0 1px, transparent 1px 11px)" }} />

      {/* A — macro dos grãos (metade direita do frame "O SOL"; a esquerda é o
          terreiro COM a tipografia do site, e fica de fora do recorte) */}
      <div data-media className="absolute right-[-4%] top-[8%] z-[2] h-[54%] w-[46%] overflow-hidden max-md:left-margin max-md:right-margin max-md:w-auto max-md:top-[10%] max-md:h-[36%]" style={{ viewTransitionName: "case-media-terral" }} data-inspect="MEDIA">
        <Crop src={image} region={[720, 200, 1430, 780]} sizes="100vw" />
        <span data-grain className="grain pointer-events-none absolute inset-0 opacity-0" />
      </div>

      {/* B — o tambor do torrador, à frente e fora de fase com A */}
      <div data-media-b className="absolute left-[34%] top-[24%] z-[3] hidden h-[42%] w-[24%] overflow-hidden md:block">
        <Crop src={detail} region={[700, 60, 1400, 760]} sizes="50vw" />
        <span data-grain className="grain pointer-events-none absolute inset-0 opacity-0" />
        <span className="absolute inset-0 border border-[#1F1710]/25" />
      </div>

      {/* rastro de grãos atrás do cursor (lei do mundo) */}
      <div data-grains className="absolute inset-0 z-[4] hidden md:block">
        {Array.from({ length: 12 }).map((_, k) => (
          <span key={k} data-grain-dot className="absolute left-0 top-0 block rounded-full bg-[#1F1710] opacity-0" style={{ width: 3 + (k % 3), height: 3 + (k % 3) }} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ 03 VERTEX
   O desenho constrói o espaço. As quatro guias deixam de ser enfeite: elas
   DEFINEM as quatro fatias que revelam a fachada entregue sobre a prancha.
   Blueprint → guias → estrutura → imagem → obra. */
function VertexStage({ image, detail }: { image: string; detail: string }) {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <div data-media className="absolute left-[13%] top-[10%] z-[2] h-[50%] w-[74%] overflow-hidden max-md:left-margin max-md:right-margin max-md:w-auto max-md:top-[12%] max-md:h-[30%]" style={{ viewTransitionName: "case-media-atelier-vertex" }} data-inspect="MEDIA">
        {/* base: a prancha — planta técnica desenhada sobre a obra em execução */}
        <Crop src={detail} region={[400, 460, 1440, 850]} sizes="100vw" className="opacity-90" />
        {/* as quatro fatias: janelas sobre a MESMA fachada entregue. A faixa
            escolhida começa abaixo da manchete do próprio site — sobra obra. */}
        {[0, 1, 2, 3].map((k) => (
          <span key={k} data-slice className="absolute top-0 h-full overflow-hidden" style={{ left: `${k * 25}%`, width: "25%" }}>
            {/* a mesma região da base, em coordenadas da fatia: a imagem inteira
                é dimensionada e deslocada, e `background-size: 100% 100%` a mapeia
                exatamente — as quatro janelas leem o MESMO enquadramento. */}
            <span
              className="absolute block"
              style={{ left: `${(-VERTEX_CROP.x0 / VERTEX_CROP.w) * 400 - k * 100}%`, top: `${(-VERTEX_CROP.y0 / VERTEX_CROP.h) * 100}%`, width: `${(SHOT.w / VERTEX_CROP.w) * 400}%`, height: `${(SHOT.h / VERTEX_CROP.h) * 100}%`, backgroundImage: `url(${image})`, backgroundSize: "100% 100%" }}
            />
          </span>
        ))}
        <span data-frame className="absolute inset-0 border border-ink/20" />
      </div>

      {/* guias de projeto: as quatro verticais que cortam a mídia + eixos e cotas */}
      <svg data-guides className="absolute inset-0 z-[3] h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="none" fill="none" stroke="currentColor" vectorEffect="non-scaling-stroke">
        {[0, 1, 2, 3, 4].map((k) => (
          <line key={k} data-guide x1={86 + k * 317} y1="0" x2={86 + k * 317} y2="900" pathLength="1" strokeWidth="1" opacity="0.42" />
        ))}
        {[168, 612].map((y) => (
          <line key={y} data-guide x1="0" y1={y} x2="1440" y2={y} pathLength="1" strokeWidth="1" opacity="0.22" />
        ))}
        {/* pontos técnicos nos cruzamentos — anchor points, não partículas */}
        {[0, 1, 2, 3, 4].flatMap((k) =>
          [168, 612].map((y) => (
            <rect key={`${k}-${y}`} data-anchor x={86 + k * 317 - 3} y={y - 3} width="6" height="6" strokeWidth="1" opacity="0" />
          )),
        )}
        {/* linha de cota: a largura real da obra */}
        <g data-dim opacity="0">
          <line x1="86" y1="700" x2="1354" y2="700" strokeWidth="1" />
          <line x1="86" y1="690" x2="86" y2="710" strokeWidth="1" />
          <line x1="1354" y1="690" x2="1354" y2="710" strokeWidth="1" />
        </g>
      </svg>

      {/* rótulos de prancha, ancorados nas guias */}
      <div data-plan-labels className="t-mono pointer-events-none absolute inset-0 z-[4] hidden md:block">
        {[
          { t: "ESC 1:75", l: "6%", y: "15%" },
          { t: "REV 03", l: "50%", y: "15%" },
          { t: "PAV. TIPO", l: "28%", y: "62%" },
          { t: "11,50 M", l: "72%", y: "62%" },
        ].map((d) => (
          <span key={d.t} data-plan-label className="absolute -translate-y-1/2 bg-[color:var(--act-bg)] px-2 text-[10px] tracking-[0.14em] opacity-0" style={{ left: d.l, top: d.y }}>
            {d.t}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ 04 AUREX
   O tempo desmontado. A composição escura, a manchete enorme e o contraste
   ficam como estão — o que muda é o vazio do centro, que passa a ser ocupado
   pelo protagonista: o calibre AX-01 se decompondo em vista explodida. O
   esquema entra ALINHADO com a fotografia (estado montado) e se separa. */
function AurexStage({ image }: { image: string }) {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      {/* deslocado à direita do centro: o leque da explosão puxa a massa para a
          esquerda (a caixa é a peça que anda mais), então o objeto montado nasce
          fora do eixo para o conjunto ABERTO ficar equilibrado na tela */}
      <div className="absolute left-1/2 top-[42%] z-[2] aspect-square w-[64%] max-w-[560px] -translate-x-1/2 -translate-y-1/2 md:left-[55%] md:w-[40%]">
        {/* a máscara radial dissolve a caixa da foto no preto: sem ela o
            enquadramento do relógio aparece como um retângulo cinza no fundo */}
        <div
          data-media
          className="absolute inset-0 overflow-hidden"
          style={{
            viewTransitionName: "case-media-aurex-timepieces",
            maskImage: "radial-gradient(circle at 50% 50%, #000 54%, transparent 74%)",
            WebkitMaskImage: "radial-gradient(circle at 50% 50%, #000 54%, transparent 74%)",
          }}
          data-inspect="MEDIA"
        >
          <Crop src={image} region={[430, 140, 1090, 800]} sizes="90vw" />
        </div>
        {/* O esquema entra do TAMANHO do relógio da foto: a caixa do calibre tem
            88 % do lado no viewBox e o recorte acima deixa o relógio com ~94 % —
            é o que faz o estado inicial ler como "montado", e não como dois
            objetos empilhados. */}
        <div data-movement-wrap className="absolute inset-[-3%] opacity-0">
          <AurexMovement />
        </div>
      </div>

      {/* etiquetas das peças — só quando o calibre já está aberto */}
      <div data-part-labels className="t-mono pointer-events-none absolute inset-0 z-[4] hidden md:block">
        {[
          { t: "PONTE", l: "60%", y: "22%" },
          { t: "TREM 05", l: "68%", y: "52%" },
          { t: "TOURBILLON", l: "50%", y: "60%" },
          { t: "ROTOR", l: "34%", y: "58%" },
        ].map((d) => (
          <span key={d.t} data-part-label className="absolute text-[10px] tracking-[0.14em] opacity-0" style={{ left: d.l, top: d.y }}>
            {d.t}
          </span>
        ))}
      </div>

      {/* cursor com atraso temporal (lei do mundo) */}
      <div data-time-cursor className="absolute inset-0 z-[4] hidden md:block">
        {[0, 1, 2, 3].map((k) => (
          <span key={k} data-ghost className="absolute left-0 top-0 block h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-current opacity-0" />
        ))}
      </div>
    </div>
  );
}
