import type { AppId } from "../registry";

/**
 * Ícones do launcher do telefone — uma família própria, diferente das placas
 * em grafite do desktop: cada app tem a sua placa em degradê (cor em
 * styles/os-mobile.css) e um glifo preenchido, em duas tonalidades, legível a
 * 56–64 px. Nada de caixa de painel administrativo: a ideia de cada app está
 * no desenho — a pasta com o cartaz de recompensa (Projetos), o esquadro com a
 * régua (Estúdio), o frasco em reação (Lab), as entregas marcadas (Serviços), o
 * crachá (Sobre), o balão de conversa (Contato), os controles (Ajustes) e a
 * lupa (Buscar).
 */
export type LaunchKind = AppId | "search";

const GLYPH: Record<LaunchKind, React.ReactNode> = {
  projects: (
    <>
      <path d="M6 15a3 3 0 0 1 3-3h10.5l4 4H39a3 3 0 0 1 3 3v17a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3z" fill="currentColor" opacity=".96" />
      <path d="M6 22h36v2H6z" fill="#000" opacity=".12" />
      <rect x="18" y="24" width="12" height="13" rx="1.4" className="os-micon__paper" />
      <path d="M21 28h6M21 31h6M21 34h4" stroke="#2a231c" strokeWidth="1.4" strokeLinecap="round" opacity=".7" />
    </>
  ),
  studio: (
    <>
      <path d="M9 39L39 9v30z" fill="currentColor" opacity=".95" />
      <path d="M18 34.5L33.5 19v15.5z" fill="#0f1318" opacity=".85" />
      <path d="M6 13h8v3H6zM6 19h5v3H6z" className="os-micon__accent" />
      <circle cx="33.5" cy="34.5" r="2.4" className="os-micon__accent" />
    </>
  ),
  lab: (
    <>
      <path d="M18.5 7h11a1.5 1.5 0 0 1 0 3H28v8.6l10.6 17.3A3.4 3.4 0 0 1 35.7 41H12.3a3.4 3.4 0 0 1-2.9-5.1L20 18.6V10h-1.5a1.5 1.5 0 0 1 0-3z" fill="currentColor" opacity=".96" />
      <path d="M14.2 33l4.3-7h11l4.3 7z" className="os-micon__accent" />
      <circle cx="21" cy="36.5" r="1.6" fill="#0f1318" opacity=".55" />
      <circle cx="28.5" cy="35.5" r="1.1" fill="#0f1318" opacity=".55" />
      <circle cx="25" cy="22" r="1.3" className="os-micon__accent" />
    </>
  ),
  services: (
    <>
      <rect x="8" y="8" width="14" height="14" rx="3" fill="currentColor" />
      <rect x="26" y="8" width="14" height="14" rx="3" fill="currentColor" />
      <rect x="8" y="26" width="14" height="14" rx="3" fill="currentColor" />
      <rect x="26" y="26" width="14" height="14" rx="3" className="os-micon__accent" />
      <path d="M29.5 33l2.8 2.8 5.2-5.6" fill="none" stroke="#0f1318" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  about: (
    <>
      <rect x="9" y="7" width="30" height="34" rx="4" fill="currentColor" opacity=".96" />
      <rect x="19" y="4" width="10" height="5" rx="2" className="os-micon__accent" />
      <circle cx="24" cy="20" r="5" fill="#0f1318" opacity=".85" />
      <path d="M14.5 34c0-5.2 4.3-8.5 9.5-8.5s9.5 3.3 9.5 8.5z" fill="#0f1318" opacity=".85" />
      <path d="M15 37.5h18" stroke="#0f1318" strokeWidth="1.6" strokeLinecap="round" opacity=".35" />
    </>
  ),
  contact: (
    <>
      <path d="M8 13a5 5 0 0 1 5-5h22a5 5 0 0 1 5 5v14a5 5 0 0 1-5 5H21l-8.5 7.5V32H13a5 5 0 0 1-5-5z" fill="currentColor" opacity=".96" />
      <circle cx="17" cy="20" r="2.2" fill="#0f1318" opacity=".8" />
      <circle cx="24" cy="20" r="2.2" fill="#0f1318" opacity=".8" />
      <circle cx="31" cy="20" r="2.2" className="os-micon__accent" />
    </>
  ),
  settings: (
    <>
      <path d="M9 14h30M9 24h30M9 34h30" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity=".9" />
      <circle cx="19" cy="14" r="4.2" fill="currentColor" stroke="#0f1318" strokeWidth="1.6" />
      <circle cx="31" cy="24" r="4.2" className="os-micon__accent" stroke="#0f1318" strokeWidth="1.6" />
      <circle cx="16" cy="34" r="4.2" fill="currentColor" stroke="#0f1318" strokeWidth="1.6" />
    </>
  ),
  search: (
    <>
      <circle cx="21" cy="21" r="11" fill="none" stroke="currentColor" strokeWidth="4" />
      <path d="M29.5 29.5L40 40" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="17.5" cy="17.5" r="3" fill="currentColor" opacity=".5" />
    </>
  ),
};

/** Placa + glifo do launcher. A placa escala com `--mw-icon` (CSS); o SVG ocupa ~56 % dela. */
export function LaunchIcon({ app }: { app: LaunchKind }) {
  return (
    <span className="os-micon" data-app={app} aria-hidden="true">
      <svg viewBox="0 0 48 48" fill="none">
        {GLYPH[app]}
      </svg>
    </span>
  );
}

/** O WhatsApp na dock de redes (mesma caneta dos ícones das redes do HUD). */
export function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}
