"use client";

import Image from "next/image";
import Link from "next/link";
import { TerralHold } from "@/sections/case/case-diagrams";
import type { ProjectDetailData } from "./project-data";

/**
 * O case dentro do MilWeb OS — desenho a partir de dados prontos
 * (project-data.ts). O mesmo componente serve a página canônica (dados do
 * servidor, SSR) e a janela de Projetos sem foco (dados do JSON).
 *
 * Ordem: capa forte → contexto → o que foi feito → soluções → interativo →
 * detalhe técnico → números → telas → resultado e conversa. Demo e trabalho
 * entregue vêm dos dados (`kind`), nunca de suposição.
 */
export function ProjectDetailView({ data: p, headingLevel = 1 }: { data: ProjectDetailData; headingLevel?: 1 | 2 }) {
  const s = p.s;
  const L = p.L;
  const H = headingLevel === 1 ? "h1" : "h2";
  const Sub = headingLevel === 1 ? "h2" : "h3";
  const kindLabel = p.kind === "client" ? s.client : p.kind === "demo" ? s.demo : s.study;
  const story = p.story;

  return (
    <article className="os-case" data-world={p.slug} id={`os-case-${p.slug}`}>
      <header className="os-case__head">
        <p className="t-mono os-case__eyebrow">
          {p.n !== "—" && (
            <span className="tnum">
              {p.n} {s.of} {p.total} ·{" "}
            </span>
          )}
          {p.type}
          {p.year ? ` · ${p.year}` : ""}
        </p>
        <H className="os-case__title t-display">
          {p.titleLines.map((l) => (
            <span key={l} className="block">
              {l}
            </span>
          ))}
        </H>
        <p className="os-case__tagline">{p.tagline}</p>
        <p className="os-case__badges t-mono">
          <span data-badge={p.kind}>{kindLabel.toUpperCase()}</span>
          {p.clientName && <span>{p.clientName.toUpperCase()}</span>}
          {p.status && <span>{p.status.toUpperCase()}</span>}
        </p>
      </header>

      {p.hero && (
        <figure className="os-case__cover">
          <Image src={p.hero} alt={`${p.title} — ${L.heroAlt}`} fill priority={headingLevel === 1} sizes="(max-width: 719px) 100vw, 1000px" className="os-case__cover-img" />
        </figure>
      )}

      <dl className="os-case__meta t-mono">
        <div>
          <dt>{p.clientName ? L.client : L.studio}</dt>
          <dd>{p.clientName ? p.clientName.toUpperCase() : "MILWEB"}</dd>
        </div>
        <div>
          <dt>{s.kind}</dt>
          <dd>{p.category}</dd>
        </div>
        <div className="os-case__stack">
          <dt>{s.stack}</dt>
          <dd>{p.stack.join(" · ")}</dd>
        </div>
        {(p.live || p.repos.length > 0) && (
          <div className="os-case__links">
            <dt>{L.status}</dt>
            <dd>
              {p.live && (
                <a href={p.live} target="_blank" rel="noopener noreferrer" className="os-cta" data-inspect="CTA / VISIT">
                  {s.visit.toUpperCase()} ↗
                </a>
              )}
              {p.repos.map((r) => (
                <a key={r.url} href={r.url} target="_blank" rel="noopener noreferrer" className="link-rule">
                  {s.code.toUpperCase()} ↗
                </a>
              ))}
            </dd>
          </div>
        )}
      </dl>

      <section className="os-case__section" aria-labelledby={`os-case-context-${p.slug}`}>
        <Sub id={`os-case-context-${p.slug}`} className="os-case__h t-mono">
          {s.context.toUpperCase()}
        </Sub>
        {story && <p className="os-case__idea">{story.ideaHeadline}</p>}
        <p className="os-case__text">{p.problem}</p>
        {story && <p className="os-case__text">{story.ideaBody}</p>}
      </section>

      <section className="os-case__section" aria-labelledby={`os-case-done-${p.slug}`}>
        <Sub id={`os-case-done-${p.slug}`} className="os-case__h t-mono">
          {s.done.toUpperCase()}
        </Sub>
        <p className="os-case__text os-case__text--strong">{p.result}</p>
        {p.metric && <p className="t-mono os-case__metric">{p.metric.toUpperCase()}</p>}
      </section>

      {(p.highlights.length > 0 || (story && story.steps.length > 0)) && (
        <section className="os-case__section" aria-labelledby={`os-case-solutions-${p.slug}`}>
          <Sub id={`os-case-solutions-${p.slug}`} className="os-case__h t-mono">
            {s.solutions.toUpperCase()}
          </Sub>
          {p.highlights.length > 0 && (
            <ul className="os-case__highlights">
              {p.highlights.map((h) => (
                <li key={h.label}>
                  <p className="os-case__hl">{h.label}</p>
                  <p className="os-case__text">{h.detail}</p>
                </li>
              ))}
            </ul>
          )}
          {story && story.steps.length > 0 && (
            <ol className="os-case__steps">
              {story.steps.map((st, i) => (
                <li key={i} className="os-case__step">
                  {st.image && (
                    <span className="os-case__step-media">
                      <Image src={st.image} alt="" fill loading="lazy" sizes="(max-width: 719px) 100vw, 420px" className="os-case__step-img" />
                    </span>
                  )}
                  <span className="os-case__step-text">
                    <span className="t-mono os-case__step-label">
                      {String(i + 1).padStart(2, "0")} / {st.label}
                    </span>
                    <span className="os-case__text">{st.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {story?.variant === "terral" && (
        <section className="os-case__section" aria-labelledby={`os-case-interactive-${p.slug}`}>
          <Sub id={`os-case-interactive-${p.slug}`} className="os-case__h t-mono">
            {s.interactive.toUpperCase()}
          </Sub>
          <TerralHold labels={{ hold: L.hold, holding: L.holding, done: L.held, reset: L.again, message: L.heldMessage }} />
        </section>
      )}

      {p.narrative.length > 0 && (
        <section className="os-case__section" aria-labelledby={`os-case-detail-${p.slug}`}>
          <Sub id={`os-case-detail-${p.slug}`} className="os-case__h t-mono">
            {s.detail.toUpperCase()}
          </Sub>
          <ul className="os-case__narrative">
            {p.narrative.map((n, i) => (
              <li key={i}>
                <details className="group">
                  <summary className="os-case__summary">
                    <span className="t-mono os-case__summary-label">{n.label}</span>
                    <span className="os-case__summary-text">{n.summary || n.text.slice(0, 140) + "…"}</span>
                    <span className="t-mono os-case__plus" aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <p className="os-case__text os-case__para">{n.text}</p>
                </details>
              </li>
            ))}
          </ul>
          {story && story.flow.length > 0 && (
            <ol className="os-case__flow t-mono" aria-label={s.detail}>
              {story.flow.map((f, i) => (
                <li key={f}>
                  <span>{f}</span>
                  {i < story.flow.length - 1 && <span aria-hidden="true">→</span>}
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {story && story.stats.length > 0 && (
        <section className="os-case__section" aria-labelledby={`os-case-numbers-${p.slug}`}>
          <Sub id={`os-case-numbers-${p.slug}`} className="os-case__h t-mono">
            {s.numbers.toUpperCase()}
          </Sub>
          <ul className="os-case__stats">
            {story.stats.map((st, i) => (
              <li key={i}>
                <p className="os-case__stat tnum">{st.value}</p>
                <p className="t-mono os-case__stat-label">{st.label.toUpperCase()}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {p.screens.length > 0 && (
        <section className="os-case__section" aria-labelledby={`os-case-screens-${p.slug}`}>
          <Sub id={`os-case-screens-${p.slug}`} className="os-case__h t-mono">
            {s.gallery.toUpperCase()}
          </Sub>
          <ul className="os-case__gallery">
            {p.screens.map((sc, i) => (
              <li key={sc.src}>
                <figure>
                  <span className="os-case__shot">
                    <Image src={sc.src} alt={sc.alt} fill loading="lazy" sizes="(max-width: 719px) 100vw, 480px" className="os-case__shot-img" />
                  </span>
                  <figcaption className="t-mono">
                    <span className="tnum">{String(i + 1).padStart(2, "0")}</span> {sc.alt}
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="os-case__section" aria-labelledby={`os-case-result-${p.slug}`}>
        <Sub id={`os-case-result-${p.slug}`} className="os-case__h t-mono">
          {s.result.toUpperCase()}
        </Sub>
        {story ? (
          <>
            <p className="os-case__idea">{story.result[0]}</p>
            {story.result[1] && <p className="t-mono os-case__metric">{story.result[1].toUpperCase()}</p>}
          </>
        ) : (
          <p className="os-case__idea">{p.result}</p>
        )}
        {p.note && <p className="os-case__text">{p.note}</p>}
        <p className="os-case__actions">
          <a href={p.waHref} target="_blank" rel="noopener noreferrer" className="os-cta">
            {s.similar.toUpperCase()} ↗
          </a>
          {p.live && (
            <a href={p.live} target="_blank" rel="noopener noreferrer" className="link-rule t-mono">
              {s.visit.toUpperCase()} ↗
            </a>
          )}
        </p>
      </section>

      <nav className="os-case__nav t-mono" aria-label={`${s.prev} / ${s.next}`}>
        <Link href={p.prev.href} className="link-rule" scroll={false}>
          ← {p.prev.title.toUpperCase()}
        </Link>
        <Link href={p.allHref} className="link-rule" scroll={false}>
          {s.back.toUpperCase()}
        </Link>
        <Link href={p.next.href} className="link-rule" scroll={false}>
          {p.next.title.toUpperCase()} →
        </Link>
      </nav>
    </article>
  );
}
