import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Bricolage_Grotesque } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SmoothScroll } from "@/components/smooth-scroll";
import { TrackConversions } from "@/components/track-conversions";
import { WhatsappFab } from "@/components/whatsapp-fab";
import { Konami } from "@/components/konami";
import { CursorGlow } from "@/components/cursor-glow";
import { ViewTransitions } from "@/components/view-transitions";
import { PROFILE, SITE_URL } from "@/lib/content";
import { getLocale, htmlLang } from "@/lib/i18n";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
});

const COPY = {
  pt: {
    title: "MilWeb — Sites e sistemas que dão resultado",
    description:
      "Desenvolvedor Full Stack freelancer (Next.js, React, TypeScript, Node.js, Supabase). Crio sites, landing pages, sistemas web, catálogos para WhatsApp, dashboards e automações. Orçamento gratuito.",
  },
  en: {
    title: "MilWeb — Websites and systems that deliver results",
    description:
      "Freelance Full Stack developer (Next.js, React, TypeScript, Node.js, Supabase). I build websites, landing pages, web systems, WhatsApp catalogs, dashboards and automations. Free quote.",
  },
} as const;

/** hreflang do site inteiro: PT na raiz, EN em /en (x-default = PT). */
export const LANGUAGE_ALTERNATES = {
  "pt-BR": "/",
  en: "/en",
  "x-default": "/",
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const { title, description } = COPY[locale];
  const canonical = locale === "en" ? "/en" : "/";
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s — MilWeb` },
    description,
    applicationName: "MilWeb",
    authors: [{ name: "Rick", url: PROFILE.github }],
    creator: "Rick (MilWeb)",
    keywords: [
      "desenvolvedor freelancer",
      "criação de sites",
      "desenvolvimento web",
      "landing page",
      "sistema web",
      "catálogo WhatsApp",
      "loja virtual",
      "dashboard",
      "automação",
      "Next.js",
      "React",
      "MilWeb",
      "Rick",
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
  themeColor: "#080a10",
  colorScheme: "dark",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "MilWeb",
  url: SITE_URL,
  email: `mailto:${PROFILE.email}`,
  image: `${SITE_URL}/opengraph-image`,
  description: COPY.pt.description,
  areaServed: "BR",
  founder: { "@type": "Person", name: "Rick", sameAs: [PROFILE.github, PROFILE.linkedin].filter(Boolean) },
  knowsAbout: ["Next.js", "React", "TypeScript", "Node.js", "Supabase", "PostgreSQL", "SEO"],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={htmlLang(locale)} className={`${sans.variable} ${mono.variable} ${display.variable}`} suppressHydrationWarning>
      <head>
        {/* Anti-flash: aplica o tema salvo antes do paint (default = dark). */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{if(localStorage.getItem('theme')==='light')document.documentElement.classList.add('light');}catch(e){}})();",
          }}
        />
      </head>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <SmoothScroll />
        <TrackConversions />
        <CursorGlow />
        <ViewTransitions />
        {children}
        <WhatsappFab locale={locale} />
        <Konami />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
