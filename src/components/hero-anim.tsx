"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Ilha client do Hero: roda a animação de entrada (GSAP) sobre os filhos
 * marcados com [data-hero] e o `.hero-visual`. O conteúdo em si é renderizado
 * no servidor e passado como children — o texto não vai no bundle do client.
 */
export function HeroAnim({
  children,
  id,
  className,
}: {
  children: ReactNode;
  id?: string;
  className?: string;
}) {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const items = root.querySelectorAll<HTMLElement>("[data-hero]");
      const words = root.querySelectorAll<HTMLElement>("[data-hero-word]");
      const visual = root.querySelector<HTMLElement>(".hero-visual");
      gsap.set(items, { autoAlpha: 0, y: 26 });
      if (words.length) gsap.set(words, { autoAlpha: 0, y: 30, rotateX: 45, transformPerspective: 600 });
      if (visual) gsap.set(visual, { autoAlpha: 0, scale: 0.9 });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.to(items, { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.7 }, 0.1);
      if (words.length) {
        tl.to(words, { autoAlpha: 1, y: 0, rotateX: 0, stagger: 0.055, duration: 0.7 }, 0.2);
      }
      if (visual) {
        tl.to(visual, { autoAlpha: 1, scale: 1, duration: 1, ease: "power4.out" }, 0.2);
        // Float contínuo + parallax sutil ao rolar.
        gsap.to(visual, { y: -14, duration: 3, ease: "sine.inOut", yoyo: true, repeat: -1 });
        gsap.to(visual, {
          yPercent: -10,
          ease: "none",
          scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: true },
        });
      }
    },
    { scope },
  );

  return (
    <section ref={scope} id={id} className={className}>
      {children}
    </section>
  );
}
