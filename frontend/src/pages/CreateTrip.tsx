import { useState, useMemo } from "react";
import TripDetailsForm from "../components/create-trip/TripDetailsForm";
import DestinationSelector from "../components/create-trip/DestinationSelector";
import DateSelector from "../components/create-trip/DateSelector";
import ActivitySuggestionsGrid from "../components/create-trip/ActivitySuggestionsGrid";
import TripSummary from "../components/create-trip/TripSummary";
import { TOKYO_ACTIVITIES } from "../data/createTripData";

/**
 * Create Trip page — the second page from the Stitch mockups.
 *
 * Two-column layout:
 *   Left (70%): Trip form fields + destination + dates + curated activities
 *   Right (30%): Sticky itinerary summary sidebar with live cost calculation
 */
export default function CreateTrip() {
  const [tripName, setTripName] = useState("");
  const [description, setDescription] = useState("");

  // Track which activities are added to the trip
  const [addedIds, setAddedIds] = useState<Set<string>>(() => {
    // Pre-populate with initially added activities from mockup data
    const initial = new Set<string>();
    TOKYO_ACTIVITIES.forEach((a) => {
      if (a.initiallyAdded) initial.add(a.id);
    });
    return initial;
  });

  const toggleActivity = (id: string) => {
    setAddedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Compute estimated total from added activities
  const estimatedTotal = useMemo(() => {
    let total = 0;
    TOKYO_ACTIVITIES.forEach((a) => {
      if (addedIds.has(a.id)) {
        const match = a.cost.match(/\$(\d+)/);
        if (match) total += parseInt(match[1], 10);
      }
    });
    return `$${total.toFixed(2)}`;
  }, [addedIds]);

  const handleCreateTrip = () => {
    // Future: call api.trips.create() with the form data
    console.log("Creating trip:", {
      name: tripName,
      description,
      addedActivities: Array.from(addedIds),
    });
  };

  return (
    <div className="w-full flex-1 flex flex-col items-center relative bg-editorial-bg px-6 md:px-12 py-10">
      <div className="w-full max-w-[1500px] flex flex-col lg:flex-row gap-10 lg:gap-12">
        {/* Left Column (75%) */}
        <main className="w-full lg:w-[75%] flex flex-col gap-12">
          {/* Page header */}
          <header className="flex flex-col gap-4">
            <h1
              className="text-[48px] lg:text-[64px] leading-[1.05] font-medium text-editorial-primary tracking-tight"
              style={{ fontFamily: "'EB Garamond', serif" }}
            >
              Create a New Trip
            </h1>
            <p className="font-body-lg text-body-lg text-editorial-secondary max-w-2xl mt-4">
              Design your perfect itinerary with Aether Editorial precision.
            </p>
          </header>

          {/* Trip details */}
          <TripDetailsForm
            tripName={tripName}
            onTripNameChange={setTripName}
            description={description}
            onDescriptionChange={setDescription}
          />

          {/* Destination */}
          <DestinationSelector selectedCity="Tokyo" />

          {/* Dates */}
          <DateSelector
            departureDate="Oct 12, 2024"
            returnDate="Oct 20, 2024"
            durationLabel="9 Days · 8 Nights"
          />

          {/* Activity suggestions */}
          <ActivitySuggestionsGrid
            addedIds={addedIds}
            onToggleActivity={toggleActivity}
            cityName="Tokyo"
          />
        </main>

        {/* Right Column (30%) — Sticky Summary */}
        <TripSummary
          tripName={tripName || "Kyoto Autumn Retreat"}
          destination="Tokyo, Japan"
          dateRange="Oct 12 — Oct 20"
          activitiesCount={addedIds.size}
          estimatedTotal={estimatedTotal}
          onCreateTrip={handleCreateTrip}
        />
      </div>
    </div>
  );
}
