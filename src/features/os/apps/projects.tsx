"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { useOs } from "../os-shell";
import type { OsProject, OsStrings } from "../types";

type Filter = "all" | "client" | "demo" | "tourism" | "scroll" | "webgl" | "product";
const FILTERS: Filter[] = ["all", "client", "demo", "tourism", "scroll", "webgl", "product"];

/**
 * Projetos — a pasta como uma coleção de cartazes de missão.
 *
 * Cada projeto é um dossiê em papel: número em contorno, nome em display
 * expandido, foto emoldurada que ganha cor ao passar o ponteiro, carimbo
 * (cliente, demo, autoral), classe, status, resumo e etiquetas. Linguagem
 * de cartaz de aventura — original, nenhuma arte ou layout de obra alheia.
 *
 * Movimento: cada cartaz entra quando aparece no corpo rolável (um
 * IntersectionObserver para a coleção inteira, escrevendo `data-in` direto no
 * DOM — nada de re-render por cartaz), cai e assenta com uma leve rotação; o
 * carimbo "bate" logo depois. No hover: inclinação ao cursor (variáveis CSS
 * escritas num rAF, só com ponteiro fino), varredura de luz, carimbo de novo.
 * Tudo CSS; sem biblioteca de animação no pacote do OS.
 * `prefers-reduced-motion`/Ajustes › Reduzir: estado final, parado.
 *
 * Cada cartaz é um link real para o case (rota canônica); o shell abre o
 * conteúdo dentro desta janela. Filtros: todos, clientes, demos, turismo &
 * guias, scroll, WebGL, produtos digitais — a lista vem da carga do idioma.
 */
export function ProjectsApp() {
  const { payload, route } = useOs();
  const s = payload.s;
  const [filter, setFilter] = useState<Filter>("all");
  const counts = useMemo(() => Object.fromEntries(FILTERS.map((f) => [f, payload.projects.filter((p) => matches(p, f)).length])) as Record<Filter, number>, [payload.projects]);
  const list = useMemo(() => payload.projects.filter((p) => matches(p, filter)), [payload.projects, filter]);
  const current = route.kind === "project" ? route.detail : null;
  const boardRef = useRef<HTMLUListElement>(null);

  // Entrada por rolagem: o observador avisa quem cruza a janela; quem já passou para cima
  // (salto de rolagem, tecla End) é revelado no mesmo aviso. Uma vez revelado, fica.
  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const items = [...board.querySelectorAll<HTMLElement>(".os-project")];
    const reveal = (el: Element) => ((el as HTMLElement).dataset.in = "1");
    if (typeof IntersectionObserver === "undefined") {
      items.forEach(reveal);
      return;
    }
    const root = board.closest<HTMLElement>("[data-os-scroller]");
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (!en.isIntersecting) continue;
          reveal(en.target);
          io.unobserve(en.target);
        }
        const top = root ? root.getBoundingClientRect().top : 0;
        for (const el of items) {
          if (el.dataset.in !== "0" || el.getBoundingClientRect().bottom >= top) continue;
          reveal(el);
          io.unobserve(el);
        }
      },
      { root, rootMargin: "0px 0px 10% 0px", threshold: 0.1 },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [list]);

  return (
    <div className="os-projects" data-filter={filter}>
      <header className="os-app__header os-projects__header">
        <div>
          <p className="t-mono os-app__eyebrow">
            {s.projects.dossier} · {String(payload.projects.length).padStart(2, "0")} {s.projects.count}
          </p>
          <p className="os-projects__lead">{s.projects.lead}</p>
        </div>
        <div className="os-projects__filters" role="group" aria-label={s.projects.kind}>
          {FILTERS.map((f) => (
            <button key={f} type="button" className="os-chip t-mono" aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {payload.filters[f]}
              <span className="os-chip__count tnum" aria-hidden="true">
                {counts[f]}
              </span>
            </button>
          ))}
        </div>
      </header>

      {list.length === 0 ? (
        <p className="t-mono os-projects__empty">{s.projects.empty}</p>
      ) : (
        // A chave pelo filtro remonta a coleção: os cartazes voltam a entrar com a cascata.
        <ul ref={boardRef} className="os-projects__board" key={filter}>
          {list.map((p, i) => (
            <Poster key={p.slug} p={p} i={i} current={current === p.slug} s={s.projects} />
          ))}
        </ul>
      )}
    </div>
  );
}

