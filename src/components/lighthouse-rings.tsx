"use client";

import { Counter } from "./reveal";
import { useInViewOnce } from "@/lib/use-in-view-once";

/** Anéis estilo Lighthouse (100 em tudo) — prova técnica na seção de números. */
export function LighthouseRings({ labels }: { labels: string[] }) {
  const [ref, shown] = useInViewOnce<HTMLDivElement>();

  return (
    <div ref={ref} className="grid grid-cols-2 gap-8 sm:grid-cols-4">
      {labels.map((label, i) => (
        <div key={label} className="flex flex-col items-center gap-3">
          <div className="relative">
            <svg viewBox="0 0 100 100" className="w-20 -rotate-90 sm:w-24">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgb(var(--surface-2))" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#34d399"
                strokeWidth="8"
                strokeLinecap="round"
                pathLength={1}
                style={{
                  strokeDasharray: 1,
                  strokeDashoffset: shown ? 0 : 1,
                  transition: `stroke-dashoffset 1.8s cubic-bezier(0.22, 1, 0.36, 1) ${0.15 * i}s`,
                }}
              />
            </svg>
            <span className="font-display absolute inset-0 flex items-center justify-center text-xl font-bold tabular-nums text-emerald-400 sm:text-2xl">
              <Counter value={100} delay={150 * i} />
            </span>
          </div>
          <span className="text-center text-sm text-fg-muted">{label}</span>
        </div>
      ))}
    </div>
  );
}
