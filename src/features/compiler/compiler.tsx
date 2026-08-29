"use client";

import { useEffect, useRef } from "react";
import { gsap, EASE, ScrollTrigger } from "@/animations/gsap";
import { onIdle } from "@/animations/idle";
import { getQuality, probeGpu } from "@/lib/quality";
import { compiler, PRESETS, type CompilerStateName } from "./store";
import { heroPlacement } from "@/sections/home/boot-controller";
import { sound, type SoundName } from "@/features/sound/sound";

/**
 * O único canvas da Home. Fixo atrás do conteúdo (z-index entre os fundos
 * das seções e o texto), desenha a escultura em todos os seus estados e o
 * Event Horizon do Lab. Carrega o renderer + shader sob demanda no idle,
 * só em perfis HIGH/MEDIUM; LOW/reduced usam o <CompilerFallback/> do hero.
 *
 * Posicionamento: ScrollTriggers por seção escrevem no store (centro,
 * raio, preset). O renderer só roda frames enquanto algo muda (tween,
 * ponteiro, anel interno visível) e pausa com a aba oculta.
 */
export function Compiler() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const q = getQuality();
    if (!q.webgl) return;
    let disposed = false;
    let cleanup: (() => void) | null = null;

    // A compilação do shader e o upload da textura custam uma tarefa longa —
    // pagá-la durante o carregamento seria trocar performance por efeito. Ela
    // acontece na PRIMEIRA INTERAÇÃO (mover o mouse, rolar, tocar, teclar),
    // quando a página já está pronta e o custo não entra no caminho crítico.
    // Até lá a silhueta em SVG ocupa o lugar — e em quem nunca interage
    // (crawler, auditoria) ela é a versão final.
    let armed = false;
    const EVENTS = ["pointermove", "wheel", "touchstart", "keydown", "scroll"] as const;
    const disarm = () => EVENTS.forEach((e) => window.removeEventListener(e, arm));
    function arm() {
      if (armed || disposed) return;
      armed = true;
      disarm();
      cancelIdle = onIdle(boot, 400);
    }
    EVENTS.forEach((e) => window.addEventListener(e, arm, { passive: true }));
    let cancelIdle: () => void = () => {};

    const boot = async () => {
      if (disposed) return;
      // agora sim: o teste de GPU (compila um shader curto) — fora do caminho crítico
      const gq = probeGpu();
      if (!gq.webgl) return;
      const [{ createRenderer }, { COMPILER_FRAG }, { createInterfaceTexture }] = await Promise.all([import("@/webgl/renderer"), import("@/webgl/compiler-frag"), import("@/webgl/interface-texture")]);
      if (disposed) return;
      const r = createRenderer(canvas, { dpr: gq.dpr, alpha: true });
      if (!r) return;
      try {
        r.addProgram("compiler", COMPILER_FRAG);
      } catch (e) {
        console.error(e);
        r.destroy();
        return;
      }
      const iface = createInterfaceTexture();
      r.texture("iface", iface.canvas);
      // o texto atrás do vidro entra numa tarefa separada (nunca uma tarefa longa)
      const paintText = () => {
        iface.drawText();
        r.texture("iface", iface.canvas);
      };
      setTimeout(paintText, 0);
      const v = compiler.values;
      let steps = gq.steps;
      const sm = { x: 0, y: 0 };
      let heldRelease: (() => void) | null = null;

      r.onFrame((t) => {
        // ponteiro com inércia (campo magnético)
        sm.x += (compiler.pointer.x - sm.x) * 0.08;
        sm.y += (compiler.pointer.y - sm.y) * 0.08;
        r.clear();
        if (v.opacity <= 0.001 && v.lab <= 0.001) return;
        r.draw(
          "compiler",
          {
            uRes: [canvas.width, canvas.height],
            uTime: t,
            uPointer: [sm.x, sm.y],
            uCenter: [v.cx, v.cy],
            uScale: v.scale * v.opacity,
            uAssemble: v.assemble,
            uSpread: v.spread,
            uFlatten: v.flatten,
            uWarm: v.warm,
            uRingSpd: v.ringSpd,
            uScan: v.scan,
            uCollapse: v.collapse,
            uAnomaly: v.anomaly,
            uLab: v.lab,
            uInk: v.ink,
            uSteps: steps,
            uHorizonK: 1,
          },
          [{ name: "uTex", tex: r.getTexture("iface")!, unit: 0 }],
        );
      });
      // ---- PROBE DE CUSTO (antes de qualquer pixel visível) ----------------
      // Um frame do shader REAL num buffer minúsculo (DPR 0.12 ≈ 170×100 px),
      // medido com gl.finish. Em GPU real custa frações de ms; sem GPU (driver
      // em software, headless, aparelho muito fraco) custa dezenas. É o que
      // decide, em ~1 frame, se a escultura roda ou se o SVG assume — antes de
      // consumir a thread principal.
      const probe = () => {
        const before = r.dpr;
        r.setDpr(0.12);
        r.resize();
        const t0 = performance.now();
        r.draw("compiler", { uRes: [canvas.width, canvas.height], uTime: 0, uPointer: [0, 0], uCenter: [0.5, 0.5], uScale: 0.4, uAssemble: 1, uSpread: 0.3, uFlatten: 0, uWarm: 0, uRingSpd: 0.3, uScan: 0, uCollapse: 0, uAnomaly: 0, uLab: 0, uInk: 0, uSteps: steps, uHorizonK: 1 }, [{ name: "uTex", tex: r.getTexture("iface")!, unit: 0 }]);
        r.gl.finish();
        const ms = performance.now() - t0;
        r.setDpr(before);
        return ms;
      };
      const cost = probe();
      if (cost > 4) {
        // Sem GPU utilizável: silhueta em SVG, zero custo contínuo.
        document.documentElement.setAttribute("data-quality", "low");
        r.destroy();
        return;
      }
      if (cost > 1.2) {
        steps = Math.max(24, Math.round(steps * 0.6));
        r.setDpr(1);
        document.documentElement.setAttribute("data-quality", "medium");
      }

      // Teto de quadros: a escultura tem movimento lento (anel + deriva), 30 fps
      // bastam e cortam metade do custo de GPU. Tweens continuam suaves porque
      // o GSAP interpola por tempo, não por frame.
      r.setFpsCap(gq.tier === "high" && cost < 0.6 ? 40 : 30);

      // Degradação em runtime: frames lentos → menos passos e DPR menor, uma vez.
      r.onSlow(() => {
        steps = Math.max(24, Math.round(steps * 0.6));
        r.setDpr(Math.max(1, r.dpr - 0.25));
        document.documentElement.setAttribute("data-quality", "medium");
      });



      compiler.invalidate = () => r.invalidate();
      compiler.hold = () => r.hold();
      compiler.mounted = true;

      // A escultura tem partes internas em movimento: frames contínuos só
      // enquanto ela está visível na tela (opacidade > 0) — caso contrário,
      // nenhum frame. `visibleHold` liga/desliga conforme o store.
      const syncHold = () => {
        const live = v.opacity > 0.001 || v.lab > 0.001;
        if (live && !heldRelease) heldRelease = r.hold();
        if (!live && heldRelease) {
          heldRelease();
          heldRelease = null;
          r.invalidate();
        }
      };
      const unsub = compiler.subscribe(syncHold);
      syncHold();

      // textura da interface: fontes prontas + resize + tema (dev mode)
      const redraw = () => {
        iface.draw();
        r.texture("iface", iface.canvas);
        setTimeout(paintText, 0);
      };
      document.fonts?.ready.then(() => !disposed && setTimeout(paintText, 0));
      let rt = 0;
      const onResize = () => {
        clearTimeout(rt);
        rt = window.setTimeout(redraw, 300);
      };
      window.addEventListener("resize", onResize);
      const mo = new MutationObserver(() => {
        v.ink = document.documentElement.getAttribute("data-mode") === "dev" ? 1 : 0;
        redraw();
      });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-mode"] });

      // ponteiro (só ponteiro fino; no touch a escultura deriva sozinha)
      const onMove = (e: PointerEvent) => {
        compiler.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
        compiler.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
      };
      if (gq.fine) window.addEventListener("pointermove", onMove, { passive: true });

      canvas.dataset.ready = "1";
      document.documentElement.setAttribute("data-compiler", "on");
      // a silhueta SVG sai e o canvas entra no mesmo lugar: sem salto
      compiler.notify();
      r.invalidate();

      cleanup = () => {
        unsub();
        heldRelease?.();
        window.removeEventListener("resize", onResize);
        window.removeEventListener("pointermove", onMove);
        mo.disconnect();
        compiler.mounted = false;
        compiler.invalidate = () => {};
        compiler.hold = () => () => {};
        document.documentElement.removeAttribute("data-compiler");
        r.destroy();
      };
    };

    return () => {
      disposed = true;
      disarm();
      cancelIdle();
      cleanup?.();
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="compiler-canvas pointer-events-none fixed inset-0 h-[100dvh] w-full opacity-0 transition-opacity duration-slow data-[ready]:opacity-100" data-inspect="CANVAS / THE COMPILER" />;
}

