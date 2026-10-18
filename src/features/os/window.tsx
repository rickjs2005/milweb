"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { APP_IDS, APPS, parentRoute, parseRoute, type AppId } from "./registry";
import { useOs, useOsStore } from "./os-shell";
import { AppContent } from "./apps/app-content";
import { ProjectRemote } from "./apps/project-remote";
import { Glyph } from "./icons";

/**
 * Janelas do MilWeb OS.
 *
 * Desktop: flutuante, arrasto pela barra de título (Pointer Events +
 * setPointerCapture, escrita direta nas variáveis CSS durante o gesto e
 * commit no store ao soltar), três alças de redimensionamento, luzes
 * fechar/minimizar/maximizar à la macOS (vermelho, amarelo, verde; símbolo
 * ao pairar, ao focar e sempre no toque), teclado na barra de título (setas
 * movem, Shift + setas redimensionam, Enter maximiza) e Esc fechando a
 * janela em primeiro plano esteja o foco onde estiver (fora de campos, da
 * busca e de outras janelas).
 *
 * Celular (mesmo DOM, CSS diferente): a janela em foco ocupa a área útil;
 * a barra vira cabeçalho com Voltar, Início (mantém o app aberto, como no
 * telefone) e Fechar (encerra o app); nada de arrasto.
 *
 * Fechar sai com uma animação curta e só então deixa o store; minimizar não
 * desmonta: `inert` + invisível, geometria preservada; maximizar/restaurar
 * interpola a geometria apenas durante o gesto.
 */

const KEY_STEP = 24;

export function WindowsLayer({ children }: { children: ReactNode }) {
  const { store, payload, route } = useOs();
  const order = useOsStore((s) => s.order);
  const ref = useRef<HTMLDivElement>(null);

  // A área útil é medida, não suposta: tudo que a janela sabe sobre limites vem daqui.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => store.getState().setArea(el.clientWidth, el.clientHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [store]);

  const ids = APP_IDS.filter((id) => order.includes(id));

  return (
    <div ref={ref} className="os-windows" role="group" aria-label={payload.s.regions.windows}>
      {ids.map((id) => (
        <Window key={id} id={id} z={order.indexOf(id)} routeContent={route.app === id ? children : null} />
      ))}
    </div>
  );
}

type Drag = { mode: "move" | "e" | "s" | "se"; px: number; py: number; x: number; y: number; w: number; h: number; cur: { x: number; y: number; w: number; h: number }; raf: number };

