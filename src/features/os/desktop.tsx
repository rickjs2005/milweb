"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { alternatesOf } from "@/i18n/routing";
import { LanguageSwitch } from "@/components/nav/language-switch";
import { DOCK_ORDER, ICON_ORDER, APPS, type AppId } from "./registry";
import { useOs, useOsStore } from "./os-shell";
import { AppGlyph, Glyph, ProjectTile } from "./icons";
import { HighlightsApp } from "./apps/highlights";

/**
 * Área de trabalho e tela inicial: barra superior, wallpaper autoral,
 * atalhos (coluna à esquerda no desktop, grade no celular), widget do
 * celular e a dock. Tudo lê o registro; nada tem lista própria.
 */

/** Abre um app a partir de um controle (ícone, dock, busca). Mantém Ctrl/Cmd-clique nativo (nova aba). */
export function useLaunch() {
  const { store } = useOs();
  return (e: MouseEvent<HTMLElement>, id: AppId, route?: string) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const st = store.getState();
    const w = st.wins[id];
    if (w.open && route === undefined) {
      st.restore(id, { mode: "push" });
      return;
    }
    st.open(id, { route: route ?? w.route, origin: { x: r.left, y: r.top, w: r.width, h: r.height }, openedBy: el.id || null, source: "user", mode: "push" });
  };
}

export function TopBar() {
  const { payload, internal, openSearch, navigate } = useOs();
  const s = payload.s;
  const focused = useOsStore((st) => st.focused);
  const [time, setTime] = useState<string | null>(null);

  // Relógio só depois de montar (nunca no HTML do servidor: o horário é do visitante).
  useEffect(() => {
    const fmt = () => setTime(new Date().toLocaleTimeString(payload.locale === "pt" ? "pt-BR" : payload.locale, { hour: "2-digit", minute: "2-digit" }));
    fmt();
    const t = window.setInterval(fmt, 20_000);
    return () => window.clearInterval(t);
  }, [payload.locale]);

  return (
    <header className="os-topbar t-mono" role="banner" aria-label={s.regions.topbar} data-no-inspect>
      <a
        href={payload.hrefs.home}
        className="os-topbar__brand"
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey) return;
          e.preventDefault();
          navigate("/", "push", true);
        }}
      >
        {payload.brand.mark}
      </a>
      <span className="os-topbar__app" aria-live="polite">
        {focused ? s.apps[focused] : payload.brand.tagline}
      </span>
      <div className="os-topbar__right">
        <button type="button" className="os-topbar__search" onClick={openSearch} aria-keyshortcuts="/">
          <Glyph name="search" size={13} />
          <span>{s.apps.search}</span>
        </button>
        <LanguageSwitch current={payload.locale} hrefs={alternatesOf(internal)} label={payload.nav.selectLanguage} names={payload.nav.langNames} className="os-topbar__lang" />
        <time className="os-topbar__time tnum" aria-label={s.time}>
          {time ?? "--:--"}
        </time>
      </div>
    </header>
  );
}

