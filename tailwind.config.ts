import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        display: ["Cormorant Garamond", "serif"],
        body: ["Inter", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        gold: {
          DEFAULT: "hsl(var(--gold))",
          soft: "hsl(var(--gold-soft))",
        },
        champagne: "hsl(var(--champagne))",
        ivory: "hsl(var(--ivory))",
        charcoal: "hsl(var(--charcoal))",
        "warm-gray": "hsl(var(--warm-gray))",
        season: {
          spring: "hsl(var(--spring-light))",
          summer: "hsl(var(--summer-light))",
          autumn: "hsl(var(--autumn-warm))",
          winter: "hsl(var(--winter-cool))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
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
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        // Breathing & Pulsing
        breathe: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.8" },
          "50%": { transform: "scale(1.05)", opacity: "1" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 5px hsl(42 85% 55% / 0.3)" },
          "50%": { boxShadow: "0 0 20px hsl(42 85% 55% / 0.6), 0 0 40px hsl(42 85% 55% / 0.3)" },
        },
        "glow-breathe": {
          "0%, 100%": {
            boxShadow: "0 0 10px hsl(42 85% 55% / 0.3), 0 0 20px hsl(42 85% 55% / 0.2)",
            filter: "brightness(1)",
          },
          "50%": {
            boxShadow: "0 0 20px hsl(42 85% 55% / 0.5), 0 0 40px hsl(42 85% 55% / 0.3), 0 0 60px hsl(42 85% 55% / 0.2)",
            filter: "brightness(1.1)",
          },
        },
        // Movement
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "float-gentle": {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "33%": { transform: "translateY(-5px) rotate(1deg)" },
          "66%": { transform: "translateY(-3px) rotate(-1deg)" },
        },
        "bounce-soft": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        // Special Effects
        "neon-flicker": {
          "0%, 100%": { opacity: "1" },
          "41%": { opacity: "1" },
          "42%": { opacity: "0.8" },
          "43%": { opacity: "1" },
          "45%": { opacity: "0.3" },
          "46%": { opacity: "1" },
        },
        "text-glow-pulse": {
          "0%, 100%": { textShadow: "0 0 10px hsl(42 85% 55% / 0.5)" },
          "50%": { textShadow: "0 0 20px hsl(42 85% 55% / 0.8), 0 0 30px hsl(42 85% 55% / 0.5)" },
        },
        "gradient-shift": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        "orb-float": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)", opacity: "0.3" },
          "33%": { transform: "translate(30px, -30px) scale(1.1)", opacity: "0.5" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)", opacity: "0.4" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        ripple: {
          "0%": { transform: "scale(0)", opacity: "0.5" },
          "100%": { transform: "scale(4)", opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-up": "slide-up 0.6s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        shimmer: "shimmer 3s ease-in-out infinite",
        breathe: "breathe 4s ease-in-out infinite",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "glow-breathe": "glow-breathe 4s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        "float-gentle": "float-gentle 8s ease-in-out infinite",
        "bounce-soft": "bounce-soft 2s ease-in-out infinite",
        "neon-flicker": "neon-flicker 3s infinite",
        "text-glow-pulse": "text-glow-pulse 2s ease-in-out infinite",
        "gradient-shift": "gradient-shift 3s ease infinite",
        "orb-float": "orb-float 20s ease-in-out infinite",
        "spin-slow": "spin-slow 8s linear infinite",
        ripple: "ripple 1s ease-out",
      },
      boxShadow: {
        xs: "0 1px 2px 0 hsl(0 0% 0% / 0.03)",
        sm: "0 1px 3px 0 hsl(0 0% 0% / 0.05), 0 1px 2px -1px hsl(0 0% 0% / 0.05)",
        md: "0 4px 6px -1px hsl(0 0% 0% / 0.07), 0 2px 4px -2px hsl(0 0% 0% / 0.05)",
        lg: "0 10px 15px -3px hsl(0 0% 0% / 0.08), 0 4px 6px -4px hsl(0 0% 0% / 0.05)",
        xl: "0 20px 25px -5px hsl(0 0% 0% / 0.08), 0 8px 10px -6px hsl(0 0% 0% / 0.04)",
        "2xl": "0 25px 50px -12px hsl(0 0% 0% / 0.15)",
        glow: "0 0 15px hsl(var(--primary) / 0.3), 0 0 30px hsl(var(--primary) / 0.15)",
        "glow-strong": "0 0 20px hsl(var(--primary) / 0.5), 0 0 40px hsl(var(--primary) / 0.25)",
        "glow-violet": "0 0 15px hsl(238 45% 55% / 0.4), 0 0 30px hsl(238 45% 55% / 0.2)",
        inner: "inset 0 2px 4px 0 hsl(0 0% 0% / 0.05)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
