"use client";

import Link from "next/link";
import { useOs } from "../os-shell";

/** Serviços — as ofertas reais (cada uma com página própria, aberta nesta janela) e a chamada para conversar. */
export function ServicesApp() {
  const { payload } = useOs();
  const s = payload.s;
  const sv = payload.services;
  return (
    <div className="os-services">
      <header className="os-app__header">
        <p className="t-mono os-app__eyebrow">{String(sv.items.length).padStart(2, "0")}</p>
        <p className="os-app__lead">{sv.intro}</p>
      </header>

      <ul className="os-services__list">
        {sv.items.map((it, i) => (
          <li key={it.slug}>
            <Link href={it.href} className="os-services__item" scroll={false}>
              <span className="t-mono tnum os-services__n">0{i + 1}</span>
              <span className="os-services__label">{it.label}</span>
              <span className="os-services__sub">{it.sub}</span>
              <span className="t-mono os-services__arrow" aria-hidden="true">
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <section className="os-app__section" aria-labelledby="os-services-deliverables">
        <h3 id="os-services-deliverables" className="t-mono os-app__label">
          {s.services.deliverables.toUpperCase()}
        </h3>
        <ul className="os-services__deliverables">
          {sv.deliverables.map((d) => (
            <li key={d.title}>
              <p className="os-services__dtitle">{d.title}</p>
              <p className="os-services__ddesc">{d.desc}</p>
            </li>
          ))}
        </ul>
      </section>

      <footer className="os-app__footer t-mono">
        <a href={sv.waHref} target="_blank" rel="noopener noreferrer" className="os-cta">
          {s.services.talk.toUpperCase()} ↗
        </a>
        <Link href={sv.diagnosticHref} className="link-rule" scroll={false}>
          {sv.diagnosticLabel.toUpperCase()} →
        </Link>
      </footer>
    </div>
  );
}
