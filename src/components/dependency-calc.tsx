"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Milo, type MiloPose } from "./milo";
import { miloSay } from "@/lib/milo-bus";

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
  /* diagnóstico + compartilhamento */
  diagButton: string;
  diagTitle: string;
  riskLabel: string;
  rec1a: string;
  rec1b: string;
  rec2a: string;
  rec2b: string;
  rec3: string;
  diagWhats: string;
  /** Reação do Milo do FAB ao gerar o diagnóstico, por tier ({score}). */
  miloDiag: [string, string, string];
  diagWhatsMsg: string; // {revenue} {share} {loss} {duration} {score}
  share: string;
  shareTitle1: string;
  shareTitle2: string;
  shareSub: string; // {duration} {share}
  shareFooter: string;
  shareFile: string;
  whatsapp: string; // só dígitos
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

const fill = (template: string, vars: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));

/** Gera a imagem 1080×1080 do resultado (pra stories/feed) num canvas. */
function drawShareCard(s: CalcStrings, loss: string, durationLabel: string, share: number) {
  const size = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const sans = getComputedStyle(document.body).fontFamily || "sans-serif";

  // fundo + brilhos da marca
  ctx.fillStyle = "#080a10";
  ctx.fillRect(0, 0, size, size);
  const glow = ctx.createRadialGradient(size * 0.8, 0, 0, size * 0.8, 0, 700);
  glow.addColorStop(0, "rgba(56,189,248,0.22)");
  glow.addColorStop(1, "rgba(56,189,248,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);
  const glow2 = ctx.createRadialGradient(0, size, 0, 0, size, 640);
  glow2.addColorStop(0, "rgba(251,113,133,0.14)");
  glow2.addColorStop(1, "rgba(251,113,133,0)");
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, size, size);

  ctx.textAlign = "center";

  // eyebrow
  ctx.fillStyle = "#38bdf8";
  ctx.font = `700 30px ${sans}`;
  ctx.fillText("MILWEB · RAIO-X", size / 2, 190);

  // título
  ctx.fillStyle = "#f4f7fc";
  ctx.font = `700 58px ${sans}`;
  ctx.fillText(s.shareTitle1, size / 2, 330);
  ctx.fillText(s.shareTitle2, size / 2, 405);

  // valor
  ctx.fillStyle = "#fb7185";
  ctx.font = `800 132px ${sans}`;
  ctx.fillText(loss, size / 2, 580);

  // sub
  ctx.fillStyle = "#adb6c7";
  ctx.font = `400 36px ${sans}`;
  ctx.fillText(fill(s.shareSub, { duration: durationLabel, share }), size / 2, 665);

  // divisor
  ctx.strokeStyle = "rgba(120,180,255,0.25)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(size / 2 - 180, 760);
  ctx.lineTo(size / 2 + 180, 760);
  ctx.stroke();

  // rodapé
  ctx.fillStyle = "#38bdf8";
  ctx.font = `700 40px ${sans}`;
  ctx.fillText(s.shareFooter, size / 2, 850);

  return canvas;
}

export function DependencyCalc({ s }: { s: CalcStrings }) {
  const [revenue, setRevenue] = useState(60000);
  const [igShare, setIgShare] = useState(65);
  const [waShare, setWaShare] = useState(30);
  const [clients, setClients] = useState(220);
  const [days, setDays] = useState(1);
  const [diagOpen, setDiagOpen] = useState(false);

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
  const loseSub = fill(s.loseSub, { duration: durationLabel, share });

  // nota de risco: dominada pela dependência de redes, com leve peso do volume
  const riskScore = Math.min(98, Math.round(share * 0.82 + Math.min(14, revenue / 45000) + 4));
  const recs = [share >= 50 ? s.rec1a : s.rec1b, waShare >= 30 ? s.rec2a : s.rec2b, s.rec3];

  const waHref = `https://wa.me/${s.whatsapp}?text=${encodeURIComponent(
    fill(s.diagWhatsMsg, {
      revenue: money(revenue),
      share,
      loss: money(r.lostRevenue),
      duration: durationLabel,
      score: riskScore,
    }),
  )}`;

  const shareResult = async () => {
    const canvas = drawShareCard(s, money(r.lostRevenue), durationLabel, share);
    if (!canvas) return;
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
    if (!blob) return;
    const file = new File([blob], `${s.shareFile}.png`, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        return;
      } catch {
        /* usuário cancelou — cai no download */
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${s.shareFile}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

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

        {/* diagnóstico gratuito: lead com contexto */}
        {!diagOpen ? (
          <button
            type="button"
            onClick={() => {
              setDiagOpen(true);
              // O Milo do FAB reforça o resultado. A banda vem da NOTA
              // (a fala cita a nota) — o r.tier é baseado no prejuízo em
              // R$, outra escala, e geraria falas contraditórias.
              const band = riskScore >= 70 ? 2 : riskScore >= 40 ? 1 : 0;
              miloSay({
                text: fill(s.miloDiag[band], { score: riskScore }),
                pose: band === 2 ? "shocked" : band === 1 ? "think" : "happy",
              });
            }}
            className="glow-accent mt-5 w-full rounded-xl bg-accent px-5 py-3.5 text-sm font-semibold text-accent-fg transition-transform hover:scale-[1.02]"
          >
            {s.diagButton}
          </button>
        ) : (
          <div className="animate-fade-up mt-5 rounded-xl border border-accent/25 bg-accent/5 p-5">
            <div className="flex items-center justify-between gap-4">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">{s.diagTitle}</p>
              <p className="text-xs text-fg-subtle">{s.riskLabel}</p>
            </div>
            <p className="mt-2 font-display text-4xl font-bold text-fg tabular-nums">
              <LiveNumber value={riskScore} format={(v) => `${Math.round(v)}`} />
              <span className="text-base text-fg-subtle">/100</span>
            </p>
            <ul className="mt-4 grid gap-2.5">
              {recs.map((rec, i) => (
                <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-fg-muted">
                  <span className="mt-0.5 font-display font-bold text-accent">{i + 1}.</span>
                  {rec}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="glow-accent inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-accent-fg transition-transform hover:scale-[1.02]"
              >
                {s.diagWhats}
              </a>
              <button
                type="button"
                onClick={shareResult}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-line/15 px-4 py-3 text-sm font-semibold text-fg transition-colors hover:border-accent/50"
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
                  <path d="M7.5 9.5V1.5m0 0L4.5 4.5m3-3l3 3M2.5 8.5v4a1 1 0 001 1h8a1 1 0 001-1v-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {s.share}
              </button>
            </div>
          </div>
        )}

        <p className="mt-4 text-[11px] text-fg-subtle/70">{s.note}</p>
      </div>
    </div>
  );
}
