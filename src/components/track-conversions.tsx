"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@vercel/analytics";

/**
 * Rastreio de conversão: UM listener delegado no documento captura todo
 * clique em link de WhatsApp (wa.me) e registra no Vercel Analytics de
 * onde ele veio — a seção mais próxima com id (hero, raio-x, projects,
 * lab, contact...) e a rota. Responde a pergunta "qual parte do site
 * está vendendo?". Zero mudança nos componentes; zero re-render.
 */
export function TrackConversions() {
  const pathname = usePathname();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href*="wa.me"]');
      if (!link) return;
      const source =
        link.closest("[id]")?.id ||
        (link.closest("header") ? "nav" : link.closest("footer") ? "footer" : "page");
      track("whatsapp_click", { source, path: pathname ?? "/" });
    };
    document.addEventListener("click", onClick, { capture: true, passive: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [pathname]);

  return null;
}
