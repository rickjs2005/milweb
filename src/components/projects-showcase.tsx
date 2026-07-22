"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, TrendingUp } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { miloSay } from "@/lib/milo-bus";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export type ProjectPanelData = {
  title: string;
  tagline: string;
  result: string;
  stack: string[];
  metric?: string;
  metricProof?: boolean;
  caseHref: string;
  live?: string;
  caseLabel: string;
  liveLabel: string;
};

export type ProjectShowcaseItem = {
  key: string;
  category: string;
  /** Visual compacto do card na esteira (preview + faixa de título). */
  beltNode: ReactNode;
  panel: ProjectPanelData;
};

export type ProjectFilterDef = { key: string; label: string; count: number };

/** Geometria da esteira de projetos (cards paisagem, maiores que os do Lab). */
const CARD_W = 460;
const GAP = 64;
const SLOT = CARD_W + GAP;
const DRIFT = 22;
/** Abaixo disso o salto do wrap fica visível: o container (container-page)
 * é limitado a ~1300px, então (n-1)*SLOT >= 1300 exige n >= 4. */
const MIN_BELT_ITEMS = 4;

/**
 * Vitrine cinematográfica dos Projetos (Fase 5): cover-flow 3D infinito no
 * desktop — mesma matemática de wrap-around provada na vitrine do Lab
 * (cópia adaptada de lab-showcase.tsx; extrair um motor comum arriscaria o
 * Lab que já está em produção) — com filtros por categoria, painel central
 * sincronizado e vinheta que escurece a seção ao entrar. O card central
 * cresce, ganha borda neon e abre o case ao clicar (com View Transition —
 * o preview compartilha viewTransitionName com a página do case).
 *
 * Progressive enhancement: o SSR entrega `fallback` (a grade filtrável
 * atual); a esteira só liga no client em lg+ com ponteiro fino sem
 * reduced-motion. Categorias com poucos itens (< MIN_BELT_ITEMS) viram uma
 * fileira estática centrada — esteira infinita com 1-4 cards deixaria o
 * salto do wrap visível dentro da tela.
 */