function matches(p: OsProject, f: Filter): boolean {
  switch (f) {
    case "all":
      return true;
    case "client":
      return p.kind === "client";
    case "demo":
      return p.kind === "demo";
    case "tourism":
      return p.tourism;
    case "scroll":
      return p.scroll;
    case "webgl":
      return p.webgl;
    case "product":
      return p.product;
  }
}

/** Inclinação ao cursor só com hover real, ponteiro fino e movimento permitido (mídia decidida uma vez). */
let fineHover: boolean | null = null;
function canTilt(): boolean {
  if (fineHover === null) fineHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return fineHover && document.documentElement.dataset.osMotion !== "reduce";
}

function Poster({ p, i, current, s }: { p: OsProject; i: number; current: boolean; s: OsStrings["projects"] }) {
  const ref = useRef<HTMLLIElement>(null);
  const raf = useRef(0);

  useEffect(
    () => () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    },
    [],
  );

  const onMove = (e: ReactPointerEvent<HTMLAnchorElement>) => {
    if (e.pointerType !== "mouse" || !canTilt()) return;
    const el = ref.current;
    if (!el || raf.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    raf.current = requestAnimationFrame(() => {
      raf.current = 0;
      el.style.setProperty("--rx", `${(-py * 7).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${(px * 9).toFixed(2)}deg`);
    });
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = 0;
    el.style.removeProperty("--rx");
    el.style.removeProperty("--ry");
  };

  const stamp = p.kind === "client" ? s.stamp.client : p.kind === "demo" ? s.stamp.demo : s.stamp.study;
  const status = p.kind === "client" ? (p.client ?? s.client) : p.live ? s.live : (p.status ?? s.study);

  return (
    // `data-in` é escrito pelo observador da coleção (ProjectsApp): o React não o toca depois de montar.
    <li ref={ref} className="os-project" data-in="0" data-current={current ? "1" : "0"} data-kind={p.kind} data-slug={p.slug} style={{ "--i": i % 10 } as CSSProperties}>
      <span className="os-project__pin" aria-hidden="true" />
      <Link href={p.href} className="os-project__link" scroll={false} aria-current={current ? "page" : undefined} onPointerMove={onMove} onPointerLeave={onLeave}>
        <span className="os-project__sheet">
          <span className="t-mono os-project__top">
            <span>
              {s.dossier} · {s.rank} {p.n}
            </span>
            <span className="os-project__mission">{s.mission[p.kindKey]}</span>
          </span>
          <span className="os-project__n" aria-hidden="true">
            {p.n}
          </span>
          <span className="os-project__title">{p.name}</span>
          <span className="os-project__frame">
            <Image src={p.image} alt={p.title} fill sizes="(max-width: 719px) 92vw, (max-width: 1079px) 44vw, 320px" className="os-project__img" />
            <span className="os-project__stamp" data-kind={p.kind} aria-hidden="true">
              {stamp}
            </span>
          </span>
          <span className="t-mono os-project__meta">
            <span>
              <b>{s.classLabel}</b> · {p.type}
            </span>
            <span>
              <b>{(p.kind === "client" ? s.stamp.client : s.status).toUpperCase()}</b> · {status}
            </span>
          </span>
          <span className="os-project__tagline">{p.tagline}</span>
          <span className="t-mono os-project__tags" aria-label={s.stack}>
            {p.stack.slice(0, 3).map((t) => (
              <span key={t}>{t}</span>
            ))}
          </span>
          <span className="t-mono os-project__foot">
            <span>MW/OS{p.year ? ` · ${p.year}` : ""}</span>
            <span className="os-project__open">{s.open} →</span>
          </span>
        </span>
      </Link>
    </li>
  );
}
