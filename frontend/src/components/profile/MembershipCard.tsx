import type { UserProfile } from "../../data/profileData";

interface MembershipCardProps {
  membership: UserProfile["membership"];
}

export default function MembershipCard({ membership }: MembershipCardProps) {
  return (
    <aside className="lg:col-span-4 flex flex-col gap-8 bg-surface-container p-8 rounded-2xl shadow-sm">
      <h3 className="font-headline-md text-xl border-b border-outline-variant/20 pb-4">
        GlobeTrotter Status
      </h3>

      <div className="flex items-center gap-4">
        <span className="material-symbols-outlined text-4xl text-secondary">
          workspace_premium
        </span>
        <div>
          <div className="font-label-lg text-on-surface">{membership.tier}</div>
          <div className="font-body-md text-on-surface-variant text-sm">
            {membership.since}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-outline-variant/20 h-2 rounded-full overflow-hidden mt-4">
        <div
          className="bg-premium-navy h-full rounded-full transition-all duration-700"
          style={{ width: `${membership.progressPercent}%` }}
        />
      </div>
      <div className="font-label-sm text-on-surface-variant text-right">
        {membership.nextTierLabel}
      </div>
    </aside>
  );
}
