"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap, EASE, MQ, ScrollTrigger, useGSAP } from "@/animations/gsap";

export type WorkItem = {
  n: string;
  slug: string;
  name: string;
  title: [string, string];
  displayType: string;
  client: string | null;
  year: number | null;
  image: string;
  detail: string;
  href: string;
  /** Rótulos técnicos reais do projeto (mono, discretos). */
  labels: string[];
};

/**
 * ACT 03 — SELECTED WORK. Quatro mundos em sticky stack, uma obra
 * contínua: KAVITA → (land→origin) → TERRAL → (organic→structure) →
 * VERTEX → (structure→mechanism) → AUREX → (mechanism→system) → o resto.
 *
 * Cada painel tem camadas próprias (data-world) que a timeline de entrada
 * e a de saída animam com scrub. A estrutura MilWeb (régua, índice,
 * mono, grid) permanece; só a atmosfera muda. DOM + CSS + SVG + GSAP — sem
 * canvas. A mídia e o título carregam view-transition-name para viajar até
 * o hero do case.
 */
export function SelectedWork({ items, eyebrow, enter, all, allHref }: { items: WorkItem[]; eyebrow: string; enter: string; all: string; allHref: string }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const panels = gsap.utils.selector(el)<HTMLElement>("[data-panel]");
      const mm = gsap.matchMedia();
      // Os mundos ficam abaixo da dobra: a configuração (que lê layout) roda
      // depois do idle, fora da tarefa de hidratação — TBT e LCP intactos.
      const w = window as Window & { requestIdleCallback?: (c: () => void, o?: { timeout: number }) => number };
      const idle = (cb: () => void) => (w.requestIdleCallback ? w.requestIdleCallback(cb, { timeout: 1200 }) : window.setTimeout(cb, 200));
      let disposed = false;
      idle(() => {
        if (disposed) return;
        setup();
        ScrollTrigger.refresh();
      });

      const setup = () => mm.add(MQ.noReduce, () => {
        const desktop = window.matchMedia("(min-width: 1080px)").matches;

        panels.forEach((panel, i) => {
          const world = panel.dataset.world!;
          const q = gsap.utils.selector(panel);
          const media = q<HTMLElement>("[data-media]")[0];
          const text = q<HTMLElement>("[data-text]");
          const next = panels[i + 1];

          // ---------- ENTRADA ----------
          const enterTl = gsap.timeline({
            scrollTrigger: { trigger: panel, start: i === 0 ? "top 80%" : "top bottom", end: i === 0 ? "top 20%" : "top top", scrub: 0.6 },
            defaults: { ease: EASE.outQuint },
          });
          enterTl.fromTo(text, { yPercent: 30, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, stagger: 0.06, duration: 0.5 }, 0.25);

          if (world === "kavita-drones") {
            // scanner: a imagem se revela da esquerda atrás de uma linha signal
            enterTl.fromTo(media, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.7, ease: "none" }, 0);
            enterTl.fromTo(q("[data-scan]"), { left: "0%" }, { left: "100%", duration: 0.7, ease: "none" }, 0);
            enterTl.to(q("[data-scan]"), { autoAlpha: 0, duration: 0.1 }, 0.7);
            enterTl.fromTo(q("[data-coord]"), { autoAlpha: 0, x: -8 }, { autoAlpha: 1, x: 0, stagger: 0.08, duration: 0.3 }, 0.4);
          }
          if (world === "terral") {
            // calor: entra devagar, escala lenta, grão sobe
            enterTl.fromTo(media, { scale: 1.12, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 1, ease: EASE.smooth }, 0);
            enterTl.fromTo(q("[data-grain]"), { autoAlpha: 0 }, { autoAlpha: 0.5, duration: 0.6 }, 0.2);
            enterTl.fromTo(q("[data-second]"), { yPercent: 20, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.6 }, 0.5);
          }
          if (world === "atelier-vertex") {
            // blueprint: guias se desenham, a imagem sobe em 4 fatias verticais
            enterTl.fromTo(q("[data-guide]"), { strokeDashoffset: 1, strokeDasharray: 1 }, { strokeDashoffset: 0, stagger: 0.04, duration: 0.6, ease: "none" }, 0);
            enterTl.fromTo(q("[data-strip]"), { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", stagger: 0.08, duration: 0.5 }, 0.15);
          }
          if (world === "aurex-timepieces") {
            // mecanismo: anéis giram e escalam do centro, a imagem abre em círculo
            enterTl.fromTo(q("[data-ring]"), { scale: 0.35, rotate: -90, autoAlpha: 0, transformOrigin: "50% 50%" }, { scale: 1, rotate: 0, autoAlpha: 1, stagger: 0.06, duration: 0.8 }, 0);
            enterTl.fromTo(media, { clipPath: "circle(0% at 50% 50%)" }, { clipPath: "circle(75% at 50% 50%)", duration: 0.8, ease: EASE.smooth }, 0.15);
          }

          // ---------- SAÍDA (enquanto o próximo cobre) ----------
          if (next) {
            const exitTl = gsap.timeline({
              scrollTrigger: { trigger: next, start: "top bottom", end: "top 15%", scrub: 0.6 },
              defaults: { ease: EASE.inOutQuart },
            });
            exitTl.to(text, { autoAlpha: 0.15, duration: 0.5 }, 0);
            if (world === "kavita-drones") {
              // LAND → ORIGIN: a imagem amplia, ganha grão e se parte em faixas
              exitTl.to(media, { scale: 1.18, duration: 1 }, 0);
              exitTl.to(q("[data-grain]"), { autoAlpha: 0.7, duration: 0.8 }, 0);
              exitTl.to(q("[data-band]"), { xPercent: (k) => (k % 2 ? 14 : -14), autoAlpha: 0, stagger: 0.06, duration: 0.7 }, 0.3);
            }
            if (world === "terral") {
              // ORGANIC → STRUCTURE: o grão vira pontos; os pontos viram grade
              exitTl.to(q("[data-grain]"), { autoAlpha: 0, duration: 0.4 }, 0);
              exitTl.fromTo(q("[data-dots]"), { autoAlpha: 0, scale: 0.92, transformOrigin: "50% 50%" }, { autoAlpha: 1, scale: 1, duration: 0.6 }, 0.1);
              exitTl.to(media, { autoAlpha: 0.25, scale: 0.96, duration: 0.8 }, 0.2);
            }
            if (world === "atelier-vertex") {
              // STRUCTURE → MECHANISM: as guias convergem em rotação para o centro
              exitTl.to(q("[data-guides]"), { rotate: 38, scale: 0.45, autoAlpha: 0, transformOrigin: "50% 50%", duration: 1 }, 0);
              exitTl.to(q("[data-strip]"), { yPercent: (k) => -10 - k * 6, autoAlpha: 0.3, stagger: 0.04, duration: 0.8 }, 0.1);
            }
          } else {
            // AUREX → SISTEMA: o mecanismo desacelera e some; a página volta ao grid.
            gsap
              .timeline({ scrollTrigger: { trigger: el, start: "bottom 90%", end: "bottom 20%", scrub: 0.6 }, defaults: { ease: EASE.outQuint } })
              .to(q("[data-ring]"), { rotate: 24, scale: 1.25, autoAlpha: 0, stagger: 0.05, duration: 1 }, 0)
              .to(media, { clipPath: "circle(0% at 50% 50%)", duration: 0.8, ease: EASE.inOutQuart }, 0.1);
          }

        });
      });

      return () => {
        disposed = true;
        mm.revert();
      };
    },
    { scope: root },
  );

  const total = String(items.length).padStart(2, "0");

  return (
    <section ref={root} id="work" data-act="ACT 03 / WORK" data-inspect="SELECTED_WORK" className="relative">
      {items.map((w, i) => (
        <article
          key={w.slug}
          data-panel
          data-world={w.slug}
          data-inspect={`WORLD_${w.n} / ${w.name}`}
          className="world sticky top-0 flex h-[100svh] flex-col overflow-hidden px-margin pb-6 pt-nav md:pb-8"
          style={{ zIndex: i + 1 }}
        >
          {/* ===== camadas do mundo ===== */}
          <WorldLayers slug={w.slug} />

          {/* ===== estrutura MilWeb ===== */}
          <div className="relative z-10 flex items-center justify-between border-t border-current pt-3 t-mono">
            <span data-text>{i === 0 ? eyebrow : ""}</span>
            <span data-text className="tnum">
              {w.n} / {total}
            </span>
          </div>

          {/* linha 1: índice + rótulos técnicos | mídia dominante */}
          <div className="relative z-10 grid flex-1 grid-cols-4 gap-x-gutter gap-y-4 pt-4 md:grid-cols-12">
            <div className="col-span-4 flex flex-col justify-between md:col-span-4 lg:col-span-3">
              <p data-text className="t-mono opacity-60">
                {w.n} / {w.name}
              </p>
              <ul data-text className="t-mono hidden opacity-60 md:block">
                {w.labels.map((l) => (
                  <li key={l} data-coord>
                    {l}
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-span-4 md:col-span-8 lg:col-span-9 md:flex md:items-start md:justify-end">
              <div
                data-media
                className="relative aspect-[16/10] w-full overflow-hidden bg-neutral"
                style={{ viewTransitionName: `case-media-${w.slug}`, width: "min(100%, calc(50svh * 1.6))" }}
                data-inspect="MEDIA"
              >
                <Image src={w.image} alt={w.name} fill loading="lazy" sizes="(min-width: 1080px) 60vw, 100vw" className="object-cover object-top" />
                {w.slug === "kavita-drones" &&
                  [0, 1, 2].map((k) => (
                    <span key={k} data-band aria-hidden="true" className="absolute inset-x-0" style={{ top: `${k * 33.34}%`, height: "33.4%", backgroundImage: `url(${w.image})`, backgroundSize: "100% 300%", backgroundPosition: `0 ${k * 50}%`, opacity: 0 }} />
                  ))}
                {w.slug === "atelier-vertex" &&
                  [0, 1, 2, 3].map((k) => (
                    <span key={k} data-strip aria-hidden="true" className="absolute top-0 h-full w-1/4 bg-paper" style={{ left: `${k * 25}%` }} />
                  ))}
                {w.slug === "terral" && (
                  <div data-second aria-hidden="true" className="absolute bottom-0 left-0 hidden w-[28%] border-r border-t border-[#E9E0CF] md:block">
                    <div className="relative aspect-[16/10]">
                      <Image src={w.detail} alt="" fill sizes="20vw" className="object-cover" />
                    </div>
                  </div>
                )}
                <span data-grain aria-hidden="true" className="grain pointer-events-none absolute inset-0 opacity-0" />
              </div>
            </div>
          </div>

          {/* linha 2: título em largura total + meta + CTA */}
          <div className="relative z-10 grid grid-cols-4 items-end gap-x-gutter gap-y-3 pt-4 md:grid-cols-12">
            <h2 data-text className="t-display t-display-md col-span-4 md:col-span-9" data-inspect="CASE_TITLE" style={{ viewTransitionName: `case-title-${w.slug}` }}>
              <span className="block">{w.title[0]}</span>
              <span className="block">{w.title[1]}</span>
            </h2>
            <div className="col-span-4 md:col-span-3 md:text-right">
              <p data-text className="t-mono opacity-80">
                {w.client ? `CLIENT WORK — ${w.client.toUpperCase()}` : w.displayType}
                {w.year ? ` — ${w.year}` : ""}
              </p>
              <Link data-text href={w.href} className="link-rule t-mono mt-3 inline-block" data-inspect="CTA / ENTER">
                [ {enter} ]
              </Link>
            </div>
          </div>

          <div className="relative z-10 mt-4 flex items-center justify-between t-mono opacity-70">
            <span data-text>MW/00{i + 2}</span>
            {i === items.length - 1 ? (
              <Link data-text href={allHref} className="link-rule">
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

/** Camadas de atmosfera por mundo — todas decorativas (aria-hidden, sem pointer). */
function WorldLayers({ slug }: { slug: string }) {
  if (slug === "kavita-drones")
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <span data-scan className="absolute top-0 h-full w-px bg-signal" style={{ left: "0%" }} />
      </div>
    );
  if (slug === "terral")
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <span data-grain className="grain absolute inset-0 opacity-0" />
        <svg data-dots className="absolute inset-0 h-full w-full opacity-0" viewBox="0 0 120 80" preserveAspectRatio="xMidYMid slice">
          {Array.from({ length: 12 * 8 }).map((_, k) => (
            <circle key={k} cx={5 + (k % 12) * 10} cy={14 + Math.floor(k / 12) * 9} r="0.3" fill="currentColor" />
          ))}
        </svg>
      </div>
    );
  if (slug === "atelier-vertex")
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <svg data-guides className="absolute inset-0 h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="none" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" vectorEffect="non-scaling-stroke">
          {[120, 360, 600, 840, 1080, 1320].map((x) => (
            <line key={x} data-guide x1={x} y1="0" x2={x} y2="900" pathLength="1" />
          ))}
          {[150, 450, 750].map((y) => (
            <line key={y} data-guide x1="0" y1={y} x2="1440" y2={y} pathLength="1" />
          ))}
        </svg>
      </div>
    );
  if (slug === "aurex-timepieces")
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 text-paper">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" fill="none" stroke="currentColor">
          <g data-ring opacity="0.35">
            <circle cx="900" cy="450" r="420" strokeWidth="0.75" strokeDasharray="2 10" />
          </g>
          <g data-ring opacity="0.5">
            <circle cx="900" cy="450" r="330" strokeWidth="0.75" />
            {Array.from({ length: 60 }).map((_, k) => {
              const a = (k / 60) * Math.PI * 2;
              const r1 = k % 5 === 0 ? 316 : 324;
              const f = (v: number) => v.toFixed(1);
              return <line key={k} x1={f(900 + Math.cos(a) * r1)} y1={f(450 + Math.sin(a) * r1)} x2={f(900 + Math.cos(a) * 330)} y2={f(450 + Math.sin(a) * 330)} strokeWidth="0.75" />;
            })}
          </g>
          <g data-ring opacity="0.7">
            <circle cx="900" cy="450" r="240" strokeWidth="1" strokeDasharray="40 24" />
          </g>
        </svg>
      </div>
    );
  return null;
}
