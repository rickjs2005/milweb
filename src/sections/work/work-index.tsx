"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap, EASE, MQ, useGSAP } from "@/animations/gsap";

export type WorkRow = {
  n: string;
  slug: string;
  title: string;
  tagline: string;
  displayType: string;
  year: number | null;
  image: string | null;
  href: string;
  client: string | null;
  webgl: boolean;
  scroll: boolean;
  product: boolean;
};

type Filter = "all" | "client" | "scroll" | "webgl" | "product";

/**
 * Arquivo editorial: INDEX · PROJECT · TYPE · YEAR/CLIENT. Filtros poucos.
 * No desktop o preview do projeto sob o cursor flutua (um único nó
 * reposicionado por quickTo — sem re-render). Hover nunca é necessário:
 * cada linha é um link.
 */
export function WorkIndex({ rows, labels }: { rows: WorkRow[]; labels: Record<"all" | "client" | "scroll" | "webgl" | "product" | "index" | "project" | "type" | "year" | "studio", string> }) {
  const root = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const visible = useMemo(
    () => rows.filter((r) => (filter === "all" ? true : filter === "client" ? !!r.client : filter === "scroll" ? r.scroll : filter === "webgl" ? r.webgl : r.product)),
    [rows, filter],
  );
  const counts: Record<Filter, number> = {
    all: rows.length,
    client: rows.filter((r) => r.client).length,
    scroll: rows.filter((r) => r.scroll).length,
    webgl: rows.filter((r) => r.webgl).length,
    product: rows.filter((r) => r.product).length,
  };

  useGSAP(
    () => {
      const el = root.current!;
      const pv = previewRef.current!;
      const mm = gsap.matchMedia();
      mm.add(`${MQ.fine} and ${MQ.noReduce}`, () => {
        const x = gsap.quickTo(pv, "x", { duration: 0.5, ease: EASE.outExpo });
        const y = gsap.quickTo(pv, "y", { duration: 0.5, ease: EASE.outExpo });
        const imgs = pv.querySelectorAll<HTMLElement>("[data-pv]");
        gsap.set(pv, { autoAlpha: 0, scale: 0.92 });
        const move = (e: PointerEvent) => {
          x(Math.min(e.clientX + 40, window.innerWidth - pv.offsetWidth - 16));
          y(e.clientY - pv.offsetHeight / 2);
        };
        const showFor = (slug: string) => {
          imgs.forEach((im) => (im.style.opacity = im.dataset.pv === slug ? "1" : "0"));
          gsap.to(pv, { autoAlpha: 1, scale: 1, duration: 0.4, ease: EASE.outExpo, overwrite: true });
        };
        const over = (e: PointerEvent) => {
          const row = (e.target as HTMLElement).closest<HTMLElement>("[data-slug]");
          if (row) showFor(row.dataset.slug!);
        };
        // Teclado: ao focar uma linha, o preview aparece ancorado à própria linha.
        const focus = (e: FocusEvent) => {
          const row = (e.target as HTMLElement).closest<HTMLElement>("[data-slug]");
          if (!row) return;
          const r = row.getBoundingClientRect();
          x(Math.min(r.left + r.width * 0.55, window.innerWidth - pv.offsetWidth - 16));
          y(r.top + r.height / 2 - pv.offsetHeight / 2);
          showFor(row.dataset.slug!);
        };
        const leave = () => gsap.to(pv, { autoAlpha: 0, scale: 0.92, duration: 0.3, ease: EASE.outQuint, overwrite: true });
        el.addEventListener("focusin", focus);
        el.addEventListener("focusout", leave);
        el.addEventListener("pointerover", over);
        el.addEventListener("pointerleave", leave);
        el.addEventListener("pointermove", move);
        return () => {
          el.removeEventListener("focusin", focus);
          el.removeEventListener("focusout", leave);
          el.removeEventListener("pointerover", over);
          el.removeEventListener("pointerleave", leave);
          el.removeEventListener("pointermove", move);
        };
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [filter] },
  );

  const filters: Filter[] = ["all", "client", "scroll", "webgl", "product"];

  return (
    <div className="mt-12 md:mt-20">
      <div className="flex flex-wrap gap-x-6 gap-y-2 t-mono" role="group" aria-label={labels.all} data-no-inspect>
        {filters.map((f) => (
          <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={"link-rule py-1 transition-colors duration-fast " + (filter === f ? "signal-dot text-ink" : "text-ink-3 hover:text-ink")}>
            {labels[f]} <span className="tnum">({String(counts[f]).padStart(2, "0")})</span>
          </button>
        ))}
      </div>

      <div ref={root} className="relative mt-8" data-inspect="WORK_INDEX">
        <div className="hidden border-b border-ink pb-2 t-mono text-ink-3 md:grid-12">
          <span className="col-span-1">{labels.index}</span>
          <span className="col-span-4 lg:col-span-5">{labels.project}</span>
          <span className="col-span-2 lg:col-span-4">{labels.type}</span>
          <span className="col-span-1 text-right lg:col-span-2">{labels.year}</span>
        </div>
        <ul>
          {visible.map((r) => (
            <li key={r.slug} className="border-b border-neutral">
              <Link href={r.href} data-slug={r.slug} className="grid-12 group items-baseline gap-y-1 py-4 transition-colors duration-fast hover:bg-paper-2 md:py-5">
                <span className="t-mono col-span-1 hidden tnum text-ink-3 md:block">{r.n}</span>
                {r.image && (
                  <span className="relative col-span-1 block aspect-[16/10] w-full overflow-hidden bg-neutral md:hidden">
                    <Image src={r.image} alt="" fill sizes="96px" className="object-cover object-top" />
                  </span>
                )}
                <span className="t-display col-span-3 text-[clamp(1.5rem,2.6vw,2.6rem)] text-ink md:col-span-4 lg:col-span-5">{r.title}</span>
                <span className="t-mono col-span-4 text-ink-2 md:col-span-2 lg:col-span-4">
                  <span className="tnum text-ink-3 md:hidden">{r.n} · </span>
                  {r.displayType}
                  <span className="mt-1 block normal-case tracking-normal text-ink-3">{r.tagline}</span>
                </span>
                <span className="t-mono col-span-4 text-ink-3 md:col-span-1 md:text-right lg:col-span-2">{r.client ? r.client.toUpperCase() : r.year ?? labels.studio}</span>
              </Link>
            </li>
          ))}
        </ul>

        {/* preview flutuante (desktop) */}
        <div ref={previewRef} aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-overlay hidden w-[16vw] max-w-[260px] md:block">
          {rows.map(
            (r) =>
              r.image && (
                <div key={r.slug} data-pv={r.slug} className="absolute inset-0 aspect-[16/10] overflow-hidden bg-neutral opacity-0 transition-opacity duration-fast">
                  <Image src={r.image} alt="" width={640} height={400} sizes="20vw" className="h-full w-full object-cover object-top" />
                </div>
              ),
          )}
          <div className="aspect-[16/10]" />
        </div>
      </div>
    </div>
  );
}
