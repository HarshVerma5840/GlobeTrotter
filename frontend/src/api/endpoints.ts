/**
 * One function per backend route — the complete, typed API surface.
 *
 * This file is generated-by-hand from `contract/openapi.json` and mirrors
 * it exactly: same paths, same params, same response types. It exists so
 * that wiring a Stitch-derived screen is a matter of picking the right
 * function, not of reading the backend source or guessing a URL.
 *
 * Rules (INTEGRATION.md §3):
 *   * No component calls `fetch` or `request()` directly — it calls one of
 *     these.
 *   * No path string appears anywhere else in the frontend.
 *   * If a screen needs something this file cannot express, the backend
 *     contract changes first — never a one-off fetch in a component.
 */
import { query, request, storeToken } from "./client";
import type {
  Activity,
  AdminAnalytics,
  ActivityCategory,
  AutoPlanRequest,
  AutoPlanResponse,
  Budget,
  City,
  Collaborator,
  Comment,
  ItineraryActivity,
  ItineraryActivityCreate,
  ItineraryActivityUpdate,
  PublicTrip,
  Stop,
  StopCreate,
  StopReorderItem,
  StopUpdate,
  Token,
  Trip,
  TripCreate,
  TripDetail,
  TripUpdate,
  User,
  UserUpdate,
  Vote,
  VoteValue,
} from "../types/models";

// --- auth (CONTRACTS §3) --------------------------------------------------

export const auth = {
  /** Creates the account AND returns a token — no separate login needed. */
  signup: (body: { email: string; password: string; name: string }) =>
    request<Token>("/auth/signup", { method: "POST", json: body, anonymous: true }).then(storeToken),

  /**
   * OAuth2 password flow: form-encoded, and the email goes in `username`.
   * That is FastAPI's standard contract, not a typo.
   */
  login: (email: string, password: string) =>
    request<Token>("/auth/login", {
      method: "POST",
      form: { username: email, password },
      anonymous: true,
    }).then(storeToken),
};

// --- current user (CONTRACTS §3) -----------------------------------------

export const users = {
  me: () => request<User>("/users/me"),
  updateMe: (body: UserUpdate) => request<User>("/users/me", { method: "PATCH", json: body }),
};

// --- trips (CONTRACTS §4) -------------------------------------------------

export const trips = {
  list: () => request<Trip[]>("/trips"),
  create: (body: TripCreate) => request<Trip>("/trips", { method: "POST", json: body }),
  /** Returns the trip WITH its ordered stops and computed feasibility fields. */
  get: (tripId: string) => request<TripDetail>(`/trips/${tripId}`),
  update: (tripId: string, body: TripUpdate) =>
    request<Trip>(`/trips/${tripId}`, { method: "PATCH", json: body }),
  remove: (tripId: string) => request<void>(`/trips/${tripId}`, { method: "DELETE" }),

  /**
   * Publish/unpublish. The server mints `share_token` on first publish and
   * never regenerates it, so a link already shared keeps working.
   */
  setPublic: (tripId: string, isPublic: boolean) =>
    request<Trip>(`/trips/${tripId}`, { method: "PATCH", json: { is_public: isPublic } }),

  budget: (tripId: string) => request<Budget>(`/trips/${tripId}/budget`),

  /** Smart Trip Assistant — always resolves to a usable plan (CONTRACTS §7.1). */
  autoPlan: (tripId: string, body: AutoPlanRequest) =>
    request<AutoPlanResponse>(`/trips/${tripId}/auto-plan`, { method: "POST", json: body }),
};

// --- stops (CONTRACTS §4) -------------------------------------------------

export const stops = {
  listForTrip: (tripId: string) => request<Stop[]>(`/trips/${tripId}/stops`),
  create: (tripId: string, body: StopCreate) =>
    request<Stop>(`/trips/${tripId}/stops`, { method: "POST", json: body }),
  update: (stopId: string, body: StopUpdate) =>
    request<Stop>(`/stops/${stopId}`, { method: "PATCH", json: body }),
  remove: (stopId: string) => request<void>(`/stops/${stopId}`, { method: "DELETE" }),

  /**
   * Apply a whole new ordering in ONE request. A drag-reorder sends the
   * full list once — never one call per row (CONTRACTS §4).
   */
  reorder: (items: StopReorderItem[]) =>
    request<Stop[]>("/stops/reorder", { method: "PATCH", json: items }),

  listActivities: (stopId: string) => request<ItineraryActivity[]>(`/stops/${stopId}/activities`),
  addActivity: (stopId: string, body: ItineraryActivityCreate) =>
    request<ItineraryActivity>(`/stops/${stopId}/activities`, { method: "POST", json: body }),
};

