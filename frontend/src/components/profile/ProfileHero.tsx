import type { UserProfile } from "../../data/profileData";

interface ProfileHeroProps {
  profile: UserProfile;
}

export default function ProfileHero({ profile }: ProfileHeroProps) {
  return (
    <section className="flex flex-col md:flex-row gap-12 items-start">
      {/* Avatar */}
      <div className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden shrink-0 shadow-xl border-4 border-surface-container-lowest">
        <img
          alt={`${profile.name} Portrait`}
          className="w-full h-full object-cover"
          src={profile.avatarUrl}
        />
      </div>

      {/* Info */}
      <div className="flex flex-col pt-4">
        <div className="font-label-sm tracking-[0.2em] text-on-surface-variant uppercase mb-4 flex items-center gap-2">
          <span className="w-8 h-[1px] bg-outline-variant" />
          Your Travel Profile
        </div>
        <h1 className="font-display-xl text-display-xl-mobile md:text-display-xl mb-6">
          {profile.name}
        </h1>
        <p className="font-body-lg text-on-surface-variant max-w-2xl mb-8 italic">
          {profile.bio}
        </p>
        <div className="flex flex-wrap gap-4">
          <button className="px-8 py-3 bg-premium-navy text-background-cream font-label-lg rounded-full hover:bg-primary transition-colors flex items-center gap-2 group">
            <span className="material-symbols-outlined text-[20px] group-hover:rotate-12 transition-transform">
              edit
            </span>
            Edit Profile
          </button>
          <button className="px-8 py-3 bg-glass-white border border-outline-variant/30 text-premium-navy font-label-lg rounded-full hover:bg-surface-container transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">
              settings
            </span>
            Settings
          </button>
        </div>
      </div>
    </section>
  );
}
