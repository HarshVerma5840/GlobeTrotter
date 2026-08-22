import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { api } from "../../api/endpoints";
import type { City } from "../../types/models";

interface DestinationSelectorProps {
  selectedCity: City | null;
  onSelect: (city: City) => void;
  onClear: () => void;
}

/**
 * Real GET /cities search, replacing the mock's hard-coded Tokyo card.
 * Selecting a result calls onSelect with the real `City` — its id is what
 * the trip's stop gets created against (CreateTrip.tsx).
 */
export default function DestinationSelector({
  selectedCity,
  onSelect,
  onClear,
}: DestinationSelectorProps) {
  const [query, setQuery] = useState("");

  const searchQuery = useQuery({
    queryKey: ["cities", { q: query }],
    queryFn: () => api.cities.search({ q: query || undefined, sort: "popularity", limit: 8 }),
    enabled: !selectedCity,
  });

  const results = searchQuery.data ?? [];

  return (
    <section className="flex flex-col gap-6">
      <h2
        className="text-[32px] lg:text-[40px] leading-tight text-editorial-primary tracking-tight"
        style={{ fontFamily: "'EB Garamond', serif" }}
      >
        Where are you going?
      </h2>

      {!selectedCity && (
        <>
          <div className="relative group bg-editorial-beige rounded-xl p-2 flex items-center">
            <span className="material-symbols-outlined absolute left-8 top-1/2 -translate-y-1/2 text-editorial-secondary text-2xl">
              search
            </span>
            <input
              id="destination-search"
              className="w-full bg-transparent border-none pl-16 pr-6 py-4 font-body-lg text-body-lg focus:ring-0 focus:outline-none transition-all placeholder:text-editorial-secondary/70"
              placeholder="Search for a city or destination"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>

          {searchQuery.isPending && (
            <p className="font-body-md text-body-md text-editorial-secondary">Loading destinations…</p>
          )}
          {searchQuery.isSuccess && results.length === 0 && (
            <p className="font-body-md text-body-md text-editorial-secondary">
              No destinations match “{query}”.
            </p>
          )}

          {results.length > 0 && (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {results.map((city) => (
                <li key={city.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(city)}
                    className="w-full text-left flex items-center justify-between gap-4 bg-editorial-card border border-editorial-border rounded-lg px-6 py-4 hover:border-editorial-primary transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-editorial-secondary">
                        location_on
                      </span>
                      <span
                        className="text-xl text-editorial-primary"
                        style={{ fontFamily: "'EB Garamond', serif" }}
                      >
                        {city.name}, {city.country}
                      </span>
                    </span>
                    <span className="material-symbols-outlined text-editorial-secondary">
                      arrow_forward
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {selectedCity && (
        <div className="w-full rounded-2xl overflow-hidden relative aspect-[21/9] mt-2 bg-editorial-beige">
          {selectedCity.image_url ? (
            <img
              alt={`${selectedCity.name} landscape`}
              className="absolute inset-0 w-full h-full object-cover"
              src={selectedCity.image_url}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="material-symbols-outlined text-[64px] text-editorial-secondary/40">
                landscape
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-8 md:p-12">
            <div className="flex items-end justify-between w-full">
              <div className="flex items-center gap-6">
                <span className="material-symbols-outlined text-white text-5xl drop-shadow-lg">
                  location_on
                </span>
                <div>
                  <h3
                    className="text-[36px] leading-tight text-white drop-shadow-md"
                    style={{ fontFamily: "'EB Garamond', serif" }}
                  >
                    {selectedCity.name}, {selectedCity.country}
                  </h3>
                  <p className="text-[11px] font-bold text-white/80 uppercase tracking-[0.15em] mt-3">
                    Selected Destination
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClear}
                className="text-[11px] font-bold text-white uppercase tracking-[0.15em] border-b-2 border-white pb-1 hover:text-white/70 hover:border-white/70 transition-all drop-shadow-md"
              >
                Change
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
