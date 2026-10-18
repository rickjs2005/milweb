"use client";

import Image from "next/image";
import Link from "next/link";
import { useOs } from "../os-shell";
import { useLaunch } from "../desktop";

/**
 * Destaques — a janela compacta da primeira visita (desktop) e o widget da
 * tela inicial (celular, `compact`). Só cases reais da coleção; a ordem é a
 * dos selecionados da Home.
 */
export function HighlightsApp({ compact = false }: { compact?: boolean }) {
  const { payload } = useOs();
  const s = payload.s;
  const launch = useLaunch();
  const items = payload.featured
    .map((slug) => payload.projects.find((p) => p.slug === slug)!)
    .filter(Boolean)
    .slice(0, compact ? 1 : 3);

  return (
    <div className={"os-highlights" + (compact ? " os-highlights--compact" : "")}>
      {!compact && (
        <header className="os-app__header">
          <p className="t-mono os-app__eyebrow">{s.home.welcome}</p>
          <p className="os-app__lead">{s.home.lead}</p>
        </header>
      )}
      <ul className="os-highlights__list">
        {items.map((p, i) => (
          <li key={p.slug} className="os-highlights__item">
            <Link href={p.href} className="os-highlights__link" scroll={false} aria-label={`${s.projects.open} — ${p.name}`}>
              <span className="os-highlights__media">
                <Image src={p.image} alt={p.name} fill sizes={compact ? "92vw" : "(max-width: 719px) 92vw, 360px"} className="os-highlights__img" priority={i === 0} />
              </span>
              <span className="os-highlights__caption">
                <span className="t-mono os-highlights__n">({p.n})</span>
                <span className="os-highlights__name">{p.name}</span>
                <span className="t-mono os-highlights__type">
                  {p.type}
                  {p.client ? ` · ${p.client}` : ""}
                  {p.year ? ` · ${p.year}` : ""}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <footer className="os-highlights__footer t-mono">
        <a href={payload.hrefs.projects} className="link-rule" onClick={(e) => launch(e, "projects")}>
          {s.home.all} →
        </a>
        {!compact && (
          <a href={payload.hrefs.contact} className="link-rule" onClick={(e) => launch(e, "contact")}>
            {s.home.cta} →
          </a>
        )}
      </footer>
    </div>
  );
}
