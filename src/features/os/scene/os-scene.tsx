"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { onIdle } from "@/animations/idle";
import { getQuality, probeGpu } from "@/lib/quality";
import { useOs, useOsStore } from "../os-shell";
import { DESKTOP_WIDE_MQ } from "../registry";
import type { OsTheme } from "../theme";
import { COMPOSE, MOOD_OF, OS_SCENE, THEME_OF } from "./scene.config";
import type { Layout, Rect } from "./director";
import type { Engine } from "./engine";

/**
 * O fundo do MilWeb OS — a entidade: um personagem 3D que flutua atrás da
 * interface, olha para o aplicativo destacado e leva a ponta do dedo até o
 * ícone que o visitante ativa. A cena é Three.js (scene/engine.ts, carregado
 * em idle num pedaço próprio, com o GLB); este componente é a cola com a
 * interface.
 *
 * Camada visual pura, ATRÁS da interface: `pointer-events: none`,
 * aria-hidden, z-index negativo dentro da área de trabalho; nada aqui mexe
 * em layout, nos apps, no lema ou na dock. O HTML entrega a imagem estática
 * do personagem em repouso (fundo CSS, posicionada por `--en-x/--en-y/--en-k`),
 * então o primeiro quadro já é o certo, e quem tem movimento reduzido, WebGL 2
 * ausente, GPU por software ou falha ao carregar o modelo fica com ela — a
 * navegação é a mesma.
 *
 * O personagem OBSERVA a navegação: os ouvintes aqui são passivos e em fase
 * de captura, os handlers dos apps são os de sempre e abrem na hora. A mão
 * mira a posição REAL do ícone: a cada quadro em que há alvo, a placa do
 * ícone é medida no DOM (`getBoundingClientRect`) — redimensionar, girar a
 * tela, trocar de idioma ou a flutuação dos ícones já entram na medida.
 *
 * UM laço: o ticker do GSAP (dentro do motor). Troca de tema: o cenário é o
 * driver do store (`setThemeDriver`) — a luz nova atravessa a tela a partir
 * do controle e a interface adota o tema no meio (`commitTheme`). Sem driver
 * (imagem, janela maximizada, tela aberta no telefone, aba oculta): troca
 * imediata.
 */
const clamp1 = (v: number) => Math.max(-1, Math.min(1, v));
/** Controles que abrem um app: grade/coluna do desktop, grade do telefone, itens da dock. */
const APP_SEL = ".os-icon-btn, .os-launch, .os-dock__item[data-dock-id]";
const idOf = (el: Element) => el.id.replace(/^os-(icon|launch|dock)-/, "");

/** Composição a partir da área do fundo e do palco (`.os-stage`, irmão do fundo), em px CSS relativos ao fundo. */
function measure(root: HTMLElement, mobile: boolean): Layout | null {
  const box = root.getBoundingClientRect();
  if (box.width === 0 || box.height === 0) return null;
  const w = box.width;
  const h = box.height;
  if (mobile) {
    const stage = root.parentElement?.querySelector<HTMLElement>(".os-stage");
    const s = stage?.getBoundingClientRect();
    const C = COMPOSE.mobile;
    const sh = s && s.height > 0 ? s.height : h * 0.55;
    const cx = s && s.width > 0 ? s.left + s.width / 2 - box.left : w / 2;
    const cy = s && s.height > 0 ? s.top + s.height / 2 - box.top : h * 0.36;
    return { w, h, k: Math.min(C.kS * sh, C.kW * w), home: { x: cx, y: cy + C.homeDy * sh }, present: null, bounds: { x0: C.bounds.x0 * w, x1: C.bounds.x1 * w, y0: C.bounds.y0 * h, y1: C.bounds.y1 * h } };
  }
  const C = window.matchMedia(DESKTOP_WIDE_MQ).matches ? COMPOSE.desktop : COMPOSE.tablet;
  return {
    w,
    h,
    k: Math.min(C.kH * h, C.kW * w),
    home: { x: C.home.x * w, y: C.home.y * h },
    present: { x: C.present.x * w, y: C.present.y * h, z: C.present.z },
    bounds: { x0: C.bounds.x0 * w, x1: C.bounds.x1 * w, y0: C.bounds.y0 * h, y1: C.bounds.y1 * h },
  };
}

