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

      /* ===== Coreografia de BOOT + FORJA (12/08, "hero mais impactante"):
         blackout → o terminal LIGA primeiro (flicker de CRT) → as letras
         do headline sobem da máscara JÁ EM BRASA e esfriam pro marfim →
         o "vendedor" acende por último com pulso de calor → o resto do
         conteúdo entra. Quem chega sente que ligou uma máquina. */
      const builder = root.querySelector<HTMLElement>("[data-hero-builder]");
      const items = root.querySelectorAll<HTMLElement>("[data-hero]:not([data-hero-builder])");
      // Palavras normais viram letras (SplitText, grátis desde o GSAP 3.13);
      // a palavra em gradiente anima inteira — split quebraria o bg-clip.
      const leadWords = root.querySelectorAll<HTMLElement>(
        "[data-hero-word]:not(.text-gradient)",
      );
      const gradWord = root.querySelector<HTMLElement>("[data-hero-word].text-gradient");
      gsap.set(items, { autoAlpha: 0, y: 26 });
      if (builder) gsap.set(builder, { autoAlpha: 0 });
      if (gradWord) gsap.set(gradWord, { autoAlpha: 0 });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // 1) boot: ~0,35s de escuridão e o terminal liga em flicker.
      if (builder) {
        tl.to(
          builder,
          {
            keyframes: [
              { autoAlpha: 0.5, duration: 0.06 },
              { autoAlpha: 0.08, duration: 0.05 },
              { autoAlpha: 0.85, duration: 0.07 },
              { autoAlpha: 0.3, duration: 0.05 },
              { autoAlpha: 1, duration: 0.14 },
            ],
          },
          0.35,
        );
      }

      // 2) forja: letras nascem cor de brasa (com calor no entorno) e
      //    esfriam pra cor final do tema enquanto assentam.
      if (leadWords.length) {
        // aria:"none": o default punha aria-label em <span> (proibido pela
        // spec ARIA, flag no Lighthouse) — o h1 já carrega o aria-label.
        const split = SplitText.create(leadWords, { type: "chars", mask: "chars", aria: "none" });
        const cool = getComputedStyle(leadWords[0]!).color;
        gsap.set(split.chars, {
          yPercent: 118,
          color: "#e8722c",
          textShadow: "0 0 22px rgba(232,80,20,0.55)",
        });
        tl.to(split.chars, { yPercent: 0, stagger: 0.016, duration: 0.75, ease: "power4.out" }, 0.8);
        tl.to(
          split.chars,
          { color: cool, textShadow: "0 0 0px rgba(232,80,20,0)", duration: 1.0, stagger: 0.014, ease: "power2.out" },
          1.05,
        );
      }

      // 3) "vendedor" acende por último: sobe + clarão que esfria.
      if (gradWord) {
        tl.fromTo(
          gradWord,
          { yPercent: 55, autoAlpha: 0, filter: "brightness(2.1) blur(8px)" },
          { yPercent: 0, autoAlpha: 1, filter: "brightness(1) blur(0px)", duration: 0.85, ease: "power2.out" },
          1.55,
        );
      }

      // 4) o resto do conteúdo (badge, subtítulo, lista, CTAs).
      tl.to(items, { autoAlpha: 1, y: 0, stagger: 0.07, duration: 0.6 }, 1.75);

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
