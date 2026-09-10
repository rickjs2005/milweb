"use client";

import Image from "next/image";
import { useRef, type CSSProperties } from "react";
import { gsap, MQ, useGSAP } from "@/animations/gsap";

type OrbitalHeroProps = {
  act: string;
  headline: readonly string[];
  support: readonly string[];
  sub: string;
  cta: string;
};

/** An immediate, image-backed opening. Motion enhances it; no GPU is required. */
export function OrbitalHero({ act, headline, support, sub, cta }: OrbitalHeroProps) {
  const root = useRef<HTMLElement>(null);

  useGSAP(() => {
    const el = root.current!;
    const mm = gsap.matchMedia();

    mm.add(MQ.noReduce, () => {
      const intro = el.querySelector("[data-orbit-intro]");
      let entrance: gsap.core.Tween | undefined;
      const reveal = () => {
        entrance = gsap.fromTo(intro,
          { scale: 1.12, rotation: -12 },
          { scale: 1, rotation: 0, duration: 1.8, ease: "power3.out", overwrite: true },
        );
      };
      if (document.documentElement.dataset.headline === "1") reveal();
      else window.addEventListener("mw:headline", reveal, { once: true });

      gsap.timeline({
        scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: 0.7 },
        defaults: { ease: "none" },
      })
        .to(el.querySelector("[data-orbit-scroll]"), { yPercent: -18, rotation: 18, scale: 0.84 }, 0)
        .to(el.querySelector("[data-orbit-title]"), { yPercent: -20 }, 0)
        .to(el.querySelector("[data-orbit-note]"), { y: -36, opacity: 0 }, 0);

      return () => {
        window.removeEventListener("mw:headline", reveal);
        entrance?.revert();
      };
    });

    mm.add(`${MQ.fine} and ${MQ.noReduce}`, () => {
      const art = el.querySelector("[data-orbit-pointer]");
      const x = gsap.quickTo(art, "x", { duration: 1.2, ease: "power3.out" });
      const y = gsap.quickTo(art, "y", { duration: 1.2, ease: "power3.out" });
      const rotation = gsap.quickTo(art, "rotation", { duration: 1.4, ease: "power3.out" });
      const move = (event: PointerEvent) => {
        const bounds = el.getBoundingClientRect();
        const px = (event.clientX - bounds.left) / bounds.width - 0.5;
        const py = event.clientY / window.innerHeight - 0.5;
        x(px * 36);
        y(py * 26);
        rotation(px * 7);
      };
      const reset = () => { x(0); y(0); rotation(0); };
      el.addEventListener("pointermove", move, { passive: true });
      el.addEventListener("pointerleave", reset);
      return () => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerleave", reset);
        x.tween.kill(); y.tween.kill(); rotation.tween.kill();
      };
    });
    return () => mm.revert();
  }, { scope: root });

  return (
    <section ref={root} id="build" data-act={act} className="orbital-hero">
      <div className="orbital-hero__stage">
        <div className="orbital-hero__note" data-orbit-note>
          <p className="orbital-hero__specialty t-mono"><span aria-hidden="true" />{support[0]}</p>
          <p className="orbital-hero__statement">{sub}</p>
        </div>

        <div className="orbital-hero__art" aria-hidden="true">
          <div data-orbit-scroll>
            <div data-orbit-pointer>
              <div data-orbit-intro>
                <Image src="/art/orbital-sculpture-v2.webp" alt="" width={1254} height={1254}
                  priority sizes="(max-width: 767px) 100vw, 70vw" className="orbital-hero__sculpture" />
              </div>
            </div>
          </div>
        </div>

        <h1 className="orbital-hero__title" data-orbit-title
          style={{ "--world-chars": headline[headline.length - 1].length } as CSSProperties}>
          <span className="orbital-hero__lead">{headline.slice(0, -1).join(" ")}</span>
          <span className="orbital-hero__world">{headline[headline.length - 1]}</span>
        </h1>

        <div className="orbital-hero__bottom">
          <span className="t-mono orbital-hero__origin">{support[support.length - 1]}</span>
          <a href="#work" className="orbital-hero__cta t-mono" data-cursor="link">
            <span>{cta.replace(/\s*↓$/, "")}</span><span className="orbital-hero__arrow" aria-hidden="true">↘</span>
          </a>
          <span className="orbital-hero__signature" aria-hidden="true">MW</span>
        </div>
      </div>
    </section>
  );
}
