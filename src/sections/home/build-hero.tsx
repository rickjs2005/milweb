"use client";

import { useCallback, useRef, type CSSProperties } from "react";
import { CompilerFallback } from "@/features/compiler/fallback";
import { HeroGlobe } from "@/features/globe/HeroGlobe";
import { HeroGlobeFallback } from "@/features/globe/HeroGlobeFallback";
import { globe, globeFrame, resetGlobeFrame } from "@/features/globe/globe-store";
import type { HeroVisualVariant } from "@/features/hero-visual/hero-visual.types";
import { gsap, EASE, MQ, useGSAP } from "@/animations/gsap";
import { loadSplitText } from "@/animations/split-text";
import { onIdle } from "@/animations/idle";

export type BuildHeroStrings = {
  headline: readonly string[];
  /** [linha, caractere] do glifo que vira o globo — vem do dicionário, é dado de idioma */
  orb: readonly [number, number];
  support: string[];
  stages: readonly string[];
  inspect: string;
  scroll: string;
  sub: string;
  cta: string;
};

/**
 * O DOM "cru" do hero — o que o visitante vê antes de qualquer design. As duas
 * linhas de script são o conceito da manchete escrito como código, no mesmo
 * tom técnico do resto: textura de interface, não piada.
 */
const CODE = [
  "<body>",
  '  <main data-act="build">',
  "    <h1>MILWEB</h1>",
  "    <script>",
  "      const world = build();",
  "      world.move();",
  "    </script>",
  '    <canvas id="globe" />',
  "  </main>",
  "</body>",
];

/**
 * Roteiro da cena — a ÚNICA fonte de verdade do progresso narrativo. A
 * timeline tem duração exatamente 1 (posição == progresso do ScrollTrigger) e
 * recebe estas marcas como labels.
 *
 *   0.00–0.18  ESTRUTURA    manchete estável, wireframe se desenha, órbita apagada
 *   0.18–0.40  DESIGN       grid desce, código recua, o sistema de coordenadas aparece
 *   0.40–0.58  MOTION       parallax curto da manchete; a primeira linha cede foco
 *   0.58–0.72  INTERAÇÃO    o "O" perde a haste: anel tipográfico → círculo → volume
 *   0.72–0.86  EXPERIÊNCIA  profundidade, meridianos e continentes; o globo migra
 *   0.86–0.94  (ainda EXP.) globo formado, marcador do Brasil acende
 *   0.94–1.00  ENTREGA      sub + CTA; o globo cresce e sai lateralmente para o Selected Work
 */
export const HERO_SCENE = {
  design: 0.18,
  focus: 0.4,
  morph: 0.58,
  sphere: 0.72,
  formed: 0.86,
  outro: 0.94,
} as const;
/**
 * Roteiro MOBILE — mesmas chaves, ritmo mais curto: o pin é de 220 % em vez de
 * 320 %, então cada etapa tem menos scroll para acontecer e a transformação do
 * "O" começa mais cedo (é o momento que o celular precisa ver inteiro).
 */
export const HERO_SCENE_MOBILE = {
  design: 0.14,
  focus: 0.36,
  morph: 0.52,
  sphere: 0.66,
  formed: 0.82,
  outro: 0.9,
} as const;

const STAGE_BOUNDS = [HERO_SCENE.design, HERO_SCENE.focus, HERO_SCENE.morph, HERO_SCENE.sphere, HERO_SCENE.outro];
const stageAt = (p: number) => {
  let i = 0;
  while (i < 5 && p >= STAGE_BOUNDS[i]) i++;
  return i;
};

/**
 * --chars (linha mais longa, desktop) e --chars-m (mobile) para o .t-fit-hero.
 * No mobile só as linhas ANTERIORES à do globo quebram palavra a palavra; a
 * linha do globo fica inteira ("O MUNDO." numa linha só, como pede a
 * composição), então é o comprimento dela que dita o tamanho ali.
 */
