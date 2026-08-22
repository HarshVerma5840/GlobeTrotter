interface DateSelectorProps {
  departureDate: string;
  returnDate: string;
  durationLabel: string;
}

export default function DateSelector({
  departureDate,
  returnDate,
  durationLabel,
}: DateSelectorProps) {
  return (
    <section className="flex flex-col gap-6">
      <h2
        className="text-[32px] lg:text-[40px] leading-tight text-editorial-primary tracking-tight"
        style={{ fontFamily: "'EB Garamond', serif" }}
      >
        When are you traveling?
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Departure */}
        <div className="flex flex-col gap-4 border-b border-editorial-border pb-4">
          <label className="text-[11px] font-bold text-editorial-secondary uppercase tracking-[0.15em]">
            Departure
          </label>
          <div className="flex items-center gap-4 cursor-pointer hover:opacity-70 transition-opacity">
            <span className="material-symbols-outlined text-editorial-secondary text-2xl">
              calendar_today
            </span>
            <span
              className="text-3xl text-editorial-primary"
              style={{ fontFamily: "'EB Garamond', serif" }}
            >
              {departureDate}
            </span>
          </div>
        </div>

        {/* Return */}
        <div className="flex flex-col gap-4 border-b border-editorial-border pb-4">
          <label className="text-[11px] font-bold text-editorial-secondary uppercase tracking-[0.15em]">
            Return
          </label>
          <div className="flex items-center gap-4 cursor-pointer hover:opacity-70 transition-opacity">
            <span className="material-symbols-outlined text-editorial-secondary text-2xl">
              calendar_today
            </span>
            <span
              className="text-3xl text-editorial-primary"
              style={{ fontFamily: "'EB Garamond', serif" }}
            >
              {returnDate}
            </span>
          </div>
        </div>
      </div>

      {/* Duration summary */}
      <div className="flex items-center gap-3 text-editorial-secondary">
        <span className="material-symbols-outlined text-lg">schedule</span>
        <span className="text-base font-medium tracking-wide">
          {durationLabel}
        </span>
      </div>
    </section>
  );
}
