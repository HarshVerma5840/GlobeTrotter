/**
 * Explore — Activity Search / City Search (Screen 8).
 *
 * Layout: heading, search bar, Activities/Cities toggle, Group By / Filter /
 * Sort By, result count, two-column result grid, Load More. The chrome comes
 * from Layout (Header + Footer).
 *
 * Theme: warm ivory page, white cards, black type and black primary buttons,
 * warm beige for labels and hover fills, EB Garamond for every title. There
 * is no accent hue in this screen and there should never be one — the colour
 * is supplied entirely by the travel photography. Anything blue, purple or
 * cool-grey here is drift, not design.
 *
 * Data: `GET /activities` and `GET /cities` (CONTRACTS §4). Cities are sorted
 * server-side because the route takes a `sort` param; activities are not,
 * because it doesn't — so that ordering is applied on the client rather than
 * inventing a query param the backend doesn't document.
 */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { api } from "../api/endpoints";
import ActivityResultCard from "../components/search/ActivityResultCard";
import AddToTripDialog from "../components/search/AddToTripDialog";
import CityResultCard from "../components/search/CityResultCard";
import ControlMenu, { MenuOption, MenuSection } from "../components/search/ControlMenu";
import { ACTIVITY_CATEGORIES } from "../types/models";
import type { Activity, ActivityCategory, City } from "../types/models";

type Tab = "activities" | "cities";

const PAGE_SIZE = 12;

/** `limit` is capped at 200 server-side; Load More must not walk past it. */
const MAX_RESULTS = 192;

const CATEGORY_LABEL: Record<string, string> = {
  sightseeing: "Sightseeing",
  food: "Food",
  adventure: "Adventure",
  transport: "Transport",
  stay: "Stay",
  other: "Other",
};

const COST_CAPS = [
  { label: "Any budget", value: null },
  { label: "Under $50", value: 50 },
  { label: "Under $100", value: 100 },
  { label: "Under $250", value: 250 },
  { label: "Under $500", value: 500 },
] as const;

const ACTIVITY_SORTS = [
  { key: "name", label: "Name (A–Z)" },
  { key: "cost", label: "Price (low to high)" },
  { key: "duration", label: "Duration (shortest first)" },
] as const;

const CITY_SORTS = [
  { key: "popularity", label: "Most popular" },
  { key: "cost", label: "Cost (low to high)" },
  { key: "name", label: "Name (A–Z)" },
] as const;

