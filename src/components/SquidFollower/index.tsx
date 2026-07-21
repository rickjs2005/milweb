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
 * (pulso de clique e transição de idle). Em ponteiros sem hover (touch)
 * entra em modo AUTÔNOMO: nada por deriva de ruído, sente o scroll e foge
 * de toques — versão mais leve (menos segmentos/partículas, DPR menor).
 * Com prefers-reduced-motion, desativa-se por completo.
 */
export function SquidFollower(props: SquidFollowerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cfg: SquidConfig = { ...DEFAULTS, ...props };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    // Sem hover (touch) a lula não some: entra em MODO AUTÔNOMO — nada
    // sozinha por pontos de deriva (ruído), sente a correnteza do scroll
    // e foge de toques. Versão mais leve (menos segmentos/partículas).
    const autonomous = !window.matchMedia("(hover: hover)").matches;
    const ecfg: SquidConfig = autonomous
      ? {
          ...cfg,
          size: Math.round(cfg.size * 0.78),
          segments: Math.min(cfg.segments, 16),
          particleCount: Math.min(cfg.particleCount, 10),
        }
      : cfg;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    /* Montagem do engine ------------------------------------------- */
    const renderer = new Renderer(ctx, ecfg);
    const pointer = new PointerTracker(ecfg.interactive);
    const particles = new ParticleSystem(ecfg);
    const head = new Spring2D(window.innerWidth / 2, window.innerHeight + ecfg.size * 4);
    // Os 2 tentáculos longos de caça ficam em posições simétricas do feixe.
    const longIdx = ecfg.tentacles >= 5 ? new Set([1, ecfg.tentacles - 2]) : new Set<number>();
    const tentacles = Array.from(
      { length: ecfg.tentacles },
      (_, i) => new Tentacle(i, ecfg.tentacles, ecfg, longIdx.has(i)),
    );
    for (const t of tentacles) t.reset(head.x, head.y);

    // Estados especiais animados via GSAP.
    const pulse = { t: 1 }; // 0 → 1 durante o flash do clique
    const idle = { amp: 0 }; // 0 → 1 na entrada do modo idle
    let wasIdle = false;

    const eyes = { lookX: 0, lookY: 0, blink: 0 };
    let blinkTimer = PHYSICS.blinkMin + Math.random() * (PHYSICS.blinkMax - PHYSICS.blinkMin);
    let blinkPhase = -1; // <0 = olho aberto; 0..1 = progresso da piscada

    // Reflexo de fuga: recuo elástico na direção oposta ao clique/toque.
    const flee = (cx: number, cy: number) => {
      if (!ecfg.interactive) return;
      const dx = head.x - cx;
      const dy = head.y - cy;
      const d = Math.hypot(dx, dy) || 1;
      head.impulse((dx / d) * PHYSICS.clickImpulse, (dy / d) * PHYSICS.clickImpulse);
      particles.burst(head.x, head.y);
      gsap.fromTo(pulse, { t: 0 }, { t: 1, duration: 0.55, ease: "power2.out", overwrite: true });
    };
    pointer.onClick = flee;
    // No touch o PointerTracker filtra tudo que não é mouse — o toque vira
    // um listener próprio (a lula foge do dedo).
    const onTap = (e: PointerEvent) => flee(e.clientX, e.clientY);
    if (autonomous) window.addEventListener("pointerdown", onTap);

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

      // Autônoma (touch): sem cursor, a "velocidade da mão" vira a da própria
      // lula — o esticamento dos tentáculos acompanha o nado dela.
      const headSpeed = Math.hypot(head.vx, head.vy);
      const speedNorm = autonomous ? clamp(headSpeed / 700, 0, 1) : pointer.speedNorm;
      const isIdle =
        ecfg.idleAnimation && (autonomous ? headSpeed < 40 : pointer.idleTime > PHYSICS.idleDelay);
      if (isIdle !== wasIdle) {
        wasIdle = isIdle;
        gsap.to(idle, { amp: isIdle ? 1 : 0, duration: 1.2, ease: "sine.inOut", overwrite: true });
      }

      // Alvo da cabeça: cursor + offset (nunca colado) + flutuação em idle.
      // Em modo autônomo o alvo é um ponto de deriva por ruído — ela cruza a
      // tela devagar, sem depender de ponteiro nenhum.
      const hover = !autonomous && ecfg.interactive ? pointer.hoverCenter() : null;
      const bobY = Math.sin(time * PHYSICS.idleBobFreq * Math.PI * 2) * PHYSICS.idleBobAmp * idle.amp;
      const bobX = noise1(time * 0.25) * 14 * idle.amp;
      let tx: number;
      let ty: number;
      if (autonomous) {
        tx = window.innerWidth * (0.5 + noise1(time * 0.045) * 0.42) + bobX;
        ty = window.innerHeight * (0.42 + noise1(time * 0.045 + 77) * 0.33) + bobY;
      } else {
        tx = pointer.x + PHYSICS.followOffset.x + bobX;
        ty = pointer.y + PHYSICS.followOffset.y + bobY;
      }
      const damping = PHYSICS.headDamping + (hover ? PHYSICS.hoverDampingBoost : 0);
      head.update(tx, ty, PHYSICS.headStiffness * ecfg.speed * (autonomous ? 0.5 : 1), damping, dt);

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
          speedNorm, flowY, idle.amp, i === pointingIndex && hover ? hover : null,
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
      } else if (isIdle || autonomous) {
        // Autônoma olha pra onde está indo (mais o vagueio do ruído).
        lookTX = head.x + head.vx * 0.4 + noise1(time * 0.4) * 220;
        lookTY = head.y + head.vy * 0.4 + noise1(time * 0.4 + 100) * 160;
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
      // DPR menor no touch: telas 3x custariam caro pra um efeito de fundo.
      const dpr = Math.min(window.devicePixelRatio || 1, autonomous ? 1.75 : 2);
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
      if (autonomous) window.removeEventListener("pointerdown", onTap);
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
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: cfg.zIndex, opacity: cfg.opacity }}
    />
  );
}
