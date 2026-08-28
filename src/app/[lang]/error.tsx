"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND } from "@/data/brand";
import { UI, type Locale } from "@/lib/content";
import { makeT, withLocale } from "@/lib/i18n";

/** error.tsx é sempre Client Component e não recebe params — locale pelo pathname. */
export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const pathname = usePathname() ?? "/";
  const locale: Locale = pathname.startsWith("/en") ? "en" : "pt";
  const t = makeT(locale);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="container-page flex min-h-[100svh] flex-col justify-between pb-8 pt-6">
      <div className="rule flex items-center justify-between pt-3 t-mono">
        <Link href={withLocale(locale, "/")}>{BRAND.mark}</Link>
        <span className="tnum">ERR / 500{error.digest ? ` / ${error.digest.slice(0, 6)}` : ""}</span>
      </div>

      <div>
        <p className="t-mono text-ink-3">{t(UI.labels.errorTitle)}</p>
        <h1 className="t-display t-display-xl mt-4 text-ink">
          <span className="block">SOMETHING</span>
          <span className="block">BROKE.</span>
        </h1>
      </div>

      <div className="grid-12 items-end t-mono">
        <p className="col-span-4 max-w-sm text-ink-2 md:col-span-6">{t(UI.labels.errorBody)}</p>
        <ul className="col-span-4 flex gap-6 md:col-span-6 md:justify-end">
          <li>
            <button type="button" onClick={reset} className="link-rule text-ink">
              {t(UI.labels.errorRetry)} →
            </button>
          </li>
          <li>
            <Link href={withLocale(locale, "/")} className="link-rule text-ink">
              {t(UI.labels.notFoundBackHome)} →
            </Link>
          </li>
        </ul>
      </div>
    </main>
  );
}
