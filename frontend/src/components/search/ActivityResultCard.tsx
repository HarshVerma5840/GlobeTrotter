/**
 * Activity result card — Explore screen.
 *
 * Premium editorial card, not a rounded SaaS tile: white surface, one warm
 * hairline border, a shadow that is almost not there, and a 10px radius.
 * All of the colour in this card comes from the photograph.
 */
import { formatMoney } from "../../types/models";
import type { Activity, City } from "../../types/models";

const CATEGORY_LABEL: Record<string, string> = {
  sightseeing: "Sightseeing",
  food: "Food",
  adventure: "Adventure",
  transport: "Transport",
  stay: "Stay",
  other: "Other",
};

interface ActivityResultCardProps {
  activity: Activity;
  /** Resolved from the activity's `city_id`; absent while the catalogue loads. */
  city?: City;
  isAdded: boolean;
  isBusy: boolean;
  onAdd: () => void;
}

export default function ActivityResultCard({
  activity,
  city,
  isAdded,
  isBusy,
  onAdd,
}: ActivityResultCardProps) {
  return (
    <article className="group flex flex-col bg-editorial-card border border-editorial-border rounded-card overflow-hidden shadow-editorial hover:border-editorial-primary/40 hover:shadow-editorial-lift hover:-translate-y-0.5 transition-all duration-300">
      {/* Photography — never tinted, never overlaid with a brand colour. */}
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-editorial-beige">
        {activity.image_url ? (
          <img
            src={activity.image_url}
            alt={activity.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
          />
        ) : (
          /*
           * The catalogue seed ships without photography (image_url is
           * nullable, CONTRACTS §4). Rather than a broken-image grey block,
           * the empty state is a warm beige plate carrying the initial in
           * the same serif as the title — it reads as a deliberate editorial
           * cover, and it swaps out the moment a real photo exists.
           */
          <div className="w-full h-full flex items-center justify-center bg-editorial-beige">
            <span className="font-headline-lg text-[64px] leading-none text-editorial-muted select-none">
              {activity.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {city && (
          <span className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-image bg-editorial-card/90 backdrop-blur-sm font-label-sm text-label-sm uppercase text-editorial-primary shadow-editorial">
            <span className="material-symbols-outlined text-[14px]">location_on</span>
            {city.name}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4 p-6 flex-1">
        <span className="self-start px-2.5 py-1 rounded-image bg-editorial-beige font-label-sm text-label-sm uppercase text-editorial-secondary">
          {CATEGORY_LABEL[activity.category] ?? activity.category}
        </span>

        <h3 className="font-headline-md text-[28px] leading-[1.15] text-editorial-primary">
          {activity.name}
        </h3>

        {activity.description && (
          <p className="font-body-md text-body-md text-editorial-secondary line-clamp-2">
            {activity.description}
          </p>
        )}

        {/*
          Duration and cost are the only per-activity metadata the catalogue
          actually stores (CONTRACTS §4) — there is no rating field, so none
          is displayed. A star invented on the client is worse than no star.
        */}
        <div className="mt-auto pt-4 border-t border-editorial-border flex items-center justify-between font-label-sm text-label-sm uppercase text-editorial-secondary">
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            {activity.duration_hours ? `${activity.duration_hours} Hours` : "Flexible"}
          </span>
          <span>
            {activity.cost && Number(activity.cost) > 0
              ? `$${formatMoney(activity.cost)}`
              : "Complimentary"}
          </span>
        </div>

        <button
          type="button"
          onClick={onAdd}
          disabled={isBusy || isAdded}
          className={`w-full py-3.5 rounded-control font-label-sm text-label-sm uppercase flex items-center justify-center gap-2 transition-colors disabled:cursor-default ${
            isAdded
              ? "bg-editorial-primary text-white border border-editorial-primary"
              : "bg-editorial-card text-editorial-primary border border-editorial-primary hover:bg-editorial-primary hover:text-white"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {isAdded ? "check" : "add"}
          </span>
          {isBusy ? "Adding…" : isAdded ? "Added" : "Add to Trip"}
        </button>
      </div>
    </article>
  );
}
