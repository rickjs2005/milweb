"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Dispara `true` uma única vez quando o elemento entra na viewport.
 * Fail-safes da casa: prefers-reduced-motion e ausência de IO mostram na hora;
 * timeout garante o estado final mesmo sem scroll (ex.: captura headless).
 */
export function useInViewOnce<T extends HTMLElement>(): [
  React.RefObject<T | null>,
  boolean,
] {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
      { threshold: 0.3, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    const fallback = setTimeout(() => {
      setShown(true);
      io.disconnect();
    }, 1400);
    return () => {
      clearTimeout(fallback);
      io.disconnect();
    };
  }, []);

  return [ref, shown];
}
