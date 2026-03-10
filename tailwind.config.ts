import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        display: ["Inter", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],     // 11px
        'xs':  ['0.8125rem', { lineHeight: '1.25rem' }],   // 13px — body
        'sm':  ['0.875rem',  { lineHeight: '1.375rem' }],  // 14px — table headers
        'base':['1rem',      { lineHeight: '1.5rem' }],    // 16px
        'lg':  ['1.125rem',  { lineHeight: '1.625rem' }],  // 18px — section titles
        'xl':  ['1.25rem',   { lineHeight: '1.75rem' }],   // 20px
        '2xl': ['1.5rem',    { lineHeight: '2rem' }],      // 24px — page titles
        '3xl': ['1.875rem',  { lineHeight: '2.25rem' }],   // 30px
      },
      spacing: {
        '0.5': '2px',
        '1':   '4px',
        '1.5': '6px',
        '2':   '8px',    // base unit
        '2.5': '10px',
        '3':   '12px',
        '3.5': '14px',
        '4':   '16px',   // card padding
        '5':   '20px',
        '6':   '24px',   // section gap
        '7':   '28px',
        '8':   '32px',   // page margin
        '9':   '36px',
        '10':  '40px',
        '11':  '44px',
        '12':  '48px',
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        success: { DEFAULT: "hsl(var(--success))", foreground: "hsl(var(--success-foreground))" },
        warning: { DEFAULT: "hsl(var(--warning))", foreground: "hsl(var(--warning-foreground))" },
        info: { DEFAULT: "hsl(var(--info))", foreground: "hsl(var(--info-foreground))" },
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
        pipeline: {
          new: "hsl(var(--pipeline-new))",
          contacted: "hsl(var(--pipeline-contacted))",
          requirement: "hsl(var(--pipeline-requirement))",
          suggested: "hsl(var(--pipeline-suggested))",
          "visit-scheduled": "hsl(var(--pipeline-visit-scheduled))",
          "visit-completed": "hsl(var(--pipeline-visit-completed))",
          booked: "hsl(var(--pipeline-booked))",
          lost: "hsl(var(--pipeline-lost))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "fade-in": { from: { opacity: "0", transform: "translateY(4px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "slide-in": { from: { opacity: "0", transform: "translateX(-4px)" }, to: { opacity: "1", transform: "translateX(0)" } },
        "scale-in": { from: { opacity: "0", transform: "scale(0.98)" }, to: { opacity: "1", transform: "scale(1)" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in": "slide-in 0.25s ease-out",
        "scale-in": "scale-in 0.25s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
