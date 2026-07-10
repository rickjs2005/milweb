"use client";

import { useEffect, useRef, useState } from "react";
import { Milo } from "./milo";

/** Strings já localizadas (resolvidas no servidor) pra ilha client. */
export type GoogleSimStrings = {
  placeholder: string;
  search: string;
  suggestions: string[];
  autorun: string;
  emptyHint: string;
  r1t: string;
  r1d: string;
  r1r: string;
  r2t: string;
  r2d: string;
  r3t: string;
  r3d: string;
  slotTitle: string;
  slotSub: string;
  slotCta: string;
  slotHref: string;
  milo: string;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function fill(template: string, q: string) {
  return template.replace(/\{Q\}/g, cap(q)).replace(/\{q\}/g, q);
}

type Phase = "idle" | "typing" | "loading" | "done";

export function GoogleSim({ s }: { s: GoogleSimStrings }) {
  const [query, setQuery] = useState("");
  const [display, setDisplay] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [niche, setNiche] = useState("");
  const timeouts = useRef<number[]>([]);
  const started = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => timeouts.current.forEach(clearTimeout), []);

  const run = (q: string) => {
    const value = q.trim();
    if (!value) return;
    started.current = true;
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
    setQuery(value);
    setDisplay("");
    setPhase("typing");

    value.split("").forEach((_, i) => {
      timeouts.current.push(window.setTimeout(() => setDisplay(value.slice(0, i + 1)), 55 * i));
    });
    timeouts.current.push(window.setTimeout(() => setPhase("loading"), 55 * value.length + 350));
    timeouts.current.push(
      window.setTimeout(() => {
        setNiche(value);
        setPhase("done");
      }, 55 * value.length + 1050),
    );
  };

  // Auto-demo: se o visitante só assistir, a busca roda sozinha ao entrar em cena.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || started.current) return;
        io.disconnect();
        timeouts.current.push(window.setTimeout(() => {
          if (!started.current) run(s.autorun);
        }, 700));
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const slug = slugify(niche) || "premium";
  const results = niche
    ? [
        { url: `www.${slug}premium.com.br`, title: fill(s.r1t, niche), desc: fill(s.r1d, niche), rating: s.r1r },
        { url: `www.guialocal.com.br › ${slug}`, title: fill(s.r2t, niche), desc: fill(s.r2d, niche) },
        { url: `www.${slug}pro.com.br`, title: fill(s.r3t, niche), desc: fill(s.r3d, niche) },
      ]
    : [];

  return (
    <div ref={rootRef} className="grid items-start gap-8 lg:grid-cols-[1fr_1.25fr]">
      {/* controles */}
      <div>
        <div className="flex flex-wrap gap-2">
          {s.suggestions.map((sug) => (
            <button
              key={sug}
              type="button"
              onClick={() => run(sug)}
              className="rounded-full border border-line/15 px-4 py-2 text-sm text-fg-muted transition-all hover:scale-105 hover:border-accent/40 hover:text-fg"
            >
              {sug}
            </button>
          ))}
        </div>
        <form
          className="mt-4 flex max-w-md gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(query);
          }}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={s.placeholder}
            aria-label={s.placeholder}
            className="w-full rounded-full border border-line/15 bg-surface/60 px-5 py-3 text-sm text-fg outline-none placeholder:text-fg-subtle/70 focus:border-accent/50"
          />
          <button
            type="submit"
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-fg transition-transform hover:scale-105"
          >
            {s.search}
          </button>
        </form>

        <div
          className="mt-8 flex items-end gap-3 transition-opacity duration-700"
          style={{ opacity: phase === "done" ? 1 : 0 }}
          aria-hidden={phase !== "done"}
        >
          <Milo pose="idle" className="w-20 shrink-0" />
          <p className="mb-3 rounded-2xl rounded-bl-md border border-line/15 bg-surface-2/80 px-4 py-3 text-sm leading-relaxed text-fg-muted">
            {s.milo}
          </p>
        </div>
      </div>

      {/* SERP simulada */}
      <div className="glass overflow-hidden rounded-2xl">
        <div className="flex items-center gap-2 border-b border-line/10 px-5 py-3.5">
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#febc2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
          <div className="ml-3 flex-1 rounded-full bg-fg/5 px-4 py-1.5 text-xs text-fg-subtle">
            google.com.br
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-3 rounded-full border border-line/15 bg-fg/5 px-5 py-3">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.6" className="text-fg-subtle" />
              <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="text-fg-subtle" />
            </svg>
            <span className="min-h-[1.25rem] text-sm text-fg">
              {display}
              {phase === "typing" && (
                <span aria-hidden className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-accent" />
              )}
            </span>
          </div>

          <div className="mt-6 min-h-[360px]">
            {phase === "loading" && (
              <div className="grid gap-6" aria-hidden>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="grid animate-pulse gap-2" style={{ animationDelay: `${i * 150}ms` }}>
                    <div className="h-3 w-40 rounded bg-fg/10" />
                    <div className="h-4 w-3/4 rounded bg-fg/10" />
                    <div className="h-3 w-full rounded bg-fg/5" />
                  </div>
                ))}
              </div>
            )}

            {phase === "done" && (
              <div className="grid gap-6">
                {results.map((r, i) => (
                  <div key={r.url} className="animate-fade-up" style={{ animationDelay: `${i * 180}ms` }}>
                    <p className="text-xs text-emerald-500">{r.url}</p>
                    <p className="mt-0.5 cursor-pointer text-[17px] font-medium text-accent hover:underline">
                      {r.title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-fg-muted">{r.desc}</p>
                    {r.rating && <p className="mt-1 text-xs text-amber-500">{r.rating}</p>}
                  </div>
                ))}

                {/* a vaga em aberto */}
                <div
                  className="animate-fade-up relative rounded-2xl border-2 border-dashed border-accent/40 bg-accent/5 p-5"
                  style={{ animationDelay: "620ms" }}
                >
                  <p className="font-display text-lg font-semibold text-fg">{s.slotTitle}</p>
                  <p className="mt-1 text-sm text-fg-muted">{s.slotSub}</p>
                  <a
                    href={s.slotHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-fg transition-transform hover:scale-105"
                  >
                    {s.slotCta}
                  </a>
                </div>
              </div>
            )}

            {phase === "idle" && (
              <div className="flex min-h-[360px] items-center justify-center text-sm text-fg-subtle">
                {s.emptyHint}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
