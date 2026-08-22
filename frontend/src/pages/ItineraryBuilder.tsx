import { useState } from "react";
import AppSidebar from "../components/itinerary-builder/AppSidebar";
import TimelineSidebar from "../components/itinerary-builder/TimelineSidebar";
import DaySchedule from "../components/itinerary-builder/DaySchedule";
import ActivityLibrary from "../components/itinerary-builder/ActivityLibrary";
import {
  TRIP_HEADER,
  ITINERARY_DAYS,
  ACTIVE_DAY,
  TIME_SLOTS,
  MAP_IMAGE_URL,
} from "../data/itineraryBuilderData";

/**
 * Itinerary Builder page — the third Stitch mockup.
 *
 * Uses a completely different layout from Dashboard/CreateTrip:
 *   - Fixed left app sidebar (nav)
 *   - Main content area offset by sidebar width (pl-72)
 *   - 3-column workspace: Timeline | Day Schedule | Activity Library
 *   - Own fixed top bar (notifications/settings)
 *
 * Because this page has its own sidebar+topbar chrome, it does NOT use
 * the shared Layout component — it renders outside the Layout route.
 */
export default function ItineraryBuilder() {
  const [activeDayNumber, setActiveDayNumber] = useState(1);
  const [showMap, setShowMap] = useState(false);

  return (
    <div className="bg-background-cream font-body-md text-on-surface min-h-screen">
      {/* Fixed app sidebar */}
      <AppSidebar />

      {/* Content offset by sidebar width */}
      <div className="pl-72">
        {/* Top bar */}
        <header className="fixed top-0 left-72 right-0 h-20 bg-glass-white backdrop-blur-xl z-40 flex items-center justify-end px-margin-desktop gap-gutter">
          <button className="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </header>

        {/* Main content */}
        <main className="relative pt-20 bg-background-cream min-h-screen px-margin-desktop pb-section-v-gap">
          <div className="flex flex-col w-full h-full relative">
            {/* Trip header */}
            <header className="w-full flex items-end justify-between pb-content-v-gap border-b border-outline-variant/30 relative z-10 mb-12">
              <div className="flex flex-col gap-4">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest bg-sand-accent w-fit px-3 py-1 rounded-full">
                  {TRIP_HEADER.badge}
                </span>
                <h1 className="font-display-xl text-display-xl text-premium-navy">
                  {TRIP_HEADER.title}
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
                  {TRIP_HEADER.description}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button className="bg-glass-white backdrop-blur-md px-6 py-3 rounded-full text-premium-navy border border-premium-navy/20 flex items-center gap-2 hover:bg-surface-container-high transition-colors font-label-lg text-label-lg">
                  <span className="material-symbols-outlined text-[20px]">
                    share
                  </span>
                  Share Itinerary
                </button>
                <button className="bg-premium-navy text-background-cream px-6 py-3 rounded-full flex items-center gap-2 shadow-lg hover:shadow-xl transition-all font-label-lg text-label-lg">
                  <span className="material-symbols-outlined text-[20px]">
                    check
                  </span>
                  Finalize Trip
                </button>
              </div>
            </header>

            {/* 3-column workspace */}
            <div className="flex flex-row gap-gutter h-[calc(100vh-280px)] w-full">
              {/* Left: Timeline */}
              <TimelineSidebar
                days={ITINERARY_DAYS}
                activeDayNumber={activeDayNumber}
                onSelectDay={setActiveDayNumber}
              />

              {/* Center: Day schedule */}
              <div className="flex-1 flex flex-col h-full relative">
                {/* Map overlay */}
                {showMap && (
                  <div className="absolute inset-0 bg-background-cream z-20 flex flex-col rounded-2xl overflow-hidden shadow-sm">
                    <div className="w-full h-full relative">
                      <div
                        className="w-full h-full bg-cover bg-center"
                        style={{ backgroundImage: `url('${MAP_IMAGE_URL}')` }}
                      />
                      <button
                        onClick={() => setShowMap(false)}
                        className="absolute top-6 right-6 bg-glass-white backdrop-blur-xl p-3 rounded-full shadow-lg text-premium-navy hover:bg-surface-container-high transition-colors"
                      >
                        <span className="material-symbols-outlined text-[24px]">
                          close
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                <DaySchedule
                  dayTitle={ACTIVE_DAY.title}
                  daySubtitle={ACTIVE_DAY.subtitle}
                  timeSlots={TIME_SLOTS}
                  onOpenMap={() => setShowMap(true)}
                />
              </div>

              {/* Right: Activity Library */}
              <ActivityLibrary />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
