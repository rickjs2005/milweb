"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap, EASE, MQ, ScrollTrigger, useGSAP } from "@/animations/gsap";

type Step = { label: string; text: string; image: string };

/**
 * 03 — EXPERIENCE. Desktop: a mídia fica presa (sticky) enquanto os passos
 * rolam à esquerda; a imagem troca quando cada passo cruza o centro. Mobile
 * e reduced-motion: texto / mídia / texto / mídia, sem sticky.
 */
export function CaseExperience({ label, steps, title }: { label: string; steps: Step[]; title: string }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const mm = gsap.matchMedia();
      mm.add(`${MQ.noReduce} and (min-width: 1080px)`, () => {
        const imgs = Array.from(el.querySelectorAll<HTMLElement>("[data-media]"));
        const items = Array.from(el.querySelectorAll<HTMLElement>("[data-step]"));
        const show = (i: number) => {
          imgs.forEach((im, k) => gsap.to(im, { autoAlpha: k === i ? 1 : 0, scale: k === i ? 1 : 1.04, duration: 0.6, ease: EASE.outExpo, overwrite: true }));
          items.forEach((it, k) => it.classList.toggle("is-active", k === i));
        };
        show(0);
        const triggers = items.map((it, i) =>
          ScrollTrigger.create({ trigger: it, start: "top 55%", end: "bottom 55%", onEnter: () => show(i), onEnterBack: () => show(i) }),
        );
        return () => triggers.forEach((t) => t.kill());
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="container-page py-14 md:py-24" data-inspect="EXPERIENCE">
      <div className="rule pt-3 t-mono text-ink-3">{label}</div>
      <div className="mt-10 lg:grid lg:grid-cols-12 lg:gap-x-gutter">
        {/* passos */}
        <ol className="lg:col-span-5">
          {steps.map((s, i) => (
            <li key={s.label} data-step className="case-step border-t border-neutral py-8 first:border-t-0 lg:min-h-[60svh] lg:py-[20svh] lg:first:pt-8">
              <p className="t-mono text-ink-3">
                <span className="tnum">{String(i + 1).padStart(2, "0")}</span> / {s.label}
              </p>
              <p className="t-lead mt-4 max-w-md text-ink">{s.text}</p>
              {/* mobile: mídia inline após cada passo */}
              {s.image && (
                <div className="relative mt-6 aspect-[16/10] overflow-hidden bg-neutral lg:hidden">
                  <Image src={s.image} alt={`${title} — ${s.label}`} fill loading="lazy" sizes="100vw" className="object-cover object-top" />
                </div>
              )}
            </li>
          ))}
        </ol>
        {/* mídia sticky (desktop) */}
        <div className="hidden lg:col-span-7 lg:block">
          <div className="sticky top-[calc(var(--nav-h)+1rem)] aspect-[16/10] overflow-hidden bg-neutral" data-inspect="STICKY_MEDIA">
            {steps.map((s, i) => (
              <div key={s.label + i} data-media className={"absolute inset-0 " + (i === 0 ? "" : "opacity-0")}>
                {s.image && <Image src={s.image} alt="" fill loading={i === 0 ? "eager" : "lazy"} sizes="60vw" className="object-cover object-top" />}
                <span className="t-mono absolute bottom-3 left-3 bg-paper px-2 py-1 text-ink">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
