/**
 * The Group By / Filter / Sort By controls on the Explore screen.
 *
 * A plain white button with a warm border that drops a panel underneath.
 * Deliberately not a pill, not tinted, and never coloured when active —
 * "active" is communicated by black text and a black border, because the
 * GlobeTrotter palette has no accent hue to spend on a control.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";

interface ControlMenuProps {
  /** Static label — "Group By", "Filter", "Sort By". */
  label: string;
  /** The current selection, appended after the label when it isn't the default. */
  value?: string | null;
  icon: string;
  /** Drives the black-text/black-border treatment. */
  active?: boolean;
  children: ReactNode;
}

export default function ControlMenu({
  label,
  value,
  icon,
  active = false,
  children,
}: ControlMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Click-away and Escape both close. Without the first, opening a second
  // menu leaves the first hanging open behind it.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-control bg-editorial-card border transition-colors font-label-sm text-label-sm uppercase hover:bg-editorial-beige ${
          active || open
            ? "border-editorial-primary text-editorial-primary"
            : "border-editorial-border text-editorial-primary"
        }`}
      >
        <span className="material-symbols-outlined text-[18px] text-editorial-secondary">
          {icon}
        </span>
        {label}
        {value && (
          <span className="normal-case tracking-normal text-editorial-secondary font-normal">
            · {value}
          </span>
        )}
        <span className="material-symbols-outlined text-[18px] text-editorial-secondary">
          {open ? "expand_less" : "expand_more"}
        </span>
      </button>

      {open && (
        <div className="absolute z-30 mt-2 min-w-[240px] bg-editorial-card border border-editorial-border rounded-control shadow-editorial-lift p-2 flex flex-col gap-1">
          {children}
        </div>
      )}
    </div>
  );
}

/** A single radio-style row inside a ControlMenu panel. */
export function MenuOption({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left px-3 py-2 rounded-control font-body-md text-[14px] flex items-center justify-between gap-3 transition-colors hover:bg-editorial-beige ${
        selected ? "text-editorial-primary font-semibold" : "text-editorial-secondary"
      }`}
    >
      {label}
      {selected && <span className="material-symbols-outlined text-[16px]">check</span>}
    </button>
  );
}

/** A small section heading inside a Filter panel. */
export function MenuSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 px-1 py-2">
      <span className="px-2 font-label-sm text-label-sm uppercase text-editorial-muted">
        {title}
      </span>
      {children}
    </div>
  );
}
