"use client";

import { useRef } from "react";
import { gsap, EASE, MQ, useGSAP } from "@/animations/gsap";
import type { CaseVariant } from "@/data/case-stories";

/**
 * Camadas do hero por mundo — decorativas, dentro da própria mídia:
 *  terral · câmera lenta: a imagem entra em 1.06 e deriva (scrub) — sem scanner.
 *  vertex · guias arquitetônicas 1px + cotas sobre a mídia (grid como coadjuvante).
 *  aurex  · um anel de ticks que desacelera com peso ao entrar; mídia em recorte suave.
 *  kavita · linha de varredura única (já é a assinatura do mundo na Home).
 * Reduced-motion: camadas estáticas, sem tween.
 */
export function CaseHeroLayers({ variant, words }: { variant: CaseVariant; words: string[] }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const img = el.parentElement?.querySelector<HTMLElement>("[data-hero-img]");
      const mm = gsap.matchMedia();
      mm.add(MQ.noReduce, () => {
        if (variant === "terral" && img) {
          gsap.fromTo(img, { scale: 1.06, yPercent: -2 }, { scale: 1, yPercent: 2, ease: "none", scrollTrigger: { trigger: el, start: "top 80%", end: "bottom top", scrub: 1.2 } });
        }
        if (variant === "vertex") {
          gsap.fromTo(el.querySelectorAll("[data-guide]"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, stagger: 0.08, duration: 1.4, ease: EASE.outExpo, delay: 0.2 });
          gsap.fromTo(el.querySelectorAll("[data-measure]"), { autoAlpha: 0 }, { autoAlpha: 1, stagger: 0.08, duration: 0.5, delay: 0.9 });
        }
        if (variant === "aurex") {
          // desaceleração com peso: uma volta que freia (outQuint), não rotation += x
          gsap.fromTo(el.querySelector("[data-ring]"), { rotate: -120, scale: 0.9, autoAlpha: 0, transformOrigin: "50% 50%" }, { rotate: 0, scale: 1, autoAlpha: 1, duration: 2.2, ease: EASE.outQuint, delay: 0.15 });
          if (img) gsap.fromTo(img, { scale: 1.08 }, { scale: 1, duration: 2.2, ease: EASE.outQuint });
        }
        if (variant === "kavita") {
          gsap.fromTo(el.querySelector("[data-scan]"), { left: "0%", autoAlpha: 1 }, { left: "100%", autoAlpha: 0, duration: 1.6, ease: EASE.inOutQuart, delay: 0.3 });
        }
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [variant] },
  );

  return (
    <div ref={root} aria-hidden="true" className="pointer-events-none absolute inset-0">
      {variant === "kavita" && <span data-scan className="absolute top-0 h-full w-px bg-signal opacity-0" />}
      {variant === "vertex" && (
        <>
          <svg className="absolute inset-0 h-full w-full text-paper/70" viewBox="0 0 1440 900" preserveAspectRatio="none" fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke">
            {[240, 720, 1200].map((x) => (
              <line key={x} data-guide x1={x} y1="0" x2={x} y2="900" pathLength="1" strokeDasharray="1" strokeDashoffset="1" />
            ))}
            {[225, 675].map((y) => (
              <line key={y} data-guide x1="0" y1={y} x2="1440" y2={y} pathLength="1" strokeDasharray="1" strokeDashoffset="1" />
            ))}
          </svg>
          <ul className="t-mono absolute bottom-4 left-4 text-paper/80 md:bottom-6 md:left-6">
            {words.slice(0, 3).map((w, i) => (
              <li key={w} data-measure>
                {String(i + 1).padStart(2, "0")} {w}
              </li>
            ))}
          </ul>
        </>
      )}
      {variant === "aurex" && (
        <svg className="absolute inset-0 h-full w-full text-paper/60" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" fill="none" stroke="currentColor">
          <g data-ring>
            <circle cx="720" cy="450" r="380" strokeWidth="0.75" strokeDasharray="3 14" />
            {Array.from({ length: 48 }).map((_, k) => {
              const a = (k / 48) * Math.PI * 2;
              const f = (v: number) => v.toFixed(1);
              const r1 = k % 4 === 0 ? 360 : 370;
              return <line key={k} x1={f(720 + Math.cos(a) * r1)} y1={f(450 + Math.sin(a) * r1)} x2={f(720 + Math.cos(a) * 380)} y2={f(450 + Math.sin(a) * 380)} strokeWidth="0.75" />;
            })}
          </g>
        </svg>
      )}
      {variant === "terral" && <span className="grain absolute inset-0 opacity-30" />}
    </div>
  );
}
