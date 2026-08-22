interface TripDetailsFormProps {
  tripName: string;
  onTripNameChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
}

export default function TripDetailsForm({
  tripName,
  onTripNameChange,
  description,
  onDescriptionChange,
}: TripDetailsFormProps) {
  return (
    <section className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-8">
        <div className="flex flex-col gap-4 border-b border-editorial-border pb-4">
          <label
            htmlFor="trip-name"
            className="text-[11px] font-bold text-editorial-secondary uppercase tracking-[0.15em]"
          >
            Trip Name
          </label>
          <input
            id="trip-name"
            className="bg-transparent border-none p-0 font-headline-md text-[40px] lg:text-[48px] leading-tight focus:ring-0 focus:outline-none transition-all placeholder:text-editorial-border"
            style={{ fontFamily: "'EB Garamond', serif" }}
            placeholder="e.g. Kyoto Autumn Retreat"
            type="text"
            value={tripName}
            onChange={(e) => onTripNameChange(e.target.value)}
            maxLength={255}
            required
          />
        </div>

        <div className="flex flex-col gap-4 border-b border-editorial-border pb-4">
          <label
            htmlFor="trip-description"
            className="text-[11px] font-bold text-editorial-secondary uppercase tracking-[0.15em]"
          >
            Description (Optional)
          </label>
          <textarea
            id="trip-description"
            className="bg-transparent border-none p-0 font-body-lg text-body-lg h-24 focus:ring-0 focus:outline-none transition-all placeholder:text-editorial-border resize-none"
            placeholder="What's the vibe of this trip?"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
          />
        </div>
      </div>
    </section>
  );
}
