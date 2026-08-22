import type { CityBrief, User } from "../../types/models";

interface AboutTravelerProps {
  user: User;
  memberSince: string;
}

/**
 * "Phone" and "Location" from the Stitch mock don't exist on `User`
 * (CONTRACTS §2) and are replaced with fields that do: `language` and
 * "member since" (derived from `created_at`).
 *
 * "Travel Preferences" tags are replaced with `saved_cities` — the one
 * real per-user preference signal the backend has (the "saved
 * destinations" join table, CONTRACTS §2).
 */
export default function AboutTraveler({ user, memberSince }: AboutTravelerProps) {
  const fields = [
    { label: "Full Name", value: user.name },
    { label: "Email", value: user.email },
    { label: "Language", value: user.language.toUpperCase() },
    { label: "Member Since", value: memberSince },
  ];

  return (
    <section className="lg:col-span-8 flex flex-col gap-8">
      <h2 className="font-headline-md text-2xl border-b border-outline-variant/20 pb-4">
        About the Traveler
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
        {fields.map((f) => (
          <div
            key={f.label}
            className="flex flex-col gap-1 border-b border-outline-variant/10 pb-4"
          >
            <span className="font-label-sm text-on-surface-variant uppercase tracking-wider">
              {f.label}
            </span>
            <span className="font-body-lg text-on-surface">{f.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <h3 className="font-headline-md text-xl mb-4">Saved Destinations</h3>
        {user.saved_cities.length === 0 ? (
          <p className="font-body-md text-body-md text-on-surface-variant">
            No saved destinations yet — save a city while exploring to see it here.
          </p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {user.saved_cities.map((city: CityBrief) => (
              <span
                key={city.id}
                className="px-4 py-2 bg-sand-accent text-ink-charcoal font-label-sm uppercase tracking-wider rounded-full"
              >
                {city.name}, {city.country}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
