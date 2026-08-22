import { useState } from "react";
import { FILTER_TAGS } from "../../data/experienceData";

interface FilterTag {
  label: string;
  active: boolean;
}

export default function FilterChips() {
  const [tags, setTags] = useState<FilterTag[]>([...FILTER_TAGS]);

  const toggleTag = (index: number) => {
    setTags((prev) =>
      prev.map((tag, i) =>
        i === index ? { ...tag, active: !tag.active } : tag,
      ),
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-3 mt-4">
      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase mr-2">
        Filters:
      </span>

      {tags.map((tag, i) => (
        <button
          key={tag.label}
          onClick={() => toggleTag(i)}
          className={
            tag.active
              ? "px-4 py-2 bg-secondary-container text-on-secondary-container font-label-sm text-label-sm rounded-full hover:bg-surface-dim transition-colors flex items-center gap-2"
              : "px-4 py-2 bg-surface-container text-on-surface font-label-sm text-label-sm rounded-full hover:bg-surface-dim transition-colors"
          }
        >
          {tag.label}
          {tag.active && (
            <span className="material-symbols-outlined text-[16px]">
              close
            </span>
          )}
        </button>
      ))}

      <div className="h-4 w-[1px] bg-outline-variant/30 mx-2" />

      <button className="px-4 py-2 flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors font-label-sm text-label-sm uppercase">
        <span className="material-symbols-outlined text-[18px]">tune</span>
        More Filters
      </button>
    </div>
  );
}
