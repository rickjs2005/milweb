"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, RotateCcw } from "lucide-react";
import { UI, type Locale } from "@/lib/content";
import { makeT } from "@/lib/i18n";

/**
 * A vitrine do hero: um terminal executa `milweb build --premium` e, a cada
 * etapa concluída (✓), o site do cliente NASCE no preview logo abaixo —
 * header, hero, produtos, WhatsApp — até o deploy preencher a URL e o
 * terminal se recolher na própria barra de título, deixando o site pronto
 * como protagonista. A narrativa é o serviço: "você vê a MilWeb
 * construindo".
 *
 * Tudo DOM + CSS (nítido em qualquer DPR, i18n, zero WebGL). Estética de
 * ferramenta de produto, não de filme hacker: nada de verde Matrix, glitch
 * ou loading fake — só o checklist honesto e o site aparecendo.
 *
 * reduced-motion: pula direto pro estado final (terminal recolhido, site
 * completo, URL no ar) — a informação toda, sem coreografia.
 */

const TYPE_MS_MIN = 26;
const TYPE_MS_JIT = 34;
const STEP_WORK_MS = 620; // "▸ etapa..." girando antes do ✓
const STEP_GAP_MS = 380;

type Stage = "idle" | "build" | "steps" | "deploy" | "deployed" | "done";

