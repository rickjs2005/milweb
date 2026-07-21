"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, MessageCircle } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { Logo } from "./logo";
import { Magnetic } from "./magnetic";
import { PROFILE, type Locale } from "@/lib/content";

type NavLink = { href: string; label: string };

const waHref = (text: string) =>
  `https://wa.me/${PROFILE.whatsapp}?text=${encodeURIComponent(text)}`;

/**
 * Nav em dois estados:
 * - FLUTUANTE (sobre o hero dark da home): totalmente transparente, mais
 *   alta, tokens dark forçados — logo e links flutuam sobre a cena 3D.
 * - VIDRO (rolou pra fora do hero, ou página sem hero dark): glass-nav,
 *   borda, altura compacta.
 * Extras: indicador ativo que DESLIZA entre os links (magic line, segue o
 * hover), rótulo `NN · Seção` ao lado do logo com roll de entrada, barra de
 * progresso "cometa" e hover magnético nos links.
 */
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
  const [active, setActive] = useState<string>("");
  const [float, setFloat] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLSpanElement>(null);
  const pathname = usePathname();

  /* Estado flutuante: só existe se a página tem o hero dark (section#top).
     useLayoutEffect pré-paint: nada de flash de vidro na home nem de nav
     transparente nas páginas internas. setFloat só quando muda de verdade
     (ref-guard) — zero re-render por scroll no regime permanente. */
  useLayoutEffect(() => {
    const hero = document.querySelector("section#top.hero-dark");
    if (!hero) {
      setFloat(false);
      return;
    }
    let last: boolean | null = null;
    let raf = 0;
    const check = () => {
      raf = 0;
      const next = window.scrollY < window.innerHeight * 0.55;
      if (next !== last) {
        last = next;
        setFloat(next);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [pathname]);

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

  // Barra de progresso escrita direto no DOM (via rAF): zero re-render da
  // Nav durante o scroll — era a maior fonte de INP ruim no mobile.
  useEffect(() => {
    let raf = 0;
    const paint = () => {
      raf = 0;
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      if (progressRef.current) {
        progressRef.current.style.width = `${max > 0 ? (h.scrollTop / max) * 100 : 0}%`;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };
    paint();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  /* Magic line: uma única linha que desliza até o link ativo (e segue o
     hover). Medidas via rect (transform do Magnetic não afeta offsets de
     forma relevante); reposiciona no resize e quando o ativo muda. */
  const moveLine = (el: Element | null) => {
    const list = listRef.current;
    const line = lineRef.current;
    if (!list || !line) return;
    if (!el) {
      line.style.opacity = "0";
      return;
    }
    const lb = list.getBoundingClientRect();
    const eb = el.getBoundingClientRect();
    line.style.opacity = "1";
    line.style.transform = `translateX(${eb.left - lb.left + 10}px)`;
    line.style.width = `${Math.max(0, eb.width - 20)}px`;
  };
  const lineToActive = () => {
    moveLine(active ? listRef.current?.querySelector(`a[href="#${active}"]`) ?? null : null);
  };
  useEffect(() => {
    lineToActive();
    const onResize = () => lineToActive();
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const activeIdx = links.findIndex((l) => l.href.slice(1) === active);

  return (
    <header
      className={
        "sticky top-0 z-50 transition-colors duration-300 " +
        (float ? "hero-dark border-b border-transparent" : "glass-nav border-b border-line/10")
      }
    >
      <div aria-hidden className="absolute inset-x-0 top-0 h-[2px]">
        <div ref={progressRef} className="nav-progress relative h-full" style={{ width: "0%" }} />
      </div>

      <nav
        className={
          "container-page flex items-center justify-between transition-[height] duration-300 " +
          (float ? "h-[4.75rem]" : "h-14")
        }
      >
        <div className="flex min-w-0 items-center gap-4">
          <a href="#top" aria-label="MilWeb — início" className="shrink-0">
            <Logo animate />
          </a>
          {/* Rótulo da seção atual (capítulo do filme). Some sobre o hero. */}
          {!float && activeIdx >= 0 && (
            <span className="hidden overflow-hidden lg:block" aria-hidden>
              <span
                key={active}
                className="nav-label-in flex items-baseline gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-fg-subtle"
              >
                <span className="text-accent">{String(activeIdx + 1).padStart(2, "0")}</span>
                {links[activeIdx].label}
              </span>
            </span>
          )}
        </div>

        <div className="hidden items-center gap-1 md:flex md:gap-2">
          <div ref={listRef} className="relative flex items-center gap-1" onMouseLeave={lineToActive}>
            {links.map((l) => {
              const isActive = active === l.href.slice(1);
              return (
                <Magnetic key={l.href} strength={0.35}>
                  <a
                    href={l.href}
                    aria-current={isActive ? "true" : undefined}
                    onMouseEnter={(e) => moveLine(e.currentTarget)}
                    className={
                      "relative rounded-md px-3 py-2 text-sm transition-colors " +
                      (isActive ? "text-fg" : "text-fg-subtle hover:text-fg")
                    }
                  >
                    {l.label}
                  </a>
                </Magnetic>
              );
            })}
            <span
              ref={lineRef}
              aria-hidden
              className="absolute bottom-0 left-0 h-px origin-left bg-accent opacity-0 transition-[transform,width,opacity] duration-300 ease-out"
              style={{ width: 0 }}
            />
          </div>
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

      {/* Menu mobile cinematográfico: atmosfera do hero (sempre dark),
          poeira em suspensão e links numerados em fonte display. */}
      <div
        className={
          "hero-dark fixed inset-0 z-[60] h-[100dvh] overflow-y-auto bg-[#070a12] transition-opacity duration-300 md:hidden " +
          (open ? "opacity-100" : "pointer-events-none opacity-0")
        }
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-grid [background-color:transparent]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [background:radial-gradient(42rem_30rem_at_85%_8%,rgb(56_189_248/0.14),transparent_62%),radial-gradient(30rem_24rem_at_10%_90%,rgb(14_165_233/0.1),transparent_60%)]"
        />
        {MENU_DUST.map((d, i) => (
          <span
            key={i}
            aria-hidden
            className="hero-dust pointer-events-none absolute rounded-full bg-accent-soft/80 blur-[1px]"
            style={{
              left: d.left,
              top: d.top,
              width: d.size,
              height: d.size,
              ["--dust-dur" as string]: d.dur,
              ["--dust-delay" as string]: d.delay,
              ["--dust-drift" as string]: d.drift,
              ["--dust-peak" as string]: d.peak,
            }}
          />
        ))}

        <div className="container-page relative flex h-16 items-center justify-between">
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
        <nav className="container-page relative mt-8 flex flex-col">
          {links.map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              style={{ transitionDelay: open ? `${80 + i * 60}ms` : "0ms" }}
              className={
                "group flex items-baseline gap-4 border-b border-line/10 py-5 transition-all duration-300 " +
                (open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0")
              }
            >
              <span className="font-mono text-xs text-accent">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-3xl font-bold tracking-tight text-fg-muted transition-colors group-hover:text-fg">
                {l.label}
              </span>
            </a>
          ))}
          <a
            href={waHref("Olá Rick! Vim pelo site da MilWeb e quero um orçamento.")}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            style={{ transitionDelay: open ? `${80 + links.length * 60}ms` : "0ms" }}
            className={
              "cta-shine mt-8 inline-flex items-center justify-center gap-2 rounded-lg bg-accent py-4 text-center text-2xl font-semibold tracking-tight text-accent-fg transition-all duration-300 hover:bg-accent-soft " +
              (open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0")
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

/* Motes do menu mobile (fixos: sem Math.random em render). */
const MENU_DUST = [
  { left: "76%", top: "22%", size: 3, dur: "9s", delay: "0s", drift: "16px", peak: 0.5 },
  { left: "88%", top: "48%", size: 2, dur: "12s", delay: "2.4s", drift: "-12px", peak: 0.4 },
  { left: "64%", top: "70%", size: 2, dur: "10.5s", delay: "4.1s", drift: "12px", peak: 0.35 },
  { left: "18%", top: "82%", size: 2, dur: "13s", delay: "1.6s", drift: "-14px", peak: 0.35 },
  { left: "10%", top: "34%", size: 2, dur: "11s", delay: "5.8s", drift: "10px", peak: 0.3 },
];

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