type ActivitySort = (typeof ACTIVITY_SORTS)[number]["key"];
type CitySort = (typeof CITY_SORTS)[number]["key"];

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();

  const tab: Tab = searchParams.get("tab") === "cities" ? "cities" : "activities";
  const cityFilter = searchParams.get("city");

  // The text in the box vs the term actually applied. Keeping them apart is
  // what makes this a search bar with a Search button rather than a filter
  // that refetches on every keystroke.
  const [draftQuery, setDraftQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");

  const [category, setCategory] = useState<ActivityCategory | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [costMax, setCostMax] = useState<number | null>(null);
  const [groupBy, setGroupBy] = useState<string>("none");
  const [activitySort, setActivitySort] = useState<ActivitySort>("name");
  const [citySort, setCitySort] = useState<CitySort>("popularity");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [pendingActivity, setPendingActivity] = useState<Activity | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  /*
   * The whole city catalogue, fetched once. Activities carry a `city_id` but
   * no city name (CONTRACTS §4), so this is what lets an activity card show
   * where it is and what makes "group by city" possible at all.
   */
  const catalogQuery = useQuery({
    queryKey: ["cities", "catalog"],
    queryFn: () => api.cities.search({ limit: 200, sort: "name" }),
    staleTime: 10 * 60 * 1000,
  });
  const cityById = useMemo(() => {
    const map = new Map<string, City>();
    for (const city of catalogQuery.data ?? []) map.set(city.id, city);
    return map;
  }, [catalogQuery.data]);

  const countries = useMemo(
    () => [...new Set((catalogQuery.data ?? []).map((c) => c.country))].sort(),
    [catalogQuery.data],
  );

  // Ask for one more than we show: if it comes back, there is another page.
  const fetchLimit = Math.min(visibleCount + 1, MAX_RESULTS + 1);

  const activitiesQuery = useQuery({
    queryKey: ["activities", { q: appliedQuery, category, costMax, cityFilter, fetchLimit }],
    queryFn: () =>
      api.activities.search({
        q: appliedQuery || undefined,
        category: category ?? undefined,
        cost_max: costMax ?? undefined,
        city_id: cityFilter ?? undefined,
        limit: fetchLimit,
      }),
    enabled: tab === "activities",
  });

  const citiesQuery = useQuery({
    queryKey: ["cities", { q: appliedQuery, country, costMax, citySort, fetchLimit }],
    queryFn: () =>
      api.cities.search({
        q: appliedQuery || undefined,
        country: country ?? undefined,
        cost_max: costMax ?? undefined,
        sort: citySort,
        limit: fetchLimit,
      }),
    enabled: tab === "cities",
  });

  const activeQuery = tab === "activities" ? activitiesQuery : citiesQuery;
  const rows = activeQuery.data ?? [];
  const hasMore = rows.length > visibleCount && visibleCount < MAX_RESULTS;

  const activities = useMemo(() => {
    if (tab !== "activities") return [];
    const page = (activitiesQuery.data ?? []).slice(0, visibleCount);
    return [...page].sort((a, b) => {
      if (activitySort === "cost") return Number(a.cost ?? 0) - Number(b.cost ?? 0);
      if (activitySort === "duration") {
        return (a.duration_hours ?? Infinity) - (b.duration_hours ?? Infinity);
      }
      return a.name.localeCompare(b.name);
    });
  }, [tab, activitiesQuery.data, visibleCount, activitySort]);

  const cities = useMemo(
    () => (tab === "cities" ? (citiesQuery.data ?? []).slice(0, visibleCount) : []),
    [tab, citiesQuery.data, visibleCount],
  );

  const resultCount = tab === "activities" ? activities.length : cities.length;

  /** Group headings. "none" collapses to a single unlabelled group. */
  const grouped = useMemo(() => {
    if (groupBy === "none") {
      return [{ title: null as string | null, activities, cities }];
    }

    const buckets = new Map<string, { activities: Activity[]; cities: City[] }>();
    const bucket = (key: string) => {
      if (!buckets.has(key)) buckets.set(key, { activities: [], cities: [] });
      return buckets.get(key)!;
    };

    if (tab === "activities") {
      for (const activity of activities) {
        const key =
          groupBy === "category"
            ? (CATEGORY_LABEL[activity.category] ?? activity.category)
            : (cityById.get(activity.city_id)?.name ?? "Elsewhere");
        bucket(key).activities.push(activity);
      }
    } else {
      for (const city of cities) bucket(city.country).cities.push(city);
    }

    return [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([title, value]) => ({ title, ...value }));
  }, [groupBy, tab, activities, cities, cityById]);

  /** Any change to the query shape restarts paging — otherwise page 3 of the
      old search silently becomes page 3 of the new one. */
  function resetPaging() {
    setVisibleCount(PAGE_SIZE);
  }

  function switchTab(next: Tab) {
    const params = new URLSearchParams(searchParams);
    params.set("tab", next);
    params.delete("city");
    setSearchParams(params, { replace: true });
    setGroupBy("none");
    setCategory(null);
    setCountry(null);
    setCostMax(null);
    resetPaging();
  }

  function exploreCity(city: City) {
    const params = new URLSearchParams();
    params.set("tab", "activities");
    params.set("city", city.id);
    setSearchParams(params);
    setGroupBy("none");
    setCategory(null);
    setCostMax(null);
    setDraftQuery("");
    setAppliedQuery("");
    resetPaging();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clearCityFilter() {
    const params = new URLSearchParams(searchParams);
    params.delete("city");
    setSearchParams(params, { replace: true });
    resetPaging();
  }

  const groupOptions =
    tab === "activities"
      ? [
          { key: "none", label: "None" },
          { key: "category", label: "Category" },
          { key: "city", label: "City" },
        ]
      : [
          { key: "none", label: "None" },
          { key: "country", label: "Country" },
        ];

  const groupLabel = groupOptions.find((o) => o.key === groupBy)?.label;
  const filterCount = [category, country, costMax].filter((v) => v != null).length;
  const sortLabel =
    tab === "activities"
      ? ACTIVITY_SORTS.find((s) => s.key === activitySort)?.label
      : CITY_SORTS.find((s) => s.key === citySort)?.label;

  const focusedCity = cityFilter ? cityById.get(cityFilter) : undefined;

  return (
    <div className="w-full min-h-screen bg-editorial-bg px-margin-mobile md:px-margin-tablet lg:px-margin-desktop py-12 lg:py-16">
      <div className="max-w-[1440px] mx-auto flex flex-col gap-10">
        {/* ── Heading ──────────────────────────────────────────────── */}
        <header className="flex flex-col gap-4 max-w-3xl">
          <h1 className="font-display-xl text-[44px] md:text-[64px] leading-[1.05] tracking-tight text-editorial-primary">
            Discover Experiences
          </h1>
          <p className="font-body-lg text-body-lg text-editorial-secondary">
            Find activities and destinations worth adding to your curated journey.
          </p>
        </header>

        {/* ── Search ───────────────────────────────────────────────── */}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setAppliedQuery(draftQuery.trim());
            resetPaging();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-editorial-secondary pointer-events-none">
              search
            </span>
            <input
              type="search"
              value={draftQuery}
              onChange={(event) => setDraftQuery(event.target.value)}
              placeholder={
                tab === "activities"
                  ? "Search experiences — paragliding, temples, tasting menus…"
                  : "Search destinations — Tokyo, Italy, Reykjavík…"
              }
              className="w-full h-[52px] pl-12 pr-4 rounded-control bg-editorial-card border border-editorial-border text-editorial-primary font-body-md text-body-md placeholder:text-editorial-muted focus:outline-none focus:border-editorial-primary transition-colors"
            />
          </div>
          <button
            type="submit"
            className="h-[52px] px-10 rounded-control bg-editorial-primary text-white font-label-lg text-label-lg uppercase hover:bg-black transition-colors"
          >
            Search
          </button>
        </form>

        {/* ── Activities / Cities ──────────────────────────────────── */}
        <div className="flex items-center gap-8 border-b border-editorial-border">
          {(
            [
              ["activities", "Activities"],
              ["cities", "Cities"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => switchTab(key)}
              className={`relative pb-4 font-label-lg text-label-lg uppercase transition-colors ${
                tab === key
                  ? "text-editorial-primary"
                  : "text-editorial-muted hover:text-editorial-secondary"
              }`}
            >
              {label}
              {tab === key && (
                <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-editorial-primary" />
              )}
            </button>
          ))}
        </div>

        {/* ── Group By / Filter / Sort By + result count ───────────── */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <ControlMenu
              label="Group By"
              icon="workspaces"
              active={groupBy !== "none"}
              value={groupBy === "none" ? null : groupLabel}
            >
              {groupOptions.map((option) => (
                <MenuOption
                  key={option.key}
                  label={option.label}
                  selected={groupBy === option.key}
                  onSelect={() => setGroupBy(option.key)}
                />
              ))}
            </ControlMenu>

            <ControlMenu
              label="Filter"
              icon="tune"
              active={filterCount > 0}
              value={filterCount > 0 ? String(filterCount) : null}
            >
              {tab === "activities" ? (
                <MenuSection title="Category">
                  <MenuOption
                    label="All categories"
                    selected={category === null}
                    onSelect={() => {
                      setCategory(null);
                      resetPaging();
                    }}
                  />
                  {ACTIVITY_CATEGORIES.map((value) => (
                    <MenuOption
                      key={value}
                      label={CATEGORY_LABEL[value]}
                      selected={category === value}
                      onSelect={() => {
                        setCategory(value);
                        resetPaging();
                      }}
                    />
                  ))}
                </MenuSection>
              ) : (
                <MenuSection title="Country">
                  <MenuOption
                    label="All countries"
                    selected={country === null}
                    onSelect={() => {
                      setCountry(null);
                      resetPaging();
                    }}
                  />
                  {countries.map((value) => (
                    <MenuOption
                      key={value}
                      label={value}
                      selected={country === value}
                      onSelect={() => {
                        setCountry(value);
                        resetPaging();
                      }}
                    />
                  ))}
                </MenuSection>
              )}

              <MenuSection title={tab === "activities" ? "Budget" : "Cost index"}>
                {COST_CAPS.map((cap) => (
                  <MenuOption
                    key={cap.label}
                    label={cap.label}
                    selected={costMax === cap.value}
                    onSelect={() => {
                      setCostMax(cap.value);
                      resetPaging();
                    }}
                  />
                ))}
              </MenuSection>
            </ControlMenu>

            <ControlMenu label="Sort By" icon="sort" active value={sortLabel}>
              {tab === "activities"
                ? ACTIVITY_SORTS.map((option) => (
                    <MenuOption
                      key={option.key}
                      label={option.label}
                      selected={activitySort === option.key}
                      onSelect={() => setActivitySort(option.key)}
                    />
                  ))
                : CITY_SORTS.map((option) => (
                    <MenuOption
                      key={option.key}
                      label={option.label}
                      selected={citySort === option.key}
                      onSelect={() => {
                        setCitySort(option.key);
                        resetPaging();
                      }}
                    />
                  ))}
            </ControlMenu>

            {focusedCity && (
              <button
                type="button"
                onClick={clearCityFilter}
                className="flex items-center gap-2 px-4 py-2.5 rounded-control bg-editorial-beige border border-editorial-border font-label-sm text-label-sm uppercase text-editorial-secondary hover:text-editorial-primary transition-colors"
              >
                {focusedCity.name}
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          <span className="font-body-md text-[14px] text-editorial-secondary">
            {activeQuery.isLoading
              ? "Searching…"
              : `${resultCount}${hasMore ? "+" : ""} ${
                  tab === "activities"
                    ? resultCount === 1
                      ? "experience"
                      : "experiences"
                    : resultCount === 1
                      ? "destination"
                      : "destinations"
                } found`}
          </span>
        </div>

        {/* ── Results ──────────────────────────────────────────────── */}
        {activeQuery.isError && (
          <p
            role="alert"
            className="px-4 py-3 rounded-control bg-error-container text-on-error-container font-body-md text-body-md"
          >
            Could not load results. Is the API running?
          </p>
        )}

        {!activeQuery.isLoading && !activeQuery.isError && resultCount === 0 && (
          <div className="py-20 flex flex-col items-center gap-3 text-center">
            <span className="material-symbols-outlined text-[36px] text-editorial-muted">
              travel_explore
            </span>
            <h2 className="font-headline-md text-headline-md text-editorial-primary">
              Nothing matches yet
            </h2>
            <p className="font-body-md text-body-md text-editorial-secondary max-w-sm">
              Try a broader search term, or clear a filter to widen the field.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-12">
          {grouped.map((group, index) => {
            const isEmpty = group.activities.length === 0 && group.cities.length === 0;
            if (isEmpty) return null;

            return (
              <section key={group.title ?? `group-${index}`} className="flex flex-col gap-6">
                {group.title && (
                  <div className="flex items-baseline gap-4">
                    <h2 className="font-headline-md text-[26px] text-editorial-primary">
                      {group.title}
                    </h2>
                    <span className="flex-1 h-px bg-editorial-border" />
                    <span className="font-label-sm text-label-sm uppercase text-editorial-muted">
                      {group.activities.length + group.cities.length}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {group.activities.map((activity) => (
                    <ActivityResultCard
                      key={activity.id}
                      activity={activity}
                      city={cityById.get(activity.city_id)}
                      isAdded={addedIds.has(activity.id)}
                      isBusy={pendingActivity?.id === activity.id}
                      onAdd={() => setPendingActivity(activity)}
                    />
                  ))}
                  {group.cities.map((city) => (
                    <CityResultCard
                      key={city.id}
                      city={city}
                      onExplore={() => exploreCity(city)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {hasMore && (
          <div className="flex justify-center pt-4">
            <button
              type="button"
              onClick={() => setVisibleCount((count) => Math.min(count + PAGE_SIZE, MAX_RESULTS))}
              disabled={activeQuery.isFetching}
              className="px-10 py-3.5 rounded-control bg-editorial-card border border-editorial-primary font-label-lg text-label-lg uppercase text-editorial-primary hover:bg-editorial-primary hover:text-white transition-colors disabled:opacity-50"
            >
              {activeQuery.isFetching ? "Loading…" : "Load More"}
            </button>
          </div>
        )}
      </div>

      {pendingActivity && (
        <AddToTripDialog
          activity={pendingActivity}
          onClose={() => setPendingActivity(null)}
          onAdded={(id) => setAddedIds((prev) => new Set(prev).add(id))}
        />
      )}
    </div>
  );
}
