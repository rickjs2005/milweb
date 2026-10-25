"use client";

import { useEffect, useRef } from "react";
import { onIdle } from "@/animations/idle";
import { getQuality, probeGpu } from "@/lib/quality";
import { useOs, useOsStore } from "../os-shell";
import { EYE_THEME_UNIFORM, OS_EYE } from "./eye.config";

/**
 * O olho do wallpaper — vivo, com duas identidades.
 *
 * FORA DE CENA desde a revisão 14: o fundo do OS agora é features/os/scene
 * (Tsukuyomi / Vazio Ilimitado) e o único olho visível é o do controle de
 * tema (theme-toggle.tsx). Este módulo não é montado nem empacotado; fica no
 * repositório porque o app Perfil o cita como evidência de código e porque
 * scripts/eye-still.mjs ainda gera as imagens dele (a capa de
 * compartilhamento usa public/art/eye-obito.webp). O CSS do olho saiu com ele.
 *
 * Camada visual, nunca interativa: `pointer-events: none`, aria-hidden. O
 * HTML entrega a IMAGEM (olho aberto, gerada pelo mesmo shader; o CSS escolhe
 * a do tema em vigor — Gojo claro ou Obito escuro — pelo `data-os-theme` do
 * <html>, então nunca aparece um olho escuro no tema claro, nem durante o
 * carregamento, nem sem WebGL, nem com movimento reduzido, nem com GPU
 * reprovada na sonda). Com GPU, o canvas monta em idle e entra por crossfade
 * — microanimações contínuas, o olhar segue o cursor com inércia (desktop)
 * ou deriva devagar (toque), piscadas espontâneas de vez em quando.
 *
 * Piscar ao clicar/tocar: um `pointerdown` em qualquer lugar da página
 * (ouvido na captura, passivo — nunca bloqueia o clique que o disparou)
 * fecha o olho em ~140 ms, segura ~70 ms e reabre em ~400 ms com um brilho
 * na íris. Cliques repetidos no meio da reabertura fecham de novo a partir
 * de onde a pálpebra está — nada salta. Os controles de tema ficam de fora
 * desse piscar: eles têm o próprio.
 *
 * Troca de tema: o olho se registra no store como driver (`setThemeDriver`).
 * Um pedido (`requestTheme`) fecha a pálpebra; com ela fechada o store
 * aplica o tema (`commitTheme` — a interface muda no escuro e o uniform da
 * íris acompanha) e, depois de uma pausa um pouco mais longa, o olho reabre
 * com a identidade nova e o brilho da cor dela. Pedidos durante a transição
 * só trocam o destino: a pálpebra nunca anima duas vezes ao mesmo tempo.
 *
 * Para quando a aba está oculta (renderer) e quando nada do olho está à
 * vista: janela maximizada no desktop, tela aberta no celular — menos
 * durante um piscar, que sempre termina.
 */
type Phase = "open" | "closing" | "hold" | "opening";

const easeInOut = (u: number) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
const easeOut = (u: number) => 1 - Math.pow(1 - u, 3);

