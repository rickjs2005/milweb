"use client";

import { useRef } from "react";
import { fitLines } from "@/lib/fit";
import { CompilerFallback } from "@/features/compiler/fallback";
import { MiloHeroFallback } from "@/features/milo/hero/MiloHeroFallback";
import type { HeroVisualVariant } from "@/features/hero-visual/hero-visual.types";
import { gsap, EASE, MQ, useGSAP } from "@/animations/gsap";
import { loadSplitText } from "@/animations/split-text";
import { onIdle } from "@/animations/idle";

export type BuildHeroStrings = {
  headline: readonly string[];
  support: string[];
  stages: readonly string[];
  inspect: string;
  scroll: string;
};

/** O DOM "cru" do hero — o que o visitante vê antes de qualquer design. */
const CODE = [
  "<body>",
  "  <main data-act=\"build\">",
  "    <h1>MILWEB</h1>",
  "    <ul class=\"support\" />",
  "    <canvas id=\"webgl\" />",
  "  </main>",
  "</body>",
];

/**
 * Roteiro da cena (progresso normalizado do ScrollTrigger). A timeline tem
 * duração exatamente 1, então posições == progresso; a ponte do Milo lê
 * estas labels da própria timeline (uma fonte só para DOM e canvas).
 *
 *   0.00–0.08  ESTRUTURA    wireframe se desenha a partir do código
 *   0.08–0.20  DESIGN       grid desce, código recua — Milo ainda fora da tela
 *   0.20–0.57  MOTION       Milo entra andando pela direita e desacelera até parar
 *   0.57–0.68  INTERAÇÃO    antecipação; o braço desce até a extremidade de "PESSOAS."
 *   0.68–0.84               a mão arrasta a palavra: a headline se expande (wdth 62 → 125)
 *   0.84–0.92  EXPERIÊNCIA  impacto — recuo, reação da grid, presença mais sólida
 *   0.92–1.00  ENTREGA      composição final parada
 */
export const HERO_SCENE = {
  design: 0.08,
  walkStart: 0.2,
  walkEnd: 0.57,
  armStart: 0.57,
  contact: 0.68,
  pullEnd: 0.84,
  impactEnd: 0.92,
} as const;
const STAGE_BOUNDS = [HERO_SCENE.design, HERO_SCENE.walkStart, HERO_SCENE.armStart, HERO_SCENE.pullEnd, HERO_SCENE.impactEnd];
const stageAt = (p: number) => {
  let i = 0;
  while (i < 5 && p >= STAGE_BOUNDS[i]) i++;
  return i;
};

/**
 * ACT 02 — BUILD. O site se constrói enquanto o visitante rola: código →
 * wireframe → grid → o Milo entra andando, segura a última palavra da
 * headline e a arrasta — a Archivo se expande no eixo wdth sob a mão dele
 * — até a composição final. Um único ScrollTrigger pinado dirige uma
 * timeline; os estágios são marcas de progresso; o canvas do Milo deriva
 * tudo do mesmo `progress` (ver features/milo/hero/MiloHeroBridge).
 *
 * Mobile: a mesma narrativa com pin mais curto. Reduced-motion: composição
 * final estática (Milo em cena, headline completa), sem pin.
 */
