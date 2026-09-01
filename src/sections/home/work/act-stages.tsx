import Image from "next/image";
import type { CSSProperties } from "react";
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
   Território sob análise. Três planos, cada um com um papel:

     o campo é o AMBIENTE     — a placa da lavoura dentro de uma janela de varredura
     a topografia é a LÍNGUA  — contornos e rotas lendo o terreno atrás de tudo
     o drone é o PROTAGONISTA — um render com alfa real, à frente, cruzando a moldura

   A janela não é uma foto num retângulo: ela nasce como fenda, é LIDA pela
   linha de varredura (o que ainda não foi lido fica sob um véu da cor do papel)
   e é ela que solta as leituras técnicas conforme a linha passa. O drone tem
   recorte alfa de verdade (assado a partir do render de produto, 900 px), por
   isso pode ficar meio dentro, meio fora da janela sem ler como PNG colado —
   e sem `multiply`, que fazia o tanque branco sumir sobre o verde. */
const KAVITA_READOUTS = ["LAT 19°55′ S · LON 43°56′ W", "T70P · ALT 42 M", "SWATH 7,0 M · COV 14,6 HA/H", "SPRAY SYSTEM ACTIVE"];

function KavitaStage({ image, detail }: { image: string; detail: string }) {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <svg data-topo className="absolute inset-0 h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" fill="none" stroke="currentColor" strokeWidth="0.75" strokeLinecap="round">
        {CONTOURS.map((d, i) => (
          <path key={i} data-contour d={d} pathLength="1" opacity={(0.3 - (i % 6) * 0.03).toFixed(2)} />
        ))}
        {ROUTES.map((d, i) => (
          <path key={"r" + i} data-route d={d} pathLength="1" opacity="0.45" />
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

      {/* A JANELA DE VARREDURA — a lavoura (cafezal em MG: horizonte, morros,
          fileiras convergindo) sangra pela direita. A imagem é 10 % mais alta
          que a caixa para o parallax vertical nunca mostrar borda. */}
      <div data-media className="absolute right-[-4%] top-[max(15%,136px)] z-[2] h-[44%] w-[60%] overflow-hidden max-md:left-margin max-md:right-margin max-md:top-[max(15%,136px)] max-md:h-[30%] max-md:w-auto" style={{ viewTransitionName: "case-media-kavita-drones" }} data-inspect="MEDIA">
        <span data-crop className="absolute inset-x-0 -inset-y-[5%] block">
          <Image src={image} alt="" fill loading="lazy" sizes="(min-width: 720px) 62vw, 100vw" className="object-cover object-[46%_58%]" />
        </span>
        {/* a varredura: a linha lê de cima para baixo; o que está abaixo dela
            ainda não foi lido e fica sob um véu da cor do papel. O invólucro
            inteiro desliza (yPercent 0 → 100), então linha e véu têm um só dono. */}
        <span data-scan className="pointer-events-none absolute inset-0 block">
          <span className="absolute inset-x-0 top-0 block h-[200%]" style={{ background: "rgb(242 240 234 / 0.74)" }} />
          <span className="absolute inset-x-0 -top-14 block h-14 bg-gradient-to-b from-transparent to-signal/35" />
          <span className="absolute inset-x-0 top-0 block h-px bg-signal" />
        </span>
        {/* moldura técnica: régua de marcas no topo, cantos e o rótulo da leitura */}
        <span data-frame className="pointer-events-none absolute inset-0 block border border-ink/25">
          <svg className="absolute inset-x-0 top-0 h-2 w-full" viewBox="0 0 100 4" preserveAspectRatio="none">
            {Array.from({ length: 41 }).map((_, k) => (
              <line key={k} x1={(k * 2.5).toFixed(1)} y1="0" x2={(k * 2.5).toFixed(1)} y2={k % 4 === 0 ? 4 : 2} stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" opacity="0.5" />
            ))}
          </svg>
          <span className="t-mono absolute left-3 top-4 text-[10px] tracking-[0.14em] opacity-70 max-md:hidden">SCAN 01</span>
        </span>
      </div>

      {/* O DRONE — protagonista. A caixa tem a proporção exata do recorte
          (900 × 442), então os cantos de alvo abraçam a silhueta de verdade. O
          alvo é filho da caixa: herda todo movimento do drone sem ter dono
          próprio de transform. */}
      <div data-media-b className="absolute left-[35%] top-[41%] z-[3] aspect-[900/442] w-[28%] max-md:left-[0%] max-md:top-[37%] max-md:w-[70%]" data-inspect="DRONE">
        <Image src={detail} alt="" fill loading="lazy" sizes="(min-width: 720px) 28vw, 66vw" className="object-contain" />
        <span data-target className="absolute inset-[6%] block opacity-0">
          <span className="absolute left-0 top-0 h-4 w-4 border-l border-t border-current opacity-70" />
          <span className="absolute right-0 top-0 h-4 w-4 border-r border-t border-current opacity-70" />
          <span className="absolute bottom-0 left-0 h-4 w-4 border-b border-l border-current opacity-70" />
          <span className="absolute bottom-0 right-0 h-4 w-4 border-b border-r border-current opacity-70" />
          <span className="t-mono absolute -bottom-5 right-0 whitespace-nowrap text-[10px] tracking-[0.14em] opacity-70">DJI AGRAS T70P</span>
        </span>
      </div>

      {/* leituras técnicas: uma por vez, cada uma no instante em que a linha
          de varredura passa pela região que ela descreve (horizonte → drone →
          faixa de aplicação → bicos). Nunca todas acesas ao mesmo tempo. */}
      <div data-readout className="t-mono absolute right-margin top-[62%] z-[4] hidden text-right md:block">
        {KAVITA_READOUTS.map((t) => (
          <p key={t} data-coord className="tnum whitespace-nowrap opacity-0">
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
   Matéria. Um diagrama editorial em duas figuras, não uma colagem:

     FIG. 01 (A, atrás, à direita)  — o GRÃO: matéria caindo no resfriador, fogo embaixo
     FIG. 02 (B, à frente, à esquerda) — a TORRA: as mãos no braço, o processo humano

   ...e a manchete fecha a frase: do grão → processo → à xícara. As duas são
   fotografia do projeto (1500 px, sem a interface do site), com o papel como
   FUNDO — nunca um filtro por cima de tudo, que era o que deixava manchete,
   mídia e textura no mesmo plano.

   GEOMETRIA COM DESTINO. As bordas das figuras caem exatamente sobre as guias
   que o Vertex vai desenhar (x = 28 %, 50 % e 94 %; y = 18,67 % — as linhas
   403/720/1354 e 168 do viewBox 1440 × 900 do ato seguinte). Na saída, as
   marcas de corte de cada figura se estendem até as bordas da tela: os frames
   viram as linhas de projeto do próximo ato, sem fade-out/fade-in.

   INVÓLUCRO × CAIXA. `[data-media-wrap]` é o dono do MOVIMENTO (parallax do
   scroll em yPercent/xPercent, profundidade do cursor em x/y) e carrega marcas,
   rótulo e linhas — filhos, que herdam o movimento sem ter transform próprio.
   `[data-media]` é a CAIXA: clipa, abre como cortina (clip-path) e leva o
   `view-transition-name` até o hero do case. Dentro dela `[data-crop]` faz o
   movimento interno (scale + deriva lateral: a matéria viva). */
const TERRAL_MARKS = [
  { at: "left-0 top-0", h: "-left-4 top-0", v: "left-0 -top-4" },
  { at: "right-0 top-0", h: "-right-4 top-0", v: "right-0 -top-4" },
  { at: "left-0 bottom-0", h: "-left-4 bottom-0", v: "left-0 -bottom-4" },
  { at: "right-0 bottom-0", h: "-right-4 bottom-0", v: "right-0 -bottom-4" },
] as const;

/** Marcas de corte (registro de impressão) nos quatro cantos de uma figura. */
function CropMarks() {
  return (
    <>
      {TERRAL_MARKS.map((m) => (
        <span key={m.at} className="contents">
          <span data-mark className={`absolute ${m.h} block h-px w-2.5 bg-current opacity-0 max-md:hidden`} />
          <span data-mark className={`absolute ${m.v} block h-2.5 w-px bg-current opacity-0 max-md:hidden`} />
        </span>
      ))}
    </>
  );
}

/** As bordas da figura estendidas até a tela — as linhas de projeto do Vertex nascendo aqui. */
function EdgeLines({ sides }: { sides: ("left" | "right" | "top")[] }) {
  return (
    <>
      {sides.includes("left") ? (
        <>
          <span data-line-v className="absolute bottom-full left-0 block h-[100svh] w-px origin-bottom scale-y-0 bg-current opacity-60 max-md:hidden" />
          <span data-line-v className="absolute left-0 top-full block h-[100svh] w-px origin-top scale-y-0 bg-current opacity-60 max-md:hidden" />
        </>
      ) : null}
      {sides.includes("right") ? (
        <>
          <span data-line-v className="absolute bottom-full right-0 block h-[100svh] w-px origin-bottom scale-y-0 bg-current opacity-60 max-md:hidden" />
          <span data-line-v className="absolute right-0 top-full block h-[100svh] w-px origin-top scale-y-0 bg-current opacity-60 max-md:hidden" />
        </>
      ) : null}
      {sides.includes("top") ? (
        <>
          <span data-line-h className="absolute right-full top-0 block h-px w-[100vw] origin-right scale-x-0 bg-current opacity-60 max-md:hidden" />
          <span data-line-h className="absolute left-full top-0 block h-px w-[100vw] origin-left scale-x-0 bg-current opacity-60 max-md:hidden" />
        </>
      ) : null}
    </>
  );
}

const MONO: CSSProperties = { fontFamily: "var(--font-mono), ui-monospace, monospace", letterSpacing: "0.14em" };

function TerralStage({ image, detail }: { image: string; detail: string }) {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      {/* A FIBRA DO PAPEL (a malha fina). Não é uniforme: a máscara radial a
          deixa inteira ao redor das fotografias e a leva a ~30 % atrás da
          manchete — a manchete respira sem nenhum gradiente aparecer. */}
      <span
        data-fibre
        className="absolute inset-0"
        style={{
          backgroundImage: "repeating-linear-gradient(94deg, rgba(31,23,16,0.05) 0 1px, transparent 1px 7px), repeating-linear-gradient(2deg, rgba(31,23,16,0.034) 0 1px, transparent 1px 11px)",
          maskImage: "radial-gradient(62% 56% at 68% 38%, #000 0%, rgba(0,0,0,0.62) 52%, rgba(0,0,0,0.3) 100%)",
          WebkitMaskImage: "radial-gradient(62% 56% at 68% 38%, #000 0%, rgba(0,0,0,0.62) 52%, rgba(0,0,0,0.3) 100%)",
        }}
      />
      {/* o papel: ruído de impressão sobre a folha inteira, percebido mais do
          que visto (a timeline o segura em 0,08) */}
      <span data-paper className="grain pointer-events-none absolute inset-0 opacity-0" />

      {/* FIG. 01 — GRÃO. Esquerda em 50 %, direita em 94 %, topo em 18,67 %:
          as guias 720/1354/168 do Vertex. Não sangra: tem margem da borda. */}
      <div data-media-wrap className="absolute left-[50%] right-[6%] top-[18.67%] z-[2] h-[40%] max-md:left-[18%] max-md:right-margin max-md:top-[14%] max-md:h-[36%]" data-inspect="FIG_01">
        <div data-media className="absolute inset-0 overflow-hidden" style={{ viewTransitionName: "case-media-terral" }} data-inspect="MEDIA">
          {/* 4 % de folga em volta: o zoom e a deriva nunca mostram borda */}
          <span data-crop className="absolute -inset-[4%] block">
            <Image src={image} alt="" fill loading="lazy" sizes="(min-width: 720px) 48vw, 80vw" className="object-cover object-[50%_45%]" />
          </span>
          <span data-grain className="grain pointer-events-none absolute inset-0 opacity-0" />
        </div>
        {/* a borda técnica: nasce apagada e endurece na saída, quando a foto some e sobra o frame */}
        <span data-frame className="pointer-events-none absolute inset-0 block border border-current opacity-0" />
        <CropMarks />
        <EdgeLines sides={["left", "right", "top"]} />
        <span data-fig className="absolute -top-5 left-0 whitespace-nowrap text-[10px] opacity-0 max-md:hidden" style={MONO}>
          FIG. 01
        </span>
      </div>

      {/* FIG. 02 — TORRA. Esquerda em 28 % (guia 403 do Vertex), sobrepondo o
          canto inferior esquerdo da FIG. 01 só parcialmente. Termina em 56 %:
          a metadata mora em ~59 % a 768 px de altura e ~64 % a 1080. */}
      <div data-media-b-wrap className="absolute left-[28%] top-[34%] z-[3] h-[22%] w-[27%] max-md:left-margin max-md:top-[44%] max-md:h-[22%] max-md:w-[62%]" data-inspect="FIG_02">
        <div data-media-b className="absolute inset-0 overflow-hidden">
          <span data-crop className="absolute -inset-[3%] block">
            <Image src={detail} alt="" fill loading="lazy" sizes="(min-width: 720px) 28vw, 56vw" className="object-cover object-[55%_55%]" />
          </span>
          <span data-grain className="grain pointer-events-none absolute inset-0 opacity-0" />
        </div>
        <span data-frame className="pointer-events-none absolute inset-0 block border border-current opacity-0" />
        <CropMarks />
        <EdgeLines sides={["left"]} />
        <span data-fig className="absolute -top-5 left-0 whitespace-nowrap text-[10px] opacity-0 max-md:hidden" style={MONO}>
          FIG. 02
        </span>
      </div>

      {/* A CURVA DE TORRA — instrumento editorial, só eixos e a marca do
          primeiro crack: nenhum número que possa ler como dado do cliente. Mora
          na coluna vazia à esquerda da FIG. 02, alinhada à guia 86 do Vertex. */}
      <svg data-roast className="absolute left-[6%] top-[41%] z-[2] hidden w-[14%] opacity-0 md:block" viewBox="0 0 200 110" fill="none" stroke="currentColor" strokeWidth="1">
        <line x1="20" y1="8" x2="20" y2="92" vectorEffect="non-scaling-stroke" opacity="0.5" />
        <line x1="20" y1="92" x2="192" y2="92" vectorEffect="non-scaling-stroke" opacity="0.5" />
        <path data-roast-curve pathLength="1" d="M20 90 C58 88 78 74 102 56 C126 40 148 30 192 24" vectorEffect="non-scaling-stroke" opacity="0.8" />
        <g data-roast-label opacity="0">
          <line x1="132" y1="34" x2="132" y2="92" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" opacity="0.45" />
          <circle cx="132" cy="36" r="2.2" fill="currentColor" stroke="none" />
          <text x="138" y="30" fontSize="8" fill="currentColor" stroke="none" style={MONO}>
            1ST CRACK
          </text>
        </g>
        <text data-roast-label x="6" y="14" fontSize="8" fill="currentColor" stroke="none" opacity="0" style={MONO}>
          °C
        </text>
        <text data-roast-label x="172" y="106" fontSize="8" fill="currentColor" stroke="none" opacity="0" style={MONO}>
          MIN
        </text>
      </svg>

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
