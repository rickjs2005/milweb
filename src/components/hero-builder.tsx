"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, RotateCcw, Star } from "lucide-react";
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
const STEP_WORK_MS = 520; // "▸ etapa..." girando antes do ✓ (5 etapas agora)
const STEP_GAP_MS = 300;

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
      data-hero-builder
      /* data-hero-builder: o hero-anim coreografa este bloco à parte (boot
         com flicker de CRT ANTES do texto — ver hero-anim.tsx).
         Em xl é a SEGUNDA COLUNA do flex do hero (largura fixa, shrink-0)
         — era xl:absolute com left/top e o headline em escala de pôster
         passava por baixo do card em monitores largos. */
      className="pointer-events-none relative z-20 mt-10 w-full max-w-lg xl:mt-0 xl:w-[500px] xl:max-w-none xl:shrink-0"
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

      {/* ===== Preview: o site nascendo =====
          Cores CRAVADAS (papel claro, tinta, brasa) e NÃO tokens do tema,
          de propósito: isto é o PRODUTO ENTREGUE — um site premium claro
          brilhando contra a escuridão da página. Na 1ª versão ele herdava
          os tokens dark e virava wireframe cinza fantasma sobre o preto
          ("ficou fraco", Rick 12/08). */}
      <div
        aria-hidden
        className={`mt-4 overflow-hidden rounded-xl bg-[#f6f1e7] ring-1 ring-white/15 transition-all duration-700 ease-out ${
          done > 0 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        } ${
          finished
            ? "pv-sheen scale-100 shadow-[0_32px_90px_-24px_rgb(0_0_0/0.9),0_0_50px_-18px_rgb(232_114_44/0.35)]"
            : "scale-[0.985] shadow-[0_18px_50px_-20px_rgb(0_0_0/0.8)]"
        }`}
      >
        {/* Chrome do navegador: a URL preenche no deploy. */}
        <div className="flex items-center gap-3 border-b border-[#e2d9c6] bg-[#ece5d4] px-4 py-2.5">
          <span className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#d9cfba]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#d9cfba]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#d9cfba]" />
          </span>
          <span
            className={`mx-auto flex items-center gap-1.5 rounded-md px-3 py-1 font-mono text-[11px] transition-colors duration-500 ${
              deployed ? "bg-[#f5e3c8] text-[#a05515]" : "bg-[#e2d9c6] text-[#8d8574]"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full transition-colors duration-500 ${deployed ? "bg-[#e8722c]" : "bg-[#c4b99f]"}`}
            />
            {deployed ? t(B.url) : "···"}
          </span>
          <span className="w-12" />
        </div>

        {/* 1ª etapa: header e navegação (links descem um a um) */}
        <Reveal show={done >= 1}>
          <div className="flex items-center justify-between border-b border-[#e7dfcd] px-5 py-3">
            <span className="pv-rise font-display text-[12px] font-bold tracking-[0.18em] text-[#171410]">
              {t(B.preview.brand)}
            </span>
            <span className="flex gap-4">
              {B.preview.nav.map((n, i) => (
                <span
                  key={n.pt}
                  className="pv-rise text-[11px] font-medium text-[#8d8574]"
                  style={{ animationDelay: `${0.15 + i * 0.1}s` }}
                >
                  {t(n)}
                </span>
              ))}
            </span>
          </div>
        </Reveal>

        {/* 2ª etapa: hero do cliente — texto + banner "fotografado"
            (a imagem revela em wipe, como foto saindo do revelador). */}
        <Reveal show={done >= 2}>
          <div className="flex items-center gap-4 px-5 pb-4 pt-5">
            <div className="min-w-0 flex-1">
              <p className="pv-rise text-[10px] font-semibold uppercase tracking-[0.22em] text-[#b3641f]">
                {t(B.preview.eyebrow)}
              </p>
              <p
                className="pv-rise mt-1.5 max-w-[22ch] font-display text-[19px] font-bold leading-snug tracking-tight text-[#171410]"
                style={{ animationDelay: "0.12s" }}
              >
                {t(B.preview.tagline)}
              </p>
              <p className="pv-rise mt-1.5 max-w-[40ch] text-[11px] leading-relaxed text-[#6f695d]" style={{ animationDelay: "0.24s" }}>
                {t(B.preview.sub)}
              </p>
              <span
                className="pv-pop mt-2.5 inline-block rounded-full bg-[#1a1712] px-3 py-1 text-[10px] font-semibold text-[#f6f1e7]"
                style={{ animationDelay: "0.4s" }}
              >
                {t(B.preview.heroCta)}
              </span>
            </div>
            <div
              className="pv-wipe h-24 w-28 shrink-0 rounded-lg shadow-sm"
              style={{
                animationDelay: "0.2s",
                background:
                  "radial-gradient(circle at 68% 26%, #f6c87e 0%, rgba(246,200,126,0) 34%), linear-gradient(158deg, #2c2318 0%, #7a4c1e 52%, #d99a4e 100%)",
              }}
            />
          </div>
        </Reveal>

        {/* 3ª etapa: a prateleira — cada produto POP com mola, um por vez;
            a foto de material (latão, pedra, carvão) revela em wipe. */}
        <Reveal show={done >= 3}>
          <div className="grid grid-cols-3 gap-2.5 px-5 pb-4">
            {B.preview.products.map((p, i) => (
              <div
                key={p.price}
                className="pv-pop rounded-lg border border-[#e7dfcd] bg-[#fffdf7] p-2 shadow-sm"
                style={{ animationDelay: `${i * 0.16}s` }}
              >
                <div
                  className="pv-wipe h-14 rounded-md"
                  style={{
                    animationDelay: `${0.18 + i * 0.16}s`,
                    background: [
                      "linear-gradient(135deg,#eab568 0%,#c97b32 60%,#8f4f1a 100%)",
                      "linear-gradient(135deg,#dcd6c9 0%,#a9a091 65%,#7b7264 100%)",
                      "linear-gradient(135deg,#4a443a 0%,#26221b 70%,#131109 100%)",
                    ][i],
                  }}
                />
                <p className="mt-2 text-[10px] font-semibold text-[#2a2620]">{t(p.name)}</p>
                <p className="text-[10px] text-[#8d8574]">{p.price}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* 4ª etapa: prova social — estrelas acendem uma a uma + citação. */}
        <Reveal show={done >= 4}>
          <div className="mx-5 mb-4 rounded-lg bg-[#efe9db] px-4 py-3">
            <span className="flex items-center gap-2">
              <span className="flex gap-0.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star
                    key={i}
                    className="pv-pop h-3 w-3 fill-[#e8722c] text-[#e8722c]"
                    style={{ animationDelay: `${i * 0.09}s` }}
                  />
                ))}
              </span>
              <span className="pv-rise text-[10px] font-semibold text-[#2a2620]" style={{ animationDelay: "0.45s" }}>
                {t(B.preview.rating)}
              </span>
            </span>
            <p className="pv-rise mt-1.5 text-[11px] italic leading-snug text-[#4a453b]" style={{ animationDelay: "0.55s" }}>
              {t(B.preview.quote)}{" "}
              <span className="not-italic text-[10px] text-[#8d8574]">{t(B.preview.quoteAuthor)}</span>
            </p>
          </div>
        </Reveal>

        {/* 5ª etapa: conversão — CTA em brasa + FAB do WhatsApp (verde de
            verdade: é a assinatura do canal). O FAB é INLINE no rodapé —
            flutuando pra fora da linha, o overflow-hidden do card cortava
            o círculo ao meio (bug apontado pelo Rick, 12/08). */}
        <Reveal show={done >= 5}>
          <div className="flex items-center justify-between border-t border-[#e7dfcd] px-5 py-4">
            <span
              className="pv-pop inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-semibold text-white shadow-sm"
              style={{ background: "linear-gradient(170deg,#e8722c 0%,#d8430f 100%)" }}
            >
              <MessageCircle className="h-3 w-3" />
              {t(B.preview.cta)}
            </span>
            <span className="flex items-center gap-2.5">
              <span className="pv-rise text-[10px] text-[#8d8574]" style={{ animationDelay: "0.2s" }}>
                © {t(B.preview.brand)}
              </span>
              <span
                className="pv-pop flex h-8 w-8 items-center justify-center rounded-full bg-[#25d366] shadow-sm"
                style={{ animationDelay: "0.3s" }}
              >
                <MessageCircle className="h-4 w-4 text-white" />
              </span>
            </span>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

/* Seção do preview que "nasce": altura + fade + leve subida, na ordem em que
   o terminal conclui cada etapa. grid-rows 0fr→1fr anima altura real sem
   max-height mágico (que ou corta ou atrasa a transição).
   pv/pv-live: quando a seção liga, os filhos marcados (pv-pop/pv-wipe/
   pv-rise, com animationDelay próprio) executam a coreografia interna —
   é o que faz o site parecer CONSTRUÍDO peça a peça, não só "fade". */
function Reveal({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`pv grid transition-[grid-template-rows,opacity,transform] duration-700 ease-out ${
        show ? "pv-live translate-y-0 grid-rows-[1fr] opacity-100" : "translate-y-2 grid-rows-[0fr] opacity-0"
      }`}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}
