import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ScrollProvider } from "@/components/scroll-provider";
import { TrackConversions } from "@/components/track-conversions";
import { ViewTransitions } from "@/components/view-transitions";
import { Nav } from "@/components/nav/nav";
import { InspectProvider } from "@/features/inspect/inspect-provider";
import { NAV } from "@/data/brand";
import { PROFILE, SITE_URL } from "@/lib/content";
import { localeFrom, LOCALES, makeT, type LangParams } from "@/lib/i18n";
import { SITE_COPY, siteJsonLd } from "@/lib/inline-scripts";

const LANGUAGE_ALTERNATES = { "pt-BR": "/", en: "/en", "x-default": "/" };

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

/** Só `pt` e `en` são [lang] válidos; o resto é 404 (ver histórico: soft 404 de /llms.txt). */
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<LangParams> }): Promise<Metadata> {
  const locale = await localeFrom(params);
  const { title, description } = SITE_COPY[locale];
  const canonical = locale === "en" ? "/en" : "/";
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s | MilWeb` },
    description,
    applicationName: "MilWeb",
    authors: [{ name: "Rick Januario", url: PROFILE.github }],
    creator: "MilWeb",
    keywords: [
      "creative development studio",
      "creative developer",
      "WebGL",
      "Next.js",
      "GSAP",
      "digital experiences",
      "criação de sites",
      "desenvolvimento web",
      "MilWeb",
    ],
    alternates: { canonical, languages: LANGUAGE_ALTERNATES },
    verification: { google: "2CbbaRNR_vN6f0XIjYuMmTu9UpHcKuleYfJtOjWyNmE" },
    openGraph: {
      type: "website",
      locale: locale === "en" ? "en_US" : "pt_BR",
      url: `${SITE_URL}${canonical === "/" ? "" : canonical}`,
      siteName: "MilWeb",
      title,
      description,
    },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  };
}

export const viewport: Viewport = {
  themeColor: "#F2F0EA",
  colorScheme: "light",
};

export default async function LangLayout({ children, params }: { children: React.ReactNode; params: Promise<LangParams> }) {
  const locale = await localeFrom(params);
  const t = makeT(locale);
  return (
    <ScrollProvider>
      <InspectProvider>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: siteJsonLd(locale) }} />
      <TrackConversions />
      <ViewTransitions />
      <Nav
        locale={locale}
        strings={{
          work: t(NAV.work),
          lab: t(NAV.lab),
          studio: t(NAV.studio),
          contact: t(NAV.contact),
          menu: t(NAV.menu),
          close: t(NAV.close),
        }}
      />
      {children}
      <Analytics />
      <SpeedInsights />
      </InspectProvider>
    </ScrollProvider>
  );
}
