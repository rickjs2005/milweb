"use client";

import { useEffect, useRef } from "react";
import { gsap, EASE } from "@/animations/gsap";

type Box = { label: string; x: number; y: number; w: number; h: number; kind: "named" | "auto" };

/** Elementos que ganham caixa mesmo sem data-inspect, com rótulo genérico. */
const AUTO = "section, h1, h2, h3, img, video, canvas, pre, figure, nav, footer, button, ul";
const MAX = 48;

function labelOf(el: Element): string {
  const named = el.getAttribute("data-inspect");
  if (named) return named;
  const tag = el.tagName;
  if (tag === "IMG") return "IMG";
  if (tag === "VIDEO") return "VIDEO";
  if (tag === "CANVAS") return "CANVAS / WEBGL";
  if (tag === "PRE") return "CODE";
  if (tag === "FIGURE") return "FIGURE";
  if (tag === "NAV") return "NAV";
  if (tag === "UL") return "LIST";
  if (tag === "BUTTON") return "BUTTON";
  if (tag === "SECTION") return el.getAttribute("data-act")?.replace(/^ACT \d+ \/ /, "SECTION / ") ?? "SECTION";
  return tag;
}

function collect(): Box[] {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const seen = new Set<Element>();
  const out: Box[] = [];
  const push = (el: Element, kind: Box["kind"]) => {
    if (seen.has(el) || out.length >= MAX) return;
    if (el.closest("[data-inspect-layer], header[data-inspect]") && kind === "auto") return;
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) return;
    if (r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) return;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.opacity === "0" || cs.display === "none") return;
    seen.add(el);
    out.push({ label: labelOf(el), x: r.left, y: r.top, w: r.width, h: r.height, kind });
  };
  document.querySelectorAll("[data-inspect]").forEach((el) => push(el, "named"));
  document.querySelectorAll(AUTO).forEach((el) => push(el, "auto"));
  return out;
}

/**
 * Camada visual do Inspect: grid 12, bounding boxes com rótulo e medida,
 * mira do cursor com coordenadas. Só lê o DOM (getBoundingClientRect) —
 * nada é modificado no conteúdo. Recalcula em scroll/resize via rAF.
 */
export function InspectLayer({ strings }: { strings: { title: string; dev: string } }) {
  const root = useRef<HTMLDivElement>(null);
  const boxesRef = useRef<HTMLDivElement>(null);
  const coordRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const host = boxesRef.current!;
    let raf = 0;

    const render = () => {
      raf = 0;
      const boxes = collect();
      host.replaceChildren(
        ...boxes.map((b) => {
          const d = document.createElement("div");
          d.className = "ib" + (b.kind === "named" ? " ib-named" : "");
          d.style.left = `${b.x}px`;
          d.style.top = `${b.y}px`;
          d.style.width = `${b.w}px`;
          d.style.height = `${b.h}px`;
          const l = document.createElement("span");
          l.className = "ib-label";
          l.textContent = `[${b.label}]`;
          const m = document.createElement("span");
          m.className = "ib-dim";
          m.textContent = `${Math.round(b.w)}×${Math.round(b.h)}`;
          d.append(l, m);
          return d;
        }),
      );
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    render();
    // Entrada: caixas nascem da esquerda, em stagger curto.
    gsap.from(host.children, { scaleX: 0, transformOrigin: "left", stagger: 0.012, duration: 0.35, ease: EASE.outExpo, clearProps: "scale" });

    const move = (e: PointerEvent) => {
      if (coordRef.current) coordRef.current.textContent = `X ${Math.round(e.clientX)}  Y ${Math.round(e.clientY)}  ${window.innerWidth}×${window.innerHeight}`;
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("pointermove", move);
    };
  }, []);

  return (
    <div ref={root} data-inspect-layer aria-hidden="true" className="pointer-events-none fixed inset-0 z-inspect select-none">
      {/* grid 12 */}
      <div className="absolute inset-y-0 left-margin right-margin grid" style={{ gridTemplateColumns: "repeat(12, minmax(0, 1fr))", columnGap: "var(--gutter)" }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className="block h-full border-l border-signal/25 last:border-r" />
        ))}
      </div>
      {/* mira */}
      <span className="absolute inset-y-0 w-px bg-signal/40" style={{ left: "var(--ix, -10px)" }} />
      <span className="absolute inset-x-0 h-px bg-signal/40" style={{ top: "var(--iy, -10px)" }} />
      <span ref={coordRef} className="t-mono absolute text-signal" style={{ left: "calc(var(--ix, 0px) + 12px)", top: "calc(var(--iy, 0px) + 12px)" }} />
      {/* caixas */}
      <div ref={boxesRef} className="absolute inset-0" />
      {/* rodapé técnico */}
      <p className="t-mono absolute bottom-4 left-margin text-signal">{strings.title}</p>
      <p className="t-mono absolute bottom-4 right-margin text-signal">{strings.dev}</p>
    </div>
  );
}
