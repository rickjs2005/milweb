"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useOs } from "../../os-shell";
import { guide, stage } from "../../materia/guide-store";
import { writeBrief } from "../../materia/handoff";
import { idea, useIdea } from "../../materia/idea-store";
import { DiveIdea, diveBrief } from "./dive";
import { PracticeIdea, practiceBrief } from "./practice";
import s from "./idea.module.css";

/**
 * Prévia — a janela em que o visitante experimenta uma ideia para o próprio negócio antes de pedir a
 * proposta. Quem a abre é a Matéria ("Ver uma ideia para o meu site"): a ideia aparece no recorte do
 * rosto da escultura e o recorte cresce até virar esta janela.
 *
 * O controle mais importante é "Usar esta direção no meu orçamento": leva o setor, a prioridade, a
 * referência e as escolhas feitas aqui para o Hire Rick, onde a pessoa revisa o texto antes de
 * enviar. Nada é enviado por esta janela. As escolhas ficam em idea-store.ts (na aba): voltar do
 * case, da conversa ou do orçamento reencontra tudo como estava.
 */
export function IdeaApp({ active }: { active: boolean }) {
  const { payload, navigate, store } = useOs();
  const kind = useIdea((st) => st.kind);
  const reference = useIdea((st) => st.reference);
  const D = payload.idea;
  const M = payload.materia;

  useEffect(() => {
    idea.restore();
  }, []);

  if (!kind) {
    return (
      <div className={s.idea} data-idea="none" data-no-inspect>
        <div className={s.empty}>
          <h3>{D.common.emptyTitle}</h3>
          <p>{D.common.emptyBody}</p>
          <button type="button" className={s.use} onClick={() => stage.ask?.(M.ui.idea)}>
            {M.ui.idea}
          </button>
        </div>
      </div>
    );
  }

  const field = kind === "dive" ? M.fields.diving : M.fields.psychology;
  const project = [...payload.projects, ...payload.authorial].find((p) => p.slug === (reference ?? field.ref));
  const T = kind === "dive" ? D.dive : D.practice;

  const use = () => {
    const st = idea.get();
    let brief: { lines: string[]; replace: string[] };
    if (st.kind === "dive") brief = diveBrief(D, st);
    else {
      const fact = M.sectors.health.options[st.priority].fact;
      brief = practiceBrief(D, st.priority, M.say.briefPriority, fact);
      // A conversa passa a saber da direção escolhida aqui: a Matéria não pergunta de novo nem contradiz o pedido.
      const g = guide.get();
      const mark = `${M.say.briefPriority}:`;
      guide.set({ ctx: { ...g.ctx, goal: st.priority, facts: [...g.ctx.facts.filter((f) => !f.startsWith(mark)), `${mark} ${fact}`] } });
    }
    writeBrief(payload, { ...brief, project: project?.slug ?? null });
    if (store.getState().shell === "mobile" && guide.get().open) guide.set({ min: true });
    navigate("/contact", "push", true);
  };

  return (
    <div className={s.idea} data-idea={kind} data-active={active ? "1" : "0"} data-no-inspect>
      <header className={s.bar}>
        <p className={s.tag}>{T.tag}</p>
        <p className={s.note}>{T.note}</p>
      </header>
      <div className={s.stage}>{kind === "dive" ? <DiveIdea data={D.dive} /> : <PracticeIdea data={D.practice} />}</div>
      {project && (
        <footer className={s.foot}>
          <span className={s.thumb}>
            <Image src={project.image} alt="" fill sizes="64px" />
          </span>
          <p className={s.refText}>
            <strong>
              {D.common.reference}: {project.title}
            </strong>
            {kind === "practice" ? (
              <>
                <span className={s.refLong}>{D.practice.refNote}</span>
                <span className={s.refShort}>{D.practice.refShort}</span>
              </>
            ) : (
              <span>{project.status ?? M.ui[project.kind]}</span>
            )}
          </p>
          <button type="button" className={s.refOpen} onClick={() => navigate(`/work/${project.slug}`, "push", true)}>
            {D.common.openCase}
          </button>
        </footer>
      )}
      <button type="button" className={s.use} data-use="1" onClick={use}>
        {D.common.use}
      </button>
    </div>
  );
}
