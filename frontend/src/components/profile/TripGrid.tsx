import { Link } from "react-router-dom";

/**
 * Card shape both variants render. Built from a real `Trip` in Profile.tsx
 * (never re-declared as backend fields — INTEGRATION.md rule 4);
 * `imageUrl` is optional because `Trip.cover_image_url` can be null.
 */
export interface ProfileTripCard {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string | null;
  dateBadge?: string;
  locationTag?: string;
}

interface TripGridProps {
  title: string;
  linkLabel: string;
  linkHref: string;
  trips: ProfileTripCard[];
  variant: "preplanned" | "archive";
  emptyLabel: string;
}

function CardImage({ trip }: { trip: ProfileTripCard }) {
  if (trip.imageUrl) {
    return (
      <div
        className="bg-cover bg-center w-full h-full group-hover:scale-105 transition-transform duration-700"
        style={{ backgroundImage: `url('${trip.imageUrl}')` }}
      />
    );
  }
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface-container-high to-secondary-fixed-dim">
      <span className="material-symbols-outlined text-[36px] text-on-surface-variant/40">
        landscape
      </span>
    </div>
  );
}

function PreplannedCard({ trip }: { trip: ProfileTripCard }) {
  return (
    <article className="group cursor-pointer bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 ease-out flex flex-col hover:-translate-y-2">
      <div className="w-full h-64 overflow-hidden relative">
        <CardImage trip={trip} />
        {trip.dateBadge && (
          <div className="absolute top-4 right-4 px-3 py-1 bg-glass-white backdrop-blur-md rounded-full font-label-sm text-primary uppercase tracking-widest">
            {trip.dateBadge}
          </div>
        )}
      </div>
      <div className="p-6 flex flex-col grow">
        <h3 className="font-headline-md text-2xl mb-2">{trip.title}</h3>
        <p className="font-body-md text-on-surface-variant mb-6 flex-grow">{trip.subtitle}</p>
        <Link to={`/trips/${trip.id}`} className="flex items-center justify-between mt-auto">
          <span className="font-label-lg text-premium-navy group-hover:text-primary transition-colors">
            View Trip
          </span>
          <span className="material-symbols-outlined text-premium-navy group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </Link>
      </div>
    </article>
  );
}

function ArchiveCard({ trip }: { trip: ProfileTripCard }) {
  return (
    <Link
      to={`/trips/${trip.id}`}
      className="group cursor-pointer bg-surface-container rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-500 ease-out flex flex-col"
    >
      <div className="w-full h-48 overflow-hidden grayscale-[30%] group-hover:grayscale-0 transition-all duration-700">
        <CardImage trip={trip} />
      </div>
      <div className="p-6 flex flex-col grow">
        <h3 className="font-headline-md text-xl mb-1">{trip.title}</h3>
        <p className="font-body-md text-on-surface-variant mb-4 flex-grow text-sm">
          {trip.subtitle}
        </p>
        {trip.locationTag && (
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-outline-variant/20 rounded text-[10px] uppercase font-bold text-on-surface-variant">
              {trip.locationTag}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

export default function TripGrid({
  title,
  linkLabel,
  linkHref,
  trips,
  variant,
  emptyLabel,
}: TripGridProps) {
  return (
    <section className={`flex flex-col gap-12 ${variant === "archive" ? "mb-24" : ""}`}>
      <div className="flex justify-between items-end border-b border-outline-variant/20 pb-4">
        <h2 className="font-headline-md text-3xl">{title}</h2>
        <Link
          className="font-label-lg text-primary hover:text-on-surface-variant transition-colors flex items-center gap-1"
          to={linkHref}
        >
          {linkLabel} <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </Link>
      </div>

      {trips.length === 0 ? (
        <p className="font-body-md text-body-md text-on-surface-variant">{emptyLabel}</p>
      ) : (
        <div
          className={`grid grid-cols-1 md:grid-cols-3 gap-8 ${
            variant === "archive" ? "opacity-90" : ""
          }`}
        >
          {trips.map((trip) =>
            variant === "preplanned" ? (
              <PreplannedCard key={trip.id} trip={trip} />
            ) : (
              <ArchiveCard key={trip.id} trip={trip} />
            ),
          )}
        </div>
      )}
    </section>
  );
}
