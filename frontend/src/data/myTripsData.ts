/**
 * Static data for the My Trips (Your Journeys) page.
 * Extracted from stitch_globetrotter_itinerary_planner (4).
 */

export interface OngoingTrip {
  title: string;
  destinations: string;
  dateRange: string;
  dayProgress: string;
  imageUrl: string;
}

export interface UpcomingTrip {
  id: string;
  title: string;
  description: string;
  dateRange: string;
  locationTag: string;
  durationLabel: string;
  imageUrl: string;
  imageAlt: string;
}

export interface ArchivedTrip {
  id: string;
  title: string;
  date: string;
  imageUrl: string;
  imageAlt: string;
}

// ── Ongoing ─────────────────────────────────────────────────

export const ONGOING_TRIP: OngoingTrip = {
  title: "Japan Autumn Escape",
  destinations: "Tokyo • Kyoto • Hakone",
  dateRange: "15 Oct — 20 Oct 2026",
  dayProgress: "Day 4 of 8",
  imageUrl:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBoAGjtLXOH9EGqoWBMNSTHXUJ6hnevt-NauBre7B9JVElHFI7zPZ8UTox1WCo-nVtXv7gBoFPlaU6ZrWewe-ZEc56Qhgi6TrRk-MVgyL1qQDdpI4_9vU85xEMzRj5AFOohqkAWppy6Lar3raCAuBgjZ2JelmAfJPfcmDS1jdKjC2r3AN-akkCMqOTD3rGaPhT2AV7VKAOpBx9lc58ZIzJQfg_GpdiFowVQds0IsVlruA-jVV5g_T0-",
};

// ── Upcoming ────────────────────────────────────────────────

export const UPCOMING_TRIPS: UpcomingTrip[] = [
  {
    id: "temples-traditions",
    title: "Temples & Traditions",
    description:
      "A deep dive into the spiritual heart of Japan, exploring ancient shrines and serene gardens.",
    dateRange: "22 Nov — 30 Nov 2026",
    locationTag: "Kyoto, JP",
    durationLabel: "8 Days",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBWi9v8I115GWNQIKE3Gyszam4DPRysXJuiRzgpgU3WikfWzNpX1SEAHjm6IdYDSXnhIHWsfcm4AjU8d3ELzkX9xYm-QVcgKkJ8IU6jFLPiUjojghoNe-oW9GlE57wQp1OLcCIYaJTY5p09_dcSN4lyZKqgSrBhOzvXFObXUoCZhjcT3P_0Zc4jLVoPoyHQ4x7NS4DUzEupuFlheMgw9B9T0iKKcrSKhCQ1pjgNP9MTtdSHzG8L2EV_",
    imageAlt: "Japanese rock garden in Kyoto",
  },
  {
    id: "alpine-retreat",
    title: "Alpine Retreat",
    description:
      "Winter sports and cozy chalets beneath the shadow of the Matterhorn.",
    dateRange: "12 Jan — 17 Jan 2027",
    locationTag: "Zermatt, CH",
    durationLabel: "5 Days",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAa2g_ucXCYVrwckheOfr4cHd_WfNXUi9exu5abuofeCi1xCG2amJT3MdK3gaGlLqnpKGu72b6GzKTYy_7X3H-ilqTqQMbLbLqq3pxkc3CjnrmXMk08NY2QtWKWTacKirb9ZNm2Ii2yKx0ttXSuNRApSBb_mnZPaNcGstAa_eftTrV1UkedP_WpCswUjhN-yBYh32vAMu-E7AAd5Bajx8Qho7_1fAOK1kS3QXzO98FcvjKp43-6j0zi",
    imageAlt: "Snow capped peaks in the Swiss Alps",
  },
];

// ── Archived ────────────────────────────────────────────────

export const ARCHIVED_TRIPS: ArchivedTrip[] = [
  {
    id: "parisian-spring",
    title: "Parisian Spring",
    date: "May 2025",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDHDypeJa6hcqo0gHvrOqeRrhnlpoa2-Lz23xyvjDc1roFcnUhmcFEBaxWluyIZ3Modis_8WjKcWf_YWAM67k1hVC5aNaTt-lZetiOXi7Qz5_FrWaq_o5dj_3p_T5K5M4-II8bU0mxBF8JfFv-eLsZH9XuXfHf2TgpVwMx-reY2r_g9fRs2YU2dHwCqwufsVUQp4yBZEygG9Ro-RCs1RF6X4Umywt5KJn6Fj49UHto5Puu6kG-tfZ8q",
    imageAlt: "Classic Parisian cafe exterior",
  },
  {
    id: "amalfi-summer",
    title: "Amalfi Summer",
    date: "Aug 2024",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA-fhqOJjhvpl-ICk233gfD_i3MNtf0pqCiEfKDrOm3wgfi0ki5yKags8wkWFff_vvDiYMp6dqMcoZtNQkfHsOWkQQYDYE5kxBI4EL27vjy-NnllFXuqrEZDqltogJd9dHv5RaiCAvY7PFe8Xj-LA879f0Kp-_fQ7ZpXucE5HiDBQRyLSz6BSGnUGj3i9US3xX9M61lNbh_yLEXGBzSe6C7Z8MOBmCRgsGWzi66HSq7-jUOZ3Es-3IM",
    imageAlt: "Amalfi coast clifftop view",
  },
  {
    id: "nordic-solitude",
    title: "Nordic Solitude",
    date: "Nov 2023",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBKX2Upc_txrPLxn4sMpfHMgRGhvGyZxcYZ3e3nhQrK7_wCyMUAcu2BrBVhfgZuyTOT65bDfMYii8JhKdIZBUYZULXDdSwjhf68L4dAygoAszkmyzgr42R9muQte_KwuOKaMd6jx9uDUaN-AEntw338BBQg6V1b9o3h9IIgajXuQhLz9nsca0ticdS8xvbORj6NGe6iqg4cQtquNHbTZ1lYz27ZDIfpuf8_CNwzOX-oSIBD3lAs0HKA",
    imageAlt: "Moody Icelandic landscape with waterfall",
  },
  {
    id: "sahara-sands",
    title: "Sahara Sands",
    date: "Feb 2023",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDvY_2s3J9mIwtsr-dpbfdG75DWOjetxC-lSseiQxufyrBhdiH5UKpNge8NiDpeFH5LHKgAbOXXOiHufyHcQn1lUZeqikM64y9xXY85voe5awb7RasQ3u_SB--tnWCUpe-FAtp5gcVkqMibtKZW8Q6uTTAbEGRz3jJu9ffS38wQve8rAts9aZsnMU9ut1UpBubE4hYiAlnSC0BqzpuMpjjSeqwlXTW9BSXceG9vYz1vAAn6zr3ykIUC",
    imageAlt: "Moroccan desert dunes at sunset",
  },
];
