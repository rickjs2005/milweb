"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { getQuality } from "@/lib/quality";
import { MiloFallback } from "./MiloFallback";
import { miloFrame, useMiloStore } from "./useMiloStore";
import type { MiloQuality } from "./milo.types";

const MiloCanvas = dynamic(() => import("./MiloCanvas").then((m) => m.MiloCanvas), { ssr: false });
const MiloDebug = dynamic(() => import("./MiloDebug").then((m) => m.MiloDebug), { ssr: false });

const STATE_LABEL: Record<string, string> = { dormant: "DORMENTE", observe: "OBSERVA", touch: "TOCA", full: "PRESENÇA TOTAL", dissolve: "DISSOLVE", transition: "TRANSIÇÃO" };

/**
 * /lab/milo-null — laboratório visual do personagem. Canvas na viewport
 * inteira; headline em HTML (acessível, nunca rasterizada); painel preto
 * flutuante perto da mão (HTML, posicionado pela projeção da âncora);
 * indicador de estado e botão pra alternar; debug só em desenvolvimento.
 */
export function MiloLab() {
  const [mode, setMode] = useState<"pending" | "webgl" | "fallback">("pending");
  const [mobile, setMobile] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const quality = useMiloStore((s) => s.quality);
  const setQuality = useMiloStore((s) => s.setQuality);
  const setReduced = useMiloStore((s) => s.setReducedMotion);
  const state = useMiloStore((s) => s.state);
  const pending = useMiloStore((s) => s.pending);
  const visibility = useMiloStore((s) => s.visibility);
  const energy = useMiloStore((s) => s.energy);
  const nextState = useMiloStore((s) => s.nextState);

  useEffect(() => {
    const q = getQuality();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    setReduced(reduce);
    const small = window.innerWidth < 720;
    setMobile(small || coarse);
    const force = new URLSearchParams(location.search).get("force") === "1"; // diagnóstico: ignora o probe de GPU
    if ((reduce || !q.webgl) && !force) {
      setMode("fallback");
      return;
    }
    const tier: MiloQuality = coarse || small ? "low" : q.tier === "high" ? "high" : "medium";
    setQuality(tier);
    setMode("webgl");
    // gancho de QA (só em desenvolvimento): window.__milo.getState().setState("touch")
    if (process.env.NODE_ENV === "development") {
      const w = window as unknown as { __milo: typeof useMiloStore; __miloFrame: typeof miloFrame };
      w.__milo = useMiloStore;
      w.__miloFrame = miloFrame;
    }
    const onResize = () => setMobile(window.innerWidth < 720 || coarse);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [setQuality, setReduced]);

  const label = STATE_LABEL[pending ? "transition" : state] + (pending ? ` → ${STATE_LABEL[pending]}` : "");

  return (
    <main className="relative h-[100svh] w-full overflow-hidden bg-paper" data-inspect="LAB / MILO NULL">
      {mode === "webgl" ? <MiloCanvas key={quality} quality={quality} mobile={mobile} panelRef={panelRef} /> : mode === "fallback" ? <MiloFallback /> : null}

      {/* painel preto flutuante — HTML de verdade; a distorção acontece no fundo, atrás dele */}
      <div
        ref={panelRef}
        className="milo-panel pointer-events-none absolute left-0 top-0 w-[min(232px,44vw)] border border-ink bg-ink p-4 text-paper t-mono text-[11px] leading-relaxed will-change-transform"
        style={{ transform: "translate(70vw, 45vh) translate(-12%, -50%)" }}
        aria-hidden={mode !== "webgl"}
      >
        <div className="flex items-center justify-between">
          <span>MILO_NULL</span>
          <span className="milo-panel-dot inline-block h-1.5 w-1.5 bg-signal" />
        </div>
        {/* dormant: painel silencioso — só o nome e o sinal */}
        {state !== "dormant" || pending ? (
          <>
            <div className="mt-3 flex justify-between text-paper/60">
              <span>PRESENÇA</span>
              <span className="tnum text-paper">{visibility.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-paper/60">
              <span>ENERGIA</span>
              <span className="tnum text-paper">{energy.toFixed(2)}</span>
            </div>
            <div className="milo-panel-bar mt-3 h-px w-full bg-paper/20">
              <div className="h-px bg-signal" style={{ width: `${Math.round(energy * 100)}%` }} />
            </div>
          </>
        ) : (
          <div className="mt-3 h-px w-full bg-paper/20" />
        )}
      </div>

      {/* headline HTML, lado esquerdo */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-full container-page pt-nav">
        <div className="grid-12 h-full items-start pt-[8svh] md:items-center md:pt-0">
          <div className="col-span-4 md:col-span-5 lg:col-span-7">
            <p className="t-mono text-ink-3">LAB / MILO NULL · PROTÓTIPO 01</p>
            <h1 className="t-display t-display-xl mt-6 text-ink">
              <span className="block">CÓDIGO DEVE</span>
              <span className="block">MOVER PESSOAS.</span>
            </h1>
          </div>
        </div>
      </div>

      {/* estado + alternância */}
      <div className="absolute inset-x-0 bottom-0 container-page flex items-end justify-between pb-6 t-mono">
        <p className="text-ink-3" aria-live="polite">
          ESTADO / <span className="text-ink">{label}</span>
          {mode === "fallback" && <span className="ml-3 text-ink-3">· SEM WEBGL / REDUCED MOTION — VERSÃO ESTÁTICA</span>}
        </p>
        <button type="button" onClick={nextState} disabled={mode !== "webgl"} className="link-rule text-ink disabled:opacity-40">
          PRÓXIMO ESTADO →
        </button>
      </div>

      {process.env.NODE_ENV === "development" && mode === "webgl" && <MiloDebug />}
    </main>
  );
}
