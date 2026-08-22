/**
 * Static experience data extracted from the Stitch mockup.
 *
 * This file holds the hardcoded "Curated Expeditions" content — Kyoto,
 * Copenhagen, Tuscany — with their images, descriptions, and metadata.
 * Once a real explore/discover API exists, this data will be replaced
 * by API calls through `endpoints.ts`.
 */

export interface Experience {
  id: string;
  title: string;
  location: string;
  imageUrl: string;
  imageAlt: string;
  priceTier: string;           // "$", "$$", "$$$"
  description: string;
  tags: string[];
  duration: string;
  /** "portrait" → aspect-[4/5], "landscape" → aspect-video */
  aspectRatio: "portrait" | "landscape";
  /** Whether this card has a glassmorphic overlay bar at the bottom (Tuscany style) */
  hasOverlayBar?: boolean;
}

export const EXPERIENCES: Experience[] = [
  {
    id: "kyoto-zen-temple",
    title: "Zen Awakening: Private Temple Access",
    location: "Kyoto, Japan",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBQ8uRfm0kssjBJe3VwO3FrwnA-gSH4syRtgAQu2u7PesCow1A_EPVVwaHCS3hZJZ9HzjO7DatPUbGZQAtZ7T35ZLHFipanFDicv0PScHUL8tXhmg17yUaX5-cXIFMpqFAV0ZRTIetJgGOW2kO0Jc8IXbDrdsUQiBS2KvJhrrElywy7gRKtR7joFuDr9Fabl4CrBtCjSu9fErpdxaY48kCQle443MgP2wzYQzRVIr44ZvARmeelPNjY",
    imageAlt:
      "A meticulously composed photograph of a serene Kyoto zen garden at dawn, soft mist hanging in the air, raked sand patterns perfectly undisturbed.",
    priceTier: "$$",
    description:
      "Gain exclusive pre-dawn entry to one of Kyoto's most revered Rinzai Zen temples, guided by a senior monk.",
    tags: ["Culture", "Wellness"],
    duration: "3 Hours",
    aspectRatio: "portrait",
  },
  {
    id: "copenhagen-architecture",
    title: "New Nordic Architecture Tour",
    location: "Copenhagen, Denmark",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCtgZ6anfZ58_1CAfYm_YsoFlnnV_OpBrphtFDhG9jwZaRLOlCpVKeycSm3w1aFV6fYu8JY2q5NMV0usR7CUQlgl85QOS1mzVusIJHmKR8pRqVPc-xHpGLLe8mLtIBuI65PnLy1sctXqdzw1sagWGLA_zjLQ4M48hlD_qI0qQk9OVxcm5RG32F_5ddG61j-WbCguOcRF-aGL9GEUtw_lfAibkm-pIdzkJavgdrpi39LWDOp49RzS2lE",
    imageAlt:
      "A dramatic high-contrast shot of modern architectural interior in Copenhagen, warm sunlight streaming through large geometric windows.",
    priceTier: "$$",
    description:
      "Explore the bleeding edge of sustainable Scandinavian design with a local architect as your personal guide.",
    tags: ["Design", "Urban"],
    duration: "Half Day",
    aspectRatio: "portrait",
  },
  {
    id: "tuscany-truffle-dining",
    title: "Truffle Foraging & Estate Dining",
    location: "Tuscany, Italy",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDHM5wAmxBHccvB-8HS_0PSyF0CkCE4u_xVTZUqneLbhb-PCqgXjP_8YRPIgIJkow4hANYxm-SB-lK0ER9njzDQ0bJDXPmIf_01SKmwXPGI0k18ODIYrf5EJTByBT3m-4R25T1wR7ApVRnBaPE4fjufwS2x2JN2deONgNHhWjBgmo0N6qVMs-QUsOC-l0TApIIAvprjR2cSOtJi1MkklFWmDDFMjaTWYvM4e7nnahNKAxtzqc10bmKt",
    imageAlt:
      "A warm, intimate photograph of a rustic Italian kitchen in Tuscany, golden hour light illuminating fresh pasta on a wooden table.",
    priceTier: "$$$",
    description:
      "Join a generational tartufaio and his Lagotto Romagnolo dogs in the misty hills, followed by a private feast.",
    tags: [],
    duration: "",
    aspectRatio: "landscape",
    hasOverlayBar: true,
  },
];

/** Map preview image for the Curate sidebar */
export const MAP_PREVIEW_URL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAIJBgpvzU5qXZF_k8i3l0MMWJpxq_ZKWdSIQ1T3QchRlqflS7sQ83CWYtQI3TWdC56_Qv99UvqJbBCqRCNHTE8hWz9EYv4mLbEiyHPttKJh_T3MQnsPOvrWdfGjeHmJqs3K4hruuNF-YqW8Av73PdYDr2btlj9rXF0elX5flGtq8Wrgbpu93K8LjiQpRGKUC8MLWRHw16VyDy6w6i_7cQcUFlTidc5tr7eiipXZn9WLehmr8VQ0LY0";

export const EXPERIENCE_TYPES = [
  { label: "Architecture Tours", checked: true },
  { label: "Culinary Masterclasses", checked: false },
  { label: "Private Gallery Access", checked: false },
  { label: "Historical Walks", checked: false },
] as const;

export const FILTER_TAGS = [
  { label: "Culture", active: true },
  { label: "Food & Wine", active: false },
  { label: "Nature", active: false },
  { label: "Wellness", active: false },
] as const;
