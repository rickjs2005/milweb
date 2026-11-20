"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { IdeaData } from "@/data/idea";
import { idea, useIdea } from "../../materia/idea-store";
import s from "./idea.module.css";

/**
 * Prévia de direção para um consultório de psicologia. Referência: ALVA Odontologia (demonstração
 * de odontologia) — a prévia propõe OUTRA direção visual, pensada para consultório.
 *
 * A pessoa alterna entre "facilitar o primeiro agendamento" e "apresentar minha abordagem" e vê, na
 * hora, o título, a ordem das informações e a ação principal mudarem. Conteúdo ilustrativo: nenhum
 * profissional, depoimento ou resultado é inventado; onde entraria o texto dela, a prévia diz isso.
 */
type Direction = "booking" | "approach";
type BlockId = "first" | "approach" | "session" | "info";
const ORDER: Record<Direction, BlockId[]> = { booking: ["first", "approach", "info"], approach: ["approach", "session", "first"] };
const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.osMotion === "reduce";

function copyOf(data: IdeaData["practice"], direction: Direction) {
  const booking = direction === "booking";
  const titles: Record<BlockId, string> = { first: data.firstTitle, approach: data.approachBlock, session: data.sessionTitle, info: data.infoTitle };
  const nav: Record<BlockId, string> = { first: data.navFirst, approach: data.navApproach, session: data.navSession, info: data.navInfo };
  return {
    title: booking ? data.bookingTitle : data.approachTitle,
    sub: booking ? data.bookingSub : data.approachSub,
    primary: booking ? data.bookingAction : data.approachAction,
    secondary: booking ? data.approachAction : data.bookingAction,
    order: ORDER[direction],
    titles,
    nav,
  };
}

/** A primeira dobra parada: é o que aparece dentro do recorte no rosto da escultura. */
export function PracticePoster({ data, direction }: { data: IdeaData["practice"]; direction: Direction }) {
  const c = copyOf(data, direction);
  return (
    <div className={s.practice} data-poster="1" data-direction={direction}>
      <div className={s.page}>
        <header className={s.hero}>
          <p className={s.eyebrow}>{data.eyebrow}</p>
          <p className={s.ptitle}>{c.title}</p>
          <p className={s.cta}><span className={s.pbtn}>{c.primary}</span></p>
        </header>
      </div>
    </div>
  );
}

