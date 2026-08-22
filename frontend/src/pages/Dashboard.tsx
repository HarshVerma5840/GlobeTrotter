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
 *   * create trip         -> POST /trips
 *   * delete trip         -> DELETE /trips/{id}
 *
 * Controls from the mock with no API behind them (Dates, Pace, Guests,
 * favourites) render inert on purpose — see components/Inert.tsx.
 *
 * Header/Footer are supplied by the `Layout` route wrapper (App.tsx), not
 * rendered here — this component is just the page content.
 */
import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiError } from "../api/client";
import { api } from "../api/endpoints";
import { useAuth } from "../auth/AuthProvider";
import { InertBlock, InertButton } from "../components/Inert";
import type { City, Trip } from "../types/models";

const NO_API = "Not part of the backend contract — no API behind this control.";

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [destination, setDestination] = useState("");
  const [showPlanner, setShowPlanner] = useState(false);

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
    <>
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

            <div className="w-full bg-surface-container-lowest shadow-xl rounded-xl p-6 flex flex-col md:flex-row items-end gap-6 relative mt-8 z-20">
              <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex flex-col gap-2">
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

                {/* No date/pace/guest fields exist on Trip (CONTRACTS §2). */}
                <InertField label="Dates" value="Select dates" icon="calendar_month" />
                <InertField label="Pace" value="Leisurely" chevron />
                <InertField label="Guests" value="2 Adults" chevron />
              </div>

              <button
                type="button"
                onClick={() => setShowPlanner(true)}
                className="w-full md:w-auto px-8 py-3 bg-primary text-on-primary font-label-lg text-label-lg rounded-lg hover:bg-premium-navy transition-all uppercase whitespace-nowrap h-[48px] flex items-center justify-center"
              >
                Plan a trip
              </button>
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

            {tripsQuery.isSuccess && trips.length === 0 && (
              <EmptyState onPlan={() => setShowPlanner(true)} />
            )}

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

      {showPlanner && <PlanTripDialog onClose={() => setShowPlanner(false)} />}
    </>
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

function InertField({
  label,
  value,
  icon,
  chevron,
}: {
  label: string;
  value: string;
  icon?: string;
  chevron?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel>{label}</FieldLabel>
      <InertBlock reason={NO_API}>
        <div className="w-full bg-sand-accent text-on-surface font-body-md text-body-md py-3 px-4 rounded-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            {icon && <span className="material-symbols-outlined text-[20px]">{icon}</span>}
            {value}
          </span>
          {chevron && <span className="material-symbols-outlined text-[20px]">expand_more</span>}
        </div>
      </InertBlock>
    </div>
  );
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
    <article className={`group flex flex-col gap-4 ${offset ? "md:-mt-12" : ""}`}>
      <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden shadow-md bg-surface-container-high">
        {trip.cover_image_url ? (
          <img
            src={trip.cover_image_url}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface-container-high to-secondary-fixed-dim">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40">
              landscape
            </span>
          </div>
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
          <InertButton
            reason="The Itinerary Builder hasn't been ported from Stitch yet."
            className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1 ml-auto bg-transparent"
          >
            <span className="material-symbols-outlined text-[14px]">open_in_new</span> Open
          </InertButton>
        </div>
      </div>
    </article>
  );
}

function EmptyState({ onPlan }: { onPlan: () => void }) {
  return (
    <div className="bg-surface-container rounded-xl p-12 flex flex-col items-center text-center gap-4">
      <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center">
        <span className="material-symbols-outlined text-primary">edit_calendar</span>
      </div>
      <h3 className="font-headline-md text-headline-md text-primary">No expeditions yet</h3>
      <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
        Your itineraries will appear here once you plan one.
      </p>
      <button
        type="button"
        onClick={onPlan}
        className="mt-2 px-6 py-3 bg-primary text-on-primary font-label-lg text-label-lg rounded-lg hover:bg-premium-navy transition-all uppercase"
      >
        Plan your first trip
      </button>
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

/** Create a trip without leaving the dashboard — POST /trips, then refresh. */
function PlanTripDialog({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");

  const create = useMutation({
    mutationFn: () =>
      api.trips.create({
        name,
        date_start: dateStart,
        date_end: dateEnd,
        description: description || null,
        // Money goes to the server as a string — it is Numeric(10,2) there,
        // and a float would reintroduce rounding (INTEGRATION.md §3.1).
        budget_target: budget ? budget : null,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["trips"] });
      onClose();
    },
  });

  // Mirrors the backend's date rule so the user sees it before a 422.
  const datesInverted = Boolean(dateStart && dateEnd && dateEnd < dateStart);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (datesInverted) return;
    create.mutate();
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Plan a trip"
        className="w-full max-w-lg bg-surface-container-lowest rounded-xl shadow-xl p-6 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-headline-md text-headline-md text-primary">Plan a trip</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="material-symbols-outlined text-on-surface-variant hover:text-primary"
          >
            close
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <FieldLabel>Trip name</FieldLabel>
            <input
              className={INPUT}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Kyoto in autumn"
              required
              maxLength={255}
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-2">
              <FieldLabel>Start</FieldLabel>
              <input
                className={INPUT}
                type="date"
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
                required
              />
            </label>
            <label className="flex flex-col gap-2">
              <FieldLabel>End</FieldLabel>
              <input
                className={INPUT}
                type="date"
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
                required
              />
            </label>
          </div>

          {datesInverted && (
            <p className="font-body-md text-body-md text-on-error-container bg-error-container px-4 py-2 rounded-lg">
              The end date must be on or after the start date.
            </p>
          )}

          <label className="flex flex-col gap-2">
            <FieldLabel>Budget target (optional)</FieldLabel>
            <input
              className={INPUT}
              type="number"
              min="0"
              step="0.01"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="1500.00"
            />
          </label>

          <label className="flex flex-col gap-2">
            <FieldLabel>Notes (optional)</FieldLabel>
            <textarea
              className={`${INPUT} min-h-[80px]`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Temples, food, and slow mornings."
            />
          </label>

          {create.isError && (
            <ErrorNote error={create.error} fallback="Could not create the trip." />
          )}

          <button
            type="submit"
            disabled={create.isPending || datesInverted}
            className="w-full px-8 py-3 bg-primary text-on-primary font-label-lg text-label-lg rounded-lg hover:bg-premium-navy transition-all uppercase disabled:opacity-50 h-[48px]"
          >
            {create.isPending ? "Creating…" : "Create trip"}
          </button>
        </form>
      </div>
    </div>
  );
}

const INPUT =
  "w-full bg-sand-accent text-on-surface font-body-md text-body-md py-3 px-4 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/50";
