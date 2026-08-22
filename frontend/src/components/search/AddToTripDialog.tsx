/**
 * "Add to Trip" — the real write behind the Explore screen's card button.
 *
 * An activity cannot hang off a trip directly: CONTRACTS §4 attaches
 * itinerary activities to a *stop*, and a stop is a city plus a date range.
 * So adding is up to three calls:
 *
 *   1. GET  /trips/{id}                      — what stops does it already have?
 *   2. POST /trips/{id}/stops                — only if the city isn't among them
 *   3. POST /stops/{id}/activities           — the actual add
 *
 * Step 2 picks the trip's FIRST day for the new stop, and makes it a
 * single-day stop. That is not arbitrary. `validate_no_overlap`
 * (services/stops.py) is strict — `a_start < b_end and b_start < a_end` — so
 * a one-day stop only collides with a stop that strictly contains it. No
 * existing stop can start before the trip does, so a single-day stop on
 * `trip.date_start` is the one placement guaranteed never to be rejected.
 * The user then moves it in the Itinerary Builder, which is the screen built
 * for exactly that.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { ApiError } from "../../api/client";
import { api } from "../../api/endpoints";
import type { Activity, Trip } from "../../types/models";

interface AddToTripDialogProps {
  activity: Activity;
  onClose: () => void;
  onAdded: (activityId: string) => void;
}

export default function AddToTripDialog({
  activity,
  onClose,
  onAdded,
}: AddToTripDialogProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const tripsQuery = useQuery({ queryKey: ["trips"], queryFn: api.trips.list });
  const trips = tripsQuery.data ?? [];

  const addToTrip = useMutation({
    mutationFn: async (trip: Trip) => {
      const detail = await api.trips.get(trip.id);

      const existing = detail.stops.find((stop) => stop.city_id === activity.city_id);
      const stop =
        existing ??
        (await api.stops.create(trip.id, {
          city_id: activity.city_id,
          date_start: detail.date_start,
          date_end: detail.date_start,
        }));

      return api.stops.addActivity(stop.id, {
        activity_id: activity.id,
        scheduled_date: stop.date_start,
      });
    },
    onSuccess: (_result, trip) => {
      // The builder and the trip list both show this activity now.
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["trip", trip.id] });
      onAdded(activity.id);
      onClose();
    },
    onError: (err) => {
      setError(
        err instanceof ApiError
          ? err.detail
          : "Could not add this activity. Please try again.",
      );
    },
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-editorial-primary/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Add ${activity.name} to a trip`}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md bg-editorial-card border border-editorial-border rounded-card shadow-editorial-lift flex flex-col max-h-[80vh]">
        <header className="flex items-start justify-between gap-4 p-6 border-b border-editorial-border">
          <div className="flex flex-col gap-1">
            <span className="font-label-sm text-label-sm uppercase text-editorial-muted">
              Add to trip
            </span>
            <h2 className="font-headline-md text-[24px] leading-tight text-editorial-primary">
              {activity.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-editorial-secondary hover:text-editorial-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {tripsQuery.isLoading && (
            <p className="p-4 font-body-md text-body-md text-editorial-secondary">
              Loading your trips…
            </p>
          )}

          {!tripsQuery.isLoading && trips.length === 0 && (
            <p className="p-4 font-body-md text-body-md text-editorial-secondary">
              You don't have a trip yet. Create one from{" "}
              <span className="text-editorial-primary font-semibold">Plan a Trip</span>,
              then add experiences to it here.
            </p>
          )}

          {trips.map((trip) => (
            <button
              key={trip.id}
              type="button"
              disabled={addToTrip.isPending}
              onClick={() => {
                setError(null);
                addToTrip.mutate(trip);
              }}
              className="w-full text-left px-4 py-3 rounded-control border border-editorial-border hover:border-editorial-primary hover:bg-editorial-beige transition-colors flex flex-col gap-1 disabled:opacity-50"
            >
              <span className="font-headline-md text-[20px] leading-tight text-editorial-primary">
                {trip.name}
              </span>
              <span className="font-label-sm text-label-sm uppercase text-editorial-secondary">
                {trip.date_start} — {trip.date_end}
              </span>
            </button>
          ))}
        </div>

        {error && (
          <p
            role="alert"
            className="mx-6 mb-4 px-4 py-3 rounded-control bg-error-container text-on-error-container font-body-md text-[14px]"
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
