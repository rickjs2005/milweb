"use client";

import { useEffect } from "react";

const TOTAL_MS = 1950;

/** Lado client do Boot: destrava o scroll no fim, grava a flag e permite pular. */
export function BootController() {
  useEffect(() => {
    const el = document.getElementById("mw-boot");
    const root = document.documentElement;
    if (!el) {
      root.classList.remove("booting");
      return;
    }
    window.scrollTo(0, 0);
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      try {
        sessionStorage.setItem("mw:booted", "1");
      } catch {}
      root.classList.remove("booting");
      el.addEventListener("animationend", () => el.remove(), { once: true });
      // Fallback caso a animação de saída já tenha terminado.
      window.setTimeout(() => el.remove(), 900);
    };
    const skip = () => {
      el.classList.add("is-skipped");
      finish();
    };
    const timer = window.setTimeout(finish, TOTAL_MS);
    el.addEventListener("pointerdown", skip);
    window.addEventListener("keydown", skip, { once: true });
    return () => {
      window.clearTimeout(timer);
      el.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
    };
  }, []);
  return null;
}
