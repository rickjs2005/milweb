"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { APP_IDS, APPS, MOBILE_SHELL_MQ, parentRoute, parseRoute, type AppId } from "./registry";
import type { Rect } from "./store";
import { useOs, useOsStore } from "./os-shell";
import { AppContent } from "./apps/app-content";
import { ProjectRemote } from "./apps/project-remote";
import { Glyph } from "./icons";
import { leaveToHome, readMark } from "./mobile/history";

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
 * Telefone (mesmo DOM, CSS diferente): a janela em foco ocupa a tela toda;
 * a barra vira cabeçalho com Voltar (nível anterior — na raiz do app, a
 * tela inicial, mantendo o app aberto) e Fechar (encerra o app); nada de
 * arrasto. Abre crescendo a partir do ícone que a chamou e fecha
 * encolhendo de volta para ele; o histórico volta à home sem entradas
 * repetidas (mobile/history.ts) e o foco de teclado retorna ao ícone.
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

/** Telefone: escreve na tela o retângulo de onde ela cresce / para onde encolhe (o ícone). */
function aimAt(el: HTMLElement, r: Rect | null) {
  const vw = window.innerWidth || 1;
  const vh = window.innerHeight || 1;
  const o = r ?? { x: vw * 0.5 - 32, y: vh * 0.5 - 32, w: 64, h: 64 };
  el.style.setProperty("--ox", `${Math.round(o.x)}px`);
  el.style.setProperty("--oy", `${Math.round(o.y)}px`);
  el.style.setProperty("--sx", String(Math.max(0.04, o.w / vw)));
  el.style.setProperty("--sy", String(Math.max(0.04, o.h / vh)));
}

