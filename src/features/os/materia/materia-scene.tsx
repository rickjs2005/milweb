"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { onIdle } from "@/animations/idle";
import { getQuality, probeGpu } from "@/lib/quality";
import { useOs, useOsStore } from "../os-shell";
import { DESKTOP_WIDE_MQ } from "../registry";
import type { OsTheme } from "../theme";
import { COMPOSE, MATERIA, MATERIA_STILL, MOOD_OF, THEME_OF, type Mood } from "./config";
import type { Engine, Layout } from "./engine";
import { guide, stage, useGuide } from "./guide-store";

/**
 * O fundo do MilWeb OS — Matéria: um busto de prata líquida, feito de moléculas, suspenso atrás da
 * interface. Três coisas acontecem aqui e o visitante consegue repetir todas:
 *
 *   dobrar o tempo        o gesto ao lado do rosto separa dois perfis no tempo (engine › pull)
 *   ver o pensamento      a conversa aberta reorganiza as mesmas moléculas num cérebro
 *   atravessar o portfólio a capa do projeto recomendado aparece refletida na prata (engine › tint)
 *   ver através do rosto   a cabeça vira de perfil, o arco da nuca desliza para a frente e a matéria se abre
 *                          num recorte: a interface desenha ali dentro a ideia para o site do visitante
 *                          (guide-panel.tsx › MateriaPortal), e na de mergulho a faixa de luz vira o mar
 *
 * Camada visual pura, ATRÁS da interface: `pointer-events: none`, aria-hidden. O HTML entrega a
 * imagem estática da própria escultura (fundo CSS, posicionada por `--ma-x/--ma-y/--ma-k`): o
 * primeiro quadro já é o certo, e quem tem movimento reduzido, WebGL ausente, GPU sem condição ou
 * falha ao baixar as moléculas fica com ela — busto em repouso, cérebro na conversa. A navegação e a
 * conversa nunca dependem do motor.
 *
 * UM laço: o ticker do GSAP (dentro do motor). A cena também é o driver da troca de tema do store.
 */
const clamp1 = (v: number) => Math.max(-1, Math.min(1, v));

/** Composição a partir da área do fundo e do palco (`.os-stage`), em px CSS relativos ao fundo. */
function measure(root: HTMLElement, mobile: boolean): Layout | null {
  const box = root.getBoundingClientRect();
  if (box.width === 0 || box.height === 0) return null;
  const w = box.width;
  const h = box.height;
  if (mobile) {
    const s = root.parentElement?.querySelector<HTMLElement>(".os-stage")?.getBoundingClientRect();
    const C = COMPOSE.mobile;
    const sh = s && s.height > 0 ? s.height : h * 0.5;
    const cx = s && s.width > 0 ? s.left + s.width / 2 - box.left : w / 2;
    const cy = s && s.height > 0 ? s.top + s.height / 2 - box.top : h * 0.34;
    const k = Math.min(C.kS * sh, C.kW * w);
    const home = { x: cx, y: cy + C.homeDy * sh };
    const bottom = s && s.height > 0 ? s.bottom - box.top : h * 0.62;
    return { w, h, k, home, talk: { x: w / 2, y: C.talk.y * h, k: (C.talk.kW * w) / k }, floor: (bottom - 6 - home.y) / k };
  }
  const C = window.matchMedia(DESKTOP_WIDE_MQ).matches ? COMPOSE.desktop : COMPOSE.tablet;
  const k = Math.min(C.kH * h, C.kW * w);
  return { w, h, k, home: { x: C.home.x * w, y: C.home.y * h }, talk: { x: C.talk.x * w, y: C.talk.y * h, k: C.talk.k } };
}

