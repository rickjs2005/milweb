"use client";

import { useCallback, useEffect, useRef, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import type { IdeaData } from "@/data/idea";
import { idea, useIdea } from "../../materia/idea-store";
import s from "./idea.module.css";

/**
 * Prévia de mergulho — um CONCEITO para uma operadora, com o Ace Diving Miami como referência.
 *
 * A linha de luz que atravessa o rosto da escultura é a superfície do mar. A pessoa arrasta para
 * descer (rolagem nativa: toque, roda, teclado; com o mouse, arraste), o medidor acompanha, ela
 * escolhe entre recife e naufrágio e vê como um visitante iniciaria um pedido de reserva. A
 * demonstração termina ali: nada é enviado.
 *
 * O progresso da descida vai em variáveis CSS (`--p`, `--d`), escritas direto no elemento: nenhum
 * render por quadro.
 */
const fill = (text: string, values: Record<string, string | number>) => text.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k] ?? ""));
const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.osMotion === "reduce";
/** Plâncton: posições fixas (nada de aleatório na hidratação). */
const SPECKS = Array.from({ length: 22 }, (_, i) => ({ x: (i * 37 + 11) % 100, y: (i * 53 + 7) % 100, r: 2 + (i % 4), k: 0.35 + ((i * 7) % 10) / 12 }));

/** O mar: céu do tema acima da linha, água abaixo, raios, plâncton. `--p` é a descida (0..1), `--d` a profundidade real. */
function Sea() {
  return (
    <div className={s.sea} aria-hidden="true">
      <div className={s.rays} />
      {SPECKS.map((p, i) => (
        <i key={i} className={s.speck} style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.r, height: p.r, "--k": p.k } as CSSProperties} />
      ))}
      <div className={s.sky} />
      <div className={s.line}>
        <svg viewBox="0 0 1200 24" preserveAspectRatio="none">
          <path d="M0 12 C 100 4 200 20 300 12 S 500 4 600 12 S 800 20 900 12 S 1100 4 1200 12" />
        </svg>
      </div>
    </div>
  );
}

function ReefArt() {
  return (
    <svg className={s.art} viewBox="0 0 320 180" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <path d="M0 150 C 60 132 120 160 180 146 S 280 130 320 148 V180 H0z" fill="#0c5a6b" />
      <path d="M0 162 C 70 148 150 172 220 158 S 300 150 320 160 V180 H0z" fill="#094554" />
      <g fill="none" strokeLinecap="round" strokeWidth="7">
        <path d="M64 156 V118 M64 136 L46 116 M64 128 L82 106 M46 116 V98 M82 106 V88" stroke="#ff8f7a" />
        <path d="M250 152 V112 M250 132 L232 114 M250 124 L270 104 M270 104 V86" stroke="#ffb86b" />
        <path d="M150 158 V132 M150 144 L136 128 M150 140 L166 124" stroke="#ff6f91" strokeWidth="6" />
      </g>
      <g fill="#5fe3c9" opacity=".9">
        <path d="M108 160 C 96 128 104 104 118 92 C 116 118 126 138 122 160z" />
        <path d="M204 160 C 196 134 206 114 216 106 C 214 128 220 144 216 160z" opacity=".7" />
      </g>
      <g fill="#fff6c9">
        <path d="M176 70 c 10 -8 22 -8 30 0 c -8 8 -20 8 -30 0z M170 64 l 8 6 l -8 6z" />
        <path d="M96 52 c 7 -5 15 -5 21 0 c -6 5 -14 5 -21 0z M92 48 l 5 4 l -5 4z" opacity=".8" />
        <path d="M232 44 c 6 -4 12 -4 17 0 c -5 4 -11 4 -17 0z M229 41 l 4 3 l -4 3z" opacity=".65" />
      </g>
    </svg>
  );
}

function WreckArt() {
  return (
    <svg className={s.art} viewBox="0 0 320 180" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <path d="M0 156 C 80 144 160 164 240 152 S 300 146 320 154 V180 H0z" fill="#06202d" />
      <path d="M150 20 L176 150" stroke="#12384a" strokeWidth="5" strokeLinecap="round" />
      <path d="M128 60 L196 48" stroke="#12384a" strokeWidth="3" strokeLinecap="round" />
      <path d="M38 118 L268 92 L292 128 L250 158 L70 160z" fill="#0b2b3b" />
      <path d="M38 118 L268 92 L262 104 L52 128z" fill="#16475c" />
      <path d="M110 96 L182 88 L186 60 L118 66z" fill="#0f3547" />
      <g fill="#7fe3e0">
        <circle cx="96" cy="138" r="5" opacity=".75" />
        <circle cx="134" cy="134" r="5" opacity=".55" />
        <circle cx="172" cy="130" r="5" opacity=".4" />
        <circle cx="210" cy="126" r="5" opacity=".25" />
      </g>
      <path d="M0 0 L120 0 L210 180 L60 180z" fill="#7fe3e0" opacity=".06" />
    </svg>
  );
}