/** Retângulo atual da placa do ícone que abriu a tela (telefone), se ele estiver visível. */
function iconRect(openedBy: string | null): Rect | null {
  if (!openedBy) return null;
  const el = document.getElementById(openedBy);
  if (!el) return null;
  const r = (el.querySelector<HTMLElement>(".os-micon, .os-icon") ?? el).getBoundingClientRect();
  if (!r.width || !r.height) return null;
  return { x: r.left, y: r.top, w: r.width, h: r.height };
}

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
  /** Telefone: a tela perdeu o foco (Voltar) mas ainda está encolhendo para o ícone. */
  const [leaving, setLeaving] = useState(false);
  const wasFocused = useRef(focused);

  const mobile = shell === "mobile";
  const isRouteApp = route.app === id;
  const shownRoute = isRouteApp ? internal : win.route;
  const info = shownRoute ? parseRoute(shownRoute) : null;
  const title = s.apps[id];
  const active = mobile ? focused : win.open && !win.min;
  // O que a janela mostra: a rota atual (conteúdo do servidor) quando ela é a dona;
  // o case pelo JSON quando guarda um case mas outra janela tem o foco; senão a raiz do app.
  const projectOf = (slug: string) => payload.projects.find((p) => p.slug === slug) ?? payload.authorial.find((p) => p.slug === slug);
  const remoteProject = !isRouteApp && !mobile && info?.kind === "project" && info.detail ? projectOf(info.detail) : undefined;
  const showsDetail = (isRouteApp && !!routeContent && info?.kind !== "root") || !!remoteProject;
  const detailTitle = showsDetail && info?.detail ? (info.kind === "project" ? projectOf(info.detail)?.name : payload.services.items.find((x) => x.slug === info.detail)?.label) : null;
  // Telefone: o Voltar diz para onde vai — a tela inicial na raiz do app, o próprio app dentro de um case/página.
  const backLabel = !info || info.kind === "root" ? s.mobile.home : title;

  // Entrada: do ícone (telefone, quando sabemos de onde veio) ou um leve zoom (desktop).
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (win.origin && window.matchMedia(MOBILE_SHELL_MQ).matches) {
      aimAt(el, win.origin);
      setAnim("icon");
    } else {
      setAnim("in");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só na montagem
  }, []);

  // Telefone: reabrir pelo ícone cresce do ícone de novo; sair para a home (Voltar) encolhe até ele.
  useLayoutEffect(() => {
    const was = wasFocused.current;
    wasFocused.current = focused;
    const el = ref.current;
    if (!el || !mobile || was === focused) return;
    if (focused) {
      setLeaving(false);
      if (win.origin && anim === null) {
        aimAt(el, win.origin);
        setAnim("icon");
      }
    } else if (win.open && !closing.current) {
      aimAt(el, iconRect(win.openedBy));
      setLeaving(true);
      setAnim("out");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reage só à troca de foco
  }, [focused, mobile]);

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

  // Fechar: saída curta e só então a janela deixa o store; o foco de teclado volta ao controle que a
  // abriu. No telefone a URL volta à home pelo histórico (sem entradas repetidas); sem marca, um replace.
  // Sem movimento (sistema ou Ajustes) a saída é imediata.
  const finishClose = useCallback(() => {
    closing.current = false;
    const st = store.getState();
    const w = st.wins[id];
    if (!w.open) return;
    if (st.shell === "mobile") {
      st.close(id, { source: "route" });
      leaveToHome(id, () => navigate("/", "replace", true));
    } else st.close(id);
    if (w.openedBy) document.getElementById(w.openedBy)?.focus({ preventScroll: true });
  }, [id, store, navigate]);

  /** Fim da saída: fechar de verdade, ou só esconder a tela que foi para a home (telefone). */
  const afterOut = useCallback(() => {
    if (closing.current) finishClose();
    else {
      setLeaving(false);
      setAnim(null);
      const w = store.getState().wins[id];
      if (w.openedBy) document.getElementById(w.openedBy)?.focus({ preventScroll: true });
    }
  }, [finishClose, id, store]);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    const el = ref.current;
    if (el && store.getState().shell === "mobile") aimAt(el, iconRect(store.getState().wins[id].openedBy));
    setAnim("out");
  }, [id, store]);

  useEffect(() => {
    if (anim !== "out") return;
    const el = ref.current;
    if (!el || getComputedStyle(el).animationName === "none") {
      afterOut();
      return;
    }
    // Rede de segurança: uma aba em segundo plano pode nunca disparar animationend.
    const t = window.setTimeout(afterOut, 600);
    return () => window.clearTimeout(t);
  }, [anim, afterOut]);

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
  // campos, da busca, de <details> aberto ou de outra janela. No telefone, Esc é Voltar (abaixo).
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
    // Para onde a janela encolhe e quem recebe o foco: o item da dock (tablet) ou, no desktop largo, onde a dock
    // só tem os controles do sistema, o ícone do app na grade.
    const shown = (t: HTMLElement | null) => (t && t.getClientRects().length > 0 ? t : null);
    const dock = shown(document.querySelector<HTMLElement>(`[data-dock-id="${id}"]`)) ?? shown(document.getElementById(`os-icon-${id}`));
    if (el && dock) {
      const a = el.getBoundingClientRect();
      const b = dock.getBoundingClientRect();
      el.style.setProperty("--mx", `${b.left + b.width / 2 - (a.left + a.width / 2)}px`);
      el.style.setProperty("--my", `${b.top + b.height / 2 - (a.top + a.height / 2)}px`);
    }
    store.getState().minimize(id);
    dock?.focus();
  }, [id, store]);

  // Voltar (telefone): o nível anterior. Se ele é mesmo a entrada anterior do histórico, volta por ela
  // (nada de empilhar o pai de novo); senão navega. App sem URL própria: Voltar fecha.
  const back = useCallback(() => {
    const parent = parentRoute(shownRoute ?? "/");
    if (store.getState().shell === "mobile") {
      if (APPS[id].route === null) {
        close();
        return;
      }
      const mark = readMark();
      if (mark.prev === parent && mark.depth > 0) {
        window.history.back();
        return;
      }
    }
    navigate(parent, "push", true);
  }, [navigate, shownRoute, store, id, close]);

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
      data-screen={focused || leaving ? "1" : "0"}
      data-anim={anim ?? undefined}
      inert={win.min ? true : undefined}
      aria-hidden={win.min || undefined}
      style={style}
      onPointerDownCapture={(e) => {
        // Fechar ou minimizar uma janela de trás não precisa trazê-la para frente antes:
        // focar aqui e fechar no clique seriam duas navegações no mesmo gesto.
        if ((e.target as HTMLElement).closest('[data-action="close"], [data-action="min"], .os-window__close')) return;
        if (!focused && !win.min && !leaving) store.getState().focus(id, { source: "user", mode: "push" });
      }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      onAnimationEnd={(e) => {
        if (e.target !== ref.current) return;
        if (anim === "out") afterOut();
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
        <button type="button" className="os-window__back" onClick={back} aria-label={`${s.mobile.back} · ${backLabel}`}>
          <Glyph name="back" size={14} />
          <span>{backLabel}</span>
        </button>
        <h2 id={`os-window-title-${id}`} className="os-window__title t-mono" tabIndex={mobile ? -1 : 0} title={mobile ? undefined : s.window.keys}>
          <span className="os-window__app">{title}</span>
          {showsDetail && detailTitle && <span className="os-window__detail"> / {detailTitle}</span>}
        </h2>
        <button type="button" className="os-window__close" onClick={close} aria-label={`${s.window.close} · ${title}`}>
          <Glyph name="close" size={14} />
        </button>
        <span className="os-window__serial tnum" aria-hidden="true">
          MW/OS
        </span>
      </header>
      <div ref={bodyRef} id={`os-${id}`} className="os-window__body" data-os-scroller={id} data-lenis-prevent="" onScroll={onScroll}>
        {id === "projects" ? (
          // Projetos: o mural fica montado sempre; o case (rota ou JSON) entra como dossiê por cima dele.
          <AppContent
            id={id}
            active={active}
            slug={info?.kind === "project" ? info.detail : null}
            dossier={isRouteApp && routeContent && info?.kind === "project" ? routeContent : remoteProject ? <ProjectRemote slug={remoteProject.slug} locale={payload.locale} name={remoteProject.name} href={remoteProject.href} openLabel={s.projects.open} /> : null}
          />
        ) : isRouteApp && routeContent && info?.kind !== "root" ? (
          routeContent
        ) : (
          <AppContent id={id} active={active} />
        )}
      </div>
      <div className="os-window__resize" data-no-inspect aria-hidden="true">
        <span data-dir="e" onPointerDown={(e) => begin(e, "e")} />
        <span data-dir="s" onPointerDown={(e) => begin(e, "s")} />
        <span data-dir="se" onPointerDown={(e) => begin(e, "se")} />
      </div>
    </section>
  );
}