export function MateriaScene() {
  const { store, payload } = useOs();
  const shell = useOsStore((s) => s.shell);
  const motion = useOsStore((s) => s.prefs.motion);
  const talking = useGuide((s) => s.open);
  const ref = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layoutRef = useRef<Layout | null>(null);
  const engineRef = useRef<Engine | null>(null);

  // Composição: medida e publicada em variáveis CSS — a imagem estática e os controles sobre a figura leem as mesmas.
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || shell === "auto" || shell === "simple") return;
    const host = root.parentElement;
    const mobile = shell === "mobile";
    const apply = () => {
      const l = measure(root, mobile);
      if (!l) return;
      layoutRef.current = l;
      for (const el of [root, host]) {
        el?.style.setProperty("--ma-x", `${l.home.x.toFixed(1)}px`);
        el?.style.setProperty("--ma-y", `${l.home.y.toFixed(1)}px`);
        el?.style.setProperty("--ma-k", `${l.k.toFixed(1)}px`);
        el?.style.setProperty("--ma-tx", `${l.talk.x.toFixed(1)}px`);
        el?.style.setProperty("--ma-ty", `${l.talk.y.toFixed(1)}px`);
        el?.style.setProperty("--ma-tk", `${(l.k * l.talk.k).toFixed(1)}px`);
      }
      const box = root.getBoundingClientRect();
      const stageBox = mobile ? host?.querySelector(".os-stage")?.getBoundingClientRect() : null;
      host?.style.setProperty("--ma-vx", `${(box.left + l.home.x).toFixed(1)}px`);
      host?.style.setProperty("--ma-vy", `${(box.top + l.home.y).toFixed(1)}px`);
      host?.style.setProperty("--ma-py", `${(stageBox && stageBox.height > 0 ? stageBox.bottom - 60 : Math.min(box.top + l.home.y + 1.02 * l.k, box.bottom - 150)).toFixed(1)}px`);
      engineRef.current?.setLayout(l);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(root);
    const st = host?.querySelector(".os-stage");
    if (st) ro.observe(st);
    const wide = window.matchMedia(DESKTOP_WIDE_MQ);
    wide.addEventListener("change", apply);
    return () => {
      ro.disconnect();
      wide.removeEventListener("change", apply);
      layoutRef.current = null;
      for (const el of [root, host]) ["--ma-x", "--ma-y", "--ma-k", "--ma-tx", "--ma-ty", "--ma-tk", "--ma-vx", "--ma-vy", "--ma-py"].forEach((k) => el?.style.removeProperty(k));
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
    const abort = new AbortController();
    const cancelIdle = onIdle(() => void boot(), 900);

    async function boot() {
      if (disposed || !root || !canvas) return;
      const gq = probeGpu();
      if (!gq.webgl) return;
      const lite = mobile || gq.tier !== "high";
      const [{ createEngine }, { loadMolecules }] = await Promise.all([import("./engine"), import("./asset")]);
      // As moléculas: até chegarem — ou se falharem — vale a imagem estática.
      const molecules = await loadMolecules(gq.tier === "high", abort.signal).catch((err: unknown) => {
        if (!disposed) console.warn("[milweb] Matéria indisponível:", err instanceof Error ? err.message : err);
        return null;
      });
      if (disposed || !molecules) return;
      const e = createEngine({ canvas, mood: MOOD_OF[store.getState().prefs.theme], lite, molecules });
      if (!e) return;
      const B = MATERIA.budget;
      const l0 = layoutRef.current ?? measure(root, mobile);
      if (l0) e.setLayout(l0);
      e.setDpr(Math.min(window.devicePixelRatio || 1, mobile ? B.mobileMaxDpr : lite ? B.liteMaxDpr : B.maxDpr));
      await e.compile().catch(() => undefined);
      if (disposed) {
        e.dispose();
        return;
      }
      // custo real de um quadro nesta GPU → resolução, com o canvas ainda fora de cena
      const forced = gq.reason.startsWith("forçado");
      const costMs = e.calibrate(forced ? 0.3 : B.minDpr);
      if (costMs > B.giveUpMs && !forced) {
        e.dispose();
        return;
      }
      engineRef.current = e;
      if (layoutRef.current) e.setLayout(layoutRef.current);

      // Com o recorte aberto as janelas saem de cena (styles/materia.css › data-os-portal): nada cobre a figura.
      const covered = () => {
        if (guide.get().portal) return false;
        const s = store.getState();
        return s.shell === "mobile" ? s.focused !== null : s.order.some((id) => s.wins[id].open && !s.wins[id].min && s.wins[id].max);
      };
      const mark = () => {
        root.dataset.mood = e.mood;
        const tr = e.trans;
        if (tr) root.dataset.trans = `${tr.from}>${tr.to}`;
        else delete root.dataset.trans;
      };
      let stopTimer = 0;
      const syncRun = () => {
        window.clearTimeout(stopTimer);
        if (document.hidden) {
          e.stop();
          root.dataset.run = "0";
          return;
        }
        if (e.trans || !covered()) {
          e.start();
          root.dataset.run = "1";
        } else
          stopTimer = window.setTimeout(() => {
            if (e.trans || !covered()) return;
            e.stop();
            root.dataset.run = "0";
          }, mobile ? 700 : 0);
      };
      const toggleOrigin = (): [number, number] => {
        const box = canvas.getBoundingClientRect();
        const btn = [...document.querySelectorAll<HTMLElement>(".os-dock__theme, .os-mdock__theme")].find((b) => b.getBoundingClientRect().width > 0);
        if (!btn) return [canvas.clientWidth / 2, canvas.clientHeight];
        const b = btn.getBoundingClientRect();
        return [b.left + b.width / 2 - box.left, b.top + b.height / 2 - box.top];
      };

      // ---- a conversa e as janelas mandam nos alvos do motor ----
      const images = new Map<string, HTMLImageElement>();
      let tinted: string | null = null;
      const imageOf = (slug: string) => [...payload.projects, ...payload.authorial].find((p) => p.slug === slug)?.image ?? null;
      const reflect = (slug: string | null) => {
        if (slug === tinted) return;
        tinted = slug;
        if (!slug) return e.tint(null);
        const src = imageOf(slug);
        if (!src) return e.tint(null);
        const ready = images.get(slug);
        if (ready?.complete && ready.naturalWidth > 0) return e.tint(ready);
        const img = ready ?? new Image();
        img.decoding = "async";
        img.onload = () => {
          if (!disposed && tinted === slug) e.tint(img);
        };
        if (!ready) {
          images.set(slug, img);
          img.src = src;
        }
      };
      let wasOpen = guide.get().open;
      const syncTargets = () => {
        const g = guide.get();
        const s = store.getState();
        const route = s.focused === "projects" ? s.wins.projects.route : null;
        const caseSlug = route?.startsWith("/work/") ? route.slice(6) : null;
        // O recorte acontece no busto: enquanto ele está aberto, a conversa não segura a pose do cérebro.
        const talk = g.open && !g.portal;
        e.set({
          talk,
          listen: talk ? (g.phase === "listening" ? 1 : g.phase === "thinking" ? 0.45 : 0) : 0,
          speak: talk && g.phase === "speaking" ? 1 : 0,
          // Orçamento: a cena se aquieta para a pessoa escrever. Perfil: a matéria se alinha em linhas.
          calm: g.portal ? 0 : s.focused === "contact" ? 1 : s.focused ? 0.35 : 0,
          align: s.focused === "profile" && !g.open ? 1 : 0,
          portal: !!g.portal,
          sea: g.portal === "dive" ? 1 : 0,
          // com a folha da conversa à vista, o recorte acontece onde o cérebro estava; recolhida, no lugar de repouso
          place: g.portal && g.open && !g.min ? 1 : 0,
        });
        if (g.portal) e.pull(null);
        reflect(g.reflect ?? caseSlug);
        if (g.open && !wasOpen) e.slit();
        wasOpen = g.open;
        root.dataset.pose = talk ? "brain" : "bust";
        if (g.portal) root.dataset.portal = g.portal;
        else delete root.dataset.portal;
        syncRun();
      };

      // ---- quadro: commit do tema no meio da troca, marcas no DOM ----
      let lastTrans = "";
      let painted = 0;
      let cutOpen = false;
      e.onFrame((eng) => {
        const tr = eng.trans;
        if (tr) {
          const st = store.getState();
          const pend = st.themePending;
          const at = MATERIA.commitAt;
          if (pend !== null && ((tr.dir > 0 && tr.p >= at && pend === THEME_OF[tr.to]) || (tr.dir < 0 && tr.p <= at && pend === THEME_OF[tr.from]))) st.commitTheme();
        }
        const key = tr ? `${tr.from}>${tr.to}` : eng.mood;
        if (key !== lastTrans) {
          lastTrans = key;
          mark();
          syncRun();
        }
        // o canvas entra depois de dois quadros desenhados (o primeiro ainda compila variantes no driver)
        if (painted < 3 && ++painted === 3) root.dataset.state = "live";
        // O recorte, quadro a quadro, para quem desenha a ideia dentro dele: centro e raios em px da janela.
        const f = eng.figure;
        if (f.open > 0.001 || cutOpen) {
          cutOpen = f.open > 0.001;
          const box = canvas.getBoundingClientRect();
          const P = MATERIA.portal;
          stage.cut?.(cutOpen ? { x: box.left + f.x + P.c[0] * f.k, y: box.top + f.y - P.c[1] * f.k, rx: P.r[0] * P.inset * f.k, ry: P.r[1] * P.inset * f.k, open: f.open } : null);
        }
      });

      const driveTheme = (to: OsTheme) => {
        if (disposed || document.hidden || covered()) return false;
        const handled = e.transition(MOOD_OF[to], toggleOrigin());
        if (handled) {
          mark();
          syncRun();
        }
        return handled;
      };
      const unsubOs = store.subscribe((s, prev) => {
        syncTargets();
        if (!e.trans && s.prefs.theme !== prev.prefs.theme && MOOD_OF[s.prefs.theme] !== e.mood) {
          e.setMood(MOOD_OF[s.prefs.theme]);
          mark();
        }
      });
      const unsubGuide = guide.subscribe(syncTargets);
      const onVis = () => {
        if (document.hidden && e.trans) {
          const st = store.getState();
          if (st.themePending !== null) st.commitTheme();
          e.finish(MOOD_OF[store.getState().prefs.theme]);
          mark();
        }
        syncRun();
      };

      // ---- dobrar o tempo: o ponteiro ao lado do rosto (desktop) ou um arraste curto sobre a figura (telefone) ----
      const head = () => {
        const l = layoutRef.current;
        const box = canvas.getBoundingClientRect();
        return l ? { x: box.left + l.home.x, y: box.top + l.home.y, k: l.k } : null;
      };
      const onMove = (ev: PointerEvent) => {
        if (ev.pointerType !== "mouse") return;
        const hd = head();
        const over = (ev.target as Element | null)?.closest?.(".os-window, .os-materia-panel, .os-dock, .os-topbar");
        if (!hd || over || guide.get().open || guide.get().portal) return e.pull(null);
        const dx = (ev.clientX - hd.x) / hd.k;
        const dy = (ev.clientY - (hd.y + 0.1 * hd.k)) / hd.k;
        if (Math.hypot(dx, dy) > MATERIA.fold.zone) return e.pull(null);
        e.pull({ x: clamp1(dx / 1.05), y: clamp1(dy / 1.2) });
      };
      const onLeave = () => e.pull(null);
      stage.pull = (p) => {
        if (!guide.get().open && !guide.get().portal) e.pull(p);
      };
      stage.live = () => !disposed && root.dataset.state === "live" && !document.hidden && !covered();
      stage.ready = () => !disposed && root.dataset.state === "live" && !document.hidden;
      stage.anchor = () => {
        const l = layoutRef.current;
        const box = canvas.getBoundingClientRect();
        if (!l) return null;
        const open = guide.get().open;
        return { x: box.left + (open ? l.talk.x : l.home.x), y: box.top + (open ? l.talk.y : l.home.y), k: open ? l.k * l.talk.k : l.k };
      };

      store.getState().setThemeDriver(driveTheme);
      document.addEventListener("visibilitychange", onVis);
      if (gq.fine && !mobile) {
        window.addEventListener("pointermove", onMove, { passive: true });
        document.documentElement.addEventListener("pointerleave", onLeave);
      }
      mark();
      syncTargets();

      // Leitura do estado da cena: em desenvolvimento sempre; em produção só com ?scene-debug (scripts/materia-check.mjs).
      const expose = process.env.NODE_ENV !== "production" || new URLSearchParams(window.location.search).has("scene-debug");
      if (expose) {
        (window as unknown as { __mwMateria?: unknown }).__mwMateria = {
          get state() {
            return { ...e.debug, mood: e.mood, frames: e.frames, dpr: e.dpr, fps: e.fpsNow, count: e.count, ms: e.stats.ms, costMs, layout: layoutRef.current };
          },
          pull: (p: { x: number; y: number } | null) => e.pull(p),
          /** Imagem estática da própria escultura (scripts/materia-still.mjs): WebP com fundo transparente. */
          async still(mood: Mood, morph: number) {
            const S = MATERIA_STILL;
            const c = document.createElement("canvas");
            const still = createEngine({ canvas: c, mood, lite: false, molecules, still: true });
            if (!still) return null;
            still.setLayout({ w: S.w, h: S.h, k: S.k, home: { x: S.cx, y: S.cy }, talk: { x: S.cx, y: S.cy, k: 1 } });
            still.setDpr(1);
            await still.compile();
            still.still(mood, morph);
            const url = c.toDataURL("image/webp", 0.86);
            still.dispose();
            return url;
          },
        };
      }

      cleanup = () => {
        window.clearTimeout(stopTimer);
        unsubOs();
        unsubGuide();
        stage.pull = null;
        stage.live = () => false;
        stage.ready = () => false;
        stage.anchor = () => null;
        stage.cut?.(null);
        // sem motor não há recorte: a ideia preparada continua a um toque, na conversa
        if (guide.get().portal) guide.set({ portal: null });
        const st = store.getState();
        st.setThemeDriver(null);
        if (st.themePending !== null) st.commitTheme();
        document.removeEventListener("visibilitychange", onVis);
        window.removeEventListener("pointermove", onMove);
        document.documentElement.removeEventListener("pointerleave", onLeave);
        root.dataset.state = "still";
        delete root.dataset.trans;
        delete root.dataset.mood;
        delete root.dataset.run;
        delete root.dataset.portal;
        e.dispose();
        engineRef.current = null;
        if (expose) delete (window as unknown as { __mwMateria?: unknown }).__mwMateria;
      };
    }

    return () => {
      disposed = true;
      abort.abort();
      cancelIdle();
      cleanup?.();
      cleanup = null;
    };
  }, [shell, motion, store, payload]);

  return (
    <div ref={ref} className="os-wallpaper os-scene os-materia" data-state="still" data-pose={talking ? "brain" : "bust"} aria-hidden="true" data-no-inspect>
      {/* A escultura como imagem (fundo CSS, styles/materia.css): busto em repouso, cérebro na conversa — só a do tema em vigor é baixada. */}
      <div className="os-scene__still" />
      {/* Um canvas novo a cada montagem do motor: ao sair ele força a perda do contexto WebGL, e um canvas guarda o seu para sempre. */}
      <canvas key={`${shell}:${motion}`} ref={canvasRef} className="os-scene__canvas" />
      <div className="os-scene__calm" />
    </div>
  );
}