export function BuildHero({ s, act, visual = "compiler" }: { s: BuildHeroStrings; act: string; visual?: HeroVisualVariant }) {
  const root = useRef<HTMLElement>(null);
  const last = s.headline.length - 1;

  useGSAP(
    () => {
      let SplitText: Awaited<ReturnType<typeof loadSplitText>> | null = null;
      const el = root.current!;
      const q = gsap.utils.selector(el);
      const stage = q<HTMLElement>("[data-stage]");
      const h1 = el.querySelector<HTMLElement>("h1")!;
      const fallback = el.querySelector<HTMLElement>(".milo-hero-fallback");
      const setStage = (i: number) => stage.forEach((n, k) => n.classList.toggle("is-active", k === i));

      const mm = gsap.matchMedia();
      let disposed = false;

      /** A cena (desktop com SplitText; mobile sem). `mobile` encurta o pin e pula as camadas escondidas. */
      const scene = (mobile: boolean) => {
        const split = SplitText && !mobile ? SplitText.create(h1.querySelectorAll("[data-word]"), { type: "chars", mask: "chars", aria: "none" }) : null;
        const reveal = () => split && gsap.to(split.chars, { yPercent: 0, stagger: 0.012, duration: 0.9, ease: EASE.outExpo, overwrite: true });
        const root2 = document.documentElement;
        // A headline sobe no fim da introdução (evento do Boot). Se o Boot já
        // liberou (data-headline), ela entra na hora, sem depender de um evento passado.
        if (split && root2.classList.contains("booting") && root2.dataset.headline !== "1") {
          gsap.set(split.chars, { yPercent: 110 });
          window.addEventListener("mw:headline", reveal, { once: true });
        }
        gsap.set(h1, { fontStretch: "62%", fontWeight: 400, "--wdth": 62, "--wght": 400 });
        gsap.set(q("[data-ship]"), { autoAlpha: 0 });
        if (!mobile) {
          gsap.set(q("[data-layer=wire] > *"), { scaleX: 0, transformOrigin: "left center" });
          gsap.set(q("[data-layer=grid] > *"), { scaleY: 0, transformOrigin: "top" });
          gsap.set(q("[data-layer=scan]"), { scaleX: 0, transformOrigin: "left" });
          // O código já está escrito quando o Boot revela o hero (entrada por
          // tempo, não por scroll: o estágio 0 nunca fica vazio).
          gsap.from(q("[data-layer=code] span"), { autoAlpha: 0, x: -6, stagger: 0.07, duration: 0.3, delay: 0.3 });
        }
        // Estado inicial: o Milo está TOTALMENTE fora da tela. O SVG (o que
        // existe antes do canvas, ou quando a GPU é reprovada) entra pela
        // direita no mesmo trecho da caminhada — sem pernas, mas no mesmo tempo.
        if (fallback && visual === "milo") gsap.set(fallback, { xPercent: 160, x: "12vw" });

        const S = HERO_SCENE;
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: el,
            start: "top top",
            end: mobile ? "+=220%" : "+=350%",
            pin: true,
            scrub: mobile ? 0.5 : 0.8,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (st) => setStage(stageAt(st.progress)),
          },
        });
        tl.addLabel("design", S.design);
        tl.addLabel("walkStart", S.walkStart);
        tl.addLabel("walkEnd", S.walkEnd);
        tl.addLabel("armStart", S.armStart);
        tl.addLabel("contact", S.contact);
        tl.addLabel("pullEnd", S.pullEnd);
        tl.addLabel("impactEnd", S.impactEnd);

        // 0 ESTRUTURA — o wireframe se desenha a partir do código
        tl.to(q("[data-hint]"), { autoAlpha: 0, duration: 0.04 }, 0.02);
        if (!mobile) {
          tl.to(q("[data-layer=wire] > *"), { scaleX: 1, stagger: 0.012, duration: 0.06, ease: EASE.outExpo }, 0.02);
          // 1 DESIGN — grid desce, código recua
          tl.to(q("[data-layer=grid] > *"), { scaleY: 1, stagger: 0.006, duration: 0.08 }, S.design);
          tl.to(q("[data-layer=code]"), { scale: 0.55, autoAlpha: 0.35, transformOrigin: "left top", duration: 0.1 }, S.design);
          // 2 MOTION — a estrutura recua enquanto o Milo entra
          tl.to(q("[data-layer=wire] > *"), { autoAlpha: 0.25, duration: 0.1 }, S.walkStart + 0.06);
        } else {
          tl.to(q("[data-layer=code]"), { autoAlpha: 0.35, duration: 0.1 }, S.design);
        }
        if (fallback && visual === "milo") tl.to(fallback, { xPercent: 0, x: 0, duration: S.walkEnd - S.walkStart, ease: EASE.smooth }, S.walkStart);
        // 3 INTERAÇÃO — a mão segura "PESSOAS." e arrasta: a fonte se EXPANDE (62% → 125%).
        // contact → pullEnd é exatamente este tween; o canvas lê o --wdth inline.
        // fromTo: com invalidateOnRefresh o valor inicial de --wdth seria relido como 0 (a fonte clampa em 62 e a expansão "pula")
        tl.fromTo(h1, { fontStretch: "62%", fontWeight: 400, "--wdth": 62, "--wght": 400 }, { fontStretch: "125%", fontWeight: 900, "--wdth": 125, "--wght": 900, duration: S.pullEnd - S.contact, ease: EASE.smooth, immediateRender: false }, S.contact);
        // 4 EXPERIÊNCIA — impacto: uma varredura curta em signal responde na grid
        if (!mobile) {
          tl.to(q("[data-layer=scan]"), { scaleX: 1, duration: 0.05 }, S.pullEnd);
          tl.to(q("[data-layer=scan]"), { autoAlpha: 0, duration: 0.03 }, S.pullEnd + 0.05);
          tl.to(q("[data-layer=wire] > *"), { autoAlpha: 0.5, duration: 0.02, yoyo: true, repeat: 1 }, S.pullEnd);
        }
        // 5 ENTREGA — estrutura e código somem; a composição fica. Na variante
        // milo a grid FICA: é o papel em que o Milo existe.
        const gone = visual === "milo" ? [q("[data-layer=wire]"), q("[data-layer=code]")] : [q("[data-layer=wire]"), q("[data-layer=grid]"), q("[data-layer=code]")];
        tl.to(gone, { autoAlpha: 0, duration: 0.06 }, S.impactEnd);
        tl.to(q("[data-ship]"), { autoAlpha: 1, stagger: 0.01, duration: 0.04, ease: EASE.outExpo }, S.impactEnd + 0.01);
        // duração exatamente 1 → labels/posições == progresso
        tl.to({}, { duration: 0.001 }, 0.999);

        return () => {
          window.removeEventListener("mw:headline", reveal);
          split?.revert();
        };
      };

      // ---------- DESKTOP (ponteiro fino, sem reduced-motion): espera o SplitText ----------
      const desktop = () => mm.add(`${MQ.fine} and ${MQ.noReduce} and (min-width: 720px)`, () => scene(false));
      // O download + registro do plugin sai do caminho da hidratação: espera o
      // navegador ficar ocioso. Até lá a headline está no DOM, legível e sem animação.
      const cancelIdle = onIdle(() => {
        void loadSplitText().then((St) => {
          if (disposed) return;
          SplitText = St;
          desktop();
        });
      }, 900);

      // ---------- MOBILE / TOUCH (sem reduced-motion): a mesma cena, pin mais curto, sem SplitText ----------
      // (duas queries disjuntas em vez de "or": Safari < 16.4 não entende o "or" de nível 4)
      const small = () => {
        gsap.set([q("[data-layer=wire]"), q("[data-layer=grid]"), q("[data-layer=scan]")], { display: "none" });
        return scene(true);
      };
      mm.add(`${MQ.mobile} and ${MQ.noReduce}`, small);
      mm.add(`${MQ.coarse} and (min-width: 720px) and ${MQ.noReduce}`, small);

      // ---------- REDUCED MOTION: composição final estática, Milo em cena ----------
      mm.add(MQ.reduce, () => {
        setStage(5);
        gsap.set(q("[data-ship]"), { autoAlpha: 1 });
        gsap.set([q("[data-layer=wire]"), q("[data-layer=grid]"), q("[data-layer=scan]"), q("[data-hint]")], { display: "none" });
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
      className="relative flex min-h-[92svh] flex-col justify-between overflow-hidden px-margin pb-6 pt-nav md:min-h-[100svh] md:pb-8"
    >
      {/* GRID 12 (camada de design) */}
      <div data-layer="grid" aria-hidden="true" className="pointer-events-none absolute inset-x-margin inset-y-0 z-0 hidden md:grid" style={{ gridTemplateColumns: "repeat(12, minmax(0, 1fr))", columnGap: "var(--gutter)" }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className="block h-full border-l border-neutral last:border-r" />
        ))}
      </div>

      {/* WIREFRAME (camada de estrutura) */}
      <div data-layer="wire" aria-hidden="true" className="pointer-events-none absolute inset-x-margin top-nav bottom-8 z-0 hidden md:block">
        <span className="absolute inset-x-0 top-0 h-10 border border-dashed border-ink/50" />
        <span className="absolute inset-x-0 top-[14%] h-[52%] border border-dashed border-ink/50" />
        <span className="absolute bottom-0 left-0 h-16 w-[30%] border border-dashed border-ink/50" />
        <span className="absolute bottom-0 right-0 h-16 w-[30%] border border-dashed border-ink/50" />
        <span className="absolute right-0 top-[14%] h-[52%] w-[28%] border border-dashed border-ink/50" />
      </div>

      {/* CÓDIGO (estado zero) */}
      <pre data-layer="code" aria-hidden="true" className="t-code relative z-10 mt-5 text-ink md:absolute md:left-margin md:top-[calc(var(--nav-h)+3rem)] md:mt-0">
        {CODE.map((l) => (
          <span key={l} className="block">
            {l}
          </span>
        ))}
      </pre>

      {/* DICA DE SCROLL (estágio 0) */}
      <p data-hint aria-hidden="true" className="t-mono absolute bottom-6 left-margin z-10 hidden text-ink-3 md:block md:bottom-8">
        ↓ {s.scroll}
      </p>

      {/* VARREDURA (impacto) */}
      <span data-layer="scan" aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/2 z-20 h-px bg-signal" style={visual === "milo" ? { zIndex: 5 } : undefined} />

      {/* ESTÁGIOS */}
      <ol data-layer="stages" aria-hidden="true" className="t-mono absolute right-margin top-[calc(var(--nav-h)+1.25rem)] z-10 hidden text-right text-ink-3 md:block md:top-[calc(var(--nav-h)+3rem)]">
        {s.stages.map((st, i) => (
          <li key={st} data-stage className="tnum transition-colors duration-fast [&.is-active]:text-ink [&.is-active]:signal-dot">
            0{i + 1} {st}
          </li>
        ))}
      </ol>

      {/* O VISUAL (fallback SVG no HTML; o canvas — Milo ou Compiler — desenha por cima quando pode) */}
      {visual === "milo" ? <MiloHeroFallback /> : <CompilerFallback className="pointer-events-none absolute right-margin top-[24%] z-[1] w-[38%] max-w-[520px] md:top-[18%]" />}

      {/* TIPOGRAFIA (o LCP). A última palavra é o que a mão do Milo segura. */}
      <div className="relative z-10 mt-auto pt-[18svh] md:z-[1] md:pt-[22svh]" style={visual === "milo" ? { zIndex: 4 } : undefined}>
        <h1 className="t-display t-display-xl t-fit-md text-ink" style={fitLines(s.headline)} data-inspect="HERO_TITLE" aria-label={s.headline.join(" ")}>
          {s.headline.map((line, i) => {
            const words = line.split(" ");
            return (
              <span key={line} data-line className="block whitespace-nowrap">
                {words.map((w, k) => (
                  // no mobile cada palavra é uma linha (o layout não muda durante a expansão); a última é o que a mão segura
                  <span key={w} data-word data-headline-word={i === last && k === words.length - 1 ? "last" : undefined} className="max-md:block">
                    {w}
                    {k < words.length - 1 ? " " : ""}
                  </span>
                ))}
              </span>
            );
          })}
        </h1>
      </div>

      {/* SHIP */}
      <div className="grid-12 relative z-10 mt-8 items-end t-mono">
        <ul data-ship className="col-span-4 space-y-0.5 md:col-span-4">
          {s.support.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <p data-ship className="col-span-2 text-ink-3 md:col-span-4 md:text-center">
          MW/001
        </p>
        <p data-ship className="col-span-2 text-right text-ink-3 md:col-span-4">
          <span className="signal-dot" />
          {s.inspect}
        </p>
      </div>
    </section>
  );
}
