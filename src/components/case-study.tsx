import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Github,
  TrendingUp,
  FlaskConical,
  MessageCircle,
} from "lucide-react";
import { UI, PROFILE, type Project, type Locale } from "@/lib/content";
import { makeT, withLocale } from "@/lib/i18n";
import { AppPreview } from "./app-preview";
import { WebsitePreview } from "./website-preview";

const waHref = (text: string) =>
  `https://wa.me/${PROFILE.whatsapp}?text=${encodeURIComponent(text)}`;

function host(url?: string) {
  return url ? url.replace(/^https?:\/\//, "").replace(/\/$/, "") : "preview";
}

/** Preview grande do projeto (vídeo, screenshot rolante ou print estático). */
function Preview({ p, locale }: { p: Project; locale: Locale }) {
  if (p.media?.length) return <AppPreview media={p.media} big locale={locale} />;
  if (p.image)
    return (
      <WebsitePreview
        src={p.image}
        host={host(p.live)}
        alt={`${p.title} — screenshot`}
        frameClass="h-72 sm:h-96 lg:h-[30rem]"
        fit={p.imageStatic ? "contain" : "scroll"}
      />
    );
  return (
    <div className="flex h-72 items-center justify-center rounded-2xl border border-line/10 bg-grid sm:h-96">
      <span className="font-display text-4xl font-bold tracking-tight text-gradient">{p.title}</span>
    </div>
  );
}

type Sibling = { slug: string; title: string };

export function CaseStudy({
  project: p,
  prev,
  next,
  locale,
}: {
  project: Project;
  prev?: Sibling;
  next?: Sibling;
  locale: Locale;
}) {
  const t = makeT(locale);

  return (
    <article className="container-page py-12 sm:py-16">
      <Link
        href="/#projects"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-subtle transition-colors hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4" />
        {t(UI.labels.backToProjects)}
      </Link>

      {/* Cabeçalho do case */}
      <header className="mt-8 max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">{t(p.tagline)}</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-fg sm:text-5xl lg:text-6xl">
          {p.title}
        </h1>
        {(p.metric || p.status) && (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {p.metric && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                {t(p.metric)}
              </span>
            )}
            {p.status && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line/20 bg-surface-2/70 px-3 py-1 text-xs font-medium text-fg-subtle">
                <FlaskConical className="h-3.5 w-3.5 shrink-0" />
                {t(p.status)}
              </span>
            )}
          </div>
        )}
      </header>

      {/* Preview grande */}
      <div className="mt-10">
        <Preview p={p} locale={locale} />
      </div>

      {/* Problema → Solução */}
      <div className="mt-12 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="rounded-2xl border border-line/10 glass p-6 sm:p-8">
          <p className="font-mono text-xs uppercase tracking-wider text-fg-subtle">
            {t(UI.labels.problem)}
          </p>
          <p className="mt-3 text-lg leading-relaxed text-fg-muted">{t(p.problem)}</p>
        </div>
        <div className="rounded-2xl border border-accent/30 glass p-6 sm:p-8">
          <p className="font-mono text-xs uppercase tracking-wider text-accent">
            {t(UI.labels.result)}
          </p>
          <p className="mt-3 text-lg leading-relaxed text-fg-muted">{t(p.result)}</p>
        </div>
      </div>

      {p.note && (
        <p className="mt-6 flex items-start gap-2 text-sm italic text-fg-subtle">
          <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" />
          {t(p.note)}
        </p>
      )}

      {/* Aprofundamento técnico: arquitetura/decisões + destaques + galeria */}
      {p.caseStudy && (
        <div className="mt-14 border-t border-line/10 pt-12">
          <p className="font-mono text-xs uppercase tracking-wider text-accent">
            {t(UI.labels.howItWasBuilt)}
          </p>
          <div className="mt-5 space-y-4">
            {p.caseStudy.narrative.map((paragraph, i) => (
              <p key={i} className="text-base leading-relaxed text-fg-muted sm:text-lg">
                {t(paragraph)}
              </p>
            ))}
          </div>

          {!!p.caseStudy.highlights?.length && (
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {p.caseStudy.highlights.map((h, i) => (
                <div key={i} className="rounded-xl border border-line/10 bg-surface-2/40 p-5">
                  <p className="font-semibold text-fg">{t(h.label)}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-fg-subtle">{t(h.detail)}</p>
                </div>
              ))}
            </div>
          )}

          {!!p.caseStudy.gallery?.length && (
            <div className="mt-10">
              <p className="font-mono text-xs uppercase tracking-wider text-fg-subtle">
                {t(UI.labels.gallery)}
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {p.caseStudy.gallery.map((g, i) => (
                  <a
                    key={i}
                    href={g.src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block overflow-hidden rounded-xl border border-line/10 bg-surface-2/60 transition-colors hover:border-accent/40"
                  >
                    <img
                      src={g.src}
                      alt={t(g.alt)}
                      loading="lazy"
                      className="aspect-[4/3] w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stack */}
      <div className="mt-10">
        <p className="font-mono text-xs uppercase tracking-wider text-fg-subtle">Stack</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {p.stack.map((s) => (
            <li
              key={s}
              className="rounded-md border border-line/10 bg-surface-2/60 px-3 py-1.5 font-mono text-xs text-fg-muted"
            >
              {s}
            </li>
          ))}
        </ul>
      </div>

      {/* Ações */}
      <div className="mt-10 flex flex-wrap items-center gap-4">
        {p.live && (
          <a
            href={p.live}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-soft glow-accent"
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
            className="inline-flex items-center gap-2 rounded-lg border border-line/15 px-5 py-3 text-sm font-semibold text-fg-muted transition-colors hover:border-accent/50 hover:text-fg"
          >
            <Github className="h-4 w-4" /> {r.label}
          </a>
        ))}
        <a
          href={waHref(`Olá Rick! Vi o case "${p.title}" no site da MilWeb e quero algo parecido.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-line/15 px-5 py-3 text-sm font-semibold text-fg transition-colors hover:border-accent/50"
        >
          <MessageCircle className="h-4 w-4" /> {t(UI.cta.whats)}
        </a>
      </div>

      {/* Navegação anterior / próximo */}
      {(prev || next) && (
        <nav className="mt-16 grid gap-4 border-t border-line/10 pt-8 sm:grid-cols-2">
          {prev ? (
            <Link
              href={withLocale(locale, `/projetos/${prev.slug}`)}
              className="group flex flex-col gap-1 rounded-xl border border-line/10 p-5 transition-colors hover:border-accent/40"
            >
              <span className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-fg-subtle">
                <ArrowLeft className="h-3.5 w-3.5" /> {t(UI.labels.prev)}
              </span>
              <span className="font-display text-lg font-bold text-fg group-hover:text-accent">
                {prev.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={withLocale(locale, `/projetos/${next.slug}`)}
              className="group flex flex-col items-end gap-1 rounded-xl border border-line/10 p-5 text-right transition-colors hover:border-accent/40"
            >
              <span className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-fg-subtle">
                {t(UI.labels.next)} <ArrowRight className="h-3.5 w-3.5" />
              </span>
              <span className="font-display text-lg font-bold text-fg group-hover:text-accent">
                {next.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </article>
  );
}
