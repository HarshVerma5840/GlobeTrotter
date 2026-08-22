import type { ActivitySuggestion } from "../../data/createTripData";

interface ActivitySuggestionCardProps {
  activity: ActivitySuggestion;
  isAdded: boolean;
  onToggle: () => void;
}

export default function ActivitySuggestionCard({
  activity,
  isAdded,
  onToggle,
}: ActivitySuggestionCardProps) {
  const { title, category, imageUrl, imageAlt, duration, cost, aspectRatio, offsetTop } =
    activity;

  const aspectClass =
    aspectRatio === "landscape" ? "aspect-[4/3]" : "aspect-[4/5]";

  return (
    <div
      className={`group flex flex-col gap-6 ${
        offsetTop ? "md:mt-16" : ""
      }`}
    >
      {/* Image */}
      <div
        className={`${aspectClass} bg-editorial-card rounded-lg overflow-hidden relative`}
      >
        <img
          alt={imageAlt}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          src={imageUrl}
          loading="lazy"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-4">
        <div>
          <span className="text-[10px] font-bold text-editorial-secondary uppercase tracking-[0.2em]">
            {category}
          </span>
          <h4
            className="text-3xl text-editorial-primary mt-3"
            style={{ fontFamily: "'EB Garamond', serif" }}
          >
            {title}
          </h4>
        </div>

        {/* Duration & Cost */}
        <div className="flex justify-between items-center text-sm font-medium text-editorial-secondary border-t border-editorial-border pt-4">
          <span>{duration}</span>
          <span>{cost}</span>
        </div>

        {/* Add / Added button */}
        <button
          onClick={onToggle}
          className={
            isAdded
              ? "w-full py-4 mt-2 rounded-md bg-editorial-primary text-white text-[11px] font-semibold uppercase tracking-[0.15em] flex items-center justify-center gap-2 hover:bg-black transition-colors"
              : "w-full py-4 mt-2 rounded-md border border-editorial-primary text-[11px] font-semibold text-editorial-primary uppercase tracking-[0.15em] hover:bg-editorial-primary hover:text-white transition-colors flex items-center justify-center gap-2"
          }
        >
          <span className="material-symbols-outlined text-[18px]">
            {isAdded ? "check" : "add"}
          </span>
          {isAdded ? "Added" : "Add"}
        </button>
      </div>
    </div>
  );
}
