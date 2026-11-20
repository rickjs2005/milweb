"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { onIdle } from "@/animations/idle";
import { getQuality, probeGpu } from "@/lib/quality";
import { useOs, useOsStore } from "../os-shell";
import { DESKTOP_WIDE_MQ } from "../registry";
import type { OsTheme } from "../theme";
import { COMPOSE, HERO_STILL, MATERIA, MATERIA_STILL, MOOD_OF, THEME_OF, type Mood } from "./config";
import type { Engine, Layout } from "./engine";
import { guide, stage, useGuide } from "./guide-store";

/**
 * O fundo do MilWeb OS — Matéria: uma figura de mercúrio segurando uma dobra da própria tela entre o polegar
 * e o indicador. A mão está perto de quem olha, o rosto aparece de perfil mais atrás, e por baixo da folha
 * levantada há uma profundidade escura com a capa de um projeto de verdade. O visitante consegue repetir tudo:
 *
 *   puxar a dobra          perto da ponta a mão acompanha o cursor (ou o dedo, numa área só dela); a folha
 *                          encurva, o reflexo do lema desliza e, ao soltar, a tensão corre pelo metal (engine › grab)
 *   explorar o projeto     a abertura cresce até coincidir com a janela do case (engine › reveal)
 *   ver o pensamento       a conversa aberta faz a faixa de luz percorrer o braço até a cabeça; a figura se
 *                          desfaz e as mesmas moléculas se reorganizam num cérebro
 *   ver através do rosto   no recorte ("Ver uma ideia para o meu site") a matéria vira o busto de moléculas, a
 *                          cabeça fica de perfil e a interface desenha a ideia dentro do vão
 *                          (guide-panel.tsx › MateriaPortal); na de mergulho a faixa de luz vira o mar
 *
 * Camada visual pura, ATRÁS da interface: `pointer-events: none`, aria-hidden. O HTML entrega a imagem
 * estática da própria cena, com a dobra aberta (fundo CSS, posicionada por `--mh-x/--mh-y/--mh-k`): o
 * primeiro quadro já é o certo, e quem tem movimento reduzido, WebGL ausente, GPU sem condição ou falha ao
 * baixar a malha e as moléculas fica com ela — a cena em repouso, o cérebro na conversa. A navegação e a
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
    // a home no telefone: a câmera chega perto — os dedos e a dobra em primeiro plano, o perfil atrás
    // (medida pelo palco: no telefone deitado ele é a coluna da direita, e a grade de apps fica com a esquerda)
    const top = s && s.height > 0 ? s.top - box.top : h * 0.1;
    const sw = s && s.width > 0 ? s.width : w;
    const sl = s && s.width > 0 ? s.left - box.left : 0;
    const hero = { x: sl + C.hero.x * sw, y: top + C.hero.y * sh, k: Math.min(C.hero.kS * sh, C.hero.kW * sw) };
    return { w, h, k, home, talk: { x: w / 2, y: C.talk.y * h, k: (C.talk.kW * w) / k }, floor: (bottom - 6 - home.y) / k, hero, heroFloor: bottom - 4 };
  }
  const C = window.matchMedia(DESKTOP_WIDE_MQ).matches ? COMPOSE.desktop : COMPOSE.tablet;
  const k = Math.min(C.kH * h, C.kW * w);
  // a figura da home fica ancorada na borda direita: o ombro sai do quadro em qualquer largura
  const hk = Math.min(C.hero.kH * h, C.hero.kW * w);
  return { w, h, k, home: { x: C.home.x * w, y: C.home.y * h }, talk: { x: C.talk.x * w, y: C.talk.y * h, k: C.talk.k }, hero: { x: w - C.hero.right * hk, y: C.hero.y * h, k: hk } };
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
        el?.style.setProperty("--mh-x", `${l.hero.x.toFixed(1)}px`);
        el?.style.setProperty("--mh-y", `${l.hero.y.toFixed(1)}px`);
        el?.style.setProperty("--mh-k", `${l.hero.k.toFixed(1)}px`);
        if (l.heroFloor !== undefined) el?.style.setProperty("--mh-floor", `${l.heroFloor.toFixed(1)}px`);
        else el?.style.removeProperty("--mh-floor");
      }
      const box = root.getBoundingClientRect();
      const stageBox = mobile ? host?.querySelector(".os-stage")?.getBoundingClientRect() : null;
      host?.style.setProperty("--ma-vx", `${(box.left + l.home.x).toFixed(1)}px`);
      host?.style.setProperty("--ma-vy", `${(box.top + l.home.y).toFixed(1)}px`);
      host?.style.setProperty("--mh-vx", `${(box.left + l.hero.x).toFixed(1)}px`);
      host?.style.setProperty("--mh-vy", `${(box.top + l.hero.y).toFixed(1)}px`);
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
      for (const el of [root, host]) ["--ma-x", "--ma-y", "--ma-k", "--ma-tx", "--ma-ty", "--ma-tk", "--ma-vx", "--ma-vy", "--ma-py", "--mh-x", "--mh-y", "--mh-k", "--mh-vx", "--mh-vy", "--mh-floor"].forEach((k) => el?.style.removeProperty(k));
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
      const [{ createEngine }, { loadMolecules, loadFigure }] = await Promise.all([import("./engine"), import("./asset")]);
      // As moléculas e a malha da figura: até chegarem — ou se falharem — vale a imagem estática.
      const assets = await Promise.all([loadMolecules(gq.tier === "high", abort.signal), loadFigure(!lite, abort.signal)]).catch((err: unknown) => {
        if (!disposed) console.warn("[milweb] Matéria indisponível:", err instanceof Error ? err.message : err);
        return null;
      });
      if (disposed || !assets) return;
      const [molecules, figure] = assets;
      const e = createEngine({ canvas, mood: MOOD_OF[store.getState().prefs.theme], lite, molecules, figure });
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
      // A capa que se vê pela abertura da dobra: o projeto que a conversa recomendou, o case aberto ou o destaque.
      const featured = (payload.projects.find((p) => p.slug === MATERIA.hero.cover) ?? payload.projects.find((p) => p.featured !== null) ?? payload.projects[0])?.slug ?? null;
      let shown: string | null = null;
      let coverImage: HTMLImageElement | null = null;
      const show = (slug: string | null) => {
        const next = slug && imageOf(slug) ? slug : featured;
        if (next === shown || !next) return;
        shown = next;
        const src = imageOf(next);
        if (!src) return;
        const img = images.get(next) ?? new Image();
        const ready = () => {
          if (disposed || shown !== next) return;
          coverImage = img;
          e.cover(img);
        };
        if (img.complete && img.naturalWidth > 0) return ready();
        img.decoding = "async";
        img.addEventListener("load", ready, { once: true });
        if (!images.has(next)) {
          images.set(next, img);
          img.src = src;
        }
      };
      // O lema, para o reflexo invertido na aba: a última palavra em vermelho, o ponto final em azul (canais).
      let wordCanvas: HTMLCanvasElement | null = null;
      const drawWord = () => {
        const motto = payload.s.sign.motto.trim();
        const dot = motto.endsWith(".");
        const text = (dot ? motto.slice(0, -1) : motto).trim().split(/\s+/).pop() ?? "";
        const c = document.createElement("canvas");
        c.width = 1024;
        c.height = 256;
        const g = c.getContext("2d");
        if (!g || !text) return;
        const family = getComputedStyle(root.parentElement?.querySelector(".os-sign__motto") ?? root).fontFamily || "sans-serif";
        g.fillStyle = "#000";
        g.fillRect(0, 0, c.width, c.height);
        let size = 196;
        g.font = `800 ${size}px ${family}`;
        const full = g.measureText(text + (dot ? "." : "")).width;
        if (full > 960) size = Math.floor((size * 960) / full);
        g.font = `800 ${size}px ${family}`;
        const wText = g.measureText(text).width;
        const x0 = (c.width - g.measureText(text + (dot ? "." : "")).width) / 2;
        g.textBaseline = "alphabetic";
        g.fillStyle = "#f00";
        g.fillText(text, x0, 186);
        if (dot) {
          g.fillStyle = "#00f";
          g.fillText(".", x0 + wText, 186);
        }
        wordCanvas = c;
        e.word(c);
      };
      void document.fonts.ready.then(() => !disposed && drawWord());
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
        show(g.reflect ?? caseSlug);
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

      // ---- a dobra: perto da ponta (ou sobre a abertura) a mão acompanha o cursor; no telefone, o arraste da ponta ----
      const overFold = (dx: number, dy: number) => {
        if (dy > 0.02 || dy < -1.6) return false;
        const d = -dy;
        return dx > -0.22 * Math.pow(d, 0.62) * (1 + 0.3 * d) && dx < 0.82 * d + 0.4 * d * d;
      };
      const onMove = (ev: PointerEvent) => {
        if (ev.pointerType !== "mouse") return;
        const l = layoutRef.current;
        const g = guide.get();
        const over = (ev.target as Element | null)?.closest?.(".os-window, .os-materia-panel, .os-dock, .os-topbar, .os-icons, .os-materia-cta, .os-social, .os-sign__line");
        if (!l || over || g.open || g.portal) {
          e.grab(null);
          e.hover(false);
          return;
        }
        const box = canvas.getBoundingClientRect();
        const dx = (ev.clientX - box.left - l.hero.x) / l.hero.k;
        const dy = -(ev.clientY - box.top - l.hero.y) / l.hero.k;
        const near = Math.hypot(dx, dy + 0.1) < MATERIA.hero.zone;
        e.hover(near || overFold(dx, dy));
        e.grab(near ? { x: dx * MATERIA.hero.follow, y: dy * MATERIA.hero.follow } : null);
      };
      const onLeave = () => {
        e.grab(null);
        e.hover(false);
      };
      stage.grab = (d) => {
        const l = layoutRef.current;
        e.grab(d && l ? { x: d.x / l.hero.k, y: -d.y / l.hero.k } : null);
      };
      stage.hold = (on) => e.hover(on);
      let revealing = 0;
      stage.reveal = (r) => {
        window.clearTimeout(revealing);
        if (!r) return e.reveal(null);
        const box = canvas.getBoundingClientRect();
        e.reveal({ x0: r.left - box.left, y0: r.top - box.top, x1: r.left + r.width - box.left, y1: r.top + r.height - box.top });
        // a cena continua viva até a abertura chegar à janela, mesmo que o app já cubra a tela (telefone)
        revealing = window.setTimeout(syncRun, MATERIA.hero.reveal * 1000 + 120);
        e.start();
        root.dataset.run = "1";
      };
      stage.live = () => !disposed && root.dataset.state === "live" && !document.hidden && !covered();
      stage.ready = () => !disposed && root.dataset.state === "live" && !document.hidden;
      stage.anchor = () => {
        const l = layoutRef.current;
        const box = canvas.getBoundingClientRect();
        if (!l) return null;
        const g = guide.get();
        if (g.open) return { x: box.left + l.talk.x, y: box.top + l.talk.y, k: l.k * l.talk.k };
        // na home, o que se solta sai de dentro da abertura da dobra; no recorte, do busto
        if (g.portal) return { x: box.left + l.home.x, y: box.top + l.home.y, k: l.k };
        return { x: box.left + l.hero.x + 0.2 * l.hero.k, y: box.top + l.hero.y + 0.5 * l.hero.k, k: l.hero.k };
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
          grab: (p: { x: number; y: number } | null) => e.grab(p),
          probe: () => e.probe(),
          figure: () => ({ ...e.figure }),
          /**
           * Imagens estáticas da própria cena (scripts/materia-still.mjs). `home`: a home inteira, com a dobra aberta,
           * sobre a página lisa na cor do tema. `brain`: o cérebro sobre transparente.
           */
          async still(mood: Mood, kind: "home" | "brain") {
            const c = document.createElement("canvas");
            const brain = kind === "brain";
            const still = createEngine({ canvas: c, mood, lite: false, molecules, figure, still: true, scene: !brain });
            if (!still) return null;
            const S = MATERIA_STILL;
            const Hs = HERO_STILL;
            if (brain) still.setLayout({ w: S.w, h: S.h, k: S.k, home: { x: S.cx, y: S.cy }, talk: { x: S.cx, y: S.cy, k: 1 }, hero: { x: S.cx, y: S.cy, k: S.k } });
            else still.setLayout({ w: Hs.w, h: Hs.h, k: Hs.k, home: { x: Hs.x, y: Hs.y }, talk: { x: Hs.x, y: Hs.y, k: 1 }, hero: { x: Hs.x, y: Hs.y, k: Hs.k } });
            still.setDpr(1);
            if (!brain) {
              if (coverImage) still.cover(coverImage);
              if (wordCanvas) still.word(wordCanvas);
            }
            await still.compile();
            still.still(mood, brain ? 1 : 0);
            const url = c.toDataURL("image/webp", 0.9);
            still.dispose();
            return url;
          },
        };
      }

      cleanup = () => {
        window.clearTimeout(stopTimer);
        unsubOs();
        unsubGuide();
        stage.grab = null;
        stage.hold = null;
        stage.reveal = null;
        window.clearTimeout(revealing);
        e.grab(null);
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
