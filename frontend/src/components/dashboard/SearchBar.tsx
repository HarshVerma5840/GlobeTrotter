export default function SearchBar() {
  return (
    <div className="w-full bg-surface-container-lowest shadow-xl rounded-xl p-6 flex flex-col md:flex-row items-end gap-6 relative z-20">
      <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Destination */}
        <div className="flex flex-col gap-2">
          <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
            Destination
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
              search
            </span>
            <input
              className="w-full bg-sand-accent text-on-surface font-body-md text-body-md py-3 pl-10 pr-4 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/50"
              placeholder="Where to?"
              type="text"
              id="destination-input"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="flex flex-col gap-2">
          <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
            Dates
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
              calendar_month
            </span>
            <input
              className="w-full bg-sand-accent text-on-surface font-body-md text-body-md py-3 pl-10 pr-4 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/50"
              placeholder="Select dates"
              type="text"
              id="dates-input"
            />
          </div>
        </div>

        {/* Pace */}
        <div className="flex flex-col gap-2">
          <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
            Pace
          </label>
          <div className="relative group cursor-pointer">
            <div className="w-full bg-sand-accent text-on-surface font-body-md text-body-md py-3 px-4 rounded-lg flex items-center justify-between">
              <span>Leisurely</span>
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                expand_more
              </span>
            </div>
          </div>
        </div>

        {/* Guests */}
        <div className="flex flex-col gap-2">
          <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
            Guests
          </label>
          <div className="relative group cursor-pointer">
            <div className="w-full bg-sand-accent text-on-surface font-body-md text-body-md py-3 px-4 rounded-lg flex items-center justify-between">
              <span>2 Adults</span>
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                expand_more
              </span>
            </div>
          </div>
        </div>
      </div>

      <button
        className="w-full md:w-auto px-8 py-3 bg-primary text-on-primary font-label-lg text-label-lg rounded-lg hover:bg-premium-navy transition-all uppercase whitespace-nowrap h-[48px] flex items-center justify-center"
        id="search-button"
      >
        Search
      </button>
    </div>
  );
}
