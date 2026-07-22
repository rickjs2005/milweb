"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { LabVideo } from "./lab-video";
import { miloSay } from "@/lib/milo-bus";

gsap.registerPlugin(useGSAP);

export type LabShowcaseItem = {
  key: string;
  category: string;
  title: string;
  desc: string;
  poster: string;
  src: string;
  tags: string[];
  ctaLabel: string;
  ctaHref: string;
};

/** Geometria da esteira (desktop). */
const CARD_W = 300;
const GAP = 64;
const SLOT = CARD_W + GAP;
/** Deriva contínua da esteira (px/s) — o scroll soma impulso a isso. */
const DRIFT = 26;

/**
 * Vitrine infinita 3D do Lab: os filmes desfilam continuamente numa esteira
 * em perspectiva (rotateY + translateZ reais); o card central fica de
 * frente, ganha borda neon e reflexo de showroom, e o painel abaixo troca
 * título/descrição em sincronia. O scroll da página acelera/inverte a
 * esteira; clicar num card lateral o traz ao centro, clicar no central
 * avança o card em direção ao visitante e abre a página do Lab.
 *
 * Progressive enhancement: o SSR entrega um carrossel nativo com
 * scroll-snap (mobile/reduced-motion/ponteiro grosso ficam nele — telas de
 * toque quebram medidas de efeitos de scroll, ver histórico do projeto);
 * o modo esteira só liga no client em desktop com ponteiro fino.
 */
