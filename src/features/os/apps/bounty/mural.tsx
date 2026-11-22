"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type ReactNode, type WheelEvent as ReactWheelEvent } from "react";
import { APPS } from "../../registry";
import { useOs, useOsStore } from "../../os-shell";
import type { OsProject } from "../../types";
import { Poster, posterSeal } from "./poster";

/**
 * THE BOUNTY COLLECTION — a pasta Projetos como um mural de cartazes.
 *
 * Um trilho em perspectiva: o cartaz principal no centro, os vizinhos em
 * degraus para trás (translateZ, rotateY, escala, opacidade), tudo
 * calculado em CSS a partir de duas variáveis por cartaz (`--d` = distância
 * assinada ao principal, `--ad` = módulo) e de unidades de contêiner — a
 * geometria se adapta sozinha ao tamanho da janela. O HTML já nasce com
 * os 31 cartazes e seus links (SEO, sem JS).
 *
 * Navegação: roda do mouse/trackpad (acumulada), arraste e swipe (variável
 * `--drag` enquanto o dedo segura), setas/Home/End/PageUp/PageDown no trilho,
 * clique nos vizinhos, fita de posição (um traço por projeto) e a grade
 * "ver todos" para saltar direto a qualquer um.
 *
 * Coreografia (GSAP carregado sob demanda, só com movimento permitido):
 * entrada "folhas ao vento" — os cartazes visíveis chegam de fora com
 * rotação em Z e Y, desaceleram, pousam com um pequeno impacto e a sombra
 * acompanha; a câmera (o trilho) recua de 1,08 para 1.
 *
 * Dossiê: clicar num cartaz é UMA transformação física — o cartaz se
 * desprende (um voador com o mesmo visual), os outros recuam e escurecem, o
 * voador cruza a janela até a coluna do dossiê (FLIP: retângulo de origem →
 * retângulo do destino, escala uniforme porque os dois são 3:4), o case
 * entra em sequência ao lado. A URL muda para a rota canônica do case
 * (Voltar do navegador e link direto funcionam); o conteúdo é o mesmo
 * server component da página. Fechar reverte o voo e o visitante continua
 * no mesmo ponto da coleção, porque o mural nunca desmonta.
 */
type Filter = "all" | "client" | "demo" | "tourism" | "experiment" | "webgl" | "product";
const FILTERS: Filter[] = ["all", "client", "demo", "tourism", "experiment", "webgl", "product"];
type Phase = "closed" | "opening" | "open" | "closing";

/** Além desta distância o cartaz não é desenhado (visibility hidden) nem carrega imagem. */
const FAR = 6;
const NEAR = 5;
/** Recuo do trilho com o dossiê aberto — os MESMOS valores de `.bounty[data-phase="open"] .bounty__track` no CSS. */
const DIM_SCALE = 0.92;
const DIM_Y = 10;

export function matchesFilter(p: OsProject, f: Filter): boolean {
  switch (f) {
    case "all":
      return true;
    case "client":
      return p.kind === "client";
    case "demo":
      return p.kind === "demo";
    case "tourism":
      return p.tourism;
    case "experiment":
      return posterSeal(p) === "experiment";
    case "webgl":
      return p.webgl;
    case "product":
      return p.product;
  }
}

type Gsap = typeof import("@/animations/gsap");

