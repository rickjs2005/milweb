"use client";

import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/animations/gsap";

type Ctx = {
  /** Instância viva (null em touch / reduced-motion). */
  lenis: React.MutableRefObject<Lenis | null>;
  scrollTo: (target: HTMLElement | string | number, opts?: { offset?: number; immediate?: boolean }) => void;
  stop: () => void;
  start: () => void;
};

const ScrollCtx = createContext<Ctx | null>(null);

/**
 * Dono único do scroll suave e do rAF: Lenis roda dentro do gsap.ticker e
 * alimenta o ScrollTrigger. Em touch e reduced-motion o nativo assume —
 * a API (scrollTo/stop/start) continua funcionando via fallback nativo.
 */
export function ScrollProvider({ children }: { children: ReactNode }) {
  const lenis = useRef<Lenis | null>(null);
  const pathname = usePathname();

  // Mata ScrollTriggers órfãos ao trocar de rota (trigger fora do DOM).
  useEffect(() => {
    return () => {
      ScrollTrigger.getAll().forEach((st) => {
        const el = st.trigger as Element | null;
        if (!el || !document.contains(el)) st.kill();
      });
      ScrollTrigger.refresh();
    };
  }, [pathname]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (reduce || coarse) return;

    const instance = new Lenis({
      duration: 1.05,
      smoothWheel: true,
      wheelMultiplier: 1,
      autoRaf: false,
    });
    lenis.current = instance;
    instance.on("scroll", ScrollTrigger.update);
    const raf = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      instance.destroy();
      lenis.current = null;
    };
  }, []);

  // Âncoras internas passam pelo Lenis quando ele existe.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!link) return;
      const id = link.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector<HTMLElement>(id);
      if (!target) return;
      e.preventDefault();
      api.scrollTo(target, { offset: -64 });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const api: Ctx = {
    lenis,
    scrollTo: (target, opts) => {
      if (lenis.current) return lenis.current.scrollTo(target, opts);
      const el = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
      if (typeof el === "number") window.scrollTo({ top: el, behavior: opts?.immediate ? "auto" : "smooth" });
      else if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + (opts?.offset ?? 0), behavior: opts?.immediate ? "auto" : "smooth" });
    },
    stop: () => {
      lenis.current?.stop();
      document.documentElement.style.overflow = "hidden";
    },
    start: () => {
      lenis.current?.start();
      document.documentElement.style.overflow = "";
    },
  };

  return <ScrollCtx.Provider value={api}>{children}</ScrollCtx.Provider>;
}

export function useScroll(): Ctx {
  const ctx = useContext(ScrollCtx);
  if (!ctx) throw new Error("useScroll fora de <ScrollProvider>");
  return ctx;
}
