import { createStore } from "zustand/vanilla";
import { APPS, APP_IDS, parseRoute, type AppId } from "./registry";
import { PREFS_KEY, parseTheme, systemTheme, type OsTheme } from "./theme";

/**
 * WindowManager do MilWeb OS — estado das janelas, fora do React.
 *
 * Regras (ver docs/milweb-os-references.md):
 *  - Cada janela: `open` (está na área de trabalho), `min` (minimizada),
 *    `max` (maximizada), `rect` (posição + tamanho) e a posição em `order`
 *    (z-index). z-order é a posição na pilha `order` (fundo → topo); nenhum
 *    contador que cresce sem teto. Foco = mover para o fim da pilha.
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
 *
 * Tema (uma fonte só): `prefs.theme` é o tema EM VIGOR (o <html> espelha);
 * `prefs.themeAuto` diz se ele veio do sistema (nada salvo) ou de uma escolha
 * do visitante (salva). A troca passa por `requestTheme`: se o olho estiver
 * vivo ele registra um driver, fecha a pálpebra e só então chama
 * `commitTheme` — a interface muda de tema no escuro e o olho reabre com a
 * identidade nova. Sem olho vivo (imagem, movimento reduzido, janela
 * maximizada), a troca é imediata; e um temporizador de segurança garante o
 * commit mesmo se o driver não responder.
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

export type OsPrefs = { theme: OsTheme; themeAuto: boolean; motion: "system" | "reduce"; simple: boolean };

/**
 * Quem conduz a troca de tema (o olho vivo). Recebe o destino; devolve true
 * se vai fechar a pálpebra e chamar `commitTheme` no momento certo. false =
 * não pode agora (o store aplica na hora).
 */
export type ThemeDriver = (to: OsTheme) => boolean;

export type OsState = {
  wins: Record<AppId, Win>;
  order: AppId[];
  focused: AppId | null;
  area: { w: number; h: number };
  shell: Shell;
  prefs: OsPrefs;
  /** Tema pedido e ainda não aplicado (a pálpebra está fechando). null = nada em voo. */
  themePending: OsTheme | null;
  /** Janela que deve receber foco de teclado no próximo commit (abertura pelo usuário). */
  pendingFocus: AppId | null;
  /** Última ação relevante para a URL. O shell lê e navega se for do usuário. */
  last: { source: Source; mode: NavMode; seq: number };
  hydrated: boolean;

  open: (id: AppId, opts?: { route?: string | null; origin?: Rect | null; openedBy?: string | null; source?: Source; mode?: NavMode; focus?: boolean }) => void;
  /** `source: "route"` fecha sem pedir navegação (o telefone já moveu o histórico por conta própria). */
  close: (id: AppId, opts?: { source?: Source }) => void;
  focus: (id: AppId, opts?: { source?: Source; mode?: NavMode }) => void;
  /** Nenhum app em primeiro plano (a URL é a raiz): as janelas ficam onde estão, nenhuma em foco. */
  blur: (opts?: { source?: Source; mode?: NavMode }) => void;
  minimize: (id: AppId) => void;
  restore: (id: AppId, opts?: { mode?: NavMode }) => void;
  toggleMax: (id: AppId) => void;
  move: (id: AppId, x: number, y: number) => void;
  resize: (id: AppId, w: number, h: number) => void;
  setScroll: (id: AppId, y: number) => void;
  setArea: (w: number, h: number) => void;
  setShell: (shell: Shell) => void;
  /** Movimento e modo (o tema tem caminho próprio: requestTheme). */
  setPrefs: (p: Partial<Pick<OsPrefs, "motion" | "simple">>) => void;
  /**
   * Pede um tema. `auto: true` = veio do sistema (não vira escolha salva).
   * Pedidos repetidos antes do commit só trocam o destino — nunca empilham animações.
   */
  requestTheme: (to: OsTheme, opts?: { auto?: boolean }) => void;
  /** Aplica o tema pendente (chamado pelo driver com a pálpebra fechada, ou pelo próprio store). */
  commitTheme: () => void;
  setThemeDriver: (driver: ThemeDriver | null) => void;
  resetLayout: () => void;
  clearPendingFocus: () => void;
  hydrate: () => void;
};

