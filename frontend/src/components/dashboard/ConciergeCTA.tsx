export default function ConciergeCTA() {
  return (
    <div className="flex items-center justify-center p-8 bg-surface-container rounded-xl">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center mb-2">
          <span className="material-symbols-outlined text-on-primary-fixed text-[32px]">
            edit_calendar
          </span>
        </div>
        <h3 className="font-headline-md text-headline-md text-primary">
          Don&apos;t see exactly what you desire?
        </h3>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">
          Our concierge can craft a completely bespoke itinerary based on these
          refined parameters.
        </p>
        <button
          className="mt-4 px-6 py-2 border border-primary text-primary hover:bg-primary hover:text-on-primary transition-colors rounded font-label-lg text-label-lg uppercase"
          id="request-custom-itinerary"
        >
          Request Custom Itinerary
        </button>
      </div>
    </div>
  );
}