export function PracticeIdea({ data }: { data: IdeaData["practice"] }) {
  const direction = useIdea((st) => st.priority);
  const [ready, setReady] = useState(false);
  const [changed, setChanged] = useState(false);
  const page = useRef<HTMLDivElement>(null);
  const before = useRef<Map<string, DOMRect> | null>(null);
  const c = copyOf(data, direction);

  /** FLIP: guarda onde cada bloco estava; depois da troca, cada um desliza do lugar antigo para o novo. */
  const turn = (next: Direction) => {
    if (next === direction) return;
    const root = page.current;
    if (root && !reduced()) {
      before.current = new Map([...root.querySelectorAll<HTMLElement>("[data-flip]")].map((el) => [el.dataset.flip!, el.getBoundingClientRect()]));
    }
    setReady(false);
    setChanged(true);
    idea.set({ priority: next });
  };
  useLayoutEffect(() => {
    const from = before.current;
    const root = page.current;
    before.current = null;
    if (!from || !root) return;
    root.querySelectorAll<HTMLElement>("[data-flip]").forEach((el) => {
      const was = from.get(el.dataset.flip!);
      const now = el.getBoundingClientRect();
      if (!was) {
        el.animate([{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "none" }], { duration: 420, easing: "cubic-bezier(.2,.7,.2,1)" });
        return;
      }
      const dx = was.left - now.left;
      const dy = was.top - now.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: 520, easing: "cubic-bezier(.2,.7,.2,1)" });
    });
  }, [direction]);

  const goTo = (id: BlockId) => {
    const el = page.current?.querySelector<HTMLElement>(`[data-flip="block-${id}"]`);
    el?.scrollIntoView({ block: "center", behavior: reduced() ? "auto" : "smooth" });
    el?.focus({ preventScroll: true });
  };
  const book = () => setReady(true);
  const primary = () => (direction === "booking" ? book() : goTo("approach"));
  const secondary = () => (direction === "booking" ? goTo("approach") : book());

  const bodies: Record<BlockId, ReactNode> = {
    first: (
      <ol className={s.steps}>
        {data.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    ),
    approach: <p>{data.approachBody}</p>,
    session: <p>{data.sessionBody}</p>,
    info: <p>{data.infoBody}</p>,
  };

  return (
    <div className={s.practice} data-direction={direction}>
      <div className={s.switch} role="radiogroup" aria-label={data.switchLabel}>
        <span className={s.switchLabel} aria-hidden="true">{data.switchLabel}</span>
        {(["booking", "approach"] as const).map((id) => (
          <button key={id} type="button" role="radio" aria-checked={direction === id} data-direction={id} onClick={() => turn(id)}>
            {id === "booking" ? data.bookingSwitch : data.approachSwitch}
          </button>
        ))}
      </div>
      <p className="sr-only" role="status">{changed ? data.changed : ""}</p>

      <div ref={page} className={s.page} tabIndex={-1}>
        <nav className={s.pnav} aria-label={data.brand}>
          <p className={s.pbrand}>
            <strong>{data.brand}</strong>
            <span>{data.brandSub}</span>
          </p>
          <ul>
            {c.order.map((id) => (
              <li key={id} data-flip={`nav-${id}`}>
                <button type="button" onClick={() => goTo(id)}>{c.nav[id]}</button>
              </li>
            ))}
          </ul>
        </nav>

        <header className={s.hero}>
          <div className={s.arch} aria-hidden="true" />
          <p className={s.eyebrow}>{data.eyebrow}</p>
          <h3 key={direction} className={s.ptitle} data-title="1">{c.title}</h3>
          <p key={`${direction}-sub`} className={s.psub}>{c.sub}</p>
          <p className={s.cta}>
            <button type="button" className={s.pbtn} data-primary="1" onClick={primary}>{c.primary}</button>
            <button type="button" className={s.plink} onClick={secondary}>{c.secondary}</button>
          </p>
          {ready && (
            <div className={s.ready} data-ready="1" role="status">
              <p className={s.readyLabel}>{data.ready}</p>
              <p className={s.readyText}>{data.readyText}</p>
              <p className={s.readyNote}>{data.readyNote}</p>
            </div>
          )}
        </header>

        <ol className={s.blocks}>
          {c.order.map((id, i) => (
            <li key={id} className={s.block} data-flip={`block-${id}`} data-block={id} tabIndex={-1}>
              <span className={s.blockN} aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              <h4>{c.titles[id]}</h4>
              {bodies[id]}
              {id === "first" && direction === "approach" && (
                <button type="button" className={s.plink} onClick={book}>{data.bookingAction}</button>
              )}
            </li>
          ))}
        </ol>
        <p className={s.pnote}>{data.note}</p>
      </div>
    </div>
  );
}

/** As linhas que a prévia do consultório leva para o pedido de proposta. */
export function practiceBrief(data: IdeaData, direction: Direction, priorityLabel: string, fact: string): { lines: string[]; replace: string[] } {
  const p = data.practice;
  const c = copyOf(p, direction);
  return {
    lines: [p.briefTitle, `${priorityLabel}: ${fact}`, `${p.briefAction}: ${c.primary}`, `${p.briefOrder}: ${c.order.map((id) => c.titles[id]).join(" → ")}`],
    replace: [p.briefTitle, `${priorityLabel}:`, `${p.briefAction}:`, `${p.briefOrder}:`],
  };
}
