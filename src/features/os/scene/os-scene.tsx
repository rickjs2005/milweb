"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { onIdle } from "@/animations/idle";
import { getQuality, probeGpu } from "@/lib/quality";
import { useOs, useOsStore } from "../os-shell";
import type { OsTheme } from "../theme";
import { OS_SCENE, THEME_OF, WORLD_OF, type SceneWorld } from "./scene.config";
import { uploadNoise } from "./noise";

/**
 * O fundo do MilWeb OS — Tsukuyomi (Obito, escuro) e Vazio Ilimitado (Gojo,
 * claro) — e a travessia entre eles.
 *
 * Camada visual pura, ATRÁS da interface: `pointer-events: none`,
 * aria-hidden, z-index negativo dentro da área de trabalho; nada aqui mexe
 * em layout, nos apps, no lema ou na dock. O HTML entrega a imagem estática
 * do universo do tema em vigor (fundo CSS escolhido por `data-os-theme`,
 * posicionada pelo centro e raio do palco — `--st-x/--st-y/--st-r`), então o
 * primeiro quadro já é o certo, sem flash de tema, e quem tem movimento
 * reduzido, WebGL ausente ou GPU fraca fica com ela. Com GPU, o canvas monta
 * em idle: um custo medido numa resolução reduzida decide a resolução real
 * (ou desiste e deixa a imagem), e um monitor de quadros reduz a resolução
 * se o aparelho não acompanhar.
 *
 * Troca de tema: o cenário se registra no store como driver
 * (`setThemeDriver`). Um pedido inicia a travessia (~2,2 s): a onda nasce no
 * controle de tema, o universo antigo sai, o novo chega, e a interface adota
 * o tema novo (`commitTheme`) quando a frente do universo novo passa pelas
 * áreas de leitura — antes disso o texto continua legível sobre o universo
 * antigo. Pedidos durante a travessia só mudam o sentido (voltar ao universo
 * de origem) — nunca duas travessias ao mesmo tempo. Sem driver (imagem
 * estática, janela maximizada, aba oculta) a troca é imediata.
 *
 * Paralaxe: no desktop o mouse move os planos com amortecimento, cada um
 * com a própria intensidade; sem mouse (ou no telefone) uma deriva lenta e
 * automática. Nada depende de hover nem de sensores. Quadros contínuos só
 * com o fundo à vista (a aba oculta já para no renderer; janela maximizada
 * ou tela aberta no telefone soltam o loop).
 */
type Stage = { x: number; y: number; r: number };
type Trans = { from: SceneWorld; to: SceneWorld; p: number; dir: 1 | -1; ox: number; oy: number };

