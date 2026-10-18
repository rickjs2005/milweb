import type { AppId } from "./registry";

/**
 * Ícones do MilWeb OS — uma família só: placa arredondada em grafite fosco
 * (sem brilho, sem relevo), glifo geométrico em traço de 1,5 px, um detalhe
 * em lima por aplicativo. Cada glifo guarda uma ideia própria do app:
 * pasta com etiqueta (Projetos), régua T e esquadro (Estúdio), frasco com
 * reação (Lab), grade de entregas com uma marcada (Serviços), balão com
 * cursor (Contato), controles deslizantes (Ajustes).
 */
export type IconKind = AppId | "search" | "folder";

const GLYPH: Record<IconKind, React.ReactNode> = {
  projects: (
    <>
      <path d="M8 16a2 2 0 0 1 2-2h9l4 4h17a2 2 0 0 1 2 2v18a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2z" />
      <path d="M8 24h32" />
      <path d="M14 31h8" className="os-icon__accent" />
    </>
  ),
  studio: (
    <>
      <path d="M10 12h28M24 12v28" />
      <path d="M14 40l12-12 12 12z" />
      <path d="M24 40v-6" className="os-icon__accent" />
    </>
  ),
  lab: (
    <>
      <path d="M19 9h12M22 9v11L11 37a3 3 0 0 0 2.6 4.5h22.8A3 3 0 0 0 39 37L28 20V9" />
      <path d="M15 33h20" />
      <circle cx="22" cy="37" r="1.4" className="os-icon__accent os-icon__fill" />
      <circle cx="29" cy="36" r="1" className="os-icon__accent os-icon__fill" />
    </>
  ),
  services: (
    <>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <rect x="28" y="9" width="13" height="13" rx="2" />
      <rect x="9" y="28" width="13" height="13" rx="2" />
      <rect x="28" y="28" width="13" height="13" rx="2" />
      <path d="M31 34l3 3 5-6" className="os-icon__accent" />
    </>
  ),
  contact: (
    <>
      <path d="M9 14a4 4 0 0 1 4-4h24a4 4 0 0 1 4 4v15a4 4 0 0 1-4 4H22l-8 7v-7h-1a4 4 0 0 1-4-4z" />
      <path d="M17 20h12M17 26h7" />
      <path d="M31 24v4" className="os-icon__accent" />
    </>
  ),
  settings: (
    <>
      <path d="M10 18h30M10 32h30" />
      <circle cx="20" cy="18" r="4" className="os-icon__knob" />
      <circle cx="31" cy="32" r="4" className="os-icon__knob" />
      <path d="M24 18h16" className="os-icon__accent" />
    </>
  ),
  search: (
    <>
      <circle cx="22" cy="22" r="10" />
      <path d="M30 30l9 9" />
    </>
  ),
  folder: (
    <>
      <path d="M8 16a2 2 0 0 1 2-2h9l4 4h17a2 2 0 0 1 2 2v18a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2z" />
      <path d="M8 24h32" />
    </>
  ),
};

/** Placa + glifo. `size` em px (a placa escala tudo). */
export function AppGlyph({ kind, size = 56, className = "" }: { kind: IconKind; size?: number; className?: string }) {
  return (
    <span className={"os-icon " + className} data-kind={kind} style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 48 48" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {GLYPH[kind]}
      </svg>
    </span>
  );
}

/** Placa com recorte da captura do projeto — resultado de busca. */
export function ProjectTile({ src, alt, size = 56, className = "" }: { src: string; alt: string; size?: number; className?: string }) {
  return (
    <span className={"os-icon os-icon--tile " + className} style={{ width: size, height: size }} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element -- recorte decorativo pequeno; a captura já é WebP otimizada */}
      <img src={src} alt={alt} width={size} height={size} loading="lazy" decoding="async" />
    </span>
  );
}

/** Glifos miúdos dos controles de janela e da barra (mesma caneta dos ícones). */
export function Glyph({ name, size = 12 }: { name: "close" | "min" | "max" | "restore" | "back" | "home" | "arrow" | "search" | "chevron" | "list"; size?: number }) {
  const d: Record<string, React.ReactNode> = {
    close: <path d="M3 3l10 10M13 3L3 13" />,
    min: <path d="M3 8h10" />,
    max: <rect x="3" y="3" width="10" height="10" rx="1" />,
    restore: (
      <>
        <rect x="5" y="5" width="8" height="8" rx="1" />
        <path d="M3 11V4a1 1 0 0 1 1-1h7" />
      </>
    ),
    back: <path d="M10 3L5 8l5 5" />,
    home: <path d="M3 8l5-5 5 5v5H3z" />,
    arrow: <path d="M4 12L12 4M6 4h6v6" />,
    search: (
      <>
        <circle cx="7" cy="7" r="4" />
        <path d="M10 10l3.5 3.5" />
      </>
    ),
    chevron: <path d="M6 3l5 5-5 5" />,
    list: <path d="M3 4h10M3 8h10M3 12h7" />,
  };
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d[name]}
    </svg>
  );
}
