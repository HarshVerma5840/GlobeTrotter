/**
 * Static data for the Itinerary Builder page.
 * Extracted from stitch_globetrotter_itinerary_planner (2).
 *
 * In production, this will come from the trips API.
 */

export interface ItineraryDay {
  dayNumber: number;
  date: string;
  label: string;
  isActive: boolean;
}

export interface TimeSlotActivity {
  id: string;
  type: "flight" | "hotel" | "dining" | "activity";
  title: string;
  subtitle: string;
  /** Left accent bar color — Tailwind class */
  accentColor: string;
  icon: string;
  iconFilled?: boolean;
  imageUrl?: string;
  imageAlt?: string;
  /** Badge on image, e.g. "Check-in" */
  imageBadge?: string;
  /** Location text */
  location?: string;
  /** Key-value metadata rows, e.g. Flight: JL 7082 */
  meta?: { label: string; value: string }[];
  /** Chip tags, e.g. Conf: #HX8829 */
  tags?: string[];
}

export interface TimeSlot {
  time: string;
  period: string; // "Morning" | "Afternoon" | "Evening"
  activities: TimeSlotActivity[];
  /** Show a drag-drop zone after the activities */
  showDropZone?: boolean;
}

export interface LibraryItem {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  imageAlt: string;
}

// ── Trip header ─────────────────────────────────────────────

export const TRIP_HEADER = {
  title: "Kyoto Autumn Retreat",
  description:
    "Curating the perfect balance of temple visits, kaiseki dining, and serene bamboo forest walks.",
  badge: "Trip Planner",
};

// ── Day timeline ────────────────────────────────────────────

export const ITINERARY_DAYS: ItineraryDay[] = [
  { dayNumber: 1, date: "Oct 12, Mon", label: "Arrival & Gion", isActive: true },
  { dayNumber: 2, date: "Oct 13, Tue", label: "Arashiyama", isActive: false },
  { dayNumber: 3, date: "Oct 14, Wed", label: "Fushimi Inari", isActive: false },
];

// ── Active day content ──────────────────────────────────────

export const ACTIVE_DAY = {
  title: "Day 1: Arrival & Gion",
  subtitle: "Monday, October 12th",
};

export const TIME_SLOTS: TimeSlot[] = [
  {
    time: "09:00",
    period: "Morning",
    activities: [
      {
        id: "arrival-kix",
        type: "flight",
        title: "Arrival at KIX",
        subtitle: "Kansai International Airport",
        accentColor: "bg-premium-navy",
        icon: "flight_land",
        meta: [
          { label: "Flight", value: "JL 7082" },
          { label: "Terminal", value: "T1" },
        ],
      },
    ],
  },
  {
    time: "14:00",
    period: "Afternoon",
    activities: [
      {
        id: "hoshinoya-kyoto",
        type: "hotel",
        title: "Hoshinoya Kyoto",
        subtitle: "",
        accentColor: "bg-secondary",
        icon: "",
        imageUrl:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuBaJ4T51LWFcIJq6YUhbYZ8LKWBPTXbQYLGa491JVQC66RzJMusyPRxfGG7WbkH-h1ZdOAQyk1ZVkxZ3sBo_cGcgvdvGWyaIVdF0FqHaAsZ076RiZI05ZVfIUGdWekGmgp5Iw0uQHFuDwHAJVJpKczqsRb7-uPQ3HyT6JZLpUJsNvOTTq1KVeCQkksQ8JEeZWpDhpOh0RmZyd53U35mTHPMDio2Zd6NawU45Dzx36INsatKyKlxkpRU",
        imageAlt: "Traditional Japanese ryokan interior with tatami mats",
        imageBadge: "Check-in",
        location: "Arashiyama, Kyoto",
        tags: ["Conf: #HX8829", "River View Room"],
      },
    ],
    showDropZone: true,
  },
  {
    time: "19:30",
    period: "Evening",
    activities: [
      {
        id: "kikunoi-honten",
        type: "dining",
        title: "Kikunoi Honten",
        subtitle: "Kaiseki Dinner • Reservation Confirmed",
        accentColor: "bg-tertiary-container",
        icon: "restaurant",
        iconFilled: true,
      },
    ],
  },
];

// ── Library items ───────────────────────────────────────────

export const LIBRARY_ITEMS: LibraryItem[] = [
  {
    id: "fushimi-inari",
    title: "Fushimi Inari Taisha",
    subtitle: "Shrine • 2-3 hours",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC_K929lAuVZC3OMFspuoxbPZHLKbFdgzw927NDVtAN9hENTExQm1iFDXXTDACIBGygwcVfRHY_XNqUROi7SswQWNUJqRU5x33d48xbw8LYSqUraWqKTGfAlJJAC2yr8jcNz4GA-qAg8cYJladbZNYYj7w3ErK7DD4CVU79Caf8_dJyY7Yo6oKx8YFnhphdLsYmnhfpTH0w6JgGutS4GkHIvZGLMCwgftVivQ318RKdS3Vo6va5xXXf",
    imageAlt: "Vermilion torii gate in Kyoto",
  },
  {
    id: "gion-karyo",
    title: "Gion Karyo",
    subtitle: "Dining • Kaiseki",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBVGA6mIkBvk6VX5j_intOA4RQgqZMHCQyxjrNmQOr9XwEkmXrnv_xRNFc4IQfVrt7N4t_sXKZwBuBOL03fp_kAdTHu3so_3DvY56C0nWYcrOf9sOK9wq-PxxNlJqaNnm0m96H5HOytLfhDLlbONRe-k1nF2lJYqYG-nLTEy0hoBdmDfQlExx9BHo1ZYGfRg2v2A5Wm9d-1fqvkCDvMSmU6hYb4pZZCYrPugJuZNeFoAt1y7oKDDEV9",
    imageAlt: "Kaiseki sushi plate on dark ceramic",
  },
  {
    id: "arashiyama-bamboo",
    title: "Arashiyama Bamboo Grove",
    subtitle: "Nature • 1-2 hours",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAqToEjUHg8AOdozhhUaLkjH35O7dfDBAEVtETWAWddKQLBEI5BMt8aSeuXdQjt2_gSl9PNajIpv91qW-Svm2X0QylAjDm-_z59o6qpYHlIyXRbmjBhTQFRpahQW9rvMdYeo1b0lc3CFFhz0ug-OJSXhVvHMy75tjg9OunxQLRYHTaVJ1KbYnU8B-vkA1zDATDHwv53duFpeLJOjNXHc2gXJkwVgMB--FFv2ycCf0Cd2nO1UatIcJBo",
    imageAlt: "Bamboo stalks in Arashiyama",
  },
];

export const MAP_IMAGE_URL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCctp2bHiGTdw0_sgCF1dbvQwmociXRNuUO25xY5tdUCFVF2AtNDnnvMuw_GKm9pry0eetrkdWU_qS3piH8P1dAKvzke46KRb8_F5m0G8uQNLfN0vRDAycP-esFIaFa6F-ZGlcJGR-sky58L7YzQXYn8p5c1cMj1E0tXnMAw0xpgnCwxgKdmum6Nu-P-GfMVbc35TbEdb-4eNJorhnH8z_SuMvB3mi2irUt92wBFDKw2XvSjO9eCfWy";
