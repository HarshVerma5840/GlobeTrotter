import SearchBar from "./SearchBar";
import FilterChips from "./FilterChips";

export default function HeroSection() {
  return (
    <section className="w-full pt-16 pb-8 px-margin-mobile md:px-margin-tablet lg:px-margin-desktop bg-surface-container-low relative overflow-hidden">
      {/* Decorative blur gradient */}
      <div className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[60%] rounded-full bg-primary-fixed-dim blur-3xl mix-blend-multiply" />
      </div>

      <div className="max-w-[1440px] mx-auto relative z-10 flex flex-col gap-content-v-gap">
        {/* Title + subtitle */}
        <div className="flex flex-col gap-4">
          <h1 className="font-display-xl text-display-xl-mobile md:text-display-xl text-primary tracking-tight">
            Curated Expeditions
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
            Discover bespoke experiences and refined destinations tailored for
            the discerning traveler.
          </p>
        </div>

        {/* Search bar */}
        <div className="mt-8">
          <SearchBar />
        </div>

        {/* Filter chips */}
        <FilterChips />
      </div>
    </section>
  );
}
