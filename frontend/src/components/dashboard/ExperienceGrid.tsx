import { EXPERIENCES } from "../../data/experienceData";
import ExperienceCard from "./ExperienceCard";
import ConciergeCTA from "./ConciergeCTA";
import CurateSidebar from "./CurateSidebar";

export default function ExperienceGrid() {
  return (
    <section className="max-w-[1440px] mx-auto w-full px-margin-mobile md:px-margin-tablet lg:px-margin-desktop py-section-v-gap flex flex-col lg:flex-row gap-gutter relative">
      {/* Sidebar — desktop only */}
      <CurateSidebar />

      {/* Main content */}
      <div className="w-full lg:w-3/4 flex flex-col gap-12">
        {/* Results header */}
        <div className="flex justify-between items-end pb-4 border-b border-outline-variant/20">
          <span className="font-body-lg text-body-lg text-on-surface">
            Showing{" "}
            <strong className="font-headline-md text-headline-md">24</strong>{" "}
            refined experiences
          </span>
          <div className="flex items-center gap-2 cursor-pointer group">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase group-hover:text-primary transition-colors">
              Sort by: Recommended
            </span>
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant group-hover:text-primary transition-colors">
              sort
            </span>
          </div>
        </div>

        {/* Card grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {EXPERIENCES.map((exp, i) => (
            <ExperienceCard
              key={exp.id}
              experience={exp}
              /* Second card (Copenhagen) gets the staggered offset */
              offsetTop={i === 1}
            />
          ))}

          {/* Concierge CTA as the 4th grid item */}
          <ConciergeCTA />
        </div>

        {/* Load more */}
        <div className="flex justify-center mt-8">
          <button
            className="px-8 py-3 bg-surface-container text-on-surface font-label-lg text-label-lg rounded-lg hover:bg-surface-variant transition-colors uppercase shadow-sm"
            id="load-more-btn"
          >
            Load More Experiences
          </button>
        </div>
      </div>
    </section>
  );
}
