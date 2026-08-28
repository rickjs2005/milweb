import type { Metadata } from "next";
import "./globals.css";

/** Só vale para /_not-found — app/[lang]/layout.tsx define a metadata real. */
export const metadata: Metadata = { title: "MilWeb / 404", robots: { index: false, follow: false } };

/**
 * Layout raiz de passagem. O <html lang> real é renderizado por
 * app/[lang]/layout.tsx (por idioma, do servidor) e por app/not-found.tsx
 * (404 global) — React 19 trata html/body como singletons, então podem vir
 * de um layout aninhado. Este arquivo existe só porque o Next exige um
 * layout raiz para a rota /_not-found.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
