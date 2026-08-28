import type { Config } from "tailwindcss";

const rgb = (v: string) => `rgb(var(--${v}) / <alpha-value>)`;

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    // Breakpoints oficiais: mobile (<720), tablet (720–1080), desktop (>1080).
    screens: {
      sm: "480px",
      md: "720px",
      lg: "1080px",
      xl: "1440px",
      "2xl": "1920px",
    },
    extend: {
      colors: {
        paper: { DEFAULT: rgb("paper"), 2: rgb("paper-2") },
        ink: { DEFAULT: rgb("ink"), 2: rgb("ink-2"), 3: rgb("ink-3") },
        neutral: rgb("neutral"),
        signal: { DEFAULT: rgb("signal"), ink: rgb("signal-ink") },

        // ---- aliases legados (páginas comerciais ainda não reskinadas) ----
        bg: rgb("paper"),
        surface: { DEFAULT: rgb("paper-2"), 2: rgb("neutral") },
        fg: { DEFAULT: rgb("ink"), muted: rgb("ink-2"), subtle: rgb("ink-3") },
        line: rgb("neutral"),
        accent: { DEFAULT: rgb("ink"), soft: rgb("ink-2"), deep: rgb("ink"), fg: rgb("paper") },
        warm: { DEFAULT: rgb("ink-2"), loud: rgb("ink"), fg: rgb("paper") },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-display)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        "step--1": "var(--step--1)",
        "step-0": "var(--step-0)",
        "step-1": "var(--step-1)",
        "step-2": "var(--step-2)",
        "step-3": "var(--step-3)",
        "step-4": "var(--step-4)",
        "step-5": "var(--step-5)",
        "step-6": "var(--step-6)",
      },
      transitionTimingFunction: {
        "out-expo": "var(--ease-out-expo)",
        "out-quint": "var(--ease-out-quint)",
        "in-out-quart": "var(--ease-in-out-quart)",
        smooth: "var(--ease-smooth)",
        snap: "var(--ease-snap)",
      },
      transitionDuration: {
        fast: "var(--dur-fast)",
        medium: "var(--dur-medium)",
        slow: "var(--dur-slow)",
      },
      zIndex: {
        content: "var(--z-content)",
        inspect: "var(--z-inspect)",
        nav: "var(--z-nav)",
        overlay: "var(--z-overlay)",
        transition: "var(--z-transition)",
        boot: "var(--z-boot)",
      },
      spacing: {
        margin: "var(--margin)",
        gutter: "var(--gutter)",
        nav: "var(--nav-h)",
      },
    },
  },
  plugins: [],
} satisfies Config;
