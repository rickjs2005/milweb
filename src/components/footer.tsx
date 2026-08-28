import Link from "next/link";
import { BRAND, NAV } from "@/data/brand";
import { PROFILE } from "@/lib/content";
import { makeT, withLocale, type Locale } from "@/lib/i18n";

/** Rodapé editorial: uma régua, quatro colunas, nada de ícone. */
export function Footer({ locale }: { locale: Locale }) {
  const t = makeT(locale);
  const year = new Date().getFullYear();
  return (
    <footer className="container-page rule mt-24 pb-10 pt-8 t-mono text-ink-3" data-inspect="FOOTER">
      <div className="grid-12 gap-y-8">
        <div className="col-span-4 md:col-span-3">
          <p className="text-ink">{BRAND.mark}</p>
          <p className="mt-1">{t(BRAND.tagline)}</p>
        </div>
        <ul className="col-span-2 space-y-1 md:col-span-3">
          <li><Link className="link-rule text-ink" href={withLocale(locale, "/work")}>{t(NAV.work)}</Link></li>
          <li><Link className="link-rule text-ink" href={withLocale(locale, "/lab")}>{t(NAV.lab)}</Link></li>
          <li><Link className="link-rule text-ink" href={withLocale(locale, "/studio")}>{t(NAV.studio)}</Link></li>
          <li><Link className="link-rule text-ink" href={withLocale(locale, "/services")}>{t(NAV.services)}</Link></li>
        </ul>
        <ul className="col-span-2 space-y-1 md:col-span-3">
          <li><a className="link-rule text-ink" href={`mailto:${PROFILE.email}`}>Email</a></li>
          <li><a className="link-rule text-ink" href={`https://wa.me/${PROFILE.whatsapp}`} target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
          <li><a className="link-rule text-ink" href={PROFILE.github} target="_blank" rel="noopener noreferrer">GitHub</a></li>
          <li><a className="link-rule text-ink" href={PROFILE.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
        </ul>
        <div className="col-span-4 flex flex-col justify-between md:col-span-3 md:text-right">
          <p>{BRAND.index}</p>
          <p className="mt-4 tnum">© {year} MilWeb — {t(BRAND.origin)}</p>
        </div>
      </div>
    </footer>
  );
}
