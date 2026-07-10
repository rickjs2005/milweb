"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, MessageCircle } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { Logo } from "./logo";
import { PROFILE, type Locale } from "@/lib/content";

type NavLink = { href: string; label: string };

const waHref = (text: string) =>
  `https://wa.me/${PROFILE.whatsapp}?text=${encodeURIComponent(text)}`;

export function Nav({
  locale,
  links,
  contactLabel,
}: {
  locale: Locale;
  links: NavLink[];
  contactLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const ids = links.map((l) => l.href.slice(1));
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (!sections.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [links]);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setProgress(max > 0 ? h.scrollTop / max : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-line/10 glass-nav">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px origin-left bg-accent"
        style={{ transform: `scaleX(${progress})` }}
      />
      <nav className="container-page flex h-16 items-center justify-between">
        <a href="#top" aria-label="MilWeb — início">
          <Logo animate />
        </a>

        <div className="hidden items-center gap-1 md:flex md:gap-2">
          {links.map((l) => {
            const isActive = active === l.href.slice(1);
            return (
              <a
                key={l.href}
                href={l.href}
                aria-current={isActive ? "true" : undefined}
                className={
                  "relative rounded-md px-3 py-2 text-sm transition-colors " +
                  (isActive ? "text-fg" : "text-fg-subtle hover:text-fg")
                }
              >
                {l.label}
                <span
                  className={
                    "absolute inset-x-3 -bottom-px h-px origin-left bg-accent transition-transform duration-300 " +
                    (isActive ? "scale-x-100" : "scale-x-0")
                  }
                />
              </a>
            );
          })}
          <ThemeToggle />
          <LangToggle locale={locale} />
          <a
            href={waHref("Olá Rick! Vim pelo site da MilWeb e quero um orçamento.")}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 inline-flex items-center gap-1.5 rounded-md bg-accent px-3.5 py-2 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-soft"
          >
            <MessageCircle className="h-4 w-4" />
            {contactLabel}
          </a>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <LangToggle locale={locale} />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line/15 text-fg-muted transition-colors hover:border-accent/40 hover:text-fg"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </nav>

      <div
        className={
          "fixed inset-0 z-[60] h-[100dvh] overflow-y-auto bg-bg transition-opacity duration-300 md:hidden " +
          (open ? "opacity-100" : "pointer-events-none opacity-0")
        }
      >
        <div className="container-page flex h-16 items-center justify-between">
          <Logo />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line/15 text-fg-muted transition-colors hover:border-accent/40 hover:text-fg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="container-page mt-6 flex flex-col gap-1">
          {links.map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              style={{ transitionDelay: open ? `${80 + i * 60}ms` : "0ms" }}
              className={
                "border-b border-line/10 py-4 text-2xl font-semibold tracking-tight text-fg-muted transition-all duration-300 hover:text-accent " +
                (open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0")
              }
            >
              {l.label}
            </a>
          ))}
          <a
            href={waHref("Olá Rick! Vim pelo site da MilWeb e quero um orçamento.")}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            style={{ transitionDelay: open ? `${80 + links.length * 60}ms` : "0ms" }}
            className={
              "mt-3 inline-flex items-center justify-center gap-2 rounded-lg bg-accent py-4 text-center text-2xl font-semibold tracking-tight text-accent-fg transition-all duration-300 hover:bg-accent-soft " +
              (open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0")
            }
          >
            <MessageCircle className="h-6 w-6" />
            WhatsApp
          </a>
        </nav>
      </div>
    </header>
  );
}

/**
 * Troca de idioma por URL (i18n indexável): PT vive na raiz e EN em /en.
 * Navegação completa (<a>) — o middleware normaliza o idioma pelo path.
 */
function LangToggle({ locale }: { locale: Locale }) {
  const pathname = usePathname() ?? "/";
  // path equivalente sem o prefixo /en
  const base = pathname.replace(/^\/en(?=\/|$)/, "") || "/";
  const ptHref = base;
  const enHref = base === "/" ? "/en" : `/en${base}`;

  const item = (l: Locale, href: string, label: string) =>
    locale === l ? (
      <span aria-current="true" className="text-accent">
        {label}
      </span>
    ) : (
      <a href={href} className="transition-colors hover:text-accent" rel="alternate" hrefLang={l === "pt" ? "pt-BR" : "en"}>
        {label}
      </a>
    );

  return (
    <div
      role="group"
      aria-label="Trocar idioma / Switch language"
      className="inline-flex items-center gap-1.5 rounded-md border border-line/15 px-2.5 py-1.5 font-mono text-xs font-medium text-fg-muted"
    >
      {item("pt", ptHref, "PT")}
      <span className="text-fg-subtle">/</span>
      {item("en", enHref, "EN")}
    </div>
  );
}
