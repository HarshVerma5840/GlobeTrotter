/**
 * My Trips / "Your Journeys" (INTEGRATION.md §5).
 *
 * Styling ported from the Stitch mock; content is live data from
 * GET /trips, bucketed into ongoing/upcoming/archived. "Ongoing" and
 * "archived" aren't backend fields — they're derived from
 * date_start/date_end vs today (lib/tripStatus.ts) since the backend has
 * no such column (CONTRACTS §2).
 *
 * Search/Sort/Filter/Group controls from the mock have no API behind them
 * and render inert (components/Inert.tsx) rather than pretend to work.
 */
import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { ApiError } from "../api/client";
import { api } from "../api/endpoints";
import { InertBlock } from "../components/Inert";
import {
  formatDateRange,
  formatIsoDate,
  tripDayProgress,
  tripDurationDays,
  tripStatus,
} from "../lib/tripStatus";
import type { Trip } from "../types/models";

const NO_API = "Not part of the backend contract — no API behind this control.";

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <span className="w-8 h-[1px] bg-outline-variant" />
      <h2 className="font-headline-md text-headline-md text-primary uppercase tracking-widest text-sm">
        {label}
      </h2>
      <span className="flex-grow h-[1px] bg-outline-variant" />
    </div>
  );
}

function TripCover({ trip }: { trip: Trip }) {
  if (trip.cover_image_url) {
    return (
      <img
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        src={trip.cover_image_url}
        alt=""
      />
    );
  }
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface-container-high to-secondary-fixed-dim">
      <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40">
        landscape
      </span>
    </div>
  );
}

