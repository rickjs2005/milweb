"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Nav } from "@/components/nav/nav";
import { DOCK_ORDER, APPS } from "./registry";
import { useOs } from "./os-shell";
import { AppContent } from "./apps/app-content";

/**
 * Modo simples — os mesmos apps, cases e contatos como uma página comum:
 * navegação clássica, uma coluna, sem janelas nem arrasto. É o modo para
 * leitores de tela, teclado só, ou quem prefere uma lista.
 */
export function SimpleShell({ footer, content }: { footer: ReactNode; content: ReactNode | null }) {
  const { payload, route, store } = useOs();
  const s = payload.s;
  const app = route.app ?? "home";
  return (
    <>
      <Nav locale={payload.locale} strings={payload.nav} />
      <main id="os-simple" className="container-page pt-nav os-simple">
        <div className="rule flex items-center justify-between gap-4 pt-3 t-mono">
          <span>{s.simple.title.toUpperCase()}</span>
          <button type="button" className="link-rule" onClick={() => store.getState().setPrefs({ simple: false })}>
            {s.simple.toOs.toUpperCase()} →
          </button>
        </div>
        <nav className="os-simple__nav t-mono" aria-label={s.simple.nav}>
          {DOCK_ORDER.filter((id) => APPS[id].route).map((id) => (
            <Link key={id} href={payload.hrefs[id as keyof typeof payload.hrefs] ?? "#"} className="link-rule" aria-current={route.app === id ? "page" : undefined}>
              {s.apps[id]}
            </Link>
          ))}
        </nav>
        {/* Com um case/página na rota, o h1 é o do próprio conteúdo; aqui fica só o nome do app. */}
        {content ? <p className="t-mono mt-8 text-ink-3">{s.apps[app].toUpperCase()}</p> : <h1 className="t-display t-display-md mt-8 text-ink">{s.apps[app]}</h1>}
        <div className="os-simple__content">{content ?? <AppContent id={app} active />}</div>
      </main>
      {footer}
    </>
  );
}
