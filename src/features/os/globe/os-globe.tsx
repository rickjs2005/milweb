"use client";

import { useEffect, useRef } from "react";
import { onIdle } from "@/animations/idle";
import { getQuality, probeGpu } from "@/lib/quality";
import { useOs, useOsStore } from "../os-shell";
import { OS_GLOBE, OS_GLOBE_STILL } from "./globe.config";

/**
 * O globo do wallpaper — a Terra em grafite, Brasil → Mundo.
 *
 * Camada visual, nunca interativa: `pointer-events: none`, aria-hidden. O
 * HTML entrega a IMAGEM (gerada a partir do mesmo shader, na pose de
 * repouso): é o que o celular usa sempre, o que aparece com movimento
 * reduzido ou sem GPU, e o que se vê no desktop até o canvas assentar.
 *
 * No desktop, com movimento permitido e GPU aprovada por sonda, o canvas
 * monta em idle e entra por crossfade; gira devagar, segue o cursor com
 * inércia, para quando a aba está oculta (renderer) ou quando uma janela
 * maximizada o cobre (store), e volta para a imagem se o visitante reduzir
 * o movimento nos Ajustes.
 */
export function OsGlobe() {
  const { store } = useOs();
  const shell = useOsStore((s) => s.shell);
  const motion = useOsStore((s) => s.prefs.motion);
  const ref = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fig = ref.current;
    const canvas = canvasRef.current;
    if (!fig || !canvas) return;
    if (shell !== "desktop" || motion === "reduce") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!getQuality().webgl) return;

    let disposed = false;
    let cleanup: (() => void) | null = null;
    const cancelIdle = onIdle(() => void boot(), 800);

    async function boot() {
      if (disposed) return;
      const gq = probeGpu();
      if (!gq.webgl) return;
      const [{ createRenderer }, { OS_GLOBE_FRAG }, { createEarthMask }] = await Promise.all([import("@/webgl/renderer"), import("./globe-frag"), import("@/webgl/earth-mask")]);
      if (disposed || !canvas) return;
      const r = createRenderer(canvas, { dpr: Math.min(gq.dpr, 1.5), alpha: true });
      if (!r) return;
      try {
        r.addProgram("globe", OS_GLOBE_FRAG);
      } catch (e) {
        console.error(e);
        r.destroy();
        return;
      }
      const mask = createEarthMask(2);
      r.texture("earth", mask);
      const texel: [number, number] = [1 / mask.width, 1 / mask.height];
      const tex = () => [{ name: "uTex", tex: r.getTexture("earth")!, unit: 0 }];

      // Cursor: alvo em [-1, 1] pela posição na janela; o valor usado persegue o alvo com inércia.
      const pointer = { tx: 0, ty: 0, x: 0, y: 0 };
      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        pointer.tx = Math.max(-1, Math.min(1, (e.clientX / window.innerWidth) * 2 - 1));
        pointer.ty = Math.max(-1, Math.min(1, (e.clientY / window.innerHeight) * 2 - 1));
      };
      const onLeave = () => {
        pointer.tx = 0;
        pointer.ty = 0;
      };

      let t0 = -1;
      let painted = false;
      r.onFrame((t, dt) => {
        r.clear();
        if (t0 < 0) t0 = t;
        const el = t - t0;
        const k = 1 - Math.pow(1 - OS_GLOBE.pointer.damp, dt * 60);
        pointer.x += (pointer.tx - pointer.x) * k;
        pointer.y += (pointer.ty - pointer.y) * k;
        r.draw(
          "globe",
          {
            uRes: [canvas.width, canvas.height],
            uCenter: [canvas.width * 0.5, canvas.height * 0.5],
            uRadius: Math.max(1, canvas.width * 0.5 * OS_GLOBE.fill),
            uSpin: OS_GLOBE.spinHome - el * OS_GLOBE.spinSpeed + pointer.x * OS_GLOBE.pointer.yaw,
            uTilt: OS_GLOBE.tilt + pointer.y * OS_GLOBE.pointer.pitch,
            uTime: el,
            uFade: 1,
            uLive: 1,
            uTexel: texel,
          },
          tex(),
        );
        if (!painted) {
          painted = true;
          fig!.dataset.state = "live";
        }
      });

      // Sonda: um frame do shader real num buffer minúsculo, medido com gl.finish.
      // Sem GPU utilizável o canvas não monta e a imagem fica — nenhum pixel visível foi gasto.
      const before = r.dpr;
      r.setDpr(0.12);
      r.resize();
      const p0 = performance.now();
      r.draw("globe", { uRes: [canvas.width, canvas.height], uCenter: [canvas.width * 0.5, canvas.height * 0.5], uRadius: canvas.width * 0.45, uSpin: OS_GLOBE.spinHome, uTilt: OS_GLOBE.tilt, uTime: 0, uFade: 1, uLive: 0, uTexel: texel }, tex());
      r.gl.finish();
      const cost = performance.now() - p0;
      r.setDpr(before);
      if (cost > OS_GLOBE.probeBudgetMs) {
        r.destroy();
        return;
      }
      r.setFpsCap(gq.tier === "high" && cost < 0.8 ? OS_GLOBE.fpsHigh : OS_GLOBE.fpsLow);
      r.onSlow(() => r.setDpr(Math.max(1, r.dpr - 0.25)));

      // Frames contínuos só enquanto o globo está à vista: a aba oculta já para no renderer;
      // uma janela maximizada por cima solta o hold (zero rAF até ela restaurar).
      let held: (() => void) | null = null;
      const sync = () => {
        const s = store.getState();
        const covered = s.order.some((id) => s.wins[id].open && !s.wins[id].min && s.wins[id].max);
        if (!covered && !held) held = r.hold();
        if (covered && held) {
          held();
          held = null;
        }
      };
      const unsub = store.subscribe(sync);
      sync();
      if (gq.fine) {
        window.addEventListener("pointermove", onMove, { passive: true });
        document.documentElement.addEventListener("pointerleave", onLeave);
      }
      r.invalidate();

      if (process.env.NODE_ENV !== "production") {
        (window as unknown as { __mwOsGlobe?: unknown }).__mwOsGlobe = {
          get frames() {
            return r.frames;
          },
          get held() {
            return !!held;
          },
          get dpr() {
            return r.dpr;
          },
          pointer,
        };
      }

      cleanup = () => {
        unsub();
        held?.();
        window.removeEventListener("pointermove", onMove);
        document.documentElement.removeEventListener("pointerleave", onLeave);
        fig!.dataset.state = "still";
        r.destroy();
        if (process.env.NODE_ENV !== "production") delete (window as unknown as { __mwOsGlobe?: unknown }).__mwOsGlobe;
      };
    }

    return () => {
      disposed = true;
      cancelIdle();
      cleanup?.();
    };
  }, [shell, motion, store]);

  return (
    <figure ref={ref} className="os-globe" data-state="still" aria-hidden="true" data-no-inspect>
      {/* eslint-disable-next-line @next/next/no-img-element -- WebP já otimizado, gerado do próprio shader; a dimensão é fixa pelo CSS */}
      <img
        src={OS_GLOBE_STILL.src}
        srcSet={`${OS_GLOBE_STILL.small} 800w, ${OS_GLOBE_STILL.src} ${OS_GLOBE_STILL.size}w`}
        sizes="(max-width: 719px) 72vw, 44vw"
        width={OS_GLOBE_STILL.size}
        height={OS_GLOBE_STILL.size}
        alt=""
        decoding="async"
        fetchPriority="high"
        className="os-globe__still"
      />
      <canvas ref={canvasRef} className="os-globe__canvas" />
    </figure>
  );
}
