"use client";

import { useEffect, useRef, useState } from "react";
import { useOs } from "../../os-shell";
import type { OsProject } from "../../types";
import { writeBrief } from "../../materia/handoff";
import { useProjectDetail } from "../project-remote";

/**
 * As duas formas de explorar um projeto sem sair da coleção — a MESMA peça, com dois lados:
 *
 *   experimentar        uma amostra para percorrer com o scroll ou o dedo, feita com o material real do case
 *                       (no TERRAL, a narrativa do grão à xícara); no fim, a experiência completa a um toque
 *   ver como foi feito  a peça vira: o problema, o que o Rick fez e uma decisão de implementação que dá para
 *                       conferir (código ou site). Daqui o cliente leva a referência ao orçamento.
 *
 * Os dados vêm do mesmo JSON estático do case (project-data.ts › sample / made), buscado uma vez por sessão.
 */
export type Face = "try" | "made";

export function ProjectExplore({ project, face, onFace, onClose }: { project: OsProject; face: Face; onFace: (f: Face) => void; onClose: () => void }) {
  const { payload, locale, navigate } = useOs();
  const P = payload.s.projects;
  const { data } = useProjectDetail(locale, project.slug);
  const scroller = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const [step, setStep] = useState(0);
  const chapters = data?.sample.chapters ?? [{ label: project.title, text: project.tagline, image: project.image }];
  const total = chapters.length + 1;

  useEffect(() => {
    backRef.current?.focus({ preventScroll: true });
  }, []);
  // de volta à amostra, ela recomeça de onde estava; ao trocar de projeto, do começo
  useEffect(() => {
    setStep(0);
    scroller.current?.scrollTo({ top: 0 });
  }, [project.slug]);

  const jump = (i: number) => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: i * el.clientHeight, behavior: "smooth" });
  };
  const openCase = () => navigate(`/work/${project.slug}`, "push", true);
  /** A referência vai com o visitante: o pedido de proposta abre com este projeto e a intenção já escritos. */
  const discuss = () => {
    writeBrief(payload, { project: project.slug, lines: [`${P.discuss}: ${project.title}.`] });
    navigate("/contact", "push", true);
  };
  const made = data?.made ?? null;

  return (
    <section className="bounty__explore" data-face={face} aria-label={`${project.title} · ${face === "try" ? P.tryIt : P.madeTitle}`}>
      <header className="bounty__explore-bar">
        <button ref={backRef} type="button" className="bounty__explore-back t-mono" onClick={onClose}>
          <span aria-hidden="true">←</span> <span className="bounty__explore-back-label">{P.backToCollection}</span>
        </button>
        <p className="bounty__explore-name t-mono">
          <span className="tnum">{project.n}</span> · {project.title}
        </p>
        <div className="bounty__faces" role="tablist" aria-label={project.title}>
          <button type="button" role="tab" aria-selected={face === "try"} data-face="try" onClick={() => onFace("try")}>
            {P.tryIt}
          </button>
          <button type="button" role="tab" aria-selected={face === "made"} data-face="made" onClick={() => onFace("made")}>
            {P.made}
          </button>
        </div>
      </header>

      <div className="bounty__piece">
        <div className="bounty__flip">
          {/* frente: a amostra */}
          <div className="bounty__face bounty__face--try" inert={face !== "try"}>
            <div
              ref={scroller}
              className="bounty__sample"
              data-lenis-prevent=""
              tabIndex={0}
              role="group"
              aria-label={`${P.sample}: ${data?.sample.title ?? project.title}`}
              onScroll={(e) => {
                const el = e.currentTarget;
                setStep(Math.round(el.scrollTop / Math.max(1, el.clientHeight)));
              }}
            >
              {chapters.map((c, i) => (
                <article key={`${i}:${c.image}`} className="bounty__chapter" data-on={i === step ? "1" : "0"}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- imagens do case, já otimizadas em /shots; só as vizinhas carregam cedo */}
                  <img src={c.image} alt="" loading={i < 2 ? "eager" : "lazy"} decoding="async" draggable={false} />
                  <div className="bounty__chapter-text">
                    <p className="t-mono tnum">
                      {String(i + 1).padStart(2, "0")} / {String(chapters.length).padStart(2, "0")}
                    </p>
                    <h3>{c.label}</h3>
                    <p>{c.text}</p>
                  </div>
                </article>
              ))}
              <article className="bounty__chapter bounty__chapter--end" data-on={step >= chapters.length ? "1" : "0"}>
                <div className="bounty__chapter-text">
                  <p className="t-mono">{P.sample}</p>
                  <h3>{data?.sample.title ?? project.title}</h3>
                  <p>{project.tagline}</p>
                  <div className="bounty__explore-actions">
                    {data?.sample.full ? (
                      <a className="bounty__btn" href={data.sample.full} target="_blank" rel="noopener noreferrer" data-act="full">
                        {P.full} <span aria-hidden="true">↗</span>
                      </a>
                    ) : (
                      <button type="button" className="bounty__btn" data-act="case" onClick={openCase}>
                        {P.open}
                      </button>
                    )}
                    <button type="button" className="bounty__btn bounty__btn--ghost" data-act="made" onClick={() => onFace("made")}>
                      {P.made}
                    </button>
                  </div>
                </div>
              </article>
            </div>
            <ol className="bounty__rail" aria-hidden="true">
              {Array.from({ length: total }, (_, i) => (
                <li key={i} data-on={i === step ? "1" : "0"} onClick={() => jump(i)} />
              ))}
            </ol>
            <p className="bounty__sample-hint t-mono" data-on={step === 0 ? "1" : "0"} aria-hidden="true">
              ↓ {P.sampleHint}
            </p>
          </div>

          {/* verso: como foi feito */}
          <div className="bounty__face bounty__face--made" inert={face !== "made"}>
            <p className="t-mono bounty__made-eyebrow">
              {project.title} · {P.madeTitle}
            </p>
            {made ? (
              <dl className="bounty__made">
                <div>
                  <dt>{P.problem}</dt>
                  <dd>{made.problem}</dd>
                </div>
                <div>
                  <dt>{P.contribution}</dt>
                  <dd>{made.contribution}</dd>
                </div>
                <div>
                  <dt>{P.decision}</dt>
                  <dd>
                    {made.decision.label !== P.decision && <strong>{made.decision.label}. </strong>}
                    {made.decision.text}
                    {made.evidence && (
                      <a className="bounty__made-proof t-mono" href={made.evidence.href} target="_blank" rel="noopener noreferrer">
                        {P.verify}: {made.evidence.label} <span aria-hidden="true">↗</span>
                      </a>
                    )}
                  </dd>
                </div>
              </dl>
            ) : (
              <div className="bounty__loading" aria-busy="true" />
            )}
            <ul className="bounty__made-stack t-mono" aria-label={P.stack}>
              {project.stack.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <div className="bounty__explore-actions">
              <button type="button" className="bounty__btn" data-act="discuss" onClick={discuss}>
                {P.discuss}
              </button>
              <button type="button" className="bounty__btn bounty__btn--ghost" data-act="case" onClick={openCase}>
                {P.open}
              </button>
              <button type="button" className="bounty__btn bounty__btn--ghost" data-act="try" onClick={() => onFace("try")}>
                {P.tryIt}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
