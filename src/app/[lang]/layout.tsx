import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ScrollProvider } from "@/components/scroll-provider";
import { TrackConversions } from "@/components/track-conversions";
import { ViewTransitions } from "@/components/view-transitions";
import { Nav } from "@/components/nav/nav";
import { InspectProvider } from "@/features/inspect/inspect-provider";
import { getDict, HTML_LANG, LOCALES } from "@/i18n";
import { PROFILE, SITE_URL } from "@/lib/content";
import { localeFrom, type LangParams } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { SITE_COPY, siteJsonLd } from "@/lib/inline-scripts";
import { QUALITY_SCRIPT } from "@/lib/quality";
import { FONT_CLASS } from "@/lib/fonts";


/** As três versões saem prontas do build; o segmento mais externo enumera os idiomas. */
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

/**
 * dynamicParams fica no padrão (true) para caminhos desconhecidos chegarem ao
 * catch-all e ao not-found deste idioma; locale inválido é 404 em localeFrom.
 */

export async function generateMetadata({ params }: { params: Promise<LangParams> }): Promise<Metadata> {
  const locale = await localeFrom(params);
  const { title, description } = SITE_COPY[locale];
  const base = pageMetadata({ locale, internalPath: "/", title, description });
  return {
    ...base,
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s | MilWeb` },
    applicationName: "MilWeb",
    authors: [{ name: "Rick Januario", url: PROFILE.github }],
    creator: "MilWeb",
    keywords: ["creative development studio", "creative developer", "WebGL", "Next.js", "GSAP", "digital experiences", "criação de sites", "desenvolvimento web", "desarrollo web", "MilWeb"],
    verification: { google: "2CbbaRNR_vN6f0XIjYuMmTu9UpHcKuleYfJtOjWyNmE" },
    // Sem index/follow explícitos: o padrão já é indexável e assim o 404 (status
    // vindo do middleware) fica só com o noindex que o Next injeta.
    robots: { googleBot: { "max-image-preview": "large", "max-snippet": -1 } },
  };
}

export const viewport: Viewport = { themeColor: "#F2F0EA", colorScheme: "light" };

export default async function LangLayout({ children, params }: { children: React.ReactNode; params: Promise<LangParams> }) {
  const locale = await localeFrom(params);
  const d = getDict(locale);
  return (
    <html lang={HTML_LANG[locale]} className={FONT_CLASS} suppressHydrationWarning>
      <body>
    <ScrollProvider>
      <InspectProvider strings={{ title: d.inspect.title, dev: d.inspect.dev }}>
        <script dangerouslySetInnerHTML={{ __html: QUALITY_SCRIPT }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: siteJsonLd(locale) }} />
        <TrackConversions />
        <ViewTransitions />
        <Nav
          locale={locale}
          strings={{
            work: d.nav.work,
            lab: d.nav.lab,
            studio: d.nav.studio,
            contact: d.nav.contact,
            menu: d.nav.menu,
            close: d.nav.close,
            primary: d.nav.primary,
            selectLanguage: d.meta.selectLanguage,
            langNames: { pt: getDict("pt").meta.langName, en: getDict("en").meta.langName, es: getDict("es").meta.langName },
            sound: d.sound,
          }}
        />
        {children}
        <Analytics />
        <SpeedInsights />
      </InspectProvider>
    </ScrollProvider>
      </body>
    </html>
  );
}
