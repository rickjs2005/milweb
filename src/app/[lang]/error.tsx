"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, RotateCcw } from "lucide-react";
import { PROFILE, QUOTE, UI, type Locale } from "@/lib/content";
import { makeT, withLocale } from "@/lib/i18n";
import { Logo } from "@/components/logo";
import { MiloLive } from "@/components/milo-live";
import { ScrambleText } from "@/components/scramble-text";

const waHref = (text: string) =>
  `https://wa.me/${PROFILE.whatsapp}?text=${encodeURIComponent(text)}`;

/**
 * error.tsx é sempre Client Component (contrato do Next) e também não recebe
 * params de rota — mesmo truque de locale-por-pathname do not-found.tsx.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname() ?? "/";
  const locale: Locale = pathname.startsWith("/en") ? "en" : "pt";
  const t = makeT(locale);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col">
      <header className="container-page flex h-16 items-center">
        <Link href={withLocale(locale, "/")} aria-label={t(UI.labels.home)}>
          <Logo />
        </Link>
      </header>

      <div className="container-page flex flex-1 flex-col items-center justify-center py-16 text-center">
        <MiloLive pose="think" className="w-28 drop-shadow-[0_10px_26px_rgb(var(--accent)/0.4)]" />

        <ScrambleText
          text="500"
          as="p"
          className="mt-8 font-display text-7xl font-bold tracking-tight text-fg sm:text-8xl"
        />

        <h1 className="mt-4 text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {t(UI.labels.errorTitle)}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-fg-muted">
          {t(UI.labels.errorBody)}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-soft"
          >
            <RotateCcw className="h-4 w-4" />
            {t(UI.labels.errorRetry)}
          </button>
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
