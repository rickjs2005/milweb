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
 * O truque React: startViewTransition precisa de uma promise que resolve
 * quando o novo DOM commitou — resolvemos no effect de pathname. Race com
 * timeout para nunca prender a UI se a rota não mudar. Browsers sem a API
 * (Firefox) e prefers-reduced-motion seguem com navegação normal.
 */
export function ViewTransitions() {
  const router = useRouter();
  const pathname = usePathname();
  const resolveRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    resolveRef.current?.();
    resolveRef.current = null;
  }, [pathname]);

  useEffect(() => {
    if (!("startViewTransition" in document)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;
      const link = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      const url = new URL(href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname) return; // âncora/mesma rota: deixa pro Lenis

      // stopPropagation: o onClick do <Link> do Next (bubble) faria o push
      // próprio antes de nós — assumimos a navegação aqui, na captura.
      e.preventDefault();
      e.stopPropagation();
      const done = new Promise<void>((resolve) => {
        resolveRef.current = resolve;
      });
      const timeout = new Promise<void>((resolve) => setTimeout(resolve, 1500));
      (
        document as Document & { startViewTransition: (cb: () => Promise<void>) => void }
      ).startViewTransition(() => {
        router.push(url.pathname + url.search + url.hash);
        return Promise.race([done, timeout]);
      });
    };

    // Captura: precisa rodar ANTES do handler React do next/link.
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [router]);

  return null;
}
