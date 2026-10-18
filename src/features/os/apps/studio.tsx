"use client";

import Image from "next/image";
import { useOs } from "../os-shell";
import { useLaunch } from "../desktop";

/** Estúdio — manifesto, no que acreditamos, como trabalhamos, quem faz. */
export function StudioApp() {
  const { payload } = useOs();
  const s = payload.s;
  const st = payload.studio;
  const launch = useLaunch();
  return (
    <div className="os-studio">
      <header className="os-app__header">
        <p className="t-mono os-app__eyebrow">{payload.brand.index}</p>
        <p className="os-studio__manifesto t-display">
          {st.manifesto.map((l) => (
            <span key={l} className="block">
              {l}
            </span>
          ))}
        </p>
        <p className="os-app__lead">{st.intro}</p>
      </header>

      <section className="os-app__section" aria-labelledby="os-studio-beliefs">
        <h3 id="os-studio-beliefs" className="t-mono os-app__label">
          {st.beliefs.eyebrow.toUpperCase()}
        </h3>
        <ol className="os-studio__beliefs">
          {st.beliefs.items.map((b) => (
            <li key={b.n}>
              <span className="t-mono tnum os-studio__n">{b.n}</span>
              <span className="os-studio__title">{b.title}</span>
              <span className="os-studio__body">{b.body}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="os-app__section" aria-labelledby="os-studio-process">
        <h3 id="os-studio-process" className="t-mono os-app__label">
          {st.process.eyebrow.toUpperCase()}
        </h3>
        <ol className="os-studio__process">
          {st.process.steps.map((p) => (
            <li key={p.n}>
              <p className="t-mono">
                {p.n} / <span>{p.label}</span>
              </p>
              <p className="os-studio__body">{p.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="os-app__section os-studio__founder" aria-labelledby="os-studio-founder">
        <div>
          <h3 id="os-studio-founder" className="t-mono os-app__label">
            {st.founder.eyebrow.toUpperCase()}
          </h3>
          <p className="os-app__lead">{st.founder.body}</p>
          <p className="t-mono os-studio__name">{payload.brand.founder}</p>
          <p className="t-mono os-studio__role">{payload.brand.role.toUpperCase()}</p>
        </div>
        <Image src="/avatar.png" alt={payload.brand.founder} width={160} height={160} sizes="120px" className="os-studio__avatar" />
      </section>

      <footer className="os-app__footer t-mono">
        <a href={payload.hrefs.services} className="link-rule" onClick={(e) => launch(e, "services")}>
          {st.cta.toUpperCase()} →
        </a>
        <a href={payload.hrefs.contact} className="link-rule" onClick={(e) => launch(e, "contact")}>
          {payload.nav.contact.toUpperCase()} →
        </a>
      </footer>
    </div>
  );
}
