"use client";

import { useRef, type CSSProperties } from "react";
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
  sub: string;
  cta: string;
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
 * Roteiro da cena — a ÚNICA fonte de verdade do progresso narrativo.
 * A timeline do BuildHero tem duração exatamente 1 (posição == progresso do
 * ScrollTrigger) e recebe estas marcas como labels; a ponte do Milo lê as
 * labels da própria timeline. Sem números soltos em mais nenhum lugar.
 *
 *   0.00–0.10  ESTRUTURA     headline estável, Milo fora da tela, grid em repouso
 *   0.10–0.20  DESIGN        grid desce, código recua — ANTES de Milo entrar
 *   0.20–0.55  MOTION        Milo entra ANDANDO (0.20–0.45), desacelera, fecha o
 *                            passo e firma os pés (0.45–0.55) — tudo é "motion"
 *   0.55–0.78  INTERAÇÃO     ombro → cotovelo → mão chega em "PESSOAS." (0.55–0.60); no toque
 *                            (0.60) a frase e a mão se movem JUNTAS até assentar (0.76)
 *   0.78–0.90  EXPERIÊNCIA   braço conclui, grid guarda memória da deformação, energia cai
 *   0.90–1.00  ENTREGA       descrição comercial + VER PROJETOS ↓
 *
 * (corrigido: antes o rótulo "MOTION" só acendia DEPOIS de Milo já ter parado
 * de andar — o limite de DESIGN/MOTION agora é o mesmo instante em que a
 * caminhada começa, e DESIGN vira uma janela curta e anterior a ela.)
 */
export const HERO_SCENE = {
  design: 0.1,
  walkStart: 0.2,
  walkEnd: 0.45,
  armStart: 0.55,
  contact: 0.6,
  pullEnd: 0.76,
  settle: 0.78,
  outro: 0.9,
} as const;
/**
 * Roteiro MOBILE — mesma forma de `HERO_SCENE` (mesmas chaves, pin mais curto),
 * mas o ritmo é outro: no celular o Milo é pequeno e a mini-história tem que
 * caber num pin de 220% em vez de 320%. Além das chaves de `HERO_SCENE`, o
 * cenário mobile usa dois instantes locais (não são labels): `revealStart`
 * (0.62, início do reveal de "PESSOAS.") e `gripEnd` (0.80, fim do "segurar"
 * antes do puxão) — ficam como const no corpo de `scene()`, não aqui, porque
 * `S` é lido como união de `HERO_SCENE | HERO_SCENE_MOBILE` e as duas
 * precisam ter exatamente as mesmas chaves.
 *
 *   0.00–0.15  ESTADO INICIAL   headline incompleta ("PESSOAS." ainda oculta), Milo fora da tela
 *   0.15–0.42  CAMINHADA        Milo entra andando pela direita, em direção ao fim da frase
 *   0.42–0.56  APROXIMAÇÃO      desacelera, braço se prepara
 *   0.56–0.70  CHEGADA          "PESSOAS." aparece (0.62→0.70), sincronizada com a mão chegando
 *   0.70–0.80  CONTATO          mão segura a frase — pausa breve antes do puxão
 *   0.80–0.90  PUXÃO            a frase estica como uma faixa elástica presa à esquerda
 *   0.90–0.96  RECUPERAÇÃO      alongamento recua um pouco (nunca 100% → 0%, sem "boing")
 *   0.96–1.00  SAÍDA            entrega comercial some / cede lugar à próxima seção
 */
export const HERO_SCENE_MOBILE = {
  design: 0.06,
  walkStart: 0.15,
  walkEnd: 0.42,
  armStart: 0.56,
  contact: 0.7,
  pullEnd: 0.9,
  settle: 0.96,
  outro: 0.97,
} as const;
/** wdth/wght da headline: estável e legível antes do contato; peso total ao assentar */
export const HEADLINE_AXES = { from: { wdth: 105, wght: 700 }, to: { wdth: 125, wght: 900 } } as const;
const STAGE_BOUNDS = [HERO_SCENE.design, HERO_SCENE.walkStart, HERO_SCENE.armStart, HERO_SCENE.settle, HERO_SCENE.outro];
const stageAt = (p: number) => {
  let i = 0;
  while (i < 5 && p >= STAGE_BOUNDS[i]) i++;
  return i;
};

