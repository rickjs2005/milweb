"use client";

import { alternatesOf } from "@/i18n/routing";
import { LanguageSwitch } from "@/components/nav/language-switch";
import { DOCK_ORDER, ICON_ORDER, APPS } from "./registry";
import { useOs, useOsStore } from "./os-shell";
import { AppGlyph, Glyph } from "./icons";
import { OsEye } from "./eye/os-eye";
import { SocialHud } from "./social-hud";
import { MobileLauncher } from "./mobile/launcher";
import { useClock, useLaunch } from "./launch";

export { useClock, useLaunch } from "./launch";

/**
 * Área de trabalho e tela inicial.
 *
 * Desktop: barra superior, wallpaper com o olho (centro), coluna de
 * aplicativos à esquerda, assinatura pequena numa área livre e a dock.
 * Telefone: o mesmo DOM, com o launcher (mobile/launcher.tsx) no lugar da
 * coluna, da assinatura e do HUD — status, olho como papel de parede e a
 * grade de ícones; a dock de redes é irmã (mobile/dock.tsx). Nada abre
 * sozinho; os cases moram em Projetos. Tudo lê o registro; nada tem lista
 * própria.
 */

export function TopBar() {
  const { payload, internal, openSearch, navigate } = useOs();
  const s = payload.s;
  const focused = useOsStore((st) => st.focused);
  const time = useClock(payload.locale);

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
  const { payload, route } = useOs();
  const s = payload.s;
  const launch = useLaunch();
  // O lema é o h1 da raiz (a página é a área de trabalho); com um app na URL, o h1 é do conteúdo.
  const Motto = route.kind === "desktop" ? "h1" : "p";

  return (
    <div className="os-desktop" aria-label={s.regions.desktop}>
      <div className="os-wallpaper" aria-hidden="true" />

      <OsEye />

      {/* Redes do estúdio: painéis HUD ligados ao olho por circuitos (desktop). */}
      <SocialHud />

      {/* Assinatura: pequena, numa área livre (canto inferior esquerdo); no telefone fica só para leitores de tela. */}
      <div className="os-sign">
        <Motto className="os-sign__motto">{s.sign.motto}</Motto>
        <p className="os-sign__line t-mono">
          <span className="os-sign__mark">{payload.brand.mark} · </span>
          <span>{s.sign.craft}</span>
          <span> · </span>
          <span className="os-sign__origin">{s.sign.origin}</span>
        </p>
      </div>

      {/* Aplicativos: coluna à esquerda (desktop). */}
      <nav className="os-icons" aria-label={s.regions.icons}>
        <ul>
          {ICON_ORDER.filter((id) => APPS[id].desktopIcon).map((id) => (
            <li key={id} data-desktop="1">
              <a id={`os-icon-${id}`} href={APPS[id].route ? payload.hrefs[id as keyof typeof payload.hrefs] ?? "#" : "#"} className="os-icon-btn" onClick={(e) => launch(e, id)} data-no-inspect>
                <AppGlyph kind={id} size={52} />
                <span className="os-icon-btn__label">{s.apps[id]}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Tela inicial do telefone: status, grade de ícones (o olho acima é o papel de parede). */}
      <MobileLauncher />
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
            <li key={id}>
              <a
                id={`os-dock-${id}`}
                data-dock-id={id}
                href={APPS[id].route ? payload.hrefs[id as keyof typeof payload.hrefs] ?? "#" : "#"}
                className="os-dock__item"
                aria-label={state ? `${s.apps[id]} · ${state}` : s.apps[id]}
                aria-current={focused === id ? "true" : undefined}
                data-open={w.open ? "1" : "0"}
                data-min={w.open && w.min ? "1" : "0"}
                onClick={(e) => launch(e, id)}
              >
                <AppGlyph kind={id} size={40} />
                <span className="os-dock__label">{s.apps[id]}</span>
              </a>
            </li>
          );
        })}
        <li className="os-dock__sep" aria-hidden="true" />
        <li>
          <button type="button" className="os-dock__item" onClick={openSearch} aria-label={s.apps.search} aria-keyshortcuts="/">
            <AppGlyph kind="search" size={40} />
            <span className="os-dock__label">{s.apps.search}</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
