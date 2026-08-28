"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, EASE, MQ, ScrollTrigger, useGSAP } from "@/animations/gsap";

/* ---------------------------------------------------------------------
   VERTEX — SCROLL → ScrollTrigger → world.ts → rAF + damping → currentTime
   O diagrama é dirigido pelo scroll REAL desta seção: "target" é o
   progresso do ScrollTrigger; "damped" persegue o target por rAF, exatamente
   a mecânica descrita na engenharia do projeto (world.ts + damping).
   --------------------------------------------------------------------- */
export function VertexPipeline({ labels }: { labels: { scroll: string; progress: string; damped: string; time: string } }) {
  const root = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLSpanElement>(null);
  const dampedRef = useRef<HTMLSpanElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const barT = useRef<HTMLSpanElement>(null);
  const barD = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const world = { target: 0, damped: 0 };
      const DURATION = 132; // "dia 001 / 132": o filme do Vertex mede a obra em dias
      const st = ScrollTrigger.create({ trigger: el, start: "top 80%", end: "bottom 30%", onUpdate: (s) => (world.target = s.progress) });
      const tick = () => {
        world.damped += (world.target - world.damped) * 0.08;
        const t = world.target;
        const d = world.damped;
        if (targetRef.current) targetRef.current.textContent = t.toFixed(3);
        if (dampedRef.current) dampedRef.current.textContent = d.toFixed(3);
        if (timeRef.current) timeRef.current.textContent = `DIA ${String(Math.round(d * DURATION)).padStart(3, "0")} / ${DURATION}`;
        if (barT.current) barT.current.style.transform = `scaleX(${t})`;
        if (barD.current) barD.current.style.transform = `scaleX(${d})`;
      };
      gsap.ticker.add(tick);
      return () => {
        gsap.ticker.remove(tick);
        st.kill();
      };
    },
    { scope: root },
  );

  const Box = ({ k, v, bar }: { k: string; v?: React.ReactNode; bar?: React.RefObject<HTMLSpanElement | null> }) => (
    <div className="border border-ink p-4">
      <p className="t-mono text-ink-3">{k}</p>
      {v && <p className="t-mono mt-2 tnum text-ink">{v}</p>}
      {bar && (
        <span className="mt-3 block h-px w-full bg-neutral">
          <span ref={bar} className="block h-px w-full origin-left bg-ink" style={{ transform: "scaleX(0)" }} />
        </span>
      )}
    </div>
  );

  return (
    <div ref={root} className="grid gap-3 md:grid-cols-5" data-inspect="PIPELINE / VERTEX" aria-label="Scroll pipeline">
      <Box k="SCROLL" v={labels.scroll} />
      <Box k="ScrollTrigger" v={<span>progress = <span ref={targetRef}>0.000</span></span>} bar={barT} />
      <Box k="world.ts" v="{ scene, progress }" />
      <Box k="rAF + damping" v={<span>damped = <span ref={dampedRef}>0.000</span></span>} bar={barD} />
      <Box k="video.currentTime" v={<span ref={timeRef}>DIA 000 / 132</span>} />
    </div>
  );
}

/* ---------------------------------------------------------------------
   AUREX — explosão por peça: janela (delay / span) + smoothstep sobre um
   progresso global. A lógica é a do projeto (cada <Part> tem sua janela;
   remontagem é o caminho inverso). As janelas aqui são escalonadas em
   cascata para visualizar o mecanismo — os valores exatos vivem em cada
   <Part> do código original.
   --------------------------------------------------------------------- */
