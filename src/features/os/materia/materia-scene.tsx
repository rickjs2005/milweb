"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { onIdle } from "@/animations/idle";
import { getQuality, probeGpu } from "@/lib/quality";
import { useOs, useOsStore } from "../os-shell";
import { DESKTOP_WIDE_MQ } from "../registry";
import type { OsTheme } from "../theme";
import type { ActId } from "./acts";
import { COMPOSE, FRAMES, HERO_STILL, MATERIA, MATERIA_STILL, MOOD_OF, THEME_OF, type Mood } from "./config";
import type { Engine, Layout } from "./engine";
import { guide, landOn, stage, useGuide } from "./guide-store";
import { domPassage } from "./passage";
import { SCULPT_OF, loadSculpt, type SculptId } from "./sculpt";

/**
 * O fundo do MilWeb OS — Matéria: uma escultura de mármore num ateliê. Em repouso ela sustenta o peso sobre
 * uma perna, um ombro ainda preso ao bloco bruto, e grãos de prata completam o trecho que falta no punho. Cada
 * destino do sistema tem a sua figura; quando o visitante escolhe um, a pedra se desfaz, os grãos percorrem
 * trajetos curtos e a nova figura se forma, faz o gesto dela e abre a PASSAGEM — o contorno por onde a página
 * de verdade aparece:
 *
 *   Projetos  a Curadora ergue a pele mineral da página      Estúdio   o Gravador puxa a folha da prensa
 *   Perfil    o Arquivista desliza a folha do fólio          Lab       a Inventora gira o giroscópio
 *   Serviços  a Arquiteta abre o compasso                    Orçamento a Mensageira rompe o lacre do envelope
 *
 * A janela do destino já está aberta desde o clique (rota, dados, foco); enquanto o gesto dura ela é recortada
 * pelo contorno que o motor publica quadro a quadro (engine › passage, passage.ts › domPassage), e quando as mãos
 * soltam o contorno segue sozinho até as coordenadas reais dela. Um toque ou uma tecla no meio entregam tudo
 * na hora; uma segunda escolha interrompe a primeira.
 *
 * Camada visual pura, ATRÁS da interface: `pointer-events: none`, aria-hidden. O HTML entrega a imagem estática
 * da própria cena (fundo CSS, posicionada por `--mh-x/--mh-y/--mh-h`): o primeiro quadro já é o certo, e quem tem
 * movimento reduzido, WebGL ausente, GPU sem condição ou falha ao baixar os arquivos fica com ela — e com a
 * página do destino imediatamente. A navegação e a conversa nunca dependem do motor.
 *
 * UM laço: o ticker do GSAP (dentro do motor). A cena também é o driver da troca de tema do store.
 */

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
    // a escultura ocupa o palco (no telefone deitado ele é a coluna da direita, e a grade de apps fica com a esquerda)
    const top = s && s.height > 0 ? s.top - box.top : h * 0.1;
    const sw = s && s.width > 0 ? s.width : w;
    const sl = s && s.width > 0 ? s.left - box.left : 0;
    const hero = { x: sl + C.hero.x * sw, y: top + C.hero.y * sh, h: Math.min(C.hero.h * sh, C.hero.wMax * sw) };
    return { w, h, k, home, talk: { x: w / 2, y: C.talk.y * h, k: (C.talk.kW * w) / k }, floor: (bottom - 6 - home.y) / k, hero, heroFloor: bottom - 4 };
  }
  const C = window.matchMedia(DESKTOP_WIDE_MQ).matches ? COMPOSE.desktop : COMPOSE.tablet;
  const k = Math.min(C.kH * h, C.kW * w);
  return { w, h, k, home: { x: C.home.x * w, y: C.home.y * h }, talk: { x: C.talk.x * w, y: C.talk.y * h, k: C.talk.k }, hero: { x: C.hero.x * w, y: C.hero.y * h, h: Math.min(C.hero.h * h, C.hero.wMax * w) } };
}

