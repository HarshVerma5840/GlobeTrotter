import type { TimeSlot, TimeSlotActivity } from "../../data/itineraryBuilderData";

function FlightCard({ activity }: { activity: TimeSlotActivity }) {
  return (
    <div className="ml-16 bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/20 flex flex-col gap-4 relative overflow-hidden group cursor-pointer hover:shadow-md transition-all">
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${activity.accentColor}`} />
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sand-accent flex items-center justify-center text-premium-navy">
            <span className="material-symbols-outlined">{activity.icon}</span>
          </div>
          <div className="flex flex-col">
            <h3 className="font-label-lg text-label-lg text-premium-navy">{activity.title}</h3>
            <p className="font-label-sm text-label-sm text-on-surface-variant">{activity.subtitle}</p>
          </div>
        </div>
        <button className="text-outline hover:text-error transition-colors opacity-0 group-hover:opacity-100">
          <span className="material-symbols-outlined text-[20px]">delete</span>
        </button>
      </div>
      {activity.meta && activity.meta.length > 0 && (
        <div className="flex items-center gap-8 pl-13 pt-2">
          {activity.meta.map((m) => (
            <div key={m.label} className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{m.label}</span>
              <span className="font-body-md text-body-md text-on-surface font-medium">{m.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HotelCard({ activity }: { activity: TimeSlotActivity }) {
  return (
    <div className="ml-16 bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/20 flex gap-6 relative overflow-hidden group cursor-pointer hover:shadow-md transition-all">
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${activity.accentColor}`} />
      {activity.imageUrl && (
        <div className="w-32 h-32 rounded-xl overflow-hidden flex-shrink-0 relative">
          <img className="w-full h-full object-cover" src={activity.imageUrl} alt={activity.imageAlt || ""} />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent" />
          {activity.imageBadge && (
            <span className="absolute bottom-2 left-2 text-on-primary font-label-sm text-label-sm bg-glass-white backdrop-blur-md px-2 py-0.5 rounded shadow-sm">
              {activity.imageBadge}
            </span>
          )}
        </div>
      )}
      <div className="flex flex-col justify-between flex-1">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <h3 className="font-headline-md text-headline-md text-premium-navy leading-tight">{activity.title}</h3>
            {activity.location && (
              <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">location_on</span>
                {activity.location}
              </p>
            )}
          </div>
          <button className="text-outline hover:text-error transition-colors opacity-0 group-hover:opacity-100">
            <span className="material-symbols-outlined text-[20px]">delete</span>
          </button>
        </div>
        {activity.tags && activity.tags.length > 0 && (
          <div className="flex gap-2">
            {activity.tags.map((tag) => (
              <span key={tag} className="bg-sand-accent text-on-secondary-container font-label-sm text-label-sm px-2 py-1 rounded-md">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DiningCard({ activity }: { activity: TimeSlotActivity }) {
  return (
    <div className="ml-16 bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/20 flex flex-col gap-4 relative overflow-hidden group cursor-pointer hover:shadow-md transition-all">
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${activity.accentColor}`} />
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sand-accent flex items-center justify-center text-premium-navy">
            <span
              className="material-symbols-outlined"
              style={activity.iconFilled ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {activity.icon}
            </span>
          </div>
          <div className="flex flex-col">
            <h3 className="font-label-lg text-label-lg text-premium-navy">{activity.title}</h3>
            <p className="font-label-sm text-label-sm text-on-surface-variant">{activity.subtitle}</p>
          </div>
        </div>
        <button className="text-outline hover:text-error transition-colors opacity-0 group-hover:opacity-100">
          <span className="material-symbols-outlined text-[20px]">delete</span>
        </button>
      </div>
    </div>
  );
}

function ActivityCard({ activity }: { activity: TimeSlotActivity }) {
  switch (activity.type) {
    case "flight":
      return <FlightCard activity={activity} />;
    case "hotel":
      return <HotelCard activity={activity} />;
    case "dining":
      return <DiningCard activity={activity} />;
    default:
      return <FlightCard activity={activity} />;
  }
}

interface DayScheduleProps {
  dayTitle: string;
  daySubtitle: string;
  timeSlots: TimeSlot[];
  onOpenMap: () => void;
}

export default function DaySchedule({
  dayTitle,
  daySubtitle,
  timeSlots,
  onOpenMap,
}: DayScheduleProps) {
  return (
    <main className="flex-1 flex flex-col h-full relative">
      {/* Day header */}
      <div className="flex items-center justify-between pb-6">
        <div className="flex flex-col">
          <h2 className="font-headline-lg text-headline-lg text-premium-navy flex items-center gap-3">
            {dayTitle}
            <span className="material-symbols-outlined text-outline text-[24px] cursor-pointer hover:text-premium-navy transition-colors">
              edit
            </span>
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            {daySubtitle}
          </p>
        </div>
        <button
          onClick={onOpenMap}
          className="bg-surface-container-high px-5 py-2.5 rounded-full flex items-center gap-2 text-premium-navy hover:bg-sand-accent transition-colors shadow-sm font-label-lg text-label-lg"
        >
          <span className="material-symbols-outlined text-[20px]">map</span>
          View on Map
        </button>
      </div>

      {/* Time slots */}
      <div className="flex-1 overflow-y-auto pr-4 flex flex-col gap-10">
        {timeSlots.map((slot, idx) => (
          <div key={slot.time} className={`flex flex-col gap-4 ${idx > 0 ? "mt-4" : ""} ${idx === timeSlots.length - 1 ? "mb-20" : ""}`}>
            {/* Time header */}
            <div className="flex items-center gap-4">
              <span className="font-display-xl-mobile text-display-xl-mobile text-outline/30 leading-none">
                {slot.time}
              </span>
              <div className="h-px bg-outline-variant/30 flex-1" />
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest bg-sand-accent px-3 py-1 rounded-full">
                {slot.period}
              </span>
            </div>

            {/* Activity cards */}
            {slot.activities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}

            {/* Drop zone */}
            {slot.showDropZone && (
              <div className="ml-16 h-20 rounded-2xl border-2 border-dashed border-outline-variant/50 flex items-center justify-center bg-surface-container-low/50 text-outline hover:bg-surface-container-low hover:border-premium-navy/50 hover:text-premium-navy transition-all cursor-pointer">
                <span className="font-label-lg text-label-lg flex items-center gap-2">
                  <span className="material-symbols-outlined">add_circle</span>
                  Drag activity here
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
