"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND } from "@/data/brand";
import { UI, type Locale } from "@/lib/content";
import { makeT, withLocale } from "@/lib/i18n";

/**
 * 404 na raiz de app/ (fora de [lang]) — único lugar em que o Next a
 * alcança. Locale sai do pathname. Mesma tipografia, mesma régua, mesmo
 * papel: a página de erro é reconhecível como MilWeb sem logo.
 */
export default function NotFound() {
  const pathname = usePathname() ?? "/";
  const locale: Locale = pathname.startsWith("/en") ? "en" : "pt";
  const t = makeT(locale);

  return (
    <main className="container-page flex min-h-[100svh] flex-col justify-between pb-8 pt-6">
      <div className="rule flex items-center justify-between pt-3 t-mono">
        <Link href={withLocale(locale, "/")}>{BRAND.mark}</Link>
        <span className="tnum">ERR / 404</span>
      </div>

      <div>
        <p className="t-mono text-ink-3">{t(UI.labels.notFoundTitle)}</p>
        <h1 className="t-display t-display-xl mt-4 text-ink">
          <span className="block">404</span>
          <span className="block">NOT FOUND.</span>
        </h1>
      </div>

      <div className="grid-12 items-end t-mono">
        <p className="col-span-4 max-w-sm text-ink-2 md:col-span-6">{t(UI.labels.notFoundBody)}</p>
        <ul className="col-span-4 flex gap-6 md:col-span-6 md:justify-end">
          <li>
            <Link href={withLocale(locale, "/")} className="link-rule text-ink">
              {t(UI.labels.notFoundBackHome)} →
            </Link>
          </li>
          <li>
            <Link href={withLocale(locale, "/work")} className="link-rule text-ink">
              {t(UI.labels.notFoundSeeProjects)} →
            </Link>
          </li>
        </ul>
      </div>
    </main>
  );
}
