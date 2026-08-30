"use client";

import { useEffect, useState } from "react";
import { MILO } from "./milo.config";
import { miloFrame, STATE_CYCLE, useMiloStore } from "./useMiloStore";
import type { MiloQuality } from "./milo.types";

const PARAMS: { key: keyof typeof miloFrame.params; label: string; min: number; max: number; step: number }[] = [
  { key: "distortion", label: "uDistortionStrength", min: 0, max: 0.2, step: 0.001 },
  { key: "edge", label: "uEdgeStrength", min: 0, max: 1, step: 0.01 },
  { key: "noiseScale", label: "uNoiseScale", min: 0.5, max: 8, step: 0.1 },
  { key: "noiseSpeed", label: "uNoiseSpeed", min: 0, max: 1, step: 0.01 },
  { key: "glitch", label: "uGlitch", min: 0, max: 1, step: 0.01 },
];

/** Controles de debug — só em desenvolvimento. Escreve direto em miloFrame (sem React por frame). */
export function MiloDebug() {
  const [, tick] = useState(0);
  const quality = useMiloStore((s) => s.quality);
  const setQuality = useMiloStore((s) => s.setQuality);
  const setState = useMiloStore((s) => s.setState);
  const state = useMiloStore((s) => s.state);
  const [fps, setFps] = useState(0);

  useEffect(() => {
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
  }, []);

  return (
    <aside className="pointer-events-auto fixed bottom-4 right-4 z-nav w-64 border border-ink bg-paper p-3 t-mono text-[11px] text-ink" aria-label="Debug do Milo">
      <div className="flex items-center justify-between">
        <span>MILO / DEBUG</span>
        <span className="tnum text-ink-3">{fps} FPS</span>
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
        <label key={p.key} className="mt-2 block">
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
      <div className="mt-3 flex flex-wrap gap-1">
        {STATE_CYCLE.map((s) => (
          <button key={s} type="button" onClick={() => setState(s)} className={"border px-1.5 py-0.5 uppercase " + (state === s ? "border-ink bg-ink text-paper" : "border-neutral")}>
            {s}
          </button>
        ))}
      </div>
    </aside>
  );
}
