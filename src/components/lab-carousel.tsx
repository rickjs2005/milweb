"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Trilho horizontal do Lab: esconde a scrollbar nativa (feia por padrão) e
 * troca por setas com fade nas bordas + um "aceno" inicial (o trilho desliza
 * alguns pixels e volta) para deixar óbvio que dá pra rolar, sem precisar de
 * indicador estático.
 */
export function LabCarousel({ children, className = "" }: { children: ReactNode; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Parallax do Lab: dois efeitos independentes por card (propriedades
  // diferentes, não competem entre si).
  useGSAP(
    () => {
      const scroller = scrollerRef.current;
      if (!scroller) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const cards = scroller.querySelectorAll<HTMLElement>("[data-lab-card]");
      cards.forEach((card, i) => {
        // Revelação de entrada: dispara UMA vez ao cruzar o ponto de
        // gatilho (não é scrub) -- fica visível rápido, sem exigir uma
        // quantidade exata de scroll pra sair do quase-invisível.
        gsap.fromTo(
          card,
          { opacity: 0, scale: 0.88 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.8,
            delay: i * 0.06,
            ease: "power3.out",
            scrollTrigger: { trigger: card, start: "top 92%", toggleActions: "play none none none" },
          },
        );

        // Zigue-zague vertical: cards pares sobem, ímpares descem --
        // dá profundidade enquanto a seção inteira rola.
        const offset = i % 2 === 0 ? -28 : 28;
        gsap.fromTo(
          card,
          { y: -offset },
          {
            y: offset,
            ease: "none",
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.6,
            },
          },
        );
      });
    },
    { scope: containerRef },
  );

  const updateEdges = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateEdges();
    el.addEventListener("scroll", updateEdges, { passive: true });
    window.addEventListener("resize", updateEdges);

    // Aceno inicial: desliza um pouco e volta, para sinalizar que rola.
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let hintTimer: number | undefined;
    if (!reduce && el.scrollWidth > el.clientWidth) {
      hintTimer = window.setTimeout(() => {
        el.scrollTo({ left: 64, behavior: "smooth" });
        window.setTimeout(() => el.scrollTo({ left: 0, behavior: "smooth" }), 550);
      }, 900);
    }

    return () => {
      el.removeEventListener("scroll", updateEdges);
      window.removeEventListener("resize", updateEdges);
      window.clearTimeout(hintTimer);
    };
  }, []);

  const scrollByCard = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-lab-card]");
    const gap = 24;
    const amount = (card?.offsetWidth ?? el.clientWidth * 0.8) + gap;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth py-9 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      {/* Fade nas bordas -- só aparece do lado que ainda tem conteúdo pra rolar. */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-bg to-transparent transition-opacity duration-300 sm:w-16 ${
          canScrollLeft ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-bg to-transparent transition-opacity duration-300 sm:w-16 ${
          canScrollRight ? "opacity-100" : "opacity-0"
        }`}
      />

      <button
        type="button"
        onClick={() => scrollByCard(-1)}
        aria-label="Anterior"
        tabIndex={canScrollLeft ? 0 : -1}
        className={`absolute left-1 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line/15 bg-bg/85 text-fg backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-bg sm:flex ${
          canScrollLeft ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => scrollByCard(1)}
        aria-label="Próximo"
        tabIndex={canScrollRight ? 0 : -1}
        className={`absolute right-1 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line/15 bg-bg/85 text-fg backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-bg sm:flex ${
          canScrollRight ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
