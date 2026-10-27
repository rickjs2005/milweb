"use client";

import { alternatesOf } from "@/i18n/routing";
import { LanguageSwitch } from "@/components/nav/language-switch";
import { DESKTOP_GRID, DOCK_ORDER, ICON_ORDER, APPS, type AppId } from "./registry";
import { useOs, useOsStore } from "./os-shell";
import { AppGlyph, Glyph } from "./icons";
import { OsScene } from "./scene/os-scene";
import { SocialHud, SocialLinks } from "./social-hud";
import { MobileLauncher } from "./mobile/launcher";
import { ThemeToggle } from "./theme-toggle";
import { useClock, useDesktopWide, useLaunch } from "./launch";

export { useClock, useLaunch } from "./launch";

/**
 * Área de trabalho e tela inicial.
 *
 * Desktop: barra superior, o fundo (scene/os-scene.tsx: Tsukuyomi no
 * Obito, Vazio Ilimitado no Gojo), coluna de aplicativos à esquerda,
 * assinatura pequena numa área livre e a dock. O palco (`.os-stage`) é a
 * caixa invisível no centro em volta da qual a lua/o portal se compõem e o
 * HUD das redes se posiciona.
 * Desktop largo (≥ 1080 px, registry.ts › DESKTOP_WIDE_MQ): o lema sobe para
 * o alto à esquerda, os aplicativos viram uma grade 2 × 3 logo abaixo, a dock
 * fica só com Buscar, Ajustes e o tema, e as redes viram um grupo compacto no
 * canto inferior direito (com o WhatsApp). Tablet: tudo como acima.
 * Telefone: o mesmo DOM, com o launcher (mobile/launcher.tsx) no lugar da
 * coluna, da assinatura e do HUD — status, o palco (o fundo aparece ali) e a
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
  // O lema é o h1 da raiz (a página é a área de trabalho); com um app na URL, o h1 é do conteúdo.
  const Motto = route.kind === "desktop" ? "h1" : "p";
  // O ponto final ganha a cor de destaque do tema no desktop largo; no tablet o span só herda a cor.
  const motto = s.sign.motto;
  const dot = motto.endsWith(".");

  return (
    <div className="os-desktop" aria-label={s.regions.desktop}>
      <OsScene />

      {/* Palco: caixa vazia e sem ponteiro no centro — a composição do fundo e o HUD medem por ela. */}
      <div className="os-stage" aria-hidden="true" data-no-inspect />

      {/* Redes do estúdio: painéis HUD ligados ao palco por circuitos (tablet; no desktop largo, SocialLinks abaixo). */}
      <SocialHud />

      {/* Assinatura: pequena, numa área livre (canto inferior esquerdo); no telefone fica só para leitores de tela.
          Desktop largo: o lema sobe para o alto à esquerda e a linha fica sozinha no canto, como rodapé. */}
      <div className="os-sign">
        <Motto className="os-sign__motto">
          {dot ? motto.slice(0, -1) : motto}
          {dot && <span className="os-sign__dot">.</span>}
        </Motto>
        <p className="os-sign__line t-mono">
          <span className="os-sign__mark">{payload.brand.mark} · </span>
          <span>{s.sign.craft}</span>
          <span> · </span>
          <span className="os-sign__origin">{s.sign.origin}</span>
        </p>
      </div>

      {/* Aplicativos: coluna à esquerda (tablet) ou grade 2 × 3 sob o lema (desktop largo). */}
      <DesktopApps />

      {/* Redes em grupo compacto no canto inferior direito (só no desktop largo; o tablet fica com o HUD). */}
      <SocialLinks />

      {/* Tela inicial do telefone: status, grade de ícones (o palco entre os dois mostra o fundo). */}
      <MobileLauncher />
    </div>
  );
}

/**
 * Aplicativos da área de trabalho. Tablet: a coluna de ICON_ORDER. Desktop largo: a grade de DESKTOP_GRID —
 * cada app tem a sua célula no CSS desde a primeira pintura, e depois de hidratar o DOM segue a mesma ordem.
 * Como lá a dock não traz os apps, o estado das janelas (aberta, em primeiro plano, minimizada) passa para o
 * ícone: um ponto sob o rótulo e o estado no nome acessível (só no desktop largo; no tablet nada muda).
 */
function DesktopApps() {
  const { payload } = useOs();
  const s = payload.s;
  const wins = useOsStore((st) => st.wins);
  const focused = useOsStore((st) => st.focused);
  const launch = useLaunch();
  const wide = useDesktopWide();
  const order = wide ? DESKTOP_GRID : ICON_ORDER.filter((id) => APPS[id].desktopIcon);
  return (
    <nav className="os-icons" aria-label={s.regions.icons}>
      <ul>
        {order.map((id) => {
          const w = wins[id];
          const state = w.open ? (w.min ? s.window.minimize : focused === id ? s.window.focused : s.window.running) : null;
          return (
            <li key={id} data-desktop="1" data-app={id}>
              <a
                id={`os-icon-${id}`}
                href={APPS[id].route ? payload.hrefs[id as keyof typeof payload.hrefs] ?? "#" : "#"}
                className="os-icon-btn"
                onClick={(e) => launch(e, id)}
                data-open={w.open ? "1" : "0"}
                data-min={w.open && w.min ? "1" : "0"}
                data-focused={focused === id ? "1" : "0"}
                data-no-inspect
              >
                <AppGlyph kind={id} size={52} />
                <span className="os-icon-btn__label">{s.apps[id]}</span>
                {state && <span className="os-icon-btn__state"> · {state}</span>}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function Dock() {
  const { payload, openSearch } = useOs();
  const s = payload.s;
  const wins = useOsStore((st) => st.wins);
  const focused = useOsStore((st) => st.focused);
  const launch = useLaunch();
  const wide = useDesktopWide();
  const app = (id: AppId) => {
    const w = wins[id];
    const state = w.open ? (w.min ? s.window.minimize : focused === id ? s.window.focused : s.window.running) : null;
    return (
      <li key={id} data-dock-app={id}>
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
  };
  const search = (
    <li key="search" data-dock-sys="search">
      <button type="button" className="os-dock__item" onClick={openSearch} aria-label={s.apps.search} aria-keyshortcuts="/">
        <AppGlyph kind="search" size={40} />
        <span className="os-dock__label">{s.apps.search}</span>
      </button>
    </li>
  );
  // Sol/lua: Gojo (claro) ↔ Obito (escuro), sincronizado com Ajustes pelo mesmo store.
  const theme = (
    <li key="theme" data-dock-sys="theme">
      <ThemeToggle variant="dock" />
    </li>
  );
  // Desktop largo: só os controles do sistema (Buscar, Ajustes, tema) — os apps estão na grade. Tablet: os
  // apps, o separador, Buscar e o tema. Antes da hidratação, o CSS já mostra o desktop largo assim.
  return (
    <nav className="os-dock" aria-label={s.regions.dock} data-no-inspect>
      <ul>
        {wide ? [search, app("settings"), theme] : [...DOCK_ORDER.map(app), <li key="sep" className="os-dock__sep" aria-hidden="true" />, search, theme]}
      </ul>
    </nav>
  );
}
