"use client";

import { useRef, useState } from "react";
import { gsap, EASE, SplitText, useGSAP } from "@/animations/gsap";
import { addBody, createWorld, hit, render, settled, step, type World } from "@/features/break/physics";
import { compiler } from "@/features/compiler/store";
import { compileTo } from "@/features/compiler/compiler";
import { getQuality } from "@/lib/quality";
import { sound } from "@/features/sound/sound";

/**
 * ACT 06 — BREAK THE WEBSITE. Um botão discreto: DO NOT PRESS. Ao apertar,
 * a interface perde a rigidez: as palavras do título, os labels técnicos, a
 * régua e as COLUNAS DO GRID viram corpos físicos e caem; a escultura entra
 * em anomalia (o canvas rompe) e tenta remontar a página. Quando tudo
 * assenta: YOU BROKE THE INTERNET. RICK CAN FIX IT. [REBUILD] — e a
 * interface volta ao lugar em coreografia, a escultura recompila.
 *
 * Regras: nada sai desta seção, nada recarrega, nada muda de dado. Foco e
 * links continuam funcionando (os corpos são os próprios elementos, só com
 * transform). LOW: menos corpos e sem arrasto. reduced-motion: sem física
 * — a composição vai direto ao estado final, em silêncio.
 */
export function BreakTheWebsite({ trigger, headline, sub, rebuild, title, act, pieces }: { trigger: string; headline: readonly string[]; sub: string; rebuild: string; title: readonly [string, string]; act: string; pieces: readonly [string, string, string, string, string] }) {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "breaking" | "broken" | "rebuilding">("idle");
  const worldRef = useRef<World | null>(null);
  const splitRef = useRef<SplitText | null>(null);
  const rafRef = useRef(0);

  const breakIt = () => {
    if (state !== "idle") return;
    const el = root.current!;
    const st = stage.current!;
    setState("breaking");
    const q = getQuality();
    const reduce = q.tier === "reduced" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const bounds = st.getBoundingClientRect();
    const world = createWorld(bounds.width, bounds.height);
    worldRef.current = world;

    // As palavras do título viram corpos.
    const h2 = st.querySelector<HTMLElement>("h2")!;
    const split = SplitText.create(h2, { type: "words", aria: "none" });
    splitRef.current = split;
    // LOW: só o título e a régua. HIGH/MEDIUM: + labels + colunas do grid.
    const extras = q.tier === "low" ? Array.from(st.querySelectorAll<HTMLElement>("[data-piece]")).slice(0, 3) : Array.from(st.querySelectorAll<HTMLElement>("[data-piece], [data-column]"));
    const parts: HTMLElement[] = [...(split.words as HTMLElement[]), ...extras];
    parts.forEach((p, i) => {
      const r = p.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      p.style.willChange = "transform";
      if (!p.dataset.column) p.style.display = "inline-block";
      addBody(world, p, r.left - bounds.left, r.top - bounds.top, r.width, r.height, 1 + (i % 3));
    });

    // A ruptura chega ao canvas: a escultura entra em anomalia e desmonta.
    if (!reduce && q.webgl) {
      gsap.to(compiler.values, { anomaly: 1, duration: 0.18, ease: "power2.in", onUpdate: () => compiler.invalidate() });
      compileTo("collapsed", { cx: 0.5, cy: 0.52, scale: 0.3, opacity: 1 }, { duration: 0.5, ease: EASE.snap });
      gsap.to(compiler.values, { anomaly: 0.45, duration: 1.4, delay: 0.3, ease: "power2.out", onUpdate: () => compiler.invalidate() });
    }
    sound.play("break");

    if (reduce) {
      // sem física: só o estado final
      world.bodies.forEach((b) => {
        b.y = world.h - b.h;
        b.a = 0;
      });
      render(world);
      setState("broken");
      return;
    }
    let last = performance.now();
    let calm = 0;
    let done = false;
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      step(world, dt);
      render(world);
      if (settled(world)) calm++;
      else calm = 0;
      if (calm > 45 && !done) {
        done = true;
        setState("broken");
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    world.pointer.active = true;
    rafRef.current = requestAnimationFrame(loop);

    // interação: cursor empurra; arrastar move (não em LOW)
    const move = (e: PointerEvent) => {
      const r = st.getBoundingClientRect();
      world.pointer.x = e.clientX - r.left;
      world.pointer.y = e.clientY - r.top;
    };
    const down = (e: PointerEvent) => {
      const r = st.getBoundingClientRect();
      const b = hit(world, e.clientX - r.left, e.clientY - r.top);
      if (b) {
        b.grabbed = true;
        world.drag = b;
        e.preventDefault();
      }
    };
    const up = () => {
      if (world.drag) world.drag.grabbed = false;
      world.drag = null;
    };
    st.addEventListener("pointermove", move);
    if (q.tier !== "low") st.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    (el as HTMLElement & { _cleanup?: () => void })._cleanup = () => {
      st.removeEventListener("pointermove", move);
      st.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
    };
  };

  const rebuildIt = () => {
    if (state !== "broken") return;
    const el = root.current as HTMLElement & { _cleanup?: () => void };
    setState("rebuilding");
    cancelAnimationFrame(rafRef.current);
    el._cleanup?.();
    const world = worldRef.current!;
    sound.play("rebuild");
    // A escultura recompila junto com a página (ela é quem "conserta").
    if (getQuality().webgl) {
      gsap.to(compiler.values, { anomaly: 0, duration: 1.2, ease: "power2.out", onUpdate: () => compiler.invalidate() });
      compileTo("assembled", { cx: window.innerWidth >= 1080 ? 0.86 : 0.8, cy: 0.62, scale: 0.12, opacity: 1 }, { duration: 1.4, ease: EASE.outExpo });
    }
    const tl = gsap.timeline({
      onComplete: () => {
        splitRef.current?.revert();
        splitRef.current = null;
        world.bodies.forEach((b) => {
          b.el.style.transform = "";
          b.el.style.willChange = "";
          if (!b.el.dataset.column) b.el.style.display = "";
        });
        worldRef.current = null;
        setState("idle");
      },
    });
    // volta em ordem: primeiro o que está mais alto na composição original
    const ordered = [...world.bodies].sort((a, b) => a.oy - b.oy || a.ox - b.ox);
    ordered.forEach((b, i) => {
      tl.to(b.el, { x: 0, y: 0, rotation: 0, duration: 0.9, ease: EASE.outExpo }, 0.05 + i * 0.03);
    });
  };

  // Unmount com a página quebrada: mata o loop, os listeners no window e o SplitText.
  useGSAP(
    () => () => {
      cancelAnimationFrame(rafRef.current);
      (root.current as (HTMLElement & { _cleanup?: () => void }) | null)?._cleanup?.();
      splitRef.current?.revert();
      splitRef.current = null;
      worldRef.current = null;
    },
    { scope: root },
  );

  const broken = state === "broken";

  return (
    <section ref={root} id="break" data-act={act} data-inspect="BREAK" className="relative overflow-hidden bg-paper">
      <div ref={stage} className="container-page relative z-10 flex min-h-[100svh] flex-col justify-between pb-8 pt-nav" data-inspect="PHYSICS_STAGE">
        {/* as 12 colunas do grid também se desprendem (não em LOW) */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 inset-y-0 hidden md:grid" style={{ gridTemplateColumns: "repeat(12, minmax(0, 1fr))", columnGap: "var(--gutter)" }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} data-column className="block h-full w-px justify-self-start bg-neutral" />
          ))}
        </div>

        <div data-piece className="rule flex items-center justify-between pt-3 t-mono">
          <span data-piece>{pieces[0]}</span>
          <span data-piece className="tnum text-ink-3">
            {pieces[1]}
          </span>
        </div>

        <h2 className="t-display t-display-xl my-10 text-ink [&_div]:inline-block" data-inspect="H2">
          <span className="block">{title[0]}</span>
          <span className="block">{title[1]}</span>
        </h2>

        <div className="flex flex-wrap items-end justify-between gap-6 t-mono">
          <div className="space-y-0.5 text-ink-3">
            <p data-piece>{pieces[2]}</p>
            <p data-piece>{pieces[3]}</p>
            <p data-piece>{pieces[4]}</p>
          </div>
          <button
            type="button"
            onClick={breakIt}
            disabled={state !== "idle"}
            data-no-inspect
            className="link-rule t-mono text-ink disabled:opacity-40"
            data-inspect="BUTTON / DO_NOT_PRESS"
          >
            [ {trigger} ]
          </button>
        </div>
      </div>

      {/* Tela de "quebrou": entra por cima quando tudo assenta. */}
      <div
        aria-hidden={!broken}
        className={
          "pointer-events-none absolute inset-0 z-20 flex flex-col justify-start bg-gradient-to-b from-ink from-55% to-ink/0 px-margin pb-12 pt-[calc(var(--nav-h)+2rem)] text-paper transition-opacity duration-slow ease-out-expo " +
          (broken ? "opacity-100" : "opacity-0")
        }
      >
        <p className="t-display t-display-md">
          {headline.map((l) => (
            <span key={l} className="block">
              {l}
            </span>
          ))}
        </p>
        <p className="t-mono mt-6 text-paper/70">{sub}</p>
        <button
          type="button"
          onClick={rebuildIt}
          data-no-inspect
          tabIndex={broken ? 0 : -1}
          className={"link-rule t-mono mt-8 w-fit text-signal " + (broken ? "pointer-events-auto" : "")}
        >
          [ {rebuild} ]
        </button>
      </div>
    </section>
  );
}
