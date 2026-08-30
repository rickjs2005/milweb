"use client";

import Link from "next/link";
import { LOCALES, LOCALE_COOKIE, type Locale } from "@/i18n/config";

/**
 * Seletor textual PT · EN · ES (sem bandeiras: bandeira é país, não idioma).
 * Cada item é um link para a página EQUIVALENTE no outro idioma; ao clicar,
 * a preferência vai para o cookie `milweb_locale` (1 ano) — só a raiz "/"
 * a honra; links diretos sempre respeitam a URL. Funciona sem JS (são
 * links de verdade); o cookie é só o extra progressivo.
 */
export function LanguageSwitch({ current, hrefs, label, names, className = "", tabbable = true }: { current: Locale; hrefs: Record<Locale, string>; label: string; names: Record<Locale, string>; className?: string; tabbable?: boolean }) {
  const remember = (l: Locale) => {
    try {
      document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
    } catch {}
  };
  return (
    <nav aria-label={label} className={"flex items-center gap-1 t-mono " + className}>
      {LOCALES.map((l) => {
        const active = l === current;
        return (
          <Link
            key={l}
            href={hrefs[l]}
            // Sem prefetch: o middleware redireciona "/" pelo cookie e não
            // distingue request RSC de documento. Um prefetch de "/" feito
            // enquanto o cookie ainda era "en" guardava o payload de /en e o
            // clique em PT ficava preso no inglês. Sem prefetch, o fetch só
            // acontece no clique, depois de `remember(l)` gravar o cookie.
            prefetch={false}
            hrefLang={l === "pt" ? "pt-BR" : l}
            lang={l === "pt" ? "pt-BR" : l}
            aria-current={active ? "page" : undefined}
            aria-label={names[l]}
            tabIndex={tabbable ? 0 : -1}
            onClick={() => remember(l)}
            className={"link-rule inline-flex min-h-[44px] min-w-[36px] items-center justify-center px-1.5 uppercase transition-opacity duration-fast " + (active ? "signal-dot opacity-100" : "opacity-60 hover:opacity-100")}
          >
            {l}
          </Link>
        );
      })}
    </nav>
  );
}