const RECTS_KEY = "milweb-os:windows";
/** Área nominal antes de medir (SSR). O CSS clampa por conta própria até lá. */
const NOMINAL = { w: 1440, h: 820 };
const CASCADE = 28;
/** Se o driver do olho não confirmar a troca neste prazo, o tema é aplicado assim mesmo. */
const THEME_FALLBACK_MS = 900;

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
  // Só a rota de um app abre janela. Na raiz (`kind: "desktop"`) a área de trabalho nasce vazia.
  if (info.app) {
    wins[info.app] = { ...wins[info.app], open: true, route: initialInternal, placed: "auto" };
    order.push(info.app);
  }
  let themeDriver: ThemeDriver | null = null;
  let themeFallback = 0;

  return createStore<OsState>()((set, get) => {
    const bump = (source: Source, mode: NavMode) => ({ last: { source, mode, seq: get().last.seq + 1 } });
    /** Só geometria escolhida pelo visitante é lembrada; a automática nasce de novo a cada visita. */
    const persistRects = () => {
      const s = get();
      const rects = Object.fromEntries(APP_IDS.filter((id) => s.wins[id].placed === "user").map((id) => [id, s.wins[id].rect]));
      writeJson(RECTS_KEY, rects);
    };
    /** O tema só é gravado quando foi escolhido; vindo do sistema, a chave fica de fora (e o sistema continua mandando). */
    const persistPrefs = () => {
      const p = get().prefs;
      writeJson(PREFS_KEY, { ...(p.themeAuto ? {} : { theme: p.theme }), motion: p.motion, simple: p.simple });
    };

    return {
      wins,
      order,
      focused: info.app,
      area: NOMINAL,
      shell: "auto",
      prefs: { theme: "obito", themeAuto: true, motion: "system", simple: false },
      themePending: null,
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

      close: (id, opts = {}) => {
        const { source = "user" } = opts;
        set((s) => {
          const order = s.order.filter((x) => x !== id);
          // Desktop: a próxima janela visível da pilha assume o foco (e a URL). Celular: fechar
          // um app volta à tela inicial, como no telefone — nunca cai dentro de outro app.
          const focused = s.focused === id ? (s.shell === "mobile" ? null : (order.filter((x) => !s.wins[x].min).at(-1) ?? null)) : s.focused;
          // Fechar encerra o conteúdo: a próxima abertura mostra a raiz do app (a pasta, não o último case).
          return { wins: { ...s.wins, [id]: { ...s.wins[id], open: false, min: false, max: false, origin: null, route: APPS[id].route, scroll: 0 } }, order, focused, ...bump(source, "replace") };
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

      blur: (opts = {}) => {
        const { source = "route", mode = "replace" } = opts;
        set((s) => (s.focused === null ? {} : { focused: null, ...bump(source, mode) }));
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
        persistPrefs();
      },

      requestTheme: (to, opts = {}) => {
        const auto = opts.auto === true;
        const s = get();
        // Já está nesse tema e nada em voo: só registra de quem foi a escolha.
        if (s.themePending === null && s.prefs.theme === to) {
          if (s.prefs.themeAuto !== auto) {
            set({ prefs: { ...s.prefs, themeAuto: auto } });
            persistPrefs();
          }
          return;
        }
        set({ themePending: to, prefs: { ...s.prefs, themeAuto: auto } });
        if (themeDriver && themeDriver(to)) {
          window.clearTimeout(themeFallback);
          themeFallback = window.setTimeout(() => get().commitTheme(), THEME_FALLBACK_MS);
          return;
        }
        get().commitTheme();
      },

      commitTheme: () => {
        window.clearTimeout(themeFallback);
        themeFallback = 0;
        const s = get();
        if (s.themePending === null) return;
        set({ prefs: { ...s.prefs, theme: s.themePending }, themePending: null });
        persistPrefs();
      },

      setThemeDriver: (driver) => {
        themeDriver = driver;
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
        const prefs = readJson<{ theme?: unknown; motion?: unknown; simple?: unknown }>(PREFS_KEY);
        const rects = readJson<Record<string, unknown>>(RECTS_KEY);
        set((s) => {
          const wins = { ...s.wins };
          if (rects) {
            for (const id of APP_IDS) {
              const r = rects[id];
              if (isRect(r)) wins[id] = { ...wins[id], placed: "user", rect: clampRect(r, s.area, id) };
            }
          }
          // Preferência salva manda (aceita os nomes antigos); sem nada salvo, o tema do sistema — a mesma regra do script inline.
          const saved = parseTheme(prefs?.theme);
          const theme = saved ?? systemTheme();
          const motion = prefs?.motion === "reduce" ? "reduce" : "system";
          const simple = prefs?.simple === true;
          return { wins, prefs: { theme, themeAuto: saved === null, motion, simple }, hydrated: true };
        });
      },
    };
  });
}

export type OsStore = ReturnType<typeof createOsStore>;
