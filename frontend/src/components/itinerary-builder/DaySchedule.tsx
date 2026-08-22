import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "../../api/endpoints";
import { formatMoney } from "../../types/models";
import type { ItineraryActivity } from "../../types/models";

const CATEGORY_LABEL: Record<string, string> = {
  sightseeing: "Sightseeing",
  food: "Food",
  adventure: "Adventure",
  transport: "Transport",
  stay: "Stay",
  other: "Other",
};

function formatTime(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function ActivityCard({ item, tripId }: { item: ItineraryActivity; tripId: string }) {
  const queryClient = useQueryClient();
  const remove = useMutation({
    mutationFn: () => api.itineraryActivities.remove(item.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["trips", tripId] }),
  });

  const activity = item.activity;

  return (
    <div className="ml-16 bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/20 flex gap-6 relative overflow-hidden group cursor-default hover:shadow-md transition-all">
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-premium-navy" />
      {activity?.image_url && (
        <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
          <img className="w-full h-full object-cover" src={activity.image_url} alt="" />
        </div>
      )}
      <div className="flex flex-col justify-between flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <h3 className="font-headline-md text-headline-md text-premium-navy leading-tight truncate">
              {activity?.name ?? "Activity"}
            </h3>
            {item.notes && (
              <p className="font-body-md text-body-md text-on-surface-variant">{item.notes}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => remove.mutate()}
            disabled={remove.isPending}
            title="Remove from itinerary"
            className="text-outline hover:text-error transition-colors opacity-0 group-hover:opacity-100 shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">
              {remove.isPending ? "hourglass_empty" : "delete"}
            </span>
          </button>
        </div>
        <div className="flex gap-2 items-center">
          {activity && (
            <span className="bg-sand-accent text-on-secondary-container font-label-sm text-label-sm px-2 py-1 rounded-md">
              {CATEGORY_LABEL[activity.category] ?? activity.category}
            </span>
          )}
          {item.cost && Number(item.cost) > 0 && (
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              ${formatMoney(item.cost)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

interface Bucket {
  label: string;
  items: ItineraryActivity[];
}

function bucketize(items: ItineraryActivity[]): Bucket[] {
  const morning: ItineraryActivity[] = [];
  const afternoon: ItineraryActivity[] = [];
  const evening: ItineraryActivity[] = [];
  const unscheduled: ItineraryActivity[] = [];

  for (const item of items) {
    if (item.scheduled_time == null) unscheduled.push(item);
    else if (item.scheduled_time < 12) morning.push(item);
    else if (item.scheduled_time < 18) afternoon.push(item);
    else evening.push(item);
  }

  const sortByTime = (a: ItineraryActivity, b: ItineraryActivity) =>
    (a.scheduled_time ?? 0) - (b.scheduled_time ?? 0);
  morning.sort(sortByTime);
  afternoon.sort(sortByTime);
  evening.sort(sortByTime);

  return [
    { label: "Morning", items: morning },
    { label: "Afternoon", items: afternoon },
    { label: "Evening", items: evening },
    { label: "Unscheduled", items: unscheduled },
  ].filter((bucket) => bucket.items.length > 0);
}

interface DayScheduleProps {
  tripId: string;
  dayTitle: string;
  daySubtitle: string;
  items: ItineraryActivity[];
  hasStop: boolean;
  onOpenRoute: () => void;
}

export default function DaySchedule({
  tripId,
  dayTitle,
  daySubtitle,
  items,
  hasStop,
  onOpenRoute,
}: DayScheduleProps) {
  const buckets = bucketize(items);

  return (
    <main className="flex-1 flex flex-col h-full relative">
      <div className="flex items-center justify-between pb-6">
        <div className="flex flex-col">
          <h2 className="font-headline-lg text-headline-lg text-premium-navy">{dayTitle}</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">{daySubtitle}</p>
        </div>
        <button
          type="button"
          onClick={onOpenRoute}
          className="bg-surface-container-high px-5 py-2.5 rounded-full flex items-center gap-2 text-premium-navy hover:bg-sand-accent transition-colors shadow-sm font-label-lg text-label-lg"
        >
          <span className="material-symbols-outlined text-[20px]">route</span>
          Route Feasibility
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-4 flex flex-col gap-10">
        {!hasStop && (
          <p className="ml-16 font-body-md text-body-md text-on-surface-variant">
            No city is planned for this day yet — add a stop from the timeline on the left.
          </p>
        )}

        {hasStop && buckets.length === 0 && (
          <p className="ml-16 font-body-md text-body-md text-on-surface-variant">
            Nothing scheduled yet — add something from the library on the right.
          </p>
        )}

        {buckets.map((bucket, idx) => (
          <div
            key={bucket.label}
            className={`flex flex-col gap-4 ${idx > 0 ? "mt-4" : ""} ${
              idx === buckets.length - 1 ? "mb-20" : ""
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="font-headline-md text-headline-md text-outline/50 leading-none">
                {bucket.label}
              </span>
              <div className="h-px bg-outline-variant/30 flex-1" />
            </div>

            {bucket.items.map((item) => (
              <div key={item.id} className="flex flex-col gap-1">
                {item.scheduled_time != null && (
                  <span className="ml-16 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
                    {formatTime(item.scheduled_time)}
                  </span>
                )}
                <ActivityCard item={item} tripId={tripId} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </main>
  );
}
