import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "../../api/endpoints";
import type { Activity } from "../../types/models";

interface ActivityLibraryProps {
  tripId: string;
  /** The stop covering the active day — activities are added to it. */
  stopId: string | null;
  cityId: string | null;
  cityName: string | null;
  activeDayIso: string;
  alreadyAddedActivityIds: Set<string>;
}

/**
 * Real GET /activities catalog for the active day's city, replacing the
 * mock's static Fushimi Inari / Gion Karyo cards. Clicking "Add" calls
 * POST /stops/{id}/activities for the active stop, scheduled to noon on
 * the active day — a sensible default the user can retime later once a
 * time editor exists.
 */
export default function ActivityLibrary({
  tripId,
  stopId,
  cityId,
  cityName,
  activeDayIso,
  alreadyAddedActivityIds,
}: ActivityLibraryProps) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("");

  const activitiesQuery = useQuery({
    queryKey: ["activities", { city_id: cityId }],
    queryFn: () => api.activities.search({ city_id: cityId!, limit: 50 }),
    enabled: Boolean(cityId),
  });

  const addActivity = useMutation({
    mutationFn: (activityId: string) =>
      api.stops.addActivity(stopId!, {
        activity_id: activityId,
        scheduled_date: activeDayIso,
        scheduled_time: 12,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["trips", tripId] }),
  });

  const activities = (activitiesQuery.data ?? []).filter(
    (a) =>
      !alreadyAddedActivityIds.has(a.id) &&
      (a.name.toLowerCase().includes(filter.toLowerCase()) ||
        a.category.toLowerCase().includes(filter.toLowerCase())),
  );

  return (
    <aside className="w-80 flex-shrink-0 flex flex-col h-full bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 overflow-hidden">
      <div className="p-6 border-b border-outline-variant/30 bg-surface-container-lowest z-10 flex flex-col gap-4">
        <h2 className="font-headline-md text-headline-md text-premium-navy">
          {cityName ? `Add to ${cityName}` : "Library"}
        </h2>

        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
            search
          </span>
          <input
            className="w-full bg-sand-accent/50 border-b border-premium-navy/30 pl-10 pr-4 py-2.5 rounded-t-lg focus:outline-none focus:border-premium-navy focus:bg-sand-accent transition-all font-body-md text-body-md text-on-surface placeholder:text-outline"
            placeholder="Filter activities…"
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            disabled={!cityId}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-background">
        {!stopId && (
          <p className="text-center text-on-surface-variant font-body-md text-body-md py-8">
            Select a day with a planned city to add activities.
          </p>
        )}

        {stopId && activitiesQuery.isPending && (
          <p className="text-center text-on-surface-variant font-body-md text-body-md py-8">
            Loading…
          </p>
        )}

        {stopId && activitiesQuery.isSuccess && activities.length === 0 && (
          <p className="text-center text-on-surface-variant font-body-md text-body-md py-8">
            {filter ? "No activities match your filter." : "Nothing left to add for this city."}
          </p>
        )}

        {stopId &&
          activities.map((item) => (
            <LibraryCard
              key={item.id}
              item={item}
              onAdd={() => addActivity.mutate(item.id)}
              adding={addActivity.isPending && addActivity.variables === item.id}
            />
          ))}
      </div>
    </aside>
  );
}

function LibraryCard({
  item,
  onAdd,
  adding,
}: {
  item: Activity;
  onAdd: () => void;
  adding: boolean;
}) {
  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 overflow-hidden hover:shadow-md transition-all group">
      <div className="h-24 w-full relative bg-surface-container-high">
        {item.image_url ? (
          <img className="w-full h-full object-cover" src={item.image_url} alt="" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-[28px] text-on-surface-variant/40">
              local_activity
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent" />
        <button
          type="button"
          onClick={onAdd}
          disabled={adding}
          title="Add to this day"
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-glass-white backdrop-blur-md flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-100"
        >
          <span className="material-symbols-outlined text-premium-navy text-[16px]">
            {adding ? "hourglass_empty" : "add"}
          </span>
        </button>
      </div>

      <div className="p-4 flex flex-col gap-1">
        <h4 className="font-label-lg text-label-lg text-premium-navy">{item.name}</h4>
        <p className="font-label-sm text-label-sm text-on-surface-variant">
          {item.category}
          {item.duration_hours ? ` · ${item.duration_hours}h` : ""}
        </p>
      </div>
    </div>
  );
}
