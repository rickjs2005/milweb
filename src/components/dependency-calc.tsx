"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Milo, type MiloPose } from "./milo";

/** Strings já localizadas (resolvidas no servidor) pra ilha client. */
export type CalcStrings = {
  locale: "pt" | "en";
  title: string;
  revenue: string;
  ig: string;
  wa: string;
  clients: string;
  duration: string;
  h24: string;
  d7: string;
  lose: string;
  loseSub: string; // template com {duration} e {share}
  orders: string;
  leads: string;
  messages: string;
  hours: string;
  note: string;
  milo: [string, string, string];
};

/** Número que reanima suavemente a cada mudança de alvo (easeOutCubic). */
function LiveNumber({
  value,
  format,
  className,
}: {
  value: number;
  format: (v: number) => string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const current = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      current.current = value;
      el.textContent = format(value);
      return;
    }
    const from = current.current;
    const start = performance.now();
    const duration = 900;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      current.current = from + (value - from) * eased;
      el.textContent = format(current.current);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, format]);

  return (
    <span ref={ref} className={className}>
      {format(0)}
    </span>
  );
}

function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  format,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="block">
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <span className="text-sm text-fg-muted">{label}</span>
        <span className="font-display text-sm font-semibold tabular-nums text-fg">
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range w-full"
        style={{ "--pct": `${pct}%` } as React.CSSProperties}
        aria-label={label}
      />
    </label>
  );
}

export function DependencyCalc({ s }: { s: CalcStrings }) {
  const [revenue, setRevenue] = useState(60000);
  const [igShare, setIgShare] = useState(65);
  const [waShare, setWaShare] = useState(30);
  const [clients, setClients] = useState(220);
  const [days, setDays] = useState(1);

  const nf = useMemo(
    () => new Intl.NumberFormat(s.locale === "pt" ? "pt-BR" : "en-US", { maximumFractionDigits: 0 }),
    [s.locale],
  );
  const cf = useMemo(
    () =>
      new Intl.NumberFormat(s.locale === "pt" ? "pt-BR" : "en-US", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 0,
      }),
    [s.locale],
  );
  const money = useMemo(() => (v: number) => cf.format(Math.round(v)), [cf]);
  const num = useMemo(() => (v: number) => nf.format(Math.round(v)), [nf]);

  const share = Math.min(100, igShare + waShare);
  const r = useMemo(() => {
    const lostRevenue = (revenue / 30) * (share / 100) * days;
    const lostOrders = Math.max(1, (clients / 30) * (share / 100) * days);
    return {
      lostRevenue,
      lostOrders,
      lostLeads: lostOrders * 2.6,
      lostMessages: lostOrders * 7,
      lostHours: 24 * days * (share / 100),
      tier: lostRevenue >= 20000 ? 2 : lostRevenue >= 4000 ? 1 : 0,
    };
  }, [revenue, clients, share, days]);

  const pose: MiloPose = r.tier === 2 ? "shocked" : r.tier === 1 ? "think" : "idle";
  const durationLabel = days === 1 ? s.h24 : s.d7;
  const loseSub = s.loseSub
    .replace("{duration}", durationLabel)
    .replace("{share}", String(share));

  const metrics = [
    { label: s.orders, value: r.lostOrders, format: num },
    { label: s.leads, value: r.lostLeads, format: num },
    { label: s.messages, value: r.lostMessages, format: num },
    { label: s.hours, value: r.lostHours, format: (v: number) => `${num(v)}h` },
  ];

  return (
    <div className="glass grid gap-0 overflow-hidden rounded-2xl lg:grid-cols-2">
      {/* controles */}
      <div className="grid gap-6 p-6 sm:p-8">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">{s.title}</p>
        <Slider label={s.revenue} value={revenue} onChange={setRevenue} min={5000} max={500000} step={5000} format={money} />
        <Slider label={s.ig} value={igShare} onChange={setIgShare} min={0} max={100} step={5} format={(v) => `${v}%`} />
        <Slider label={s.wa} value={waShare} onChange={setWaShare} min={0} max={100} step={5} format={(v) => `${v}%`} />
        <Slider label={s.clients} value={clients} onChange={setClients} min={10} max={3000} step={10} format={num} />
        <div>
          <span className="mb-2 block text-sm text-fg-muted">{s.duration}</span>
          <div className="flex gap-2" role="group" aria-label={s.duration}>
            {[
              { d: 1, label: s.h24 },
              { d: 7, label: s.d7 },
            ].map((opt) => (
              <button
                key={opt.d}
                type="button"
                onClick={() => setDays(opt.d)}
                aria-pressed={days === opt.d}
                className={
                  days === opt.d
                    ? "rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-fg shadow-[0_0_18px_rgb(var(--accent)/0.4)]"
                    : "rounded-full border border-line/15 px-5 py-2 text-sm text-fg-muted transition-colors hover:border-accent/40 hover:text-fg"
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* resultado */}
      <div className="relative border-t border-line/10 bg-surface/40 p-6 sm:p-8 lg:border-l lg:border-t-0">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-rose-400">{s.lose}</p>
        <p className="mt-2 font-display text-5xl font-bold tracking-tight text-fg tabular-nums sm:text-6xl">
          <LiveNumber value={r.lostRevenue} format={money} />
        </p>
        <p className="mt-2 text-sm text-fg-subtle">{loseSub}</p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-xl border border-line/10 bg-bg/50 p-4">
              <p className="font-display text-2xl font-bold text-accent tabular-nums">
                <LiveNumber value={m.value} format={m.format} />
              </p>
              <p className="mt-1 text-xs leading-snug text-fg-subtle">{m.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-end gap-3">
          <Milo pose={pose} className="w-20 shrink-0" />
          <p className="mb-3 rounded-2xl rounded-bl-md border border-line/15 bg-surface-2/80 px-4 py-3 text-sm leading-relaxed text-fg-muted">
            {s.milo[r.tier]}
          </p>
        </div>

        <p className="mt-4 text-[11px] text-fg-subtle/70">{s.note}</p>
      </div>
    </div>
  );
}
