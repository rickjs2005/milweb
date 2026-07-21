"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

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
      // Mobile (pointer coarse): NENHUMA animação de entrada — o conteúdo
      // aparece direto. Antes, o SplitText picotava o headline em ~40 spans
      // e o texto ficava autoAlpha:0 até o JS hidratar num CPU throttled:
      // LCP ia de ~1,6s pra 4,2s e o TBT estourava (Lighthouse mobile 52).
      if (window.matchMedia("(pointer: coarse)").matches) return;

      const items = root.querySelectorAll<HTMLElement>("[data-hero]");
      // Palavras normais viram letras (SplitText, grátis desde o GSAP 3.13);
      // a palavra em gradiente anima inteira — split quebraria o bg-clip.
      const leadWords = root.querySelectorAll<HTMLElement>(
        "[data-hero-word]:not(.text-gradient)",
      );
      const gradWord = root.querySelector<HTMLElement>("[data-hero-word].text-gradient");
      const visual = root.querySelector<HTMLElement>(".hero-visual");
      gsap.set(items, { autoAlpha: 0, y: 26 });
      if (visual) gsap.set(visual, { autoAlpha: 0, scale: 0.9 });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.to(items, { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.7 }, 0.1);
      if (leadWords.length) {
        // Letras sobem de dentro de uma máscara — o reveal "de editorial".
        // aria:"none": o default punha aria-label em <span> (proibido pela
        // spec ARIA, flag no Lighthouse) — o h1 já carrega o aria-label.
        const split = SplitText.create(leadWords, { type: "chars", mask: "chars", aria: "none" });
        tl.from(
          split.chars,
          { yPercent: 118, stagger: 0.016, duration: 0.75, ease: "power4.out" },
          0.18,
        );
      }
      if (gradWord) {
        tl.from(
          gradWord,
          { yPercent: 55, autoAlpha: 0, filter: "blur(12px)", duration: 0.8 },
          "-=0.45",
        );
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

      // Desmontagem ao rolar (scrub, desktop): SÓ movimento de camadas em
      // velocidades diferentes + glow encolhendo — SEM esmaecer o texto
      // (autoAlpha aqui apagava subtítulo/CTAs com meia rolagem e parecia
      // conteúdo quebrado; a cena 3D já tem o próprio desmancho no scroll).
      // yPercent/scale não conflitam com o x/y do mouse-parallax (canais
      // de transform separados no GSAP).
      if (window.matchMedia("(pointer: fine)").matches) {
        const h1 = root.querySelector<HTMLElement>("h1");
        const glow = root.querySelector<HTMLElement>("[data-depth='0.5']");
        const tear = gsap.timeline({
          scrollTrigger: { trigger: root, start: "top top", end: "bottom 30%", scrub: 0.6 },
        });
        if (h1) tear.to(h1, { yPercent: -22, ease: "none" }, 0);
        tear.to(items, { yPercent: -12, ease: "none" }, 0);
        if (glow) tear.to(glow, { opacity: 0.1, scale: 0.8, ease: "none" }, 0);
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
