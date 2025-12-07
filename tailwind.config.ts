import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        'heading': ['Orbitron', 'monospace'],
        'sans': ['Roboto', 'sans-serif'],
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
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "fade-in": {
          "0%": {
            opacity: "0",
            transform: "translateY(20px)"
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)"
          }
        },
        "slide-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(30px)"
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)"
          }
        },
        "scale-in": {
          "0%": {
            opacity: "0",
            transform: "scale(0.95)"
          },
          "100%": {
            opacity: "1",
            transform: "scale(1)"
          }
        },
        "slide-in-right": {
          "0%": {
            transform: "translateX(100%)",
            opacity: "0"
          },
          "100%": {
            transform: "translateX(0)",
            opacity: "1"
          }
        },
        "rotate-icon": {
          "0%": {
            transform: "rotate(0deg)"
          },
          "100%": {
            transform: "rotate(360deg)"
          }
        },
        "slide-in-from-top": {
          "0%": {
            transform: "translateY(-100%)",
            opacity: "0"
          },
          "100%": {
            transform: "translateY(0)",
            opacity: "1"
          }
        },
        "glitch": {
          "0%, 100%": {
            transform: "translate(0)",
            textShadow: "none"
          },
          "10%": {
            transform: "translate(-2px, 2px)",
            textShadow: "2px 0 #ef4444, -2px 0 #06b6d4"
          },
          "20%": {
            transform: "translate(2px, -2px)",
            textShadow: "-2px 0 #ef4444, 2px 0 #06b6d4"
          },
          "30%": {
            transform: "translate(-2px, -2px)",
            textShadow: "2px 0 #ef4444, -2px 0 #06b6d4"
          },
          "40%": {
            transform: "translate(2px, 2px)",
            textShadow: "-2px 0 #ef4444, 2px 0 #06b6d4"
          },
          "50%": {
            transform: "translate(-2px, 2px)",
            textShadow: "2px 0 #ef4444, -2px 0 #06b6d4"
          },
          "60%": {
            transform: "translate(2px, -2px)",
            textShadow: "-2px 0 #ef4444, 2px 0 #06b6d4"
          },
          "70%": {
            transform: "translate(-2px, -2px)",
            textShadow: "2px 0 #ef4444, -2px 0 #06b6d4"
          },
          "80%": {
            transform: "translate(2px, 2px)",
            textShadow: "-2px 0 #ef4444, 2px 0 #06b6d4"
          },
          "90%": {
            transform: "translate(-2px, 2px)",
            textShadow: "2px 0 #ef4444, -2px 0 #06b6d4"
          }
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.6s ease-out",
        "slide-up": "slide-up 0.6s ease-out",
        "scale-in": "scale-in 0.4s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "rotate-icon": "rotate-icon 0.5s ease-in-out",
        "slide-in-from-top": "slide-in-from-top 0.3s ease-out",
        "glitch-once": "glitch 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.3s",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
