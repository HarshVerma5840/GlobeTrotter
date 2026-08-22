/**
 * Controls that exist in the Stitch design but have no backend behind them
 * (Dates, Pace, Guests, favourites, and the not-yet-ported nav links).
 *
 * They stay visible for visual fidelity, but are unmistakably disabled and
 * carry a tooltip saying why. The alternative — leaving them looking live —
 * is how a demo ends with someone clicking a control that silently does
 * nothing.
 */
import type { ReactNode } from "react";

const BASE = "opacity-40 cursor-not-allowed select-none";

export function InertBlock({
  children,
  reason,
  className = "",
}: {
  children: ReactNode;
  reason: string;
  className?: string;
}) {
  return (
    <div className={`${BASE} ${className}`} title={reason} aria-disabled="true">
      {children}
    </div>
  );
}

export function InertButton({
  children,
  reason,
  className = "",
}: {
  children: ReactNode;
  reason: string;
  className?: string;
}) {
  return (
    <button type="button" disabled title={reason} className={`${BASE} ${className}`}>
      {children}
    </button>
  );
}