export function OsScene() {
  const { store } = useOs();
  const shell = useOsStore((s) => s.shell);
  const motion = useOsStore((s) => s.prefs.motion);
  const ref = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layoutRef = useRef<Layout | null>(null);
  const engineRef = useRef<Engine | null>(null);

  // Composição: medida na área e no palco e publicada em variáveis CSS (posiciona a imagem estática) — a cena lê a mesma.
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || shell === "auto" || shell === "simple") return;
    const mobile = shell === "mobile";
    const apply = () => {
      const l = measure(root, mobile);
      if (!l) return;
      layoutRef.current = l;
      root.style.setProperty("--en-x", `${l.home.x.toFixed(1)}px`);
      root.style.setProperty("--en-y", `${l.home.y.toFixed(1)}px`);
      root.style.setProperty("--en-k", `${l.k.toFixed(1)}px`);
      engineRef.current?.setLayout(l);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(root);
    const stage = root.parentElement?.querySelector(".os-stage");
    if (stage) ro.observe(stage);
    const wide = window.matchMedia(DESKTOP_WIDE_MQ);
    wide.addEventListener("change", apply);
    return () => {
      ro.disconnect();
      wide.removeEventListener("change", apply);
      layoutRef.current = null;
      ["--en-x", "--en-y", "--en-k"].forEach((k) => root.style.removeProperty(k));
    };
  }, [shell]);

  useEffect(() => {
    const root = ref.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    if (shell === "auto" || shell === "simple" || motion === "reduce") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!getQuality().webgl) return;

    const mobile = shell === "mobile";
    let disposed = false;
    let cleanup: (() => void) | null = null;
    const cancelIdle = onIdle(() => void boot(), 900);

    async function boot() {
      if (disposed || !root || !canvas) return;
      const gq = probeGpu();
      if (!gq.webgl) return;
      const lite = mobile || gq.tier !== "high";
      const { createEngine } = await import("./engine");
      if (disposed) return;

      // ---- alvos: o elemento REAL de cada app (o que foi destacado/ativado por último) ----
      const els = new Map<string, Element>();
      const lookup = (id: string): Element | null => {
        const known = els.get(id);
        if (known?.isConnected && known.getClientRects().length > 0) return known;
        for (const prefix of ["os-icon-", "os-launch-", "os-dock-"]) {
          const el = document.getElementById(prefix + id);
          if (el && el.getClientRects().length > 0) return el;
        }
        return null;
      };
      /** Placa do ícone (não o item com o rótulo), em px CSS relativos ao canvas. */
      const resolve = (id: string): Rect | null => {
        const el = lookup(id);
        if (!el) return null;
        const b = (el.querySelector(".os-icon, .os-micon") ?? el).getBoundingClientRect();
        if (b.width === 0 || b.height === 0) return null;
        const box = canvas.getBoundingClientRect();
        return { left: b.left - box.left, top: b.top - box.top, right: b.right - box.left, bottom: b.bottom - box.top, blocked: blockedOf(id, el, b) };
      };
      /**
       * Há outro app na mesma fileira entre este e o repouso do personagem? (grade 2 × 3 do desktop: a
       * primeira coluna.) Medido uma vez por app e por composição — refeito quando o layout muda.
       */
      const blocked = new Map<string, boolean>();
      let blockedFor: unknown = null;
      const blockedOf = (id: string, el: Element, b: DOMRect): boolean => {
        const l = layoutRef.current;
        if (blockedFor !== l) {
          blocked.clear();
          blockedFor = l;
        }
        const known = blocked.get(id);
        if (known !== undefined) return known;
        const box = canvas.getBoundingClientRect();
        const home = (l?.home.x ?? box.width / 2) + box.left;
        const cx = b.left + b.width / 2;
        let hit = false;
        const group = el.closest("nav");
        group?.querySelectorAll(APP_SEL).forEach((other) => {
          if (hit || other === el) return;
          const o = (other.querySelector(".os-icon, .os-micon") ?? other).getBoundingClientRect();
          if (o.width === 0) return;
          const ox = o.left + o.width / 2;
          const sameRow = Math.min(o.bottom, b.bottom) - Math.max(o.top, b.top) > 0.5 * b.height;
          if (sameRow && (ox - cx) * (home - cx) > 0 && Math.abs(ox - cx) < Math.abs(home - cx)) hit = true;
        });
        blocked.set(id, hit);
        return hit;
      };
      const touchTimers = new Map<Element, number>();
      /** A ponta do dedo encostou: o ícone responde (anel na cor do tema — styles/os.css › [data-touch]). */
      const onTouch = (id: string) => {
        const el = lookup(id);
        if (!el) return;
        window.clearTimeout(touchTimers.get(el));
        el.setAttribute("data-touch", "1");
        touchTimers.set(el, window.setTimeout(() => {
          el.removeAttribute("data-touch");
          touchTimers.delete(el);
        }, 420));
      };

      const e = createEngine({ canvas, mood: MOOD_OF[store.getState().prefs.theme], lite, resolve, onTouch });
      if (!e) return;
      const B = OS_SCENE.budget;
      const l0 = layoutRef.current ?? measure(root, mobile);
      if (l0) e.setLayout(l0);
      e.setDpr(Math.min(window.devicePixelRatio || 1, mobile ? B.mobileMaxDpr : lite ? B.liteMaxDpr : B.maxDpr));

      // O modelo (GLB) e a compilação dos programas: até terminar — ou se falhar — vale a imagem estática.
      const ok = await e.load();
      if (disposed || !ok) {
        e.dispose();
        return;
      }
      engineRef.current = e;
      if (layoutRef.current) e.setLayout(layoutRef.current);
      // custo real de um quadro nesta GPU → resolução (e teto de quadros) antes de o canvas entrar em cena
      // com `?quality=` forçado numa GPU por software (testes) a resolução pode descer bem mais: a página não pode travar
      const forced = gq.reason.startsWith("forçado");
      const costMs = e.calibrate(forced ? 0.25 : B.minDpr);
      // GPU sem condição (dezenas de ms por quadro já na resolução mínima): melhor a imagem do que um personagem aos trancos.
      // `?quality=` forçado (testes) passa por cima.
      if (costMs > B.giveUpMs && !forced) {
        engineRef.current = null;
        e.dispose();
        return;
      }
      const D = e.director!;

      const covered = () => {
        const s = store.getState();
        return s.shell === "mobile" ? s.focused !== null : s.order.some((id) => s.wins[id].open && !s.wins[id].min && s.wins[id].max);
      };
      /** Há janela aberta à vista (desktop/tablet): o personagem se recolhe para o lado. */
      const windowed = () => {
        const s = store.getState();
        return s.shell !== "mobile" && s.order.some((id) => s.wins[id].open && !s.wins[id].min);
      };
      const mark = () => {
        root.dataset.mood = e.mood;
        const tr = e.trans;
        if (tr) root.dataset.trans = `${tr.from}>${tr.to}`;
        else delete root.dataset.trans;
      };
      // Quadros só com o fundo à vista (ou durante uma troca de tema, que sempre termina). No telefone,
      // abrir um app cobre a tela: o laço para depois da animação de abertura (o toque aparece por trás dela).
      let stopTimer = 0;
      // `data-run` no fundo diz se o laço está rodando (diagnóstico e testes; nenhum CSS depende dele).
      const syncRun = () => {
        window.clearTimeout(stopTimer);
        if (document.hidden) {
          D.release();
          e.stop();
          root.dataset.run = "0";
          return;
        }
        const want = !!e.trans || !covered();
        if (want) {
          e.start();
          root.dataset.run = "1";
        } else
          stopTimer = window.setTimeout(() => {
            if (e.trans || !covered()) return;
            // coberto no meio de um gesto: o gesto é largado — ao reaparecer, o personagem só volta ao repouso
            D.release();
            e.stop();
            root.dataset.run = "0";
          }, mobile ? 700 : 0);
      };
      const centerOf = (el: Element): [number, number] => {
        const box = canvas.getBoundingClientRect();
        const b = el.getBoundingClientRect();
        return [b.left + b.width / 2 - box.left, b.top + b.height / 2 - box.top];
      };
      const toggleOrigin = (): [number, number] => {
        const btn = [...document.querySelectorAll<HTMLElement>(".os-dock__theme, .os-mdock__theme")].find((b) => b.getClientRects().length > 0 && b.getBoundingClientRect().width > 0);
        if (btn) return centerOf(btn);
        return [canvas.clientWidth / 2, canvas.clientHeight];
      };

      // ---- quadro: commit do tema no meio da troca, marcas no DOM ----
      let lastTrans = "";
      let lastPhase = "";
      let painted = 0;
      let target: { x: number; y: number } | null = null;
      let lastMove = -1e9;
      e.onFrame((eng) => {
        const tr = eng.trans;
        if (tr) {
          const st = store.getState();
          const pend = st.themePending;
          const at = OS_SCENE.commitAt;
          if (pend !== null && ((tr.dir > 0 && tr.p >= at && pend === THEME_OF[tr.to]) || (tr.dir < 0 && tr.p <= at && pend === THEME_OF[tr.from]))) st.commitTheme();
        }
        const key = tr ? `${tr.from}>${tr.to}` : eng.mood;
        if (key !== lastTrans) {
          lastTrans = key;
          mark();
          syncRun();
        }
        const ph = D.debug.phase;
        if (ph !== lastPhase) {
          lastPhase = ph;
          root.dataset.phase = ph;
        }
        if (target && performance.now() - lastMove > OS_SCENE.parallax.idle * 1000) {
          target = null;
          eng.pointer(null);
        }
        // o canvas entra depois de dois quadros desenhados (o primeiro ainda compila variantes no driver)
        if (painted < 3 && ++painted === 3) {
          root.dataset.state = "live";
          // ao entrar em cena o personagem se apresenta (surge, gira, faz a reverência) — só com a área livre
          if (!windowed() && !covered()) D.intro();
        }
      });

      // ---- driver da troca de tema ----
      const driveTheme = (to: OsTheme) => {
        if (disposed || document.hidden || covered()) return false;
        const handled = e.transition(MOOD_OF[to], toggleOrigin());
        if (handled) {
          mark();
          syncRun();
        }
        return handled;
      };

      const unsub = store.subscribe((s, prev) => {
        syncRun();
        D.setPresenting(windowed());
        // tema aplicado sem troca animada (sem driver): a cena acompanha
        if (!e.trans && s.prefs.theme !== prev.prefs.theme && MOOD_OF[s.prefs.theme] !== e.mood) {
          e.setMood(MOOD_OF[s.prefs.theme]);
          mark();
        }
      });
      const finishNow = () => {
        const st = store.getState();
        if (st.themePending !== null) st.commitTheme();
        e.finish(MOOD_OF[store.getState().prefs.theme]);
        mark();
      };
      // aba oculta: a troca termina na hora e o laço para; ao voltar, ele retoma
      const onVis = () => {
        if (document.hidden && e.trans) finishNow();
        syncRun();
      };

      // ---- ponteiro (desktop, ponteiro fino): a cabeça acompanha de longe e a câmera anda um pouco ----
      const onMove = (ev: PointerEvent) => {
        if (ev.pointerType !== "mouse") return;
        target = { x: clamp1((ev.clientX / window.innerWidth) * 2 - 1), y: -clamp1((ev.clientY / window.innerHeight) * 2 - 1) };
        lastMove = performance.now();
        e.pointer(target);
      };
      const onLeave = () => {
        target = null;
        e.pointer(null);
      };

      // ---- app destacado (ponteiro ou foco) e app ativado (clique, toque, Enter) ----
      let hovered: Element | null = null;
      const setHover = (el: Element | null) => {
        if (el === hovered) return;
        hovered = el;
        if (el) {
          const id = idOf(el);
          els.set(id, el);
          D.attend(id);
        } else D.attend(null);
        syncRun();
      };
      const appOf = (ev: Event) => (ev.target as Element | null)?.closest?.(APP_SEL) ?? null;
      // Mouse: destaque enquanto o ponteiro está sobre o app. Toque não tem hover: o gesto começa ao encostar o
      // dedo (antes do clique) e o destaque acaba ao soltar. Foco: só o do teclado (`:focus-visible`) — o foco
      // devolvido ao ícone quando uma janela fecha não deixa o personagem apontando para ele.
      const onOver = (ev: PointerEvent) => {
        if (ev.pointerType === "mouse") setHover(appOf(ev));
      };
      const onOut = (ev: PointerEvent) => {
        if (ev.pointerType !== "mouse") return;
        const to = ev.relatedTarget as Element | null;
        if (hovered && (!to || !hovered.contains(to))) setHover(to?.closest?.(APP_SEL) ?? null);
      };
      const onDown = (ev: PointerEvent) => {
        if (ev.pointerType !== "mouse") setHover(appOf(ev));
      };
      const onUp = (ev: PointerEvent) => {
        if (ev.pointerType !== "mouse") setHover(null);
      };
      const onFocus = (ev: FocusEvent) => {
        const el = appOf(ev);
        if (el?.matches(":focus-visible")) setHover(el);
      };
      const onBlur = (ev: FocusEvent) => {
        if (hovered && hovered === appOf(ev)) setHover(null);
      };
      const onClick = (ev: MouseEvent) => {
        const el = (ev.target as Element | null)?.closest?.(APP_SEL);
        if (!el) return;
        const id = idOf(el);
        els.set(id, el);
        D.activate(id);
        syncRun();
      };

      store.getState().setThemeDriver(driveTheme);
      D.setPresenting(windowed());
      document.addEventListener("visibilitychange", onVis);
      if (gq.fine && !mobile) {
        window.addEventListener("pointermove", onMove, { passive: true });
        document.documentElement.addEventListener("pointerleave", onLeave);
      }
      document.addEventListener("pointerover", onOver, { passive: true });
      document.addEventListener("pointerout", onOut, { passive: true });
      document.addEventListener("pointerdown", onDown, { capture: true, passive: true });
      document.addEventListener("pointerup", onUp, { capture: true, passive: true });
      document.addEventListener("pointercancel", onUp, { capture: true, passive: true });
      document.addEventListener("focusin", onFocus);
      document.addEventListener("focusout", onBlur);
      document.addEventListener("click", onClick, { capture: true, passive: true });
      mark();
      syncRun();

      // Leitura do estado da cena: em desenvolvimento sempre; em produção só com ?scene-debug (medições — scripts/entity-check.mjs).
      const expose = process.env.NODE_ENV !== "production" || new URLSearchParams(window.location.search).has("scene-debug");
      if (expose) {
        (window as unknown as { __mwOsScene?: unknown }).__mwOsScene = {
          get mood() {
            return e.mood;
          },
          get trans() {
            return e.trans;
          },
          get frames() {
            return e.frames;
          },
          get dpr() {
            return e.dpr;
          },
          get fps() {
            return e.fpsNow;
          },
          get stats() {
            return { ...e.stats, tris: e.entity?.tris ?? 0, costMs };
          },
          /** Estado da coreografia: fase, alvo, mão, ponta do dedo × contato (px), erro. */
          get entity() {
            const d = D.debug;
            return { phase: d.phase, target: d.target, side: d.side, ik: d.ik, short: d.short, tip: d.tip && { ...d.tip }, goal: d.goal && { ...d.goal }, err: d.err, seq: { ...d.seq }, touches: d.touches, body: { ...d.body }, joints: { ...d.joints } };
          },
          resetJoints: () => D.resetJoints(),
          /** Repete a apresentação (gravações e testes). */
          intro: () => D.intro(),
          get layout() {
            return layoutRef.current;
          },
        };
      }

      cleanup = () => {
        window.clearTimeout(stopTimer);
        touchTimers.forEach((id, el) => {
          window.clearTimeout(id);
          el.removeAttribute("data-touch");
        });
        unsub();
        const st = store.getState();
        st.setThemeDriver(null);
        // Um tema pedido e ainda não aplicado não fica pendurado quando o fundo sai de cena.
        if (st.themePending !== null) st.commitTheme();
        document.removeEventListener("visibilitychange", onVis);
        window.removeEventListener("pointermove", onMove);
        document.documentElement.removeEventListener("pointerleave", onLeave);
        document.removeEventListener("pointerover", onOver);
        document.removeEventListener("pointerout", onOut);
        document.removeEventListener("pointerdown", onDown, { capture: true });
        document.removeEventListener("pointerup", onUp, { capture: true });
        document.removeEventListener("pointercancel", onUp, { capture: true });
        document.removeEventListener("focusin", onFocus);
        document.removeEventListener("focusout", onBlur);
        document.removeEventListener("click", onClick, { capture: true });
        root.dataset.state = "still";
        delete root.dataset.trans;
        delete root.dataset.mood;
        delete root.dataset.run;
        delete root.dataset.phase;
        e.dispose();
        engineRef.current = null;
        if (expose) delete (window as unknown as { __mwOsScene?: unknown }).__mwOsScene;
      };
    }

    return () => {
      disposed = true;
      cancelIdle();
      cleanup?.();
      cleanup = null;
    };
  }, [shell, motion, store]);

  return (
    <div ref={ref} className="os-wallpaper os-scene" data-state="still" aria-hidden="true" data-no-inspect>
      {/* O personagem em repouso, como imagem: fundo CSS (styles/os.css) — só a do tema em vigor é baixada. */}
      <div className="os-scene__still" />
      {/*
        Um canvas novo a cada vez que o motor é montado (a chave são as dependências do efeito): ao sair, o motor
        força a perda do contexto WebGL para devolver a memória da GPU na hora, e um canvas guarda o seu contexto
        para sempre — reaproveitado, o motor seguinte nascia num contexto morto e o personagem só voltava
        recarregando a página (Ajustes › Reduzir movimento → Seguir o sistema).
      */}
      <canvas key={`${shell}:${motion}`} ref={canvasRef} className="os-scene__canvas" />
      {/* Áreas de leitura calmas: véu suave atrás da coluna de apps e do lema (telefone: status e grade). */}
      <div className="os-scene__calm" />
    </div>
  );
}