function OngoingHero({ trip }: { trip: Trip }) {
  return (
    <div className="relative w-full h-[600px] rounded-2xl overflow-hidden group cursor-pointer shadow-xl">
      <div className="absolute inset-0">
        <TripCover trip={trip} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-premium-navy/80 via-premium-navy/20 to-transparent" />

      <div className="absolute top-8 left-8 right-8 flex justify-between items-start">
        <div className="bg-glass-white backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 text-primary font-label-sm uppercase tracking-widest">
          <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
          Currently Traveling
        </div>
        <div className="bg-glass-white backdrop-blur-md px-4 py-2 rounded-full text-primary font-label-sm uppercase tracking-widest">
          {tripDayProgress(trip)}
        </div>
      </div>

      <div className="absolute bottom-8 left-8 right-8 flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h3 className="font-display-xl-mobile md:font-display-xl text-display-xl-mobile md:text-display-xl text-on-primary mb-2 leading-tight">
            {trip.name}
          </h3>
          {trip.description && (
            <p className="font-body-lg text-body-lg text-inverse-on-surface opacity-90">
              {trip.description}
            </p>
          )}
        </div>
        <div className="text-right flex flex-col items-end">
          <p className="font-label-lg text-label-lg text-inverse-on-surface uppercase tracking-widest mb-4">
            {formatDateRange(trip)}
          </p>
          <Link
            to={`/trips/${trip.id}`}
            className="bg-surface-container-lowest text-on-surface font-label-lg px-8 py-3 rounded-lg hover:bg-primary hover:text-on-primary transition-all duration-300 flex items-center gap-2"
          >
            View Itinerary
            <span className="material-symbols-outlined text-[20px] transition-transform duration-300 group-hover:translate-x-1">
              arrow_forward
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function UpcomingCard({ trip, onDelete, deleting }: { trip: Trip; onDelete: () => void; deleting: boolean }) {
  return (
    <div className="group relative rounded-xl overflow-hidden bg-surface-container-lowest shadow-md hover:shadow-xl transition-all duration-500">
      <Link to={`/trips/${trip.id}`} className="block">
        <div className="h-64 overflow-hidden relative">
          <TripCover trip={trip} />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-charcoal/60 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
            <span className="font-label-sm text-label-sm text-on-primary uppercase tracking-widest bg-glass-white backdrop-blur-md px-3 py-1 rounded-full">
              {trip.name}
            </span>
            <span className="font-label-sm text-label-sm text-on-primary uppercase tracking-widest">
              {tripDurationDays(trip)} Days
            </span>
          </div>
        </div>
        <div className="p-6 bg-surface-container-lowest relative">
          <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-2">
            {formatDateRange(trip)}
          </p>
          {trip.description && (
            <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2">
              {trip.description}
            </p>
          )}
          <div className="mt-6 flex items-center gap-2 text-primary font-label-lg group-hover:translate-x-2 transition-transform duration-300">
            View Details{" "}
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </div>
        </div>
      </Link>
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        title="Delete this trip"
        className="absolute top-4 right-4 bg-surface-container-lowest/90 backdrop-blur-sm w-8 h-8 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-[18px] text-error">
          {deleting ? "hourglass_empty" : "delete"}
        </span>
      </button>
    </div>
  );
}

function PlanNextCTA() {
  return (
    <Link
      to="/trips/new"
      className="relative rounded-xl overflow-hidden bg-surface-container-low shadow-sm flex flex-col justify-center items-center p-8 border-2 border-dashed border-outline-variant/30 group hover:border-primary/50 transition-colors"
    >
      <span className="material-symbols-outlined text-display-xl-mobile text-outline-variant mb-4 group-hover:text-primary transition-colors">
        add_location_alt
      </span>
      <h3 className="font-headline-md text-headline-md text-primary mb-2 text-center">
        Plan Next Journey
      </h3>
      <p className="font-body-md text-body-md text-on-surface-variant text-center mb-6">
        Discover new destinations and curate your next story.
      </p>
      <span className="bg-primary text-on-primary font-label-lg px-6 py-3 rounded-lg group-hover:opacity-90 transition-opacity">
        Explore Destinations
      </span>
    </Link>
  );
}

function ArchiveCard({ trip }: { trip: Trip }) {
  return (
    <Link
      to={`/trips/${trip.id}`}
      className="group relative block overflow-hidden rounded-lg bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="aspect-[3/4] overflow-hidden relative grayscale group-hover:grayscale-0 transition-all duration-1000">
        <TripCover trip={trip} />
        <div className="absolute inset-0 bg-ink-charcoal/20 transition-opacity group-hover:opacity-0" />
      </div>
      <div className="p-4 bg-surface-container-lowest absolute bottom-0 w-full translate-y-4 group-hover:translate-y-0 transition-transform">
        <h3 className="font-headline-md text-headline-md text-primary mb-1">{trip.name}</h3>
        <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
          {formatIsoDate(trip.date_end)}
        </p>
      </div>
    </Link>
  );
}

function ErrorNote({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const message = error instanceof ApiError ? error.detail : "Could not load your trips.";
  return (
    <div
      role="alert"
      className="bg-error-container text-on-error-container px-4 py-3 rounded-lg flex items-center justify-between gap-4"
    >
      <span className="font-body-md text-body-md">{message}</span>
      <button
        type="button"
        onClick={onRetry}
        className="font-label-sm text-label-sm uppercase tracking-widest underline shrink-0"
      >
        Retry
      </button>
    </div>
  );
}

export default function MyTrips() {
  const queryClient = useQueryClient();
  const tripsQuery = useQuery({ queryKey: ["trips"], queryFn: api.trips.list });

  const deleteTrip = useMutation({
    mutationFn: (tripId: string) => api.trips.remove(tripId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["trips"] }),
  });

  const trips = tripsQuery.data ?? [];
  const { ongoing, upcoming, archived } = useMemo(() => {
    const ongoing: Trip[] = [];
    const upcoming: Trip[] = [];
    const archived: Trip[] = [];
    for (const trip of trips) {
      const status = tripStatus(trip);
      if (status === "ongoing") ongoing.push(trip);
      else if (status === "upcoming") upcoming.push(trip);
      else archived.push(trip);
    }
    upcoming.sort((a, b) => a.date_start.localeCompare(b.date_start));
    archived.sort((a, b) => b.date_end.localeCompare(a.date_end));
    return { ongoing, upcoming, archived };
  }, [trips]);

  return (
    <div className="flex flex-col w-full px-margin-mobile md:px-margin-tablet lg:px-margin-desktop max-w-[1440px] mx-auto pb-section-v-gap">
      <header className="pt-24 pb-16">
        <h1 className="font-display-xl-mobile md:font-display-xl text-display-xl-mobile md:text-display-xl text-primary mb-4">
          Your Journeys
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          A curated archive of your past explorations and an itinerary of those yet to
          unfold.
        </p>
      </header>

      <div className="flex flex-col md:flex-row justify-between items-center bg-surface-container-low rounded-xl p-4 shadow-sm mb-16 gap-4">
        <InertBlock reason={NO_API} className="relative w-full md:w-96">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            className="w-full bg-surface-container-lowest text-on-surface font-body-md py-3 pl-12 pr-4 rounded-lg shadow-sm"
            placeholder="Search your journeys..."
            type="text"
            disabled
          />
        </InertBlock>
        <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <InertBlock
            reason={NO_API}
            className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest text-on-surface font-label-lg rounded-lg shadow-sm whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[20px]">sort</span>
            Sort by: Date
          </InertBlock>
          <InertBlock
            reason={NO_API}
            className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest text-on-surface font-label-lg rounded-lg shadow-sm whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[20px]">filter_list</span>
            Filter
          </InertBlock>
          <InertBlock
            reason={NO_API}
            className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest text-on-surface font-label-lg rounded-lg shadow-sm whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[20px]">view_agenda</span>
            Group by: Status
          </InertBlock>
        </div>
      </div>

      {tripsQuery.isPending && (
        <p className="font-body-md text-body-md text-on-surface-variant">Loading your journeys…</p>
      )}
      {tripsQuery.isError && (
        <ErrorNote error={tripsQuery.error} onRetry={() => tripsQuery.refetch()} />
      )}
      {deleteTrip.isError && (
        <ErrorNote error={deleteTrip.error} onRetry={() => {}} />
      )}

      {tripsQuery.isSuccess && trips.length === 0 && (
        <div className="bg-surface-container rounded-xl p-16 flex flex-col items-center text-center gap-4">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40">
            edit_calendar
          </span>
          <h3 className="font-headline-md text-headline-md text-primary">No journeys yet</h3>
          <Link
            to="/trips/new"
            className="mt-2 px-6 py-3 bg-primary text-on-primary font-label-lg text-label-lg rounded-lg hover:bg-premium-navy transition-all uppercase"
          >
            Plan your first trip
          </Link>
        </div>
      )}

      {ongoing.length > 0 && (
        <section className="mb-section-v-gap">
          <SectionDivider label="Ongoing" />
          <div className="flex flex-col gap-8">
            {ongoing.map((trip) => (
              <OngoingHero key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      )}

      {(upcoming.length > 0 || (tripsQuery.isSuccess && trips.length > 0)) && (
        <section className="mb-section-v-gap">
          <SectionDivider label="Upcoming" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {upcoming.map((trip) => (
              <UpcomingCard
                key={trip.id}
                trip={trip}
                onDelete={() => deleteTrip.mutate(trip.id)}
                deleting={deleteTrip.isPending && deleteTrip.variables === trip.id}
              />
            ))}
            <PlanNextCTA />
          </div>
        </section>
      )}

      {archived.length > 0 && (
        <section>
          <SectionDivider label="Archived" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
            {archived.map((trip) => (
              <ArchiveCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
