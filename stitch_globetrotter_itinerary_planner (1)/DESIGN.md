---
name: Aether Editorial
colors:
  surface: '#faf9f8'
  surface-dim: '#dadad9'
  surface-bright: '#faf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f2'
  surface-container: '#eeeeed'
  surface-container-high: '#e9e8e7'
  surface-container-highest: '#e3e2e1'
  on-surface: '#1a1c1c'
  on-surface-variant: '#45464d'
  inverse-surface: '#2f3130'
  inverse-on-surface: '#f1f0f0'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#615e57'
  on-secondary: '#ffffff'
  secondary-container: '#e8e2d9'
  on-secondary-container: '#67645d'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1c1b1b'
  on-tertiary-container: '#858383'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#e8e2d9'
  secondary-fixed-dim: '#cbc6bd'
  on-secondary-fixed: '#1d1b16'
  on-secondary-fixed-variant: '#494640'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1c1b1b'
  on-tertiary-fixed-variant: '#474746'
  background: '#faf9f8'
  on-background: '#1a1c1c'
  surface-variant: '#e3e2e1'
  background-cream: '#FDFCFB'
  ink-charcoal: '#1A1A1A'
  sand-accent: '#E8E2D9'
  premium-navy: '#0F172A'
  glass-white: rgba(255, 255, 255, 0.6)
typography:
  display-xl:
    fontFamily: EB Garamond
    fontSize: 72px
    fontWeight: '400'
    lineHeight: 80px
    letterSpacing: -0.02em
  display-xl-mobile:
    fontFamily: EB Garamond
    fontSize: 48px
    fontWeight: '400'
    lineHeight: 56px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: EB Garamond
    fontSize: 40px
    fontWeight: '500'
    lineHeight: 48px
  headline-lg-mobile:
    fontFamily: EB Garamond
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 40px
  headline-md:
    fontFamily: EB Garamond
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 40px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '400'
    lineHeight: 32px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-lg:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  margin-desktop: 80px
  margin-tablet: 40px
  margin-mobile: 20px
  gutter: 32px
  section-v-gap: 120px
  content-v-gap: 24px
---

## Brand & Style

The design system embodies the essence of high-end travel—sophisticated, calm, and intellectually curious. It is designed for a target audience that views travel as an art form rather than a leisure activity. The emotional response is one of "serene exclusivity," achieved through an expansive layout that allows high-resolution photography and literary typography to breathe.

The visual style is a blend of **Minimalism** and **Glassmorphism**. It uses a "Paper-on-Glass" metaphor, where crisp editorial content is presented on soft, tactile backgrounds, occasionally overlaid with frosted layers that suggest depth and modern technology. This approach balances the timeless authority of a printed magazine with the fluid, interactive nature of a digital platform.

**Key Attributes:**
*   **High-End Editorial:** Focus on white space and classical proportions.
*   **Quiet Luxury:** A palette and motion language that feels expensive and effortless.
*   **Professional Clarity:** Utilitarian UI elements that stay out of the way of the primary content.

## Colors

The color strategy is rooted in "Natural Neutrals," creating a canvas that mimics high-quality heavy-stock paper.

*   **Primary (Premium Navy):** Reserved for high-priority interactive elements and structural framing. It provides a grounding contrast to the softer tones.
*   **Secondary (Sand Accent):** Used for subtle UI backgrounds, dividers, and decorative elements. It adds warmth and prevents the design from feeling clinical.
*   **Tertiary (Ink Charcoal):** The exclusive color for typography and iconography, ensuring maximum legibility while appearing softer and more "ink-like" than pure black.
*   **Neutral (Background Cream):** The primary surface color, chosen for its eye-friendly warmth compared to standard digital white.

## Typography

This design system employs a classic serif/sans-serif pairing to distinguish between narrative content and functional UI.

*   **Headlines (EB Garamond):** Used for story titles and section headers. It conveys authority and a "literary" feel. Display sizes should use a tighter letter spacing to create a cohesive visual block.
*   **Body (Hanken Grotesk):** Chosen for its clean, contemporary feel. It offers excellent legibility for long-form travel logs and destination guides.
*   **Labels & UI:** Small labels are set in uppercase with generous tracking (8%) to mimic the branding found in luxury fashion and watchmaking.

## Layout & Spacing

The layout philosophy is defined by **Generous Rhythms**. It utilizes a **Fixed Grid** approach to maintain editorial integrity across different resolutions.

*   **Grid:** A 12-column grid on desktop (max-width 1440px) with 32px gutters. Elements are encouraged to span across multiple columns to create asymmetrical, magazine-style layouts.
*   **Verticality:** Section gaps are intentionally large (120px+) to force a "slow scroll" experience, encouraging the user to linger on photography and typography.
*   **Mobile Adaptivity:** On mobile, the grid collapses to 4 columns. Section gaps are reduced to 64px to maintain momentum while keeping the "spacious" brand promise.

## Elevation & Depth

Hierarchy is established through **Glassmorphism** and **Tonal Layers** rather than heavy shadows.

*   **Tonal Layers:** The base layer is Background Cream. Secondary cards use Sand Accent to create subtle depth without a shadow.
*   **Glassmorphism:** Floating elements (like navigation bars or featured photo captions) use a backdrop-blur (12px) with a semi-transparent white tint (glass-white). This creates a sense of light passing through the interface.
*   **Ambient Shadows:** When shadows are necessary for functional modals, they must be extremely diffused: `box-shadow: 0 20px 50px rgba(15, 23, 42, 0.05)`. The shadow color is tinted with Navy to keep it within the palette.

## Shapes

The shape language is **Rounded**, intended to soften the "ink-and-paper" aesthetic and make the digital experience feel more approachable and modern.

*   **Standard Components:** Buttons and input fields use a 0.5rem (8px) radius.
*   **Content Containers:** Large image cards and glassmorphic overlays use a 1rem (16px) radius to emphasize their status as "floating objects."
*   **Pill Elements:** Tags and interactive chips use a full pill shape to provide a clear visual contrast against structural UI elements.

## Components

*   **Buttons:**
    *   *Primary:* Solid Premium Navy with Background Cream text. High contrast, sharp but rounded.
    *   *Secondary:* Glassmorphic background with Navy text and a 1px Navy border at 20% opacity.
*   **Cards:**
    *   Travel Cards use high-quality imagery with a 16px corner radius. Captions should be placed on a Glassmorphic overlay positioned at the bottom of the card.
*   **Input Fields:**
    *   Fields are designed with a Sand Accent background and a subtle bottom-border in Navy. On focus, the border thickness increases slightly (2px).
*   **Chips & Tags:**
    *   Small, pill-shaped elements using Sand Accent with Charcoal text. Used for "Destination Tags" or "Read Time."
*   **Lists:**
    *   Separated by thin, Sand Accent dividers (1px). Rows have generous vertical padding (24px) to maintain the spacious layout.
*   **Editorial Pull-Quotes:**
    *   Large EB Garamond text, centered, with Sand Accent horizontal rules above and below to break up long-form body text.