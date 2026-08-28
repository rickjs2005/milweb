"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { gsap, EASE, MQ, SplitText, useGSAP } from "@/animations/gsap";
import { onIdle } from "@/animations/idle";

/**
 * ACT 05 — MILWEB LAB. O experimento assume a interface: a seção inverte
 * para tinta, um buraco negro em shader (WebGL cru) toma o fundo e a
 * tipografia é atraída pela massa — cada letra sofre uma força ∝ 1/d²
 * rumo ao horizonte, e o cursor desloca a massa. O canvas só renderiza
 * enquanto a seção está visível; sem WebGL/reduced-motion fica a versão
 * estática com o poster.
 */
export function LabTeaser({ eyebrow, title, body, enter, href, poster, act, tech }: { eyebrow: string; title: string; body: string; enter: string; href: string; poster: string; act: string; tech: string }) {
  const root = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const el = root.current;
    if (!canvas || !el) return;
    if (window.matchMedia(MQ.reduce).matches) return;
    let ctl: Awaited<ReturnType<typeof import("@/webgl/event-horizon")["mountEventHorizon"]>> | null = null;
    let io: IntersectionObserver | null = null;
    let cancelled = false;

    import("@/webgl/event-horizon").then(({ mountEventHorizon }) => {
      if (cancelled) return;
      ctl = mountEventHorizon(canvas);
      if (!ctl) return;
      canvas.dataset.ready = "1";
      io = new IntersectionObserver(([e]) => (e.isIntersecting ? ctl!.start() : ctl!.stop()), { threshold: 0.05 });
      io.observe(el);
    });

    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      ctl?.setPointer(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
    };
    el.addEventListener("pointermove", move, { passive: true });
    return () => {
      cancelled = true;
      io?.disconnect();
      ctl?.destroy();
      el.removeEventListener("pointermove", move);
    };
  }, []);

  // Tipografia atraída pela massa.
  useGSAP(
    () => {
      const el = root.current!;
      const h2 = el.querySelector<HTMLElement>("h2")!;
      const mm = gsap.matchMedia();
      const cancel = onIdle(() => mm.add(`${MQ.fine} and ${MQ.noReduce}`, () => {
        const split = SplitText.create(h2, { type: "chars", aria: "none" });
        const chars = split.chars as HTMLElement[];
        let mx = 0.5;
        let my = 0.5;
        let raf = 0;
        let live = false;
        const tick = () => {
          const r = el.getBoundingClientRect();
          const cx = r.left + r.width * (0.5 + (mx - 0.5) * 0.12);
          const cy = r.top + r.height * (0.5 + (my - 0.5) * 0.12);
          chars.forEach((c) => {
            const b = c.getBoundingClientRect();
            const x = b.left + b.width / 2;
            const y = b.top + b.height / 2;
            const dx = cx - x;
            const dy = cy - y;
            const d = Math.max(Math.hypot(dx, dy), 60);
            const f = Math.min(9000 / (d * d), 1) * 46;
            c.style.transform = `translate(${(dx / d) * f}px, ${(dy / d) * f}px) rotate(${(dx / d) * f * 0.15}deg)`;
          });
          if (live) raf = requestAnimationFrame(tick);
        };
        const io = new IntersectionObserver(([e]) => {
          live = e.isIntersecting;
          if (live && !raf) raf = requestAnimationFrame(tick);
          if (!live) {
            cancelAnimationFrame(raf);
            raf = 0;
          }
        });
        io.observe(el);
        const move = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          mx = (e.clientX - r.left) / r.width;
          my = (e.clientY - r.top) / r.height;
        };
        el.addEventListener("pointermove", move, { passive: true });
        gsap.from(chars, { yPercent: 40, autoAlpha: 0, stagger: 0.02, duration: 0.9, ease: EASE.outExpo, scrollTrigger: { trigger: el, start: "top 70%", once: true } });
        return () => {
          io.disconnect();
          cancelAnimationFrame(raf);
          el.removeEventListener("pointermove", move);
          split.revert();
        };
      }));
      return () => {
        cancel();
        mm.revert();
      };
    },
    { scope: root },
  );

  return (
    <section ref={root} id="lab" data-act={act} data-inspect="LAB_TEASER" className="relative isolate flex min-h-[100svh] flex-col justify-between overflow-hidden bg-ink px-margin pb-8 pt-nav text-paper">
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 -z-10 h-full w-full opacity-0 transition-opacity duration-slow data-[ready]:opacity-100" data-inspect="CANVAS / GLSL" />
      {/* fallback estático (sem WebGL / reduced-motion): o poster do experimento */}
      <div aria-hidden="true" className="absolute inset-0 -z-20 bg-cover bg-center opacity-40" style={{ backgroundImage: `url(${poster})` }} />

      <div className="flex items-center justify-between border-t border-paper/40 pt-3 t-mono">
        <span>{eyebrow}</span>
        <span className="tnum text-paper/60">{tech}</span>
      </div>

      <h2 className="t-display t-display-xl relative text-paper [&_div]:inline-block" data-inspect="LAB_TITLE">
        {title}
      </h2>

      <div className="grid-12 items-end gap-y-6 t-mono">
        <p className="col-span-4 max-w-sm normal-case tracking-normal text-paper/80 md:col-span-4" style={{ fontFamily: "var(--font-display)", fontSize: "var(--step-0)", letterSpacing: 0, textTransform: "none" }}>
          {body}
        </p>
        <p className="col-span-4 text-paper/50 md:col-span-4 md:text-center">MW/006</p>
        <p className="col-span-4 md:col-span-4 md:text-right">
          <Link href={href} className="link-rule text-paper" data-inspect="CTA">
            [ {enter} ]
          </Link>
        </p>
      </div>
    </section>
  );
}
