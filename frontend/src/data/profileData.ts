/**
 * Static data for the Profile page.
 * Extracted from stitch_globetrotter_itinerary_planner (3).
 */

export interface UserProfile {
  name: string;
  bio: string;
  avatarUrl: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  preferences: string[];
  membership: {
    tier: string;
    since: string;
    progressPercent: number;
    nextTierLabel: string;
  };
  stats: { value: number; label: string }[];
}

export interface TripCard {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  imageAlt: string;
  dateBadge?: string;
  completedDate?: string;
  locationTag?: string;
}

// ── User data ───────────────────────────────────────────────

export const USER_PROFILE: UserProfile = {
  name: "Alex Rivera",
  bio: '"Curious traveler · Explorer · Story collector. Finding places with a story to tell."',
  avatarUrl:
    "https://lh3.googleusercontent.com/aida/AEtjO1WACrTLFvM5L9lCYoHTUDei5xnh4_kdlnLLLZB4cyLb0aave1hj_c1gsd3HdHgM1ZtiUgX35PZw2NNHFjCuKaHHBj7CI5C9ryjxQEpz5KWLsZ0qo257v90IOttSLb_V-3cDIxd88gi6zuajtNQnmlLHjbsyz2EQVBBKkbo0AJXV01X_P9FAebIOYpAd50sAA1aKvJjyqAoN05JwmT-8oHE8H6Pw1axYHNMKiSAWGeMUgnPzuxqCiYWaZoE",
  fullName: "Alex Rivera",
  email: "alex.rivera@example.com",
  phone: "+1 (555) 019-2834",
  location: "San Francisco, USA",
  preferences: ["Culture", "Food & Wine", "Architecture", "Nature", "Photography"],
  membership: {
    tier: "Gold Member",
    since: "Since 2021",
    progressPercent: 75,
    nextTierLabel: "3 Trips to Platinum",
  },
  stats: [
    { value: 12, label: "Trips" },
    { value: 18, label: "Destinations" },
    { value: 7, label: "Countries" },
  ],
};

// ── Preplanned trips ────────────────────────────────────────

export const PREPLANNED_TRIPS: TripCard[] = [
  {
    id: "autumn-kansai",
    title: "Autumn in Kansai",
    subtitle: "Kyoto, Nara, Osaka",
    dateBadge: "Oct 12 - 20",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCkPM0r0gIJulGCh77PGdpNiNuOF61SSIm1T5yPrhBv93UIsq-25su_zT467JOtewNVroebi9GPmhIb3oApawMezLCbXHpIOk0HcePMmeH9WT1XPsZgEmUa2SBvNIu920xXDjdZDOl-Lg2h25Fpie9QU246mStTwAAKZuEfZ6tO-FLD_aCXfN5avGP2K2Z5kBUSLro3vttHGRG6-x2V_Xm3XSar-XxsTbTU0qEsUQyazBgEwykJrmuG",
    imageAlt: "Traditional Kyoto street with wooden machiya houses",
  },
  {
    id: "metropolis-contrast",
    title: "Metropolis Contrast",
    subtitle: "Tokyo, Hakone",
    dateBadge: "Nov 05 - 14",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAosz5pn_H7IVH-pJaf-LplmedAJCuhTNU51bbhpRKCmFBqyuxBQbtf2xrrRDHOI-kTm6-AWmC9QdMtqZsi5_3OzEqyUOSbcsAujh2B2P-ZfI9z_eS1RwS_xVwZ2TV5JLoPjd5jIEfdDxrkq5RFoJQlkebpE_xL6iDmcBh1LS1yyjyNOfIHctIlswL0a2G3vfONeuwGIp5ZdLhPEZf7tfVuPsmk6nMBtOXvflpfEpF-INHui1-7kGVT",
    imageAlt: "Neon lights of Shinjuku Tokyo at night",
  },
  {
    id: "coastal-elegance",
    title: "Coastal Elegance",
    subtitle: "Amalfi, Positano, Capri",
    dateBadge: "May 10 - 18",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDzv8BUODBUDGJrc-xeqhLj_QE-27lO6VhBByQI6MbR4CB3ys_TG3rVGpPLYf2qnPnYDkkW4gfVaNXk555la9q3UhR_vd-xsUyUx5PNsAyAW8kmMz1YVCoqw-ECyYaE-97x7hIMtmHhAd9ZEj8ZJe1ZfCYwpNnvXZqovkPR33WulppIP73XDADgE6G1KLehH7isfzOU4WQXYyIdWkGkA0OKa1ycGifmvxNPQ2YN_LBmTJv_6OK9jpQt",
    imageAlt: "Colorful houses on the cliffs of the Amalfi Coast",
  },
];

// ── Previous (archived) trips ───────────────────────────────

export const PREVIOUS_TRIPS: TripCard[] = [
  {
    id: "parisian-spring",
    title: "Parisian Spring",
    subtitle: "Completed Apr 2023",
    locationTag: "Paris",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAdr8QpQxW7VRxVfRpaHM1WCs3N4hubO7kYH057L9VLf2I9S3G9_BKFa4s2VFMn3VTv6GjsuF8RfGEdh_gBKtrYciJ49PijpWpN_6yTAiydZc6mlkWZfLcD1t855tsTBdJfiEQm5NiPYtC4y5L_TmggLXcJafDdW5aoolUFgfN56tXEu12tVknSjJaU8Fk-oKFmSKxjaWFzVJFf2o3_AkSl_lBnt57rE27k-mVNqi4BqSDvSHlNFnvx",
    imageAlt: "Parisian street scene with Haussmann architecture",
  },
  {
    id: "nordic-elements",
    title: "Nordic Elements",
    subtitle: "Completed Sep 2022",
    locationTag: "Iceland",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAbBjkxkeEutmKpCOVlhmg5xEdz4mCAUFH8xDQVK8qYLm1dXCrc-G2U4l1PMYfSNNbmjJzLbrGkK5DBEThc_m3heOk7PVbP-7btkoHBNJqCb5areCcgPTlBQH4WPqeCQCtv8jl4gkCZHA3bwEpMW3wL6nBDsNJpX7szRika65ax6H7Mz_FjmlwbzeQLDAdSMo1Z4_I6dSQZfmwVlUPdQ_Dmb1cBfDuwWFXHr3qmKLLL21ools6FnXEg",
    imageAlt: "Icelandic black sand beach with sea stacks",
  },
  {
    id: "night-markets",
    title: "Night Markets",
    subtitle: "Completed Jan 2022",
    locationTag: "Taipei",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBaDx_Yt27jR3eLk_LsN9XIrXGlBC3lCnCylp7nw4JPgmMIjscqYYtS3PheGQ1YH9UYg1uJ-Bus1x5IV_uyXYPWxO9Hl561uFsbuQAe1SYwSE-ZXUt8yIaZvnW_z8nMnKItCq4-NOYF9QtlnKnNVSwy47pxJ5YaOyfATT3yXIbYVUBNK9eMdpvjjynAD7RJbYye-Tm5HzLRxfGV6TnucYc3Xu9pmHKTmjRWtY15AxopOnaAaDIF7r4A",
    imageAlt: "Taipei night market with lanterns and neon signs",
  },
];
