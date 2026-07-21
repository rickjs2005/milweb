"use client";

import { useEffect, useRef } from "react";
import { TrendingUp, ShoppingBag, Check } from "lucide-react";
import type { Locale } from "@/lib/content";

export type HeroPanelCopy = {
  store: string;
  live: string;
  sales: string;
  orders: string;
  conversion: string;
  week: string;
  newOrder: string;
  viaGoogle: string;
};

/** Alturas das barras do gráfico (%) — semana com clímax no fim. */
const BARS = [38, 52, 34, 66, 50, 78, 96];

/**
 * Visual do hero: em vez de imagem estática, um painel de produto FEITO EM
 * CÓDIGO — dashboard fictício de loja com KPIs contando, gráfico que se
 * desenha e toast de pedido chegando. É o site provando a própria tese
 * ("tudo aqui é código") já na primeira dobra. CSS puro nas animações
 * (keyframes hs-* no globals); só o count-up dos números usa rAF.
 * Respeita prefers-reduced-motion (números caem direto no valor final;
 * as animações CSS já são zeradas pela regra global).
 */
export function HeroShowcase({ copy, locale }: { copy: HeroPanelCopy; locale: Locale }) {
  const salesRef = useRef<HTMLSpanElement>(null);
  const ordersRef = useRef<HTMLSpanElement>(null);
  const convRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const intl = new Intl.NumberFormat(locale === "pt" ? "pt-BR" : "en-US");
    const conv = new Intl.NumberFormat(locale === "pt" ? "pt-BR" : "en-US", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    const prefix = locale === "pt" ? "R$ " : "$";
    const final = { sales: 4820, orders: 38, conv: 4.9 };
    const apply = (p: number) => {
      if (salesRef.current) salesRef.current.textContent = prefix + intl.format(Math.round(final.sales * p));
      if (ordersRef.current) ordersRef.current.textContent = intl.format(Math.round(final.orders * p));
      if (convRef.current) convRef.current.textContent = conv.format(final.conv * p) + "%";
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      apply(1);
      return;
    }
    let raf = 0;
    let start: number | null = null;
    const DURATION = 1600;
    const DELAY = 450; // espera a entrada do hero-anim revelar o painel
    const tick = (now: number) => {
      if (start === null) start = now;
      const t = Math.min(1, Math.max(0, (now - start - DELAY) / DURATION));
      apply(1 - Math.pow(1 - t, 3)); // ease-out cúbico
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [copy, locale]);

  return (
    <div
      data-depth="0.22"
      className="w-full overflow-hidden rounded-2xl border border-line/15 bg-surface/95 ring-1 ring-inset ring-accent/20 shadow-[0_0_80px_-20px_rgb(var(--accent)/0.5)]"
    >
      {/* Barra do browser */}
      <div className="flex items-center gap-3 border-b border-line/10 bg-surface-2/70 px-4 py-2.5">
        <span aria-hidden className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]/80" />
        </span>
        <span className="flex-1 truncate rounded-md bg-bg/60 px-3 py-1 font-mono text-[11px] text-fg-subtle">
          loja-aurora.com.br/admin
        </span>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          {copy.live}
        </span>
      </div>

      {/* Corpo do painel */}
      <div className="relative grid gap-3 p-4">
        <p className="text-sm font-semibold text-fg">{copy.store}</p>

        {/* KPIs com count-up */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="rounded-xl border border-line/10 bg-surface-2/60 p-3">
            <p className="text-[11px] text-fg-subtle">{copy.sales}</p>
            <p className="mt-1 text-lg font-bold tracking-tight text-fg">
              <span ref={salesRef}>—</span>
            </p>
            <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
              <TrendingUp className="h-3 w-3" /> +18%
            </p>
          </div>
          <div className="rounded-xl border border-line/10 bg-surface-2/60 p-3">
            <p className="text-[11px] text-fg-subtle">{copy.orders}</p>
            <p className="mt-1 text-lg font-bold tracking-tight text-fg">
              <span ref={ordersRef}>—</span>
            </p>
            <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
              <TrendingUp className="h-3 w-3" /> +12%
            </p>
          </div>
          <div className="rounded-xl border border-line/10 bg-surface-2/60 p-3">
            <p className="text-[11px] text-fg-subtle">{copy.conversion}</p>
            <p className="mt-1 text-lg font-bold tracking-tight text-fg">
              <span ref={convRef}>—</span>
            </p>
            <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
              <TrendingUp className="h-3 w-3" /> {locale === "pt" ? "+0,8" : "+0.8"}
            </p>
          </div>
        </div>

        {/* Gráfico: barras crescendo + linha que se desenha */}
        <div className="rounded-xl border border-line/10 bg-surface-2/60 p-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-fg-subtle">{copy.week}</p>
            <p className="font-mono text-[10px] uppercase tracking-wide text-accent">+64%</p>
          </div>
          <div className="relative mt-2 h-24">
            <div className="absolute inset-0 flex items-end gap-[6%] px-[1%]">
              {BARS.map((h, i) => (
                <span
                  key={i}
                  style={{ height: `${h}%`, animationDelay: `${0.55 + i * 0.09}s` }}
                  className="w-full origin-bottom scale-y-0 animate-[hs-bar_0.8s_cubic-bezier(0.22,1,0.36,1)_forwards] rounded-t-sm bg-gradient-to-t from-accent-deep/50 to-accent/80"
                />
              ))}
            </div>
            <svg
              aria-hidden
              viewBox="0 0 100 40"
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-0 h-full w-full"
            >
              <path
                d="M2,32 L16,25 L30,30 L44,17 L58,23 L72,11 L96,3"
                pathLength={1}
                className="fill-none stroke-accent-soft"
                style={{
                  strokeWidth: 1.2,
                  strokeDasharray: 1,
                  strokeDashoffset: 1,
                  animation: "hs-draw 1.5s cubic-bezier(0.4,0,0.2,1) 0.9s forwards",
                }}
              />
            </svg>
          </div>
        </div>

        {/* Pedidos recentes (linhas genéricas, sem texto a traduzir) */}
        <div className="grid gap-1.5">
          {[
            ["#1042", "R$ 249"],
            ["#1041", "R$ 129"],
          ].map(([id, price]) => (
            <div
              key={id}
              className="flex items-center gap-3 rounded-lg border border-line/10 bg-surface-2/40 px-3 py-2"
            >
              <ShoppingBag className="h-3.5 w-3.5 text-accent" />
              <span className="font-mono text-[11px] text-fg-subtle">{id}</span>
              <span className="h-1.5 flex-1 rounded-full bg-line/10" />
              <span className="text-[11px] font-semibold text-fg">{price}</span>
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                <Check className="h-2.5 w-2.5" />
              </span>
            </div>
          ))}
        </div>

        {/* Toast de pedido chegando (loop) */}
        <div
          className="absolute bottom-3 right-3 flex items-center gap-2 rounded-xl border border-accent/30 bg-surface-2/95 py-2 pl-2.5 pr-3 opacity-0 shadow-lg backdrop-blur"
          style={{ animation: "hs-toast 9s ease-in-out 2.4s infinite" }}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <ShoppingBag className="h-3.5 w-3.5" />
          </span>
          <span className="leading-tight">
            <span className="block text-xs font-semibold text-fg">{copy.newOrder}</span>
            <span className="block text-[10px] text-fg-subtle">{copy.viaGoogle}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
