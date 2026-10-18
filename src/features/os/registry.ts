/**
 * MilWeb OS — AppRegistry.
 *
 * Fonte única dos aplicativos do sistema: id, rota interna que cada um
 * "possui", ícone, geometria padrão da janela e onde aparece (área de
 * trabalho, dock, grade do celular). Compartilhado pelo DesktopShell, pelo
 * MobileShell, pela busca e pelo WindowManager — nenhum deles tem lista
 * própria. Rótulos vivem nos dicionários (`d.os.apps`), nunca aqui.
 */

export type AppId = "home" | "projects" | "studio" | "lab" | "services" | "contact" | "settings";

export const APP_IDS = ["home", "projects", "studio", "lab", "services", "contact", "settings"] as const satisfies readonly AppId[];

export type AppDef = {
  id: AppId;
  /** Caminho INTERNO que abre este app (null = sem URL própria, ex.: Ajustes). */
  route: string | null;
  /** Tamanho inicial da janela no desktop (px). */
  size: { w: number; h: number };
  /** Mínimo ao redimensionar. */
  min: { w: number; h: number };
  /** Aparece na dock do desktop / do celular / como atalho na área de trabalho / na grade do celular. */
  dock: boolean;
  mobileDock: boolean;
  desktopIcon: boolean;
  mobileGrid: boolean;
};

export const APPS = {
  home: { id: "home", route: "/", size: { w: 760, h: 520 }, min: { w: 360, h: 300 }, dock: false, mobileDock: false, desktopIcon: true, mobileGrid: false },
  projects: { id: "projects", route: "/work", size: { w: 1080, h: 700 }, min: { w: 420, h: 320 }, dock: true, mobileDock: true, desktopIcon: true, mobileGrid: true },
  studio: { id: "studio", route: "/studio", size: { w: 820, h: 640 }, min: { w: 380, h: 300 }, dock: true, mobileDock: true, desktopIcon: true, mobileGrid: true },
  lab: { id: "lab", route: "/lab", size: { w: 900, h: 660 }, min: { w: 400, h: 320 }, dock: true, mobileDock: true, desktopIcon: true, mobileGrid: true },
  services: { id: "services", route: "/services", size: { w: 860, h: 640 }, min: { w: 380, h: 300 }, dock: true, mobileDock: false, desktopIcon: true, mobileGrid: true },
  contact: { id: "contact", route: "/contact", size: { w: 780, h: 600 }, min: { w: 360, h: 300 }, dock: true, mobileDock: true, desktopIcon: true, mobileGrid: true },
  settings: { id: "settings", route: null, size: { w: 560, h: 520 }, min: { w: 340, h: 300 }, dock: true, mobileDock: false, desktopIcon: false, mobileGrid: true },
} as const satisfies Record<AppId, AppDef>;

/** Ordem na dock do desktop e na dock do celular. */
export const DOCK_ORDER: AppId[] = ["projects", "studio", "lab", "services", "contact", "settings"];
export const MOBILE_DOCK: AppId[] = ["projects", "studio", "lab", "contact"];
/** Ordem dos atalhos na área de trabalho / grade do celular (atalhos de projeto entram depois de Projetos). */
export const ICON_ORDER: AppId[] = ["projects", "studio", "lab", "services", "contact", "settings", "home"];

/** Atalhos de projetos reais na área de trabalho (cases da coleção, não inventados). */
export const SHORTCUT_SLUGS = ["kavita-drones", "terral", "atelier-vertex"] as const;

/**
 * Modo celular = pouco espaço, não "tem toque": largura de telefone, ou
 * altura de telefone deitado em tela que não é de desktop. Tablet e notebook
 * com touchscreen continuam na área de trabalho. A MESMA regra vive em
 * styles/os.css (`@media`), mantida à mão — ver o teste em scripts/os-check.mjs.
 */
export const MOBILE_SHELL_MQ = "(max-width: 719px), ((max-height: 499px) and (max-width: 1079px))";

/** Altura da barra superior e espaço reservado à dock no desktop (px) — iguais aos tokens do CSS. */
export const TOPBAR_H = 36;
export const DOCK_SPACE = 92;

export type RouteKind = "root" | "project" | "page" | "fullpage";
export type RouteInfo = {
  /** App dono da rota (null quando a rota não pertence ao OS). */
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
  if (clean === "/") return { app: "home", kind: "root", detail: null };
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