export function LabShowcase({
  items,
  miloCenterMsg,
}: {
  items: LabShowcaseItem[];
  /** Fala do Milo ao centralizar um card por clique ({title}). */
  miloCenterMsg?: string;
}) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const innerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const announcedRef = useRef(new Set<string>());
  const [belt, setBelt] = useState(false);
  const [center, setCenter] = useState(0);

  // Estado da esteira fora do React (mutado a cada frame pelo ticker).
  const beltState = useRef({ pos: 0, boost: 0, holdUntil: 0, width: 0, dists: [] as number[] });

  useEffect(() => {
    const fine = window.matchMedia("(min-width: 1024px) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setBelt(fine && !reduce);
  }, []);

  // Loop da esteira: posiciona cada card por frame com wrap-around
  // (nenhum clone no DOM — só 6 vídeos). O wrap acontece fora da tela
  // porque o comprimento total da esteira excede a largura visível.
  useGSAP(
    () => {
      if (!belt) return;
      const track = trackRef.current;
      if (!track) return;
      const cards = Array.from(track.querySelectorAll<HTMLElement>("[data-belt-card]"));
      const n = cards.length;
      if (!n) return;
      const total = n * SLOT;
      const s = beltState.current;
      s.width = track.clientWidth;
      s.dists = new Array(n).fill(0);
      let lastCenter = -1;

      const onResize = () => {
        s.width = track.clientWidth;
      };
      window.addEventListener("resize", onResize);

      // Impulso do scroll: só quando a seção está na tela.
      const onWheel = (e: WheelEvent) => {
        const rect = track.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        s.boost = gsap.utils.clamp(-1400, 1400, s.boost + e.deltaY * 1.1);
      };
      window.addEventListener("wheel", onWheel, { passive: true });

      const tick = (_time: number, deltaMs: number) => {
        const dt = Math.min(deltaMs, 100) / 1000;
        if (performance.now() > s.holdUntil) s.pos += (DRIFT + s.boost) * dt;
        s.boost *= Math.exp(-dt * 2.6);

        let best = 0;
        let bestD = Infinity;
        for (let i = 0; i < n; i++) {
          const x = gsap.utils.wrap(-SLOT, total - SLOT, i * SLOT + s.pos);
          const d = (x + CARD_W / 2 - s.width / 2) / (s.width / 2);
          const ad = Math.abs(d);
          s.dists[i] = d;
          gsap.set(cards[i], {
            x,
            z: -ad * 480,
            rotateY: -d * 38,
            scale: 1 - Math.min(0.22, ad * 0.16),
            autoAlpha: ad > 1.7 ? 0 : 1,
            zIndex: Math.round(100 - ad * 40),
          });
          if (ad < bestD) {
            bestD = ad;
            best = i;
          }
        }
        if (best !== lastCenter) {
          cards.forEach((c, i) => c.toggleAttribute("data-center", i === best));
          lastCenter = best;
          setCenter(best);
        }
      };
      gsap.ticker.add(tick);

      return () => {
        gsap.ticker.remove(tick);
        window.removeEventListener("wheel", onWheel);
        window.removeEventListener("resize", onResize);
      };
    },
    { dependencies: [belt], scope: rootRef },
  );

  // Painel central: título letra a letra + demais elementos em cascata,
  // re-disparado a cada troca de card em destaque.
  useGSAP(
    () => {
      if (!belt) return;
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(
        "[data-panel-char]",
        { yPercent: 70, autoAlpha: 0 },
        { yPercent: 0, autoAlpha: 1, duration: 0.5, stagger: 0.02 },
      ).fromTo(
        "[data-panel-el]",
        { y: 14, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.45, stagger: 0.09 },
        "-=0.3",
      );
    },
    { dependencies: [belt, center], scope: rootRef },
  );

  const onCardClick = (i: number, href: string) => {
    if (!belt) return;
    const s = beltState.current;
    const d = s.dists[i] ?? 0;
    if (Math.abs(d) < 0.18) {
      // Card central: avança em direção ao visitante e abre a página.
      const inner = innerRefs.current[i];
      if (!inner) return router.push(href);
      gsap.to(inner, {
        scale: 1.45,
        autoAlpha: 0,
        duration: 0.55,
        ease: "power2.in",
        onComplete: () => router.push(href),
      });
    } else {
      // Card lateral: desliza a esteira até centralizá-lo; o Milo anuncia
      // o projeto escolhido (uma vez por projeto por visita).
      const delta = -d * (s.width / 2);
      s.holdUntil = performance.now() + 900;
      gsap.to(s, { pos: s.pos + delta, duration: 0.85, ease: "power3.out" });
      const item = items[i];
      if (miloCenterMsg && item && !announcedRef.current.has(item.key)) {
        announcedRef.current.add(item.key);
        miloSay({ text: miloCenterMsg.replace("{title}", item.title), pose: "happy" });
      }
    }
  };

  const cur = items[center] ?? items[0];

  return (
    <div ref={rootRef}>
      <div
        ref={trackRef}
        style={belt ? { perspective: "2000px" } : undefined}
        className={
          belt
            ? "relative h-[600px] overflow-hidden"
            : "flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        }
      >
        {items.map((item, i) => (
          <div
            key={item.key}
            data-belt-card
            onClick={() => onCardClick(i, item.ctaHref)}
            style={
              belt
                ? {
                    width: CARD_W,
                    WebkitBoxReflect:
                      "below 14px linear-gradient(transparent 58%, rgba(0,0,0,0.3))",
                  }
                : undefined
            }
            className={
              belt
                ? "absolute left-0 top-4 cursor-pointer will-change-transform"
                : "w-[82%] shrink-0 snap-start sm:w-[calc((100%-3rem)/3)]"
            }
          >
            <div
              ref={(el) => {
                innerRefs.current[i] = el;
              }}
              className={
                "flex h-full flex-col overflow-hidden rounded-2xl border bg-surface-2/60 " +
                (belt
                  ? "border-line/10 transition-[border-color,box-shadow,filter] duration-500 blur-[1.5px] [[data-center]_&]:blur-0 [[data-center]_&]:border-accent/60 [[data-center]_&]:shadow-[0_0_70px_-14px_rgb(var(--accent)/0.55)]"
                  : "border-line/10")
              }
            >
              <div className="relative aspect-[9/16] overflow-hidden">
                <LabVideo src={item.src} poster={item.poster} label={item.title} />
                <div
                  aria-hidden
                  // Sempre PRETO: o fade usa a cor do vídeo (cinematográfico,
                  // escuro) — from-bg/80 virava um véu branco no tema claro.
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent"
                />
              </div>
              {/* Legenda dentro do card: só no carrossel nativo (mobile) —
                  na esteira o painel central assume esse papel. */}
              {!belt && (
                <figcaption className="flex flex-1 flex-col gap-2 p-5 sm:min-h-[12rem]">
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">
                    {item.category}
                  </p>
                  <p className="text-lg font-semibold text-fg">{item.title}</p>
                  <p className="text-sm text-fg-muted">{item.desc}</p>
                  <Link
                    href={item.ctaHref}
                    className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-semibold text-accent"
                  >
                    {item.ctaLabel} <ArrowRight className="h-4 w-4" />
                  </Link>
                </figcaption>
              )}
            </div>
          </div>
        ))}

        {/* Fades laterais do showroom (só na esteira). */}
        {belt && (
          <>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 z-[120] w-40 bg-gradient-to-r from-bg to-transparent"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-0 z-[120] w-40 bg-gradient-to-l from-bg to-transparent"
            />
          </>
        )}
      </div>

      {/* Painel do projeto em destaque (esteira). */}
      {belt && (
        <div className="mt-10 text-center">
          <p data-panel-el className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
            {cur.category}
          </p>
          <h3
            key={center}
            className="mt-2 overflow-hidden text-3xl font-bold tracking-tight text-fg sm:text-4xl"
          >
            {cur.title.split("").map((ch, i) => (
              <span key={i} data-panel-char className="inline-block">
                {ch === " " ? " " : ch}
              </span>
            ))}
          </h3>
          <p data-panel-el className="mx-auto mt-3 max-w-xl text-fg-muted">
            {cur.desc}
          </p>
          <div data-panel-el className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
            {cur.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-line/15 bg-bg/50 px-2 py-0.5 font-mono text-[11px] text-fg-subtle"
              >
                {tag}
              </span>
            ))}
          </div>
          <div data-panel-el className="mt-6">
            <Link
              href={cur.ctaHref}
              className="inline-flex items-center gap-1.5 rounded-lg border border-accent/40 px-5 py-2.5 text-sm font-semibold text-accent transition-colors hover:border-accent hover:bg-accent/10"
            >
              {cur.ctaLabel} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
