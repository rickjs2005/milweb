"use client";

import { useEffect, useState } from "react";
import { MILO } from "./milo.config";
import { miloFrame, STATE_CYCLE, useMiloStore } from "./useMiloStore";
import type { MiloQuality } from "./milo.types";

const PARAMS: { key: keyof typeof miloFrame.params; label: string; min: number; max: number; step: number }[] = [
  { key: "bodyDistortion", label: "bodyDistortion", min: 0, max: 0.12, step: 0.001 },
  { key: "motionDistortion", label: "motionDistortion", min: 0, max: 0.12, step: 0.001 },
  { key: "interactionDistortion", label: "interactionDistortion", min: 0, max: 0.2, step: 0.001 },
  { key: "gridBend", label: "gridBend", min: 0, max: 0.08, step: 0.001 },
  { key: "edgeCompression", label: "edgeCompression", min: 0, max: 0.05, step: 0.001 },
  { key: "refractionFalloff", label: "refractionFalloff", min: 0.2, max: 2, step: 0.01 },
  { key: "edge", label: "uEdgeStrength", min: 0, max: 1, step: 0.01 },
  { key: "noiseScale", label: "uNoiseScale", min: 0.5, max: 8, step: 0.1 },
  { key: "noiseSpeed", label: "uNoiseSpeed", min: 0, max: 1, step: 0.01 },
  { key: "glitch", label: "uGlitch", min: 0, max: 1, step: 0.01 },
  { key: "wireframeVisibility", label: "wireframeVisibility", min: 0, max: 1, step: 0.01 },
  { key: "bodyDensity", label: "bodyDensity", min: 0, max: 0.3, step: 0.005 },
  { key: "maskBlur", label: "maskBlur (px)", min: 0, max: 24, step: 0.5 },
  { key: "maskDilation", label: "maskDilation (px)", min: 0, max: 12, step: 0.5 },
  { key: "internalShadow", label: "internalShadow", min: 0, max: 0.4, step: 0.005 },
  { key: "particleVisibility", label: "particleVisibility", min: 0, max: 1, step: 0.01 },
];
const VIEWS: { v: number; label: string }[] = [
  { v: 0, label: "COMPOSITE" },
  { v: 1, label: "DISTORTION ONLY" },
  { v: 2, label: "WIREFRAME ONLY" },
];

/**
 * Controles de debug — só em desenvolvimento. Começa recolhido; `D`
 * alterna. Fica no canto inferior esquerdo (acima do indicador de estado)
 * para nunca cobrir o Milo nem o painel preto. Escreve direto em miloFrame.
 */
export function MiloDebug() {
  const [open, setOpen] = useState(false);
  const [, tick] = useState(0);
  const quality = useMiloStore((s) => s.quality);
  const setQuality = useMiloStore((s) => s.setQuality);
  const setState = useMiloStore((s) => s.setState);
  const state = useMiloStore((s) => s.state);
  const [fps, setFps] = useState(0);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "d" || e.repeat) return;
      if ((e.target as HTMLElement)?.closest?.("input, textarea, select")) return;
      setOpen((v) => !v);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  useEffect(() => {
    if (!open) return;
    let frames = 0;
    let last = performance.now();
    let raf = 0;
    const loop = (t: number) => {
      frames++;
      if (t - last >= 1000) {
        setFps(frames);
        frames = 0;
        last = t;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [open]);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="fixed bottom-[calc(1.5rem+2.4rem)] left-margin z-nav border border-neutral bg-paper px-2 py-1 t-mono text-[10px] text-ink-3 hover:text-ink" aria-label="Abrir debug do Milo (tecla D)">
        DEBUG [D]
      </button>
    );
  }

  return (
    <aside className="pointer-events-auto fixed bottom-[calc(1.5rem+2.4rem)] left-margin z-nav max-h-[80svh] w-64 overflow-y-auto border border-ink bg-paper p-3 t-mono text-[11px] text-ink" aria-label="Debug do Milo">
      <div className="flex items-center justify-between">
        <span>MILO / DEBUG</span>
        <span className="flex items-center gap-3">
          <span className="tnum text-ink-3">{fps} FPS</span>
          <button type="button" onClick={() => setOpen(false)} className="text-ink-3 hover:text-ink" aria-label="Recolher (D)">
            [D]
          </button>
        </span>
      </div>
      <label className="mt-2 flex items-center justify-between gap-2">
        <span>tier</span>
        <select value={quality} onChange={(e) => setQuality(e.target.value as MiloQuality)} className="border border-neutral bg-paper px-1">
          {(Object.keys(MILO.quality) as MiloQuality[]).map((q) => (
            <option key={q} value={q}>
              {q}
            </option>
          ))}
        </select>
      </label>
      {PARAMS.map((p) => (
        <label key={p.key} className="mt-1.5 block">
          <span className="flex justify-between">
            <span>{p.label}</span>
            <span className="tnum text-ink-3">{miloFrame.params[p.key].toFixed(3)}</span>
          </span>
          <input
            type="range"
            min={p.min}
            max={p.max}
            step={p.step}
            defaultValue={miloFrame.params[p.key]}
            onChange={(e) => {
              miloFrame.params[p.key] = Number(e.target.value);
              tick((n) => n + 1);
            }}
            className="w-full accent-signal"
          />
        </label>
      ))}
      <div className="mt-2 flex flex-wrap gap-1">
        {VIEWS.map((v) => (
          <button
            key={v.v}
            type="button"
            onClick={() => {
              miloFrame.params.view = v.v;
              tick((n) => n + 1);
            }}
            className={"border px-1.5 py-0.5 " + (miloFrame.params.view === v.v ? "border-ink bg-ink text-paper" : "border-neutral")}
          >
            {v.label}
          </button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {STATE_CYCLE.map((s) => (
          <button key={s} type="button" onClick={() => setState(s)} className={"border px-1.5 py-0.5 uppercase " + (state === s ? "border-ink bg-ink text-paper" : "border-neutral")}>
            {s}
          </button>
        ))}
      </div>
    </aside>
  );
}
