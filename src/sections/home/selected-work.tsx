"use client";

import { useRef } from "react";
import Link from "next/link";
import { gsap, EASE, MQ, useGSAP } from "@/animations/gsap";

export type WorkItem = {
  n: string;
  slug: string;
  name: string;
  title: [string, string];
  kind: string;
  image: string;
  href: string;
};

const COLS = 8;
const ROWS = 5;

/**
 * ACT 03 — SELECTED WORK. Quatro trabalhos, uma viewport cada, empilhados
 * em sticky: o próximo sobe por cima do anterior. A imagem de cada case é
 * um mosaico de tiles (background-position) — ao entrar, os tiles
 * convergem de posições dispersas; quando o próximo case cobre, os tiles
 * do anterior se soltam. Um ScrollTrigger por painel, scrub, sem canvas.
 *
 * Mobile: 4×3 tiles com a mesma coreografia (barata: só transforms).
 * Reduced motion: imagem inteira, sem tiles.
 */
export function SelectedWork({ items, eyebrow, enter, all, allHref }: { items: WorkItem[]; eyebrow: string; enter: string; all: string; allHref: string }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const panels = gsap.utils.selector(el)<HTMLElement>("[data-panel]");
      const mm = gsap.matchMedia();

      mm.add(MQ.noReduce, () => {
        panels.forEach((panel, i) => {
          const tiles = panel.querySelectorAll<HTMLElement>("[data-tile]");
          const text = panel.querySelectorAll<HTMLElement>("[data-text]");
          const rnd = gsap.utils.random;
          const scatter = () =>
            tiles.forEach((t) =>
              gsap.set(t, { x: rnd(-160, 160), y: rnd(120, 420), rotation: rnd(-18, 18), scale: rnd(0.6, 1.1), autoAlpha: 0 }),
            );

          // ENTRADA: painel sobe por baixo; tiles convergem, texto assenta.
          if (i > 0) {
            scatter();
            gsap.set(text, { yPercent: 30, autoAlpha: 0 });
            gsap
              .timeline({
                scrollTrigger: { trigger: panel, start: "top bottom", end: "top top", scrub: 0.6 },
                defaults: { ease: EASE.outQuint },
              })
              .to(tiles, { x: 0, y: 0, rotation: 0, scale: 1, autoAlpha: 1, stagger: { each: 0.006, from: "random" }, duration: 0.8 }, 0)
              .to(text, { yPercent: 0, autoAlpha: 1, stagger: 0.06, duration: 0.5 }, 0.3);
          }

          // SAÍDA: enquanto o próximo cobre, os tiles deste se soltam.
          const next = panels[i + 1];
          if (next) {
            gsap
              .timeline({
                scrollTrigger: { trigger: next, start: "top bottom", end: "top 20%", scrub: 0.6 },
                defaults: { ease: EASE.inOutQuart },
              })
              .to(
                tiles,
                {
                  x: () => rnd(-80, 80),
                  y: () => rnd(-260, -60),
                  rotation: () => rnd(-14, 14),
                  scale: 0.85,
                  autoAlpha: 0,
                  stagger: { each: 0.008, from: "random" },
                  duration: 1,
                },
                0,
              )
              .to(text, { autoAlpha: 0.15, duration: 0.6 }, 0);
          }
        });
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="work" data-act="ACT 03 / WORK" data-inspect="SELECTED_WORK" className="relative">
      {items.map((w, i) => (
        <article
          key={w.slug}
          data-panel
          data-inspect={`CASE_${w.n}`}
          className="sticky top-0 flex h-[100svh] flex-col justify-between overflow-hidden bg-paper px-margin pb-6 pt-nav md:pb-8"
          style={{ zIndex: i + 1 }}
        >
          <div className="rule flex items-center justify-between pt-3 t-mono">
            <span data-text>{i === 0 ? eyebrow : ""}</span>
            <span data-text className="tnum">
              {w.n} / {items.length.toString().padStart(2, "0")}
            </span>
          </div>

          <div className="grid-12 flex-1 items-center gap-y-6 py-4">
            <div className="col-span-4 self-end md:col-span-3 lg:col-span-5">
              <p data-text className="t-mono text-ink-3">
                {w.n} / {w.name}
              </p>
              <p data-text className="t-mono mt-1 text-ink-2">
                {w.kind}
              </p>
              <Link data-text href={w.href} className="link-rule t-mono mt-6 inline-block text-ink" data-inspect="CTA">
                [ {enter} ]
              </Link>
            </div>

            {/* MOSAICO — altura limitada pela viewport, largura pelo aspecto */}
            <div className="col-span-4 flex justify-end md:col-span-5 lg:col-span-7">
              <div
                className="relative aspect-[16/10] h-[30svh] max-w-full md:h-[40svh]"
                data-inspect="IMG / TILES"
                style={{ "--img": `url(${w.image})` } as React.CSSProperties}
              >
                <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 1fr)` }}>
                  {Array.from({ length: COLS * ROWS }).map((_, k) => {
                    const c = k % COLS;
                    const r = Math.floor(k / COLS);
                    return (
                      <span
                        key={k}
                        data-tile
                        className="block"
                        style={{
                          backgroundImage: "var(--img)",
                          backgroundSize: `${COLS * 100}% ${ROWS * 100}%`,
                          backgroundPosition: `${(c / (COLS - 1)) * 100}% ${(r / (ROWS - 1)) * 100}%`,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <h2 data-text className="t-display t-display-md text-ink" data-inspect="CASE_TITLE">
            <span className="block">{w.title[0]}</span>
            <span className="block">{w.title[1]}</span>
          </h2>

          <div className="mt-6 flex items-center justify-between t-mono text-ink-3">
            <span data-text>MW/00{i + 2}</span>
            {i === items.length - 1 ? (
              <Link data-text href={allHref} className="link-rule text-ink">
                {all} →
              </Link>
            ) : (
              <span data-text>↓</span>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}
