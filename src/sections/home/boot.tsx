"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, EASE, useGSAP } from "@/animations/gsap";
import { useScroll } from "@/components/scroll-provider";

const KEY = "mw:booted";

/**
 * ACT 01 — BOOT. Assinatura de entrada: três linhas de identidade e um boot
 * curto em mono. Dura ≤1.4 s, roda uma vez por sessão, é pulável com
 * clique/tecla e não existe com prefers-reduced-motion. O overlay sobe em
 * clip-path revelando o hero já pronto por baixo (o LCP não espera).
 */
export function Boot({ mark, tagline, origin, lines, skip }: { mark: string; tagline: string; origin: string; lines: string[]; skip: string }) {
  const [active, setActive] = useState<boolean | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const { stop, start } = useScroll();

  useEffect(() => {
    let booted = false;
    try {
      booted = sessionStorage.getItem(KEY) === "1";
    } catch {}
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setActive(!booted && !reduce);
  }, []);

  useGSAP(
    () => {
      if (!active || !root.current) return;
      stop();
      window.scrollTo(0, 0);
      const el = root.current;
      const id = el.querySelectorAll<HTMLElement>("[data-boot-id]");
      const ln = el.querySelectorAll<HTMLElement>("[data-boot-line]");
      const cursor = el.querySelector<HTMLElement>("[data-boot-cursor]");

      const finish = () => {
        try {
          sessionStorage.setItem(KEY, "1");
        } catch {}
        start();
        setActive(false);
      };

      const tl = gsap.timeline({ onComplete: finish });
      tl.set(ln, { autoAlpha: 0 });
      tl.fromTo(id, { yPercent: 40, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, stagger: 0.06, duration: 0.5, ease: EASE.outExpo }, 0.05);
      tl.to(ln, { autoAlpha: 1, stagger: 0.14, duration: 0.01 }, 0.45);
      if (cursor) tl.fromTo(cursor, { opacity: 1 }, { opacity: 0, repeat: 5, yoyo: true, duration: 0.09, ease: "none" }, 0.45);
      tl.to(el, { clipPath: "inset(0 0 100% 0)", duration: 0.7, ease: EASE.inOutQuart }, 1.15);

      const skipNow = () => tl.progress(1);
      el.addEventListener("pointerdown", skipNow);
      window.addEventListener("keydown", skipNow, { once: true });
      return () => {
        el.removeEventListener("pointerdown", skipNow);
        window.removeEventListener("keydown", skipNow);
      };
    },
    { dependencies: [active], scope: root },
  );

  if (!active) return null;

  return (
    <div
      ref={root}
      className="fixed inset-0 z-boot flex flex-col justify-between bg-ink px-margin py-8 text-paper [clip-path:inset(0_0_0_0)]"
      role="status"
      aria-label={mark}
    >
      <div className="flex items-center justify-between t-mono text-paper/60">
        <span>{mark}</span>
        <button type="button" className="link-rule" onClick={() => root.current?.dispatchEvent(new Event("pointerdown"))}>
          {skip} →
        </button>
      </div>

      <div className="t-mono">
        <p data-boot-id className="t-display t-display-sm text-paper">
          {mark}
        </p>
        <p data-boot-id className="mt-4 text-paper">
          {tagline}
        </p>
        <p data-boot-id className="text-paper/60">
          {origin}
        </p>
      </div>

      <ol className="t-mono text-paper/70" aria-hidden="true">
        {lines.map((l) => (
          <li key={l} data-boot-line>
            <span className="text-signal">&gt;</span> {l}
          </li>
        ))}
        <li>
          <span data-boot-cursor className="inline-block h-[1em] w-[0.6em] translate-y-[0.15em] bg-signal" />
        </li>
      </ol>
    </div>
  );
}