// --- itinerary activities (CONTRACTS §4) ---------------------------------

export const itineraryActivities = {
  update: (id: string, body: ItineraryActivityUpdate) =>
    request<ItineraryActivity>(`/itinerary-activities/${id}`, { method: "PATCH", json: body }),
  remove: (id: string) => request<void>(`/itinerary-activities/${id}`, { method: "DELETE" }),
};

// --- catalog search (CONTRACTS §4) ---------------------------------------

export interface CitySearchParams {
  q?: string;
  country?: string;
  cost_max?: number;
  sort?: "popularity" | "cost" | "name";
  limit?: number;
  offset?: number;
}

export const cities = {
  search: (params: CitySearchParams = {}) => request<City[]>(`/cities${query({ ...params })}`),
  get: (cityId: string) => request<City>(`/cities/${cityId}`),
};

export interface ActivitySearchParams {
  city_id?: string;
  category?: ActivityCategory;
  cost_max?: number;
  q?: string;
  limit?: number;
  offset?: number;
}

export const activities = {
  search: (params: ActivitySearchParams = {}) =>
    request<Activity[]>(`/activities${query({ ...params })}`),
  get: (activityId: string) => request<Activity>(`/activities/${activityId}`),
};

// --- public sharing (CONTRACTS §6) ---------------------------------------

export const publicTrips = {
  /** No auth — this is what an unauthenticated visitor loads. */
  get: (token: string) => request<PublicTrip>(`/public/trips/${token}`, { anonymous: true }),
  /** Requires login; send anonymous visitors to /login?redirect=... first. */
  copy: (token: string) => request<Trip>(`/public/trips/${token}/copy`, { method: "POST" }),
};

// --- collaboration (CONTRACTS §7.3) --------------------------------------

export const collaborators = {
  list: (tripId: string) => request<Collaborator[]>(`/trips/${tripId}/collaborators`),
  /** Owner only — a collaborator gets 403 here. Invite by email. */
  add: (tripId: string, email: string) =>
    request<Collaborator[]>(`/trips/${tripId}/collaborators`, {
      method: "POST",
      json: { email },
    }),
  /** Owner only. */
  remove: (tripId: string, userId: string) =>
    request<void>(`/trips/${tripId}/collaborators/${userId}`, { method: "DELETE" }),
};

export const votes = {
  get: (itineraryActivityId: string) =>
    request<Vote>(`/itinerary-activities/${itineraryActivityId}/vote`),
  /** Upserts — voting again changes your vote, it never adds a second. */
  cast: (itineraryActivityId: string, value: VoteValue) =>
    request<Vote>(`/itinerary-activities/${itineraryActivityId}/vote`, {
      method: "POST",
      json: { value },
    }),
  /** Withdraw your vote; absent is the neutral state. */
  clear: (itineraryActivityId: string) =>
    request<Vote>(`/itinerary-activities/${itineraryActivityId}/vote`, { method: "DELETE" }),
};

export const comments = {
  list: (tripId: string) => request<Comment[]>(`/trips/${tripId}/comments`),
  add: (tripId: string, body: string) =>
    request<Comment>(`/trips/${tripId}/comments`, { method: "POST", json: { body } }),
};

// --- admin (role=admin only) ----------------------------------------------

export const admin = {
  analytics: () => request<AdminAnalytics>("/admin/analytics"),
};

// --- health ---------------------------------------------------------------

export const health = () => request<{ status: string }>("/health", { anonymous: true });

/** Everything, for `import { api } from "../api/endpoints"`. */
export const api = {
  admin,
  auth,
  collaborators,
  comments,
  votes,
  users,
  trips,
  stops,
  itineraryActivities,
  cities,
  activities,
  publicTrips,
  health,
};
