import type { Metadata } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import { LANG_SCRIPT } from "@/lib/lang-script";
import "./globals.css";

/**
 * Duas famílias, poucos pesos: Archivo variável (eixo de largura — headlines
 * expandidas 900, corpo 400) e JetBrains Mono para a camada técnica.
 */
const display = Archivo({
  subsets: ["latin"],
  variable: "--font-display",
  axes: ["wdth"],
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400"],
  display: "swap",
});

/**
 * Root layout mínimo, exigido pelo Next por causa do not-found.tsx na raiz.
 * Metadata real, JSON-LD e providers vivem em app/[lang]/layout.tsx.
 */
export const metadata: Metadata = { title: "MilWeb" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: LANG_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
