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

  // Ao trocar de rota, mata os ScrollTriggers ÓRFÃOS (trigger fora do DOM):
  // são eles que corrompem o refresh da página seguinte (re-entrância →
  // "Cannot read properties of undefined (reading 'end')"). NÃO pode ser um
  // kill geral: este cleanup roda DEPOIS dos effects da página nova (ordem
  // filho→pai do React), então um kill geral mataria os triggers recém-
  // criados — cards com revelação em opacity:0 ficavam invisíveis pra
  // sempre ao navegar client-side (bug real em /lab).
  useEffect(() => {
    return () => {
      ScrollTrigger.getAll().forEach((st) => {
        const el = st.trigger as Element | null;
        if (!el || !document.contains(el)) st.kill();
      });
      ScrollTrigger.refresh();
    };
  }, [pathname]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    // Em telas de toque o Lenis não melhora nada (só roda JS por frame e
    // piora o INP): o scroll nativo assume, com smooth via CSS no globals.
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (coarse) return;

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
