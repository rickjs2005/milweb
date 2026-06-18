"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Locale, Localized } from "@/lib/content";

type Ctx = {
  lang: Locale;
  setLang: (l: Locale) => void;
  toggle: () => void;
  /** Resolve um texto bilíngue pro idioma atual. */
  t: (v: Localized) => string;
};

const LangContext = createContext<Ctx | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Locale>("pt");

  // Restaura preferência salva (cliente). SSR renderiza "pt" por padrão.
  useEffect(() => {
    const saved = window.localStorage.getItem("lang");
    if (saved === "pt" || saved === "en") setLangState(saved);
  }, []);

  const setLang = (l: Locale) => {
    setLangState(l);
    window.localStorage.setItem("lang", l);
    document.documentElement.lang = l === "pt" ? "pt-BR" : "en";
  };

  const value: Ctx = {
    lang,
    setLang,
    toggle: () => setLang(lang === "pt" ? "en" : "pt"),
    t: (v) => v[lang],
  };

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): Ctx {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang precisa estar dentro de <LangProvider>");
  return ctx;
}
