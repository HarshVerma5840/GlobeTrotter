import { Link } from "react-router-dom";
import {
  ONGOING_TRIP,
  UPCOMING_TRIPS,
  ARCHIVED_TRIPS,
} from "../data/myTripsData";
import type { UpcomingTrip, ArchivedTrip } from "../data/myTripsData";

/* ────────────────────────────────────────────────────────────
   Section Divider
   ──────────────────────────────────────────────────────────── */
function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <span className="w-8 h-[1px] bg-outline-variant" />
      <h2 className="font-headline-md text-headline-md text-primary uppercase tracking-widest text-sm">
        {label}
      </h2>
      <span className="flex-grow h-[1px] bg-outline-variant" />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Ongoing Hero Card
   ──────────────────────────────────────────────────────────── */
function OngoingHero() {
  const trip = ONGOING_TRIP;
  return (
    <div className="relative w-full h-[600px] rounded-2xl overflow-hidden group cursor-pointer shadow-xl">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
        style={{ backgroundImage: `url('${trip.imageUrl}')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-premium-navy/80 via-premium-navy/20 to-transparent" />

      {/* Top badges */}
      <div className="absolute top-8 left-8 right-8 flex justify-between items-start">
        <div className="bg-glass-white backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 text-primary font-label-sm uppercase tracking-widest">
          <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
          Currently Traveling
        </div>
        <div className="bg-glass-white backdrop-blur-md px-4 py-2 rounded-full text-primary font-label-sm uppercase tracking-widest">
          {trip.dayProgress}
        </div>
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-8 left-8 right-8 flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h3 className="font-display-xl-mobile md:font-display-xl text-display-xl-mobile md:text-display-xl text-on-primary mb-2 leading-tight">
            {trip.title}
          </h3>
          <p className="font-body-lg text-body-lg text-inverse-on-surface opacity-90">
            {trip.destinations}
          </p>
        </div>
        <div className="text-right flex flex-col items-end">
          <p className="font-label-lg text-label-lg text-inverse-on-surface uppercase tracking-widest mb-4">
            {trip.dateRange}
          </p>
          <Link
            to="/trips/japan-autumn"
            className="bg-surface-container-lowest text-on-surface font-label-lg px-8 py-3 rounded-lg hover:bg-primary hover:text-on-primary transition-all duration-300 flex items-center gap-2"
          >
            View Itinerary
            <span className="material-symbols-outlined text-[20px] transition-transform duration-300 group-hover:translate-x-1">
              arrow_forward
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Upcoming Trip Card
   ──────────────────────────────────────────────────────────── */
function UpcomingCard({ trip }: { trip: UpcomingTrip }) {
  return (
    <Link
      to={`/trips/${trip.id}`}
      className="group block relative rounded-xl overflow-hidden bg-surface-container-lowest shadow-md hover:shadow-xl transition-all duration-500"
    >
      <div className="h-64 overflow-hidden relative">
        <img
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          src={trip.imageUrl}
          alt={trip.imageAlt}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-charcoal/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
          <span className="font-label-sm text-label-sm text-on-primary uppercase tracking-widest bg-glass-white backdrop-blur-md px-3 py-1 rounded-full">
            {trip.locationTag}
          </span>
          <span className="font-label-sm text-label-sm text-on-primary uppercase tracking-widest">
            {trip.durationLabel}
          </span>
        </div>
      </div>
      <div className="p-6 bg-surface-container-lowest relative">
        <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-2">
          {trip.dateRange}
        </p>
        <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-primary mb-2 group-hover:text-surface-tint transition-colors">
          {trip.title}
        </h3>
        <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2">
          {trip.description}
        </p>
        <div className="mt-6 flex items-center gap-2 text-primary font-label-lg group-hover:translate-x-2 transition-transform duration-300">
          View Details{" "}
          <span className="material-symbols-outlined text-[16px]">
            arrow_forward
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ────────────────────────────────────────────────────────────
   Plan Next Journey CTA
   ──────────────────────────────────────────────────────────── */
function PlanNextCTA() {
  return (
    <div className="relative rounded-xl overflow-hidden bg-surface-container-low shadow-sm flex flex-col justify-center items-center p-8 border-2 border-dashed border-outline-variant/30 group hover:border-primary/50 transition-colors">
      <span className="material-symbols-outlined text-display-xl-mobile text-outline-variant mb-4 group-hover:text-primary transition-colors">
        add_location_alt
      </span>
      <h3 className="font-headline-md text-headline-md text-primary mb-2 text-center">
        Plan Next Journey
      </h3>
      <p className="font-body-md text-body-md text-on-surface-variant text-center mb-6">
        Discover new destinations and curate your next story.
      </p>
      <Link
        to="/trips/new"
        className="bg-primary text-on-primary font-label-lg px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
      >
        Explore Destinations
      </Link>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Archived Trip Card
   ──────────────────────────────────────────────────────────── */
function ArchiveCard({ trip }: { trip: ArchivedTrip }) {
  return (
    <Link
      to={`/trips/${trip.id}`}
      className="group relative block overflow-hidden rounded-lg bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="aspect-[3/4] overflow-hidden relative">
        <img
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale group-hover:grayscale-0"
          src={trip.imageUrl}
          alt={trip.imageAlt}
        />
        <div className="absolute inset-0 bg-ink-charcoal/20 transition-opacity group-hover:opacity-0" />
      </div>
      <div className="p-4 bg-surface-container-lowest absolute bottom-0 w-full translate-y-4 group-hover:translate-y-0 transition-transform">
        <h3 className="font-headline-md text-headline-md text-primary mb-1">
          {trip.title}
        </h3>
        <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
          {trip.date}
        </p>
      </div>
    </Link>
  );
}

/* ────────────────────────────────────────────────────────────
   My Trips Page
   ──────────────────────────────────────────────────────────── */
export default function MyTrips() {
  return (
    <div className="flex flex-col w-full px-margin-mobile md:px-margin-tablet lg:px-margin-desktop max-w-[1440px] mx-auto pb-section-v-gap">
      {/* Page header */}
      <header className="pt-24 pb-16">
        <h1 className="font-display-xl-mobile md:font-display-xl text-display-xl-mobile md:text-display-xl text-primary mb-4">
          Your Journeys
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          A curated archive of your past explorations and an itinerary of those
          yet to unfold.
        </p>
      </header>

      {/* Control bar */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-surface-container-low rounded-xl p-4 shadow-sm mb-16 gap-4">
        <div className="relative w-full md:w-96">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            className="w-full bg-surface-container-lowest text-on-surface font-body-md py-3 pl-12 pr-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-fixed-dim transition-all shadow-sm"
            placeholder="Search your journeys..."
            type="text"
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest text-on-surface font-label-lg rounded-lg shadow-sm hover:bg-surface-container-high transition-colors whitespace-nowrap">
            <span className="material-symbols-outlined text-[20px]">sort</span>
            Sort by: Date
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest text-on-surface font-label-lg rounded-lg shadow-sm hover:bg-surface-container-high transition-colors whitespace-nowrap">
            <span className="material-symbols-outlined text-[20px]">
              filter_list
            </span>
            Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest text-on-surface font-label-lg rounded-lg shadow-sm hover:bg-surface-container-high transition-colors whitespace-nowrap">
            <span className="material-symbols-outlined text-[20px]">
              view_agenda
            </span>
            Group by: Status
          </button>
        </div>
      </div>

      {/* Ongoing */}
      <section className="mb-section-v-gap">
        <SectionDivider label="Ongoing" />
        <OngoingHero />
      </section>

      {/* Upcoming */}
      <section className="mb-section-v-gap">
        <SectionDivider label="Upcoming" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {UPCOMING_TRIPS.map((trip) => (
            <UpcomingCard key={trip.id} trip={trip} />
          ))}
          <PlanNextCTA />
        </div>
      </section>

      {/* Archived */}
      <section>
        <SectionDivider label="Archived" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
          {ARCHIVED_TRIPS.map((trip) => (
            <ArchiveCard key={trip.id} trip={trip} />
          ))}
        </div>
      </section>
    </div>
  );
}
