"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useLang } from "./lang-provider";
import { Reveal } from "./reveal";
import { UI, TECH } from "@/lib/content";

gsap.registerPlugin(useGSAP);

const ALL_TECH = TECH.flatMap((g) => g.items);

export function Tech() {
  const { t } = useLang();
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
        duration: ALL_TECH.length * 2.4,
        ease: "none",
        repeat: -1,
      });
    },
    { scope },
  );

  const slow = () => tweenRef.current?.timeScale(0);
  const resume = () => tweenRef.current?.timeScale(1);

  return (
    <section id="tech" className="container-page scroll-mt-20 py-20 sm:py-32">
      <Reveal>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          <span className="text-accent/40">05 / </span>
          {t(UI.sections.techEyebrow)}
        </p>
        <h2 className="mt-3 text-4xl font-bold tracking-tight text-fg sm:text-5xl lg:text-6xl">
          {t(UI.sections.techTitle)}
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-fg-subtle">{t(UI.sections.techSub)}</p>
      </Reveal>

      <Reveal delay={60}>
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
              {[...ALL_TECH, ...ALL_TECH].map((it, i) => (
                <span
                  key={`${it}-${i}`}
                  aria-hidden={i >= ALL_TECH.length ? true : undefined}
                  className="shrink-0 rounded-lg border border-line/10 bg-surface-2 px-3 py-1.5 text-sm text-fg-muted transition-colors hover:border-accent/40 hover:text-fg"
                >
                  {it}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Reveal>

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        {TECH.map((g, i) => (
          <Reveal key={g.group.en} delay={i * 90}>
            <div className="h-full rounded-2xl border border-line/10 glass p-6">
              <p className="font-mono text-xs uppercase tracking-wider text-accent">{t(g.group)}</p>
              <p className="mt-3 text-sm leading-relaxed text-fg-muted">{g.items.join(" · ")}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
