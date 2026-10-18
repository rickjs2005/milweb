"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "zustand";
import { internalizePath, localizePath } from "@/i18n/routing";
import type { Locale } from "@/i18n/config";
import { Nav } from "@/components/nav/nav";
import { ViewTransitions } from "@/components/view-transitions";
import { createOsStore, type OsState, type OsStore } from "./store";
import { MOBILE_SHELL_MQ, parseRoute, type RouteInfo } from "./registry";
import type { OsPayload } from "./types";
import { Dock, Desktop, TopBar } from "./desktop";
import { WindowsLayer } from "./window";
import { SearchDialog } from "./apps/search";
import { SimpleShell } from "./simple-shell";

/**
 * MilWeb OS — a casca. Decide o modo (área de trabalho, telefone, simples),
 * amarra a URL ao app em foco e distribui o conteúdo da rota para a janela
 * dona dela.
 *
 * Um DOM só, dois layouts: o CSS (styles/os.css) desenha janelas flutuantes
 * no desktop e telas inteiras no celular com a MESMA regra de media query do
 * registro; o JS só liga comportamentos (arraste, pilha, transição do
 * ícone). Assim o HTML do servidor já nasce certo em qualquer tamanho e a
 * hidratação não troca de árvore.
 *
 * Rota → janela: o app dono da rota abre/foca quando o caminho muda por
 * fora (Voltar, link direto, Link interno); a raiz tira o foco de todas
 * (área de trabalho vazia — nada abre sozinho). Janela → rota: ações do
 * visitante (ícone, dock, foco, fechar) navegam para a rota da janela em
 * foco. `ownNav` evita o eco entre as duas direções.
 *
 * O conteúdo da rota (`children`: o case, uma página de serviço) vai para a
 * janela dona dela. `children` é um slot do roteador, não um elemento
 * estático — por isso a janela de Projetos sem foco desenha o case a partir
 * do JSON estático (apps/project-remote.tsx), nunca de um `children` antigo.
 */

type Ctx = {
  store: OsStore;
  payload: OsPayload;
  locale: Locale;
  internal: string;
  route: RouteInfo;
  /**
   * `sync: false` (padrão) espelha na URL um estado que o store JÁ tem — o
   * efeito de rota não deve reagir. `sync: true` é a interface pedindo uma
   * navegação (Voltar, Início, marca): o efeito de rota aplica o destino ao
   * store como faria com um link.
   */
  navigate: (internal: string, mode?: "push" | "replace", sync?: boolean) => void;
  openSearch: () => void;
};

const OsCtx = createContext<Ctx | null>(null);

export function useOs(): Ctx {
  const c = useContext(OsCtx);
  if (!c) throw new Error("useOs: fora do OsShell");
  return c;
}

export function useOsStore<T>(selector: (s: OsState) => T): T {
  return useStore(useOs().store, selector);
}

/** `usePathname` devolve o caminho INTERNO reescrito pelo middleware (/pt/work/x, /en/work/x). */
export function toInternal(raw: string): string {
  return internalizePath(raw.replace(/^\/pt(?=\/|$)/, "") || "/").internal;
}

