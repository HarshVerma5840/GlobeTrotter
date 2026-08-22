/**
 * Profile page (INTEGRATION.md §5).
 *
 * Real data throughout:
 *   - identity          -> GET /users/me (name, email, language, saved_cities)
 *   - stats             -> GET /trips + GET /trips/{id} per trip (stop cities)
 *   - preplanned/archive -> GET /trips, bucketed by lib/tripStatus.ts
 *
 * Two things the Stitch mock invented that the backend has no model for —
 * phone/location and the loyalty-tier membership card — are either
 * replaced with real fields or marked visibly inert rather than faked
 * (INTEGRATION.md rule 4; see AboutTraveler.tsx and MembershipCard.tsx).
 */
import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";

import { api } from "../api/endpoints";
import AboutTraveler from "../components/profile/AboutTraveler";
import MembershipCard from "../components/profile/MembershipCard";
import ProfileHero from "../components/profile/ProfileHero";
import TravelStats from "../components/profile/TravelStats";
import TripGrid, { type ProfileTripCard } from "../components/profile/TripGrid";
import { formatDateRange, tripStatus } from "../lib/tripStatus";
import type { Trip, TripDetail } from "../types/models";

const MEMBER_SINCE_FMT = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

export default function Profile() {
  const userQuery = useQuery({ queryKey: ["users", "me"], queryFn: api.users.me });
  const tripsQuery = useQuery({ queryKey: ["trips"], queryFn: api.trips.list });
  const trips = tripsQuery.data ?? [];

  // One detail fetch per trip, to read each trip's stop cities for the
  // "destinations"/"countries" stats and the archive grid's location tag.
  // Bounded by the user's own trip count, so this stays cheap in practice.
  const detailQueries = useQueries({
    queries: trips.map((trip) => ({
      queryKey: ["trips", trip.id],
      queryFn: () => api.trips.get(trip.id),
      enabled: tripsQuery.isSuccess,
    })),
  });
  const details: TripDetail[] = detailQueries
    .map((q) => q.data)
    .filter((d): d is TripDetail => Boolean(d));
  const detailsLoaded = trips.length > 0 && details.length === trips.length;

  const stats = useMemo(() => {
    const cityIds = new Set<string>();
    const countries = new Set<string>();
    for (const detail of details) {
      for (const stop of detail.stops) {
        if (stop.city) {
          cityIds.add(stop.city.id);
          countries.add(stop.city.country);
        }
      }
    }
    return [
      { value: trips.length, label: "Trips" },
      { value: cityIds.size, label: "Destinations" },
      { value: countries.size, label: "Countries" },
    ];
  }, [trips.length, details]);

  const { upcoming, archived } = useMemo(() => {
    const upcoming: Trip[] = [];
    const archived: Trip[] = [];
    for (const trip of trips) {
      const status = tripStatus(trip);
      if (status === "upcoming") upcoming.push(trip);
      else if (status === "archived") archived.push(trip);
    }
    upcoming.sort((a, b) => a.date_start.localeCompare(b.date_start));
    archived.sort((a, b) => b.date_end.localeCompare(a.date_end));
    return { upcoming, archived };
  }, [trips]);

  function cityLabel(tripId: string): string | undefined {
    const detail = details.find((d) => d.id === tripId);
    if (!detail) return undefined;
    const names = detail.stops.map((s) => s.city?.name).filter(Boolean);
    return names.length ? names.join(", ") : undefined;
  }

  function firstCountry(tripId: string): string | undefined {
    const detail = details.find((d) => d.id === tripId);
    return detail?.stops.find((s) => s.city)?.city?.country;
  }

  const preplannedCards: ProfileTripCard[] = upcoming.slice(0, 3).map((trip) => ({
    id: trip.id,
    title: trip.name,
    subtitle: cityLabel(trip.id) ?? trip.description ?? "No stops added yet",
    imageUrl: trip.cover_image_url ?? null,
    dateBadge: formatDateRange(trip),
  }));

  const archiveCards: ProfileTripCard[] = archived.slice(0, 3).map((trip) => ({
    id: trip.id,
    title: trip.name,
    subtitle: `Completed ${formatDateRange(trip)}`,
    imageUrl: trip.cover_image_url ?? null,
    locationTag: firstCountry(trip.id),
  }));

  if (userQuery.isPending || tripsQuery.isPending) {
    return (
      <div className="max-w-[1440px] w-full mx-auto px-margin-mobile py-section-v-gap">
        <p className="font-body-md text-body-md text-on-surface-variant">Loading profile…</p>
      </div>
    );
  }

  if (userQuery.isError || !userQuery.data) {
    return (
      <div className="max-w-[1440px] w-full mx-auto px-margin-mobile py-section-v-gap">
        <p className="font-body-md text-body-md text-on-error-container bg-error-container px-4 py-3 rounded-lg inline-block">
          Could not load your profile.
        </p>
      </div>
    );
  }

  const memberSince = `Member since ${MEMBER_SINCE_FMT.format(new Date(userQuery.data.created_at))}`;

  return (
    <div className="max-w-[1440px] w-full mx-auto px-margin-mobile md:px-margin-desktop py-section-v-gap flex flex-col gap-24">
      <ProfileHero user={userQuery.data} memberSince={memberSince} />

      <TravelStats stats={detailsLoaded ? stats : stats.map((s) => ({ ...s, value: s.label === "Trips" ? s.value : 0 }))} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        <AboutTraveler user={userQuery.data} memberSince={memberSince} />
        <MembershipCard />
      </div>

      <TripGrid
        title="Preplanned Trips"
        linkLabel="View All"
        linkHref="/trips"
        trips={preplannedCards}
        variant="preplanned"
        emptyLabel="No upcoming trips yet — plan one to see it here."
      />

      <TripGrid
        title="Previous Trips"
        linkLabel="View Archive"
        linkHref="/trips"
        trips={archiveCards}
        variant="archive"
        emptyLabel="No completed trips yet."
      />
    </div>
  );
}
