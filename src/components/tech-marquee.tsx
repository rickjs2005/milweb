"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";

gsap.registerPlugin(useGSAP);

/** Carrossel infinito de techs (ilha client). Os itens são strings puras,
 *  então não dependem de idioma — o texto localizado fica na Server Component. */
export function TechMarquee({ items }: { items: string[] }) {
  const scope = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useGSAP(
    () => {
      const track = trackRef.current;
      if (!track) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      tweenRef.current = gsap.to(track, {
        xPercent: -50,
        duration: items.length * 2.4,
        ease: "none",
        repeat: -1,
      });
    },
    { scope },
  );

  const slow = () => tweenRef.current?.timeScale(0);
  const resume = () => tweenRef.current?.timeScale(1);

  return (
    <div
      ref={scope}
      className="mt-10 rounded-2xl border border-line/10 glass py-5"
      onMouseEnter={slow}
      onMouseLeave={resume}
    >
      <div
        className="overflow-hidden"
        style={{
          WebkitMaskImage: "linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)",
          maskImage: "linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)",
        }}
      >
        <div ref={trackRef} className="flex w-max gap-3 will-change-transform">
          {[...items, ...items].map((it, i) => (
            <span
              key={`${it}-${i}`}
              aria-hidden={i >= items.length ? true : undefined}
              className="shrink-0 rounded-lg border border-line/10 bg-surface-2 px-3 py-1.5 text-sm text-fg-muted transition-colors hover:border-accent/40 hover:text-fg"
            >
              {it}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