export function OsShell({ locale, payload, footer, children }: { locale: Locale; payload: OsPayload; footer: ReactNode; children: ReactNode }) {
  const raw = usePathname() ?? "/";
  const internal = toInternal(raw);
  const route = parseRoute(internal);
  const router = useRouter();
  const [store] = useState(() => createOsStore(internal));
  const ownNav = useRef<string | null>(null);
  const internalRef = useRef(internal);
  internalRef.current = internal;
  const [searchOpen, setSearchOpen] = useState(false);

  const shell = useStore(store, (s) => s.shell);
  const theme = useStore(store, (s) => s.prefs.theme);
  const motion = useStore(store, (s) => s.prefs.motion);

  const navigate = useCallback(
    (target: string, mode: "push" | "replace" = "push", sync = false) => {
      if (target === internalRef.current) return;
      ownNav.current = sync ? null : target;
      const href = localizePath(locale, target);
      if (mode === "push") router.push(href, { scroll: false });
      else router.replace(href, { scroll: false });
    },
    [locale, router],
  );

  // 1) URL → janelas (Voltar/Avançar, link direto, Links internos).
  useLayoutEffect(() => {
    if (ownNav.current === internal) {
      ownNav.current = null;
      return;
    }
    ownNav.current = null;
    if (route.app) store.getState().open(route.app, { route: internal, source: "route", mode: "replace" });
    // A raiz é a área de trabalho: nenhum app em primeiro plano (Voltar, Início, marca, link direto).
    else if (route.kind === "desktop") store.getState().blur({ source: "route" });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `route` deriva de `internal`
  }, [internal, store]);

  // 2) janelas → URL (só ações do visitante).
  useEffect(
    () =>
      store.subscribe((s, prev) => {
        if (s.last.seq === prev.last.seq || s.last.source !== "user") return;
        const target = s.focused ? s.wins[s.focused].route : "/";
        if (target == null) return; // app sem URL própria (Ajustes): a URL fica como está
        navigate(target, s.last.mode);
      }),
    [store, navigate],
  );

  // 3) modo pela mídia + preferências salvas (depois da hidratação, nunca no primeiro render).
  useLayoutEffect(() => {
    const mq = window.matchMedia(MOBILE_SHELL_MQ);
    const apply = () => {
      const st = store.getState();
      st.setShell(st.prefs.simple ? "simple" : mq.matches ? "mobile" : "desktop");
    };
    store.getState().hydrate();
    apply();
    mq.addEventListener("change", apply);
    const unsub = store.subscribe((s, p) => {
      if (s.prefs.simple !== p.prefs.simple) apply();
    });
    return () => {
      mq.removeEventListener("change", apply);
      unsub();
    };
  }, [store]);

  // 4) espelho no <html> para o CSS (tema, movimento, modo) e para o ScrollProvider (sem Lenis no OS).
  const isOs = route.kind !== "fullpage" && shell !== "simple";
  useLayoutEffect(() => {
    const h = document.documentElement;
    if (isOs) h.dataset.os = "1";
    else delete h.dataset.os;
    h.dataset.shell = shell;
    h.dataset.osTheme = theme;
    if (motion === "reduce") h.dataset.osMotion = "reduce";
    else delete h.dataset.osMotion;
    return () => {
      delete h.dataset.os;
    };
  }, [isOs, shell, theme, motion]);

  // Só em desenvolvimento: o store fica inspecionável no console e nos testes (scripts/os-check.mjs).
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    (window as unknown as { __milwebOs?: OsStore }).__milwebOs = store;
  }, [store]);

  // 5) tecla "/" abre a busca (fora de campos de texto; Ctrl/Cmd+K fica com o navegador).
  useEffect(() => {
    if (!isOs) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [contenteditable=true], dialog[open]")) return;
      e.preventDefault();
      setSearchOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOs]);

  const ctx = useMemo<Ctx>(() => ({ store, payload, locale, internal, route, navigate, openSearch: () => setSearchOpen(true) }), [store, payload, locale, internal, route, navigate]);

  // Rotas fora do OS (protótipos do Lab, erros): a página clássica, com a navegação de sempre.
  if (route.kind === "fullpage") {
    return (
      <>
        <ViewTransitions />
        <Nav locale={locale} strings={payload.nav} />
        {children}
      </>
    );
  }

  const routeContent = route.kind === "project" || route.kind === "page" ? children : null;

  if (shell === "simple") {
    return (
      <OsCtx.Provider value={ctx}>
        <ViewTransitions />
        <SimpleShell footer={footer} content={routeContent} />
      </OsCtx.Provider>
    );
  }

  return (
    <OsCtx.Provider value={ctx}>
      <div className="os" data-os-root data-shell={shell}>
        <button type="button" className="os-skip" onClick={() => store.getState().setPrefs({ simple: true })}>
          {payload.s.simple.skip}
        </button>
        <TopBar />
        <Desktop />
        <WindowsLayer>{routeContent}</WindowsLayer>
        <Dock />
        <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
      </div>
    </OsCtx.Provider>
  );
}
