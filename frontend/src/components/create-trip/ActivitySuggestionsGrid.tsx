import { TOKYO_ACTIVITIES } from "../../data/createTripData";
import ActivitySuggestionCard from "./ActivitySuggestionCard";

interface ActivitySuggestionsGridProps {
  addedIds: Set<string>;
  onToggleActivity: (id: string) => void;
  cityName: string;
}

export default function ActivitySuggestionsGrid({
  addedIds,
  onToggleActivity,
  cityName,
}: ActivitySuggestionsGridProps) {
  return (
    <section className="flex flex-col gap-8 pt-4">
      {/* Header with "Curated for …" + View All */}
      <div className="flex justify-between items-end border-b border-editorial-border pb-4">
        <h2
          className="text-[32px] lg:text-[40px] leading-tight text-editorial-primary tracking-tight"
          style={{ fontFamily: "'EB Garamond', serif" }}
        >
          Curated for {cityName}
        </h2>
        <button className="text-[11px] font-semibold text-editorial-primary uppercase tracking-[0.15em] hover:text-editorial-secondary transition-colors pb-2">
          View All
        </button>
      </div>

      {/* Card grid — 2-column masonry-like layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
        {TOKYO_ACTIVITIES.map((activity) => (
          <ActivitySuggestionCard
            key={activity.id}
            activity={activity}
            isAdded={addedIds.has(activity.id)}
            onToggle={() => onToggleActivity(activity.id)}
          />
        ))}
      </div>
    </section>
  );
}
