/**
 * Friendly aliases over the auto-generated OpenAPI types.
 *
 * `api.d.ts` is generated from `contract/openapi.json` and must never be
 * hand-edited. Reaching into `components["schemas"]["TripRead"]` all over
 * the app is unreadable, so every type the UI needs is re-exported here
 * under its plain name.
 *
 * These names ARE the integration contract. A Stitch-derived screen that
 * needs trip data imports `Trip` from here — it never re-declares its own
 * shape, and it never invents a field. If a screen needs a field that
 * isn't on one of these types, the fix is a backend change plus a contract
 * regeneration (`npm run gen:types`), never a local interface.
 *
 * Regenerate after any backend route/schema change:
 *   npm run gen:types
 */
import type { components } from "./api";

type S = components["schemas"];

// --- auth / user ---
export type User = S["UserRead"];
export type UserCreate = S["UserCreate"];
export type UserUpdate = S["UserUpdate"];
export type UserRole = S["UserRole"];
export type Token = S["Token"];

// --- trips ---
export type Trip = S["TripRead"];
export type TripDetail = S["TripDetailRead"];
export type TripCreate = S["TripCreate"];
export type TripUpdate = S["TripUpdate"];

// --- stops ---
export type Stop = S["StopRead"];
export type StopCreate = S["StopCreate"];
export type StopUpdate = S["StopUpdate"];
export type StopReorderItem = S["StopReorderItem"];

// --- catalog ---
export type City = S["CityRead"];
export type CityBrief = S["CityBrief"];
export type Activity = S["ActivityRead"];
export type ActivityCategory = S["ActivityCategory"];

// --- itinerary ---
export type ItineraryActivity = S["ItineraryActivityRead"];
export type ItineraryActivityCreate = S["ItineraryActivityCreate"];
export type ItineraryActivityUpdate = S["ItineraryActivityUpdate"];

// --- collaboration (B12, CONTRACTS §7.3) ---
export type Collaborator = S["CollaboratorRead"];
export type CollaboratorAdd = S["CollaboratorAdd"];
export type Vote = S["VoteRead"];
export type VoteValue = S["VoteWrite"]["value"];
export type Comment = S["CommentRead"];
export type CommentCreate = S["CommentCreate"];

// --- admin analytics (B13) ---
export type AdminAnalytics = S["AdminAnalytics"];
export type PopularCity = S["PopularCity"];

// --- budget / assistant / sharing ---
export type Budget = S["BudgetRead"];
export type AutoPlanRequest = S["AutoPlanRequest"];
export type AutoPlanResponse = S["AutoPlanResponse"];
export type PublicTrip = S["PublicTripRead"];

/**
 * The six budget-breakdown categories, in the order charts should render
 * them. CONTRACTS §2/§8: this is the only valid set anywhere in the
 * system, so a Stitch mock showing "Hotels" or "Flights" must be remapped
 * onto these, never added alongside them.
 */
export const ACTIVITY_CATEGORIES = [
  "sightseeing",
  "food",
  "adventure",
  "transport",
  "stay",
  "other",
] as const satisfies readonly ActivityCategory[];

/** Pace options for the Smart Trip Assistant (CONTRACTS §7.1). */
export const PACES = ["relaxed", "balanced", "packed"] as const;
export type Pace = (typeof PACES)[number];

/**
 * Money arrives as a JSON number but represents a Numeric(10,2). Format
 * for display only — never do arithmetic on a displayed string, and never
 * send a rounded value back (CONTRACTS §8 keeps money exact server-side).
 */
export function formatMoney(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return Number(value).toFixed(2);
}
