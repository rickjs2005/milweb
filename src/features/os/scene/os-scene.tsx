"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { onIdle } from "@/animations/idle";
import { getQuality, probeGpu } from "@/lib/quality";
import { useOs, useOsStore } from "../os-shell";
import type { OsTheme } from "../theme";
import { OS_SCENE, THEME_OF, WORLD_OF } from "./scene.config";
import type { Engine } from "./engine";

/**
 * O fundo do MilWeb OS — Tsukuyomi (Obito, escuro) e Vazio Ilimitado (Gojo,
 * claro) — e a travessia entre eles. A cena é Three.js (scene/engine.ts,
 * carregado em idle num pedaço próprio); este componente é a cola com a
 * interface.
 *
 * Camada visual pura, ATRÁS da interface: `pointer-events: none`,
 * aria-hidden, z-index negativo dentro da área de trabalho; nada aqui mexe
 * em layout, nos apps, no lema ou na dock. O HTML entrega a imagem estática
 * do universo do tema em vigor (fundo CSS escolhido por `data-os-theme`,
 * posicionada pelo centro e raio do palco — `--st-x/--st-y/--st-r`), então o
 * primeiro quadro já é o certo, sem flash de tema, e quem tem movimento
 * reduzido, WebGL 2 ausente ou GPU por software fica com ela.
 *
 * UM laço: o ticker do GSAP (dentro do motor) faz as tweens e o quadro da
 * cena; este componente só recebe um gancho por quadro (commit do tema,
 * calibração, marcas no DOM) — nenhum estado React por quadro.
 *
 * Troca de tema: o cenário é o driver do store (`setThemeDriver`): um pedido
 * vira uma travessia (~2,2 s, uma tween do GSAP que inverte o sentido se o
 * destino voltar) e a interface adota o tema novo (`commitTheme`) quando o
 * universo novo chega às áreas de leitura. Sem driver (imagem, janela
 * maximizada, tela aberta no telefone, aba oculta): troca imediata.
 *
 * Interação: paralaxe amortecida (a câmera anda; o que está perto anda mais),
 * deriva automática sem mouse e no telefone; destacar um app (ponteiro ou
 * foco) produz uma reação localizada no cenário; clicar num app solta uma
 * onda pequena que acompanha a abertura da janela. O cenário nunca captura o
 * ponteiro — todos os cliques continuam da interface.
 */
type Stage = { x: number; y: number; r: number };

const clamp1 = (v: number) => Math.max(-1, Math.min(1, v));
/** O que reage ao ser destacado (coluna do desktop, grade do telefone) e o que solta a onda ao abrir. */
const HOVER_SEL = ".os-icon-btn, .os-launch";
const CLICK_SEL = ".os-icon-btn, .os-launch, .os-dock__item[data-dock-id]";

/** Centro e raio da composição a partir do palco (`.os-stage`, irmão do fundo), em px CSS relativos ao fundo. */
function measureStage(root: HTMLElement, mobile: boolean): Stage | null {
  const box = root.getBoundingClientRect();
  const stage = root.parentElement?.querySelector<HTMLElement>(".os-stage");
  if (!stage || box.width === 0 || box.height === 0) return null;
  const s = stage.getBoundingClientRect();
  return {
    x: s.left + s.width / 2 - box.left,
    y: s.top + s.height / 2 - box.top,
    r: mobile ? Math.min(box.width * OS_SCENE.mobileR.w, s.height * OS_SCENE.mobileR.h) : box.height * OS_SCENE.desktopR,
  };
}

