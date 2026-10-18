import { createStore } from "zustand/vanilla";
import { APPS, APP_IDS, parseRoute, type AppId } from "./registry";

/**
 * WindowManager do MilWeb OS — estado das janelas, fora do React.
 *
 * Regras (ver docs/milweb-os-references.md):
 *  - z-order é a posição na pilha `order` (fundo → topo); nenhum contador
 *    que cresce sem teto. Foco = mover para o fim da pilha.
 *  - Minimizar NÃO desmonta: a janela fica `inert` e invisível, e a dock a
 *    restaura com a geometria preservada.
 *  - Toda geometria é clampada à área útil (entre a barra superior e a dock).
 *    Não existe janela perdida fora da viewport: no redimensionamento da
 *    janela do navegador tudo é recalculado.
 *  - A URL identifica o app em foco: cada ação registra `last` (origem e
 *    modo) e o shell decide se navega (push/replace). Ações disparadas pela
 *    própria rota (`source: "route"`) nunca navegam de volta.
 *  - A loja nasce da rota (SSR e cliente iguais); preferências e posições
 *    salvas entram depois da hidratação, validadas e clampadas.
 */

export type Rect = { x: number; y: number; w: number; h: number };
export type Shell = "auto" | "desktop" | "mobile" | "simple";
export type Source = "user" | "route";
export type NavMode = "push" | "replace";

export type Win = {
  id: AppId;
  open: boolean;
  min: boolean;
  max: boolean;
  rect: Rect;
  /** Geometria anterior ao maximizar. */
  restore: Rect | null;
  /** Caminho INTERNO que a janela mostra (/work/terral). null = sem URL (Ajustes). */
  route: string | null;
  /** Retângulo do ícone que abriu (transição ícone → tela no celular). */
  origin: Rect | null;
  /** id DOM do controle que abriu a janela — o foco volta pra ele ao fechar. */
  openedBy: string | null;
  /** Posição de rolagem da raiz do app, para voltar ao mesmo lugar. */
  scroll: number;
  /** none = nunca aberta · auto = posição padrão (recalculada ao mudar a área) · user = movida/redimensionada (só clampada). */
  placed: "none" | "auto" | "user";
};

export type OsPrefs = { theme: "graphite" | "paper"; motion: "system" | "reduce"; simple: boolean };

export type OsState = {
  wins: Record<AppId, Win>;
  order: AppId[];
  focused: AppId | null;
  area: { w: number; h: number };
  shell: Shell;
  prefs: OsPrefs;
  /** Janela que deve receber foco de teclado no próximo commit (abertura pelo usuário). */
  pendingFocus: AppId | null;
  /** Última ação relevante para a URL. O shell lê e navega se for do usuário. */
  last: { source: Source; mode: NavMode; seq: number };
  hydrated: boolean;

  open: (id: AppId, opts?: { route?: string | null; origin?: Rect | null; openedBy?: string | null; source?: Source; mode?: NavMode; focus?: boolean }) => void;
  close: (id: AppId) => void;
  focus: (id: AppId, opts?: { source?: Source; mode?: NavMode }) => void;
  minimize: (id: AppId) => void;
  restore: (id: AppId, opts?: { mode?: NavMode }) => void;
  toggleMax: (id: AppId) => void;
  move: (id: AppId, x: number, y: number) => void;
  resize: (id: AppId, w: number, h: number) => void;
  setScroll: (id: AppId, y: number) => void;
  setArea: (w: number, h: number) => void;
  setShell: (shell: Shell) => void;
  setPrefs: (p: Partial<OsPrefs>) => void;
  resetLayout: () => void;
  clearPendingFocus: () => void;
  hydrate: () => void;
};

const PREFS_KEY = "milweb-os:prefs";
const RECTS_KEY = "milweb-os:windows";
/** Área nominal antes de medir (SSR). O CSS clampa por conta própria até lá. */
const NOMINAL = { w: 1440, h: 820 };
const CASCADE = 28;

function clampRect(r: Rect, area: { w: number; h: number }, id: AppId): Rect {
  const min = APPS[id].min;
  const w = Math.max(Math.min(r.w, area.w), Math.min(min.w, area.w));
  const h = Math.max(Math.min(r.h, area.h), Math.min(min.h, area.h));
  const x = Math.round(Math.max(0, Math.min(r.x, area.w - w)));
  const y = Math.round(Math.max(0, Math.min(r.y, area.h - h)));
  return { x, y, w: Math.round(w), h: Math.round(h) };
}