function fitVars(lines: readonly string[]): CSSProperties {
  const chars = Math.max(1, ...lines.map((l) => l.length));
  const head = lines.slice(0, -1).flatMap((l) => l.split(" ").map((w) => w.length));
  const charsM = Math.max(1, ...head, lines[lines.length - 1].length);
  return { "--chars": chars, "--chars-m": charsM } as CSSProperties;
}

/** Quebra uma linha em palavras marcando em qual delas (e em que posição) está o glifo do globo. */
function words(line: string, orbAt: number | null) {
  let pos = 0;
  return line.split(" ").map((w) => {
    const start = pos;
    pos += w.length + 1;
    const at = orbAt !== null && orbAt >= start && orbAt < start + w.length ? orbAt - start : null;
    return { w, at };
  });
}

/**
 * ACT 02 — BUILD. Uma ideia só: **códigos movem o mundo**, e o mundo nasce da
 * própria tipografia. O "O" da manchete não é substituído por um globo — ele
 * VIRA um: a haste da letra afina até ser a silhueta da esfera, o vazio interno
 * do "O" vira volume, aparecem meridianos e continentes, e só então o globo
 * migra para o vazio da direita. Um ScrollTrigger pinado dirige uma timeline; o
 * canvas (features/globe) deriva tudo do mesmo `progress`, então rolar para
 * trás desfaz a cena exatamente ao contrário.
 *
 * Reduced-motion: manchete completa e globo em estado final estático (SVG).
 */
