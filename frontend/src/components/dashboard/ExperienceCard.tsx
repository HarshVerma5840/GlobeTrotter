import type { Experience } from "../../data/experienceData";

interface ExperienceCardProps {
  experience: Experience;
  /** Apply negative top margin for staggered masonry effect */
  offsetTop?: boolean;
}

export default function ExperienceCard({
  experience,
  offsetTop = false,
}: ExperienceCardProps) {
  const {
    title,
    location,
    imageUrl,
    imageAlt,
    priceTier,
    description,
    tags,
    duration,
    aspectRatio,
    hasOverlayBar,
  } = experience;

  const aspectClass =
    aspectRatio === "landscape" ? "aspect-video" : "aspect-[4/5]";

  return (
    <div
      className={`group flex flex-col gap-4 cursor-pointer ${
        offsetTop ? "-mt-0 md:-mt-12" : ""
      }`}
    >
      {/* Image container */}
      <div
        className={`relative w-full ${aspectClass} rounded-xl overflow-hidden shadow-md`}
      >
        <img
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          src={imageUrl}
          alt={imageAlt}
          loading="lazy"
        />

        {/* Location badge */}
        {!hasOverlayBar && (
          <div className="absolute top-4 left-4 bg-glass-white backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <span className="material-symbols-outlined text-[14px] text-primary">
              location_on
            </span>
            <span className="font-label-sm text-label-sm text-primary uppercase">
              {location}
            </span>
          </div>
        )}

        {/* Favorite button (visible on hover) */}
        {!hasOverlayBar && (
          <div className="absolute top-4 right-4 bg-surface-container-lowest/90 backdrop-blur-sm w-8 h-8 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
            <span
              className="material-symbols-outlined text-[18px] text-primary"
              style={{ fontVariationSettings: "'FILL' 0" }}
            >
              favorite
            </span>
          </div>
        )}

        {/* Glassmorphic overlay bar (Tuscany-style) */}
        {hasOverlayBar && (
          <div className="absolute bottom-4 left-4 right-4 bg-glass-white backdrop-blur-md p-4 rounded-lg flex justify-between items-center shadow-lg border border-white/20">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">
                location_on
              </span>
              <span className="font-label-sm text-label-sm text-primary uppercase tracking-wider">
                {location}
              </span>
            </div>
            <div className="flex -space-x-2">
              <div className="w-6 h-6 rounded-full bg-surface-dim border border-surface-container-lowest" />
              <div className="w-6 h-6 rounded-full bg-surface-variant border border-surface-container-lowest" />
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center border border-surface-container-lowest">
                <span className="text-[8px] text-on-primary">+3</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Card content */}
      <div className="flex flex-col gap-2 px-1">
        <div className="flex justify-between items-start">
          <h3 className="font-headline-md text-headline-md text-primary leading-tight group-hover:text-surface-tint transition-colors">
            {title}
          </h3>
          <span className="font-label-lg text-label-lg text-on-surface bg-sand-accent px-2 py-1 rounded ml-2 shrink-0">
            {priceTier}
          </span>
        </div>
        <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2">
          {description}
        </p>
        {(tags.length > 0 || duration) && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="font-label-sm text-label-sm text-on-secondary-fixed-variant bg-secondary-fixed px-3 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
            {duration && (
              <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1 ml-auto">
                <span className="material-symbols-outlined text-[14px]">
                  schedule
                </span>
                {duration}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
