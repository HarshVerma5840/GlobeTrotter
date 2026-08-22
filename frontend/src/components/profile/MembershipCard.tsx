import { InertBlock } from "../Inert";

const NO_API =
  "Loyalty tiers aren't part of the backend contract — no membership data exists to show here.";

/**
 * The Stitch mock's Gold/Platinum loyalty tier has no backend model at all
 * (CONTRACTS §2 has no such concept) — inventing progress/tier numbers
 * would be fabricated data (INTEGRATION.md rule 4). Kept visible for
 * layout fidelity but clearly inert, same pattern as Dashboard's
 * Dates/Pace/Guests fields.
 */
export default function MembershipCard() {
  return (
    <InertBlock reason={NO_API} className="lg:col-span-4">
      <aside className="flex flex-col gap-8 bg-surface-container p-8 rounded-2xl shadow-sm">
        <h3 className="font-headline-md text-xl border-b border-outline-variant/20 pb-4">
          GlobeTrotter Status
        </h3>

        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-4xl text-secondary">
            workspace_premium
          </span>
          <div>
            <div className="font-label-lg text-on-surface">Not available</div>
            <div className="font-body-md text-on-surface-variant text-sm">
              No loyalty program yet
            </div>
          </div>
        </div>

        <div className="w-full bg-outline-variant/20 h-2 rounded-full overflow-hidden mt-4" />
      </aside>
    </InertBlock>
  );
}
