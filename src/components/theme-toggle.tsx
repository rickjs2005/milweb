"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

/**
 * Alterna dark/claro adicionando/removendo a classe `.light` no <html>
 * (as variáveis de tema em globals.css fazem o resto). Persiste em localStorage.
 * O estado inicial é lido após montar pra casar com o script anti-flash do layout.
 */
export function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    setLight(document.documentElement.classList.contains("light"));
  }, []);

  const toggle = () => {
    const isLight = document.documentElement.classList.toggle("light");
    try {
      localStorage.setItem("theme", isLight ? "light" : "dark");
    } catch {
      /* ignore */
    }
    setLight(isLight);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Alternar tema claro/escuro"
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line/10 text-fg-subtle transition-colors hover:border-accent/40 hover:text-fg"
    >
      {light ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}
