"use client";

import { usePathname } from "next/navigation";
import { NotFoundView } from "@/components/not-found-view";
import type { Locale } from "@/lib/content";

/**
 * Fallback para notFound() disparado dentro de [lang] (caso raro — o
 * middleware já manda rota desconhecida para o catch-all com status 404).
 * not-found.tsx não recebe params: locale sai do pathname.
 */
export default function NotFound() {
  const pathname = usePathname() ?? "/";
  const locale: Locale = pathname.startsWith("/en") ? "en" : pathname.startsWith("/es") ? "es" : "pt";
  return <NotFoundView locale={locale} />;
}
