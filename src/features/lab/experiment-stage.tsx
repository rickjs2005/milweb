"use client";

import { useEffect, useRef, useState } from "react";
import { getQuality } from "@/lib/quality";
import { LOADERS, type ExperimentHandle, type ExperimentId, type StageStrings } from "./types";

type Item = { id: ExperimentId; name: string; desc: string; hint: string };

/**
 * Palco dos experimentos do Lab. Regras duras:
 *  · nada roda antes de alguém pedir (import() no clique);
 *  · só um experimento por vez — abrir outro destrói o anterior;
 *  · ENCERRAR (botão ou Esc) destrói de verdade: rAF, listeners, DOM;
 *  · a "realidade de baixo" (composição escura) é DOM real e serve de
 *    fallback quando o experimento não pode rodar.
 */
export function ExperimentStage({ eyebrow, intro, close, running, unsupported, items, stage }: { eyebrow: string; intro: string; close: string; running: string; unsupported: string; items: Item[]; stage: StageStrings }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<ExperimentHandle | null>(null);
  const [active, setActive] = useState<ExperimentId | null>(null);
  const [loading, setLoading] = useState<ExperimentId | null>(null);
  const [failed, setFailed] = useState(false);

  const stop = () => {
    handleRef.current?.destroy();
    handleRef.current = null;
    setActive(null);
    setLoading(null);
  };

  const run = async (id: ExperimentId) => {
    if (active === id) return stop();
    stop();
    setFailed(false);
    setLoading(id);
    try {
      const mod = await LOADERS[id]();
      const host = hostRef.current;
      if (!host) return;
      const handle = mod.mount(host, { strings: stage });
      if (!handle) {
        setFailed(true);
        setLoading(null);
        return;
      }
      handleRef.current = handle;
      setActive(id);
    } catch {
      setFailed(true);
    } finally {
      setLoading(null);
    }
  };

  // Esc encerra; desmontar encerra.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && handleRef.current) stop();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      handleRef.current?.destroy();
      handleRef.current = null;
    };
  }, []);

  const current = items.find((i) => i.id === active);
  const lowEnd = typeof window !== "undefined" && getQuality().tier === "reduced";

  return (
    <section className="mt-16 md:mt-24" data-inspect="LAB_EXPERIMENTS">
      <div className="rule flex items-center justify-between pt-3 t-mono">
        <span>{eyebrow}</span>
        <span className="tnum text-ink-3">{String(items.length).padStart(3, "0")}</span>
      </div>
      <p className="t-body mt-6 max-w-2xl text-ink-2">{intro}</p>

      <ul className="mt-8 flex flex-wrap gap-3">
        {items.map((it) => {
          const on = active === it.id;
          return (
            <li key={it.id}>
              <button
                type="button"
                onClick={() => run(it.id)}
                aria-pressed={on}
                data-no-inspect
                className={"link-rule t-mono min-h-[44px] border border-ink px-4 py-2 uppercase transition-colors duration-fast " + (on ? "bg-ink text-paper" : "text-ink hover:bg-paper-2")}
              >
                {loading === it.id ? "…" : on ? `${it.name} · ${running}` : it.name}
              </button>
            </li>
          );
        })}
        {active && (
          <li>
            <button type="button" onClick={stop} data-no-inspect className="link-rule t-mono min-h-[44px] px-4 py-2 uppercase text-ink-3">
              [ {close} ] ESC
            </button>
          </li>
        )}
      </ul>

      {/* palco: a realidade de baixo é DOM (também é o fallback) */}
      <div className="relative mt-8 aspect-[16/10] w-full overflow-hidden border border-ink bg-ink text-paper md:aspect-[21/9]" data-inspect="EXPERIMENT_STAGE">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 p-5 md:p-8">
          <div className="flex items-center justify-between t-mono text-paper/60">
            <span>{stage.under}</span>
            <span className="text-signal">{active ? current?.name : stage.idle}</span>
          </div>
          <pre className="t-code mt-6 text-paper/70">{`while (reality.stable) {\n  compile(next);\n  if (anomaly) tear();\n}`}</pre>
          <p className="t-display absolute bottom-6 left-5 text-paper md:bottom-10 md:left-8" style={{ fontSize: "clamp(1.6rem, 5vw, 4rem)", fontWeight: 900 }}>
            {stage.title}
          </p>
        </div>
        <div ref={hostRef} className="absolute inset-0" />
        {!active && !loading && (
          <p className="t-mono absolute inset-x-0 bottom-4 text-center text-paper/70 md:bottom-6">{items.map((i) => i.name).join(" · ")}</p>
        )}
      </div>

      <p aria-live="polite" className="t-mono mt-3 min-h-[1.5em] text-ink-3">
        {failed || lowEnd ? unsupported : current ? current.hint : ""}
      </p>
      {current && <p className="t-body mt-2 max-w-2xl text-ink-2">{current.desc}</p>}
    </section>
  );
}