export function Desktop() {
  const { payload, route, openSearch, store } = useOs();
  const s = payload.s;
  const Headline = route.app === "home" ? "h1" : "p";
  const shortcuts = payload.shortcuts.map((slug) => payload.projects.find((p) => p.slug === slug)!).filter(Boolean);
  const launch = useLaunch();

  return (
    <div className="os-desktop" aria-label={s.regions.desktop}>
      <div className="os-wallpaper" aria-hidden="true">
        <div className="os-wallpaper__grid" />
        <svg className="os-wallpaper__lines" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" fill="none" stroke="currentColor">
          <line x1="120" y1="700" x2="520" y2="620" strokeWidth="2" />
          <line x1="980" y1="120" x2="1320" y2="260" strokeWidth="1" />
          <line x1="300" y1="200" x2="380" y2="560" strokeWidth="2" />
          <line x1="860" y1="760" x2="1240" y2="700" strokeWidth="1" />
          <line x1="640" y1="80" x2="700" y2="300" strokeWidth="2" />
          <line x1="1100" y1="480" x2="1400" y2="430" strokeWidth="1" />
          <rect x="960" y="330" width="260" height="150" strokeWidth="1" />
          <rect x="1030" y="390" width="120" height="70" strokeWidth="1" />
          <circle cx="1090" cy="425" r="3" className="os-wallpaper__dot" />
        </svg>
        {/* A escultura orbital (arte existente) só entra no desktop: fundo CSS atrás de media query,
            com preload condicionado — o celular nunca baixa os 210 KB. */}
        <link rel="preload" as="image" href="/art/orbital-sculpture-v2.webp" media="(min-width: 720px) and (min-height: 500px)" />
        <div className="os-wallpaper__art" />
      </div>

      {/* Marca e manchete: tipografia editorial reservada ao wallpaper. H1 só na raiz. */}
      <div className="os-wallpaper__type">
        <p className="os-wallpaper__eyebrow t-mono">
          <span>{payload.brand.mark}</span>
          <span className="os-wallpaper__tagline"> — {payload.brand.tagline.toUpperCase()}</span>
          <span> · {payload.brand.origin.toUpperCase()}</span>
        </p>
        <Headline className="os-wallpaper__headline t-display">
          <span className="block">{payload.brand.headline[0]}</span>
          <span className="block">{payload.brand.headline[1]}</span>
        </Headline>
        <p className="os-wallpaper__support t-mono">{payload.brand.support.join(" · ")}</p>
      </div>

      {/* Tela inicial do celular: identificação, mensagem curta, widget real, grade. */}
      <div className="os-home" aria-label={s.regions.home}>
        <div className="os-home__brand">
          <p className="os-home__message">{s.mobile.message}</p>
          <div className="os-home__tools">
            <button type="button" className="os-home__tool" onClick={openSearch} aria-keyshortcuts="/">
              <Glyph name="search" size={14} />
              <span>{s.apps.search}</span>
            </button>
            <button type="button" className="os-home__tool" onClick={() => store.getState().setPrefs({ simple: true })}>
              <span aria-hidden="true">≡</span>
              <span>{s.simple.title}</span>
            </button>
          </div>
        </div>
        <section className="os-home__widget" aria-label={s.mobile.widget}>
          <HighlightsApp compact />
        </section>

        <nav className="os-icons" aria-label={s.regions.icons}>
          <ul>
            {ICON_ORDER.filter((id) => APPS[id].desktopIcon || APPS[id].mobileGrid).map((id) => (
              <li key={id} data-desktop={APPS[id].desktopIcon ? "1" : "0"} data-mobile={APPS[id].mobileGrid ? "1" : "0"}>
                <a id={`os-icon-${id}`} href={APPS[id].route ? payload.hrefs[id as keyof typeof payload.hrefs] ?? "#" : "#"} className="os-icon-btn" onClick={(e) => launch(e, id)} data-no-inspect>
                  <AppGlyph kind={id} />
                  <span className="os-icon-btn__label">{s.apps[id]}</span>
                </a>
              </li>
            ))}
            {shortcuts.map((p) => (
              <li key={p.slug} data-desktop="1" data-mobile="1" data-shortcut>
                <a id={`os-icon-${p.slug}`} href={p.href} className="os-icon-btn" onClick={(e) => launch(e, "projects", `/work/${p.slug}`)} data-no-inspect aria-label={`${p.name} · ${s.home.shortcut}`}>
                  <ProjectTile src={p.image} alt="" />
                  <span className="os-icon-btn__label">{p.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}

export function Dock() {
  const { payload, openSearch } = useOs();
  const s = payload.s;
  const wins = useOsStore((st) => st.wins);
  const focused = useOsStore((st) => st.focused);
  const launch = useLaunch();
  return (
    <nav className="os-dock" aria-label={s.regions.dock} data-no-inspect>
      <ul>
        {DOCK_ORDER.map((id) => {
          const w = wins[id];
          const state = w.open ? (w.min ? s.window.minimize : focused === id ? s.window.focused : s.window.running) : null;
          return (
            <li key={id} data-mobile={APPS[id].mobileDock ? "1" : "0"}>
              <a
                id={`os-dock-${id}`}
                data-dock-id={id}
                href={APPS[id].route ? payload.hrefs[id as keyof typeof payload.hrefs] ?? "#" : "#"}
                className="os-dock__item"
                aria-label={state ? `${s.apps[id]} · ${state}` : s.apps[id]}
                aria-current={focused === id ? "true" : undefined}
                data-open={w.open ? "1" : "0"}
                onClick={(e) => launch(e, id)}
              >
                <AppGlyph kind={id} size={44} />
                <span className="os-dock__label">{s.apps[id]}</span>
              </a>
            </li>
          );
        })}
        <li className="os-dock__sep" aria-hidden="true" />
        <li data-mobile="0">
          <button type="button" className="os-dock__item" onClick={openSearch} aria-label={s.apps.search} aria-keyshortcuts="/">
            <AppGlyph kind="search" size={44} />
            <span className="os-dock__label">{s.apps.search}</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
