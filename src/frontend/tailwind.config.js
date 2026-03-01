import typography from "@tailwindcss/typography";
import containerQueries from "@tailwindcss/container-queries";
import animate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["index.html", "src/**/*.{js,ts,jsx,tsx,html,css}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "oklch(var(--border))",
        input: "oklch(var(--input))",
        ring: "oklch(var(--ring) / <alpha-value>)",
        background: "oklch(var(--background))",
        foreground: "oklch(var(--foreground))",
        primary: {
          DEFAULT: "oklch(var(--primary) / <alpha-value>)",
          foreground: "oklch(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "oklch(var(--secondary) / <alpha-value>)",
          foreground: "oklch(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "oklch(var(--destructive) / <alpha-value>)",
          foreground: "oklch(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "oklch(var(--muted) / <alpha-value>)",
          foreground: "oklch(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "oklch(var(--accent) / <alpha-value>)",
          foreground: "oklch(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "oklch(var(--popover))",
          foreground: "oklch(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "oklch(var(--card))",
          foreground: "oklch(var(--card-foreground))",
        },
        chart: {
          1: "oklch(var(--chart-1))",
          2: "oklch(var(--chart-2))",
          3: "oklch(var(--chart-3))",
          4: "oklch(var(--chart-4))",
          5: "oklch(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "oklch(var(--sidebar))",
          foreground: "oklch(var(--sidebar-foreground))",
          primary: "oklch(var(--sidebar-primary))",
          "primary-foreground": "oklch(var(--sidebar-primary-foreground))",
          accent: "oklch(var(--sidebar-accent))",
          "accent-foreground": "oklch(var(--sidebar-accent-foreground))",
          border: "oklch(var(--sidebar-border))",
          ring: "oklch(var(--sidebar-ring))",
        },
        // BetX custom semantic colors
        neon: "oklch(var(--neon-green))",
        gold: "oklch(var(--gold))",
        win: "oklch(var(--win-green))",
        loss: "oklch(var(--loss-red))",
        live: "oklch(var(--live-red))",
        purple: "oklch(var(--purple))",
        "panel-dark": "oklch(var(--panel-dark))",
        "panel-mid": "oklch(var(--panel-mid))",
      },
      fontFamily: {
        display: ['"Mona Sans"', "sans-serif"],
        body: ["Figtree", "sans-serif"],
        sans: ["Figtree", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(0,0,0,0.05)",
        neon: "0 0 16px oklch(0.82 0.2 155 / 30%)",
        gold: "0 0 16px oklch(0.78 0.18 68 / 30%)",
        panel: "0 4px 24px rgba(0,0,0,0.4)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "flip-coin": {
          "0%": { transform: "rotateY(0deg)" },
          "50%": { transform: "rotateY(900deg)" },
          "100%": { transform: "rotateY(1800deg)" },
        },
        "roll-dice": {
          "0%": { transform: "rotate(0deg) scale(1)" },
          "25%": { transform: "rotate(90deg) scale(1.1)" },
          "50%": { transform: "rotate(180deg) scale(0.9)" },
          "75%": { transform: "rotate(270deg) scale(1.1)" },
          "100%": { transform: "rotate(360deg) scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
        "flip-coin": "flip-coin 1s ease-in-out",
        "roll-dice": "roll-dice 0.6s ease-in-out",
      },
    },
  },
  plugins: [typography, containerQueries, animate],
};
