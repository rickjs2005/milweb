"use client";

import Image from "next/image";
import { useOs } from "../os-shell";
import { useLaunch } from "../launch";

/**
 * Sobre — quem faz a MilWeb, só no telefone (o desktop conta isso dentro de
 * Estúdio). Fatos vêm da carga do OS (brand, studio.founder, contact, social):
 * nada é escrito aqui. Canais em linhas tocáveis; a conversa principal é o
 * WhatsApp.
 */
export function AboutApp() {
  const { payload } = useOs();
  const s = payload.s;
  const a = payload.about;
  const c = payload.contact;
  const launch = useLaunch();
  const socials = (["linkedin", "github", "instagram"] as const).filter((k) => payload.social[k]);
  const socialName = { linkedin: s.contact.linkedin, github: s.contact.github, instagram: "Instagram" } as const;

  return (
    <div className="os-about">
      <header className="os-app__header os-about__head">
        <Image src="/avatar.png" alt={payload.brand.founder} width={160} height={160} sizes="96px" className="os-about__avatar" />
        <div className="os-about__who">
          <p className="t-mono os-app__eyebrow">{a.eyebrow.toUpperCase()}</p>
          <p className="os-about__name t-display">{payload.brand.founder}</p>
          <p className="t-mono os-about__role">{payload.brand.role.toUpperCase()}</p>
        </div>
      </header>

      <p className="os-app__lead">{a.body}</p>

      <dl className="os-about__facts t-mono">
        <div>
          <dt>{s.about.base.toUpperCase()}</dt>
          <dd>{a.base}</dd>
        </div>
        <div>
          <dt>{s.about.focus.toUpperCase()}</dt>
          <dd>{a.focus}</dd>
        </div>
        <div>
          <dt>{s.projects.stack.toUpperCase()}</dt>
          <dd>{a.stack.join(" · ")}</dd>
        </div>
        <div>
          <dt>{payload.brand.index}</dt>
          <dd>{a.tagline}</dd>
        </div>
      </dl>

      <section className="os-app__section" aria-labelledby="os-about-channels">
        <h3 id="os-about-channels" className="t-mono os-app__label">
          {s.contact.channels.toUpperCase()}
        </h3>
        <ul className="os-about__channels t-mono">
          <li>
            <a href={c.waHref} target="_blank" rel="noopener noreferrer" className="os-cta os-about__cta">
              {s.contact.whatsapp.toUpperCase()} ↗
            </a>
          </li>
          <li>
            <a href={`mailto:${c.email}`} className="os-about__row normal-case">
              <span>{c.email}</span>
              <span aria-hidden="true">→</span>
            </a>
          </li>
          {socials.map((k) => (
            <li key={k}>
              <a href={payload.social[k]!} target="_blank" rel="noopener noreferrer" className="os-about__row">
                <span>{socialName[k].toUpperCase()}</span>
                <span aria-hidden="true">↗</span>
                <span className="sr-only">· {s.social.external}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <footer className="os-app__footer t-mono">
        <a href={payload.hrefs.projects} className="link-rule" onClick={(e) => launch(e, "projects")}>
          {s.apps.projects.toUpperCase()} →
        </a>
        <a href={payload.hrefs.services} className="link-rule" onClick={(e) => launch(e, "services")}>
          {s.apps.services.toUpperCase()} →
        </a>
      </footer>
    </div>
  );
}
