"use client";

import { useEffect, useRef, useState } from "react";
import { on, emit } from "./hero-bus";
import { UI, type Locale } from "@/lib/content";
import { makeT } from "@/lib/i18n";

/**
 * A linha de terminal que "compila" cada formação da cena. É DOM de verdade
 * (nítido em qualquer DPR, legível por leitor de tela, entra no i18n) — o
 * canvas só recebe a POSIÇÃO dela via bus pra sugar/explodir os glifos dali.
 *
 * Dois modos:
 * - desktop (cena montada): dirigido pelo bus — digita quando a cena pede.
 * - mobile/sem cena: loop autônomo digita as linhas como eco da ideia.
 * - reduced-motion: primeira linha completa, estática, sem loop.
 */
const TYPE_MS_MIN = 34;
const TYPE_MS_JIT = 46;
const EXEC_PAUSE = 420; // pausa pós-linha antes do "Enter"
const MOBILE_HOLD = 2600;

export function HeroTerminal({ locale }: { locale: Locale }) {
  const t = makeT(locale);
  const lines = UI.hero.terminal.lines.map((l) => t(l));
  const [shown, setShown] = useState("");
  const [lineIdx, setLineIdx] = useState(0);
  const [running, setRunning] = useState(false); // true = linha "executada" (some no desktop)
  const wrap = useRef<HTMLDivElement>(null);
  const driven = useRef(false); // cena assumiu o controle?
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  /* Digita `text` e chama onDone ao final (jitter humano no timing).
     Limpa qualquer timer pendente antes de começar: sem isso, um type()
     disparado pelo loop autônomo e outro disparado pela cena (ver bug do
     fallback abaixo) escrevem no mesmo `shown` ao mesmo tempo e a linha
     sai emendada/cortada. */
  const type = (text: string, onDone: () => void) => {
    clearTimeout(timer.current);
    let i = 0;
    const tick = () => {
      i += 1;
      setShown(text.slice(0, i));
      if (i < text.length) timer.current = setTimeout(tick, TYPE_MS_MIN + Math.random() * TYPE_MS_JIT);
      else timer.current = setTimeout(onDone, EXEC_PAUSE);
    };
    tick();
  };

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setShown(lines[0]);
      return;
    }

    const typeFor = (index: number) => {
      setLineIdx(index);
      setRunning(false);
      setShown("");
      type(lines[index % lines.length], () => {
        // centro da linha em NDC — a cena converte pra mundo
        const r = wrap.current?.getBoundingClientRect();
        const origin = r
          ? { x: ((r.left + r.width / 2) / window.innerWidth) * 2 - 1, y: -(((r.top + r.height / 2) / window.innerHeight) * 2 - 1) }
          : { x: 0.5, y: 0.3 };
        setRunning(true);
        emit("line-executed", { index: index % lines.length, origin });
      });
    };

    const offReady = on("scene-ready", ({ index }) => {
      driven.current = true;
      typeFor(index);
    });
    const offCollapse = on("collapse-done", ({ index }) => typeFor(index));

    /* Fallback autônomo (mobile / cena não montou): mesmo gate de
       hero-scene.tsx (1280 + hover fino) decide QUANTO esperar pela cena —
       não um número fixo. A medição real (console.timeStamp em dev) mostrou
       scene-ready variando de ~2,2s a mais de 6s: a cena amostra 16 mil
       partículas × 4 formas em pixels de canvas 2D de forma SÍNCRONA no
       mount (useMemo em hero-scene-canvas.tsx), e isso trava a main thread
       — inclusive os próprios timers deste componente — por um tempo que
       depende só da CPU de quem está vendo. Um fallback de 1,2s (o valor
       original) disparava sempre ANTES do scene-ready real em qualquer
       máquina um pouco mais lenta, e os dois loops (autônomo e dirigido
       pela cena) brigavam pelo mesmo `shown` — a causa da linha aparecer
       cortada/travada em "milw" nos primeiros testes visuais. 9s é maior
       que qualquer boot observado e ainda funciona como rede de segurança
       se o WebGL falhar silenciosamente depois do gate de hero-scene.tsx.
       Em mobile/tablet a cena nunca monta (hero-scene.tsx nem tenta), então
       não há corrida pra evitar: começa quase de imediato. */
    const mightHaveScene = window.matchMedia("(min-width: 1280px) and (hover: hover) and (pointer: fine)").matches;
    const auto = setTimeout(
      () => {
        if (driven.current) return;
        let i = 0;
        const loop = () => {
          if (driven.current) return; // cena assumiu entre uma linha e outra
          setLineIdx(i % lines.length);
          setShown("");
          type(lines[i % lines.length], () => {
            timer.current = setTimeout(() => {
              i += 1;
              loop();
            }, MOBILE_HOLD);
          });
        };
        loop();
      },
      mightHaveScene ? 9000 : 300,
    );

    return () => {
      offReady();
      offCollapse();
      clearTimeout(auto);
      clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  /* Clique-colapso: escuta na SEÇÃO (canvas é pointer-events-none) e ignora
     cliques em qualquer link/botão — CTAs continuam donos do clique. */
  useEffect(() => {
    const section = wrap.current?.closest("section") ?? document.getElementById("top");
    if (!section) return;
    const onClick = (e: Event) => {
      if ((e.target as HTMLElement).closest("a, button")) return;
      emit("collapse-request", undefined);
    };
    section.addEventListener("click", onClick);
    return () => section.removeEventListener("click", onClick);
  }, []);

  return (
    <div
      ref={wrap}
      data-hero
      className={`pointer-events-none z-[2] mt-8 w-fit rounded-lg border border-line/15 bg-bg/60 px-4 py-2.5 font-mono text-sm text-accent-soft backdrop-blur-sm transition-opacity duration-300 xl:absolute xl:left-[56%] xl:top-[30%] xl:mt-0 ${
        /* !important: este <div> carrega data-hero, então o hero-anim.tsx
           (animação de entrada genérica) também o pega no `gsap.set([data-hero],
           {autoAlpha: 0})` inicial e deixa um `style="opacity: 1"` inline gravado
           no elemento depois do tween de entrada. Esse inline sempre venceria um
           `xl:opacity-0` comum — o esconde-mostra do "running" nunca aparecia. */
        running ? "xl:!opacity-0" : "opacity-100"
      }`}
    >
      <span className="mr-2 select-none text-accent" aria-hidden>
        {t(UI.hero.terminal.prompt)}
      </span>
      <span aria-hidden>{shown}</span>
      <span className="ml-0.5 inline-block h-[1.05em] w-[0.55ch] translate-y-[0.15em] animate-pulse bg-accent-soft/80" aria-hidden />
      <span className="sr-only">{lines[lineIdx]}</span>
    </div>
  );
}
