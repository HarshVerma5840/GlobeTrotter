import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { api } from "../api/endpoints";
import ActivityLibrary from "../components/itinerary-builder/ActivityLibrary";
import AppSidebar from "../components/itinerary-builder/AppSidebar";
import DaySchedule from "../components/itinerary-builder/DaySchedule";
import { InertButton } from "../components/Inert";
import TimelineSidebar, { type TimelineDay } from "../components/itinerary-builder/TimelineSidebar";
import { dateRangeList, formatDateRange, formatShortDate } from "../lib/tripStatus";
import type { ItineraryActivity, Stop } from "../types/models";

/**
 * Itinerary Builder (INTEGRATION.md §5, screen #6).
 *
 * Real data throughout: GET /trips/{id} returns the trip with its ordered
 * stops and each stop's itinerary_activities + computed feasibility
 * fields (CONTRACTS §7.2) — nothing here is mocked. The timeline is built
 * from the trip's actual date range, not a hard-coded 3-day mock.
 *
 * Two mock affordances have no backend behind them and are handled
 * honestly rather than faked:
 *   - "View on Map" used a single static image for every trip. Replaced
 *     with a real "Route Feasibility" panel built from the same
 *     distance/duration/is_feasible fields §7.2 already computes.
 *   - "Finalize Trip" has no backend concept — inert.
 *   - "Share Itinerary" is real (PATCH /trips/{id} is_public), but the
 *     public share PAGE (screen #12) isn't ported yet, so it surfaces the
 *     token rather than linking to a page that doesn't exist.
 */