/** Interpola o store para um preset (+ overrides de posição). */
export function compileTo(state: CompilerStateName, extra: Partial<typeof compiler.values> = {}, opts: { duration?: number; ease?: gsap.EaseFunction | string } = {}) {
  compiler.state = state;
  const target = { ...PRESETS[state], ...extra };
  const release = compiler.hold();
  gsap.to(compiler.values, {
    ...target,
    duration: opts.duration ?? 1.2,
    ease: opts.ease ?? EASE.inOutQuart,
    overwrite: "auto",
    onUpdate: () => compiler.notify(),
    onComplete: () => {
      release();
      compiler.notify();
    },
    onInterrupt: release,
  });
}

/**
 * Coreografia da Home amarrada ao scroll: hero → mundos → lab → break →
 * contato. Usa `[data-act]`/ids que já existem; nada aqui cria DOM.
 * Montado uma vez pela Home (client), abaixo do Boot.
 */
export function CompilerScrollDirector() {
  useEffect(() => {
    if (!getQuality().webgl) return;
    const mm = gsap.matchMedia();
    const cancel = onIdle(() => {
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const v = compiler.values;
        const hero = document.getElementById("top");
        const work = document.getElementById("work");
        const lab = document.getElementById("lab");
        const brk = document.getElementById("break");
        const human = document.getElementById("human");
        const contact = document.getElementById("contact");
        const worlds = work ? Array.from(work.querySelectorAll<HTMLElement>("[data-world]")) : [];
        const wide = window.innerWidth >= 1080;
        const triggers: ScrollTrigger[] = [];

        // HERO: a escultura vive à direita, grande; encolhe e vai para o canto
        // quando o hero termina o pin (rumo ao primeiro mundo).
        if (hero) {
          triggers.push(
            ScrollTrigger.create({
              trigger: hero,
              start: "top top",
              end: "bottom top",
              onUpdate: (st) => {
                const p = st.progress;
                if (compiler.state !== "assembled") return;
                const h = heroPlacement();
                v.cx = gsap.utils.interpolate(h.cx, wide ? 0.82 : 0.78, p);
                v.cy = gsap.utils.interpolate(h.cy, wide ? 0.28 : 0.8, p);
                v.scale = gsap.utils.interpolate(h.scale, wide ? 0.16 : 0.1, p);
                compiler.notify();
                compiler.invalidate();
              },
            }),
          );
        }
        // MUNDOS: cada painel muda as leis da escultura.
        const stateOf: Record<string, CompilerStateName> = { "kavita-drones": "kavita", terral: "terral", "atelier-vertex": "vertex", "aurex-timepieces": "aurex" };
        // A escultura ocupa a coluna vazia à esquerda, na meia-altura: nunca
        // sobre a headline (que vive embaixo) nem sobre a mídia (à direita).
        const placeWorld = (name: CompilerStateName) => ({
          cx: wide ? 0.21 : 0.5,
          cy: wide ? 0.58 : 0.86,
          scale: wide ? (name === "kavita" ? 0.21 : 0.17) : 0.1,
          opacity: 1,
          ink: name === "aurex" ? 1 : 0,
        });
        const cue: Partial<Record<CompilerStateName, SoundName>> = { kavita: "scan", terral: "paper", aurex: "mech", lab: "horizon" };
        worlds.forEach((panel) => {
          const name = stateOf[panel.dataset.world ?? ""] ?? "assembled";
          const place = () => {
            compileTo(name, placeWorld(name), { duration: 1.4 });
            const c = cue[name];
            if (c) sound.play(c);
          };
          triggers.push(ScrollTrigger.create({ trigger: panel, start: "top 60%", end: "bottom 40%", onEnter: place, onEnterBack: place }));
        });
        if (worlds[0]) {
          triggers.push(ScrollTrigger.create({ trigger: worlds[0], start: "top 60%", onLeaveBack: () => compileTo("assembled", { cx: wide ? 0.82 : 0.78, cy: wide ? 0.28 : 0.8, scale: wide ? 0.16 : 0.1, opacity: 1, ink: 0 }) }));
        }
        // LAB: o horizonte absorve a página — e a escultura.
        if (lab) {
          triggers.push(
            ScrollTrigger.create({
              trigger: lab,
              start: "top 85%",
              end: "bottom 15%",
              onUpdate: (st) => {
                const p = st.progress;
                // 0→0.3 entra, 0.7→1 sai
                v.lab = p < 0.3 ? gsap.utils.clamp(0, 1, p / 0.3) : p > 0.7 ? gsap.utils.clamp(0, 1, (1 - p) / 0.3) : 1;
                v.cx = 0.5;
                v.cy = 0.5;
                v.scale = gsap.utils.interpolate(0.12, 0.02, gsap.utils.clamp(0, 1, p * 1.6));
                compiler.notify();
                compiler.invalidate();
              },
              onEnter: () => {
                compileTo("lab", { opacity: 1, ink: 1 }, { duration: 1 });
                sound.play("horizon");
              },
              onEnterBack: () => compileTo("lab", { opacity: 1, ink: 1 }, { duration: 1 }),
              onLeave: () => compileTo("assembled", { opacity: 0, lab: 0, ink: 0 }, { duration: 0.6 }),
              onLeaveBack: () => compileTo("aurex", { cx: wide ? 0.2 : 0.8, cy: 0.55, scale: 0.14, opacity: 1, lab: 0, ink: 1 }, { duration: 1 }),
            }),
          );
        }
        // BREAK: a escultura reaparece pequena, tentando reconstruir (o Break liga a anomalia).
        if (brk) {
          triggers.push(
            ScrollTrigger.create({
              trigger: brk,
              start: "top 50%",
              end: "bottom 50%",
              onEnter: () => compileTo("assembled", { cx: wide ? 0.86 : 0.8, cy: 0.62, scale: 0.12, opacity: 1, lab: 0, ink: 0 }),
              onEnterBack: () => compileTo("assembled", { cx: wide ? 0.86 : 0.8, cy: 0.62, scale: 0.12, opacity: 1, lab: 0, ink: 0 }),
            }),
          );
        }
        // HUMAN: some — o humano não precisa da máquina.
        if (human) {
          triggers.push(
            ScrollTrigger.create({
              trigger: human,
              start: "top 60%",
              end: "bottom 40%",
              onEnter: () => compileTo("assembled", { opacity: 0 }, { duration: 0.8 }),
              onEnterBack: () => compileTo("assembled", { opacity: 0 }, { duration: 0.8 }),
            }),
          );
        }
        // CONTACT: colapsa numa linha — a régua da interface.
        if (contact) {
          triggers.push(
            ScrollTrigger.create({
              trigger: contact,
              start: "top 70%",
              onEnter: () => compileTo("collapsed", { cx: 0.5, cy: 0.5, scale: 0.4, opacity: 1, ink: 0, lab: 0 }, { duration: 1.6, ease: EASE.outQuint }),
              onLeaveBack: () => compileTo("assembled", { opacity: 0 }, { duration: 0.8 }),
            }),
          );
        }
        return () => triggers.forEach((t) => t.kill());
      });
    }, 900);
    return () => {
      cancel();
      mm.revert();
    };
  }, []);
  return null;
}
