import ActivitySuggestionCard from "./ActivitySuggestionCard";
import type { Activity } from "../../types/models";

interface ActivitySuggestionsGridProps {
  activities: Activity[];
  addedIds: Set<string>;
  onToggleActivity: (id: string) => void;
  cityName: string;
  isLoading: boolean;
}

export default function ActivitySuggestionsGrid({
  activities,
  addedIds,
  onToggleActivity,
  cityName,
  isLoading,
}: ActivitySuggestionsGridProps) {
  return (
    <section className="flex flex-col gap-8 pt-4">
      <div className="flex justify-between items-end border-b border-editorial-border pb-4">
        <h2
          className="text-[32px] lg:text-[40px] leading-tight text-editorial-primary tracking-tight"
          style={{ fontFamily: "'EB Garamond', serif" }}
        >
          Curated for {cityName}
        </h2>
      </div>

      {isLoading && (
        <p className="text-editorial-secondary font-body-md text-body-md">Loading activities…</p>
      )}

      {!isLoading && activities.length === 0 && (
        <p className="text-editorial-secondary font-body-md text-body-md">
          No catalog activities for {cityName} yet — you can still create the trip and add
          activities later in the Itinerary Builder.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
        {activities.map((activity, index) => (
          <ActivitySuggestionCard
            key={activity.id}
            activity={activity}
            isAdded={addedIds.has(activity.id)}
            onToggle={() => onToggleActivity(activity.id)}
            offsetTop={index % 2 === 1}
          />
        ))}
      </div>
    </section>
  );
}
