import { useState } from "react";
import { EXPERIENCE_TYPES, MAP_PREVIEW_URL } from "../../data/experienceData";

interface ExperienceTypeOption {
  label: string;
  checked: boolean;
}

export default function CurateSidebar() {
  const [types, setTypes] = useState<ExperienceTypeOption[]>(
    EXPERIENCE_TYPES.map((t) => ({ label: t.label, checked: t.checked })),
  );

  const toggleType = (index: number) => {
    setTypes((prev) =>
      prev.map((t, i) =>
        i === index ? { ...t, checked: !t.checked } : t,
      ),
    );
  };

  return (
    <div className="w-full lg:w-1/4 hidden lg:flex flex-col gap-8 sticky top-28 h-fit">
      <div className="flex flex-col gap-6 bg-surface-container-low p-6 rounded-xl shadow-sm">
        {/* Section heading */}
        <h3 className="font-headline-md text-headline-md text-primary">
          Curate
        </h3>

        {/* Experience Type checkboxes */}
        <div className="flex flex-col gap-4">
          <h4 className="font-label-lg text-label-lg text-on-surface uppercase tracking-wider">
            Experience Type
          </h4>
          <div className="flex flex-col gap-3">
            {types.map((type, i) => (
              <label
                key={type.label}
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => toggleType(i)}
              >
                <div
                  className={
                    type.checked
                      ? "w-5 h-5 rounded border border-outline flex items-center justify-center bg-primary text-on-primary"
                      : "w-5 h-5 rounded border border-outline flex items-center justify-center group-hover:border-primary transition-colors"
                  }
                >
                  {type.checked && (
                    <span className="material-symbols-outlined text-[14px]">
                      check
                    </span>
                  )}
                </div>
                <span
                  className={
                    type.checked
                      ? "font-body-md text-body-md text-on-surface group-hover:text-primary transition-colors"
                      : "font-body-md text-body-md text-on-surface-variant group-hover:text-primary transition-colors"
                  }
                >
                  {type.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-[1px] bg-outline-variant/20" />

        {/* Investment range slider (visual only) */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h4 className="font-label-lg text-label-lg text-on-surface uppercase tracking-wider">
              Investment
            </h4>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              $$$
            </span>
          </div>
          <div className="relative w-full h-12 pt-4">
            {/* Track */}
            <div className="absolute w-full h-1 bg-surface-dim rounded-full top-6" />
            {/* Filled track */}
            <div className="absolute w-2/3 h-1 bg-primary rounded-full top-6 left-1/4" />
            {/* Left thumb */}
            <div className="absolute w-4 h-4 bg-primary rounded-full top-[22px] left-1/4 shadow-sm cursor-grab" />
            {/* Right thumb */}
            <div className="absolute w-4 h-4 bg-primary rounded-full top-[22px] left-[91%] shadow-sm cursor-grab" />
          </div>
          <div className="flex justify-between items-center mt-[-8px]">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              $500
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              $5,000+
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-[1px] bg-outline-variant/20" />

        {/* Map preview */}
        <div className="w-full h-32 rounded-lg overflow-hidden relative">
          <div
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url('${MAP_PREVIEW_URL}')` }}
          />
          <div className="absolute inset-0 bg-primary/10 hover:bg-transparent transition-colors cursor-pointer flex items-center justify-center">
            <button className="bg-glass-white backdrop-blur-md px-4 py-2 rounded-full font-label-sm text-label-sm text-primary uppercase shadow-sm">
              Map View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