export function OsScene() {
  const { store } = useOs();
  const shell = useOsStore((s) => s.shell);
  const motion = useOsStore((s) => s.prefs.motion);
  const ref = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<Stage | null>(null);
  const engineRef = useRef<Engine | null>(null);

  // Composição: medida no palco e publicada em variáveis CSS (posiciona a imagem estática) — a cena lê a mesma.
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || shell === "auto" || shell === "simple") return;
    const mobile = shell === "mobile";
    const apply = () => {
      const st = measureStage(root, mobile);
      if (!st) return;
      stageRef.current = st;
      root.style.setProperty("--st-x", `${st.x.toFixed(1)}px`);
      root.style.setProperty("--st-y", `${st.y.toFixed(1)}px`);
      root.style.setProperty("--st-r", `${st.r.toFixed(1)}px`);
      const c = canvasRef.current;
      if (c && engineRef.current) engineRef.current.setStage(st, c.clientWidth, c.clientHeight);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(root);
    const stage = root.parentElement?.querySelector(".os-stage");
    if (stage) ro.observe(stage);
    return () => {
      ro.disconnect();
      stageRef.current = null;
      ["--st-x", "--st-y", "--st-r"].forEach((k) => root.style.removeProperty(k));
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
      const forced = gq.reason.startsWith("forçado");
      const { createEngine } = await import("./engine");
      if (disposed) return;
      const lite = mobile || gq.tier !== "high";
      const e = createEngine({ canvas, world: WORLD_OF[store.getState().prefs.theme], lite });
      if (!e) return;
      const fail = () => {
        e.dispose();
        engineRef.current = null;
      };
      const st0 = stageRef.current;
      e.setStage(st0 ?? { x: canvas.clientWidth / 2, y: canvas.clientHeight * 0.46, r: canvas.clientHeight * OS_SCENE.desktopR }, canvas.clientWidth, canvas.clientHeight);

      // Compila os programas (em paralelo quando a GPU permite: sem travar a página) e mede o custo.
      const B = OS_SCENE.budget;
      try {
        e.setDpr(B.probeDpr);
        await e.warm();
      } catch (err) {
        console.error(err);
        fail();
        return;
      }
      if (disposed) {
        fail();
        return;
      }
      const maxDpr = Math.min(window.devicePixelRatio || 1, mobile ? B.mobileMaxDpr : B.maxDpr);
      const floorDpr = forced ? 0.2 : B.minDpr;
      /** Resolução e teto de quadros para um custo medido (ms por px do buffer) — scene.config › budget. */
      const plan = (perPx: number, fpsNow: number) => {
        const css = Math.max(1, canvas.clientWidth * canvas.clientHeight);
        const at = (ms: number) => Math.sqrt(ms / Math.max(1e-9, perPx * css));
        const d60 = Math.min(maxDpr, at(B.targetMs / 2));
        const fast = gq.tier === "high" && d60 >= maxDpr * (fpsNow === OS_SCENE.fps.ambientHigh ? B.keep60 : B.go60);
        const fps: number = fast ? OS_SCENE.fps.ambientHigh : OS_SCENE.fps.ambient;
        return { fps, dpr: Math.max(floorDpr, Math.min(maxDpr, fast ? d60 : at(B.targetMs))) };
      };
      const perPx0 = e.measure(4) / Math.max(1, canvas.width * canvas.height);
      // Só desiste numa GPU sem condição nenhuma (40 ms por quadro já na resolução mínima); tela grande não é motivo.
      if (!forced && perPx0 * canvas.clientWidth * canvas.clientHeight * B.minDpr * B.minDpr > 40) {
        fail();
        return;
      }
      let { fps: ambientFps, dpr } = plan(perPx0, OS_SCENE.fps.ambient);
      e.setDpr(dpr);
      e.fps(ambientFps);
      engineRef.current = e;
      if (stageRef.current) e.setStage(stageRef.current, canvas.clientWidth, canvas.clientHeight);

      const covered = () => {
        const s = store.getState();
        return s.shell === "mobile" ? s.focused !== null : s.order.some((id) => s.wins[id].open && !s.wins[id].min && s.wins[id].max);
      };
      const mark = () => {
        root.dataset.world = e.world;
        const tr = e.trans;
        if (tr) root.dataset.trans = `${tr.from}>${tr.to}`;
        else delete root.dataset.trans;
      };
      // Quadros só com o fundo à vista (ou durante uma travessia/onda, que sempre terminam). No telefone,
      // abrir um app cobre a tela: o laço para depois da animação de abertura (a onda aparece por trás dela).
      let stopTimer = 0;
      // `data-run` no fundo diz se o laço está rodando (diagnóstico e testes; nenhum CSS depende dele).
      const syncRun = () => {
        window.clearTimeout(stopTimer);
        if (document.hidden) {
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
            e.stop();
            root.dataset.run = "0";
          }, mobile ? 700 : 0);
      };
      /** Centro de um elemento em px CSS relativos ao canvas. */
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

      // ---- quadro: commit do tema no meio da travessia, calibração, monitor, marcas ----
      let sceneT = 0;
      // A primeira calibração roda com o canvas ainda invisível (ele só entra depois dela) e vai direto ao alvo:
      // a medida do boot pega a GPU fria e erra para baixo. Ela mede o custo marginal (vários quadros) e a
      // latência fixa da leitura; as seguintes, com a cena à vista, só cronometram o próprio quadro (uma
      // leitura, sem quadro extra) e descontam essa latência — nada de rajada de quadros travando a tela.
      let calibAt = 0.8;
      let calibs = 0;
      let latency = 0;
      let timing = false;
      let slowEma = 0;
      let cooldown = 3;
      let lastTrans = "";
      let painted = false;
      let lastMove = -1e9;
      /** Calibração em regime: passos pequenos até o custo-alvo; o teto de quadros pode mudar (com folga para não alternar). */
      const applyPlan = (per: number) => {
        const next = plan(per, ambientFps);
        if (calibs === 0 || next.fps !== ambientFps) {
          // primeira medida em regime ou mudança de teto: a resolução vai direto para a do plano
          ambientFps = next.fps;
          e.fps(ambientFps);
          dpr = next.dpr;
          e.setDpr(dpr);
        } else {
          const step = Math.max(-0.12, Math.min(0.12, next.dpr - dpr));
          if (Math.abs(step) > 0.05) {
            dpr += step;
            e.setDpr(dpr);
          }
        }
        calibs++;
        calibAt = sceneT + (calibs < 4 ? 6 : 30);
      };
      let cancelPrime = () => {};
      e.onFrame((eng, dt) => {
        sceneT += dt;
        const tr = eng.trans;
        if (tr) {
          const st = store.getState();
          const pend = st.themePending;
          const at = OS_SCENE.commitAt[tr.to];
          if (pend !== null && ((tr.dir > 0 && tr.p >= at && pend === THEME_OF[tr.to]) || (tr.dir < 0 && tr.p <= at && pend === THEME_OF[tr.from]))) st.commitTheme();
        }
        const key = tr ? `${tr.from}>${tr.to}` : eng.world;
        if (key !== lastTrans) {
          lastTrans = key;
          mark();
          syncRun();
        }
        if (target && performance.now() - lastMove > OS_SCENE.parallax.idle * 1000) {
          target = null;
          eng.pointer(null);
        }
        if (!tr) {
          // monitor: só o ambiente conta (a travessia é curta e dobrada)
          slowEma = slowEma * 0.92 + (dt > 1.45 / ambientFps ? 0.08 : 0);
          cooldown -= dt;
          if (cooldown <= 0 && slowEma > 0.5 && dpr > B.minDpr + 0.01) {
            dpr = Math.max(B.minDpr, dpr * 0.82);
            eng.setDpr(dpr);
            slowEma = 0;
            cooldown = 2.5;
          }
          if (sceneT >= calibAt && !timing) {
            if (calibs === 0) {
              applyPlan(eng.measure(5) / Math.max(1, canvas.width * canvas.height));
              // latência fixa da leitura, já na resolução escolhida
              latency = Math.max(0, eng.timeOnce() - eng.measure(4));
            } else {
              timing = true;
              eng.timeNextFrame((ms) => {
                timing = false;
                applyPlan(Math.max(0.05, ms - latency) / Math.max(1, canvas.width * canvas.height));
              });
            }
          }
        }
        if (!painted && (calibs > 0 || tr)) {
          painted = true;
          root.dataset.state = "live";
          // o outro universo é desenhado uma vez fora da tela quando a página sossegar (geometria na GPU)
          cancelPrime = onIdle(() => eng.prime(), 3000);
        }
      });

      // ---- driver da troca de tema ----
      const driveTheme = (to: OsTheme) => {
        if (disposed || document.hidden || covered()) return false;
        const handled = e.transition(WORLD_OF[to], toggleOrigin());
        if (handled) {
          mark();
          syncRun();
        }
        return handled;
      };

      const unsub = store.subscribe((s, prev) => {
        syncRun();
        // tema aplicado sem travessia (sem driver): o universo acompanha
        if (!e.trans && s.prefs.theme !== prev.prefs.theme && WORLD_OF[s.prefs.theme] !== e.world) {
          e.setWorld(WORLD_OF[s.prefs.theme]);
          mark();
        }
      });
      const finishNow = () => {
        const st = store.getState();
        if (st.themePending !== null) st.commitTheme();
        e.finish(WORLD_OF[store.getState().prefs.theme]);
        mark();
      };
      // aba oculta: a travessia termina na hora e o laço para; ao voltar, ele retoma
      const onVis = () => {
        if (document.hidden && e.trans) finishNow();
        syncRun();
      };

      // ---- paralaxe (desktop, ponteiro fino): mouse recente manda; sem ele, deriva automática ----
      let target: { x: number; y: number } | null = null;
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

      // ---- reação ao app destacado e onda do clique ----
      let hovered: Element | null = null;
      const setHover = (el: Element | null) => {
        if (el === hovered) return;
        hovered = el;
        if (el) {
          const [x, y] = centerOf(el.querySelector(".os-icon, .os-micon") ?? el);
          e.hover(x, y, true);
        } else e.hover(0, 0, false);
        syncRun();
      };
      const onOver = (ev: Event) => setHover((ev.target as Element | null)?.closest?.(HOVER_SEL) ?? null);
      const onOut = (ev: PointerEvent | FocusEvent) => {
        const to = ev.relatedTarget as Element | null;
        if (hovered && (!to || !hovered.contains(to))) setHover(to?.closest?.(HOVER_SEL) ?? null);
      };
      const onClick = (ev: MouseEvent) => {
        const el = (ev.target as Element | null)?.closest?.(CLICK_SEL);
        if (!el) return;
        const [x, y] = centerOf(el.querySelector(".os-icon, .os-micon") ?? el);
        e.click(x, y);
        syncRun();
      };

      store.getState().setThemeDriver(driveTheme);
      document.addEventListener("visibilitychange", onVis);
      if (gq.fine && !mobile) {
        window.addEventListener("pointermove", onMove, { passive: true });
        document.documentElement.addEventListener("pointerleave", onLeave);
      }
      document.addEventListener("pointerover", onOver, { passive: true });
      document.addEventListener("pointerout", onOut, { passive: true });
      document.addEventListener("focusin", onOver);
      document.addEventListener("focusout", onOut);
      document.addEventListener("click", onClick, { capture: true, passive: true });
      mark();
      syncRun();

      if (process.env.NODE_ENV !== "production") {
        (window as unknown as { __mwOsScene?: unknown }).__mwOsScene = {
          get world() {
            return e.world;
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
            return ambientFps;
          },
          get par() {
            return e.par;
          },
          get hover() {
            return e.hoverState;
          },
          get click() {
            return e.clickState;
          },
          bench: (n = 6, trans = false) => e.measure(n, trans),
          scene: (w: "tsukuyomi" | "void") => e.worlds[w].scene,
          setDpr: (v: number) => {
            dpr = v;
            e.setDpr(v);
          },
        };
      }

      cleanup = () => {
        cancelPrime();
        window.clearTimeout(stopTimer);
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
        document.removeEventListener("focusin", onOver);
        document.removeEventListener("focusout", onOut);
        document.removeEventListener("click", onClick, { capture: true });
        root.dataset.state = "still";
        delete root.dataset.trans;
        delete root.dataset.world;
        delete root.dataset.run;
        e.dispose();
        engineRef.current = null;
        if (process.env.NODE_ENV !== "production") delete (window as unknown as { __mwOsScene?: unknown }).__mwOsScene;
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
      {/* Imagem do universo do tema em vigor: fundo CSS (styles/os.css) — só a do tema e do enquadramento em vigor é baixada. */}
      <div className="os-scene__still" />
      <canvas ref={canvasRef} className="os-scene__canvas" />
      {/* Áreas de leitura calmas: véu suave atrás da coluna de apps e do lema (telefone: status e grade). */}
      <div className="os-scene__calm" />
    </div>
  );
}
