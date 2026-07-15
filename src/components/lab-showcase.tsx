"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LabVideo } from "./lab-video";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export type LabShowcaseItem = {
  key: string;
  category: string;
  title: string;
  desc: string;
  poster: string;
  src: string;
  ctaLabel: string;
  ctaHref: string;
  /** Velocidade relativa do parallax (1 = neutro, <1 fica pra trás, >1 avança). */
  speed: number;
};

/** Amplitude máxima (px) do parallax -- escalada pela velocidade relativa,
 * não a diferença de scroll "real": cards empilhados em fluxo normal não
 * podem se deslocar centenas de px sem colidir com o vizinho. */
const PARALLAX_RANGE = 70;

/**
 * Galeria premium do Lab: cada card nasce (blur + escala + slide) ao entrar
 * na viewport, com pequena cascata entre eles, texto em stagger e parallax
 * de profundidade com velocidade própria por card. Hover (desktop) é só
 * CSS -- barato e sem disputar propriedades com o GSAP.
 */
export function LabShowcase({ items }: { items: LabShowcaseItem[] }) {
  const scopeRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      // Telas de toque ficam sem os efeitos de scroll: viewports móveis
      // (barra de endereço, in-app browsers) quebram as medidas do
      // ScrollTrigger e os cards ficavam presos quase invisíveis.
      // O conteúdo aparece direto; o hover/glow é desktop de qualquer jeito.
      if (window.matchMedia("(pointer: coarse)").matches) return;

      const cards = gsap.utils.toArray<HTMLElement>("[data-showcase-card]");
      cards.forEach((card, i) => {
        const reveal = card.querySelector<HTMLElement>("[data-showcase-reveal]");
        const parallax = card.querySelector<HTMLElement>("[data-showcase-parallax]");
        const textEls = card.querySelectorAll<HTMLElement>("[data-showcase-text]");
        if (!reveal) return;

        // Entrada: dispara UMA vez ao entrar na viewport (não é scrub) --
        // fica visível rápido, sem depender de rolar uma quantidade exata.
        const tl = gsap.timeline({
          delay: i * 0.06,
          scrollTrigger: { trigger: card, start: "top 85%", toggleActions: "play none none none" },
          onStart: () => gsap.set(reveal, { willChange: "transform, opacity, filter" }),
          onComplete: () => gsap.set(reveal, { willChange: "auto" }),
        });
        tl.fromTo(
          reveal,
          { opacity: 0, scale: 0.92, y: 120, filter: "blur(20px)" },
          { opacity: 1, scale: 1, y: 0, filter: "blur(0px)", duration: 1.2, ease: "power4.out" },
        );
        if (textEls.length) {
          // Categoria -> título -> descrição -> botão, um após o outro.
          tl.fromTo(
            textEls,
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", stagger: 0.12 },
            "-=0.7",
          );
        }

        // Foco: o card recua sutilmente assim que o próximo já está
        // tomando conta da tela -- destaque migra pro card seguinte.
        gsap.fromTo(
          card,
          { opacity: 1 },
          {
            opacity: 0.95,
            ease: "none",
            scrollTrigger: { trigger: card, start: "center 35%", end: "bottom top", scrub: 0.6 },
          },
        );

        // Parallax contínuo -- cada card com sua própria velocidade.
        if (parallax) {
          const amplitude = (items[i].speed - 1) * PARALLAX_RANGE;
          gsap.fromTo(
            parallax,
            { y: -amplitude },
            {
              y: amplitude,
              ease: "none",
              scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: 0.6 },
            },
          );
        }
      });
    },
    { scope: scopeRef },
  );

  return (
    <div ref={scopeRef} className="flex flex-col gap-16 sm:gap-24 lg:gap-32">
      {items.map((item) => (
        <div key={item.key} data-showcase-card className="relative">
          <div data-showcase-parallax>
            <div
              data-showcase-reveal
              className="group relative overflow-hidden rounded-3xl border border-line/10 bg-surface-2/60 transition-[box-shadow,border-color] duration-500 hover:border-accent/40 hover:shadow-[0_0_60px_-12px_rgb(var(--accent)/0.45)]"
            >
              <div className="relative aspect-[4/5] overflow-hidden sm:aspect-[16/9]">
                <div className="h-full w-full transition-transform duration-700 ease-out will-change-transform group-hover:scale-[1.08]">
                  <LabVideo src={item.src} poster={item.poster} label={item.title} />
                </div>

                {/* Overlay escuro (base) + brilho azul que entra no hover. */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg via-bg/45 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-100"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-accent/25 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />

                <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-6 sm:p-10">
                  <p
                    data-showcase-text
                    className="font-mono text-xs uppercase tracking-[0.2em] text-accent"
                  >
                    {item.category}
                  </p>
                  <h3
                    data-showcase-text
                    className="text-2xl font-bold tracking-tight text-fg sm:text-4xl"
                  >
                    {item.title}
                  </h3>
                  <p data-showcase-text className="max-w-xl text-sm text-fg-muted sm:text-base">
                    {item.desc}
                  </p>
                  <Link
                    data-showcase-text
                    href={item.ctaHref}
                    className="mt-3 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-accent transition-colors hover:text-accent-soft"
                  >
                    {item.ctaLabel}
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