/** A primeira dobra parada: é o que aparece dentro do recorte no rosto da escultura. */
export function DivePoster({ data }: { data: IdeaData["dive"] }) {
  return (
    <div className={s.dive} data-poster="1" style={{ "--p": 0, "--d": 0 } as CSSProperties}>
      <Sea />
      <section className={s.surface}>
        <p className={s.brand}>{data.brand}</p>
        <p className={s.h1}>{data.title}</p>
      </section>
    </div>
  );
}

export function DiveIdea({ data }: { data: IdeaData["dive"] }) {
  const site = useIdea((st) => st.site);
  const divers = useIdea((st) => st.divers);
  const when = useIdea((st) => st.when);
  const started = useIdea((st) => st.started);
  const root = useRef<HTMLDivElement>(null);
  const now = useRef<HTMLSpanElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const siteRef = useRef<HTMLElement>(null);
  const drag = useRef<{ id: number; y: number; top: number; moved: boolean } | null>(null);
  const descend = useRef(false);
  const floor = site ? data.depths[site] : data.depths.floor;

  // Descida → variáveis CSS, o número do medidor e o valor do controle (sem render).
  const sync = useCallback(() => {
    const el = root.current;
    if (!el) return;
    const max = Math.max(1, el.scrollHeight - el.clientHeight);
    const p = Math.max(0, Math.min(1, el.scrollTop / max));
    const depth = Math.round(p * floor);
    el.style.setProperty("--p", p.toFixed(4));
    el.style.setProperty("--d", ((p * floor) / data.depths.floor).toFixed(4));
    if (now.current) now.current.textContent = String(depth);
    knob.current?.setAttribute("aria-valuenow", String(depth));
    knob.current?.setAttribute("aria-valuetext", `${depth} m`);
  }, [floor, data.depths.floor]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        sync();
      });
    };
    sync();
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [sync]);

  // Escolheu o mergulho: a página desce até ele.
  useEffect(() => {
    if (!descend.current || !site) return;
    descend.current = false;
    const el = root.current;
    const target = siteRef.current;
    if (!el || !target) return;
    el.scrollTo({ top: target.offsetTop, behavior: reduced() ? "auto" : "smooth" });
  }, [site]);

  const by = (ratio: number) => {
    const el = root.current;
    if (el) el.scrollBy({ top: ratio * el.clientHeight, behavior: reduced() ? "auto" : "smooth" });
  };
  const onKnobKey = (e: KeyboardEvent) => {
    const el = root.current;
    if (!el) return;
    const steps: Record<string, number> = { ArrowDown: 0.25, ArrowRight: 0.25, ArrowUp: -0.25, ArrowLeft: -0.25, PageDown: 0.9, PageUp: -0.9 };
    if (e.key in steps) by(steps[e.key]);
    else if (e.key === "Home") el.scrollTo({ top: 0, behavior: reduced() ? "auto" : "smooth" });
    else if (e.key === "End") el.scrollTo({ top: el.scrollHeight, behavior: reduced() ? "auto" : "smooth" });
    else return;
    e.preventDefault();
  };
  // Com o mouse, arrastar a cena é descer (no toque a rolagem nativa já é isso).
  const onDown = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" || e.button !== 0 || (e.target as HTMLElement).closest("button, a, input, [role=slider]")) return;
    const el = root.current;
    if (!el) return;
    drag.current = { id: e.pointerId, y: e.clientY, top: el.scrollTop, moved: false };
  };
  const onMove = (e: PointerEvent) => {
    const d = drag.current;
    const el = root.current;
    if (!d || !el || d.id !== e.pointerId) return;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.abs(dy) < 4) return;
    if (!d.moved) {
      d.moved = true;
      el.setPointerCapture(e.pointerId);
      el.dataset.dragging = "1";
    }
    el.scrollTop = d.top - dy;
  };
  const onUp = (e: PointerEvent) => {
    const el = root.current;
    if (drag.current?.moved && el) {
      delete el.dataset.dragging;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {}
    }
    drag.current = null;
  };

  const choose = (next: "reef" | "wreck") => {
    descend.current = true;
    if (next === site) {
      // já escolhido: só desce de novo
      const el = root.current;
      const target = siteRef.current;
      if (el && target) el.scrollTo({ top: target.offsetTop, behavior: reduced() ? "auto" : "smooth" });
      descend.current = false;
      return;
    }
    idea.set({ site: next, started: false });
  };
  const name = site === "reef" ? data.reef : site === "wreck" ? data.wreck : "";
  const count = divers === 1 ? data.diverOne : fill(data.diverMany, { n: divers });
  const message = site ? fill(data.message, { site: name, depth: data.depths[site], divers: count, when: data.whenOptions[when] }) : "";
  const cards = [
    { id: "reef" as const, name: data.reef, line: data.reefLine, level: data.reefLevel, Art: ReefArt },
    { id: "wreck" as const, name: data.wreck, line: data.wreckLine, level: data.wreckLevel, Art: WreckArt },
  ];

  return (
    <div ref={root} className={s.dive} data-site={site ?? "none"} tabIndex={-1} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} style={{ "--p": 0, "--d": 0 } as CSSProperties}>
      <Sea />

      <div className={s.meter}>
        <p className={s.depthNow}>
          <span className={s.depthLabel}>{data.depth}</span>
          <strong>
            <span ref={now}>0</span> m
          </strong>
        </p>
        <div className={s.rail}>
          <i className={s.railFill} />
          <div ref={knob} className={s.knob} role="slider" tabIndex={0} aria-label={data.depth} aria-orientation="vertical" aria-valuemin={0} aria-valuemax={floor} aria-valuenow={0} aria-valuetext="0 m" onKeyDown={onKnobKey} />
        </div>
        <p className={s.railEnd}>{floor} m</p>
      </div>

      <section className={s.surface}>
        {/* o topo de um site de verdade: a marca e três destinos (ilustrativos) acima da linha d'água */}
        <p className={s.top} aria-hidden="true">
          <strong>{data.brand}</strong>
          <span>{data.navDives}</span>
          <span>{data.navCourses}</span>
          <span className={s.topBook}>{data.navBook}</span>
        </p>
        <h3 className={s.h1}>{data.title}</h3>
        <p className={s.sub}>{data.sub}</p>
        <button type="button" className={s.hint} onClick={() => by(0.9)}>
          <span>{data.hint}</span>
          <svg viewBox="0 0 16 24" width="14" height="21" aria-hidden="true"><path d="M8 2v18M2 14l6 7 6-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </section>

      <section className={s.choose}>
        <h4 className={s.h2}>{data.chooseTitle}</h4>
        <p className={s.lead}>{data.chooseSub}</p>
        <div className={s.cards}>
          {cards.map(({ id, name: label, line, level, Art }) => (
            <article key={id} className={s.card} data-kind={id} data-on={site === id ? "1" : "0"}>
              <Art />
              <div className={s.cardText}>
                <h5>{label}</h5>
                <p className={s.facts}>
                  <span>{data.depths[id]} m</span>
                  <span>{data.level}: {level}</span>
                </p>
                <p>{line}</p>
                <button type="button" aria-pressed={site === id} onClick={() => choose(id)}>
                  {site === id ? data.chosen : data.go}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section ref={siteRef} className={s.site} aria-live="polite">
        {site ? (
          <>
            <div className={s.siteArt}>{site === "reef" ? <ReefArt /> : <WreckArt />}</div>
            <p className={s.arrive}>
              {name} · {data.depths[site]} m
            </p>
            <div className={s.book}>
              <h4 className={s.h2}>{data.bookTitle}</h4>
              <p className={s.lead}>{data.bookSub}</p>
              <div className={s.row}>
                <span className={s.rowLabel}>{data.divers}</span>
                <div className={s.stepper}>
                  <button type="button" aria-label={data.fewer} disabled={divers <= 1} onClick={() => idea.set({ divers: Math.max(1, divers - 1), started: false })}>−</button>
                  <output aria-live="polite">{divers}</output>
                  <button type="button" aria-label={data.more} disabled={divers >= 6} onClick={() => idea.set({ divers: Math.min(6, divers + 1), started: false })}>+</button>
                </div>
              </div>
              <div className={s.row}>
                <span className={s.rowLabel}>{data.when}</span>
                <div className={s.chips} role="group" aria-label={data.when}>
                  {data.whenOptions.map((label, i) => (
                    <button key={label} type="button" aria-pressed={when === i} onClick={() => idea.set({ when: i, started: false })}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <button type="button" className={s.start} onClick={() => idea.set({ started: true })}>
                {data.start}
              </button>
              {started && (
                <div className={s.request} data-request="1">
                  <p className={s.rowLabel}>{data.messageLabel}</p>
                  <p className={s.message}>{message}</p>
                  <p className={s.end}>{data.end}</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <p className={s.pickFirst}>{data.pickFirst}</p>
        )}
      </section>
    </div>
  );
}

/** As linhas que a prévia de mergulho leva para o pedido de proposta. */
export function diveBrief(data: IdeaData, st: { site: "reef" | "wreck" | null; divers: number; when: number }): { lines: string[]; replace: string[] } {
  const d = data.dive;
  const count = st.divers === 1 ? d.diverOne : fill(d.diverMany, { n: st.divers });
  const choice = st.site ? `${data.common.briefChoice}: ${st.site === "reef" ? d.reef : d.wreck} (${d.depths[st.site]} m) · ${count} · ${d.whenOptions[st.when]}` : "";
  return { lines: [d.briefTitle, d.briefGoal, choice].filter(Boolean), replace: [d.briefTitle, d.briefGoal, `${data.common.briefChoice}:`] };
}
