"use client";

import { useEffect, useRef, useState } from "react";
import { Counter } from "./reveal";

/** Strings já localizadas pros widgets do mini-dashboard. */
export type WidgetStrings = {
  risk: string;
  riskHigh: string;
  live: string;
  channels: string;
  ownSite: string;
  channelsNote: string;
  salesOrigin: string;
  referral: string;
  googleSite: string;
  outage: string;
  outageAxis: string;
  outageWindow: string;
};

/** Dispara uma vez quando o elemento entra na viewport (com fail-safe). */
function useInViewOnce<T extends HTMLElement>(): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!el || reduce || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.3, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    const fallback = setTimeout(() => {
      setShown(true);
      io.disconnect();
    }, 1400);
    return () => {
      clearTimeout(fallback);
      io.disconnect();
    };
  }, []);

  return [ref, shown];
}

const DANGER = "#fb7185";
const AMBER = "#fbbf24";
const OK = "#34d399";

function Panel({
  title,
  live,
  liveLabel,
  children,
  className = "",
}: {
  title: string;
  live?: boolean;
  liveLabel?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`glass rounded-2xl p-6 ${className}`}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3 className="font-mono text-xs uppercase tracking-[0.18em] text-fg-subtle">{title}</h3>
        {live && (
          <span className="flex items-center gap-1.5 rounded-full border border-rose-400/30 bg-rose-400/10 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-rose-400">
            <span className="size-1.5 animate-pulse rounded-full bg-rose-400" />
            {liveLabel}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function RiskGauge({ riskHigh }: { riskHigh: string }) {
  const [ref, shown] = useInViewOnce<HTMLDivElement>();
  const value = 87;
  const angle = -90 + (value / 100) * 180;

  return (
    <div ref={ref} className="flex flex-col items-center">
      <svg viewBox="0 0 200 118" className="w-full max-w-[280px]">
        <defs>
          <linearGradient id="dep-gauge" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={OK} />
            <stop offset="0.5" stopColor={AMBER} />
            <stop offset="1" stopColor={DANGER} />
          </linearGradient>
        </defs>
        <path
          d="M20 104 A 84 84 0 0 1 180 104"
          fill="none"
          stroke="rgb(var(--surface-2))"
          strokeWidth="13"
          strokeLinecap="round"
        />
        <path
          d="M20 104 A 84 84 0 0 1 180 104"
          fill="none"
          stroke="url(#dep-gauge)"
          strokeWidth="13"
          strokeLinecap="round"
          pathLength={1}
          style={{
            strokeDasharray: 1,
            strokeDashoffset: shown ? 1 - value / 100 : 1,
            transition: "stroke-dashoffset 1.8s cubic-bezier(0.22, 1, 0.36, 1) 0.2s",
          }}
        />
        <g
          style={{
            transform: `rotate(${shown ? angle : -90}deg)`,
            transformOrigin: "100px 104px",
            transformBox: "view-box",
            transition: "transform 2s cubic-bezier(0.22, 1, 0.36, 1) 0.25s",
          }}
        >
          <line x1="100" y1="104" x2="100" y2="34" stroke="rgb(var(--fg))" strokeWidth="3" strokeLinecap="round" />
          <circle cx="100" cy="104" r="7" fill="rgb(var(--fg))" />
        </g>
      </svg>
      <div className="-mt-3 text-center">
        <p className="font-display text-3xl font-bold text-fg tabular-nums">
          <Counter value={87} />
          <span className="text-base text-fg-subtle">/100</span>
        </p>
        <span
          className="mt-2 inline-block rounded-full border border-rose-400/40 bg-rose-400/10 px-4 py-1 font-mono text-xs font-bold uppercase tracking-[0.18em] text-rose-400 transition-all duration-500"
          style={{ opacity: shown ? 1 : 0, transform: shown ? "scale(1)" : "scale(0.8)", transitionDelay: "1.6s" }}
        >
          {riskHigh}
        </span>
      </div>
    </div>
  );
}

function DependencyBars({ ownSite, note }: { ownSite: string; note: string }) {
  const [ref, shown] = useInViewOnce<HTMLDivElement>();
  const rows = [
    { label: "Instagram", value: 94, color: DANGER },
    { label: "WhatsApp", value: 88, color: AMBER },
    { label: ownSite, value: 12, color: OK },
  ];
  return (
    <div ref={ref} className="grid gap-5">
      {rows.map((d, i) => (
        <div key={d.label}>
          <div className="mb-1.5 flex justify-between text-sm">
            <span className="text-fg-muted">{d.label}</span>
            <span className="font-display font-semibold tabular-nums" style={{ color: d.color }}>
              <Counter value={d.value} suffix="%" delay={i * 140} />
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full"
              style={{
                background: d.color,
                boxShadow: `0 0 14px ${d.color}55`,
                width: shown ? `${d.value}%` : 0,
                transition: `width 1.4s cubic-bezier(0.22, 1, 0.36, 1) ${0.15 * i}s`,
              }}
            />
          </div>
        </div>
      ))}
      <p className="text-xs text-fg-subtle/80">{note}</p>
    </div>
  );
}

function SalesDonut({ referral, googleSite }: { referral: string; googleSite: string }) {
  const [ref, shown] = useInViewOnce<HTMLDivElement>();
  const parts = [
    { label: "Instagram", value: 52, color: DANGER },
    { label: "WhatsApp", value: 31, color: AMBER },
    { label: referral, value: 11, color: "#a78bfa" },
    { label: googleSite, value: 6, color: OK },
  ];
  let acc = 0;
  return (
    <div ref={ref} className="flex flex-wrap items-center justify-center gap-6">
      <svg viewBox="0 0 120 120" className="w-28 shrink-0 -rotate-90">
        {parts.map((p, i) => {
          const seg = (
            <circle
              key={p.label}
              cx="60"
              cy="60"
              r="46"
              fill="none"
              stroke={p.color}
              strokeWidth="15"
              pathLength={100}
              strokeDasharray={`${p.value} ${100 - p.value}`}
              strokeDashoffset={-acc}
              style={{
                opacity: shown ? 1 : 0,
                transition: `opacity 0.7s ease ${0.2 + i * 0.16}s`,
              }}
            />
          );
          acc += p.value;
          return seg;
        })}
      </svg>
      <ul className="grid gap-2 text-sm">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center gap-2.5">
            <span className="size-2.5 rounded-full" style={{ background: p.color }} />
            <span className="text-fg-muted">{p.label}</span>
            <span className="font-display ml-auto pl-4 font-semibold text-fg tabular-nums">{p.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function OutageChart({ axis, windowLabel }: { axis: string; windowLabel: string }) {
  const [ref, shown] = useInViewOnce<HTMLDivElement>();
  const pts = [42, 38, 45, 40, 48, 44, 52, 47, 55, 12, 4, 3, 5, 9, 38, 46, 50, 47, 54, 58];
  const W = 400;
  const H = 120;
  const step = W / (pts.length - 1);
  const y = (v: number) => H - (v / 60) * H;
  const line = pts.map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;

  return (
    <div ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-[130px] w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="dep-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgb(var(--accent))" stopOpacity="0.3" />
            <stop offset="1" stopColor="rgb(var(--accent))" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="rgb(var(--line) / 0.12)" strokeWidth="1" />
        ))}
        <rect
          x={8.5 * step}
          y={0}
          width={5 * step}
          height={H}
          fill={`${DANGER}14`}
          stroke={`${DANGER}55`}
          strokeDasharray="4 4"
          style={{ opacity: shown ? 1 : 0, transition: "opacity 0.6s ease 1.4s" }}
        />
        <path d={area} fill="url(#dep-area)" style={{ opacity: shown ? 1 : 0, transition: "opacity 0.9s ease 1s" }} />
        <path
          d={line}
          fill="none"
          stroke="rgb(var(--accent))"
          strokeWidth="2.5"
          strokeLinecap="round"
          pathLength={1}
          style={{
            strokeDasharray: 1,
            strokeDashoffset: shown ? 0 : 1,
            transition: "stroke-dashoffset 2s ease-in-out",
          }}
        />
      </svg>
      <div className="mt-2 flex items-center justify-between gap-3 text-xs text-fg-subtle">
        <span>{axis}</span>
        <span className="flex items-center gap-1.5" style={{ color: DANGER }}>
          <span className="inline-block h-2 w-4 rounded-sm border border-rose-400/50 bg-rose-400/15" />
          {windowLabel}
        </span>
      </div>
    </div>
  );
}

export function DependencyWidgets({ s }: { s: WidgetStrings }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12">
      <Panel title={s.risk} live liveLabel={s.live} className="lg:col-span-4">
        <RiskGauge riskHigh={s.riskHigh} />
      </Panel>
      <Panel title={s.channels} className="lg:col-span-4">
        <DependencyBars ownSite={s.ownSite} note={s.channelsNote} />
      </Panel>
      <Panel title={s.salesOrigin} className="lg:col-span-4">
        <SalesDonut referral={s.referral} googleSite={s.googleSite} />
      </Panel>
      <Panel title={s.outage} live liveLabel={s.live} className="md:col-span-2 lg:col-span-12">
        <OutageChart axis={s.outageAxis} windowLabel={s.outageWindow} />
      </Panel>
    </div>
  );
}
