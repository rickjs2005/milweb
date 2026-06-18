"use client";

import {
  useEffect,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from "react";

/** Revela o conteúdo com um fade-up quando entra na viewport (uma vez). */
export function Reveal({
  children,
  as: Tag = "div",
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!el || reduce || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    // Fail-safe: nunca deixa o conteúdo permanentemente escondido se o
    // observer não disparar (ex.: página não rolada, captura headless).
    const fallback = setTimeout(() => {
      setShown(true);
      io.disconnect();
    }, 1200);
    return () => {
      clearTimeout(fallback);
      io.disconnect();
    };
  }, []);

  return (
    <Tag
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={
        "transition-all duration-700 ease-out " +
        (shown ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0") +
        (className ? " " + className : "")
      }
    >
      {children}
    </Tag>
  );
}

/** Contador animado que dispara ao entrar na viewport. */
export function Counter({
  value,
  suffix = "",
  duration = 1400,
  delay = 0,
}: {
  value: number;
  suffix?: string;
  duration?: number;
  /** Atraso (ms) antes de iniciar a contagem — usado para cascata/stagger. */
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [n, setN] = useState(0);

  useEffect(() => {
    const el = ref.current;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!el || reduce || typeof IntersectionObserver === "undefined") {
      setN(value);
      return;
    }
    let raf = 0;
    let startTimer = 0;
    const animate = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
        setN(Math.round(eased * value));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    // Inicia a animação após o atraso do stagger (delay = 0 -> imediato).
    const startAnimation = () => {
      if (delay > 0) {
        startTimer = window.setTimeout(animate, delay);
      } else {
        animate();
      }
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        io.disconnect();
        clearTimeout(fallback);
        startAnimation();
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    // Fail-safe: garante o número final mesmo sem scroll/observer.
    const fallback = setTimeout(() => {
      io.disconnect();
      startAnimation();
    }, 1400);
    return () => {
      io.disconnect();
      clearTimeout(fallback);
      clearTimeout(startTimer);
      cancelAnimationFrame(raf);
    };
  }, [value, duration, delay]);

  return (
    <span ref={ref} className="tabular-nums">
      {n}
      {suffix}
    </span>
  );
}
