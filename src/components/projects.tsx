import Link from "next/link";
import { ArrowUpRight, ArrowRight, Github, Crown, TrendingUp, FlaskConical } from "lucide-react";
import { PROJECTS, UI, type Project, type Localized, type Locale } from "@/lib/content";
import { makeT } from "@/lib/i18n";
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

function Preview({ p, locale, tall = false }: { p: Project; locale: Locale; tall?: boolean }) {
  if (p.media?.length) {
    return <AppPreview media={p.media} big={tall} locale={locale} />;
  }
  if (p.image) {
    return (
      <WebsitePreview
        src={p.image}
        host={host(p.live)}
        alt={`${p.title} — screenshot`}
        frameClass={tall ? "h-72 sm:h-80 lg:h-[26rem]" : "h-56"}
        fit={p.imageStatic ? "contain" : "scroll"}
      />
    );
  }
  return <FauxPreview p={p} tall={tall} />;
}

function Details({ p, locale }: { p: Project; locale: Locale }) {
  const t = makeT(locale);
  // M2: o accent (azul forte) fica reservado para PROVA comercial real (cliente/produção).
  // Métricas de feature/trivia em demos recebem tratamento calmo/neutro.
  const metricClass = p.metricProof
    ? "border-accent/30 bg-accent/10 font-semibold text-accent"
    : "border-line/15 bg-surface-2/60 font-medium text-fg-subtle";
  return (
    <>
      {/* M1: hierarquia — título lidera; a tagline é a ÚNICA linha de apoio (calma),
          depois a descrição. As pílulas de métrica/status descem para junto da stack. */}
      <p className="font-mono text-xs uppercase tracking-wider text-fg-subtle">{t(p.tagline)}</p>
      {/* C3: no card mostramos só a Solução (resumida). Problema + nota ficam no case. */}
      <p className="mt-3 text-sm leading-relaxed text-fg-muted line-clamp-3">{t(p.result)}</p>
      {(p.metric || p.status) && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {p.metric && (
            <span className={"inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] " + metricClass}>
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
      <ul className="mt-5 flex flex-wrap gap-2">
        {p.stack.slice(0, 4).map((s) => (
          <li key={s} className="rounded-md border border-line/10 bg-surface-2/60 px-2.5 py-1 font-mono text-[11px] text-fg-muted">
            {s}
          </li>
        ))}
        {p.stack.length > 4 && (
          <li className="rounded-md border border-line/10 bg-surface-2/60 px-2.5 py-1 font-mono text-[11px] text-fg-subtle">
            +{p.stack.length - 4}
          </li>
        )}
      </ul>
      {/* C2: hierarquia de CTAs — Ver case (primário) · Ver ao vivo (secundário) · Código (terciário).
          C1: o link "Ver case" estica via ::after p/ cobrir o card todo (precisa ser estático, sem `relative`). */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link
          href={`/projetos/${p.slug}`}
          aria-label={`${t(UI.labels.caseStudy)}: ${p.title}`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-soft after:absolute after:inset-0 after:content-['']"
        >
          {t(UI.labels.caseStudy)} <ArrowRight className="h-4 w-4" />
        </Link>
        {p.live && (
          <a
            href={p.live}
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-10 inline-flex items-center gap-1.5 rounded-lg border border-line/15 px-3.5 py-2 text-sm font-medium text-fg-muted transition-colors hover:border-accent/50 hover:text-fg"
          >
            {t(UI.labels.viewLive)} <ArrowUpRight className="h-4 w-4" />
          </a>
        )}
        {p.repos?.map((r) => (
          <a
            key={r.url}
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${r.label} — ${p.title} (GitHub)`}
            className="relative z-10 inline-flex items-center gap-1 text-xs font-medium text-fg-subtle transition-colors hover:text-fg"
          >
            <Github className="h-3.5 w-3.5" /> {r.label}
          </a>
        ))}
      </div>
    </>
  );
}

export function Projects({ locale }: { locale: Locale }) {
  const t = makeT(locale);
  const flagship = PROJECTS.find((p) => p.flagship);
  const rest = PROJECTS.filter((p) => !p.flagship);

  return (
    <section id="projects" className="container-page scroll-mt-20 py-20 sm:py-32">
      <Reveal>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          <span className="text-accent/40">05 / </span>
          {t(UI.sections.projectsEyebrow)}
        </p>
        <h2 className="mt-3 text-4xl font-bold tracking-tight text-fg sm:text-5xl lg:text-6xl">
          {t(UI.sections.projectsTitle)}
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-fg-subtle">{t(UI.sections.projectsSub)}</p>
        {/* Legenda honesta: distingue cliente real em produção de projetos autorais/demos
            (mesma linguagem visual das pílulas de métrica no card). */}
        <ul className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-fg-subtle">
          <li className="inline-flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 font-semibold text-accent">
              <TrendingUp className="h-3 w-3 shrink-0" />
            </span>
            {t(UI.sections.projectsLegendProof)}
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line/20 bg-surface-2/70 px-2.5 py-0.5 font-medium text-fg-subtle">
              <FlaskConical className="h-3 w-3 shrink-0" />
            </span>
            {t(UI.sections.projectsLegendDemo)}
          </li>
        </ul>
      </Reveal>

      {/* Carro-chefe — card grande, primeiro */}
      {flagship && (
        <Reveal>
          <div className="relative mt-10 grid items-center gap-8 rounded-3xl border border-accent/30 glass p-6 sm:p-8 lg:grid-cols-2 lg:gap-12">
            <div>
              <Preview p={flagship} locale={locale} tall />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                <Crown className="h-3.5 w-3.5" /> {t(FLAGSHIP_LABEL)}
              </span>
              <h3 className="mt-3 font-display text-3xl font-bold tracking-tight text-fg sm:text-4xl">
                {flagship.title}
              </h3>
              <div className="mt-4">
                <Details p={flagship} locale={locale} />
              </div>
            </div>
          </div>
        </Reveal>
      )}

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {rest.map((p, i) => (
          <Reveal key={p.slug} delay={(i % 2) * 100}>
            <div className="relative flex h-full flex-col rounded-2xl border border-line/10 glass p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-[0_0_60px_-16px_rgb(var(--accent)/0.45)]">
              <Preview p={p} locale={locale} />
              <h3 className="mt-5 font-display text-2xl font-bold tracking-tight text-fg">{p.title}</h3>
              <div className="mt-3 flex-1">
                <Details p={p} locale={locale} />
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