const PARTS = ["CAIXA", "BEZEL", "COROA", "MOSTRADOR", "PONTEIROS", "TREM DE ENGRENAGENS", "MOLA ESPIRAL", "ESCAPE", "ROTOR", "TOURBILLON"];
const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function AurexExplosion({ label }: { label: string }) {
  const root = useRef<HTMLDivElement>(null);
  const rows = useRef<(HTMLLIElement | null)[]>([]);
  const progRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const st = ScrollTrigger.create({
        trigger: el,
        start: "top 75%",
        end: "bottom 35%",
        onUpdate: (s) => {
          const p = s.progress;
          if (progRef.current) progRef.current.textContent = p.toFixed(2);
          rows.current.forEach((row, i) => {
            if (!row) return;
            const delay = (i / PARTS.length) * 0.6;
            const span = 0.4;
            const v = smoothstep(delay, delay + span, p);
            row.style.setProperty("--v", v.toFixed(3));
            const val = row.querySelector<HTMLElement>("[data-v]");
            if (val) val.textContent = v.toFixed(2);
          });
        },
      });
      return () => st.kill();
    },
    { scope: root },
  );

  return (
    <div ref={root} data-inspect="EXPLOSION / AUREX">
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-ink pb-3 t-mono">
        <span>
          {label} — progress = <span ref={progRef} className="tnum text-ink">0.00</span>
        </span>
        <span className="text-ink-3">v = smoothstep(delay, delay + span, progress)</span>
      </div>
      <ol className="divide-y divide-neutral">
        {PARTS.map((p, i) => (
          <li key={p} ref={(n) => {
              rows.current[i] = n;
            }} className="grid grid-cols-[1.5rem_1fr_auto] items-center gap-4 py-2 t-mono" style={{ "--v": 0 } as React.CSSProperties}>
            <span className="tnum text-ink-3">{String(i + 1).padStart(2, "0")}</span>
            <span className="relative block h-5">
              <span className="absolute inset-y-0 left-0 w-px bg-neutral" />
              {/* a peça "sai" da origem proporcionalmente a v */}
              <span className="absolute top-1/2 -translate-y-1/2 border border-ink bg-paper px-2 py-0.5 text-ink transition-transform duration-100 ease-linear" style={{ transform: "translate(calc(var(--v) * 40vw), -50%)" }}>
                {p}
              </span>
            </span>
            <span className="tnum text-ink-3">
              v=<span data-v>0.00</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ---------------------------------------------------------------------
   TERRAL — os cinco capítulos como trilho e o mecanismo real do site:
   segurar por seis segundos. Botão de verdade, acessível por teclado
   (Space/Enter mantidos), com medidor e a recompensa ao completar.
   --------------------------------------------------------------------- */
const CHAPTERS = ["CAPARAÓ", "TERREIRO", "TAMBOR", "MOENDA", "XÍCARA"];
const HOLD_MS = 6000;

export function TerralHold({ labels }: { labels: { hold: string; holding: string; done: string; reset: string } }) {
  const [state, setState] = useState<"idle" | "holding" | "done">("idle");
  const meter = useRef<HTMLSpanElement>(null);
  const tween = useRef<gsap.core.Tween | null>(null);

  const start = () => {
    if (state === "done") return;
    setState("holding");
    tween.current?.kill();
    tween.current = gsap.to(meter.current, { scaleX: 1, duration: HOLD_MS / 1000, ease: "none", onComplete: () => setState("done") });
  };
  const stop = () => {
    if (state !== "holding") return;
    tween.current?.kill();
    gsap.to(meter.current, { scaleX: 0, duration: 0.4, ease: EASE.outQuint });
    setState("idle");
  };
  const reset = () => {
    tween.current?.kill();
    gsap.set(meter.current, { scaleX: 0 });
    setState("idle");
  };
  useEffect(
    () => () => {
      tween.current?.kill();
    },
    [],
  );

  return (
    <div data-inspect="HOLD / TERRAL">
      <ol className="flex flex-wrap gap-x-6 gap-y-2 border-b border-ink pb-3 t-mono">
        {CHAPTERS.map((c, i) => (
          <li key={c}>
            <span className="tnum text-ink-3">0{i + 1}</span> {c}
          </li>
        ))}
      </ol>
      <div className="mt-6 flex flex-wrap items-center gap-6">
        <button
          type="button"
          data-no-inspect
          onPointerDown={start}
          onPointerUp={stop}
          onPointerLeave={stop}
          onPointerCancel={stop}
          onKeyDown={(e) => {
            if ((e.key === " " || e.key === "Enter") && !e.repeat) {
              e.preventDefault();
              start();
            }
          }}
          onKeyUp={(e) => {
            if (e.key === " " || e.key === "Enter") stop();
          }}
          onContextMenu={(e) => e.preventDefault()}
          aria-pressed={state === "holding"}
          className="link-rule t-mono select-none text-ink [touch-action:none]"
        >
          [ {state === "done" ? labels.done : state === "holding" ? labels.holding : labels.hold} ]
        </button>
        <span className="relative block h-px w-40 bg-neutral" aria-hidden="true">
          <span ref={meter} className="absolute inset-0 origin-left bg-ink" style={{ transform: "scaleX(0)" }} />
        </span>
        <span className="t-mono tnum text-ink-3">6.0S</span>
        {state === "done" && (
          <button type="button" data-no-inspect onClick={reset} className="link-rule t-mono text-ink-3">
            {labels.reset}
          </button>
        )}
      </div>
      <p className={"t-lead mt-6 max-w-xl text-ink transition-opacity duration-slow " + (state === "done" ? "opacity-100" : "opacity-0")} aria-live="polite">
        {state === "done" ? "Você segurou. É o que a Terral pede de um café: que alguém espere o tempo dele." : ""}
      </p>
    </div>
  );
}

/** Fallback minúsculo para reduced-motion: mostra os valores estáticos. */
export function usePrefersReduced() {
  const [r, setR] = useState(false);
  useEffect(() => setR(window.matchMedia(MQ.reduce).matches), []);
  return r;
}
