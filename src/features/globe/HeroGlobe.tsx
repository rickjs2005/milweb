"use client";

import { useEffect, useRef } from "react";
import { onIdle } from "@/animations/idle";
import { getQuality, probeGpu } from "@/lib/quality";
import { GLOBE_EXIT, GLOBE_GLYPH, GLOBE_MOTION, GLOBE_POINTER } from "./globe.config";
import { globe, globeFrame } from "./globe-store";
import { measureOrb, orbTarget, type OrbGeom } from "./orb-metrics";

/**
 * O canvas do globo. Vive DENTRO da section do Hero (`absolute inset-0`), não
 * fixo na janela: a section é pinada, então o canvas acompanha o pin sem
 * portal e sem contexto de empilhamento inventado. Fica ABAIXO da manchete
 * (z-2) de propósito — assim o globo nunca cobre texto, e como o "O" do DOM
 * fica transparente no instante da troca, ele aparece exatamente no buraco
 * que a letra deixou.
 *
 * Política de montagem: igual à da escultura. O HTML entrega o SVG; o canvas
 * só monta depois da PRIMEIRA INTERAÇÃO, com a aba visível, sem
 * reduced-motion e com a GPU aprovada por uma sonda de 1 frame. Se reprovar,
 * `html[data-globe="off"]` acende o SVG e nada mais roda.
 */