/** --chars (linha mais longa, desktop) e --chars-m (palavra mais longa, mobile) para o .t-fit-hero */
function fitVars(lines: readonly string[]): CSSProperties {
  const chars = Math.max(1, ...lines.map((l) => l.length));
  const charsM = Math.max(1, ...lines.flatMap((l) => l.split(" ")).map((w) => w.length));
  return { "--chars": chars, "--chars-m": charsM } as CSSProperties;
}

/**
 * ACT 02 — BUILD. Uma cena: o Milo entra andando pela direita, encontra a
 * frase e puxa "MOVER PESSOAS." para si — a Archivo ganha largura e peso sob
 * a mão dele; grid, partículas e refração respondem no ponto de força. Um
 * ScrollTrigger pinado dirige uma timeline; o canvas deriva tudo do mesmo
 * `progress` (features/milo/hero/MiloHeroBridge).
 *
 * Tablet/mobile: a mesma cena com pin mais curto e distância menor.
 * Reduced-motion: composição final estática (Milo em cena, headline, sub, CTA).
 */
export function BuildHero({ s, act, visual = "compiler", workHref = "#work" }: { s: BuildHeroStrings; act: string; visual?: HeroVisualVariant; workHref?: string }) {
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
      const setStage = (i: number) =>
        stage.forEach((n, k) => {
          n.classList.toggle("is-active", k === i);
          n.classList.toggle("is-past", k < i);
        });

      const mm = gsap.matchMedia();
      let disposed = false;

      /** A cena. `small` = tablet/mobile (pin mais curto, camadas escondidas, sem SplitText). */
      const scene = (small: boolean) => {
        const split = SplitText && !small ? SplitText.create(h1.querySelectorAll("[data-word]"), { type: "chars", mask: "chars", aria: "none" }) : null;
        const reveal = () => split && gsap.to(split.chars, { yPercent: 0, stagger: 0.012, duration: 0.9, ease: EASE.outExpo, overwrite: true });
        const root2 = document.documentElement;
        // A headline sobe no fim da introdução (evento do Boot). Se o Boot já
        // liberou (data-headline), ela entra na hora, sem depender de um evento passado.
        if (split && root2.classList.contains("booting") && root2.dataset.headline !== "1") {
          gsap.set(split.chars, { yPercent: 110 });
          window.addEventListener("mw:headline", reveal, { once: true });
        }
        const A = HEADLINE_AXES;
        // Eixos da headline: um objeto tweenado, escrito no <h1> em onUpdate. (GSAP escreve
        // "0" em custom properties sem unidade quando a timeline scrubada é invalidada — a
        // fonte clampa em 62 e o layout salta no contato. Assim é determinístico e reversível.)
        const axes = { wdth: A.from.wdth, wght: A.from.wght };
        const applyAxes = () => {
          h1.style.setProperty("--wdth", axes.wdth.toFixed(2));
          h1.style.setProperty("--wght", axes.wght.toFixed(1));
          h1.style.fontStretch = `${axes.wdth.toFixed(2)}%`;
          h1.style.fontWeight = String(Math.round(axes.wght));
        };
        applyAxes();
        gsap.set(q("[data-outro]"), { autoAlpha: 0, y: 12 });
        if (!small) {
          gsap.set(q("[data-layer=wire] > *"), { scaleX: 0, transformOrigin: "left center" });
          gsap.set(q("[data-layer=grid] > *"), { scaleY: 0, transformOrigin: "top" });
          // O código já está escrito quando o Boot revela o hero (entrada por
          // tempo, não por scroll: o estágio 0 nunca fica vazio).
          gsap.from(q("[data-layer=code] span"), { autoAlpha: 0, x: -6, stagger: 0.07, duration: 0.3, delay: 0.3 });
        }
        // Estado inicial: o Milo está TOTALMENTE fora da tela. O SVG (o que
        // existe antes do canvas, ou quando a GPU é reprovada) entra pela
        // direita no mesmo trecho da caminhada — sem pernas, mas no mesmo tempo.
        if (fallback && visual === "milo") gsap.set(fallback, { xPercent: 160, x: "12vw" });

        const S = small ? HERO_SCENE_MOBILE : HERO_SCENE;
        // No mobile a última palavra ("PESSOAS.") começa oculta (clip-path) — a headline
        // "incompleta" pedida no roteiro — e só aparece no instante em que a mão do Milo chega.
        const lastWord = small ? q("[data-headline-word=last]") : null;
        if (lastWord) gsap.set(lastWord, { clipPath: "inset(0 100% 0 0)", transformOrigin: "left center" });
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: el,
            start: "top top",
            end: small ? "+=220%" : "+=320%",
            pin: true,
            scrub: small ? 0.5 : 0.8,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (st) => setStage(stageAt(st.progress)),
          },
        });
        for (const [k, v] of Object.entries(S)) tl.addLabel(k, v);

        // 01 ESTRUTURA — o wireframe se desenha a partir do código; a dica some
        tl.to(q("[data-hint]"), { autoAlpha: 0, duration: 0.04 }, 0.03);
        if (!small) {
          tl.to(q("[data-layer=wire] > *"), { scaleX: 1, stagger: 0.012, duration: 0.06, ease: EASE.outExpo }, 0.02);
          // 02 DESIGN — grid desce, código recua enquanto o Milo entra
          // DESIGN acontece ANTES da caminhada (0.10→0.20): grid desce, código recua
          tl.to(q("[data-layer=grid] > *"), { scaleY: 1, stagger: 0.006, duration: 0.08 }, S.design);
          tl.to(q("[data-layer=code]"), { scale: 0.55, autoAlpha: 0.12, transformOrigin: "left top", duration: 0.08 }, S.design);
          tl.to(q("[data-layer=wire] > *"), { autoAlpha: 0.18, duration: 0.08 }, S.design + 0.06);
          // durante a INTERAÇÃO o código recua mais um pouco — menos disputa com a mão/frase
          tl.to(q("[data-layer=code]"), { autoAlpha: 0.05, duration: 0.06 }, S.armStart);
        } else {
          tl.to(q("[data-layer=code]"), { autoAlpha: 0.12, duration: 0.1 }, S.design);
        }
        if (fallback && visual === "milo") tl.to(fallback, { xPercent: 0, x: 0, duration: S.walkEnd - S.walkStart, ease: EASE.smooth }, S.walkStart);
        if (!small) {
          // 04 INTERAÇÃO (desktop) — no CONTATO a frase começa a se mover com a mão: wdth/wght
          // sobem do estado estável ao peso total (contact → pullEnd).
          // power2.out: a frase reage desde o primeiro frame do empurrão e desacelera junto com o braço
          tl.to(axes, { wdth: A.to.wdth, wght: A.to.wght, duration: S.pullEnd - S.contact, ease: "power2.out", onUpdate: applyAxes }, S.contact);
        } else if (lastWord) {
          // 04 INTERAÇÃO (mobile) — sem eixo variável de peso (risco de overflow numa tela
          // estreita); em vez disso "PESSOAS." é revelada por clip-path exatamente quando a
          // mão chega (reveal termina em S.contact), depois um puxão-elástico controlado por
          // pullAmount (heroFrame.push) em MiloHeroBridge já reage o corpo ao alongamento.
          const revealStart = 0.62;
          const gripEnd = 0.8;
          tl.to(lastWord, { clipPath: "inset(0 0% 0 0)", duration: S.contact - revealStart, ease: "power2.out" }, revealStart);
          // 05 CONTATO/GARRA — mão segura a palavra; pausa breve (revealStart→gripEnd já passou o
          // contato) antes do puxão — sem isso o salto direto pro alongamento não lê como "pegar"
          // 06 PUXÃO — a palavra estica como uma faixa presa à esquerda (transform-origin left):
          // o lado da mão (direita) se move mais, a âncora (esquerda) não se move
          tl.to(lastWord, { scaleX: 1.14, skewX: -2, letterSpacing: "0.03em", duration: S.pullEnd - gripEnd, ease: "power2.out" }, gripEnd);
          // 07 RECUPERAÇÃO ELÁSTICA — nunca elastic.out (sensação premium, não "boing" de desenho);
          // 100% do alongamento recua só até ~94%, ease controlado
          tl.to(lastWord, { scaleX: 1.06, skewX: 0, letterSpacing: "0.012em", duration: S.settle - S.pullEnd, ease: "power3.inOut" }, S.pullEnd);
        }
        // 05 EXPERIÊNCIA — a estrutura recua de vez; a grid fica (é o papel do Milo)
        tl.to([q("[data-layer=wire]"), q("[data-layer=code]")], { autoAlpha: 0, duration: 0.06 }, S.settle);
        // 06 ENTREGA — descrição comercial e CTA, discretos, alinhados ao grid
        tl.to(q("[data-outro]"), { autoAlpha: 1, y: 0, stagger: 0.02, duration: 0.06, ease: EASE.outExpo }, S.outro);
        // no mobile a ENTREGA é absolute (não reserva altura — ver comentário acima do bloco) e
        // pode colidir com o rodapé técnico numa tela baixa (320×568); o rodapé cede o lugar
        if (small) tl.to(q("[data-ship]"), { autoAlpha: 0, duration: 0.04 }, S.outro);
        // saída: a grid e o rodapé técnico abaixam um pouco antes do pin soltar — o Selected Work
        // entra sobre um Hero já em repouso, sem corte seco
        if (!small) tl.to(q("[data-layer=grid]"), { autoAlpha: 0.45, duration: 0.04 }, 0.96);
        tl.to(q("[data-layer=stages]"), { autoAlpha: 0.35, duration: 0.04 }, 0.96);
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

      // ---------- TABLET / MOBILE (sem reduced-motion): a mesma cena, pin mais curto ----------
      // (duas queries disjuntas em vez de "or": Safari < 16.4 não entende o "or" de nível 4)
      const small = () => {
        gsap.set([q("[data-layer=wire]"), q("[data-layer=grid]")], { display: "none" });
        return scene(true);
      };
      mm.add(`${MQ.mobile} and ${MQ.noReduce}`, small);
      mm.add(`${MQ.coarse} and (min-width: 720px) and ${MQ.noReduce}`, small);

      // ---------- REDUCED MOTION: composição final estática, Milo em cena ----------
      mm.add(MQ.reduce, () => {
        setStage(5);
        gsap.set([q("[data-layer=wire]"), q("[data-layer=grid]"), q("[data-hint]"), q("[data-layer=code]")], { display: "none" });
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

      {/* WIREFRAME (camada de estrutura) */}
      <div data-layer="wire" aria-hidden="true" className="pointer-events-none absolute inset-x-margin top-nav bottom-8 z-0 hidden md:block">
        <span className="absolute inset-x-0 top-0 h-10 border border-dashed border-ink/50" />
        <span className="absolute inset-x-0 top-[14%] h-[52%] border border-dashed border-ink/50" />
        <span className="absolute bottom-0 left-0 h-16 w-[30%] border border-dashed border-ink/50" />
        <span className="absolute bottom-0 right-0 h-16 w-[30%] border border-dashed border-ink/50" />
        <span className="absolute right-0 top-[14%] h-[52%] w-[28%] border border-dashed border-ink/50" />
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

      {/* O VISUAL (fallback SVG no HTML; o canvas — Milo ou Compiler — desenha por cima quando pode) */}
      {visual === "milo" ? <MiloHeroFallback /> : <CompilerFallback className="pointer-events-none absolute right-margin top-[24%] z-[1] w-[38%] max-w-[520px] md:top-[18%]" />}

      {/* TIPOGRAFIA (o LCP) — colunas 1–8; a última palavra é o que a mão do Milo segura.
          O bloco vive no terço inferior, ~8svh acima do rodapé técnico — não colado no fundo. */}
      <div className="relative z-10 mt-6 md:mt-auto md:z-[1]" style={visual === "milo" ? { zIndex: 4 } : undefined}>
        <h1 className="t-display t-display-xl t-fit-hero text-ink" style={fitVars(s.headline)} data-inspect="HERO_TITLE" aria-label={s.headline.join(" ")}>
          {s.headline.map((line, i) => {
            const words = line.split(" ");
            return (
              <span key={line} data-line className="block whitespace-nowrap">
                {words.map((w, k) => (
                  // no mobile cada palavra é uma linha (o layout não muda durante a expansão)
                  <span key={w} data-word data-headline-word={i === last && k === words.length - 1 ? "last" : undefined} className="max-md:block">
                    {w}
                    {k < words.length - 1 ? " " : ""}
                  </span>
                ))}
              </span>
            );
          })}
        </h1>

        {/* ENTREGA — descrição comercial + CTA (colunas 1–5), entram depois da ação.
            No mobile fica fora do fluxo (absolute, colada no fim do h1): enquanto invisível
            (autoAlpha 0) não pode reservar altura — a 320×568 code+headline+ENTREGA+rodapé
            juntos em fluxo normal já não cabem (rodapé fica cortado, ver auditoria mobile). */}
        <div className="grid-12 mt-6 gap-y-4 max-md:absolute max-md:inset-x-0 max-md:top-full md:mt-8">
          <p data-outro className="col-span-3 max-w-[24ch] text-[length:var(--step-0)] leading-snug text-ink-2 md:col-span-5 md:max-w-[34ch]">
            {s.sub}
          </p>
          <p data-outro className="col-span-4 mt-4 md:col-span-5 md:col-start-1 md:mt-0">
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