export function OsEye() {
  const { store } = useOs();
  const shell = useOsStore((s) => s.shell);
  const motion = useOsStore((s) => s.prefs.motion);
  const ref = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fig = ref.current;
    const canvas = canvasRef.current;
    if (!fig || !canvas) return;
    if (shell === "auto" || shell === "simple" || motion === "reduce") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!getQuality().webgl) return;

    let disposed = false;
    let cleanup: (() => void) | null = null;
    const cancelIdle = onIdle(() => void boot(), 800);
    const mobile = shell === "mobile";
    const frame = mobile ? OS_EYE.mobile : OS_EYE.desktop;

    async function boot() {
      if (disposed) return;
      const gq = probeGpu();
      if (!gq.webgl) return;
      const [{ createRenderer }, { OS_EYE_FRAG }] = await Promise.all([import("@/webgl/renderer"), import("./eye-frag")]);
      if (disposed || !canvas) return;
      const r = createRenderer(canvas, { dpr: Math.min(gq.dpr, mobile ? 1.25 : 1.5), alpha: true });
      if (!r) return;
      try {
        r.addProgram("eye", OS_EYE_FRAG);
      } catch (e) {
        // Contexto perdido (GPU reiniciada, iOS com contextos demais): a imagem fica, sem erro no console.
        if (!(e instanceof Error && e.name === "ContextLostError")) console.error(e);
        r.destroy();
        return;
      }

      // ---- estado da cena (fora do React: muda a cada frame) ----
      const eye = { phase: "open" as Phase, lid: 0, from: 0, t0: 0, glow: 0, dilate: 0, nextAuto: 0, themed: false };
      const gaze = { x: 0, y: 0, tx: 0, ty: 0, mouseAt: -1e9 };
      const uTheme = () => EYE_THEME_UNIFORM[store.getState().prefs.theme];
      /** Fecha a pálpebra a partir de onde ela estiver; já fechando/fechada, nada muda. */
      const close = () => {
        if (eye.phase === "closing" || eye.phase === "hold") return;
        eye.phase = "closing";
        eye.from = eye.lid;
        eye.t0 = -1; // marcado no próximo frame
      };
      const blink = () => {
        close();
        r.invalidate();
      };
      /** Driver da troca de tema: fecha (ou aproveita o fechamento em curso) e deixa o commit para a pausa fechada. */
      const driveTheme = () => {
        eye.themed = true;
        close();
        r.invalidate();
        return true;
      };
      const onDown = (e: PointerEvent) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        // Os controles de tema têm o próprio piscar (via driver): aqui ficariam dois fechamentos no mesmo gesto.
        if ((e.target as Element | null)?.closest?.("[data-theme-toggle]")) return;
        // Telefone: o olhar vai ao ponto tocado (dedo = cursor por alguns segundos) e volta a derivar.
        if (mobile && e.pointerType !== "mouse" && fig) {
          const b = fig.getBoundingClientRect();
          if (b.width > 0 && b.height > 0) {
            gaze.tx = Math.max(-1, Math.min(1, (e.clientX - (b.left + b.width / 2)) / (b.width / 2)));
            gaze.ty = -Math.max(-1, Math.min(1, (e.clientY - (b.top + b.height / 2)) / (b.height / 2)));
            gaze.mouseAt = performance.now() / 1000;
          }
        }
        blink();
      };
      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        gaze.tx = Math.max(-1, Math.min(1, (e.clientX / window.innerWidth) * 2 - 1));
        gaze.ty = -Math.max(-1, Math.min(1, (e.clientY / window.innerHeight) * 2 - 1));
        gaze.mouseAt = performance.now() / 1000;
      };
      const onLeave = () => {
        gaze.mouseAt = -1e9;
      };

      let painted = false;
      r.onFrame((t, dt) => {
        r.clear();
        // Um piscar de tema é mais lento: a interface muda atrás da pálpebra e a íris nova merece a reabertura.
        const B = eye.themed ? { ...OS_EYE.blink, ...OS_EYE.themeBlink } : OS_EYE.blink;
        // ---- piscar ----
        if (eye.phase === "closing") {
          if (eye.t0 < 0) eye.t0 = t;
          const dur = B.close * (1 - eye.from) + 0.04;
          const u = Math.min(1, (t - eye.t0) / dur);
          eye.lid = eye.from + (1 - eye.from) * easeInOut(u);
          if (u >= 1) {
            eye.phase = "hold";
            eye.t0 = t;
          }
        } else if (eye.phase === "hold") {
          eye.lid = 1;
          // Pálpebra fechada: é agora que o tema pedido vira o tema em vigor (a pausa recomeça — a interface
          // transiciona no escuro). Um novo pedido que chegue ainda fechado aplica aqui também.
          if (store.getState().themePending !== null) {
            store.getState().commitTheme();
            eye.t0 = t;
          }
          if (t - eye.t0 >= B.hold) {
            eye.phase = "opening";
            eye.t0 = t;
            eye.glow = 1;
            eye.dilate = 1;
          }
        } else if (eye.phase === "opening") {
          const u = Math.min(1, (t - eye.t0) / B.open);
          eye.lid = 1 - easeOut(u);
          if (u >= 1) {
            eye.phase = "open";
            eye.lid = 0;
            eye.themed = false;
          }
        }
        eye.glow *= Math.exp(-dt / (B.glow * 0.3));
        eye.dilate *= Math.exp(-dt / (B.dilate * 0.4));
        // piscadas espontâneas
        if (eye.nextAuto === 0) eye.nextAuto = t + OS_EYE.auto.min + Math.random() * (OS_EYE.auto.max - OS_EYE.auto.min);
        if (eye.phase === "open" && t >= eye.nextAuto) {
          blink();
          eye.nextAuto = t + OS_EYE.auto.min + Math.random() * (OS_EYE.auto.max - OS_EYE.auto.min);
        }
        // ---- olhar: cursor recente manda; senão deriva devagar ----
        const recent = t - gaze.mouseAt < 4;
        const tx = recent ? gaze.tx : 0.22 * Math.sin(t * 0.23) + 0.08 * Math.sin(t * 0.71);
        const ty = recent ? gaze.ty : 0.10 * Math.sin(t * 0.17 + 1.0);
        const k = 1 - Math.pow(1 - OS_EYE.gaze.damp, dt * 60);
        gaze.x += (tx - gaze.x) * k;
        gaze.y += (ty - gaze.y) * k;

        r.draw("eye", {
          uRes: [canvas.width, canvas.height],
          uAspect: canvas.width / Math.max(1, canvas.height),
          uScale: frame.scale,
          uTime: t,
          uBlink: eye.lid,
          uGaze: [gaze.x, gaze.y],
          uGlow: eye.glow,
          uDilate: eye.dilate,
          uFade: 1,
          uEdge: frame.edge,
          uTheme: uTheme(),
        });
        if (!painted) {
          painted = true;
          fig!.dataset.state = "live";
        }
        // Um piscar sempre termina, mesmo com o olho "coberto" (sem hold): pede o próximo frame.
        if (eye.phase !== "open") r.invalidate();
      });

      // Sonda: um frame do shader real num buffer minúsculo, medido com gl.finish — sem GPU
      // utilizável a imagem fica e nenhum pixel visível foi gasto.
      const before = r.dpr;
      r.setDpr(0.12);
      r.resize();
      const p0 = performance.now();
      r.draw("eye", { uRes: [canvas.width, canvas.height], uAspect: frame.aspect, uScale: frame.scale, uTime: 0, uBlink: 0, uGaze: [0, 0], uGlow: 0, uDilate: 0, uFade: 1, uEdge: frame.edge, uTheme: uTheme() });
      r.gl.finish();
      const cost = performance.now() - p0;
      r.setDpr(before);
      if (cost > OS_EYE.probeBudgetMs) {
        r.destroy();
        return;
      }
      r.setFpsCap(gq.tier === "high" && cost < 1 ? OS_EYE.fpsHigh : OS_EYE.fpsLow);
      r.onSlow(() => r.setDpr(Math.max(1, r.dpr - 0.25)));

      // Frames contínuos só com o olho à vista: a aba oculta já para no renderer; uma janela
      // maximizada (desktop) ou uma tela aberta (celular) soltam o hold — zero rAF até voltar.
      let held: (() => void) | null = null;
      const sync = () => {
        const s = store.getState();
        const covered = s.shell === "mobile" ? s.focused !== null : s.order.some((id) => s.wins[id].open && !s.wins[id].min && s.wins[id].max);
        if (!covered && !held) held = r.hold();
        if (covered && held) {
          held();
          held = null;
        }
      };
      const unsub = store.subscribe(sync);
      sync();
      store.getState().setThemeDriver(driveTheme);
      window.addEventListener("pointerdown", onDown, { passive: true, capture: true });
      if (gq.fine) {
        window.addEventListener("pointermove", onMove, { passive: true });
        document.documentElement.addEventListener("pointerleave", onLeave);
      }
      r.invalidate();

      if (process.env.NODE_ENV !== "production") {
        (window as unknown as { __mwOsEye?: unknown }).__mwOsEye = {
          blink,
          get lid() {
            return eye.lid;
          },
          get phase() {
            return eye.phase;
          },
          get themed() {
            return eye.themed;
          },
          get frames() {
            return r.frames;
          },
          get held() {
            return !!held;
          },
          get dpr() {
            return r.dpr;
          },
          gaze,
        };
      }

      cleanup = () => {
        unsub();
        held?.();
        const st = store.getState();
        st.setThemeDriver(null);
        // Um tema pedido e ainda não aplicado não fica pendurado quando o olho sai de cena.
        if (st.themePending !== null) st.commitTheme();
        window.removeEventListener("pointerdown", onDown, { capture: true });
        window.removeEventListener("pointermove", onMove);
        document.documentElement.removeEventListener("pointerleave", onLeave);
        fig!.dataset.state = "still";
        r.destroy();
        if (process.env.NODE_ENV !== "production") delete (window as unknown as { __mwOsEye?: unknown }).__mwOsEye;
      };
    }

    return () => {
      disposed = true;
      cancelIdle();
      cleanup?.();
    };
  }, [shell, motion, store]);

  // Telefone: microparalaxe pelo giroscópio (só onde não exige permissão — Android; iOS pediria um prompt),
  // em variáveis CSS lidas por styles/os-mobile.css. Nada com movimento reduzido; zero custo sem sensor.
  useEffect(() => {
    const fig = ref.current;
    if (!fig || shell !== "mobile" || motion === "reduce") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const DOE = (window as unknown as { DeviceOrientationEvent?: { requestPermission?: unknown } }).DeviceOrientationEvent;
    if (!DOE || typeof DOE.requestPermission === "function") return;
    let raf = 0;
    let tx = 0;
    let ty = 0;
    let x = 0;
    let y = 0;
    let base: { g: number; b: number } | null = null;
    const clamp = (v: number) => Math.max(-1, Math.min(1, v));
    const tick = () => {
      raf = 0;
      x += (tx - x) * 0.12;
      y += (ty - y) * 0.12;
      fig.style.setProperty("--par-x", x.toFixed(3));
      fig.style.setProperty("--par-y", y.toFixed(3));
      if (Math.abs(tx - x) > 0.002 || Math.abs(ty - y) > 0.002) raf = requestAnimationFrame(tick);
    };
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null || document.hidden) return;
      if (!base) base = { g: e.gamma, b: e.beta }; // a pose em que o telefone está é o neutro
      tx = clamp((e.gamma - base.g) / 25);
      ty = clamp((e.beta - base.b) / 25);
      if (!raf) raf = requestAnimationFrame(tick);
    };
    window.addEventListener("deviceorientation", onOrient, { passive: true });
    return () => {
      window.removeEventListener("deviceorientation", onOrient);
      if (raf) cancelAnimationFrame(raf);
      fig.style.removeProperty("--par-x");
      fig.style.removeProperty("--par-y");
    };
  }, [shell, motion]);

  return (
    <figure ref={ref} className="os-eye" data-state="still" aria-hidden="true" data-no-inspect>
      {/* A imagem é um fundo CSS (styles/os.css): o tema do <html> escolhe Gojo ou Obito, desktop ou celular — só essa é baixada. */}
      <div className="os-eye__still" role="presentation" />
      <canvas ref={canvasRef} className="os-eye__canvas" />
    </figure>
  );
}
