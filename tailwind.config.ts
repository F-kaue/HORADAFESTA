import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#D94E1F",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#1A1A2E",
          foreground: "#F8FAFC",
        },
        accent: {
          DEFAULT: "#E8A317",
          foreground: "#1A1A2E",
        },
        surface: "#F7F4F0",
        success: "#16A34A",
        warning: "#D97706",
        danger: "#DC2626",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      fontFamily: {
        display: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
      borderRadius: {
        lg: "var(--radius)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },
      boxShadow: {
        warm: "0 8px 30px -8px rgba(217, 78, 31, 0.22)",
        card: "0 1px 3px rgba(26, 26, 46, 0.06), 0 8px 24px -6px rgba(26, 26, 46, 0.08)",
        elevated: "0 12px 40px -12px rgba(26, 26, 46, 0.15)",
      },
      transitionDuration: {
        DEFAULT: "200ms",
      },
      spacing: {
        "safe-b": "env(safe-area-inset-bottom)",
      },
    },
  },
  safelist: [
    "bg-blue-600",
    "bg-amber-600",
    "bg-emerald-600",
    "bg-red-600",
    "bg-blue-50",
    "bg-amber-50",
    "bg-orange-50",
    "bg-emerald-50",
    "bg-red-50",
    "border-blue-200",
    "border-amber-200",
    "border-orange-200",
    "border-emerald-200",
    "border-red-200",
    "bg-violet-600",
    "bg-violet-50",
    "border-violet-200",
    "dark:bg-blue-950/50",
    "dark:bg-amber-950/50",
    "dark:bg-orange-950/45",
    "dark:bg-emerald-950/50",
    "dark:bg-violet-950/50",
    "dark:bg-red-950/50",
    "dark:text-blue-100",
    "dark:text-amber-100",
    "dark:text-orange-100",
    "dark:text-emerald-100",
    "dark:text-violet-100",
    "dark:text-red-100",
  ],
  plugins: [],
};
export default config;
