/**
 * Dashboard (INTEGRATION.md §5, screen #3).
 *
 * Styling is ported from the Stitch "Curated Expeditions" page; the
 * *content* is the Dashboard the architecture actually specifies — your
 * recent trips, popular destinations, and a way to start a new trip.
 *
 * Everything here is live backend data:
 *   * recent trips        -> GET  /trips
 *   * popular cities      -> GET  /cities?sort=popularity
 *   * destination search  -> GET  /cities?q=
 *   * delete trip         -> DELETE /trips/{id}
 *
 * Trip creation lives in exactly ONE place: the header's "Plan My Trip"
 * CTA (Header.tsx), which every page shares. The hero here used to carry
 * its own second "Plan a trip" button plus three greyed-out Dates/Pace/
 * Guests fields with no backend field behind them — both were removed:
 * three disabled-looking controls read as broken, not "coming soon", and
 * a second button to the same place is just confusing (see feedback on
 * this exact screen). What's left is the one thing the hero actually
 * does — destination search, which really does filter the list below.
 *
 * Header/Footer are supplied by the `Layout` route wrapper (App.tsx), not
 * rendered here — this component is just the page content.
 */
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { ApiError } from "../api/client";
import { api } from "../api/endpoints";
import { useAuth } from "../auth/AuthProvider";
import { InertBlock } from "../components/Inert";
import { getTripCoverImage } from "../lib/cityImages";
import type { City, Trip } from "../types/models";

const NO_API = "Not part of the backend contract — no API behind this control.";

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [destination, setDestination] = useState("");

  const tripsQuery = useQuery({ queryKey: ["trips"], queryFn: api.trips.list });

  // Debouncing is overkill here: the catalog is small and React Query
  // dedupes/caches by key, so typing re-uses cached results per term.
  const citiesQuery = useQuery({
    queryKey: ["cities", { q: destination, sort: "popularity" }],
    queryFn: () => api.cities.search({ q: destination || undefined, sort: "popularity", limit: 8 }),
  });

  const deleteTrip = useMutation({
    mutationFn: (tripId: string) => api.trips.remove(tripId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["trips"] }),
  });

  const trips = tripsQuery.data ?? [];
  const cities = citiesQuery.data ?? [];
  const firstName = user?.name?.split(" ")[0] ?? "traveller";

  return (
    <div className="flex flex-col w-full bg-background">
      {/* ---------- hero + search ---------- */}
      <section className="w-full pt-16 pb-8 px-margin-mobile md:px-margin-tablet lg:px-margin-desktop bg-surface-container-low relative overflow-hidden">
        <div className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
          <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[60%] rounded-full bg-primary-fixed-dim blur-3xl mix-blend-multiply" />
        </div>

        <div className="max-w-[1440px] mx-auto relative z-10 flex flex-col gap-content-v-gap">
          <div className="flex flex-col gap-4">
            <h1 className="font-display-xl text-display-xl-mobile md:text-display-xl text-primary tracking-tight">
              Welcome back, {firstName}
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
              Pick up an expedition in progress, or begin somewhere new.
            </p>
          </div>

          <div className="w-full bg-surface-container-lowest shadow-xl rounded-xl p-6 flex flex-col relative mt-8 z-20">
            <div className="flex flex-col gap-2 max-w-md">
              <FieldLabel>Destination</FieldLabel>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                  search
                </span>
                <input
                  className="w-full bg-sand-accent text-on-surface font-body-md text-body-md py-3 pl-10 pr-4 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/50"
                  placeholder="Where to?"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- content ---------- */}
      <section className="max-w-[1440px] mx-auto w-full px-margin-mobile md:px-margin-tablet lg:px-margin-desktop py-16 flex flex-col lg:flex-row gap-gutter relative">
        {/* sidebar: popular destinations */}
        <aside className="w-full lg:w-1/4 flex flex-col gap-8 lg:sticky lg:top-28 h-fit">
          <div className="flex flex-col gap-6 bg-surface-container-low p-6 rounded-xl shadow-sm">
            <h3 className="font-headline-md text-headline-md text-primary">
              {destination ? "Matching" : "Popular"}
            </h3>

            {citiesQuery.isPending && <Muted>Loading destinations…</Muted>}
            {citiesQuery.isError && (
              <ErrorNote
                error={citiesQuery.error}
                onRetry={() => citiesQuery.refetch()}
                fallback="Could not load destinations."
              />
            )}
            {citiesQuery.isSuccess && cities.length === 0 && (
              <Muted>No destination matches “{destination}”.</Muted>
            )}

            <ul className="flex flex-col gap-3">
              {cities.map((city) => (
                <CityRow key={city.id} city={city} />
              ))}
            </ul>
          </div>
        </aside>

        {/* main: trips */}
        <div className="w-full lg:w-3/4 flex flex-col gap-12">
          <div className="flex justify-between items-end pb-4 border-b border-outline-variant/20">
            <span className="font-body-lg text-body-lg text-on-surface">
              {tripsQuery.isPending ? (
                "Loading your trips…"
              ) : (
                <>
                  Showing{" "}
                  <strong className="font-headline-md text-headline-md">{trips.length}</strong>{" "}
                  {trips.length === 1 ? "expedition" : "expeditions"}
                </>
              )}
            </span>
            <InertBlock reason={NO_API} className="flex items-center gap-2">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                Sort by: Recommended
              </span>
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                sort
              </span>
            </InertBlock>
          </div>

          {tripsQuery.isError && (
            <ErrorNote
              error={tripsQuery.error}
              onRetry={() => tripsQuery.refetch()}
              fallback="Could not load your trips."
            />
          )}

          {tripsQuery.isSuccess && trips.length === 0 && <EmptyState />}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {trips.map((trip, index) => (
              <TripCard
                key={trip.id}
                trip={trip}
                offset={index % 2 === 1}
                onDelete={() => deleteTrip.mutate(trip.id)}
                deleting={deleteTrip.isPending && deleteTrip.variables === trip.id}
              />
            ))}
          </div>

          {deleteTrip.isError && (
            <ErrorNote error={deleteTrip.error} fallback="Could not delete that trip." />
          )}
        </div>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Pieces
 * ---------------------------------------------------------------------- */

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
      {children}
    </span>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <p className="font-body-md text-body-md text-on-surface-variant">{children}</p>;
}

