import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiError } from "../../api/client";
import { api } from "../../api/endpoints";
import { formatShortDate } from "../../lib/tripStatus";
import type { City, Stop } from "../../types/models";

export interface TimelineDay {
  iso: string;
  dayNumber: number;
  stop: Stop | null;
}

interface TimelineSidebarProps {
  tripId: string;
  days: TimelineDay[];
  activeDayIso: string;
  onSelectDay: (iso: string) => void;
}

/**
 * Real day-by-day timeline, derived from the trip's date range and its
 * stops (ItineraryBuilder.tsx) — no hard-coded "Arrival & Gion" labels.
 * Each day's label is the city of whichever stop covers that date, or
 * "No city planned" if the trip has a gap (e.g. a trip created from the
 * Dashboard's quick-create modal, which has no stops yet).
 *
 * The "+" button opens a real add-stop form (POST /trips/{id}/stops) —
 * this is what lets a stop-less trip actually get built out.
 */
export default function TimelineSidebar({
  tripId,
  days,
  activeDayIso,
  onSelectDay,
}: TimelineSidebarProps) {
  const [addingStop, setAddingStop] = useState(false);

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col h-full bg-surface-container-low rounded-2xl overflow-hidden relative shadow-sm">
      <div className="p-6 pb-4 border-b border-outline-variant/30 flex items-center justify-between z-10 bg-surface-container-low">
        <h2 className="font-headline-md text-headline-md text-premium-navy m-0">Itinerary</h2>
        <button
          type="button"
          onClick={() => setAddingStop((v) => !v)}
          title="Add a city stop"
          className="w-8 h-8 rounded-full bg-sand-accent flex items-center justify-center text-premium-navy hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">
            {addingStop ? "close" : "add"}
          </span>
        </button>
      </div>

      {addingStop && (
        <AddStopForm tripId={tripId} onDone={() => setAddingStop(false)} />
      )}

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 relative">
        <div className="absolute left-10 top-6 bottom-6 w-px bg-outline-variant/40 z-0" />

        {days.map((day) => {
          const isActive = day.iso === activeDayIso;
          return (
            <div
              key={day.iso}
              className={`flex items-start gap-4 relative z-10 group cursor-pointer ${
                isActive ? "" : "opacity-70 hover:opacity-100"
              } transition-opacity`}
              onClick={() => onSelectDay(day.iso)}
            >
              <div
                className={`w-8 h-8 rounded-full flex flex-col items-center justify-center flex-shrink-0 mt-1 transition-transform group-hover:scale-110 ${
                  isActive
                    ? "bg-premium-navy text-background-cream shadow-md"
                    : "bg-sand-accent border border-outline-variant/30 text-on-surface-variant"
                }`}
              >
                <span className="font-label-sm text-label-sm leading-none">{day.dayNumber}</span>
              </div>

              <div
                className={`flex flex-col gap-1 w-full p-4 rounded-xl transition-colors ${
                  isActive
                    ? "bg-surface-container shadow-sm border border-outline-variant/10"
                    : "hover:bg-surface-container/50"
                }`}
              >
                <span
                  className={`font-label-lg text-label-lg ${
                    isActive ? "text-premium-navy" : "text-on-surface"
                  }`}
                >
                  {formatShortDate(day.iso)}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  {day.stop?.city?.name ?? "No city planned"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function AddStopForm({ tripId, onDone }: { tripId: string; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [city, setCity] = useState<City | null>(null);
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");

  const searchQuery = useQuery({
    queryKey: ["cities", { q: query }],
    queryFn: () => api.cities.search({ q: query || undefined, sort: "popularity", limit: 6 }),
    enabled: !city,
  });

  const addStop = useMutation({
    mutationFn: () =>
      api.stops.create(tripId, { city_id: city!.id, date_start: dateStart, date_end: dateEnd }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips", tripId] });
      onDone();
    },
  });

  const datesInverted = Boolean(dateStart && dateEnd && dateEnd < dateStart);
  const canSubmit = Boolean(city) && Boolean(dateStart) && Boolean(dateEnd) && !datesInverted;

  return (
    <div className="p-4 border-b border-outline-variant/30 bg-surface-container flex flex-col gap-3">
      {!city ? (
        <>
          <input
            className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary/30"
            placeholder="Search a city…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
            {(searchQuery.data ?? []).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCity(c)}
                className="text-left px-3 py-2 rounded-lg hover:bg-surface-container-high font-body-md text-body-md text-on-surface"
              >
                {c.name}, {c.country}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <span className="font-label-lg text-label-lg text-premium-navy">
              {city.name}, {city.country}
            </span>
            <button
              type="button"
              onClick={() => setCity(null)}
              className="text-label-sm text-on-surface-variant uppercase underline"
            >
              Change
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-2 py-1.5 font-body-md text-body-md"
            />
            <input
              type="date"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-2 py-1.5 font-body-md text-body-md"
            />
          </div>
          {datesInverted && (
            <p className="text-error text-xs">End must be on or after start.</p>
          )}
          {addStop.isError && (
            <p className="text-error text-xs">
              {addStop.error instanceof ApiError ? addStop.error.detail : "Could not add that stop."}
            </p>
          )}
          <button
            type="button"
            onClick={() => addStop.mutate()}
            disabled={!canSubmit || addStop.isPending}
            className="bg-premium-navy text-background-cream rounded-lg py-2 font-label-lg text-label-lg disabled:opacity-40"
          >
            {addStop.isPending ? "Adding…" : "Add stop"}
          </button>
        </>
      )}
    </div>
  );
}
