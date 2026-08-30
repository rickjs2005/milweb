"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * View Transitions nas navegações internas: intercepta cliques em links de
 * rota (não âncoras #, não externos) e envolve o router.push num
 * document.startViewTransition — o navegador faz o cross-fade e morfa os
 * elementos com view-transition-name igual entre as páginas (ex.: o preview
 * do card de projeto "expande" para o hero do case).
 *
 * A coreografia é ESCOLHIDA PELO DESTINO: o link carrega `data-vt`
 * (scan/fold/grid/time/horizon) e nós o publicamos em `<html data-vt>`
 * antes de iniciar — o CSS em globals.css tem uma animação por tipo. O
 * atributo sai quando a transição termina (ou no timeout), então nunca
 * sobra estado.
 *
 * O truque React: startViewTransition precisa de uma promise que resolve
 * quando o novo DOM commitou — resolvemos no effect de pathname. Race com
 * timeout para nunca prender a UI se a rota não mudar. Browsers sem a API
 * (Firefox) e prefers-reduced-motion seguem com navegação normal.
 */
type ViewTransition = { finished: Promise<void> };

export function ViewTransitions() {
  const router = useRouter();
  const pathname = usePathname();
  const resolveRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    resolveRef.current?.();
    resolveRef.current = null;
    // O tipo da transição descreve só a transição em curso: sai pouco depois
    // de o novo DOM commitar (as animações duram no máximo ~0,9 s).
    const t = setTimeout(() => delete document.documentElement.dataset.vt, 1000);
    return () => clearTimeout(t);
  }, [pathname]);

  useEffect(() => {
    if (!("startViewTransition" in document)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      const url = new URL(href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname) return; // âncora/mesma rota: deixa pro Lenis

      // Só preventDefault, sem stopPropagation: o <Link> do Next chama o onClick
      // do consumidor (ex.: o seletor de idioma grava o cookie) e em seguida
      // desiste do push próprio quando vê e.defaultPrevented — a navegação
      // fica conosco sem sequestrar o resto da cadeia de handlers.
      e.preventDefault();
      const root = document.documentElement;
      const kind = link.dataset.vt;
      if (kind) root.dataset.vt = kind;
      const done = new Promise<void>((resolve) => {
        resolveRef.current = resolve;
      });
      const timeout = new Promise<void>((resolve) => setTimeout(resolve, 900));
      const vt = (document as Document & { startViewTransition: (cb: () => Promise<void>) => ViewTransition }).startViewTransition(() => {
        router.push(url.pathname + url.search + url.hash);
        return Promise.race([done, timeout]);
      });
      // O atributo descreve só a transição em curso: sai quando ela termina e,
      // de qualquer forma, depois do teto de duração das animações (0,9 s).
      const clear = () => delete root.dataset.vt;
      vt.finished.then(clear, clear);
      setTimeout(clear, 1100);
    };

    // Captura: precisa rodar ANTES do handler React do next/link.
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [router]);

  return null;
}