const clamp1 = (v: number) => Math.max(-1, Math.min(1, v));
const easeOut = (u: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, u)), 3);

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

  // Composição: medida no palco e publicada em variáveis CSS (posiciona a imagem estática) — o shader lê a mesma.
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
      const [{ createRenderer }, { TSUKUYOMI_FRAG }, { VOID_FRAG }] = await Promise.all([import("@/webgl/renderer"), import("./tsukuyomi-frag"), import("./void-frag")]);
      if (disposed) return;
      const r = createRenderer(canvas, { dpr: 1, alpha: false });
      if (!r) return;
      const FRAG: Record<SceneWorld, string> = { tsukuyomi: TSUKUYOMI_FRAG, void: VOID_FRAG };
      const ready = new Set<SceneWorld>();
      /** Compila um universo (uma vez); falha = fica a imagem estática, sem erro no console quando é contexto perdido. */
      const ensure = (w: SceneWorld) => {
        if (ready.has(w)) return true;
        try {
          r.addProgram(w, FRAG[w]);
          ready.add(w);
          return true;
        } catch (e) {
          if (!(e instanceof Error && e.name === "ContextLostError")) console.error(e);
          return false;
        }
      };

      let world: SceneWorld = WORLD_OF[store.getState().prefs.theme];
      if (!ensure(world)) {
        r.destroy();
        return;
      }
      let noise = uploadNoise(r.gl);
      const onRestored = () => {
        noise = uploadNoise(r.gl);
      };
      canvas.addEventListener("webglcontextrestored", onRestored);

      // ---- estado (fora do React: muda a cada quadro) ----
      let tr: Trans | null = null;
      let sceneT = 0;
      let lastT = -1;
      const par = { x: 0, y: 0, tx: 0, ty: 0, at: -1e9 };
      const wrap = OS_SCENE.timeWrap;

      const uniforms = (leave: number, enter: number, wave: [number, number, number]) => {
        const st = stageRef.current;
        const cw = canvas.clientWidth || 1;
        const ch = canvas.clientHeight || 1;
        const k = canvas.width / cw;
        const sx = st ? st.x : cw / 2;
        const sy = st ? st.y : ch * 0.46;
        const sr = st ? st.r : ch * OS_SCENE.desktopR;
        return {
          uRes: [canvas.width, canvas.height] as [number, number],
          uC: [sx * k, (ch - sy) * k] as [number, number],
          uR: sr * k,
          uTime: sceneT % wrap,
          uPar: [par.x, par.y] as [number, number],
          uLeave: leave,
          uEnter: enter,
          uWave: wave,
        };
      };
      const tex = () => (noise ? [{ name: "uNoise", tex: noise, unit: 0 }] : undefined);
      const draw = () => {
        r.clear();
        if (!tr) {
          r.draw(world, uniforms(0, 1, [0, 0, -1]), tex());
          return;
        }
        const k = canvas.width / (canvas.clientWidth || 1);
        // progresso da onda: 0 antes de sair do controle, 1 depois de passar por tudo (o shader sabe o que já foi tocado)
        const wu = (tr.p - OS_SCENE.wave.from) / (OS_SCENE.wave.to - OS_SCENE.wave.from);
        const wave: [number, number, number] = [tr.ox * k, tr.oy * k, easeOut(wu)];
        // O universo que sai por baixo; o que chega por cima, com a máscara de revelação do próprio shader.
        if (tr.p < 0.97) r.draw(tr.from, uniforms(tr.p, 1, wave), tex());
        if (tr.p > 0.33) r.draw(tr.to, uniforms(0, tr.p, wave), tex());
      };

      // ---- custo: quadros do universo atual numa resolução reduzida ----
      // Sincroniza lendo 1 pixel: no Chrome `gl.finish()` não espera a GPU (mediria ~0 ms e escolheria a resolução máxima).
      const px1 = new Uint8Array(4);
      const sync = () => r.gl.readPixels(0, 0, 1, 1, r.gl.RGBA, r.gl.UNSIGNED_BYTE, px1);
      r.setDpr(OS_SCENE.budget.probeDpr);
      r.resize();
      draw();
      sync(); // aquecimento (o driver termina de preparar o programa no primeiro uso)
      let p0 = performance.now();
      sync(); // o custo fixo de uma sincronização (ida e volta ao processo da GPU) sai da conta
      const overhead = performance.now() - p0;
      p0 = performance.now();
      for (let i = 0; i < 4; i++) draw();
      sync();
      const perFrame = Math.max(0.05, (performance.now() - p0 - overhead) / 4);
      const msPerPx = perFrame / Math.max(1, canvas.width * canvas.height);
      const cssPx = Math.max(1, canvas.clientWidth * canvas.clientHeight);
      const maxDpr = Math.min(window.devicePixelRatio || 1, mobile ? OS_SCENE.budget.mobileMaxDpr : OS_SCENE.budget.maxDpr);
      let dpr = Math.min(maxDpr, Math.sqrt(OS_SCENE.budget.targetMs / Math.max(1e-9, msPerPx * cssPx)));
      if (dpr < OS_SCENE.budget.minDpr) {
        const atMin = msPerPx * cssPx * OS_SCENE.budget.minDpr * OS_SCENE.budget.minDpr;
        if (atMin > OS_SCENE.budget.maxMs && !forced) {
          canvas.removeEventListener("webglcontextrestored", onRestored);
          r.destroy();
          return;
        }
        // ?quality= forçado (QA): sobe mesmo numa GPU por software, em resolução mínima.
        dpr = forced ? Math.max(0.2, dpr) : OS_SCENE.budget.minDpr;
      }
      const fast = gq.tier === "high" && msPerPx * cssPx * dpr * dpr < 4;
      const ambientFps = fast ? OS_SCENE.fps.ambientHigh : OS_SCENE.fps.ambient;
      r.setDpr(dpr);
      r.setFpsCap(ambientFps);

      // Monitor de quadros: intervalo real (o teto do renderer pula quadros) — se ficar acima do orçamento,
      // baixa a resolução em passos, com pausa entre eles; o piso é minDpr.
      let slowEma = 0;
      let cooldown = 3;
      // Calibração periódica: a primeira medida (no boot) pega a GPU em clock baixo. Em regime, a cada poucos
      // segundos um quadro do ambiente é medido de verdade (sincronizado) e a resolução anda em passos pequenos
      // até o custo-alvo — para cima ou para baixo. Converge em ~3 medidas; depois mede a cada 30 s.
      let calibAt = 3;
      let calibs = 0;
      const calibrate = () => {
        draw();
        sync();
        const c0 = performance.now();
        sync();
        const ovh = performance.now() - c0;
        const c1 = performance.now();
        draw();
        sync();
        const per = Math.max(0.05, performance.now() - c1 - ovh);
        const perPx = per / Math.max(1, canvas.width * canvas.height);
        const css = Math.max(1, canvas.clientWidth * canvas.clientHeight);
        // o orçamento é por segundo de GPU: a 45 quadros/s cada quadro ganha proporcionalmente menos
        const target = (OS_SCENE.budget.targetMs * OS_SCENE.fps.ambient) / ambientFps;
        const ideal = Math.max(OS_SCENE.budget.minDpr, Math.min(maxDpr, Math.sqrt(target / Math.max(1e-9, perPx * css))));
        const step = Math.max(-0.12, Math.min(0.12, ideal - r.dpr));
        if (Math.abs(step) > 0.05) r.setDpr(r.dpr + step);
        calibs++;
        calibAt = sceneT + (calibs < 4 ? 6 : 30);
      };
      const watchdog = (dt: number) => {
        // Só o ambiente conta: a travessia é curta e pesa o dobro — não deve rebaixar a resolução de sempre.
        if (tr) return;
        const budget = 1.45 / ambientFps;
        slowEma = slowEma * 0.92 + (dt > budget ? 1 : 0) * 0.08;
        cooldown -= dt;
        if (cooldown <= 0 && slowEma > 0.5 && r.dpr > OS_SCENE.budget.minDpr + 0.01) {
          r.setDpr(Math.max(OS_SCENE.budget.minDpr, r.dpr * 0.82));
          slowEma = 0;
          cooldown = 2.5;
        }
      };

      /** Centro do controle de tema visível (o olho), em px CSS relativos ao canvas, y para cima. */
      const toggleOrigin = (): [number, number] => {
        const box = canvas.getBoundingClientRect();
        const btn = [...document.querySelectorAll<HTMLElement>(".os-dock__theme, .os-mdock__theme")].find((b) => b.getClientRects().length > 0 && b.getBoundingClientRect().width > 0);
        const b = btn?.getBoundingClientRect();
        const cx = b ? b.left + b.width / 2 : box.left + box.width / 2;
        const cy = b ? b.top + b.height / 2 : box.bottom;
        return [cx - box.left, box.bottom - cy];
      };

      const covered = () => {
        const s = store.getState();
        return s.shell === "mobile" ? s.focused !== null : s.order.some((id) => s.wins[id].open && !s.wins[id].min && s.wins[id].max);
      };

      const mark = () => {
        root.dataset.world = world;
        if (tr) root.dataset.trans = `${tr.from}>${tr.to}`;
        else delete root.dataset.trans;
      };

      /** Termina a travessia na hora (aba oculta, desmontagem): aplica o tema pedido e fixa o universo de destino. */
      const finishNow = () => {
        const st = store.getState();
        if (st.themePending !== null) st.commitTheme();
        tr = null;
        world = WORLD_OF[store.getState().prefs.theme];
        r.setFpsCap(ambientFps);
        mark();
      };

      // ---- driver da troca de tema ----
      const driveTheme = (to: OsTheme) => {
        if (disposed || document.hidden || r.lost || covered()) return false;
        const w = WORLD_OF[to];
        if (!tr) {
          if (w === world || !ensure(w)) return false;
          const [ox, oy] = toggleOrigin();
          tr = { from: world, to: w, p: 0, dir: 1, ox, oy };
          lastT = -1; // o primeiro quadro da travessia não herda uma pausa anterior do loop
        } else if (w === tr.to) tr.dir = 1;
        else if (w === tr.from) tr.dir = -1;
        r.setFpsCap(OS_SCENE.fps.transition);
        syncHold();
        mark();
        r.invalidate();
        return true;
      };

      r.onFrame((t) => {
        const raw = lastT < 0 ? 1 / 60 : Math.max(0, t - lastT);
        const dt = Math.min(0.1, raw);
        lastT = t;
        sceneT += dt;
        watchdog(dt);
        if (!tr && sceneT >= calibAt) calibrate();

        // paralaxe: mouse recente manda (desktop); senão, deriva lenta
        const idle = mobile || performance.now() - par.at > OS_SCENE.parallax.idle * 1000;
        const A = mobile ? OS_SCENE.parallax.mobileDrift : OS_SCENE.parallax.drift;
        const tx = idle ? A * (Math.sin(sceneT * 0.11) + 0.3 * Math.sin(sceneT * 0.27 + 1.0)) : par.tx;
        const ty = idle ? A * 0.7 * Math.sin(sceneT * 0.083 + 1.3) : par.ty;
        const kk = 1 - Math.exp(-dt / OS_SCENE.parallax.tau);
        par.x += (tx - par.x) * kk;
        par.y += (ty - par.y) * kk;

        // travessia
        if (tr) {
          // relógio real (não o dt limitado): um quadro lento não estica a travessia além dos ~2,2 s
          tr.p = Math.max(0, Math.min(1, tr.p + (tr.dir * Math.min(raw, 0.5)) / OS_SCENE.duration));
          const st = store.getState();
          const pend = st.themePending;
          const at = OS_SCENE.commitAt[tr.to];
          if (pend !== null && ((tr.dir > 0 && tr.p >= at && pend === THEME_OF[tr.to]) || (tr.dir < 0 && tr.p <= at && pend === THEME_OF[tr.from]))) st.commitTheme();
          if ((tr.dir > 0 && tr.p >= 1) || (tr.dir < 0 && tr.p <= 0)) {
            world = tr.dir > 0 ? tr.to : tr.from;
            tr = null;
            r.setFpsCap(ambientFps);
            mark();
            syncHold();
          }
        }
        draw();
        if (root.dataset.state !== "live") root.dataset.state = "live";
        if (tr) r.invalidate();
      });

      // Quadros contínuos só com o fundo à vista (ou durante uma travessia, que sempre termina).
      // (os fechamentos acima só chamam syncHold depois desta linha: quadros e o driver começam no fim do boot)
      let held: (() => void) | null = null;
      const syncHold = () => {
        const want = tr !== null || !covered();
        if (want && !held) held = r.hold();
        if (!want && held) {
          held();
          held = null;
        }
      };
      const unsub = store.subscribe((s, prev) => {
        syncHold();
        // Tema aplicado sem travessia (sem driver: coberto, aba oculta, Ajustes no telefone): o universo acompanha.
        if (!tr && s.prefs.theme !== prev.prefs.theme && WORLD_OF[s.prefs.theme] !== world) {
          world = WORLD_OF[s.prefs.theme];
          ensure(world);
          mark();
          r.invalidate();
        }
      });
      const onVis = () => {
        if (document.hidden && tr) finishNow();
      };
      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        par.tx = clamp1((e.clientX / window.innerWidth) * 2 - 1);
        par.ty = -clamp1((e.clientY / window.innerHeight) * 2 - 1);
        par.at = performance.now();
      };
      const onLeave = () => {
        par.at = -1e9;
      };
      document.addEventListener("visibilitychange", onVis);
      if (gq.fine && !mobile) {
        window.addEventListener("pointermove", onMove, { passive: true });
        document.documentElement.addEventListener("pointerleave", onLeave);
      }
      store.getState().setThemeDriver(driveTheme);
      mark();
      syncHold();
      r.invalidate();
      // O outro universo compila depois, em idle — a primeira troca não paga a compilação.
      const cancelWarm = onIdle(() => {
        if (!disposed) ensure(world === "tsukuyomi" ? "void" : "tsukuyomi");
      }, 4000);

      if (process.env.NODE_ENV !== "production") {
        (window as unknown as { __mwOsScene?: unknown }).__mwOsScene = {
          get world() {
            return world;
          },
          get trans() {
            return tr ? { ...tr } : null;
          },
          get frames() {
            return r.frames;
          },
          get dpr() {
            return r.dpr;
          },
          get held() {
            return !!held;
          },
          get ready() {
            return [...ready];
          },
          /** Custo médio de um quadro (ms, sincronizado por readPixels) na resolução atual: o universo em cena ou a travessia (p = 0,6). */
          bench(n = 12, trans = false) {
            const keep = tr;
            const other: SceneWorld = world === "tsukuyomi" ? "void" : "tsukuyomi";
            if (trans) {
              ensure(other);
              tr = { from: world, to: other, p: 0.6, dir: 1, ox: 0, oy: 0 };
            }
            draw();
            sync();
            const t0 = performance.now();
            for (let i = 0; i < n; i++) draw();
            sync();
            tr = keep;
            return (performance.now() - t0) / n;
          },
          setDpr(v: number) {
            r.setDpr(v);
          },
          par,
        };
      }

      cleanup = () => {
        cancelWarm();
        unsub();
        held?.();
        held = null;
        const st = store.getState();
        st.setThemeDriver(null);
        // Um tema pedido e ainda não aplicado não fica pendurado quando o fundo sai de cena.
        if (st.themePending !== null) st.commitTheme();
        document.removeEventListener("visibilitychange", onVis);
        window.removeEventListener("pointermove", onMove);
        document.documentElement.removeEventListener("pointerleave", onLeave);
        canvas.removeEventListener("webglcontextrestored", onRestored);
        root.dataset.state = "still";
        delete root.dataset.trans;
        delete root.dataset.world;
        if (noise && !r.lost) r.gl.deleteTexture(noise);
        r.destroy();
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
