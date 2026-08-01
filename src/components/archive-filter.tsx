"use client";

import { useState, type ReactNode } from "react";

export type ArchiveItem = { key: string; category: string; node: ReactNode };
export type ArchiveFilterDef = { key: string; label: string; count: number };
export type ArchiveSection = {
  key: string;
  /** Cabeçalho da seção, server-rendered (título + subtítulo). */
  heading: ReactNode;
  gridClass: string;
  items: ArchiveItem[];
};

/**
 * Filtro por categoria do acervo /projetos, cobrindo as DUAS seções
 * (entregas para cliente e autorais) com uma única fileira de chips — uma
 * categoria pode viver só nas entregas (ex.: landing page = Kavita Drones) e
 * o filtro precisa alcançá-la. Seção sem item visível some inteira.
 *
 * Sem FLIP/GSAP de propósito: o acervo é deliberadamente simples (ver nota
 * em projetos/page.tsx); os cards continuam server-rendered via `node`.
 */
export function ArchiveFilter({
  allLabel,
  filters,
  sections,
}: {
  allLabel: string;
  filters: ArchiveFilterDef[];
  sections: ArchiveSection[];
}) {
  const [active, setActive] = useState("all");
  const total = sections.reduce((n, s) => n + s.items.length, 0);

  const pill = (selected: boolean) =>
    "shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors " +
    (selected
      ? "border-accent/50 bg-accent/15 text-accent"
      : "border-line/15 bg-surface-2/50 text-fg-subtle hover:border-accent/30 hover:text-fg-muted");

  return (
    <>
      {/* Mobile: linha única rolável sangrando até a borda (mesmo padrão da
          grade da home); sm+: quebra em linhas. */}
      <div
        role="group"
        className="-mx-5 mt-10 flex items-center gap-2 overflow-x-auto px-5 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0"
      >
        <button type="button" aria-pressed={active === "all"} onClick={() => setActive("all")} className={pill(active === "all")}>
          {allLabel} <span className="font-mono text-[11px] opacity-60">{total}</span>
        </button>
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            aria-pressed={active === f.key}
            onClick={() => setActive(f.key)}
            className={pill(active === f.key)}
          >
            {f.label} <span className="font-mono text-[11px] opacity-60">{f.count}</span>
          </button>
        ))}
      </div>

      {sections.map((s) => {
        const visible = active === "all" ? s.items : s.items.filter((i) => i.category === active);
        if (visible.length === 0) return null;
        return (
          <section key={s.key} className="mt-16">
            {s.heading}
            <div className={s.gridClass}>
              {visible.map((i) => (
                <div key={i.key}>{i.node}</div>
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
