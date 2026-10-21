"use client";

import Image from "next/image";
import { localizePath } from "@/i18n/routing";
import { useOs } from "../os-shell";
import { useLaunch } from "../launch";

/**
 * Perfil — Rick Januario como engenheiro de software, para recrutadores,
 * empresas de tecnologia e agências. Tudo vem da carga do OS
 * (`payload.profile`, montada de data/profile.ts): apresentação com ações
 * (ver e baixar o currículo em PDF, GitHub, LinkedIn, contato), resumo em
 * primeira pessoa, linha do tempo da experiência (currículo) com a MilWeb como
 * atuação independente, competências por grupo (sem barras nem estrelas),
 * projetos técnicos selecionados com captura real, problema, contribuição,
 * tecnologias, decisão técnica, status e o que o código confirma × o que o
 * README diz, e a formação. Links do estúdio no rodapé. Mesma folha de
 * estilos das outras janelas (papel/tinta, tokens do site); no telefone é
 * uma tela com rolagem vertical e alvos de 48 px (os-mobile.css).
 */
export function ProfileApp() {
  const { payload } = useOs();
  const s = payload.s.profile;
  const p = payload.profile;
  const launch = useLaunch();
  const period = (start: string | null, end: string | null) => (start ? `${start} – ${end ?? s.present}` : s.noDates);

  return (
    <article className="os-profile" aria-label={s.eyebrow}>
      <header className="os-profile__hero">
        <Image src={p.photo.src} alt={p.photo.alt} width={160} height={160} sizes="128px" className="os-profile__photo" priority />
        <div className="os-profile__who">
          <p className="t-mono os-app__eyebrow">{s.eyebrow.toUpperCase()}</p>
          <p className="os-profile__name t-display">{p.name}</p>
          <p className="os-profile__title">{p.title}</p>
          <p className="os-profile__headline">{p.headline}</p>
          <p className="t-mono os-profile__meta">
            <span>{p.studio}</span>
            <span aria-hidden="true"> · </span>
            <span>{p.location}</span>
          </p>
        </div>
        <div className="os-profile__actions">
          <a className="os-cta" href={p.cv.href} target="_blank" rel="noopener noreferrer" data-profile-action="view-cv">
            {s.viewCv.toUpperCase()} ↗<span className="sr-only"> · {p.cv.lang} · {s.opensNewTab}</span>
          </a>
          <a className="os-chip t-mono" href={p.cv.href} download={p.cv.download} data-profile-action="download-cv">
            {s.downloadCv.toUpperCase()} ↓<span className="sr-only"> · {p.cv.lang}</span>
          </a>
          <a className="os-chip t-mono" href={p.links.github} target="_blank" rel="noopener noreferrer" data-profile-action="github">
            GITHUB ↗<span className="sr-only"> · {s.opensNewTab}</span>
          </a>
          <a className="os-chip t-mono" href={p.links.linkedin} target="_blank" rel="noopener noreferrer" data-profile-action="linkedin">
            LINKEDIN ↗<span className="sr-only"> · {s.opensNewTab}</span>
          </a>
          <a className="os-chip t-mono" href={payload.hrefs.contact} onClick={(e) => launch(e, "contact")} data-profile-action="contact">
            {s.contact.toUpperCase()} →
          </a>
          <p className="t-mono os-profile__cvnote">{p.cv.lang}</p>
        </div>
      </header>

      <section className="os-app__section" aria-labelledby="os-profile-about">
        <h3 id="os-profile-about" className="t-mono os-app__label">
          {s.about.toUpperCase()}
        </h3>
        <p className="os-app__lead os-profile__about">{p.about}</p>
      </section>

      <section className="os-app__section" aria-labelledby="os-profile-experience">
        <h3 id="os-profile-experience" className="t-mono os-app__label">
          {s.experience.toUpperCase()}
        </h3>
        <ol className="os-profile__timeline">
          {p.experience.map((r) => (
            <li key={r.company} className="os-profile__role" data-independent={r.independent ? "1" : undefined}>
              <div className="os-profile__when t-mono">
                <span className="tnum">{period(r.start, r.end)}</span>
                <span>
                  {r.location}
                  {r.remote ? ` · ${s.remote}` : ""}
                </span>
                {r.independent && <span className="os-profile__tag">{s.independent}</span>}
              </div>
              <div className="os-profile__what">
                <p className="os-profile__company">
                  {r.company}
                  <span className="os-profile__roletitle"> · {r.title}</span>
                </p>
                <ul>
                  {r.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="os-app__section" aria-labelledby="os-profile-skills">
        <h3 id="os-profile-skills" className="t-mono os-app__label">
          {s.skills.toUpperCase()}
        </h3>
        <div className="os-profile__skills">
          {p.skills.map((g) => (
            <div key={g.key} className="os-profile__group">
              <h4 className="t-mono os-profile__gtitle">{g.title.toUpperCase()}</h4>
              <ul className="os-profile__chips">
                {g.items.map((i) => (
                  <li key={i.name} data-featured={i.featured ? "1" : "0"}>
                    {i.name}
                    {i.note && <span className="os-profile__note"> · {i.note}</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="os-app__section" aria-labelledby="os-profile-projects">
        <h3 id="os-profile-projects" className="t-mono os-app__label">
          {s.projects.toUpperCase()}
        </h3>
        <ol className="os-profile__projects">
          {p.projects.map((pr, idx) => (
            <li key={pr.slug} className="os-profile__project">
              <div className="os-profile__shot">
                <Image src={pr.image} alt={pr.imageAlt} fill sizes="(max-width: 719px) 100vw, 300px" className="os-profile__shot-img" />
              </div>
              <div className="os-profile__pbody">
                <p className="t-mono os-profile__pkind">
                  {String(idx + 1).padStart(2, "0")} · {pr.kind.toUpperCase()}
                </p>
                <p className="os-profile__pname">
                  {pr.name}
                  <span className="os-profile__status" data-status={pr.status}>
                    {s.status[pr.status]}
                  </span>
                </p>
                <dl className="os-profile__facts">
                  <div>
                    <dt>{s.problem}</dt>
                    <dd>{pr.problem}</dd>
                  </div>
                  <div>
                    <dt>{s.contribution}</dt>
                    <dd>{pr.contribution}</dd>
                  </div>
                  <div>
                    <dt>{s.stack}</dt>
                    <dd>{pr.stack.join(" · ")}</dd>
                  </div>
                  <div>
                    <dt>{s.decision}</dt>
                    <dd>{pr.decision}</dd>
                  </div>
                </dl>
                <details className="os-profile__details">
                  <summary className="t-mono">{s.details.toUpperCase()}</summary>
                  <dl>
                    <div>
                      <dt>{s.evidenceCode}</dt>
                      <dd>{pr.evidence.code}</dd>
                    </div>
                    <div>
                      <dt>{s.evidenceReadme}</dt>
                      <dd>{pr.evidence.readme}</dd>
                    </div>
                  </dl>
                </details>
                <p className="os-profile__plinks t-mono">
                  {pr.code.map((c) => (
                    <a key={c.url} href={c.url} target="_blank" rel="noopener noreferrer" className="link-rule">
                      {s.code.toUpperCase()}
                      {pr.code.length > 1 ? ` · ${c.label.toUpperCase()}` : ""} ↗<span className="sr-only"> · {s.opensNewTab}</span>
                    </a>
                  ))}
                  {pr.demo && (
                    <a href={pr.demo} target="_blank" rel="noopener noreferrer" className="link-rule">
                      {s.demo.toUpperCase()} ↗<span className="sr-only"> · {s.opensNewTab}</span>
                    </a>
                  )}
                  {pr.caseRoute && (
                    <a href={localizePath(payload.locale, pr.caseRoute)} className="link-rule" onClick={(e) => launch(e, "projects", pr.caseRoute!)}>
                      {s.caseLink.toUpperCase()} →
                    </a>
                  )}
                  {!pr.demo && <span className="os-profile__nodemo">{s.noDemo}</span>}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="os-app__section" aria-labelledby="os-profile-education">
        <h3 id="os-profile-education" className="t-mono os-app__label">
          {s.education.toUpperCase()}
        </h3>
        <ul className="os-profile__edu">
          {p.education.map((e) => (
            <li key={e.degree}>
              <span className="t-mono tnum os-profile__eduwhen">
                {e.start} – {e.end}
              </span>
              <span className="os-profile__degree">{e.degree}</span>
              <span className="os-profile__school">{e.school}</span>
            </li>
          ))}
        </ul>
      </section>

      <footer className="os-app__footer t-mono">
        <a href={payload.hrefs.studio} className="link-rule" onClick={(e) => launch(e, "studio")}>
          {s.studioLink.toUpperCase()} →
        </a>
        <a href={payload.hrefs.projects} className="link-rule" onClick={(e) => launch(e, "projects")}>
          {s.projectsLink.toUpperCase()} →
        </a>
        <a href={payload.hrefs.contact} className="link-rule" onClick={(e) => launch(e, "contact")}>
          {s.contact.toUpperCase()} →
        </a>
      </footer>
    </article>
  );
}
