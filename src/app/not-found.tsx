"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { PROFILE, QUOTE, UI, type Locale } from "@/lib/content";
import { makeT, withLocale } from "@/lib/i18n";
import { Logo } from "@/components/logo";
import { MiloLive } from "@/components/milo-live";
import { ScrambleText } from "@/components/scramble-text";

const waHref = (text: string) =>
  `https://wa.me/${PROFILE.whatsapp}?text=${encodeURIComponent(text)}`;

/**
 * not-found.tsx PRECISA morar aqui, em app/ (fora de [lang]).
 *
 * Testado e confirmado: pra URL que não bate com NENHUMA rota, ou pra
 * notFound() chamado de dentro de uma rota já resolvida (ex. slug de
 * projeto inexistente), o Next cai no /_not-found interno se o not-found.tsx
 * não estiver na raiz que tem app/layout.tsx — um not-found.tsx dentro de
 * [lang] é simplesmente inalcançável nesse desenho de rota. Locale sai do
 * pathname (não tem params aqui), mesmo truque do LangToggle em nav.tsx.
 */
export default function NotFound() {
  const pathname = usePathname() ?? "/";
  const locale: Locale = pathname.startsWith("/en") ? "en" : "pt";
  const t = makeT(locale);

  return (
    <main className="flex min-h-screen flex-col">
      <header className="container-page flex h-16 items-center">
        <Link href={withLocale(locale, "/")} aria-label={t(UI.labels.home)}>
          <Logo />
        </Link>
      </header>

      <div className="container-page flex flex-1 flex-col items-center justify-center py-16 text-center">
        <MiloLive pose="shocked" className="w-28 drop-shadow-[0_10px_26px_rgb(var(--accent)/0.4)]" />

        <ScrambleText
          text="404"
          as="p"
          className="mt-8 font-display text-7xl font-bold tracking-tight text-fg sm:text-8xl"
        />

        <h1 className="mt-4 text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {t(UI.labels.notFoundTitle)}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-fg-muted">
          {t(UI.labels.notFoundBody)}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={withLocale(locale, "/")}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-soft"
          >
            <ArrowLeft className="h-4 w-4" />
            {t(UI.labels.notFoundBackHome)}
          </Link>
          <Link
            href={withLocale(locale, "/projetos")}
            className="inline-flex items-center gap-2 rounded-lg border border-line/15 px-5 py-3 text-sm font-medium text-fg-muted transition-colors hover:border-accent/40 hover:text-fg"
          >
            {t(UI.labels.notFoundSeeProjects)}
          </Link>
          <a
            href={waHref(t(QUOTE.fallback))}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-line/15 px-5 py-3 text-sm font-medium text-fg-muted transition-colors hover:border-accent/40 hover:text-fg"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        </div>
      </div>
    </main>
  );
}
