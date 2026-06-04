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
          DEFAULT: "#E8612C",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#1A1A2E",
          foreground: "#FFF8F3",
        },
        accent: {
          DEFAULT: "#F9C846",
          foreground: "#1A1A2E",
        },
        surface: "#FFF8F3",
        success: "#2ECC71",
        warning: "#F39C12",
        danger: "#E74C3C",
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
        display: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "12px",
        xl: "16px",
      },
      boxShadow: {
        warm: "0 4px 24px -4px rgba(232, 97, 44, 0.15)",
        card: "0 2px 12px -2px rgba(26, 26, 46, 0.08)",
      },
      transitionDuration: {
        DEFAULT: "200ms",
      },
    },
  },
  plugins: [],
};
export default config;
