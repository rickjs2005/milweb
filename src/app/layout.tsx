import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Bricolage_Grotesque } from "next/font/google";
import { THEME_SCRIPT } from "@/lib/theme-script";
import { LANG_SCRIPT } from "@/lib/lang-script";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
});

/**
 * Root layout de verdade, exigido pelo Next só por causa do not-found.tsx
 * (ver a nota longa em src/app/not-found.tsx). Deliberadamente fino: html,
 * body, fontes e os dois scripts anti-flash (tema + idioma). Todo o resto —
 * metadata por página, JSON-LD, providers, mascote, analytics — continua em
 * app/[lang]/layout.tsx, que é quem toda rota normal realmente usa.
 *
 * Sem locale aqui (a raiz não tem o parâmetro [lang]): title é só um
 * fallback pras poucas páginas que vivem fora de [lang] (ex. not-found.tsx),
 * já que rotas normais ganham o title certo do generateMetadata de baixo.
 */
export const metadata: Metadata = {
  title: "MilWeb",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${mono.variable} ${display.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: LANG_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
