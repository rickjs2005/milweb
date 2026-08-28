"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND } from "@/data/brand";
import { withLocale, type Locale } from "@/lib/i18n";

export type NavStrings = {
  work: string;
  lab: string;
  studio: string;
  contact: string;
  menu: string;
  close: string;
};

/**
 * Navegação mínima: wordmark · indicador de ato · WORK LAB STUDIO CONTACT ·
 * idioma. No mobile os links viram um overlay tipográfico. Sem botão
 * colorido, sem vidro — uma régua de 1px separa a nav do conteúdo.
 */
export function Nav({ locale, strings }: { locale: Locale; strings: NavStrings }) {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const [act, setAct] = useState<string>("");

  const links = [
    { href: withLocale(locale, "/work"), label: strings.work },
    { href: withLocale(locale, "/lab"), label: strings.lab },
    { href: withLocale(locale, "/studio"), label: strings.studio },
    { href: withLocale(locale, "/contact"), label: strings.contact },
  ];

  // Indicador de ato: lê [data-act] das seções visíveis (Home).
  useEffect(() => {
    const acts = Array.from(document.querySelectorAll<HTMLElement>("[data-act]"));
    if (!acts.length) {
      setAct("");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setAct((visible.target as HTMLElement).dataset.act ?? "");
      },
      { threshold: [0.25, 0.5], rootMargin: "-20% 0px -40% 0px" },
    );
    acts.forEach((a) => io.observe(a));
    return () => io.disconnect();
  }, [pathname]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  const otherLocale: Locale = locale === "en" ? "pt" : "en";
  const stripped = pathname.replace(/^\/en(?=\/|$)/, "") || "/";
  const switchHref = withLocale(otherLocale, stripped);

  const isCurrent = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-nav flex h-nav items-center justify-between px-margin t-mono text-ink"
        data-inspect="NAV"
      >
        <Link href={withLocale(locale, "/")} className="link-rule font-display text-[15px] font-black tracking-tight" aria-label="MilWeb">
          {BRAND.mark}
        </Link>

        <span className="hidden tnum text-ink-3 md:block" aria-live="polite">
          {act ? act : BRAND.index}
        </span>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="link-rule" aria-current={isCurrent(l.href) ? "page" : undefined}>
              {l.label}
            </Link>
          ))}
          <Link href={switchHref} className="link-rule text-ink-3" hrefLang={otherLocale === "en" ? "en" : "pt-BR"}>
            {otherLocale.toUpperCase()}
          </Link>
        </nav>

        <button
          type="button"
          className="link-rule md:hidden"
          aria-expanded={open}
          aria-controls="nav-overlay"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? strings.close : strings.menu}
        </button>
      </header>

      {/* Overlay mobile: links em escala de pôster. */}
      <div
        id="nav-overlay"
        className={
          "fixed inset-0 z-overlay flex flex-col justify-end bg-paper px-margin pb-10 pt-nav transition-[clip-path] duration-slow ease-in-out-quart md:hidden " +
          (open ? "[clip-path:inset(0_0_0_0)]" : "pointer-events-none [clip-path:inset(0_0_100%_0)]")
        }
        aria-hidden={!open}
      >
        <ul className="flex flex-col gap-2">
          {links.map((l, i) => (
            <li key={l.href} className="flex items-baseline gap-4 border-t border-ink py-3">
              <span className="t-mono text-ink-3">0{i + 1}</span>
              <Link href={l.href} className="t-display t-display-md text-ink" tabIndex={open ? 0 : -1}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex items-center justify-between t-mono text-ink-3">
          <span>{BRAND.index}</span>
          <Link href={switchHref} tabIndex={open ? 0 : -1}>
            {otherLocale.toUpperCase()}
          </Link>
        </div>
      </div>
    </>
  );
}
