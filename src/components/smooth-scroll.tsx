"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Smooth scroll (Lenis) sincronizado com o ScrollTrigger do GSAP.
 * Desligado quando o usuário pede menos movimento (prefers-reduced-motion):
 * nesse caso o scroll nativo do navegador assume.
 */
export function SmoothScroll() {
  const pathname = usePathname();

  // Ao SAIR de uma rota, mata todos os ScrollTriggers para a próxima página
  // começar com a lista global do GSAP limpa. Sem isso, triggers de uma página
  // sobrevivem à navegação client-side e corrompem o refresh da próxima
  // (re-entrância → "Cannot read properties of undefined (reading 'end')").
  useEffect(() => {
    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, [pathname]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });

    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // Âncoras (#projects, #about...) rolam suave via Lenis.
    const onClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest<HTMLAnchorElement>(
        'a[href^="#"]',
      );
      if (!link) return;
      const id = link.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: -64 });
    };
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
      lenis.destroy();
      gsap.ticker.remove(raf);
    };
  }, []);

  return null;
}
