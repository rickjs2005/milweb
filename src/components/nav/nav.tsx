"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND } from "@/data/brand";
import { alternatesOf, internalizePath, localizePath } from "@/i18n/routing";
import type { Locale } from "@/i18n/config";
import { LanguageSwitch } from "./language-switch";

export type NavStrings = {
  work: string;
  lab: string;
  studio: string;
  contact: string;
  menu: string;
  close: string;
  primary: string;
  selectLanguage: string;
  langNames: Record<Locale, string>;
};

/**
 * Navegação mínima: wordmark · indicador de ato · links · seletor de idioma.
 * No mobile os links viram um overlay tipográfico. `usePathname` devolve o
 * caminho INTERNO reescrito pelo middleware (/pt/work/…); internalizePath
 * normaliza e permite montar a página equivalente em cada idioma.
 */
export function Nav({ locale, strings }: { locale: Locale; strings: NavStrings }) {
  const raw = usePathname() ?? "/";
  const { internal } = internalizePath(raw);
  const [open, setOpen] = useState(false);
  const [act, setAct] = useState<string>("");

  const links = [
    { href: localizePath(locale, "/work"), label: strings.work, key: "/work" },
    { href: localizePath(locale, "/lab"), label: strings.lab, key: "/lab" },
    { href: localizePath(locale, "/studio"), label: strings.studio, key: "/studio" },
    { href: localizePath(locale, "/contact"), label: strings.contact, key: "/contact" },
  ];
  const alternates = alternatesOf(internal);

  // Indicador de ato: lê [data-act] das seções visíveis (Home).
  useEffect(() => {
    const acts = Array.from(document.querySelectorAll<HTMLElement>("[data-act]"));
    if (!acts.length) {
      setAct("");
      return;
    }
    const ratios = new Map<Element, number>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => ratios.set(e.target, e.isIntersecting ? e.intersectionRatio : 0));
        let best: Element | null = null;
        let max = 0;
        ratios.forEach((r, el) => {
          if (r > max) {
            max = r;
            best = el;
          }
        });
        if (best) setAct((best as HTMLElement).dataset.act ?? "");
      },
      { threshold: [0, 0.1, 0.25, 0.5, 0.75], rootMargin: "-10% 0px -30% 0px" },
    );
    acts.forEach((a) => io.observe(a));
    return () => io.disconnect();
  }, [raw]);

  useEffect(() => {
    setOpen(false);
  }, [raw]);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  const isCurrent = (key: string) => internal === key || internal.startsWith(key + "/");

  return (
    <>
      <header data-nav-root className="fixed inset-x-0 top-0 z-nav flex h-nav items-center justify-between px-margin t-mono text-[#F2F0EA] mix-blend-difference" data-inspect="NAV">
        <Link href={localizePath(locale, "/")} className="link-rule font-display text-[15px] font-black tracking-tight" aria-label="MilWeb">
          {BRAND.mark}
        </Link>

        <span className="hidden tnum opacity-60 md:block" aria-live="polite">
          {act ? act : BRAND.index}
        </span>

        <div className="hidden items-center gap-7 md:flex">
          <nav className="flex items-center gap-7" aria-label={strings.primary}>
            {links.map((l) => (
              <Link key={l.key} href={l.href} className="link-rule" aria-current={isCurrent(l.key) ? "page" : undefined}>
                {l.label}
              </Link>
            ))}
          </nav>
          <LanguageSwitch current={locale} hrefs={alternates} label={strings.selectLanguage} names={strings.langNames} />
        </div>

        <button type="button" className="link-rule uppercase md:hidden" aria-expanded={open} aria-controls="nav-overlay" onClick={() => setOpen((v) => !v)}>
          {open ? strings.close : strings.menu}
        </button>
      </header>

      {/* Overlay mobile: links em escala de pôster + seletor de idioma. */}
      <div
        id="nav-overlay"
        className={
          "fixed inset-x-0 top-0 z-overlay flex h-[100dvh] flex-col justify-end bg-paper px-margin pb-10 pt-nav transition-[clip-path] duration-slow ease-in-out-quart md:hidden " +
          (open ? "[clip-path:inset(0_0_0_0)]" : "pointer-events-none [clip-path:inset(0_0_100%_0)]")
        }
        aria-hidden={!open}
      >
        <ul className="flex flex-col gap-2">
          {links.map((l, i) => (
            <li key={l.key} className="flex items-baseline gap-4 border-t border-ink py-3">
              <span className="t-mono text-ink-3">0{i + 1}</span>
              <Link href={l.href} className="t-display t-display-md text-ink" tabIndex={open ? 0 : -1} aria-current={isCurrent(l.key) ? "page" : undefined}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex items-center justify-between t-mono text-ink-3">
          <span>{BRAND.index}</span>
          <LanguageSwitch current={locale} hrefs={alternates} label={strings.selectLanguage} names={strings.langNames} tabbable={open} className="text-ink" />
        </div>
      </div>
    </>
  );
}
