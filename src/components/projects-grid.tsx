"use client";

import { useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";

gsap.registerPlugin(Flip);

export type ProjectFilterDef = { key: string; label: string; count: number };

/**
 * Grade de projetos com filtro por categoria e reordenação animada (FLIP):
 * os cards que ficam deslizam para a nova posição, os que entram/saem fazem
 * fade+scale. Os cards chegam server-rendered via `items[].node` — este
 * componente só orquestra visibilidade e animação. Em reduced-motion o
 * filtro troca sem animar.
 */
export function ProjectsGrid({
  allLabel,
  filters,
  items,
}: {
  allLabel: string;
  filters: ProjectFilterDef[];
  items: { key: string; category: string; node: ReactNode }[];
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState("all");

  const apply = (next: string) => {
    if (next === active) return;
    const grid = gridRef.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!grid || reduce) {
      setActive(next);
      return;
    }
    // Padrão FLIP+React: captura o layout atual, força o re-render síncrono
    // (flushSync) e anima do estado antigo para o novo.
    const state = Flip.getState(grid.querySelectorAll("[data-cat]"));
    flushSync(() => setActive(next));
    Flip.from(state, {
      duration: 0.55,
      ease: "power3.inOut",
      stagger: 0.015,
      absolute: true,
      onEnter: (els) =>
        gsap.fromTo(
          els,
          { opacity: 0, scale: 0.9 },
          { opacity: 1, scale: 1, duration: 0.4, ease: "power2.out" },
        ),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.9, duration: 0.3, ease: "power2.in" }),
    });
  };

  const pill = (selected: boolean) =>
    "shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors " +
    (selected
      ? "border-accent/50 bg-accent/15 text-accent"
      : "border-line/15 bg-surface-2/50 text-fg-subtle hover:border-accent/30 hover:text-fg-muted");

  return (
    <div>
      {/* Mobile: linha única rolável (chips) sangrando até a borda da tela;
          sm+: quebra em linhas normalmente. */}
      <div
        role="group"
        className="-mx-5 mt-10 flex items-center gap-2 overflow-x-auto px-5 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0"
      >
        <button type="button" aria-pressed={active === "all"} onClick={() => apply("all")} className={pill(active === "all")}>
          {allLabel}{" "}
          <span className="font-mono text-[11px] opacity-60">{items.length}</span>
        </button>
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            aria-pressed={active === f.key}
            onClick={() => apply(f.key)}
            className={pill(active === f.key)}
          >
            {f.label} <span className="font-mono text-[11px] opacity-60">{f.count}</span>
          </button>
        ))}
      </div>

      <div ref={gridRef} className="mt-8 grid gap-6 lg:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.key}
            data-cat={item.category}
            className={active === "all" || active === item.category ? "" : "hidden"}
          >
            {item.node}
          </div>
        ))}
      </div>
    </div>
  );
}
