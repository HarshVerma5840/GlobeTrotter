import ProfileHero from "../components/profile/ProfileHero";
import TravelStats from "../components/profile/TravelStats";
import AboutTraveler from "../components/profile/AboutTraveler";
import MembershipCard from "../components/profile/MembershipCard";
import TripGrid from "../components/profile/TripGrid";
import {
  USER_PROFILE,
  PREPLANNED_TRIPS,
  PREVIOUS_TRIPS,
} from "../data/profileData";

/**
 * Profile page — the fourth Stitch mockup.
 *
 * Uses the shared Layout (Header + Footer). Sections:
 *   - Profile hero with avatar + bio
 *   - Travel statistics (trips, destinations, countries)
 *   - About the Traveler + GlobeTrotter Status (2-column)
 *   - Preplanned Trips grid
 *   - Previous Trips archive grid
 */
export default function Profile() {
  return (
    <div className="max-w-[1440px] w-full mx-auto px-margin-mobile md:px-margin-desktop py-section-v-gap flex flex-col gap-24">
      {/* Hero */}
      <ProfileHero profile={USER_PROFILE} />

      {/* Stats */}
      <TravelStats stats={USER_PROFILE.stats} />

      {/* About + Membership (2-column) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        <AboutTraveler profile={USER_PROFILE} />
        <MembershipCard membership={USER_PROFILE.membership} />
      </div>

      {/* Preplanned Trips */}
      <TripGrid
        title="Preplanned Trips"
        linkLabel="View All"
        linkHref="#"
        trips={PREPLANNED_TRIPS}
        variant="preplanned"
      />

      {/* Previous Trips */}
      <TripGrid
        title="Previous Trips"
        linkLabel="View Archive"
        linkHref="#"
        trips={PREVIOUS_TRIPS}
        variant="archive"
      />
    </div>
  );
}