export function BountyMural({ dossier, slug, active: winActive }: { dossier: ReactNode | null; slug: string | null; active: boolean }) {
  const { payload, navigate } = useOs();
  const P = payload.s.projects;
  const shell = useOsStore((st) => st.shell);
  const motionPref = useOsStore((st) => st.prefs.motion);
  const mobile = shell === "mobile";
  const all = payload.projects;
  const total = all.length;

  const [filter, setFilter] = useState<Filter>("all");
  const list = useMemo(() => all.filter((p) => matchesFilter(p, filter)), [all, filter]);
  const [activeSlug, setActiveSlug] = useState<string>(() => (slug && all.some((p) => p.slug === slug) ? slug : (all[0]?.slug ?? "")));
  const active = Math.max(0, list.findIndex((p) => p.slug === activeSlug));
  const current = list[active] ?? all[0];
  const [phase, setPhase] = useState<Phase>(() => (slug ? "open" : "closed"));
  const [pending, setPending] = useState<string | null>(null);
  const [allOpen, setAllOpen] = useState(false);
  // Telefone deitado: os filtros ficam recolhidos atrás de um botão (CSS só aplica o atributo lá).
  const [filtersOpen, setFiltersOpen] = useState(false);
  // Enquanto o voo de volta acontece a rota já é a raiz: o dossiê lembra o último slug até fechar.
  const lastRef = useRef<string | null>(slug);
  if (slug ?? pending) lastRef.current = slug ?? pending;
  const dossierSlug = slug ?? pending ?? (phase === "closing" ? lastRef.current : null);
  // O dossiê abre qualquer case com página, inclusive os autorais, que não têm cartaz no mural.
  const dossierProject = dossierSlug ? (all.find((p) => p.slug === dossierSlug) ?? payload.authorial.find((p) => p.slug === dossierSlug)) : undefined;

  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const flyerRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const originRef = useRef<DOMRect | null>(null);
  const gsapRef = useRef<Promise<Gsap> | null>(null);
  const seqRef = useRef(0);
  const drag = useRef({ on: false, x0: 0, y0: 0, t0: 0, dx: 0, moved: false, axis: null as null | "x" | "y" });
  const wheel = useRef({ acc: 0, lock: false, timer: 0 });
  const prevSlug = useRef<string | null>(slug);

  /** Invalida um voo em andamento (troca de fase antes de ele terminar). */
  const invalidate = useCallback(() => {
    seqRef.current++;
  }, []);
  const noMotion = useCallback(() => motionPref === "reduce" || window.matchMedia("(prefers-reduced-motion: reduce)").matches, [motionPref]);
  const loadGsap = useCallback(() => (gsapRef.current ??= import("@/animations/gsap")), []);
  const paperOf = useCallback((sl: string) => rootRef.current?.querySelector<HTMLElement>(`.bounty__slot[data-slug="${sl}"] .bounty__paper`) ?? null, []);

  const go = useCallback(
    (i: number) => {
      if (!list.length) return;
      const next = Math.max(0, Math.min(list.length - 1, i));
      setActiveSlug(list[next].slug);
    },
    [list],
  );

  // ---- filtro: mantém o projeto em foco quando ele continua na lista; senão, o primeiro ----
  const pickFilter = (f: Filter) => {
    setFilter(f);
    setFiltersOpen(false);
    const next = all.filter((p) => matchesFilter(p, f));
    if (!next.some((p) => p.slug === activeSlug) && next[0]) setActiveSlug(next[0].slug);
  };

  // ---- entrada: folhas ao vento (uma vez por montagem e a cada troca de filtro) ----
  useEffect(() => {
    if (!winActive || noMotion() || phase !== "closed") return;
    let cancelled = false;
    const track = trackRef.current;
    if (!track) return;
    loadGsap().then(({ gsap, EASE }) => {
      if (cancelled) return;
      const slots = [...track.querySelectorAll<HTMLElement>('.bounty__slot[data-near="1"]')];
      const items = slots.map((sl) => ({ el: sl.querySelector<HTMLElement>(".bounty__paper")!, sh: sl.querySelector<HTMLElement>(".bounty__shadow"), d: Number(sl.dataset.d) })).filter((x) => x.el);
      items.sort((a, b) => Math.abs(a.d) - Math.abs(b.d));
      gsap.killTweensOf([track, ...items.map((x) => x.el)]);
      gsap.fromTo(track, { scale: 1.08, y: 16, transformOrigin: "50% 60%" }, { scale: 1, y: 0, duration: 1.9, ease: EASE.outExpo, clearProps: "transform" });
      items.forEach(({ el, sh, d }, k) => {
        const side = d === 0 ? (k % 2 ? -1 : 1) : Math.sign(d);
        const tl = gsap.timeline({ delay: 0.05 + k * 0.09 });
        tl.fromTo(el, { x: side * (320 + Math.abs(d) * 110), y: -(150 + k * 26), opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: 1.35 + k * 0.06, ease: "power3.out" }, 0)
          .fromTo(el, { rotateZ: side * (18 + k * 3), rotateY: side * 34, rotateX: -14 }, { rotateZ: 0, rotateY: 0, rotateX: 0, duration: 1.5 + k * 0.06, ease: "back.out(1.3)" }, 0)
          .fromTo(el, { scale: 0.94 }, { scale: 1, duration: 1.1, ease: "power2.out" }, 0.15)
          .to(el, { scale: 0.985, duration: 0.09, ease: "power1.in" }, ">-0.06")
          .to(el, { scale: 1, duration: 0.34, ease: "elastic.out(1, 0.55)", clearProps: "transform,opacity" });
        if (sh) tl.fromTo(sh, { opacity: 0 }, { opacity: 0.6, duration: 1.1, ease: "power3.out", clearProps: "opacity" }, 0.1);
      });
    });
    return () => {
      cancelled = true;
      gsapRef.current?.then(({ gsap }) => gsap.killTweensOf([track, ...track.querySelectorAll(".bounty__paper, .bounty__shadow")]));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só na montagem e ao trocar de filtro
  }, [filter]);

  // ---- rota → dossiê ----
  useEffect(() => {
    const was = prevSlug.current;
    prevSlug.current = slug;
    if (slug) {
      setPending(null);
      const inMural = all.some((p) => p.slug === slug);
      if (!inMural && !payload.authorial.some((p) => p.slug === slug)) return;
      if (inMural) {
        if (!list.some((p) => p.slug === slug)) setFilter("all");
        setActiveSlug(slug);
      }
      if (phase === "closed" || phase === "closing") setPhase(noMotion() || !originRef.current ? "open" : "opening");
    } else if (was && (phase === "open" || phase === "opening")) {
      // Sem cartaz no mural (autoral) não há para onde voar de volta: fecha direto.
      setPhase(noMotion() || !all.some((p) => p.slug === was) ? "closed" : "closing");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reage só à rota
  }, [slug]);

  // ---- o voo (FLIP manual): origem → coluna do dossiê e de volta ----
  useLayoutEffect(() => {
    if (phase !== "opening" && phase !== "closing") return;
    const root = rootRef.current;
    const stage = stageRef.current;
    const flyer = flyerRef.current;
    const slotEl = slotRef.current;
    const paper = paperOf(activeSlug);
    if (!root || !stage || !flyer || !slotEl || !paper) {
      setPhase(phase === "opening" ? "open" : "closed");
      return;
    }
    const seq = ++seqRef.current;
    const rr = root.getBoundingClientRect();
    const rel = (r: { left: number; top: number; width: number }) => ({ x: r.left - rr.left, y: r.top - rr.top, w: r.width });
    // Com o dossiê aberto o trilho está recuado; o destino do voo de volta é o retângulo SEM o recuo.
    const undim = (r: DOMRect) => {
      const sr = stage.getBoundingClientRect();
      const cx = sr.left + sr.width / 2;
      const cy = sr.top + sr.height / 2;
      const w = r.width / DIM_SCALE;
      const h = r.height / DIM_SCALE;
      // transform: scale(s) translateY(y) → p' = c + s·(p + y − c)  ⇒  p = c + (p' − c)/s − y
      return { left: cx + (r.left + r.width / 2 - cx) / DIM_SCALE - w / 2, top: cy + (r.top + r.height / 2 - cy) / DIM_SCALE - DIM_Y - h / 2, width: w };
    };
    const from = phase === "opening" ? rel(originRef.current ?? paper.getBoundingClientRect()) : rel(slotEl.getBoundingClientRect());
    const to = phase === "opening" ? rel(slotEl.getBoundingClientRect()) : rel(undim(paper.getBoundingClientRect()));
    originRef.current = null;
    const w0 = flyer.offsetWidth || 1;
    loadGsap().then(({ gsap, EASE }) => {
      if (seq !== seqRef.current) return;
      gsap.killTweensOf(flyer);
      const done = () => {
        if (seq === seqRef.current) setPhase(phase === "opening" ? "open" : "closed");
      };
      gsap.set(flyer, { x: from.x, y: from.y, scale: from.w / w0, rotateY: 0, rotateZ: 0, transformOrigin: "0 0", autoAlpha: 1 });
      const tl = gsap.timeline({ onComplete: done });
      if (phase === "opening") {
        // 1) desprende-se e avança para a câmera; 2) cruza a janela até a coluna do dossiê e assenta
        tl.to(flyer, { scale: (from.w / w0) * 1.1, y: from.y - 26, rotateY: -14, rotateZ: -3, duration: 0.38, ease: "power2.out" })
          .to(flyer, { x: to.x, y: to.y, scale: to.w / w0, rotateY: 0, rotateZ: 0, duration: 0.78, ease: "power3.inOut" })
          .to(flyer, { scale: (to.w / w0) * 0.985, duration: 0.08, ease: "power1.in" })
          .to(flyer, { scale: to.w / w0, duration: 0.3, ease: "elastic.out(1, 0.6)" });
      } else {
        tl.to(flyer, { scale: (from.w / w0) * 1.06, rotateY: 10, rotateZ: 2, duration: 0.26, ease: "power2.out" })
          .to(flyer, { x: to.x, y: to.y, scale: to.w / w0, rotateY: 0, rotateZ: 0, duration: 0.66, ease: "power3.inOut" });
      }
    });
    return invalidate;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a fase é o gatilho; o resto é lido na hora
  }, [phase]);

  // ---- Esc: fecha a grade "ver todos" ou o dossiê antes de chegar à janela ----
  useEffect(() => {
    if (!allOpen && phase === "closed") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [contenteditable=true], dialog[open]")) return;
      if (!rootRef.current?.closest(".os-window")?.matches('[data-focused="1"]') && !rootRef.current?.closest("#os-simple")) return;
      e.preventDefault();
      if (allOpen) setAllOpen(false);
      else closeDossier();
    };
    document.addEventListener("keydown", onKey, { capture: true });
    return () => document.removeEventListener("keydown", onKey, { capture: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allOpen, phase]);

  // ---- humor do projeto em foco → luz do mural (variáveis registradas, transição no CSS) ----
  const [mr, mg, mb] = (current?.mood ?? "70 76 84").split(" ");

  const openPoster = (e: ReactMouseEvent<HTMLAnchorElement>, p: OsProject) => {
    if (drag.current.moved) {
      e.preventDefault();
      return;
    }
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (phase !== "closed") return;
    originRef.current = (e.currentTarget.querySelector<HTMLElement>(".bounty__paper") ?? e.currentTarget).getBoundingClientRect();
    setActiveSlug(p.slug);
    setPending(p.slug);
    setPhase(noMotion() ? "open" : "opening");
    navigate(`/work/${p.slug}`, "push", true);
  };

  const closeDossier = () => {
    if (phase === "closed" || phase === "closing") return;
    setPending(null);
    navigate(APPS.projects.route!, "push", true);
    // sem rota para fechar (dossiê aberto só por `pending`): fecha localmente
    if (!slug) setPhase(noMotion() ? "closed" : "closing");
  };

  // ---- roda, arraste, teclado ----
  const onWheel = (e: ReactWheelEvent) => {
    if (phase !== "closed" || allOpen) return;
    const w = wheel.current;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    w.acc += delta;
    window.clearTimeout(w.timer);
    w.timer = window.setTimeout(() => (w.acc = 0), 220);
    if (w.lock || Math.abs(w.acc) < 60) return;
    go(active + Math.sign(w.acc));
    w.acc = 0;
    w.lock = true;
    window.setTimeout(() => (w.lock = false), 380);
  };
  const stepPx = () => {
    const paper = paperOf(activeSlug);
    const w = paper?.getBoundingClientRect().width ?? 300;
    return mobile ? w + 14 : w * 0.62;
  };
  const onPointerDown = (e: ReactPointerEvent) => {
    if (phase !== "closed" || allOpen || e.button !== 0) return;
    if ((e.target as HTMLElement).closest("button")) return;
    drag.current = { on: true, x0: e.clientX, y0: e.clientY, t0: performance.now(), dx: 0, moved: false, axis: null };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
    };
    // O arraste só vira navegação depois de se declarar horizontal; um gesto vertical (rolagem,
    // `touch-action: pan-y` no celular) ou um pointercancel abandona sem trocar de cartaz.
    const move = (ev: PointerEvent) => {
      const d = drag.current;
      if (!d.on) return;
      d.dx = ev.clientX - d.x0;
      const dy = ev.clientY - d.y0;
      if (!d.axis) {
        if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(d.dx)) {
          // Gesto vertical: a navegação sai de cena, mas o click que fecha o gesto (mouse/caneta)
          // ainda é descartado — arrastar não é tocar. `up`/`cancel` limpam `moved`.
          d.axis = "y";
          d.moved = true;
          d.on = false;
          window.removeEventListener("pointermove", move);
          return;
        }
        if (Math.abs(d.dx) <= 8) return;
        d.axis = "x";
      }
      if (!d.moved) {
        d.moved = true;
        rootRef.current?.setAttribute("data-dragging", "1");
      }
      rootRef.current?.style.setProperty("--drag", `${d.dx}px`);
    };
    const cancel = () => {
      const d = drag.current;
      d.on = false;
      stop();
      rootRef.current?.removeAttribute("data-dragging");
      rootRef.current?.style.setProperty("--drag", "0px");
      window.setTimeout(() => (drag.current.moved = false), 60);
    };
    const up = () => {
      const d = drag.current;
      d.on = false;
      stop();
      if (!d.moved) return;
      if (d.axis === "y") {
        window.setTimeout(() => (drag.current.moved = false), 60);
        return;
      }
      const root = rootRef.current;
      root?.removeAttribute("data-dragging");
      root?.style.setProperty("--drag", "0px");
      const v = d.dx / Math.max(1, performance.now() - d.t0);
      const n = Math.round(-d.dx / stepPx()) || (Math.abs(v) > 0.45 ? -Math.sign(d.dx) : 0);
      go(active + n);
      // o click que segue um arraste é descartado (ver openPoster)
      window.setTimeout(() => (drag.current.moved = false), 60);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
  };
  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (phase !== "closed" || allOpen) return;
    const t = e.target as HTMLElement;
    if (t.closest("button, input")) return;
    const map: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1, PageDown: 5, PageUp: -5 };
    if (e.key in map) {
      e.preventDefault();
      go(active + map[e.key]);
    } else if (e.key === "Home") {
      e.preventDefault();
      go(0);
    } else if (e.key === "End") {
      e.preventDefault();
      go(list.length - 1);
    } else if ((e.key === "Enter" || e.key === " ") && t.classList.contains("bounty__stage")) {
      e.preventDefault();
      rootRef.current?.querySelector<HTMLAnchorElement>(`.bounty__slot[data-slug="${activeSlug}"] .os-project__link`)?.click();
    }
  };

  const counts = useMemo(() => Object.fromEntries(FILTERS.map((f) => [f, all.filter((p) => matchesFilter(p, f)).length])) as Record<Filter, number>, [all]);
  const style = { "--mood-r": mr, "--mood-g": mg, "--mood-b": mb } as CSSProperties;

  return (
    <div ref={rootRef} className="os-projects bounty" data-phase={phase} data-mobile={mobile ? "1" : "0"} data-filters={filtersOpen ? "1" : "0"} style={style}>
      {/* barra: coleção + filtros compactos */}
      <div className="bounty__bar">
        <p className="bounty__eyebrow">
          {P.collection} · <b className="tnum">{String(total).padStart(2, "0")}</b> {P.missions}
        </p>
        <div id="bounty-filters" className="bounty__filters" role="group" aria-label={P.kind}>
          {FILTERS.map((f) => (
            <button key={f} type="button" className="bounty__pill" aria-pressed={filter === f} onClick={() => pickFilter(f)}>
              {payload.filters[f]}
              <small className="tnum" aria-hidden="true">
                {counts[f]}
              </small>
            </button>
          ))}
        </div>
      </div>

      {/* o mural */}
      <div ref={stageRef} className="bounty__stage" role="region" aria-roledescription="carousel" aria-label={P.wall} tabIndex={0} onWheel={onWheel} onPointerDown={onPointerDown} onKeyDown={onKeyDown}>
        {list.length === 0 ? (
          <p className="t-mono bounty__empty">{P.empty}</p>
        ) : (
          <ul ref={trackRef} className="bounty__track" aria-live="polite">
            {list.map((p, i) => {
              const d = i - active;
              const ad = Math.abs(d);
              const isActive = d === 0;
              return (
                <li
                  key={p.slug}
                  className="bounty__slot os-project"
                  data-slug={p.slug}
                  data-d={d}
                  data-near={ad <= NEAR ? "1" : "0"}
                  data-far={ad > FAR ? "1" : "0"}
                  data-active={isActive ? "1" : "0"}
                  data-lifted={phase !== "closed" && dossierSlug === p.slug ? "1" : "0"}
                  style={{ "--d": d, "--ad": ad } as CSSProperties}
                  aria-hidden={ad > FAR || undefined}
                >
                  <a href={p.href} className="os-project__link bounty__link" draggable={false} aria-current={isActive ? "true" : undefined} tabIndex={ad > FAR ? -1 : 0} onClick={(e) => openPoster(e, p)} onPointerMove={mobile ? undefined : tilt} onPointerLeave={mobile ? undefined : untilt}>
                    <Poster p={p} index={all.indexOf(p)} total={total} s={P} withImage={ad <= FAR + 2} eager={ad <= 1} />
                    <span className="sr-only">
                      {p.title} · {p.type}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        )}
        <div className="bounty__veil" aria-hidden="true" />
      </div>

      {/* pé: posição, fita e acesso direto */}
      <div className="bounty__foot">
        <button type="button" className="bounty__filters-btn" aria-expanded={filtersOpen} aria-controls="bounty-filters" onClick={() => setFiltersOpen((v) => !v)}>
          {payload.filters[filter]} <small className="tnum">{counts[filter]}</small>
        </button>
        <p className="bounty__count" aria-live="polite">
          <b className="tnum">{String(active + 1).padStart(2, "0")}</b> <span aria-hidden="true">/</span> <span className="sr-only">{P.of}</span> <span className="tnum">{String(list.length).padStart(2, "0")}</span>
        </p>
        <div className="bounty__arrows">
          <button type="button" className="bounty__arrow" onClick={() => go(active - 1)} disabled={active <= 0} aria-label={P.prev}>
            ←
          </button>
          <button type="button" className="bounty__arrow" onClick={() => go(active + 1)} disabled={active >= list.length - 1} aria-label={P.next}>
            →
          </button>
        </div>
        <div className="bounty__ticks" role="group" aria-label={P.position}>
          {list.map((p, i) => (
            <button key={p.slug} type="button" className="bounty__tick" aria-current={i === active ? "true" : undefined} aria-label={`${p.n} · ${p.name}`} title={p.name} onClick={() => go(i)} />
          ))}
        </div>
        <span className="bounty__hint t-mono" aria-hidden="true">
          {mobile ? P.swipe : P.hint}
        </span>
        {/* celular: barra de progresso no lugar da fita de traços (CSS esconde no desktop) */}
        <span className="bounty__progress" aria-hidden="true">
          <span style={{ width: `${list.length > 1 ? (active / (list.length - 1)) * 100 : 100}%` }} />
        </span>
        <button type="button" className="bounty__all-btn" aria-expanded={allOpen} onClick={() => setAllOpen(true)}>
          {P.viewAll}
        </button>
      </div>

      {/* ver todos: salto direto a qualquer cartaz */}
      {allOpen && (
        <div className="bounty__all" role="dialog" aria-modal="true" aria-label={P.viewAll}>
          <div className="bounty__all-head">
            <p className="bounty__eyebrow">
              {P.viewAll} · <b className="tnum">{String(list.length).padStart(2, "0")}</b>
            </p>
            <button type="button" className="bounty__all-btn" onClick={() => setAllOpen(false)} autoFocus>
              {payload.s.window.close}
            </button>
          </div>
          <ul className="bounty__all-grid">
            {list.map((p, i) => (
              <li key={p.slug}>
                <button
                  type="button"
                  className="bounty__all-item"
                  aria-current={i === active ? "true" : undefined}
                  onClick={() => {
                    go(i);
                    setAllOpen(false);
                    stageRef.current?.focus({ preventScroll: true });
                  }}
                >
                  <span className="bounty__all-thumb" style={p.mood ? ({ "--mood": p.mood } as CSSProperties) : undefined}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- miniatura pequena, lista aberta sob demanda */}
                    <img src={p.image} alt="" loading="lazy" decoding="async" />
                  </span>
                  <span className="bounty__all-name">
                    <span className="tnum">{p.n}</span> {p.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* dossiê: a folha com o cartaz à esquerda e o case à direita */}
      {phase !== "closed" && dossierProject && (
        <>
          <section className="bounty__dossier" data-os-scroller="projects" data-lenis-prevent="" aria-label={dossierProject.title}>
            <div className="bounty__dossier-side">
              <div ref={slotRef} className="bounty__dossier-slot">{phase === "open" && <Poster p={dossierProject} index={all.indexOf(dossierProject)} total={total} s={P} eager />}</div>
            </div>
            <div className="bounty__case" key={dossierSlug ?? ""}>
              {dossier ?? <div className="bounty__loading" aria-busy="true" />}
            </div>
          </section>
          <button type="button" className="bounty__close t-mono" onClick={closeDossier}>
            <span aria-hidden="true">←</span> {P.backToCollection}
          </button>
          <div ref={flyerRef} className="bounty__flyer" aria-hidden="true" data-visible={phase === "opening" || phase === "closing" ? "1" : "0"}>
            <Poster p={dossierProject} index={all.indexOf(dossierProject)} total={total} s={P} eager />
          </div>
        </>
      )}
    </div>
  );
}

/** Inclinação ao cursor (só mouse): variáveis no cartaz, lidas pelo CSS; um rAF por cartaz. */
let tiltRaf = 0;
function tilt(e: ReactPointerEvent<HTMLAnchorElement>) {
  if (e.pointerType !== "mouse") return;
  const el = e.currentTarget.querySelector<HTMLElement>(".bounty__paper");
  if (!el || tiltRaf) return;
  const r = e.currentTarget.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width - 0.5;
  const py = (e.clientY - r.top) / r.height - 0.5;
  tiltRaf = requestAnimationFrame(() => {
    tiltRaf = 0;
    el.style.setProperty("--rx", `${(-py * 9).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(px * 12).toFixed(2)}deg`);
    el.style.setProperty("--px", px.toFixed(3));
    el.style.setProperty("--py", py.toFixed(3));
  });
}
function untilt(e: ReactPointerEvent<HTMLAnchorElement>) {
  const el = e.currentTarget.querySelector<HTMLElement>(".bounty__paper");
  if (!el) return;
  if (tiltRaf) cancelAnimationFrame(tiltRaf);
  tiltRaf = 0;
  for (const v of ["--rx", "--ry", "--px", "--py"]) el.style.removeProperty(v);
}