export function HeroGlobe({ hero }: { hero: () => HTMLElement | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const root = document.documentElement;
    const off = () => root.setAttribute("data-globe", "off");
    const q = getQuality();
    if (!q.webgl) {
      off();
      return;
    }

    let disposed = false;
    let cleanup: (() => void) | null = null;
    let armed = false;
    let cancelIdle: () => void = () => {};
    const EVENTS = ["pointermove", "wheel", "touchstart", "keydown", "scroll"] as const;
    const disarm = () => EVENTS.forEach((e) => window.removeEventListener(e, arm));
    function arm() {
      if (armed || disposed) return;
      armed = true;
      disarm();
      cancelIdle = onIdle(() => void boot(), 400);
    }
    EVENTS.forEach((e) => window.addEventListener(e, arm, { passive: true }));

    const boot = async () => {
      if (disposed) return;
      const gq = probeGpu();
      if (!gq.webgl) return off();
      const [{ createRenderer }, { GLOBE_FRAG }, { createEarthMask }] = await Promise.all([import("@/webgl/renderer"), import("@/webgl/globe-frag"), import("@/webgl/earth-mask")]);
      if (disposed) return;
      const small = window.innerWidth < 768 || !gq.fine;
      const r = createRenderer(canvas, { dpr: Math.min(gq.dpr, small ? 1.25 : 1.5), alpha: true });
      if (!r) return off();
      try {
        r.addProgram("globe", GLOBE_FRAG);
      } catch (e) {
        console.error(e);
        r.destroy();
        return off();
      }
      r.texture("earth", createEarthMask());

      const orb: OrbGeom = { cx: 0, cy: 0, rx: 10, ry: 10, ok: false };
      let box = canvas.getBoundingClientRect();
      const orbEl = () => hero()?.querySelector<HTMLElement>("[data-orb]") ?? null;

      // O mouse: alvo em [-1, 1] a partir da posição na janela; o valor que o
      // shader recebe (x, y) persegue o alvo no loop, com amortecimento por
      // tempo. Só com ponteiro fino e fora do celular — no touch não existe
      // "posição do cursor", e a deriva continua sendo a vida do globo.
      const pointer = { tx: 0, ty: 0, x: 0, y: 0 };
      const usePointer = gq.fine && window.innerWidth >= 768;
      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        pointer.tx = Math.max(-1, Math.min(1, (e.clientX / window.innerWidth) * 2 - 1));
        pointer.ty = Math.max(-1, Math.min(1, (e.clientY / window.innerHeight) * 2 - 1));
      };
      const onLeave = () => {
        pointer.tx = 0;
        pointer.ty = 0;
      };
      if (usePointer) {
        window.addEventListener("pointermove", onMove, { passive: true });
        document.documentElement.addEventListener("pointerleave", onLeave);
      }

      r.onFrame((t, dt) => {
        r.clear();
        const f = globeFrame;
        if (f.fade <= 0.002) return;
        box = canvas.getBoundingClientRect();
        measureOrb(orbEl(), box, orb);
        if (!orb.ok) return;
        const tiny = window.innerWidth < 768;
        const tg = orbTarget(box, tiny, hero());
        const EX = tiny ? GLOBE_EXIT.mobile : GLOBE_EXIT.desktop;
        // migração: da letra até a posição final; acima de 1 é a SAÍDA (cresce e
        // escapa pela lateral enquanto o Selected Work sobe)
        const m = Math.min(1, f.migrate);
        const out = Math.max(0, f.migrate - 1);
        // Arco: o eixo X vai NA FRENTE e o raio fica atrás. O globo nasce dentro
        // da palavra, então qualquer caminho cruza a manchete; o que decide se
        // isso lê bem é o TAMANHO no momento da travessia. Saindo primeiro na
        // horizontal (out-quad) e inflando depois (smoothstep), ele passa pela
        // linha ainda pequeno e só cresce no vazio da direita. Subir primeiro,
        // que foi a primeira versão, deixava uma esfera média parada em cima de
        // "CÓDIGOS" — lia como bolinha solta, não como o mundo saindo da frase.
        const mx = 1 - Math.pow(1 - m, 2.4);
        const my = 1 - Math.pow(1 - m, 1.5);
        const mr = m * m * (3 - 2 * m);
        const rx = orb.rx + (tg.r - orb.rx) * mr;
        const ry = orb.ry + (tg.r - orb.ry) * mr;
        const scale = 1 + (EX.scale - 1) * out;
        // A fuga vertical segue a faixa em que o globo pousou: no celular ele às
        // vezes termina ACIMA da manchete (telas baixas, ver orbTarget) e, se
        // saísse para baixo como no desktop, encostaria no texto na despedida.
        const dy = tg.cy < box.height * 0.45 ? -Math.abs(EX.dy) : EX.dy;
        const cx = orb.cx + (tg.cx - orb.cx) * mx + box.width * EX.dx * out;
        const cy = orb.cy + (tg.cy - orb.cy) * my + box.height * dy * out;
        const dpr = r.dpr;
        // inércia: fração do caminho por frame, normalizada para 60 fps
        const k = 1 - Math.pow(1 - GLOBE_POINTER.damp, dt * 60);
        pointer.x += (pointer.tx - pointer.x) * k;
        pointer.y += (pointer.ty - pointer.y) * k;
        // o mouse só manda depois que a esfera está formada (o marcador acende
        // em `formed`); antes disso a transformação do "O" é só do scroll
        const look = f.mark;
        r.draw(
          "globe",
          {
            uRes: [canvas.width, canvas.height],
            uCenter: [cx * dpr, cy * dpr],
            uRadius: Math.max(1, ry * scale * dpr),
            uAspect: rx / Math.max(0.001, ry),
            uStroke: GLOBE_GLYPH.stroke,
            uMorph: f.morph,
            uDepth: f.depth,
            uLand: f.land,
            uMesh: f.mesh,
            uMark: f.mark,
            uFade: f.fade,
            uSpin: GLOBE_MOTION.spinHome - (1 - m) * GLOBE_MOTION.spinFromScroll + Math.sin(t * GLOBE_MOTION.driftSpeed) * GLOBE_MOTION.drift + pointer.x * GLOBE_POINTER.yaw * look,
            uTilt: GLOBE_MOTION.tilt + Math.sin(t * 0.11) * GLOBE_MOTION.tiltWobble + pointer.y * GLOBE_POINTER.pitch * look,
            uTime: t,
            uInk: root.getAttribute("data-mode") === "dev" ? 1 : 0,
          },
          [{ name: "uTex", tex: r.getTexture("earth")!, unit: 0 }],
        );
      });

      // Sonda: um frame do shader REAL num buffer minúsculo, medido com
      // gl.finish. Decide em ~1 frame se há GPU utilizável, antes de qualquer
      // pixel visível (mesmo procedimento da escultura).
      const before = r.dpr;
      r.setDpr(0.12);
      r.resize();
      const t0 = performance.now();
      r.draw("globe", { uRes: [canvas.width, canvas.height], uCenter: [canvas.width * 0.5, canvas.height * 0.5], uRadius: canvas.height * 0.4, uAspect: 1, uStroke: 0.3, uMorph: 1, uDepth: 1, uLand: 1, uMesh: 1, uMark: 1, uFade: 1, uSpin: 0, uTilt: -0.36, uInk: 0, uTime: 1 }, [{ name: "uTex", tex: r.getTexture("earth")!, unit: 0 }]);
      r.gl.finish();
      const cost = performance.now() - t0;
      r.setDpr(before);
      if (cost > GLOBE_MOTION.probeBudgetMs) {
        r.destroy();
        root.setAttribute("data-quality", "low");
        return off();
      }
      r.setFpsCap(gq.tier === "high" && cost < 0.8 ? GLOBE_MOTION.fpsHigh : GLOBE_MOTION.fpsLow);
      r.onSlow(() => r.setDpr(Math.max(1, r.dpr - 0.25)));

      // frames contínuos só enquanto o globo está em cena (o giro é contínuo);
      // fora disso, zero rAF
      let held: (() => void) | null = null;
      // O globo NÃO se apaga no fim do Hero (ver GLOBE_EXIT): ele sai pela
      // lateral ainda visível. Sem esta trava o rAF continuaria rodando para
      // sempre depois que a section saiu da tela.
      let onScreen = true;
      const io = new IntersectionObserver(
        ([e]) => {
          onScreen = e.isIntersecting;
          globe.sync();
        },
        { rootMargin: "15%" },
      );
      io.observe(canvas);
      globe.mounted = true;
      globe.invalidate = () => r.invalidate();
      globe.sync = () => {
        const live = globeFrame.fade > 0.002 && onScreen;
        if (live && !held) held = r.hold();
        if (!live && held) {
          held();
          held = null;
          r.invalidate();
        }
      };
      globe.sync();
      canvas.dataset.ready = "1";
      root.setAttribute("data-globe", "on");
      r.invalidate();
      // Sonda de auditoria (fora de produção): a cena do globo é toda derivada
      // do progresso, então poder LER o estado do frame é o que torna possível
      // conferir por checkpoint em vez de por captura de tela.
      if (process.env.NODE_ENV !== "production") {
        (window as unknown as { __mwGlobe?: unknown }).__mwGlobe = {
          frame: globeFrame,
          api: globe,
          orb,
          pointer,
          get frames() { return r.frames; },
          get dpr() { return r.dpr; },
          get held() { return !!held; },
          get onScreen() { return onScreen; },
          get hidden() { return document.hidden; },
        };
      }

      cleanup = () => {
        window.removeEventListener("pointermove", onMove);
        document.documentElement.removeEventListener("pointerleave", onLeave);
        io.disconnect();
        held?.();
        globe.mounted = false;
        globe.invalidate = () => {};
        globe.sync = () => {};
        root.removeAttribute("data-globe");
        r.destroy();
      };
    };

    return () => {
      disposed = true;
      disarm();
      cancelIdle();
      cleanup?.();
    };
  }, [hero]);

  return <canvas ref={canvasRef} aria-hidden="true" className="hero-globe-canvas pointer-events-none absolute inset-0 z-[2] h-full w-full" data-inspect="CANVAS / GLOBO" />;
}
