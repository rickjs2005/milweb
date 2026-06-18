import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Bricolage_Grotesque } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { LangProvider } from "@/components/lang-provider";
import { SmoothScroll } from "@/components/smooth-scroll";
import { WhatsappFab } from "@/components/whatsapp-fab";
import { PROFILE, SITE_URL } from "@/lib/content";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
});

const title = "MilWeb — Sites e sistemas que dão resultado";
const description =
  "Desenvolvedor Full Stack freelancer (Next.js, React, TypeScript, Node.js, Supabase). Crio sites, landing pages, sistemas web, catálogos para WhatsApp, dashboards e automações. Orçamento gratuito.";

export const metadata: Metadata = {
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
  icons: { icon: PROFILE.logo, apple: PROFILE.logo },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: "MilWeb",
    title,
    description,
  },
  twitter: { card: "summary_large_image", title, description },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
};

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
  image: `${SITE_URL}${PROFILE.logo}`,
  description,
  areaServed: "BR",
  founder: { "@type": "Person", name: "Rick", sameAs: [PROFILE.github, PROFILE.linkedin].filter(Boolean) },
  knowsAbout: ["Next.js", "React", "TypeScript", "Node.js", "Supabase", "PostgreSQL", "SEO"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${mono.variable} ${display.variable}`} suppressHydrationWarning>
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
        <LangProvider>{children}</LangProvider>
        <WhatsappFab />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
