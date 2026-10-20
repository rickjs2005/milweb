/**
 * MilWeb OS — AppRegistry.
 *
 * Fonte única dos aplicativos do sistema: id, rota interna que cada um
 * "possui", geometria padrão da janela e onde aparece (coluna da área de
 * trabalho, dock, grade do celular). Compartilhado pelo DesktopShell, pelo
 * MobileShell, pela busca e pelo WindowManager — nenhum deles tem lista
 * própria. Rótulos vivem nos dicionários (`d.os.apps`), nunca aqui.
 *
 * A raiz (`/`) não pertence a app nenhum: é a área de trabalho vazia —
 * wallpaper, aplicativos e dock. Nada abre sozinho; os cases moram em
 * Projetos e aparecem quando o visitante abre a pasta.
 */

export type AppId = "projects" | "studio" | "lab" | "services" | "about" | "contact" | "settings";

export const APP_IDS = ["projects", "studio", "lab", "services", "about", "contact", "settings"] as const satisfies readonly AppId[];

export type AppDef = {
  id: AppId;
  /** Caminho INTERNO que abre este app (null = sem URL própria, ex.: Ajustes). */
  route: string | null;
  /** Tamanho inicial da janela no desktop (px). */
  size: { w: number; h: number };
  /** Mínimo ao redimensionar. */
  min: { w: number; h: number };
  /** Aparece na dock do desktop / na coluna da área de trabalho / na grade do telefone. */
  dock: boolean;
  desktopIcon: boolean;
  mobileGrid: boolean;
};

export const APPS = {
  projects: { id: "projects", route: "/work", size: { w: 1080, h: 700 }, min: { w: 420, h: 320 }, dock: true, desktopIcon: true, mobileGrid: true },
  studio: { id: "studio", route: "/studio", size: { w: 820, h: 640 }, min: { w: 380, h: 300 }, dock: true, desktopIcon: true, mobileGrid: true },
  lab: { id: "lab", route: "/lab", size: { w: 900, h: 660 }, min: { w: 400, h: 320 }, dock: true, desktopIcon: true, mobileGrid: true },
  services: { id: "services", route: "/services", size: { w: 860, h: 640 }, min: { w: 380, h: 300 }, dock: true, desktopIcon: true, mobileGrid: true },
  /** Sobre: só no telefone (quem faz, base, foco, canais). Sem URL própria, como Ajustes; o desktop conta isso dentro de Estúdio. */
  about: { id: "about", route: null, size: { w: 640, h: 560 }, min: { w: 340, h: 300 }, dock: false, desktopIcon: false, mobileGrid: true },
  contact: { id: "contact", route: "/contact", size: { w: 780, h: 600 }, min: { w: 360, h: 300 }, dock: true, desktopIcon: true, mobileGrid: true },
  settings: { id: "settings", route: null, size: { w: 560, h: 520 }, min: { w: 340, h: 300 }, dock: true, desktopIcon: false, mobileGrid: true },
} as const satisfies Record<AppId, AppDef>;

/** Ordem na dock do desktop (a dock do telefone é de redes — features/os/mobile/dock.tsx). */
export const DOCK_ORDER: AppId[] = ["projects", "studio", "lab", "services", "contact", "settings"];
/** Ordem da coluna de aplicativos do desktop (filtrada por `desktopIcon`). */
export const ICON_ORDER: AppId[] = ["projects", "studio", "lab", "services", "contact", "settings"];
/** Ordem da grade da tela inicial do telefone (4 colunas; a busca entra como oitavo item no launcher). */
export const MOBILE_GRID: AppId[] = ["projects", "studio", "lab", "services", "about", "contact", "settings"];

/**
 * Modo celular = pouco espaço, não "tem toque": largura de telefone, ou
 * altura de telefone deitado em tela que não é de desktop. Tablet e notebook
 * com touchscreen continuam na área de trabalho. A MESMA regra vive em
 * styles/os.css (`@media`), mantida à mão — ver o teste em scripts/os-check.mjs.
 */
export const MOBILE_SHELL_MQ = "(max-width: 719px), ((max-height: 499px) and (max-width: 1079px))";

/** Altura da barra superior e espaço reservado à dock no desktop (px) — iguais aos tokens do CSS. */
export const TOPBAR_H = 36;
export const DOCK_SPACE = 84;

/** desktop = a raiz (nenhum app) · root = raiz de um app · project/page = conteúdo dentro do app · fullpage = fora do OS. */
export type RouteKind = "desktop" | "root" | "project" | "page" | "fullpage";
export type RouteInfo = {
  /** App dono da rota (null na área de trabalho e fora do OS). */
  app: AppId | null;
  kind: RouteKind;
  /** Slug do case ou chave da página interna, quando `kind` é project/page. */
  detail: string | null;
};

/** Páginas comerciais que abrem DENTRO da janela de Serviços (conteúdo vem da própria rota). */
const SERVICE_PAGES = new Set(["criacao-de-sites", "catalogo-whatsapp", "landing-pages", "loja-virtual", "sistemas-sob-medida", "diagnostico"]);

/** Caminho INTERNO (/work/terral) → app dono + tipo de conteúdo. */
export function parseRoute(internal: string): RouteInfo {
  const clean = internal.replace(/\/+$/, "") || "/";
  if (clean === "/") return { app: null, kind: "desktop", detail: null };
  const [, first = "", second, ...rest] = clean.split("/");
  if (first === "work") {
    if (!second) return { app: "projects", kind: "root", detail: null };
    if (rest.length === 0) return { app: "projects", kind: "project", detail: second };
    return { app: null, kind: "fullpage", detail: null };
  }
  if (first === "lab") {
    if (!second) return { app: "lab", kind: "root", detail: null };
    // Protótipos (/lab/milo-null) ocupam a página inteira: são laboratório, não app.
    return { app: null, kind: "fullpage", detail: null };
  }
  if (!second) {
    if (first === "studio" || first === "services" || first === "contact") return { app: first, kind: "root", detail: null };
    if (SERVICE_PAGES.has(first)) return { app: "services", kind: "page", detail: first };
  }
  return { app: null, kind: "fullpage", detail: null };
}

/** Rota "pai" para o botão Voltar do celular: case → coleção; app → início. */
export function parentRoute(internal: string): string {
  const info = parseRoute(internal);
  if (info.kind === "project") return "/work";
  if (info.kind === "page") return "/services";
  return "/";
}

export function isAppId(v: string | null | undefined): v is AppId {
  return !!v && (APP_IDS as readonly string[]).includes(v);
}
