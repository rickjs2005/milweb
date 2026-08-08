import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Bricolage_Grotesque } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SmoothScroll } from "@/components/smooth-scroll";
import { TrackConversions } from "@/components/track-conversions";
import { WhatsappFab } from "@/components/whatsapp-fab";
import { Konami } from "@/components/konami";
import { CursorGlow } from "@/components/cursor-glow";
import { MouseParallax } from "@/components/mouse-parallax";
import { SquidFollower } from "@/components/SquidFollower";
import { MiloProtagonist } from "@/components/milo-protagonist";
import { ViewTransitions } from "@/components/view-transitions";
import { PROFILE, SITE_URL } from "@/lib/content";
import { htmlLang, localeFrom, LOCALES, type LangParams } from "@/lib/i18n";
import { SITE_COPY, siteJsonLd } from "@/lib/inline-scripts";
import { THEME_SCRIPT } from "@/lib/theme-script";
import "../globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
});

/** hreflang do site inteiro: PT na raiz, EN em /en (x-default = PT). */
const LANGUAGE_ALTERNATES = {
  "pt-BR": "/",
  en: "/en",
  "x-default": "/",
};

/**
 * As duas versões do site saem prontas do build. Como é o segmento mais
 * externo, este generateStaticParams vale para toda a árvore abaixo — as
 * páginas filhas só precisam declarar os params que elas mesmas abrem
 * (ex.: o slug do case).
 */
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

/**
 * Só `pt` e `en` são [lang] válidos; o resto é 404.
 *
 * O middleware não toca em path com ponto (o matcher exclui `.*\..*`, senão
 * /sitemap.xml viraria /pt/sitemap.xml). Sem ninguém barrando, /llms.txt
 * caía direto aqui como lang="llms.txt", e como normalizeLocale devolve pt
 * para qualquer coisa que não seja "en", o Next respondia a HOME INTEIRA
 * com status 200 — 329KB. Valia para qualquer extensão: /ads.txt, /foo.xml,
 * /teste.pdf. Um soft 404 sem fim, e a razão de o PageSpeed acusar timeout
 * ao buscar llms.txt: ele pedia um texto e recebia a home.
 */
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<LangParams>;
}): Promise<Metadata> {
  const locale = await localeFrom(params);
  const { title, description } = SITE_COPY[locale];
  const canonical = locale === "en" ? "/en" : "/";
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s | MilWeb` },
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
  // "dark light" (dark primeiro = padrão do site). Só "dark" fazia o
  // navegador pintar os controles nativos — os sliders da calculadora, o
  // campo do teste do Google, as scrollbars — em escuro mesmo com o tema
  // claro ligado pelo toggle.
  colorScheme: "dark light",
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<LangParams>;
}) {
  const locale = await localeFrom(params);
  return (
    <html lang={htmlLang(locale)} className={`${sans.variable} ${mono.variable} ${display.variable}`} suppressHydrationWarning>
      <head>
        {/* Anti-flash: aplica o tema salvo antes do paint (default = dark). */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: siteJsonLd(locale) }} />
        <SmoothScroll />
        <TrackConversions />
        <CursorGlow />
        <SquidFollower />
        <MouseParallax />
        <MiloProtagonist locale={locale} />
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