export function ProjectsShowcase({
  items,
  filters,
  allLabel,
  fallback,
}: {
  items: ProjectShowcaseItem[];
  filters: ProjectFilterDef[];
  allLabel: string;
  fallback: ReactNode;
}) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const innerRefs = useRef(new Map<string, HTMLDivElement>());
  const [enhanced, setEnhanced] = useState(false);
  const [active, setActive] = useState("all");
  const [center, setCenter] = useState(0);

  const beltState = useRef({ pos: 0, boost: 0, holdUntil: 0, width: 0, dists: [] as number[] });

  useEffect(() => {
    const ok =
      window.matchMedia("(min-width: 1024px) and (pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEnhanced(ok);
  }, []);

  const shown = active === "all" ? items : items.filter((i) => i.category === active);
  const isBelt = enhanced && shown.length >= MIN_BELT_ITEMS;

  // Loop da esteira — cópia adaptada do lab-showcase (ver comentário acima).
  useGSAP(
    () => {
      if (!isBelt) return;
      const track = trackRef.current;
      if (!track) return;
      const cards = Array.from(track.querySelectorAll<HTMLElement>("[data-proj-card]"));
      const n = cards.length;
      if (!n) return;
      const total = n * SLOT;
      const s = beltState.current;
      s.pos = 0;
      s.boost = 0;
      s.width = track.clientWidth;
      s.dists = new Array(n).fill(0);
      let lastCenter = -1;

      const onResize = () => {
        s.width = track.clientWidth;
      };
      window.addEventListener("resize", onResize);

      const onWheel = (e: WheelEvent) => {
        const rect = track.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        s.boost = gsap.utils.clamp(-1400, 1400, s.boost + e.deltaY * 1.1);
      };
      window.addEventListener("wheel", onWheel, { passive: true });

      const tick = (_t: number, deltaMs: number) => {
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
            z: -ad * 460,
            rotateY: -d * 32,
            scale: 1 - Math.min(0.18, ad * 0.13),
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
    // active na dependência: trocar filtro remonta a esteira do zero
    { dependencies: [isBelt, active], scope: rootRef },
  );

  // Vinheta: a seção escurece conforme a vitrine entra (o "palco" acende).
  useGSAP(
    () => {
      if (!isBelt) return;
      const vignette = rootRef.current?.querySelector("[data-vignette]");
      if (!vignette) return;
      gsap.fromTo(
        vignette,
        { opacity: 0 },
        {
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top 75%",
            end: "top 25%",
            scrub: 0.5,
          },
        },
      );
    },
    { dependencies: [isBelt], scope: rootRef },
  );

  // Painel sincronizado: re-anima a cada troca de card central.
  useGSAP(
    () => {
      if (!isBelt) return;
      gsap.fromTo(
        "[data-sc-panel-el]",
        { y: 16, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.45, ease: "power3.out", stagger: 0.07 },
      );
    },
    { dependencies: [isBelt, center, active], scope: rootRef },
  );

  /** Recentraliza a esteira no card `i` (mesma matemática do clique). */
  const recenter = (i: number) => {
    const s = beltState.current;
    const d = s.dists[i] ?? 0;
    const delta = -d * (s.width / 2);
    s.holdUntil = performance.now() + 900;
    gsap.to(s, { pos: s.pos + delta, duration: 0.85, ease: "power3.out" });
  };

  const onCardClick = (i: number) => {
    if (!isBelt) return;
    const s = beltState.current;
    const d = s.dists[i] ?? 0;
    const item = shown[i];
    if (!item) return;
    if (Math.abs(d) < 0.18) {
      const inner = innerRefs.current.get(item.key);
      if (!inner) return router.push(item.panel.caseHref);
      gsap.to(inner, {
        scale: 1.4,
        autoAlpha: 0,
        duration: 0.55,
        ease: "power2.in",
        onComplete: () => router.push(item.panel.caseHref),
      });
    } else {
      recenter(i);
      miloSay({ text: `${item.panel.title} 👀`, pose: "happy" });
    }
  };

  /** Setas prev/next: mesma esteira, um passo por vez, com wrap-around. */
  const step = (dir: 1 | -1) => {
    if (!isBelt || !shown.length) return;
    const target = gsap.utils.wrap(0, shown.length, center + dir);
    recenter(target);
    const item = shown[target];
    if (item) miloSay({ text: `${item.panel.title} 👀`, pose: "happy" });
  };

  const pill = (selected: boolean) =>
    "shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors " +
    (selected
      ? "border-accent/50 bg-accent/15 text-accent"
      : "border-line/15 bg-surface-2/50 text-fg-subtle hover:border-accent/30 hover:text-fg-muted");

  if (!enhanced) return <>{fallback}</>;

  const cur = shown[Math.min(center, shown.length - 1)] ?? shown[0];

  return (
    <div ref={rootRef} className="relative">
      {/* vinheta de palco (atrás de tudo da seção) */}
      <div
        data-vignette
        aria-hidden
        className="pointer-events-none absolute -inset-x-12 -inset-y-8 -z-10 rounded-[3rem] bg-[radial-gradient(ellipse_at_center,transparent_30%,rgb(0_0_0/0.45)_100%)] opacity-0"
      />

      {/* filtros (mesma linguagem da grade) */}
      <div role="group" className="mt-10 flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-pressed={active === "all"}
          onClick={() => setActive("all")}
          className={pill(active === "all")}
        >
          {allLabel} <span className="font-mono text-[11px] opacity-60">{items.length}</span>
        </button>
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            aria-pressed={active === f.key}
            onClick={() => setActive(f.key)}
            className={pill(active === f.key)}
          >
            {f.label} <span className="font-mono text-[11px] opacity-60">{f.count}</span>
          </button>
        ))}
      </div>

      {/* esteira 3D (ou fileira estática pra categorias pequenas) */}
      {isBelt ? (
        <div
          key={active}
          ref={trackRef}
          style={{ perspective: "2200px" }}
          className="relative mt-6 h-[440px] overflow-hidden"
        >
          {shown.map((item, i) => (
            <div
              key={item.key}
              data-proj-card
              onClick={() => onCardClick(i)}
              style={{
                width: CARD_W,
                WebkitBoxReflect: "below 12px linear-gradient(transparent 62%, rgba(0,0,0,0.28))",
              }}
              className="absolute left-0 top-4 cursor-pointer will-change-transform"
            >
              <div
                ref={(el) => {
                  if (el) innerRefs.current.set(item.key, el);
                  else innerRefs.current.delete(item.key);
                }}
                className="overflow-hidden rounded-2xl border border-line/10 bg-surface-2/70 transition-[border-color,box-shadow,filter] duration-500 blur-[1.5px] [[data-center]_&]:blur-0 [[data-center]_&]:border-accent/60 [[data-center]_&]:shadow-[0_0_70px_-14px_rgb(var(--accent)/0.55)]"
              >
                {item.beltNode}
              </div>
            </div>
          ))}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 z-[120] w-36 bg-gradient-to-r from-bg to-transparent"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 z-[120] w-36 bg-gradient-to-l from-bg to-transparent"
          />

          {/* setas prev/next — atalho rápido além do clique/scroll na esteira */}
          <button
            type="button"
            aria-label="Projeto anterior"
            onClick={() => step(-1)}
            className="absolute left-3 top-1/2 z-[130] grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-line/15 bg-surface-2/70 text-fg-muted backdrop-blur transition-colors hover:border-accent/50 hover:text-fg sm:left-6"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Próximo projeto"
            onClick={() => step(1)}
            className="absolute right-3 top-1/2 z-[130] grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-line/15 bg-surface-2/70 text-fg-muted backdrop-blur transition-colors hover:border-accent/50 hover:text-fg sm:right-6"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <div key={active} className="mt-6 flex flex-wrap items-start justify-center gap-6">
          {shown.map((item, i) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setCenter(i)}
              className={
                "w-[380px] overflow-hidden rounded-2xl border text-left transition-[border-color,box-shadow] duration-300 " +
                (i === Math.min(center, shown.length - 1)
                  ? "border-accent/60 shadow-[0_0_60px_-14px_rgb(var(--accent)/0.5)]"
                  : "border-line/10 hover:border-accent/30")
              }
            >
              {item.beltNode}
            </button>
          ))}
        </div>
      )}

      {/* painel do projeto em destaque */}
      {cur && (
        <div className="mx-auto mt-8 max-w-2xl text-center">
          <p data-sc-panel-el className="font-mono text-xs uppercase tracking-[0.18em] text-fg-subtle">
            {cur.panel.tagline}
          </p>
          <h3 data-sc-panel-el className="mt-2 font-display text-3xl font-bold tracking-tight text-fg">
            {cur.panel.title}
          </h3>
          <p data-sc-panel-el className="mx-auto mt-3 text-sm leading-relaxed text-fg-muted">
            {cur.panel.result}
          </p>
          {cur.panel.metric && (
            <p data-sc-panel-el className="mt-4">
              <span
                className={
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] " +
                  (cur.panel.metricProof
                    ? "border-accent/30 bg-accent/10 font-semibold text-accent"
                    : "border-line/15 bg-surface-2/60 font-medium text-fg-subtle")
                }
              >
                <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                {cur.panel.metric}
              </span>
            </p>
          )}
          <div data-sc-panel-el className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
            {cur.panel.stack.slice(0, 6).map((s) => (
              <span
                key={s}
                className="rounded-md border border-line/10 bg-surface-2/60 px-2.5 py-1 font-mono text-[11px] text-fg-muted"
              >
                {s}
              </span>
            ))}
          </div>
          <div data-sc-panel-el className="mt-6 flex items-center justify-center gap-3">
            <Link
              href={cur.panel.caseHref}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-soft"
            >
              {cur.panel.caseLabel} <ArrowRight className="h-4 w-4" />
            </Link>
            {cur.panel.live && (
              <a
                href={cur.panel.live}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-line/15 px-4 py-2.5 text-sm font-medium text-fg-muted transition-colors hover:border-accent/50 hover:text-fg"
              >
                {cur.panel.liveLabel} <ArrowUpRight className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