function CityRow({ city }: { city: City }) {
  return (
    <li className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <span className="material-symbols-outlined text-[16px] text-primary shrink-0">
          location_on
        </span>
        <span className="font-body-md text-body-md text-on-surface truncate">
          {city.name}
          <span className="text-on-surface-variant">, {city.country}</span>
        </span>
      </div>
      {typeof city.popularity === "number" && (
        <span className="font-label-sm text-label-sm text-on-secondary-fixed-variant bg-secondary-fixed px-2 py-1 rounded-full shrink-0">
          {city.popularity}
        </span>
      )}
    </li>
  );
}

function TripCard({
  trip,
  offset,
  onDelete,
  deleting,
}: {
  trip: Trip;
  offset: boolean;
  onDelete: () => void;
  deleting: boolean;
}) {
  const nights = useMemo(() => {
    // Dates are plain YYYY-MM-DD strings (INTEGRATION.md §3.2) — parsed as
    // UTC deliberately so the day count can't shift by timezone.
    const start = Date.parse(`${trip.date_start}T00:00:00Z`);
    const end = Date.parse(`${trip.date_end}T00:00:00Z`);
    return Math.round((end - start) / 86_400_000);
  }, [trip.date_start, trip.date_end]);

  return (
    <article className={`group relative flex flex-col gap-4 ${offset ? "md:-mt-12" : ""}`}>
      <Link
        to={`/trips/${trip.id}`}
        className="relative w-full aspect-[4/5] rounded-xl overflow-hidden shadow-md bg-surface-container-high block"
      >
        {(
          <img
            src={getTripCoverImage(trip)}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        )}

        <div className="absolute top-4 left-4 bg-glass-white backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
          <span className="material-symbols-outlined text-[14px] text-primary">event</span>
          <span className="font-label-sm text-label-sm text-primary uppercase">
            {nights} {nights === 1 ? "night" : "nights"}
          </span>
        </div>

        {trip.is_public && (
          <div className="absolute bottom-4 left-4 bg-glass-white backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <span className="material-symbols-outlined text-[14px] text-primary">public</span>
            <span className="font-label-sm text-label-sm text-primary uppercase">Shared</span>
          </div>
        )}
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

      <div className="flex flex-col gap-2 px-1">
        <div className="flex justify-between items-start gap-3">
          <h3 className="font-headline-md text-headline-md text-primary leading-tight">
            {trip.name}
          </h3>
          {trip.budget_target && (
            <span className="font-label-lg text-label-lg text-on-surface bg-sand-accent px-2 py-1 rounded whitespace-nowrap">
              {Number(trip.budget_target).toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </span>
          )}
        </div>

        {trip.description && (
          <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2">
            {trip.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mt-2 items-center">
          <span className="font-label-sm text-label-sm text-on-secondary-fixed-variant bg-secondary-fixed px-3 py-1 rounded-full">
            {trip.date_start}
          </span>
          <span className="font-label-sm text-label-sm text-on-secondary-fixed-variant bg-secondary-fixed px-3 py-1 rounded-full">
            {trip.date_end}
          </span>
          <Link
            to={`/trips/${trip.id}`}
            className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary flex items-center gap-1 ml-auto transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">open_in_new</span> Open
          </Link>
        </div>
      </div>
    </article>
  );
}

function EmptyState() {
  return (
    <div className="bg-surface-container rounded-xl p-12 flex flex-col items-center text-center gap-4">
      <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center">
        <span className="material-symbols-outlined text-primary">edit_calendar</span>
      </div>
      <h3 className="font-headline-md text-headline-md text-primary">No expeditions yet</h3>
      <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
        Your itineraries will appear here once you plan one.
      </p>
      <Link
        to="/trips/new"
        className="mt-2 px-6 py-3 bg-primary text-on-primary font-label-lg text-label-lg rounded-lg hover:bg-premium-navy transition-all uppercase inline-block"
      >
        Plan your first trip
      </Link>
    </div>
  );
}

function ErrorNote({
  error,
  onRetry,
  fallback,
}: {
  error: unknown;
  onRetry?: () => void;
  fallback: string;
}) {
  const message = error instanceof ApiError ? error.detail : fallback;
  return (
    <div
      role="alert"
      className="bg-error-container text-on-error-container px-4 py-3 rounded-lg flex items-center justify-between gap-4"
    >
      <span className="font-body-md text-body-md">{message}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="font-label-sm text-label-sm uppercase tracking-widest underline shrink-0"
        >
          Retry
        </button>
      )}
    </div>
  );
}