export function BuildHero({ s, act, visual = "globe", workHref = "#work" }: { s: BuildHeroStrings; act: string; visual?: HeroVisualVariant; workHref?: string }) {
  const root = useRef<HTMLElement>(null);
  const getHero = useCallback(() => root.current, []);
  const [orbLine, orbIndex] = s.orb;

  useGSAP(
    () => {
      let SplitText: Awaited<ReturnType<typeof loadSplitText>> | null = null;
      const el = root.current!;
      const q = gsap.utils.selector(el);
      const stage = q<HTMLElement>("[data-stage]");
      const h1 = el.querySelector<HTMLElement>("h1")!;
      const setStage = (i: number) =>
        stage.forEach((n, k) => {
          n.classList.toggle("is-active", k === i);
          n.classList.toggle("is-past", k < i);
        });

      const mm = gsap.matchMedia();
      let disposed = false;

      /** A cena. `small` = tablet/mobile (pin mais curto, camadas escondidas, sem SplitText). */
      const scene = (small: boolean) => {
        // O SplitText reescreve o innerHTML das palavras que recebe — o
        // <span data-orb> e a régua de linha de base morreriam junto. A palavra do
        // globo fica FORA dele e entra com uma revelação própria.
        const split = SplitText && !small ? SplitText.create(h1.querySelectorAll("[data-word]:not([data-orb-word])"), { type: "chars", mask: "chars", aria: "none" }) : null;
        const orbWord = q("[data-orb-word]");
        // A máscara do SplitText é uma caixa com `overflow: clip` na altura da
        // linha — e a linha aqui tem 0,86 em. O acento de "CÓDIGOS" mora ACIMA
        // da altura de caixa alta, então ficava cortado e a manchete lia
        // "CODIGOS". A máscara só serve para a entrada; assim que a revelação
        // termina ela é liberada e o acento volta.
        const masks = split ? split.chars.map((c) => c.parentElement).filter((n): n is HTMLElement => !!n) : [];
        const unmask = () => masks.forEach((m) => (m.style.overflow = "visible"));
        const reveal = () => {
          if (split) gsap.to(split.chars, { yPercent: 0, stagger: 0.012, duration: 0.9, ease: EASE.outExpo, overwrite: true, onComplete: unmask });
          gsap.to(orbWord, { yPercent: 0, autoAlpha: 1, duration: 0.9, ease: EASE.outExpo, overwrite: true });
        };
        const root2 = document.documentElement;
        // A manchete sobe no fim da introdução (evento do Boot). Se o Boot já
        // liberou (data-headline), ela entra na hora, sem depender de um evento passado.
        if (split && root2.classList.contains("booting") && root2.dataset.headline !== "1") {
          gsap.set(split.chars, { yPercent: 110 });
          gsap.set(orbWord, { yPercent: 45, autoAlpha: 0 });
          window.addEventListener("mw:headline", reveal, { once: true });
        } else {
          unmask();
        }

        resetGlobeFrame();
        const orbEl = el.querySelector<HTMLElement>("[data-orb]");
        gsap.set(q("[data-outro]"), { autoAlpha: 0, y: 12 });
        if (orbEl) orbEl.style.opacity = "1";
        if (!small) {
          gsap.set(q("[data-layer=wire] > *"), { scaleX: 0, transformOrigin: "left center" });
          gsap.set(q("[data-layer=grid] > *"), { scaleY: 0, transformOrigin: "top" });
          gsap.set(q("[data-orbit]"), { autoAlpha: 0, scale: 1.12, transformOrigin: "center" });
          // O código já está escrito quando o Boot revela o hero (entrada por
          // tempo, não por scroll: o estágio 0 nunca fica vazio).
          gsap.from(q("[data-layer=code] span"), { autoAlpha: 0, x: -6, stagger: 0.05, duration: 0.3, delay: 0.3 });
        }

        const S = small ? HERO_SCENE_MOBILE : HERO_SCENE;
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          // O `sync` do globo tem que seguir a TIMELINE, não o scroll. Com
          // `scrub` os dois andam separados: o ScrollTrigger avisa na hora em
          // que a posição de scroll muda, mas os valores só chegam ao destino
          // ~0,8 s depois. Ligado só ao scroll, um salto seguido de parada
          // chamava `sync()` com fade ainda 0, o rAF nunca ligava e o globo
          // simplesmente não era desenhado.
          onUpdate: () => {
            globe.sync();
            // a letra só cede lugar se houver anel para ocupá-lo
            if (orbEl) orbEl.style.opacity = globe.mounted ? String(globeFrame.glyph) : "1";
          },
          scrollTrigger: {
            trigger: el,
            start: "top top",
            end: small ? "+=220%" : "+=320%",
            pin: true,
            // O Hero é o ÚNICO trigger pinado da Home e está acima de todos os
            // outros: ele precisa ser medido primeiro, senão o ScrollTrigger
            // calcula as posições das seções de baixo sem a distância do pin.
            // Sem isto, os quatro atos do Selected Work nasciam com `start`
            // 3456 px adiantado (a própria distância do pin) e chegavam ao
            // estado final antes de o visitante ver o primeiro — e um
            // `ScrollTrigger.refresh()` não corrige, porque a ordenação do
            // refresh usa exatamente este campo.
            refreshPriority: 1,
            scrub: small ? 0.5 : 0.8,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (st) => setStage(stageAt(st.progress)),
            onToggle: () => globe.sync(),
          },
        });
        for (const [k, v] of Object.entries(S)) tl.addLabel(k, v);

        // 01 ESTRUTURA — o wireframe se desenha a partir do código; a dica some
        tl.to(q("[data-hint]"), { autoAlpha: 0, duration: 0.04 }, 0.03);
        if (!small) {
          tl.to(q("[data-layer=wire] > *"), { scaleX: 1, stagger: 0.012, duration: 0.06, ease: EASE.outExpo }, 0.02);
          // 02 DESIGN — grid desce, código recua, o sistema de coordenadas se monta
          tl.to(q("[data-layer=grid] > *"), { scaleY: 1, stagger: 0.006, duration: 0.08 }, S.design);
          tl.to(q("[data-layer=code]"), { scale: 0.55, autoAlpha: 0.1, transformOrigin: "left top", duration: 0.08 }, S.design);
          tl.to(q("[data-layer=wire] > *"), { autoAlpha: 0.18, duration: 0.08 }, S.design + 0.06);
          tl.to(q("[data-orbit]"), { autoAlpha: 1, scale: 1, duration: 0.14, ease: EASE.outExpo }, S.design + 0.02);
        } else {
          tl.to(q("[data-layer=code]"), { autoAlpha: 0.12, duration: 0.1 }, S.design);
        }

        // 03 MOTION — parallax curto (só transform: a caixa da manchete não muda de
        // tamanho em nenhum momento da cena, e é isso que mantém o layout parado)
        // No celular o parallax é maior porque tem trabalho a fazer: o bloco de
        // código sai de cena (12 % de opacidade) mas continua ocupando altura no
        // fluxo, e sem isso sobra um vazio grande acima da manchete no fim da cena.
        tl.to(h1, { y: small ? -36 : -26, duration: S.focus - S.design, ease: "power1.out" }, S.design);
        // ...e a primeira linha cede o foco para a linha do globo
        tl.to(q("[data-line='0']"), { autoAlpha: 0.4, y: -6, duration: S.morph - S.focus }, S.focus);

        // 04 INTERAÇÃO — a troca. O anel do canvas nasce na geometria EXATA do
        // glifo (mesmo centro, mesma elipse, mesma haste), então o cruzamento de
        // 0,03 de progresso entre texto e canvas não tem salto para ver.
        tl.to(globeFrame, { fade: 1, glyph: 0, duration: 0.02 }, S.morph - 0.01);
        // a haste afina, o vazio da letra vira volume
        tl.to(globeFrame, { morph: 1, depth: 0.5, duration: S.sphere - S.morph, ease: "power1.inOut" }, S.morph);

        // 05 EXPERIÊNCIA — profundidade, meridianos, continentes; e a migração: o
        // globo sobe primeiro e só depois desliza para a direita (o arco é feito
        // no canvas, com eases diferentes por eixo)
        tl.to(globeFrame, { depth: 1, mesh: 1, duration: S.formed - S.sphere }, S.sphere);
        tl.to(globeFrame, { land: 1, duration: (S.formed - S.sphere) * 0.85, ease: "power1.out" }, S.sphere + (S.formed - S.sphere) * 0.15);
        tl.to(globeFrame, { migrate: 1, duration: S.formed - S.sphere, ease: "power2.inOut" }, S.sphere);
        // 06 a letra se refaz. Depois que o globo já saiu da palavra (o raio dele
        // não a alcança mais), o "O" volta ao seu lugar: a manchete precisa ler
        // "O MUNDO." em repouso, não "O MUND .". Não desfaz a transformação —
        // a esta altura o globo é outro objeto, do outro lado da composição.
        tl.to(globeFrame, { glyph: 1, duration: 0.06, ease: "power1.inOut" }, S.sphere + (S.formed - S.sphere) * 0.45);
        // 07 o marcador de origem acende com o globo já formado
        tl.to(globeFrame, { mark: 1, duration: 0.05, ease: "power2.out" }, S.formed);

        // a estrutura recua de vez; a grid fica (é a assinatura do ato)
        tl.to([q("[data-layer=wire]"), q("[data-layer=code]")], { autoAlpha: 0, duration: 0.06 }, S.formed);
        // 08 ENTREGA — descrição comercial e CTA, discretos, alinhados ao grid
        tl.to(q("[data-outro]"), { autoAlpha: 1, y: 0, stagger: 0.02, duration: 0.06, ease: EASE.outExpo }, S.outro);
        // no mobile a ENTREGA é absolute (não reserva altura — ver comentário no JSX)
        // e pode colidir com o rodapé técnico numa tela baixa (320×568): o rodapé cede
        if (small) tl.to(q("[data-ship]"), { autoAlpha: 0, duration: 0.04 }, S.outro);

        // 08 SAÍDA — sem corte seco e sem vazio: o globo NÃO se apaga. Ele cresce,
        // escapa pela borda direita (a section tem overflow-hidden, então sangra)
        // e perde um pouco de densidade enquanto o pin solta e o Selected Work
        // sobe — a section leva o globo embora junto com ela. Apagá-lo aqui
        // deixava a metade direita vazia exatamente no frame da ENTREGA.
        tl.to(globeFrame, { migrate: 1.55, fade: 0.62, duration: 1 - S.outro, ease: "power1.in" }, S.outro);
        tl.to(q("[data-orbit]"), { autoAlpha: 0, scale: 1.18, duration: 0.05 }, 0.95);
        if (!small) tl.to(q("[data-layer=grid]"), { autoAlpha: 0.45, duration: 0.04 }, 0.96);
        tl.to(q("[data-layer=stages]"), { autoAlpha: 0.35, duration: 0.04 }, 0.96);
        // duração exatamente 1 → labels/posições == progresso
        tl.to({}, { duration: 0.001 }, 0.999);
        if (process.env.NODE_ENV !== "production") {
          (window as unknown as { __mwHero?: unknown }).__mwHero = {
            frame: globeFrame,
            get p() { return tl.scrollTrigger?.progress ?? -1; },
            get tlp() { return tl.progress(); },
          };
        }

        return () => {
          window.removeEventListener("mw:headline", reveal);
          split?.revert();
          resetGlobeFrame();
          globe.sync();
        };
      };

      // ---------- DESKTOP (ponteiro fino, sem reduced-motion): espera o SplitText ----------
      const desktop = () => mm.add(`${MQ.fine} and ${MQ.noReduce} and (min-width: 720px)`, () => scene(false));
      // O download + registro do plugin sai do caminho da hidratação: espera o
      // navegador ficar ocioso. Até lá a manchete está no DOM, legível e sem animação.
      const cancelIdle = onIdle(() => {
        void loadSplitText().then((St) => {
          if (disposed) return;
          SplitText = St;
          desktop();
        });
      }, 900);

      // ---------- TABLET / MOBILE (sem reduced-motion): a mesma cena, pin mais curto ----------
      // (duas queries disjuntas em vez de "or": Safari < 16.4 não entende o "or" de nível 4)
      const small = () => {
        gsap.set([q("[data-layer=wire]"), q("[data-layer=grid]"), q("[data-orbit]")], { display: "none" });
        return scene(true);
      };
      mm.add(`${MQ.mobile} and ${MQ.noReduce}`, small);
      mm.add(`${MQ.coarse} and (min-width: 720px) and ${MQ.noReduce}`, small);

      // ---------- REDUCED MOTION: composição final estática, globo em SVG ----------
      mm.add(MQ.reduce, () => {
        setStage(5);
        gsap.set([q("[data-layer=wire]"), q("[data-layer=grid]"), q("[data-hint]"), q("[data-layer=code]"), q("[data-orbit]")], { display: "none" });
      });

      return () => {
        disposed = true;
        cancelIdle();
        mm.revert();
      };
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="top"
      data-act={act}
      data-inspect="HERO"
      className="relative flex min-h-[100svh] flex-col overflow-hidden px-margin pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-nav md:pb-8"
    >
      {/* GRID 12 (camada de design) */}
      <div data-layer="grid" aria-hidden="true" className="pointer-events-none absolute inset-x-margin inset-y-0 z-0 hidden md:grid" style={{ gridTemplateColumns: "repeat(12, minmax(0, 1fr))", columnGap: "var(--gutter)" }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className="block h-full border-l border-neutral last:border-r" />
        ))}
      </div>

      {/* WIREFRAME (camada de estrutura) — à esquerda continua o esqueleto da
          página; a caixa que existia à direita (o lugar da figura) saiu: aquele
          espaço agora é do sistema de coordenadas, logo abaixo. */}
      <div data-layer="wire" aria-hidden="true" className="pointer-events-none absolute inset-x-margin top-nav bottom-8 z-0 hidden md:block">
        <span className="absolute inset-x-0 top-0 h-10 border border-dashed border-ink/50" />
        <span className="absolute inset-x-0 top-[14%] h-[52%] border border-dashed border-ink/50" />
        <span className="absolute bottom-0 left-0 h-16 w-[30%] border border-dashed border-ink/50" />
        <span className="absolute bottom-0 right-0 h-16 w-[30%] border border-dashed border-ink/50" />
      </div>

      {/* ÓRBITA / COORDENADAS — moldura técnica da região onde o globo termina.
          Quadrado sobre uma fração fixa da altura útil: acompanha o mesmo raio
          do globo (que também é limitado pela altura) em qualquer viewport. */}
      {/* ÓRBITA / COORDENADAS — moldura técnica da região onde o globo termina.
          Centrada no MESMO ponto do globo e com 1,34× o diâmetro dele: precisa
          conter a esfera, não competir com ela. Quadrado sobre uma fração da
          altura da section — o raio do globo também é limitado pela altura, então
          os dois crescem juntos em qualquer viewport. */}
      <div data-orbit aria-hidden="true" hidden={visual !== "globe"} className="pointer-events-none absolute left-[77%] top-[37%] z-[1] hidden aspect-square h-[70%] -translate-x-1/2 -translate-y-1/2 md:block">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <circle cx="50" cy="50" r="49" fill="none" stroke="rgb(var(--ink))" strokeOpacity="0.13" strokeWidth="0.16" strokeDasharray="1.4 2.6" />
          {/* anel-alvo: exatamente o raio final do globo (r = 0,25 H, caixa = 0,35 H
              → 35,7 em 100). A esfera pousa dentro dele — a moldura é um destino,
              não um enfeite. */}
          <circle cx="50" cy="50" r="35.7" fill="none" stroke="rgb(var(--neutral))" strokeWidth="0.22" />
          <ellipse cx="50" cy="50" rx="35.7" ry="12" fill="none" stroke="rgb(var(--ink))" strokeOpacity="0.09" strokeWidth="0.16" transform="rotate(-20 50 50)" />
          <line x1="50" y1="0" x2="50" y2="4" stroke="rgb(var(--ink))" strokeOpacity="0.3" strokeWidth="0.25" />
          <line x1="50" y1="96" x2="50" y2="100" stroke="rgb(var(--ink))" strokeOpacity="0.3" strokeWidth="0.25" />
          <line x1="0" y1="50" x2="4" y2="50" stroke="rgb(var(--ink))" strokeOpacity="0.3" strokeWidth="0.25" />
          <line x1="96" y1="50" x2="100" y2="50" stroke="rgb(var(--ink))" strokeOpacity="0.3" strokeWidth="0.25" />
        </svg>
        <p className="t-mono absolute -bottom-5 right-0 tnum text-ink-3">MW/GLOBE · LAT −15.79 · LON −47.88</p>
      </div>

      {/* CÓDIGO (estado zero) — assinatura técnica, baixa prioridade */}
      <pre data-layer="code" aria-hidden="true" className="t-code relative z-10 mt-4 text-ink-3 md:absolute md:left-margin md:top-[calc(var(--nav-h)+2.5rem)] md:mt-0 md:text-ink-2">
        {CODE.map((l) => (
          <span key={l} className="block">
            {l}
          </span>
        ))}
      </pre>

      {/* ESTÁGIOS — hierarquia: atual em tinta, passados apagados, futuros mais ainda */}
      <ol data-layer="stages" aria-hidden="true" className="t-mono absolute right-margin top-[calc(var(--nav-h)+2.5rem)] z-10 hidden whitespace-nowrap text-right md:block">
        {s.stages.map((st, i) => (
          <li key={st} data-stage className="tnum text-ink [&.is-active]:signal-dot">
            0{i + 1} {st}
          </li>
        ))}
      </ol>

      {/* O VISUAL. No globo: SVG no HTML (reduced-motion / sem GPU) + o canvas,
          que fica ABAIXO da manchete de propósito — assim o globo nunca cobre
          texto, e nasce exatamente no buraco que o "O" transparente deixa. */}
      {visual === "globe" ? (
        <>
          <HeroGlobeFallback />
          <HeroGlobe hero={getHero} />
        </>
      ) : (
        <CompilerFallback className="pointer-events-none absolute right-margin top-[24%] z-[1] w-[38%] max-w-[520px] md:top-[18%]" />
      )}

      {/* TIPOGRAFIA (o LCP) — colunas 1–8, alinhada à esquerda; o maior elemento
          da cena do começo ao fim. A caixa NUNCA muda de tamanho durante o
          scroll: só mudam opacidade e posição. */}
      <div className="relative z-10 mt-6 md:mt-auto">
        <h1 className="t-display t-display-xl t-fit-hero text-ink" style={fitVars(s.headline)} data-inspect="HERO_TITLE" aria-label={s.headline.join(" ")}>
          {s.headline.map((line, i) => (
            <span key={line} data-line={i} className="block whitespace-nowrap">
              {words(line, i === orbLine ? orbIndex : null).map(({ w, at }, k, arr) => (
                <span
                  key={`${w}-${k}`}
                  data-word
                  data-orb-word={at !== null ? "" : undefined}
                  // no mobile as linhas ANTERIORES à do globo quebram palavra a
                  // palavra; a linha do globo fica inteira ("O MUNDO." junto)
                  className={i < s.headline.length - 1 ? "max-md:block" : undefined}
                >
                  {at === null ? (
                    w
                  ) : (
                    <>
                      {w.slice(0, at)}
                      <span data-orb className="relative">
                        {w[at]}
                        {/* Régua de largura zero alinhada à linha de base: dá a
                            posição EXATA da linha de base e a altura de caixa alta
                            ao canvas, sem depender das métricas da fonte que o
                            navegador acabou usando. Ver features/globe/orb-metrics. */}
                        <i data-orb-cap aria-hidden="true" className="inline-block h-[0.72em] w-0 align-baseline" />
                      </span>
                      {w.slice(at + 1)}
                    </>
                  )}
                  {k < arr.length - 1 ? " " : ""}
                </span>
              ))}
            </span>
          ))}
        </h1>

        {/* ENTREGA — sub + CTA, entram depois da ação. Bloco de leitura curto de
            propósito (≈320 px no desktop): presença editorial, hierarquia
            claramente abaixo da manchete, e o CTA logo abaixo da sub com respiro
            suficiente para não ler como a mesma linha de texto.
            (Não é grid: `col-span-*` do Tailwind emite o atalho `grid-column`,
            que zera o `grid-column-start` de um `col-start-1` declarado num
            breakpoint anterior — era isso que jogava o CTA para a coluna 4, ao
            lado da sub, em vez de abaixo dela.)
            No mobile fica fora do fluxo (absolute): enquanto invisível
            (autoAlpha 0) não pode reservar altura — a 320×568 código+manchete+
            ENTREGA+rodapé em fluxo normal não cabem. */}
        <div className="mt-6 max-w-none max-md:absolute max-md:inset-x-0 max-md:top-full md:mt-10 md:max-w-[340px]">
          <p data-outro className="text-[length:var(--step-0)] leading-snug text-ink-2 md:max-w-[32ch]">
            {s.sub}
          </p>
          <p data-outro className="mt-5 md:mt-6">
            <a href={workHref} className="t-mono inline-flex items-center gap-2 border-b border-ink pb-1 text-ink transition-colors duration-fast hover:border-ink-2 hover:text-ink-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal">
              {s.cta}
            </a>
          </p>
        </div>
      </div>

      {/* SHIP — rodapé técnico do ato, com respiro acima da borda */}
      <div data-ship className="grid-12 relative z-10 mt-auto items-end t-mono md:mt-[8svh]">
        <ul className="col-span-4 space-y-0.5 text-ink-3 md:col-span-4">
          {s.support.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <p className="col-span-2 text-ink-3 md:col-span-4 md:text-center">
          {/* DICA DE SCROLL (estágio 0) — no rodapé técnico, sem colidir com o suporte */}
          <span data-hint aria-hidden="true" className="mb-0.5 hidden text-ink-3 md:block">
            ↓ {s.scroll}
          </span>
          MW/001
        </p>
        <p className="col-span-2 text-right text-ink-3 md:col-span-4">
          <span className="signal-dot" />
          {s.inspect}
        </p>
      </div>
    </section>
  );
}
