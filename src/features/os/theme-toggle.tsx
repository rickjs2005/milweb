"use client";

import { useOs, useOsStore } from "./os-shell";
import { otherTheme } from "./theme";
import { AppGlyph } from "./icons";

/**
 * Sol/lua — o interruptor de tema da dock (desktop) e da dock de redes
 * (telefone). Um `role="switch"` com o nome fixo "Tema escuro (Obito)":
 * ligado = Obito, desligado = Gojo. O ícone mostra para ONDE o clique leva
 * (lua no tema claro, sol no escuro) e quem escolhe qual dos dois aparece é
 * o CSS, pelo `data-os-theme` do <html> — por isso o HTML do servidor é o
 * mesmo para qualquer tema (sem erro de hidratação) e o ícone já nasce certo
 * antes de o React acordar. `aria-checked` só diz a verdade depois da
 * hidratação, que acontece antes da primeira pintura.
 *
 * O clique pede o tema ao store (`requestTheme`): com o olho vivo, ele fecha
 * a pálpebra, a interface muda no escuro e o olho reabre com a identidade
 * nova; cliques rápidos só trocam o destino. `data-theme-toggle` tira o
 * controle do piscar genérico de `pointerdown` (seria um fechamento a mais).
 */
export function ThemeToggle({ variant }: { variant: "dock" | "mdock" }) {
  const { payload, store } = useOs();
  const s = payload.s.settings;
  const theme = useOsStore((st) => st.prefs.theme);
  const hydrated = useOsStore((st) => st.hydrated);
  const dark = hydrated && theme === "obito";
  const onClick = () => {
    const st = store.getState();
    st.requestTheme(otherTheme(st.themePending ?? st.prefs.theme));
  };

  if (variant === "mdock") {
    return (
      <button type="button" role="switch" aria-checked={dark} aria-label={s.themeSwitch} className="os-mdock__item os-mdock__theme" data-theme-toggle onClick={onClick}>
        <span className="os-mdock__icon" data-social="theme" aria-hidden="true">
          <ThemeGlyph />
        </span>
        <span className="os-mdock__label">{s.themeShort}</span>
      </button>
    );
  }
  return (
    <button type="button" role="switch" aria-checked={dark} aria-label={s.themeSwitch} className="os-dock__item os-dock__theme" data-theme-toggle onClick={onClick}>
      <AppGlyph kind="theme" size={40} />
      <span className="os-dock__label">{dark ? s.obito : s.gojo}</span>
    </button>
  );
}

/** Sol e lua no mesmo SVG; o CSS (`.os-theme__sun` / `.os-theme__moon`) mostra um por tema. */
export function ThemeGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <g className="os-theme__sun">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
      </g>
      <g className="os-theme__moon">
        <path d="M14.2 3.2a8.6 8.6 0 1 0 6.6 12.9A7.2 7.2 0 0 1 14.2 3.2z" />
      </g>
    </svg>
  );
}
