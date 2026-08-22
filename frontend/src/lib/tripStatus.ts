/**
 * Trip status bucketing — the one place "ongoing / upcoming / archived"
 * gets computed, since it isn't a backend field. `Trip.date_start` /
 * `date_end` are plain "YYYY-MM-DD" strings (INTEGRATION.md §3.2); parsed
 * as UTC deliberately so a bucket can't shift by the viewer's timezone.
 */
import type { Trip } from "../types/models";

export type TripStatus = "ongoing" | "upcoming" | "archived";

function toUtcDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`);
}

function todayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function tripStatus(trip: Trip): TripStatus {
  const today = todayUtc();
  const start = toUtcDate(trip.date_start);
  const end = toUtcDate(trip.date_end);
  if (today < start) return "upcoming";
  if (today > end) return "archived";
  return "ongoing";
}

/** Inclusive day count, e.g. Oct 1 - Oct 1 is 1 day, Oct 1 - Oct 8 is 8. */
export function tripDurationDays(trip: Trip): number {
  const start = toUtcDate(trip.date_start);
  const end = toUtcDate(trip.date_end);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

/** "Day 4 of 8" for a trip currently in progress. Undefined if not ongoing. */
export function tripDayProgress(trip: Trip): string | undefined {
  if (tripStatus(trip) !== "ongoing") return undefined;
  const today = todayUtc();
  const start = toUtcDate(trip.date_start);
  const dayNumber = Math.round((today.getTime() - start.getTime()) / 86_400_000) + 1;
  return `Day ${dayNumber} of ${tripDurationDays(trip)}`;
}

const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** "12 Oct 2026" from a "YYYY-MM-DD" string. */
export function formatIsoDate(isoDate: string): string {
  return DATE_FMT.format(toUtcDate(isoDate));
}

export function formatDateRange(trip: Trip): string {
  return `${formatIsoDate(trip.date_start)} — ${formatIsoDate(trip.date_end)}`;
}

const SHORT_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  weekday: "short",
  timeZone: "UTC",
});

/** "Mon, Oct 12" for the itinerary timeline. */
export function formatShortDate(isoDate: string): string {
  return SHORT_FMT.format(toUtcDate(isoDate));
}

/** Every calendar date (as "YYYY-MM-DD") in [start, end], inclusive. */
export function dateRangeList(startIso: string, endIso: string): string[] {
  const start = toUtcDate(startIso);
  const end = toUtcDate(endIso);
  const days: string[] = [];
  for (let d = start; d <= end; d = new Date(d.getTime() + 86_400_000)) {
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}
