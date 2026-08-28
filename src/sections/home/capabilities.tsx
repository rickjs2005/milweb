"use client";

import { useRef } from "react";
import { gsap, EASE, MQ, useGSAP } from "@/animations/gsap";

export type Capability = { n: string; label: string; react: "depth" | "structure" | "perspective" | "type" | "grid" };

/**
 * ACT 04 — CAPABILITIES. Lista editorial 01–05. O hover em cada item
 * provoca uma reação contextual da própria seção — a página demonstra a
 * capacidade em vez de descrevê-la:
 *   depth       → a lista ganha profundidade (rotateX leve, perspectiva)
 *   structure   → o wireframe da seção aparece
 *   perspective → as linhas se afastam em Z em escada
 *   type        → a Archivo responde ao cursor no eixo wdth
 *   grid        → as 12 colunas surgem
 * Tudo com quickTo/timeline curtas; nada persiste depois do hover.
 */
export function Capabilities({ items, eyebrow }: { items: Capability[]; eyebrow: string }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const list = el.querySelector<HTMLElement>("[data-list]")!;
      const rows = Array.from(el.querySelectorAll<HTMLElement>("[data-row]"));
      const grid = el.querySelector<HTMLElement>("[data-grid]")!;
      const wire = el.querySelectorAll<HTMLElement>("[data-wire]");
      const mm = gsap.matchMedia();

      // MECHANISM → SYSTEM: ao sair dos quatro mundos, as 12 colunas do grid
      // MilWeb se acendem e assentam — a página volta ao sistema.
      mm.add(MQ.noReduce, () => {
        gsap
          .timeline({ scrollTrigger: { trigger: el, start: "top 90%", end: "top 25%", scrub: 0.6 }, defaults: { ease: EASE.outQuint } })
          .fromTo(grid.children, { autoAlpha: 0, scaleY: 0, transformOrigin: "top" }, { autoAlpha: 1, scaleY: 1, stagger: 0.02, duration: 0.6 }, 0)
          .to(grid, { autoAlpha: 0, duration: 0.3 }, 0.8);
      });

      mm.add(`${MQ.fine} and ${MQ.noReduce}`, () => {
        gsap.set(list, { transformPerspective: 1200, transformOrigin: "50% 50%" });
        gsap.set(grid, { autoAlpha: 0 });
        gsap.set(wire, { autoAlpha: 0 });
        const stretch = gsap.quickTo(list, "--wdth", { duration: 0.35, ease: EASE.outQuint });
        let typeRow: HTMLElement | null = null;

        const reset = () => {
          gsap.to(list, { rotateX: 0, rotateY: 0, duration: 0.6, ease: EASE.outExpo, overwrite: "auto" });
          gsap.to(rows, { z: 0, x: 0, duration: 0.6, ease: EASE.outExpo, overwrite: "auto" });
          gsap.to(grid, { autoAlpha: 0, duration: 0.3, overwrite: "auto" });
          gsap.to(wire, { autoAlpha: 0, duration: 0.3, overwrite: "auto" });
          if (typeRow) gsap.to(typeRow, { fontStretch: "125%", duration: 0.5, ease: EASE.outExpo, overwrite: "auto" });
          typeRow = null;
        };

        const enter = (row: HTMLElement) => {
          reset();
          const kind = row.dataset.row;
          switch (kind) {
            case "depth":
              gsap.to(list, { rotateX: 9, rotateY: -4, duration: 0.7, ease: EASE.outExpo });
              break;
            case "structure":
              gsap.to(wire, { autoAlpha: 1, stagger: 0.03, duration: 0.35 });
              break;
            case "perspective":
              gsap.to(rows, { z: (i) => (i - rows.indexOf(row)) * -110, x: (i) => Math.abs(i - rows.indexOf(row)) * 10, duration: 0.7, ease: EASE.outExpo });
              break;
            case "type":
              typeRow = row;
              break;
            case "grid":
              gsap.to(grid, { autoAlpha: 1, duration: 0.4 });
              break;
          }
        };

        const move = (e: PointerEvent) => {
          if (!typeRow) return;
          const r = typeRow.getBoundingClientRect();
          const p = gsap.utils.clamp(0, 1, (e.clientX - r.left) / r.width);
          gsap.to(typeRow, { fontStretch: `${Math.round(62 + p * 63)}%`, duration: 0.25, ease: EASE.outQuint, overwrite: "auto" });
          stretch(p);
        };

        rows.forEach((r) => {
          r.addEventListener("pointerenter", () => enter(r));
        });
        list.addEventListener("pointerleave", reset);
        list.addEventListener("pointermove", move);
        return () => {
          list.removeEventListener("pointerleave", reset);
          list.removeEventListener("pointermove", move);
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="capabilities" data-act="ACT 04 / CAPABILITIES" data-inspect="CAPABILITIES" className="container-page relative bg-paper py-24 md:py-40">
      {/* grid (reação "grid") */}
      <div data-grid aria-hidden="true" className="pointer-events-none absolute inset-x-margin inset-y-0 grid opacity-0" style={{ gridTemplateColumns: "repeat(12, minmax(0, 1fr))", columnGap: "var(--gutter)" }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className="block h-full border-l border-neutral last:border-r" />
        ))}
      </div>

      <div className="rule flex items-center justify-between pt-3 t-mono">
        <span>{eyebrow}</span>
        <span className="tnum text-ink-3">{String(items.length).padStart(2, "0")}</span>
      </div>

      <ol data-list className="relative mt-12 [transform-style:preserve-3d] md:mt-20">
        {items.map((c, i) => (
          <li
            key={c.n}
            data-row={c.react}
            className="group relative flex items-baseline gap-6 border-b border-neutral py-4 [transform-style:preserve-3d] md:gap-10 md:py-6"
            data-inspect={`CAPABILITY_${c.n}`}
          >
            <span data-wire aria-hidden="true" className="pointer-events-none absolute inset-0 border border-dashed border-ink/60 opacity-0" />
            <span data-wire aria-hidden="true" className="t-mono pointer-events-none absolute right-2 top-2 text-ink-3 opacity-0">
              [LI] {i + 1}/{items.length}
            </span>
            <span className="t-mono tnum text-ink-3">{c.n}</span>
            <span className="t-display t-display-sm text-ink transition-colors duration-fast group-hover:text-ink-2">{c.label}</span>
            <span className="t-mono ml-auto hidden text-ink-3 opacity-0 transition-opacity duration-fast group-hover:opacity-100 md:block">
              {c.react.toUpperCase()} →
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