function defaultRect(id: AppId, area: { w: number; h: number }, openCount: number): Rect {
  const size = APPS[id].size;
  const w = Math.min(size.w, area.w - 24);
  const h = Math.min(size.h, area.h - 16);
  // Centro deslocado para a direita (os atalhos moram à esquerda) + cascata por janela aberta.
  const x = Math.max(12, Math.round((area.w - w) / 2 + 72 + (openCount % 5) * CASCADE));
  const y = Math.max(8, Math.round((area.h - h) / 2 - 12 + (openCount % 5) * CASCADE));
  return clampRect({ x, y, w, h }, area, id);
}

function blankWin(id: AppId): Win {
  return { id, open: false, min: false, max: false, rect: defaultRect(id, NOMINAL, 0), restore: null, route: APPS[id].route, origin: null, openedBy: null, scroll: 0, placed: "none" };
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function isRect(v: unknown): v is Rect {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  return ["x", "y", "w", "h"].every((k) => typeof r[k] === "number" && Number.isFinite(r[k] as number));
}

export function createOsStore(initialInternal: string) {
  const info = parseRoute(initialInternal);
  const wins = Object.fromEntries(APP_IDS.map((id) => [id, blankWin(id)])) as Record<AppId, Win>;
  const order: AppId[] = [];
  if (info.app) {
    wins[info.app] = { ...wins[info.app], open: true, route: initialInternal, placed: "auto" };
    order.push(info.app);
  }

  return createStore<OsState>()((set, get) => {
    const bump = (source: Source, mode: NavMode) => ({ last: { source, mode, seq: get().last.seq + 1 } });
    /** Só geometria escolhida pelo visitante é lembrada; a automática nasce de novo a cada visita. */
    const persistRects = () => {
      const s = get();
      const rects = Object.fromEntries(APP_IDS.filter((id) => s.wins[id].placed === "user").map((id) => [id, s.wins[id].rect]));
      writeJson(RECTS_KEY, rects);
    };

    return {
      wins,
      order,
      focused: info.app,
      area: NOMINAL,
      shell: "auto",
      prefs: { theme: "graphite", motion: "system", simple: false },
      pendingFocus: null,
      last: { source: "route", mode: "replace", seq: 0 },
      hydrated: false,

      open: (id, opts = {}) => {
        const { source = "user", mode = "push", focus = true } = opts;
        set((s) => {
          const w = s.wins[id];
          const wasOpen = w.open;
          const openCount = s.order.length;
          const rect = wasOpen ? w.rect : w.placed === "user" ? clampRect(w.rect, s.area, id) : defaultRect(id, s.area, openCount);
          const next: Win = {
            ...w,
            open: true,
            min: false,
            rect,
            placed: w.placed === "user" ? "user" : "auto",
            route: opts.route !== undefined ? opts.route : w.route,
            origin: opts.origin ?? null,
            openedBy: opts.openedBy ?? w.openedBy,
            scroll: wasOpen ? w.scroll : 0,
          };
          const order = focus ? [...s.order.filter((x) => x !== id), id] : wasOpen ? s.order : [id, ...s.order];
          return {
            wins: { ...s.wins, [id]: next },
            order,
            focused: focus ? id : s.focused,
            pendingFocus: source === "user" && focus ? id : s.pendingFocus,
            ...bump(source, mode),
          };
        });
      },

      close: (id) => {
        set((s) => {
          const order = s.order.filter((x) => x !== id);
          const focused = s.focused === id ? (order.filter((x) => !s.wins[x].min).at(-1) ?? null) : s.focused;
          return { wins: { ...s.wins, [id]: { ...s.wins[id], open: false, min: false, max: false, origin: null } }, order, focused, ...bump("user", "replace") };
        });
      },

      focus: (id, opts = {}) => {
        const { source = "user", mode = "replace" } = opts;
        set((s) => {
          if (!s.wins[id].open) return {};
          if (s.focused === id && s.order.at(-1) === id && !s.wins[id].min) return {};
          const w = s.wins[id];
          return {
            wins: w.min ? { ...s.wins, [id]: { ...w, min: false } } : s.wins,
            order: [...s.order.filter((x) => x !== id), id],
            focused: id,
            ...bump(source, mode),
          };
        });
      },

      minimize: (id) => {
        set((s) => {
          const order = s.order;
          const focused = s.focused === id ? (order.filter((x) => x !== id && !s.wins[x].min).at(-1) ?? null) : s.focused;
          return { wins: { ...s.wins, [id]: { ...s.wins[id], min: true } }, focused, ...bump("user", "replace") };
        });
      },

      restore: (id, opts = {}) => {
        get().focus(id, { source: "user", mode: opts.mode ?? "push" });
        set({ pendingFocus: id });
      },

      toggleMax: (id) => {
        set((s) => {
          const w = s.wins[id];
          if (w.max) {
            const rect = w.restore ? clampRect(w.restore, s.area, id) : w.rect;
            return { wins: { ...s.wins, [id]: { ...w, max: false, restore: null, rect } } };
          }
          return { wins: { ...s.wins, [id]: { ...w, max: true, restore: w.rect } } };
        });
      },

      move: (id, x, y) => {
        set((s) => {
          const w = s.wins[id];
          return { wins: { ...s.wins, [id]: { ...w, placed: "user", rect: clampRect({ ...w.rect, x, y }, s.area, id) } } };
        });
        persistRects();
      },

      resize: (id, w, h) => {
        set((s) => {
          const win = s.wins[id];
          return { wins: { ...s.wins, [id]: { ...win, placed: "user", rect: clampRect({ ...win.rect, w, h }, s.area, id) } } };
        });
        persistRects();
      },

      setScroll: (id, y) => {
        const w = get().wins[id];
        if (w.scroll === y) return;
        set((s) => ({ wins: { ...s.wins, [id]: { ...s.wins[id], scroll: y } } }));
      },

      setArea: (aw, ah) => {
        const w = Math.max(240, Math.round(aw));
        const h = Math.max(200, Math.round(ah));
        set((s) => {
          if (s.area.w === w && s.area.h === h) return {};
          const area = { w, h };
          const wins = { ...s.wins };
          for (const id of APP_IDS) {
            const win = wins[id];
            // Posição automática acompanha a área nova (cascata pela ordem de abertura); a escolhida pelo visitante só é clampada.
            const idx = Math.max(0, s.order.indexOf(id));
            const rect = win.placed === "user" ? clampRect(win.rect, area, id) : defaultRect(id, area, win.open ? idx : 0);
            wins[id] = { ...win, rect, restore: win.restore ? clampRect(win.restore, area, id) : null };
          }
          return { area, wins };
        });
      },

      setShell: (shell) => set((s) => (s.shell === shell ? {} : { shell })),

      setPrefs: (p) => {
        set((s) => ({ prefs: { ...s.prefs, ...p } }));
        writeJson(PREFS_KEY, get().prefs);
      },

      resetLayout: () => {
        set((s) => {
          const wins = { ...s.wins };
          s.order.forEach((id, i) => {
            wins[id] = { ...wins[id], max: false, restore: null, placed: "auto", rect: defaultRect(id, s.area, i) };
          });
          for (const id of APP_IDS) if (!wins[id].open) wins[id] = { ...wins[id], placed: "none", rect: defaultRect(id, s.area, 0) };
          return { wins };
        });
        try {
          localStorage.removeItem(RECTS_KEY);
        } catch {}
      },

      clearPendingFocus: () => set({ pendingFocus: null }),

      hydrate: () => {
        if (get().hydrated) return;
        const prefs = readJson<Partial<OsPrefs>>(PREFS_KEY);
        const rects = readJson<Record<string, unknown>>(RECTS_KEY);
        set((s) => {
          const wins = { ...s.wins };
          if (rects) {
            for (const id of APP_IDS) {
              const r = rects[id];
              if (isRect(r)) wins[id] = { ...wins[id], placed: "user", rect: clampRect(r, s.area, id) };
            }
          }
          const theme = prefs?.theme === "paper" ? "paper" : "graphite";
          const motion = prefs?.motion === "reduce" ? "reduce" : "system";
          const simple = prefs?.simple === true;
          return { wins, prefs: { theme, motion, simple }, hydrated: true };
        });
      },
    };
  });
}

export type OsStore = ReturnType<typeof createOsStore>;
