"use client";

import { ArrowUpRight, Github, Crown, TrendingUp, FlaskConical } from "lucide-react";
import { PROJECTS, UI, type Project, type Localized } from "@/lib/content";
import { useLang } from "./lang-provider";
import { Reveal } from "./reveal";
import { WebsitePreview } from "./website-preview";
import { AppPreview } from "./app-preview";

function host(url?: string) {
  return url ? url.replace(/^https?:\/\//, "").replace(/\/$/, "") : "preview";
}

const FLAGSHIP_LABEL: Localized = { pt: "Carro-chefe", en: "Flagship" };

/** Preview estilizado (sem screenshot real). */
function FauxPreview({ p, tall = false }: { p: Project; tall?: boolean }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line/10 bg-grid">
      <div className="flex items-center gap-1.5 border-b border-line/10 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-line/20" />
        <span className="h-2.5 w-2.5 rounded-full bg-line/20" />
        <span className="h-2.5 w-2.5 rounded-full bg-line/20" />
        <span className="ml-2 truncate rounded-md bg-bg/70 px-2 py-0.5 font-mono text-[11px] text-fg-subtle">
          {host(p.live)}
        </span>
      </div>
      <div className={"relative flex items-center justify-center " + (tall ? "h-72 sm:h-80" : "h-44")}>
        <div aria-hidden className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-accent/15 blur-3xl" />
        <span className="font-display text-3xl font-bold tracking-tight text-gradient sm:text-4xl">{p.title}</span>
      </div>
    </div>
  );
}

function Preview({ p, tall = false }: { p: Project; tall?: boolean }) {
  if (p.media?.length) {
    return <AppPreview media={p.media} big={tall} />;
  }
  if (p.image) {
    return (
      <WebsitePreview
        src={p.image}
        host={host(p.live)}
        alt={`${p.title} — screenshot`}
        frameClass={tall ? "h-72 sm:h-80 lg:h-[26rem]" : "h-56"}
      />
    );
  }
  return <FauxPreview p={p} tall={tall} />;
}

function Details({ p }: { p: Project }) {
  const { t } = useLang();
  return (
    <>
      {(p.metric || p.status) && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {p.metric && (
            <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-semibold text-accent">
              <TrendingUp className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{t(p.metric)}</span>
            </span>
          )}
          {p.status && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line/20 bg-surface-2/70 px-3 py-1 text-[11px] font-medium text-fg-subtle">
              <FlaskConical className="h-3.5 w-3.5 shrink-0" />
              {t(p.status)}
            </span>
          )}
        </div>
      )}
      <p className="font-mono text-xs uppercase tracking-wider text-accent">{t(p.tagline)}</p>
      <div className="mt-4 space-y-3 text-sm">
        <p className="text-fg-muted">
          <span className="font-semibold text-fg-subtle">{t(UI.labels.problem)}: </span>
          {t(p.problem)}
        </p>
        <p className="text-fg-muted">
          <span className="font-semibold text-accent-soft">{t(UI.labels.result)}: </span>
          {t(p.result)}
        </p>
        {p.note && (
          <p className="flex items-start gap-1.5 text-xs italic text-fg-subtle">
            <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {t(p.note)}
          </p>
        )}
      </div>
      <ul className="mt-5 flex flex-wrap gap-2">
        {p.stack.map((s) => (
          <li key={s} className="rounded-md border border-line/10 bg-surface-2/60 px-2.5 py-1 font-mono text-[11px] text-fg-muted">
            {s}
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        {p.live && (
          <a href={p.live} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent transition-colors hover:text-accent-soft">
            {t(UI.labels.viewLive)} <ArrowUpRight className="h-4 w-4" />
          </a>
        )}
        {p.repos?.map((r) => (
          <a key={r.url} href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted transition-colors hover:text-fg">
            <Github className="h-4 w-4" /> {r.label}
          </a>
        ))}
      </div>
    </>
  );
}

export function Projects() {
  const { t } = useLang();
  const flagship = PROJECTS.find((p) => p.flagship);
  const rest = PROJECTS.filter((p) => !p.flagship);

  return (
    <section id="projects" className="container-page scroll-mt-20 py-20 sm:py-32">
      <Reveal>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          <span className="text-accent/40">03 / </span>
          {t(UI.sections.projectsEyebrow)}
        </p>
        <h2 className="mt-3 text-4xl font-bold tracking-tight text-fg sm:text-5xl lg:text-6xl">
          {t(UI.sections.projectsTitle)}
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-fg-subtle">{t(UI.sections.projectsSub)}</p>
      </Reveal>

      {/* Carro-chefe — card grande, primeiro */}
      {flagship && (
        <Reveal>
          <div className="mt-10 grid items-center gap-8 rounded-3xl border border-accent/30 glass p-6 sm:p-8 lg:grid-cols-2 lg:gap-12">
            <div>
              <Preview p={flagship} tall />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                <Crown className="h-3.5 w-3.5" /> {t(FLAGSHIP_LABEL)}
              </span>
              <h3 className="mt-3 font-display text-3xl font-bold tracking-tight text-fg sm:text-4xl">
                {flagship.title}
              </h3>
              <div className="mt-4">
                <Details p={flagship} />
              </div>
            </div>
          </div>
        </Reveal>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {rest.map((p, i) => (
          <Reveal key={p.slug} delay={(i % 2) * 100}>
            <div className="flex h-full flex-col rounded-2xl border border-line/10 glass p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-[0_0_60px_-16px_rgb(var(--accent)/0.45)]">
              <Preview p={p} />
              <h3 className="mt-5 font-display text-2xl font-bold tracking-tight text-fg">{p.title}</h3>
              <div className="mt-3 flex-1">
                <Details p={p} />
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