export function MateriaScene() {
  const { store, payload } = useOs();
  const shell = useOsStore((s) => s.shell);
  const motion = useOsStore((s) => s.prefs.motion);
  const talking = useGuide((s) => s.open && !s.min);
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
        el?.style.setProperty("--mh-h", `${l.hero.h.toFixed(1)}px`);
        if (l.heroFloor !== undefined) el?.style.setProperty("--mh-floor", `${l.heroFloor.toFixed(1)}px`);
        else el?.style.removeProperty("--mh-floor");
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
      for (const el of [root, host]) ["--ma-x", "--ma-y", "--ma-k", "--ma-tx", "--ma-ty", "--ma-tk", "--ma-vx", "--ma-vy", "--ma-py", "--mh-x", "--mh-y", "--mh-h", "--mh-floor"].forEach((k) => el?.style.removeProperty(k));
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
      // A figura em repouso, os braços e as moléculas: até chegarem — ou se falharem — vale a imagem estática.
      const assets = await Promise.all([loadMolecules(gq.tier === "high", abort.signal), loadFigure(!lite, abort.signal), loadSculpt("rest", lite, abort.signal)]).catch((err: unknown) => {
        if (!disposed) console.warn("[milweb] Matéria indisponível:", err instanceof Error ? err.message : err);
        return null;
      });
      if (disposed || !assets) return;
      const [molecules, figure, rest] = assets;
      const e = createEngine({ canvas, mood: MOOD_OF[store.getState().prefs.theme], lite, molecules, figure, rest });
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

      // ---- as outras figuras chegam sob demanda: a do destino pedido agora, e adiantadas as duas de destaque ----
      const loading = new Map<SculptId, Promise<boolean>>();
      const need = (id: SculptId): Promise<boolean> => {
        if (e.has(id)) return Promise.resolve(true);
        let p = loading.get(id);
        if (!p) {
          p = loadSculpt(id, lite, abort.signal)
            .then((s) => {
              if (disposed) return false;
              e.addSculpt(s);
              return true;
            })
            .catch(() => {
              loading.delete(id);
              return false;
            });
          loading.set(id, p);
        }
        return p;
      };
      // As duas figuras de destaque vêm adiantadas, com a página já parada — menos para quem pediu economia de dados ou
      // está numa rede lenta: aí cada figura só é baixada quando o destino é apontado, tocado ou pedido.
      const net = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
      const thrifty = !!net && (net.saveData === true || /(^|-)2g$|^3g$/.test(net.effectiveType ?? ""));
      const warm = onIdle(() => {
        if (disposed || thrifty) return;
        void need("projects").then(() => !disposed && need("profile"));
      }, 2400);
      stage.warm = (app) => {
        const id = SCULPT_OF[app];
        if (id) void need(id);
      };

      const html = document.documentElement;
      // Com o recorte aberto as janelas saem de cena (styles/materia.css › data-os-portal): nada cobre a figura.
      const covered = () => {
        if (guide.get().portal || html.dataset.osArriving) return false;
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

      // ---- os destinos: a figura de cada um faz o gesto e a página aparece pela passagem ----
      let arriving: ActId | null = null;
      let arrivingEl: HTMLElement | null = null;
      let arrivingFocus: string | null = null;
      let arrivalTimer = 0;
      const clearClip = (el: HTMLElement | null) => {
        if (!el) return;
        delete el.dataset.arriving;
        el.style.removeProperty("--mp-tf");
        el.style.removeProperty("--mp-clip");
      };
      /** O destino está entregue: a janela inteira, no lugar, com o foco no que foi pedido. */
      const settleArrival = () => {
        window.clearTimeout(arrivalTimer);
        window.removeEventListener("pointerdown", hurry, true);
        window.removeEventListener("keydown", hurry, true);
        if (!arriving) return;
        const el = arrivingEl;
        const focus = arrivingFocus;
        arriving = null;
        arrivingEl = null;
        arrivingFocus = null;
        // a janela já está no lugar: tirar o recorte não pode virar um deslize (a transição de `transform` dela fica fora por um quadro)
        if (el) {
          el.style.transition = "none";
          requestAnimationFrame(() => el.style.removeProperty("transition"));
        }
        clearClip(el);
        delete html.dataset.osArriving;
        if (focus && el) landOn(el, focus);
        syncRun();
      };
      /** O visitante não quer esperar o gesto (um toque, uma tecla): o destino aparece na hora. */
      const hurry = (ev: Event) => {
        if (ev instanceof KeyboardEvent && ["Shift", "Control", "Alt", "Meta"].includes(ev.key)) return;
        e.settle();
        settleArrival();
      };
      const rectOf = (win: HTMLElement) => {
        const box = canvas.getBoundingClientRect();
        const layer = win.offsetParent?.getBoundingClientRect();
        const x0 = (layer?.left ?? 0) + win.offsetLeft - box.left;
        const y0 = (layer?.top ?? 0) + win.offsetTop - box.top;
        return { x0, y0, x1: x0 + win.offsetWidth, y1: y0 + win.offsetHeight };
      };
      stage.go = (app, opts) => {
        const id = SCULPT_OF[app];
        const g = guide.get();
        const reduce = motion === "reduce" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (disposed || !id || reduce || document.hidden || root.dataset.state !== "live" || g.portal) return false;
        // a janela já estava na tela (o visitante só voltou a ela): não há o que entregar de novo — quem chama cuida do foco
        if (arriving !== app && document.querySelector(`.os-window[data-app="${app}"]`)) return false;
        // a figura do destino ainda não chegou do servidor: a página vai na frente (e a figura fica pronta para a próxima)
        if (!e.has(id)) {
          void need(id);
          return false;
        }
        // muda de ideia: o destino anterior aparece inteiro na hora e a figura parte de onde está
        settleArrival();
        // a conversa se recolhe quando cobriria a cena: o gesto é para ser visto
        if (g.open && !g.min) guide.set({ min: true, unread: true });
        arriving = app;
        arrivingFocus = opts?.focus ?? null;
        html.dataset.osArriving = app;
        e.become(id);
        e.start();
        root.dataset.run = "1";
        const since = performance.now();
        const aim = () => {
          if (arriving !== app || disposed) return;
          const win = document.querySelector<HTMLElement>(`.os-window[data-app="${app}"]`);
          const ready = !!win && win.offsetWidth > 40;
          if (!ready) {
            if (performance.now() - since < 900) return void requestAnimationFrame(aim);
            return settleArrival();
          }
          arrivingEl = win;
          win.dataset.arriving = "1";
          win.style.setProperty("--mp-clip", "inset(50%)");
          e.act(app, rectOf(win));
          window.addEventListener("pointerdown", hurry, true);
          window.addEventListener("keydown", hurry, true);
          // rede de segurança: o destino nunca fica preso ao gesto
          arrivalTimer = window.setTimeout(settleArrival, 3200 / e.pace());
        };
        requestAnimationFrame(aim);
        return true;
      };

      /** A figura que a cena deve mostrar: a do app em primeiro plano; sem janela, a Matéria em repouso. */
      const wanted = (): SculptId => {
        const s = store.getState();
        const f = s.focused;
        const id = f && s.wins[f].open && !s.wins[f].min ? SCULPT_OF[f] : undefined;
        return id ?? "rest";
      };
      const syncTargets = () => {
        const g = guide.get();
        const s = store.getState();
        const route = s.focused === "projects" ? s.wins.projects.route : null;
        const caseSlug = route?.startsWith("/work/") ? route.slice(6) : null;
        // A conversa aberta (e não recolhida) é o cérebro; o recorte acontece no busto.
        const talk = g.open && !g.min && !g.portal;
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
        // sem gesto em curso, a escultura acompanha a janela em primeiro plano (e volta ao repouso sem nenhuma)
        if (!arriving) {
          const want = wanted();
          if (e.debug.char !== want) {
            if (e.has(want)) {
              if (want === "rest" || e.debug.act) e.retire();
              e.become(want);
            } else void need(want).then((ok) => ok && !disposed && !arriving && wanted() === want && e.become(want));
          }
        }
        root.dataset.pose = talk ? "brain" : "bust";
        root.dataset.char = e.debug.char;
        if (g.portal) root.dataset.portal = g.portal;
        else delete root.dataset.portal;
        syncRun();
      };

      // ---- quadro: commit do tema no meio da troca, a passagem, marcas no DOM ----
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
        // A passagem: a janela de verdade, recortada pelo contorno que as mãos seguram.
        const P = eng.passage;
        if (arriving && arrivingEl && P && P.app === arriving) {
          if (P.done) settleArrival();
          else {
            const d = domPassage(P.rect, P, P.q, P.focal);
            arrivingEl.style.setProperty("--mp-tf", d.transform);
            arrivingEl.style.setProperty("--mp-clip", d.clip);
          }
        }
        // O recorte no rosto do busto, quadro a quadro, para quem desenha a ideia dentro dele: centro e raios em px da janela.
        const f = eng.figure;
        if (f.open > 0.001 || cutOpen) {
          cutOpen = f.open > 0.001;
          const box = canvas.getBoundingClientRect();
          const Pt = MATERIA.portal;
          stage.cut?.(cutOpen ? { x: box.left + f.x + Pt.c[0] * f.k, y: box.top + f.y - Pt.c[1] * f.k, rx: Pt.r[0] * Pt.inset * f.k, ry: Pt.r[1] * Pt.inset * f.k, open: f.open } : null);
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
        if (document.hidden && arriving) hurry(new Event("visibilitychange"));
        syncRun();
      };
      // o ponteiro perto da cena mantém vivos os grãos de prata (uma vez a cada meio segundo, no máximo)
      let stirred = 0;
      const onMove = () => {
        const nowMs = performance.now();
        if (nowMs - stirred < 500) return;
        stirred = nowMs;
        e.stir();
        if (root.dataset.run === "1") e.start();
      };

      stage.live = () => !disposed && root.dataset.state === "live" && !document.hidden && !covered();
      stage.ready = () => !disposed && root.dataset.state === "live" && !document.hidden;
      stage.anchor = () => {
        const l = layoutRef.current;
        const box = canvas.getBoundingClientRect();
        if (!l) return null;
        const g = guide.get();
        if (g.open && !g.min) return { x: box.left + l.talk.x, y: box.top + l.talk.y, k: l.k * l.talk.k };
        if (g.portal) return { x: box.left + l.home.x, y: box.top + l.home.y, k: l.k };
        return { x: box.left + l.hero.x, y: box.top + l.hero.y, k: l.hero.h / (2 * FRAMES.rest.half) };
      };

      store.getState().setThemeDriver(driveTheme);
      document.addEventListener("visibilitychange", onVis);
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerdown", onMove, { passive: true });
      mark();
      syncTargets();

      // Leitura do estado da cena: em desenvolvimento sempre; em produção só com ?scene-debug (scripts/materia-check.mjs).
      const expose = process.env.NODE_ENV !== "production" || new URLSearchParams(window.location.search).has("scene-debug");
      if (expose) {
        (window as unknown as { __mwMateria?: unknown }).__mwMateria = {
          get state() {
            return { ...e.debug, mood: e.mood, frames: e.frames, dpr: e.dpr, fps: e.fpsNow, count: e.count, ms: e.stats.ms, costMs, layout: layoutRef.current, arriving, passage: e.passage ? { app: e.passage.app, q: e.passage.q, done: e.passage.done, points: e.passage.poly?.length ?? 0, circle: !!e.passage.circle } : null };
          },
          pull: (p: { x: number; y: number } | null) => e.pull(p),
          probe: () => e.probe(),
          pace: (v?: number) => e.pace(v),
          figure: () => ({ ...e.figure }),
          need: (id: SculptId) => need(id),
          become: (id: SculptId) => e.become(id),
          /**
           * Imagens estáticas da própria cena (scripts/materia-still.mjs). `home`: a escultura em repouso sobre a parede
           * lisa na cor do tema. `brain`: o cérebro sobre transparente. Uma figura (`projects`, `profile`…): o instante
           * decisivo do gesto dela, no mesmo enquadramento.
           */
          async still(mood: Mood, kind: "home" | "brain" | SculptId, opts?: { silhouette?: boolean }) {
            const c = document.createElement("canvas");
            const brain = kind === "brain";
            const id: SculptId = kind === "home" || brain ? "rest" : kind;
            if (id !== "rest" && !(await need(id))) return null;
            const data = id === "rest" ? rest : await loadSculpt(id, lite);
            const still = createEngine({ canvas: c, mood, lite: false, molecules, figure, rest, still: true, scene: !brain, silhouette: !!opts?.silhouette });
            if (!still) return null;
            if (id !== "rest") still.addSculpt(data);
            const S = MATERIA_STILL;
            const Hs = HERO_STILL;
            if (brain) still.setLayout({ w: S.w, h: S.h, k: S.k, home: { x: S.cx, y: S.cy }, talk: { x: S.cx, y: S.cy, k: 1 }, hero: { x: S.cx, y: S.cy, h: S.h } });
            else still.setLayout({ w: Hs.w, h: Hs.h, k: Hs.fh / 2.7, home: { x: Hs.x, y: Hs.y }, talk: { x: Hs.x, y: Hs.y, k: 1 }, hero: { x: Hs.x, y: Hs.y, h: Hs.fh } });
            still.setDpr(1);
            await still.compile();
            still.still(mood, brain ? 1 : 0, id, id === "rest" ? undefined : [1, 0.62]);
            const url = opts?.silhouette ? c.toDataURL("image/png") : c.toDataURL("image/webp", 0.92);
            still.dispose();
            return url;
          },
        };
      }

      cleanup = () => {
        window.clearTimeout(stopTimer);
        warm();
        unsubOs();
        unsubGuide();
        stage.go = null;
        stage.warm = null;
        settleArrival();
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
        window.removeEventListener("pointerdown", onMove);
        root.dataset.state = "still";
        delete root.dataset.trans;
        delete root.dataset.mood;
        delete root.dataset.run;
        delete root.dataset.portal;
        delete root.dataset.char;
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
      {/* A escultura como imagem (fundo CSS, styles/materia.css): em repouso, e o cérebro na conversa — só a do tema em vigor é baixada. */}
      <div className="os-scene__still" />
      {/* Um canvas novo a cada montagem do motor: ao sair ele força a perda do contexto WebGL, e um canvas guarda o seu para sempre. */}
      <canvas key={`${shell}:${motion}`} ref={canvasRef} className="os-scene__canvas" />
      <div className="os-scene__calm" />
    </div>
  );
}