function Window({ id, z, routeContent }: { id: AppId; z: number; routeContent: ReactNode }) {
  const { store, payload, internal, route, navigate } = useOs();
  const s = payload.s;
  const win = useOsStore((st) => st.wins[id]);
  const focused = useOsStore((st) => st.focused === id);
  const shell = useOsStore((st) => st.shell);
  const pending = useOsStore((st) => st.pendingFocus === id);
  const ref = useRef<HTMLElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);
  const lastDown = useRef({ t: 0, x: 0, y: 0 });
  const [anim, setAnim] = useState<"icon" | "in" | "out" | null>(null);
  const closing = useRef(false);

  const mobile = shell === "mobile";
  const isRouteApp = route.app === id;
  const shownRoute = isRouteApp ? internal : win.route;
  const info = shownRoute ? parseRoute(shownRoute) : null;
  const title = s.apps[id];
  const active = mobile ? focused : win.open && !win.min;
  // O que a janela mostra: a rota atual (conteúdo do servidor) quando ela é a dona;
  // o case pelo JSON quando guarda um case mas outra janela tem o foco; senão a raiz do app.
  const remoteProject = !isRouteApp && !mobile && info?.kind === "project" ? payload.projects.find((p) => p.slug === info.detail) : undefined;
  const showsDetail = (isRouteApp && !!routeContent && info?.kind !== "root") || !!remoteProject;
  const detailTitle = showsDetail && info?.detail ? (info.kind === "project" ? payload.projects.find((p) => p.slug === info.detail)?.name : payload.services.items.find((x) => x.slug === info.detail)?.label) : null;

  // Entrada: do ícone (celular, quando sabemos de onde veio) ou um leve zoom (desktop).
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (win.origin && window.matchMedia("(max-width: 719px), ((max-height: 499px) and (max-width: 1079px))").matches) {
      const vw = window.innerWidth || 1;
      const vh = window.innerHeight || 1;
      el.style.setProperty("--ox", `${win.origin.x}px`);
      el.style.setProperty("--oy", `${win.origin.y}px`);
      el.style.setProperty("--sx", String(Math.max(0.04, win.origin.w / vw)));
      el.style.setProperty("--sy", String(Math.max(0.04, win.origin.h / vh)));
      setAnim("icon");
    } else {
      setAnim("in");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só na montagem
  }, []);

  // Foco de teclado quando o visitante abriu a janela (não em carregamento/rota).
  useEffect(() => {
    if (!pending || !ref.current) return;
    ref.current.focus({ preventScroll: true });
    store.getState().clearPendingFocus();
  }, [pending, store]);

  // Voltar da raiz do app para onde o visitante estava.
  useLayoutEffect(() => {
    if (showsDetail || !bodyRef.current) return;
    bodyRef.current.scrollTop = store.getState().wins[id].scroll;
  }, [showsDetail, id, store]);

  const onScroll = useCallback(() => {
    if (showsDetail || !bodyRef.current) return;
    store.getState().setScroll(id, bodyRef.current.scrollTop);
  }, [id, showsDetail, store]);

  // Fechar: saída curta (escala 1 → .96 e some) e só então a janela deixa o store; o foco de
  // teclado volta ao controle que a abriu. Sem movimento (sistema ou Ajustes) a saída é imediata.
  const finishClose = useCallback(() => {
    closing.current = false;
    const w = store.getState().wins[id];
    if (!w.open) return;
    store.getState().close(id);
    if (w.openedBy) document.getElementById(w.openedBy)?.focus();
  }, [id, store]);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    setAnim("out");
  }, []);

  useEffect(() => {
    if (anim !== "out") return;
    const el = ref.current;
    if (!el || getComputedStyle(el).animationName === "none") {
      finishClose();
      return;
    }
    // Rede de segurança: uma aba em segundo plano pode nunca disparar animationend.
    const t = window.setTimeout(finishClose, 600);
    return () => window.clearTimeout(t);
  }, [anim, finishClose]);

  // Maximizar/restaurar interpola a geometria só durante o gesto (mover por teclado e o
  // recálculo ao redimensionar o navegador continuam instantâneos).
  const zoom = useCallback(() => {
    const el = ref.current;
    if (el) {
      el.dataset.zooming = "1";
      window.setTimeout(() => delete el.dataset.zooming, 380);
    }
    store.getState().toggleMax(id);
  }, [id, store]);

  // Esc fecha a janela em primeiro plano esteja o foco onde estiver (desktop) — menos dentro de
  // campos, da busca, de <details> aberto ou de outra janela. No celular, Esc é Voltar (abaixo).
  useEffect(() => {
    if (!focused || mobile) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [contenteditable=true], dialog[open], details[open] summary")) return;
      if (document.querySelector("dialog[open]")) return;
      const other = t?.closest<HTMLElement>(".os-window");
      if (other && other.dataset.app !== id) return;
      e.preventDefault();
      close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [focused, mobile, id, close]);

  const minimize = useCallback(() => {
    const el = ref.current;
    const dock = document.querySelector<HTMLElement>(`[data-dock-id="${id}"]`);
    if (el && dock) {
      const a = el.getBoundingClientRect();
      const b = dock.getBoundingClientRect();
      el.style.setProperty("--mx", `${b.left + b.width / 2 - (a.left + a.width / 2)}px`);
      el.style.setProperty("--my", `${b.top + b.height / 2 - (a.top + a.height / 2)}px`);
    }
    store.getState().minimize(id);
    dock?.focus();
  }, [id, store]);

  const back = useCallback(() => navigate(parentRoute(shownRoute ?? "/"), "push", true), [navigate, shownRoute]);
  const home = useCallback(() => navigate("/", "push", true), [navigate]);

  // ---- arraste e redimensionamento (desktop) ----
  const begin = (e: ReactPointerEvent, mode: Drag["mode"]) => {
    if (mobile || win.max || e.button !== 0) return;
    const el = ref.current;
    if (!el) return;
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    const r = win.rect;
    dragRef.current = { mode, px: e.clientX, py: e.clientY, x: r.x, y: r.y, w: r.w, h: r.h, cur: { ...r }, raf: 0 };
    el.dataset.dragging = mode;
    if (!focused) store.getState().focus(id, { source: "user", mode: "push" });
  };
  const onBarPointerDown = (e: ReactPointerEvent) => {
    if ((e.target as HTMLElement).closest("button, a, input, [data-no-drag]")) return;
    // Duplo clique/toque na barra maximiza ou restaura. Detectado aqui, no pointerdown: a captura do
    // ponteiro do arraste redireciona pointerup e click para a janela, e o dblclick da barra nunca chega.
    const prev = lastDown.current;
    lastDown.current = { t: e.timeStamp, x: e.clientX, y: e.clientY };
    if (!mobile && e.button === 0 && e.timeStamp - prev.t < 400 && Math.abs(e.clientX - prev.x) < 6 && Math.abs(e.clientY - prev.y) < 6) {
      lastDown.current.t = 0;
      e.preventDefault();
      zoom();
      return;
    }
    begin(e, "move");
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    const d = dragRef.current;
    const el = ref.current;
    if (!d || !el) return;
    const { area } = store.getState();
    const min = APPS[id].min;
    const dx = e.clientX - d.px;
    const dy = e.clientY - d.py;
    if (d.mode === "move") {
      d.cur.x = Math.max(0, Math.min(d.x + dx, area.w - d.w));
      d.cur.y = Math.max(0, Math.min(d.y + dy, area.h - d.h));
    } else {
      if (d.mode !== "s") d.cur.w = Math.max(min.w, Math.min(d.w + dx, area.w - d.x));
      if (d.mode !== "e") d.cur.h = Math.max(min.h, Math.min(d.h + dy, area.h - d.y));
    }
    if (d.raf) return;
    d.raf = requestAnimationFrame(() => {
      d.raf = 0;
      el.style.setProperty("--x", `${Math.round(d.cur.x)}px`);
      el.style.setProperty("--y", `${Math.round(d.cur.y)}px`);
      el.style.setProperty("--w", `${Math.round(d.cur.w)}px`);
      el.style.setProperty("--h", `${Math.round(d.cur.h)}px`);
    });
  };
  const onPointerUp = (e: ReactPointerEvent) => {
    const d = dragRef.current;
    const el = ref.current;
    if (!d || !el) return;
    dragRef.current = null;
    delete el.dataset.dragging;
    if (d.raf) cancelAnimationFrame(d.raf);
    try {
      el.releasePointerCapture(e.pointerId);
    } catch {}
    // Só um clique na barra (nada se moveu) não vira geometria "escolhida pelo visitante".
    if (d.cur.x === d.x && d.cur.y === d.y && d.cur.w === d.w && d.cur.h === d.h) return;
    if (d.mode === "move") store.getState().move(id, d.cur.x, d.cur.y);
    else store.getState().resize(id, d.cur.w, d.cur.h);
  };

  // ---- teclado ----
  const onKeyDown = (e: ReactKeyboardEvent) => {
    const t = e.target as HTMLElement;
    if (e.key === "Escape") {
      if (!mobile || t.closest("input, textarea, select, [contenteditable=true], details[open] summary")) return;
      e.preventDefault();
      back();
      return;
    }
    if (!t.classList.contains("os-window__title") || mobile) return;
    const arrows: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const v = arrows[e.key];
    if (v) {
      e.preventDefault();
      if (win.max) return;
      const r = store.getState().wins[id].rect;
      if (e.shiftKey) store.getState().resize(id, r.w + v[0] * KEY_STEP, r.h + v[1] * KEY_STEP);
      else store.getState().move(id, r.x + v[0] * KEY_STEP, r.y + v[1] * KEY_STEP);
    } else if (e.key === "Enter") {
      e.preventDefault();
      zoom();
    }
  };

  const style = { "--x": `${win.rect.x}px`, "--y": `${win.rect.y}px`, "--w": `${win.rect.w}px`, "--h": `${win.rect.h}px`, zIndex: 10 + z } as CSSProperties;

  return (
    <section
      ref={ref}
      id={`os-window-${id}`}
      className="os-window"
      role="region"
      aria-labelledby={`os-window-title-${id}`}
      tabIndex={-1}
      data-app={id}
      data-focused={focused ? "1" : "0"}
      data-min={win.min ? "1" : "0"}
      data-max={win.max ? "1" : "0"}
      data-screen={focused ? "1" : "0"}
      data-anim={anim ?? undefined}
      inert={win.min ? true : undefined}
      aria-hidden={win.min || undefined}
      style={style}
      onPointerDownCapture={(e) => {
        // Fechar ou minimizar uma janela de trás não precisa trazê-la para frente antes:
        // focar aqui e fechar no clique seriam duas navegações no mesmo gesto.
        if ((e.target as HTMLElement).closest('[data-action="close"], [data-action="min"], .os-window__close')) return;
        if (!focused && !win.min) store.getState().focus(id, { source: "user", mode: "push" });
      }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      onAnimationEnd={(e) => {
        if (e.target !== ref.current) return;
        if (anim === "out") finishClose();
        else setAnim(null);
      }}
    >
      <header className="os-window__bar" data-no-inspect onPointerDown={onBarPointerDown}>
        <div className="os-window__controls" role="group" aria-label={title}>
          <button type="button" className="os-window__btn" data-action="close" title={s.window.close} aria-label={`${s.window.close} · ${title}`} onClick={close}>
            <Glyph name="close" size={8} />
          </button>
          <button type="button" className="os-window__btn" data-action="min" title={s.window.minimize} aria-label={`${s.window.minimize} · ${title}`} onClick={minimize}>
            <Glyph name="min" size={8} />
          </button>
          <button type="button" className="os-window__btn" data-action="max" title={win.max ? s.window.restore : s.window.maximize} aria-label={`${win.max ? s.window.restore : s.window.maximize} · ${title}`} aria-pressed={win.max} onClick={zoom}>
            <Glyph name={win.max ? "restore" : "max"} size={8} />
          </button>
        </div>
        <button type="button" className="os-window__back" onClick={back}>
          <Glyph name="back" size={14} />
          <span>{s.mobile.back}</span>
        </button>
        <h2 id={`os-window-title-${id}`} className="os-window__title t-mono" tabIndex={mobile ? -1 : 0} title={mobile ? undefined : s.window.keys}>
          <span className="os-window__app">{title}</span>
          {showsDetail && detailTitle && <span className="os-window__detail"> / {detailTitle}</span>}
        </h2>
        <button type="button" className="os-window__home" onClick={home} aria-label={s.mobile.home}>
          <Glyph name="home" size={14} />
        </button>
        <button type="button" className="os-window__close" onClick={close} aria-label={`${s.window.close} · ${title}`}>
          <Glyph name="close" size={14} />
        </button>
        <span className="os-window__serial tnum" aria-hidden="true">
          MW/OS
        </span>
      </header>
      <div ref={bodyRef} id={`os-${id}`} className="os-window__body" data-os-scroller={id} data-lenis-prevent="" onScroll={onScroll}>
        {isRouteApp && routeContent && info?.kind !== "root" ? routeContent : remoteProject ? <ProjectRemote slug={remoteProject.slug} locale={payload.locale} name={remoteProject.name} href={remoteProject.href} openLabel={s.projects.open} /> : <AppContent id={id} active={active} />}
      </div>
      <div className="os-window__resize" data-no-inspect aria-hidden="true">
        <span data-dir="e" onPointerDown={(e) => begin(e, "e")} />
        <span data-dir="s" onPointerDown={(e) => begin(e, "s")} />
        <span data-dir="se" onPointerDown={(e) => begin(e, "se")} />
      </div>
    </section>
  );
}
