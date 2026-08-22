import { TOKYO_DESTINATION } from "../../data/createTripData";

interface DestinationSelectorProps {
  selectedCity: string | null;
}

export default function DestinationSelector({
  selectedCity,
}: DestinationSelectorProps) {
  const dest = TOKYO_DESTINATION;

  return (
    <section className="flex flex-col gap-6">
      <h2
        className="text-[32px] lg:text-[40px] leading-tight text-editorial-primary tracking-tight"
        style={{ fontFamily: "'EB Garamond', serif" }}
      >
        Where are you going?
      </h2>

      {/* Search input */}
      <div className="relative group bg-editorial-beige rounded-xl p-2 flex items-center">
        <span className="material-symbols-outlined absolute left-8 top-1/2 -translate-y-1/2 text-editorial-secondary text-2xl">
          search
        </span>
        <input
          id="destination-search"
          className="w-full bg-transparent border-none pl-16 pr-6 py-4 font-body-lg text-body-lg focus:ring-0 focus:outline-none transition-all placeholder:text-editorial-secondary/70"
          placeholder="Search for a city or destination"
          type="text"
        />
      </div>

      {/* Selected destination card */}
      {selectedCity && (
        <div className="w-full rounded-2xl overflow-hidden relative aspect-[21/9] mt-2">
          <img
            alt={`${dest.name} landscape`}
            className="absolute inset-0 w-full h-full object-cover"
            src={dest.imageUrl}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-8 md:p-12">
            <div className="flex items-end justify-between w-full">
              <div className="flex items-center gap-6">
                <span className="text-6xl drop-shadow-lg">{dest.flag}</span>
                <div>
                  <h3
                    className="text-[36px] leading-tight text-white drop-shadow-md"
                    style={{ fontFamily: "'EB Garamond', serif" }}
                  >
                    {dest.name}
                  </h3>
                  <p className="text-[11px] font-bold text-white/80 uppercase tracking-[0.15em] mt-3">
                    Selected Destination
                  </p>
                </div>
              </div>
              <button className="text-[11px] font-bold text-white uppercase tracking-[0.15em] border-b-2 border-white pb-1 hover:text-white/70 hover:border-white/70 transition-all drop-shadow-md">
                Change
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
