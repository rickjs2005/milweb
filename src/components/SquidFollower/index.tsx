"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { DEFAULTS, PHYSICS } from "./constants";
import { clamp, damp, noise1, Spring2D } from "./physics";
import { PointerTracker } from "./pointer";
import { Tentacle } from "./tentacle";
import { ParticleSystem } from "./particles";
import { Renderer } from "./renderer";
import type { HeadState, SquidConfig, SquidFollowerProps } from "./types";

/**
 * Mascote-lula da MilWeb: persegue o cursor com mola + inércia, braços
 * curtos em feixe + 2 tentáculos longos de caça (follow-the-leader com lag),
 * ondulação constante, olhos que seguem o ponteiro e reações a hover,
 * clique, scroll e idle. Nada ATRÁS do conteúdo (z-index negativo).
 *
 * Física 100% manual (physics.ts); GSAP só para estados especiais
 * (pulso de clique e transição de idle). Desativa-se sozinha em ponteiros
 * sem hover (touch) e com prefers-reduced-motion.
 */
export function SquidFollower(props: SquidFollowerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cfg: SquidConfig = { ...DEFAULTS, ...props };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canHover = window.matchMedia("(hover: hover)").matches;
    if (reduce || !canHover) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    /* Montagem do engine ------------------------------------------- */
    const renderer = new Renderer(ctx, cfg);
    const pointer = new PointerTracker(cfg.interactive);
    const particles = new ParticleSystem(cfg);
    const head = new Spring2D(window.innerWidth / 2, window.innerHeight + cfg.size * 4);
    // Os 2 tentáculos longos de caça ficam em posições simétricas do feixe.
    const longIdx = cfg.tentacles >= 5 ? new Set([1, cfg.tentacles - 2]) : new Set<number>();
    const tentacles = Array.from(
      { length: cfg.tentacles },
      (_, i) => new Tentacle(i, cfg.tentacles, cfg, longIdx.has(i)),
    );
    for (const t of tentacles) t.reset(head.x, head.y);

    // Estados especiais animados via GSAP.
    const pulse = { t: 1 }; // 0 → 1 durante o flash do clique
    const idle = { amp: 0 }; // 0 → 1 na entrada do modo idle
    let wasIdle = false;

    const eyes = { lookX: 0, lookY: 0, blink: 0 };
    let blinkTimer = PHYSICS.blinkMin + Math.random() * (PHYSICS.blinkMax - PHYSICS.blinkMin);
    let blinkPhase = -1; // <0 = olho aberto; 0..1 = progresso da piscada

    pointer.onClick = (cx, cy) => {
      if (!cfg.interactive) return;
      // Recuo elástico: impulso na direção oposta ao clique.
      const dx = head.x - cx;
      const dy = head.y - cy;
      const d = Math.hypot(dx, dy) || 1;
      head.impulse((dx / d) * PHYSICS.clickImpulse, (dy / d) * PHYSICS.clickImpulse);
      particles.burst(head.x, head.y);
      gsap.fromTo(pulse, { t: 0 }, { t: 1, duration: 0.55, ease: "power2.out", overwrite: true });
    };

    /* Loop ---------------------------------------------------------- */
    let raf = 0;
    let last = -1;
    let time = 0;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (last < 0) last = now;
      // Delta time com teto: aba lenta/voltando de background não explode a física.
      const dt = clamp((now - last) / 1000, 1 / 240, 1 / 30);
      last = now;
      time += dt;

      pointer.update(dt);

      const isIdle = cfg.idleAnimation && pointer.idleTime > PHYSICS.idleDelay;
      if (isIdle !== wasIdle) {
        wasIdle = isIdle;
        gsap.to(idle, { amp: isIdle ? 1 : 0, duration: 1.2, ease: "sine.inOut", overwrite: true });
      }

      // Alvo da cabeça: cursor + offset (nunca colado) + flutuação em idle.
      const hover = cfg.interactive ? pointer.hoverCenter() : null;
      const bobY = Math.sin(time * PHYSICS.idleBobFreq * Math.PI * 2) * PHYSICS.idleBobAmp * idle.amp;
      const bobX = noise1(time * 0.25) * 14 * idle.amp;
      const tx = pointer.x + PHYSICS.followOffset.x + bobX;
      const ty = pointer.y + PHYSICS.followOffset.y + bobY;
      const damping = PHYSICS.headDamping + (hover ? PHYSICS.hoverDampingBoost : 0);
      head.update(tx, ty, PHYSICS.headStiffness * cfg.speed, damping, dt);

      // Correnteza do scroll empurra as pontas dos tentáculos.
      const flowY = clamp(-pointer.scrollVel * PHYSICS.scrollFlow, -60, 60);

      // Hover: o tentáculo com ângulo mais próximo do alvo aponta pra ele.
      let pointingIndex = -1;
      if (hover) {
        const targetAngle = Math.atan2(hover.y - head.y, hover.x - head.x);
        let best = Infinity;
        tentacles.forEach((t, i) => {
          let diff = Math.abs(targetAngle - t.baseAngle);
          if (diff > Math.PI) diff = Math.PI * 2 - diff;
          if (diff < best) {
            best = diff;
            pointingIndex = i;
          }
        });
      }
      tentacles.forEach((t, i) =>
        t.update(
          head.x, head.y, head.vx, head.vy, time, dt,
          pointer.speedNorm, flowY, idle.amp, i === pointingIndex && hover ? hover : null,
        ),
      );

      particles.update(dt, head.x, head.y, isIdle, time);

      /* Olhos ------------------------------------------------------- */
      // Movendo: olha o cursor na hora. Hover: olha o elemento. Idle: vagueia.
      let lookTX: number;
      let lookTY: number;
      if (hover) {
        lookTX = hover.x;
        lookTY = hover.y;
      } else if (isIdle) {
        lookTX = head.x + noise1(time * 0.4) * 220;
        lookTY = head.y + noise1(time * 0.4 + 100) * 160;
      } else {
        lookTX = pointer.x;
        lookTY = pointer.y;
      }
      const ld = Math.hypot(lookTX - head.x, lookTY - head.y) || 1;
      const lambda = isIdle ? PHYSICS.lookLambdaIdle : PHYSICS.lookLambdaActive;
      eyes.lookX = damp(eyes.lookX, (lookTX - head.x) / ld, lambda, dt);
      eyes.lookY = damp(eyes.lookY, (lookTY - head.y) / ld, lambda, dt);

      // Piscada aleatória (triângulo: fecha e abre).
      if (blinkPhase < 0) {
        blinkTimer -= dt;
        if (blinkTimer <= 0) {
          blinkPhase = 0;
          blinkTimer = PHYSICS.blinkMin + Math.random() * (PHYSICS.blinkMax - PHYSICS.blinkMin);
        }
      } else {
        blinkPhase += dt / PHYSICS.blinkDuration;
        if (blinkPhase >= 1) blinkPhase = -1;
      }
      eyes.blink = blinkPhase < 0 ? 0 : 1 - Math.abs(blinkPhase * 2 - 1);

      /* Render ------------------------------------------------------ */
      const speedRatio = clamp(Math.hypot(head.vx, head.vy) / 900, 0, 1);
      // Respiração do manto: mais ampla e lenta quando em idle.
      const breath =
        1 +
        Math.sin(time * PHYSICS.breathFreq * Math.PI * 2) *
          PHYSICS.breathAmp * (0.5 + 0.8 * idle.amp);
      const state: HeadState = {
        x: head.x,
        y: head.y,
        tilt: clamp(head.vx * 0.00035, -0.3, 0.3),
        squash: speedRatio,
        lookX: eyes.lookX,
        lookY: eyes.lookY,
        blink: eyes.blink,
        breath,
        clickPulse: pulse.t,
      };

      renderer.clear();
      renderer.drawWebbing(tentacles);
      for (const t of tentacles) renderer.drawTentacle(t);
      renderer.drawParticles(particles);
      renderer.drawHead(state);
    };

    /* Resize / visibilidade / limpeza ------------------------------- */
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.resize(window.innerWidth, window.innerHeight, dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(document.documentElement);

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        last = -1; // zera o delta pra não pular a simulação
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      ro.disconnect();
      pointer.dispose();
      gsap.killTweensOf(pulse);
      gsap.killTweensOf(idle);
    };
    // Recria o engine se qualquer parâmetro mudar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    cfg.size, cfg.speed, cfg.tentacles, cfg.segments, cfg.glow,
    cfg.interactive, cfg.particleCount, cfg.idleAnimation,
  ]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 hidden [@media(hover:hover)]:block"
      style={{ zIndex: cfg.zIndex, opacity: cfg.opacity }}
    />
  );
}
