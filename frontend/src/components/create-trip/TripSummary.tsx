interface TripSummaryProps {
  tripName: string;
  destination: string;
  dateRange: string;
  activitiesCount: number;
  estimatedTotal: string;
  onCreateTrip: () => void;
}

export default function TripSummary({
  tripName,
  destination,
  dateRange,
  activitiesCount,
  estimatedTotal,
  onCreateTrip,
}: TripSummaryProps) {
  return (
    <aside className="w-full lg:w-[25%] lg:sticky lg:top-[100px] h-auto lg:h-fit flex flex-col">
      <div className="flex flex-col gap-6">
        {/* Trip header */}
        <div className="flex flex-col gap-3 pb-6 border-b border-editorial-border">
          <p className="text-[10px] font-bold text-editorial-secondary uppercase tracking-[0.2em]">
            Itinerary Summary
          </p>
          <h3
            className="text-3xl text-editorial-primary leading-tight"
            style={{ fontFamily: "'EB Garamond', serif" }}
          >
            {tripName || "Untitled Trip"}
          </h3>
          <p className="font-body-md text-body-md text-editorial-secondary mt-2">
            {destination}
          </p>
        </div>

        {/* Summary rows */}
        <div className="flex flex-col gap-5">
          <div className="flex justify-between items-end border-b border-editorial-border pb-4">
            <span className="text-[10px] font-bold text-editorial-secondary uppercase tracking-[0.2em]">
              Dates
            </span>
            <span
              className="text-2xl text-editorial-primary"
              style={{ fontFamily: "'EB Garamond', serif" }}
            >
              {dateRange}
            </span>
          </div>

          <div className="flex justify-between items-end border-b border-editorial-border pb-4">
            <span className="text-[10px] font-bold text-editorial-secondary uppercase tracking-[0.2em]">
              Activities
            </span>
            <span
              className="text-2xl text-editorial-primary"
              style={{ fontFamily: "'EB Garamond', serif" }}
            >
              {activitiesCount} Selected
            </span>
          </div>

          <div className="flex justify-between items-end pb-2">
            <span className="text-[10px] font-bold text-editorial-secondary uppercase tracking-[0.2em]">
              Est. Total
            </span>
            <span
              className="text-4xl text-editorial-primary"
              style={{ fontFamily: "'EB Garamond', serif" }}
            >
              {estimatedTotal}
            </span>
          </div>
        </div>

        {/* Create Trip button */}
        <div className="mt-4">
          <button
            id="create-trip-button"
            onClick={onCreateTrip}
            className="w-full py-5 rounded-md bg-editorial-primary text-white text-[11px] font-semibold uppercase tracking-[0.2em] hover:bg-black transition-colors flex items-center justify-center gap-3"
          >
            Create Trip
            <span className="material-symbols-outlined text-[18px]">
              arrow_forward
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}
