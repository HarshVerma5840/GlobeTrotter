import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { ApiError } from "../api/client";
import { api } from "../api/endpoints";
import ActivitySuggestionsGrid from "../components/create-trip/ActivitySuggestionsGrid";
import DateSelector from "../components/create-trip/DateSelector";
import DestinationSelector from "../components/create-trip/DestinationSelector";
import TripDetailsForm from "../components/create-trip/TripDetailsForm";
import TripSummary from "../components/create-trip/TripSummary";
import { formatMoney } from "../types/models";
import type { City } from "../types/models";

/**
 * Create Trip page (INTEGRATION.md §5).
 *
 * Real flow, no console.log stub: creating a trip is three real calls —
 *   1. POST /trips                        (name, dates, description)
 *   2. POST /trips/{id}/stops             (the one selected city, spanning the whole trip)
 *   3. POST /stops/{id}/activities        (once per added activity)
 * then navigate to /trips/{id} — the Itinerary Builder — with a real,
 * persisted, editable draft already in place (same non-destructive shape
 * as the backend's own auto-plan, CONTRACTS §7.1).
 */
export default function CreateTrip() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [tripName, setTripName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const activitiesQuery = useQuery({
    queryKey: ["activities", { city_id: selectedCity?.id }],
    queryFn: () => api.activities.search({ city_id: selectedCity!.id, limit: 50 }),
    enabled: Boolean(selectedCity),
  });
  const activities = activitiesQuery.data ?? [];

  const toggleActivity = (id: string) => {
    setAddedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const estimatedTotal = useMemo(() => {
    let total = 0;
    for (const activity of activities) {
      if (addedIds.has(activity.id) && activity.cost) total += Number(activity.cost);
    }
    return total;
  }, [activities, addedIds]);

  const datesInverted = Boolean(dateStart && dateEnd && dateEnd < dateStart);
  const durationLabel = useMemo(() => {
    if (!dateStart || !dateEnd || datesInverted) return "Select your dates";
    const days =
      Math.round(
        (Date.parse(`${dateEnd}T00:00:00Z`) - Date.parse(`${dateStart}T00:00:00Z`)) / 86_400_000,
      ) + 1;
    return `${days} ${days === 1 ? "Day" : "Days"} · ${Math.max(days - 1, 0)} Nights`;
  }, [dateStart, dateEnd, datesInverted]);

  const createTrip = useMutation({
    mutationFn: async () => {
      const trip = await api.trips.create({
        name: tripName,
        date_start: dateStart,
        date_end: dateEnd,
        description: description || null,
      });

      const stop = await api.stops.create(trip.id, {
        city_id: selectedCity!.id,
        date_start: dateStart,
        date_end: dateEnd,
      });

      const chosen = activities.filter((a) => addedIds.has(a.id));
      await Promise.all(
        chosen.map((activity) =>
          api.stops.addActivity(stop.id, {
            activity_id: activity.id,
            scheduled_date: dateStart,
          }),
        ),
      );

      return trip;
    },
    onSuccess: (trip) => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      navigate(`/trips/${trip.id}`);
    },
  });

  const canSubmit =
    tripName.trim().length > 0 &&
    Boolean(selectedCity) &&
    Boolean(dateStart) &&
    Boolean(dateEnd) &&
    !datesInverted &&
    !createTrip.isPending;

  return (
    <div className="w-full flex-1 flex flex-col items-center relative bg-editorial-bg px-6 md:px-12 py-10">
      <div className="w-full max-w-[1500px] flex flex-col lg:flex-row gap-10 lg:gap-12">
        <main className="w-full lg:w-[75%] flex flex-col gap-12">
          <header className="flex flex-col gap-4">
            <h1
              className="text-[48px] lg:text-[64px] leading-[1.05] font-medium text-editorial-primary tracking-tight"
              style={{ fontFamily: "'EB Garamond', serif" }}
            >
              Create a New Trip
            </h1>
            <p className="font-body-lg text-body-lg text-editorial-secondary max-w-2xl mt-4">
              Pick a destination, set your dates, and add a few activities to start.
            </p>
          </header>

          <TripDetailsForm
            tripName={tripName}
            onTripNameChange={setTripName}
            description={description}
            onDescriptionChange={setDescription}
          />

          <DestinationSelector
            selectedCity={selectedCity}
            onSelect={setSelectedCity}
            onClear={() => {
              setSelectedCity(null);
              setAddedIds(new Set());
            }}
          />

          <DateSelector
            dateStart={dateStart}
            dateEnd={dateEnd}
            onDateStartChange={setDateStart}
            onDateEndChange={setDateEnd}
            durationLabel={durationLabel}
            datesInverted={datesInverted}
          />

          {selectedCity && (
            <ActivitySuggestionsGrid
              activities={activities}
              addedIds={addedIds}
              onToggleActivity={toggleActivity}
              cityName={selectedCity.name}
              isLoading={activitiesQuery.isPending}
            />
          )}
        </main>

        <TripSummary
          tripName={tripName || "Untitled Trip"}
          destination={selectedCity ? `${selectedCity.name}, ${selectedCity.country}` : "No destination selected"}
          dateRange={dateStart && dateEnd ? `${dateStart} — ${dateEnd}` : "Select dates"}
          activitiesCount={addedIds.size}
          estimatedTotal={`$${formatMoney(estimatedTotal)}`}
          onCreateTrip={() => createTrip.mutate()}
          disabled={!canSubmit}
          error={createTrip.isError ? errorMessage(createTrip.error) : null}
        />
      </div>
    </div>
  );
}

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.detail : "Could not create the trip.";
}
