import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Tokens SEMÂNTICOS via CSS vars — viram dark/claro trocando a classe
        // `.light` no <html>. Acento ultramarine + contraponto quente (warm).
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          2: "rgb(var(--surface-2) / <alpha-value>)",
        },
        fg: {
          DEFAULT: "rgb(var(--fg) / <alpha-value>)",
          muted: "rgb(var(--fg-muted) / <alpha-value>)",
          subtle: "rgb(var(--fg-subtle) / <alpha-value>)",
        },
        line: "rgb(var(--line) / <alpha-value>)",
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          soft: "rgb(var(--accent-soft) / <alpha-value>)",
          deep: "rgb(var(--accent-deep) / <alpha-value>)",
          fg: "rgb(var(--accent-fg) / <alpha-value>)",
        },
        // Contraponto quente do acento (CTA, números, destaques). Quebra o
        // mono-hue — ver a nota sobre matiz no topo de globals.css.
        warm: {
          DEFAULT: "rgb(var(--warm) / <alpha-value>)",
          fg: "rgb(var(--warm-fg) / <alpha-value>)",
        },
      },
      fontFamily: {
        // Display com personalidade (mata o "genérico" da Inter nos títulos).
        display: ["var(--font-display)", "var(--font-sans)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "line-drift": {
          "0%, 100%": { transform: "translateX(-6%)", opacity: "0.35" },
          "50%": { transform: "translateX(6%)", opacity: "0.7" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out both",
        "line-drift": "line-drift 9s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
