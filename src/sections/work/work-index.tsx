"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap, EASE, MQ, useGSAP } from "@/animations/gsap";

export type WorkRow = {
  n: string;
  slug: string;
  title: string;
  tagline: string;
  kind: string;
  image: string | null;
  href: string;
  client: string | null;
};

/**
 * Lista editorial do acervo. No desktop, o preview do projeto sob o cursor
 * flutua seguindo o mouse (um único <div> reposicionado por rAF via
 * quickTo — sem re-render). No touch a linha é só um link.
 */
export function WorkIndex({ groups }: { groups: { label: string; rows: WorkRow[] }[] }) {
  const root = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const pv = previewRef.current!;
      const mm = gsap.matchMedia();
      mm.add(`${MQ.fine} and ${MQ.noReduce}`, () => {
        const x = gsap.quickTo(pv, "x", { duration: 0.5, ease: EASE.outExpo });
        const y = gsap.quickTo(pv, "y", { duration: 0.5, ease: EASE.outExpo });
        const imgs = pv.querySelectorAll<HTMLElement>("[data-pv]");
        let current: string | null = null;

        const move = (e: PointerEvent) => {
          x(e.clientX + 24);
          y(e.clientY - pv.offsetHeight / 2);
        };
        const enter = (e: Event) => {
          const row = (e.currentTarget as HTMLElement).dataset.slug!;
          if (current === row) return;
          current = row;
          imgs.forEach((im) => (im.style.opacity = im.dataset.pv === row ? "1" : "0"));
          gsap.to(pv, { autoAlpha: 1, scale: 1, duration: 0.4, ease: EASE.outExpo, overwrite: true });
        };
        const leave = () => {
          current = null;
          gsap.to(pv, { autoAlpha: 0, scale: 0.92, duration: 0.3, ease: EASE.outQuint, overwrite: true });
        };
        gsap.set(pv, { autoAlpha: 0, scale: 0.92 });
        const rows = el.querySelectorAll<HTMLElement>("[data-slug]");
        rows.forEach((r) => {
          r.addEventListener("pointerenter", enter);
          r.addEventListener("pointerleave", leave);
        });
        el.addEventListener("pointermove", move);
        return () => {
          rows.forEach((r) => {
            r.removeEventListener("pointerenter", enter);
            r.removeEventListener("pointerleave", leave);
          });
          el.removeEventListener("pointermove", move);
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} className="relative mt-12 md:mt-20" data-inspect="WORK_INDEX">
      {groups.map((g) =>
        g.rows.length ? (
          <section key={g.label} className="mb-16">
            <p className="t-mono mb-2 text-ink-3">{g.label}</p>
            <ul className="border-t border-ink">
              {g.rows.map((r) => (
                <li key={r.slug} className="border-b border-neutral">
                  <Link href={r.href} data-slug={r.slug} className="grid-12 group items-baseline gap-y-1 py-4 transition-colors duration-fast hover:bg-paper-2 md:py-5">
                    <span className="t-mono col-span-1 tnum text-ink-3">{r.n}</span>
                    <span className="t-display t-display-sm col-span-3 text-ink md:col-span-4 lg:col-span-5">{r.title}</span>
                    <span className="col-span-4 text-step-0 text-ink-2 md:col-span-2 lg:col-span-4">{r.tagline}</span>
                    <span className="t-mono col-span-4 text-ink-3 md:col-span-1 md:text-right lg:col-span-2">
                      {r.client ? `${r.client}` : r.kind}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null,
      )}

      {/* preview flutuante (desktop) */}
      <div ref={previewRef} aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-overlay hidden w-[22vw] max-w-[360px] md:block">
        {groups.flatMap((g) => g.rows).map(
          (r) =>
            r.image && (
              <div key={r.slug} data-pv={r.slug} className="absolute inset-0 aspect-[16/10] overflow-hidden bg-neutral opacity-0 transition-opacity duration-fast">
                <Image src={r.image} alt="" width={720} height={450} sizes="22vw" className="h-full w-full object-cover object-top" />
              </div>
            ),
        )}
        <div className="aspect-[16/10]" />
      </div>
    </div>
  );
}