export function HeroBuilder({ locale }: { locale: Locale }) {
  const t = makeT(locale);
  const B = UI.hero.builder;
  const steps = B.steps.map((s) => t(s));

  const [stage, setStage] = useState<Stage>("idle");
  const [cmd1, setCmd1] = useState("");
  const [cmd2, setCmd2] = useState("");
  const [done, setDone] = useState(0); // etapas com ✓
  const [working, setWorking] = useState(false); // etapa atual em "▸"
  const [run, setRun] = useState(0); // replay: incrementa e o efeito recomeça
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStage("done");
      setCmd1(t(B.cmdBuild));
      setCmd2(t(B.cmdDeploy));
      setDone(steps.length);
      return;
    }

    setStage("idle");
    setCmd1("");
    setCmd2("");
    setDone(0);
    setWorking(false);

    /* Timeline por timeouts encadeados em async/await. O cleanup limpa os
       timers pendentes — o wait nunca resolve e a cadeia simplesmente para,
       sem setState depois do unmount nem duas timelines competindo. */
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timers.current.push(window.setTimeout(resolve, ms));
      });
    const type = async (text: string, set: (s: string) => void) => {
      for (let i = 1; i <= text.length; i++) {
        set(text.slice(0, i));
        await wait(TYPE_MS_MIN + Math.random() * TYPE_MS_JIT);
      }
    };

    (async () => {
      await wait(900); // entrada do hero-anim primeiro
      setStage("build");
      await type(t(B.cmdBuild), setCmd1);
      await wait(420);
      setStage("steps");
      for (let i = 0; i < steps.length; i++) {
        setWorking(true);
        await wait(STEP_WORK_MS);
        setWorking(false);
        setDone(i + 1);
        await wait(STEP_GAP_MS);
      }
      await wait(420);
      setStage("deploy");
      await type(t(B.cmdDeploy), setCmd2);
      await wait(560);
      setStage("deployed");
      await wait(1400);
      setStage("done");
    })();

    const saved = timers.current;
    return () => {
      saved.forEach(clearTimeout);
      timers.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, run]);

  const cursor = (
    <span className="ml-0.5 inline-block h-[1.05em] w-[0.55ch] translate-y-[0.15em] animate-pulse bg-accent-soft/80" aria-hidden />
  );
  const finished = stage === "done";
  const deployed = stage === "deployed" || finished;

  return (
    <div
      data-hero
      /* z-20 e não z-[2]: o container do texto (irmão) é `relative z-10` e
         ocupa a seção inteira — abaixo disso, a div transparente dele engole
         o clique do "reexecutar" mesmo com pointer-events-auto no botão. */
      className="pointer-events-none relative z-20 mt-10 w-full max-w-lg xl:absolute xl:left-[55%] xl:right-[5%] xl:top-1/2 xl:mt-0 xl:w-auto xl:max-w-xl xl:-translate-y-1/2"
    >
      {/* Resumo pra leitor de tela: a coreografia é visual, a informação não. */}
      <p className="sr-only">{t(B.srSummary)}</p>

      {/* ===== Terminal ===== */}
      <div
        aria-hidden
        className="overflow-hidden rounded-xl border border-line/15 bg-bg/70 shadow-lg shadow-black/20 backdrop-blur-sm"
      >
        {/* Barra de título — é o que sobra do terminal depois do deploy;
            clicável pra reexecutar a construção. */}
        <button
          type="button"
          tabIndex={-1}
          onClick={() => finished && setRun((r) => r + 1)}
          className={`pointer-events-auto flex w-full items-center gap-2 px-4 py-2.5 text-left ${
            finished ? "cursor-pointer" : "cursor-default"
          }`}
        >
          <span className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-line/25" />
            <span className="h-2.5 w-2.5 rounded-full bg-line/25" />
            <span className="h-2.5 w-2.5 rounded-full bg-line/25" />
          </span>
          <span className="ml-2 font-mono text-[11px] tracking-wide text-fg-subtle">milweb@studio ~</span>
          <span
            className={`ml-auto flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-fg-subtle transition-opacity duration-500 ${
              finished ? "opacity-70" : "opacity-0"
            }`}
          >
            <RotateCcw className="h-3 w-3" />
            {t(B.replay)}
          </span>
        </button>

        {/* Corpo: colapsa quando termina — o terminal "vira" só a barra. */}
        <div
          className={`grid transition-[grid-template-rows,opacity] duration-700 ease-out ${
            finished ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="space-y-1.5 border-t border-line/10 px-4 py-3.5 font-mono text-[13px] leading-relaxed text-fg-muted">
              <p>
                <span className="select-none text-accent">$ </span>
                <span className="text-fg">{cmd1}</span>
                {stage === "build" && cursor}
              </p>

              {steps.map((s, i) => {
                const isDone = i < done;
                const isWorking = i === done && working;
                if (!isDone && !isWorking) return null;
                return (
                  <p key={s} className="flex items-center gap-2 pl-4">
                    {isDone ? (
                      <span className="text-accent-soft">✓</span>
                    ) : (
                      <span className="inline-block h-3 w-3 animate-spin rounded-full border border-line/30 border-t-accent" />
                    )}
                    <span className={isDone ? "" : "text-fg-subtle"}>{s}</span>
                  </p>
                );
              })}

              {(stage === "deploy" || deployed) && (
                <p className="pt-1">
                  <span className="select-none text-accent">$ </span>
                  <span className="text-fg">{cmd2}</span>
                  {stage === "deploy" && cursor}
                </p>
              )}
              {deployed && (
                <p className="flex items-center gap-2 pl-4">
                  <span className="text-accent-soft">✓</span>
                  <span className="text-accent-soft">{t(B.url)}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== Preview: o site nascendo ===== */}
      <div
        aria-hidden
        className={`mt-4 overflow-hidden rounded-xl border border-line/15 bg-bg transition-all duration-700 ease-out ${
          done > 0 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        } ${finished ? "scale-100 shadow-2xl shadow-accent/10" : "scale-[0.985] shadow-lg shadow-black/20"}`}
      >
        {/* Chrome do navegador: a URL preenche no deploy. */}
        <div className="flex items-center gap-3 border-b border-line/10 bg-white/[0.02] px-4 py-2.5">
          <span className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-line/25" />
            <span className="h-2.5 w-2.5 rounded-full bg-line/25" />
            <span className="h-2.5 w-2.5 rounded-full bg-line/25" />
          </span>
          <span
            className={`mx-auto flex items-center gap-1.5 rounded-md px-3 py-1 font-mono text-[11px] transition-colors duration-500 ${
              deployed ? "bg-accent/10 text-accent-soft" : "bg-line/10 text-fg-subtle"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full transition-colors duration-500 ${deployed ? "bg-accent" : "bg-line/30"}`}
            />
            {deployed ? t(B.url) : "···"}
          </span>
          <span className="w-12" />
        </div>

        {/* 1ª etapa: header e navegação */}
        <Reveal show={done >= 1}>
          <div className="flex items-center justify-between border-b border-line/10 px-5 py-3">
            <span className="text-[11px] font-bold tracking-[0.18em] text-fg">{t(B.preview.brand)}</span>
            <span className="flex gap-4">
              {B.preview.nav.map((n) => (
                <span key={n.pt} className="text-[11px] text-fg-subtle">
                  {t(n)}
                </span>
              ))}
            </span>
          </div>
        </Reveal>

        {/* 2ª etapa: hero do cliente */}
        <Reveal show={done >= 2}>
          <div className="px-5 pb-5 pt-6">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-accent-soft">{t(B.preview.eyebrow)}</p>
            <p className="mt-2 max-w-[24ch] text-xl font-bold leading-snug tracking-tight text-fg">{t(B.preview.tagline)}</p>
            <p className="mt-2 max-w-[42ch] text-xs leading-relaxed text-fg-muted">{t(B.preview.sub)}</p>
          </div>
        </Reveal>

        {/* 3ª etapa: a prateleira de produtos */}
        <Reveal show={done >= 3}>
          <div className="grid grid-cols-3 gap-2.5 px-5 pb-5">
            {[0.14, 0.09, 0.05].map((a) => (
              <div key={a} className="rounded-lg border border-line/10 p-2.5">
                <div className="h-10 rounded-md" style={{ background: `rgb(var(--accent) / ${a})` }} />
                <div className="mt-2 h-1.5 w-3/4 rounded-full bg-line/20" />
                <div className="mt-1.5 h-1.5 w-1/2 rounded-full bg-line/10" />
              </div>
            ))}
          </div>
        </Reveal>

        {/* 4ª etapa: conversão — CTA + FAB do WhatsApp (verde de verdade,
            pequeno: é a assinatura do canal, não a paleta do site). */}
        <Reveal show={done >= 4}>
          <div className="relative flex items-center justify-between border-t border-line/10 px-5 py-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-[11px] font-semibold text-accent-fg">
              <MessageCircle className="h-3 w-3" />
              {t(B.preview.cta)}
            </span>
            <span className="text-[10px] text-fg-subtle">© {t(B.preview.brand)}</span>
            <span className="absolute -top-5 right-5 flex h-9 w-9 items-center justify-center rounded-full bg-[#25d366] shadow-md shadow-black/30">
              <MessageCircle className="h-4 w-4 text-white" />
            </span>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

/* Seção do preview que "nasce": altura + fade + leve subida, na ordem em que
   o terminal conclui cada etapa. grid-rows 0fr→1fr anima altura real sem
   max-height mágico (que ou corta ou atrasa a transição). */
function Reveal({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`grid transition-[grid-template-rows,opacity,transform] duration-700 ease-out ${
        show ? "translate-y-0 grid-rows-[1fr] opacity-100" : "translate-y-2 grid-rows-[0fr] opacity-0"
      }`}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}
