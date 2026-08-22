import { useState } from "react";
import { LIBRARY_ITEMS } from "../../data/itineraryBuilderData";
import type { LibraryItem } from "../../data/itineraryBuilderData";

function LibraryCard({ item }: { item: LibraryItem }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 overflow-hidden cursor-grab active:cursor-grabbing hover:shadow-md transition-all group">
      {/* Image */}
      <div className="h-24 w-full relative">
        <img
          className="w-full h-full object-cover"
          src={item.imageUrl}
          alt={item.imageAlt}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent" />
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-glass-white backdrop-blur-md flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="material-symbols-outlined text-premium-navy text-[14px]">
            drag_indicator
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-1">
        <h4 className="font-label-lg text-label-lg text-premium-navy">
          {item.title}
        </h4>
        <p className="font-label-sm text-label-sm text-on-surface-variant">
          {item.subtitle}
        </p>
      </div>
    </div>
  );
}

export default function ActivityLibrary() {
  const [activeTab, setActiveTab] = useState<"saved" | "ideas">("saved");
  const [filter, setFilter] = useState("");

  const filteredItems = LIBRARY_ITEMS.filter(
    (item) =>
      item.title.toLowerCase().includes(filter.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <aside className="w-80 flex-shrink-0 flex flex-col h-full bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-outline-variant/30 bg-surface-container-lowest z-10 flex flex-col gap-4">
        <h2 className="font-headline-md text-headline-md text-premium-navy">
          Library
        </h2>

        {/* Tabs */}
        <div className="flex bg-surface-container-low rounded-lg p-1">
          <button
            onClick={() => setActiveTab("saved")}
            className={`flex-1 py-1.5 rounded-md font-label-lg text-label-lg transition-all ${
              activeTab === "saved"
                ? "bg-surface-container-lowest shadow-sm text-premium-navy"
                : "text-on-surface-variant hover:text-premium-navy"
            }`}
          >
            Saved
          </button>
          <button
            onClick={() => setActiveTab("ideas")}
            className={`flex-1 py-1.5 rounded-md font-label-lg text-label-lg transition-all ${
              activeTab === "ideas"
                ? "bg-surface-container-lowest shadow-sm text-premium-navy"
                : "text-on-surface-variant hover:text-premium-navy"
            }`}
          >
            Ideas
          </button>
        </div>

        {/* Search/Filter */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
            search
          </span>
          <input
            className="w-full bg-sand-accent/50 border-b border-premium-navy/30 pl-10 pr-4 py-2.5 rounded-t-lg focus:outline-none focus:border-premium-navy focus:bg-sand-accent transition-all font-body-md text-body-md text-on-surface placeholder:text-outline"
            placeholder="Filter saved places..."
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Library items list */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-background">
        {filteredItems.map((item) => (
          <LibraryCard key={item.id} item={item} />
        ))}
        {filteredItems.length === 0 && (
          <p className="text-center text-on-surface-variant font-body-md text-body-md py-8">
            No saved places match your filter.
          </p>
        )}
      </div>
    </aside>
  );
}
