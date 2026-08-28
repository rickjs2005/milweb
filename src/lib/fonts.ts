import { Archivo, JetBrains_Mono } from "next/font/google";

/**
 * Duas famílias, poucos pesos: Archivo variável (eixo de largura — headlines
 * expandidas 900, corpo 400) e JetBrains Mono para a camada técnica.
 * Compartilhado entre o layout de [lang] e o 404 global.
 */
export const display = Archivo({ subsets: ["latin"], variable: "--font-display", axes: ["wdth"], display: "swap" });
export const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400"], display: "swap" });
export const FONT_CLASS = `${display.variable} ${mono.variable}`;
