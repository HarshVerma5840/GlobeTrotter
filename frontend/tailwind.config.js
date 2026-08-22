/**
 * Design tokens ported from the Stitch "Aether Editorial" theme.
 *
 * INTEGRATION.md §6.1: this config is authoritative. Stitch output ships
 * with its own inline `tailwind.config` and a CDN <script> — both are
 * dropped on port, and the tokens live here instead so every screen shares
 * one scale rather than each pasting its own.
 */
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      /* ── Aether Editorial – Color Tokens ────────────────────────── */
      colors: {
        /* Material-style surface hierarchy */
        surface:                   "#faf9f8",
        "surface-dim":             "#dadad9",
        "surface-bright":          "#faf9f8",
        "surface-container-lowest":"#ffffff",
        "surface-container-low":   "#f4f3f2",
        "surface-container":       "#eeeeed",
        "surface-container-high":  "#e9e8e7",
        "surface-container-highest":"#e3e2e1",
        "surface-variant":         "#e3e2e1",
        "surface-tint":            "#565e74",
        "on-surface":              "#1a1c1c",
        "on-surface-variant":      "#45464d",
        "inverse-surface":         "#2f3130",
        "inverse-on-surface":      "#f1f0f0",

        /* Primary */
        primary:                   "#000000",
        "on-primary":              "#ffffff",
        "primary-container":       "#131b2e",
        "on-primary-container":    "#7c839b",
        "inverse-primary":         "#bec6e0",
        "primary-fixed":           "#dae2fd",
        "primary-fixed-dim":       "#bec6e0",
        "on-primary-fixed":        "#131b2e",
        "on-primary-fixed-variant":"#3f465c",

        /* Secondary */
        secondary:                 "#615e57",
        "on-secondary":            "#ffffff",
        "secondary-container":     "#e8e2d9",
        "on-secondary-container":  "#67645d",
        "secondary-fixed":         "#e8e2d9",
        "secondary-fixed-dim":     "#cbc6bd",
        "on-secondary-fixed":      "#1d1b16",
        "on-secondary-fixed-variant":"#494640",

        /* Tertiary */
        tertiary:                  "#000000",
        "on-tertiary":             "#ffffff",
        "tertiary-container":      "#1c1b1b",
        "on-tertiary-container":   "#858383",
        "tertiary-fixed":          "#e5e2e1",
        "tertiary-fixed-dim":      "#c8c6c5",
        "on-tertiary-fixed":       "#1c1b1b",
        "on-tertiary-fixed-variant":"#474746",

        /* Error */
        error:                     "#ba1a1a",
        "on-error":                "#ffffff",
        "error-container":         "#ffdad6",
        "on-error-container":      "#93000a",

        /* Outline */
        outline:                   "#76777d",
        "outline-variant":         "#c6c6cd",

        /* Brand semantic aliases */
        background:                "#faf9f8",
        "on-background":           "#1a1c1c",
        "background-cream":        "#FDFCFB",
        "ink-charcoal":            "#1A1A1A",
        "sand-accent":             "#E8E2D9",
        "premium-navy":            "#0F172A",
        "glass-white":             "rgba(255, 255, 255, 0.6)",

        /* Editorial page tokens (Create Trip) */
        "editorial-bg":            "#F7F5F0",
        "editorial-card":          "#FFFFFF",
        "editorial-primary":       "#111111",
        "editorial-secondary":     "#6F6A62",
        "editorial-border":        "#DDD8CF",
        "editorial-beige":         "#EFEBE3",
      },

      /* ── Typography ─────────────────────────────────────────────── */
      fontFamily: {
        "display-xl":         ["EB Garamond", "serif"],
        "display-xl-mobile":  ["EB Garamond", "serif"],
        "headline-lg":        ["EB Garamond", "serif"],
        "headline-lg-mobile": ["EB Garamond", "serif"],
        "headline-md":        ["EB Garamond", "serif"],
        "body-lg":            ["Hanken Grotesk", "sans-serif"],
        "body-md":            ["Hanken Grotesk", "sans-serif"],
        "label-lg":           ["Hanken Grotesk", "sans-serif"],
        "label-sm":           ["Hanken Grotesk", "sans-serif"],
      },
      fontSize: {
        "display-xl":         ["72px", { lineHeight: "80px",  letterSpacing: "-0.02em", fontWeight: "400" }],
        "display-xl-mobile":  ["48px", { lineHeight: "56px",  letterSpacing: "-0.01em", fontWeight: "400" }],
        "headline-lg":        ["40px", { lineHeight: "48px",  fontWeight: "500" }],
        "headline-lg-mobile": ["32px", { lineHeight: "40px",  fontWeight: "500" }],
        "headline-md":        ["32px", { lineHeight: "40px",  fontWeight: "500" }],
        "body-lg":            ["20px", { lineHeight: "32px",  fontWeight: "400" }],
        "body-md":            ["16px", { lineHeight: "24px",  fontWeight: "400" }],
        "label-lg":           ["14px", { lineHeight: "20px",  letterSpacing: "0.05em", fontWeight: "600" }],
        "label-sm":           ["11px", { lineHeight: "16px",  letterSpacing: "0.08em", fontWeight: "700" }],
      },

      /* ── Spacing ────────────────────────────────────────────────── */
      spacing: {
        "margin-desktop":  "80px",
        "margin-tablet":   "40px",
        "margin-mobile":   "20px",
        gutter:            "32px",
        "section-v-gap":   "120px",
        "content-v-gap":   "24px",
      },

      /* ── Border Radius ──────────────────────────────────────────── */
      borderRadius: {
        DEFAULT: "0.25rem",
        lg:      "0.5rem",
        xl:      "0.75rem",
        full:    "9999px",
      },
    },
  },
  plugins: [],
};
