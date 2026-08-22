import { ITINERARY_DAYS } from "../../data/itineraryBuilderData";
import type { ItineraryDay } from "../../data/itineraryBuilderData";

interface TimelineSidebarProps {
  days: ItineraryDay[];
  activeDayNumber: number;
  onSelectDay: (dayNumber: number) => void;
}

export default function TimelineSidebar({
  days = ITINERARY_DAYS,
  activeDayNumber,
  onSelectDay,
}: TimelineSidebarProps) {
  return (
    <aside className="w-64 flex-shrink-0 flex flex-col h-full bg-surface-container-low rounded-2xl overflow-hidden relative shadow-sm">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-outline-variant/30 flex items-center justify-between z-10 bg-surface-container-low">
        <h2 className="font-headline-md text-headline-md text-premium-navy m-0">
          Itinerary
        </h2>
        <button className="w-8 h-8 rounded-full bg-sand-accent flex items-center justify-center text-premium-navy hover:bg-surface-container-high transition-colors">
          <span className="material-symbols-outlined text-[18px]">add</span>
        </button>
      </div>

      {/* Timeline items */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 relative">
        {/* Vertical timeline line */}
        <div className="absolute left-10 top-6 bottom-6 w-px bg-outline-variant/40 z-0" />

        {days.map((day) => {
          const isActive = day.dayNumber === activeDayNumber;
          return (
            <div
              key={day.dayNumber}
              className={`flex items-start gap-4 relative z-10 group cursor-pointer ${
                isActive ? "" : "opacity-70 hover:opacity-100"
              } transition-opacity`}
              onClick={() => onSelectDay(day.dayNumber)}
            >
              {/* Day number circle */}
              <div
                className={`w-8 h-8 rounded-full flex flex-col items-center justify-center flex-shrink-0 mt-1 transition-transform group-hover:scale-110 ${
                  isActive
                    ? "bg-premium-navy text-background-cream shadow-md"
                    : "bg-sand-accent border border-outline-variant/30 text-on-surface-variant"
                }`}
              >
                <span className="font-label-sm text-label-sm leading-none">
                  {day.dayNumber}
                </span>
              </div>

              {/* Day info card */}
              <div
                className={`flex flex-col gap-1 w-full p-4 rounded-xl transition-colors ${
                  isActive
                    ? "bg-surface-container shadow-sm border border-outline-variant/10"
                    : "hover:bg-surface-container/50"
                }`}
              >
                <span
                  className={`font-label-lg text-label-lg ${
                    isActive ? "text-premium-navy" : "text-on-surface"
                  }`}
                >
                  {day.date}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  {day.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer: Overview button */}
      <div className="p-4 border-t border-outline-variant/30 bg-surface-container-low text-center z-10">
        <button className="text-premium-navy hover:text-on-surface-variant font-label-lg text-label-lg transition-colors flex items-center justify-center w-full gap-2">
          <span className="material-symbols-outlined text-[18px]">
            calendar_month
          </span>
          Overview
        </button>
      </div>
    </aside>
  );
}