export default function ItineraryBuilder() {
  const { id: tripId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [activeDayIso, setActiveDayIso] = useState<string | null>(null);
  const [showRoute, setShowRoute] = useState(false);

  const tripQuery = useQuery({
    queryKey: ["trips", tripId],
    queryFn: () => api.trips.get(tripId!),
    enabled: Boolean(tripId),
  });

  const trip = tripQuery.data;

  const days: TimelineDay[] = useMemo(() => {
    if (!trip) return [];
    return dateRangeList(trip.date_start, trip.date_end).map((iso, index) => ({
      iso,
      dayNumber: index + 1,
      stop: trip.stops.find((s) => iso >= s.date_start && iso <= s.date_end) ?? null,
    }));
  }, [trip]);

  const activeIso = activeDayIso ?? days[0]?.iso ?? null;
  const activeDay = days.find((d) => d.iso === activeIso) ?? null;
  const activeStop: Stop | null = activeDay?.stop ?? null;

  const dayItems: ItineraryActivity[] = useMemo(() => {
    if (!trip || !activeIso) return [];
    const items: ItineraryActivity[] = [];
    for (const stop of trip.stops) {
      for (const item of stop.itinerary_activities) {
        if (item.scheduled_date === activeIso) items.push(item);
      }
    }
    return items;
  }, [trip, activeIso]);

  const share = useMutation({
    mutationFn: (isPublic: boolean) => api.trips.setPublic(tripId!, isPublic),
    onSuccess: (updated) => queryClient.setQueryData(["trips", tripId], { ...trip, ...updated }),
  });

  if (tripQuery.isPending) {
    return (
      <div className="bg-background-cream min-h-screen flex items-center justify-center">
        <p className="font-body-md text-body-md text-on-surface-variant">Loading itinerary…</p>
      </div>
    );
  }

  if (tripQuery.isError || !trip) {
    return (
      <div className="bg-background-cream min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="font-body-md text-body-md text-on-error-container bg-error-container px-4 py-3 rounded-lg">
          Could not load this trip.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-background-cream font-body-md text-on-surface min-h-screen">
      <AppSidebar />

      <div className="pl-72">
        <header className="fixed top-0 left-72 right-0 h-20 bg-glass-white backdrop-blur-xl z-40 flex items-center justify-end px-margin-desktop gap-gutter">
          <InertButton
            reason="No settings screen has been ported from Stitch yet."
            className="p-2 rounded-full bg-transparent text-on-surface-variant"
          >
            <span className="material-symbols-outlined">settings</span>
          </InertButton>
        </header>

        <main className="relative pt-20 bg-background-cream min-h-screen px-margin-desktop pb-section-v-gap">
          <div className="flex flex-col w-full h-full relative">
            <header className="w-full flex items-end justify-between pb-content-v-gap border-b border-outline-variant/30 relative z-10 mb-12 gap-6">
              <div className="flex flex-col gap-4 min-w-0">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest bg-sand-accent w-fit px-3 py-1 rounded-full">
                  {formatDateRange(trip)}
                </span>
                <h1 className="font-display-xl text-display-xl text-premium-navy truncate">
                  {trip.name}
                </h1>
                {trip.description && (
                  <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
                    {trip.description}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => share.mutate(!trip.is_public)}
                    disabled={share.isPending}
                    className="bg-glass-white backdrop-blur-md px-6 py-3 rounded-full text-premium-navy border border-premium-navy/20 flex items-center gap-2 hover:bg-surface-container-high transition-colors font-label-lg text-label-lg disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[20px]">share</span>
                    {trip.is_public ? "Make Private" : "Share Itinerary"}
                  </button>
                  <InertButton
                    reason="No backend concept of 'finalizing' a trip yet — every trip is always editable."
                    className="bg-premium-navy text-background-cream px-6 py-3 rounded-full flex items-center gap-2 shadow-lg font-label-lg text-label-lg"
                  >
                    <span className="material-symbols-outlined text-[20px]">check</span>
                    Finalize Trip
                  </InertButton>
                </div>
                {trip.is_public && trip.share_token && (
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    Share token: <code className="font-mono">{trip.share_token}</code> (public
                    read via the API — no public page ported yet)
                  </p>
                )}
              </div>
            </header>

            <div className="flex flex-row gap-gutter h-[calc(100vh-280px)] w-full">
              <TimelineSidebar
                tripId={trip.id}
                days={days}
                activeDayIso={activeIso ?? ""}
                onSelectDay={setActiveDayIso}
              />

              <div className="flex-1 flex flex-col h-full relative">
                {showRoute && (
                  <RouteFeasibilityPanel stops={trip.stops} onClose={() => setShowRoute(false)} />
                )}

                {activeDay && (
                  <DaySchedule
                    tripId={trip.id}
                    dayTitle={`Day ${activeDay.dayNumber}${
                      activeStop?.city ? `: ${activeStop.city.name}` : ""
                    }`}
                    daySubtitle={formatShortDate(activeDay.iso)}
                    items={dayItems}
                    hasStop={Boolean(activeStop)}
                    onOpenRoute={() => setShowRoute(true)}
                  />
                )}
              </div>

              <ActivityLibrary
                tripId={trip.id}
                stopId={activeStop?.id ?? null}
                cityId={activeStop?.city?.id ?? null}
                cityName={activeStop?.city?.name ?? null}
                activeDayIso={activeIso ?? ""}
                alreadyAddedActivityIds={new Set(dayItems.map((i) => i.activity_id))}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/**
 * Real distance/duration/feasibility per consecutive stop pair (CONTRACTS
 * §7.2) — replaces the mock's single static map image, which showed the
 * same picture regardless of which trip you opened.
 */
function RouteFeasibilityPanel({ stops, onClose }: { stops: Stop[]; onClose: () => void }) {
  return (
    <div className="absolute inset-0 bg-background-cream z-20 flex flex-col rounded-2xl overflow-hidden shadow-sm border border-outline-variant/20">
      <div className="flex items-center justify-between p-6 border-b border-outline-variant/30">
        <h3 className="font-headline-md text-headline-md text-premium-navy">Route Feasibility</h3>
        <button
          onClick={onClose}
          className="bg-glass-white backdrop-blur-xl p-3 rounded-full shadow-lg text-premium-navy hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined text-[24px]">close</span>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {stops.length === 0 && (
          <p className="font-body-md text-body-md text-on-surface-variant">
            No stops planned yet.
          </p>
        )}
        {stops.map((stop, index) => (
          <div
            key={stop.id}
            className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low"
          >
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-premium-navy text-background-cream flex items-center justify-center font-label-sm text-label-sm">
                {index + 1}
              </span>
              <span className="font-label-lg text-label-lg text-premium-navy">
                {stop.city?.name ?? "Unknown city"}
              </span>
            </div>
            {index === 0 ? (
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                First stop
              </span>
            ) : (
              <div className="flex items-center gap-4">
                <span className="font-body-md text-body-md text-on-surface-variant">
                  {stop.distance_from_previous_km != null
                    ? `${Math.round(stop.distance_from_previous_km)} km`
                    : "—"}
                </span>
                <span className="font-body-md text-body-md text-on-surface-variant">
                  {stop.travel_duration_hours != null
                    ? `${stop.travel_duration_hours.toFixed(1)} h`
                    : "—"}
                </span>
                <span
                  className={`font-label-sm text-label-sm uppercase tracking-widest px-3 py-1 rounded-full ${
                    stop.is_feasible
                      ? "bg-secondary-fixed text-on-secondary-fixed-variant"
                      : "bg-error-container text-on-error-container"
                  }`}
                >
                  {stop.is_feasible ? "Feasible" : "Tight"}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
