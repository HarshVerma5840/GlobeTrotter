import { formatMoney } from "../../types/models";
import type { Activity } from "../../types/models";

interface ActivitySuggestionCardProps {
  activity: Activity;
  isAdded: boolean;
  onToggle: () => void;
  offsetTop: boolean;
}

const CATEGORY_LABEL: Record<string, string> = {
  sightseeing: "Sightseeing",
  food: "Food",
  adventure: "Adventure",
  transport: "Transport",
  stay: "Stay",
  other: "Other",
};

export default function ActivitySuggestionCard({
  activity,
  isAdded,
  onToggle,
  offsetTop,
}: ActivitySuggestionCardProps) {
  return (
    <div className={`group flex flex-col gap-6 ${offsetTop ? "md:mt-16" : ""}`}>
      <div className="aspect-[4/5] bg-editorial-card rounded-lg overflow-hidden relative">
        {activity.image_url ? (
          <img
            alt={activity.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            src={activity.image_url}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-editorial-beige">
            <span className="material-symbols-outlined text-[40px] text-editorial-secondary/40">
              local_activity
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <span className="text-[10px] font-bold text-editorial-secondary uppercase tracking-[0.2em]">
            {CATEGORY_LABEL[activity.category] ?? activity.category}
          </span>
          <h4
            className="text-3xl text-editorial-primary mt-3"
            style={{ fontFamily: "'EB Garamond', serif" }}
          >
            {activity.name}
          </h4>
        </div>

        <div className="flex justify-between items-center text-sm font-medium text-editorial-secondary border-t border-editorial-border pt-4">
          <span>{activity.duration_hours ? `${activity.duration_hours} Hours` : "—"}</span>
          <span>
            {activity.cost && Number(activity.cost) > 0
              ? `$${formatMoney(activity.cost)}`
              : "Complimentary"}
          </span>
        </div>

        <button
          type="button"
          onClick={onToggle}
          className={
            isAdded
              ? "w-full py-4 mt-2 rounded-md bg-editorial-primary text-white text-[11px] font-semibold uppercase tracking-[0.15em] flex items-center justify-center gap-2 hover:bg-black transition-colors"
              : "w-full py-4 mt-2 rounded-md border border-editorial-primary text-[11px] font-semibold text-editorial-primary uppercase tracking-[0.15em] hover:bg-editorial-primary hover:text-white transition-colors flex items-center justify-center gap-2"
          }
        >
          <span className="material-symbols-outlined text-[18px]">{isAdded ? "check" : "add"}</span>
          {isAdded ? "Added" : "Add"}
        </button>
      </div>
    </div>
  );
}
