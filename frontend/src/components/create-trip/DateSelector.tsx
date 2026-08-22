interface DateSelectorProps {
  dateStart: string;
  dateEnd: string;
  onDateStartChange: (value: string) => void;
  onDateEndChange: (value: string) => void;
  durationLabel: string;
  datesInverted: boolean;
}

/**
 * Real `<input type="date">` fields bound to ISO strings, replacing the
 * mock's two hard-coded date labels. INTEGRATION.md §3.2: dates are plain
 * "YYYY-MM-DD" — sent to the backend exactly as the input produces them,
 * no Date object round-trip.
 */
export default function DateSelector({
  dateStart,
  dateEnd,
  onDateStartChange,
  onDateEndChange,
  durationLabel,
  datesInverted,
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
        <div className="flex flex-col gap-4 border-b border-editorial-border pb-4">
          <label
            htmlFor="date-start"
            className="text-[11px] font-bold text-editorial-secondary uppercase tracking-[0.15em]"
          >
            Departure
          </label>
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-editorial-secondary text-2xl">
              calendar_today
            </span>
            <input
              id="date-start"
              type="date"
              value={dateStart}
              onChange={(e) => onDateStartChange(e.target.value)}
              className="text-3xl text-editorial-primary bg-transparent border-none p-0 focus:ring-0 focus:outline-none w-full"
              style={{ fontFamily: "'EB Garamond', serif" }}
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 border-b border-editorial-border pb-4">
          <label
            htmlFor="date-end"
            className="text-[11px] font-bold text-editorial-secondary uppercase tracking-[0.15em]"
          >
            Return
          </label>
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-editorial-secondary text-2xl">
              calendar_today
            </span>
            <input
              id="date-end"
              type="date"
              value={dateEnd}
              onChange={(e) => onDateEndChange(e.target.value)}
              className="text-3xl text-editorial-primary bg-transparent border-none p-0 focus:ring-0 focus:outline-none w-full"
              style={{ fontFamily: "'EB Garamond', serif" }}
              required
            />
          </div>
        </div>
      </div>

      {datesInverted ? (
        <p className="text-error text-sm font-medium">
          Return date must be on or after the departure date.
        </p>
      ) : (
        <div className="flex items-center gap-3 text-editorial-secondary">
          <span className="material-symbols-outlined text-lg">schedule</span>
          <span className="text-base font-medium tracking-wide">{durationLabel}</span>
        </div>
      )}
    </section>
  );
}
