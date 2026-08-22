/**
 * City result card — Explore screen.
 *
 * Same editorial shell as the activity card so the two tabs read as one
 * grid: white surface, warm hairline, 10px radius, photography untouched.
 */
import type { City } from "../../types/models";

interface CityResultCardProps {
  city: City;
  /** Switches the Explore screen to Activities, filtered to this city. */
  onExplore: () => void;
}

export default function CityResultCard({ city, onExplore }: CityResultCardProps) {
  return (
    <article className="group flex flex-col bg-editorial-card border border-editorial-border rounded-card overflow-hidden shadow-editorial hover:border-editorial-primary/40 hover:shadow-editorial-lift hover:-translate-y-0.5 transition-all duration-300">
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-editorial-beige">
        {city.image_url ? (
          <img
            src={city.image_url}
            alt={city.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
          />
        ) : (
          /* Same deliberate empty cover as the activity card. */
          <div className="w-full h-full flex items-center justify-center bg-editorial-beige">
            <span className="font-headline-lg text-[64px] leading-none text-editorial-muted select-none">
              {city.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        <span className="absolute top-4 left-4 px-2.5 py-1 rounded-image bg-editorial-beige/95 backdrop-blur-sm font-label-sm text-label-sm uppercase text-editorial-secondary">
          Destination
        </span>
      </div>

      <div className="flex flex-col gap-3 p-6 flex-1">
        <span className="font-label-sm text-label-sm uppercase text-editorial-secondary">
          {city.country}
        </span>

        <h3 className="font-headline-md text-[28px] leading-[1.15] text-editorial-primary">
          {city.name}
        </h3>

        <p className="font-body-md text-body-md text-editorial-secondary line-clamp-2">
          {describe(city)}
        </p>

        <div className="mt-auto pt-4 border-t border-editorial-border flex items-center justify-between gap-4">
          <span className="font-label-sm text-label-sm uppercase text-editorial-secondary">
            {city.cost_index != null ? `Cost index ${city.cost_index}` : "Cost index —"}
          </span>

          <button
            type="button"
            onClick={onExplore}
            className="flex items-center gap-2 px-4 py-2.5 rounded-control bg-transparent border border-editorial-primary font-label-sm text-label-sm uppercase text-editorial-primary hover:bg-editorial-primary hover:text-white transition-colors"
          >
            Explore City
            <span className="material-symbols-outlined text-[16px] group-hover:translate-x-0.5 transition-transform">
              arrow_forward
            </span>
          </button>
        </div>
      </div>
    </article>
  );
}

/**
 * The catalogue has no per-city blurb (CONTRACTS §2 — CityRead is name,
 * country, coordinates, cost index, popularity). Rather than invent copy or
 * leave a hole in the card, the line states what the record actually says.
 */
function describe(city: City): string {
  const parts = [`${city.name}, ${city.country}`];
  if (city.popularity != null) parts.push(`popularity ${city.popularity}`);
  parts.push(`${city.latitude.toFixed(2)}°, ${city.longitude.toFixed(2)}°`);
  return parts.join(" · ");
}
