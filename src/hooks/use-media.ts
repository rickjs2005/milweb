"use client";

import { useEffect, useState } from "react";

/** Estado reativo de uma media query. SSR = `initial`. */
export function useMedia(query: string, initial = false): boolean {
  const [match, setMatch] = useState(initial);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return match;
}

export const useReducedMotion = () => useMedia("(prefers-reduced-motion: reduce)");
export const usePointerFine = () => useMedia("(hover: hover) and (pointer: fine)");
