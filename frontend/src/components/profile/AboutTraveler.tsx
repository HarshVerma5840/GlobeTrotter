import type { UserProfile } from "../../data/profileData";

interface AboutTravelerProps {
  profile: UserProfile;
}

export default function AboutTraveler({ profile }: AboutTravelerProps) {
  const fields = [
    { label: "Full Name", value: profile.fullName },
    { label: "Email", value: profile.email },
    { label: "Phone", value: profile.phone },
    { label: "Location", value: profile.location },
  ];

  return (
    <section className="lg:col-span-8 flex flex-col gap-8">
      <h2 className="font-headline-md text-2xl border-b border-outline-variant/20 pb-4">
        About the Traveler
      </h2>

      {/* Info grid */}
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

      {/* Travel Preferences */}
      <div className="mt-4">
        <h3 className="font-headline-md text-xl mb-4">Travel Preferences</h3>
        <div className="flex flex-wrap gap-3">
          {profile.preferences.map((pref) => (
            <span
              key={pref}
              className="px-4 py-2 bg-sand-accent text-ink-charcoal font-label-sm uppercase tracking-wider rounded-full cursor-pointer hover:bg-outline-variant/20 transition-colors"
            >
              {pref}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
