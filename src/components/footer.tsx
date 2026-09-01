import Link from "next/link";
import { BRAND } from "@/data/brand";
import { getDict } from "@/i18n";
import { PROFILE } from "@/lib/content";
import { makeT, withLocale, type Locale } from "@/lib/i18n";
import { GooglePreferredSource } from "@/components/google-preferred-source";

/** Rodapé editorial: o convite às fontes preferidas do Google, uma régua, quatro colunas, nada de ícone. */
export function Footer({ locale }: { locale: Locale }) {
  const t = makeT(locale);
  const d = getDict(locale);
  const year = new Date().getFullYear();
  return (
    <footer className="container-page rule mt-24 pb-10 pt-8 t-mono text-ink-3" data-inspect="FOOTER">
      {/* GOOGLE / FONTES PREFERIDAS — MilWeb primeiro, Google como função. O botão é
          o nosso (act-cta); o fluxo e a confirmação são do Google. Elegibilidade real:
          conferir se milweb.com.br aparece em google.com/preferences/source. */}
      <div className="grid-12 mb-8 gap-y-6 border-b border-neutral pb-8" data-inspect="PREFERRED SOURCES">
        <div className="col-span-4 md:col-span-7">
          <p>{d.preferred.eyebrow}</p>
          <p className="t-display t-display-sm mt-3 text-ink">
            <span className="block">{d.preferred.title[0]}</span>
            <span className="block">{d.preferred.title[1]}</span>
          </p>
        </div>
        <div className="col-span-4 flex items-end md:col-span-5 md:justify-end">
          <GooglePreferredSource locale={locale} placement="footer" theme="light" s={{ cta: d.preferred.cta, loading: d.preferred.loading, retry: d.preferred.retry, aria: d.preferred.aria }} />
        </div>
      </div>
      <div className="grid-12 gap-y-8">
        <div className="col-span-4 md:col-span-3">
          <p className="text-ink">{BRAND.mark}</p>
          <p className="mt-1">{t(BRAND.tagline)}</p>
        </div>
        <ul className="col-span-2 md:col-span-3">
          <li><Link className="link-rule inline-block py-1 text-ink" href={withLocale(locale, "/work")}>{d.nav.work}</Link></li>
          <li><Link className="link-rule inline-block py-1 text-ink" href={withLocale(locale, "/lab")}>{d.nav.lab}</Link></li>
          <li><Link className="link-rule inline-block py-1 text-ink" href={withLocale(locale, "/studio")}>{d.nav.studio}</Link></li>
          <li><Link className="link-rule inline-block py-1 text-ink" href={withLocale(locale, "/services")}>{d.nav.services}</Link></li>
        </ul>
        <ul className="col-span-2 md:col-span-3">
          <li><a className="link-rule inline-block py-1 text-ink" href={`mailto:${PROFILE.email}`}>{d.footer.email}</a></li>
          <li><a className="link-rule inline-block py-1 text-ink" href={`https://wa.me/${PROFILE.whatsapp}`} target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
          <li><a className="link-rule inline-block py-1 text-ink" href={PROFILE.github} target="_blank" rel="noopener noreferrer">GitHub</a></li>
          <li><a className="link-rule inline-block py-1 text-ink" href={PROFILE.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
        </ul>
        <div className="col-span-4 flex flex-col justify-between md:col-span-3 md:text-right">
          <p>{BRAND.index}</p>
          <p className="mt-4 tnum">© {year} MilWeb — {d.footer.year}</p>
        </div>
      </div>
    </footer>
  );
}
