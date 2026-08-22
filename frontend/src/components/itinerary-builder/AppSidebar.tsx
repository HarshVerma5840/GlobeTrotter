import { Link, useLocation } from "react-router-dom";

import { useAuth } from "../../auth/AuthProvider";

const SIDEBAR_LINKS = [
  { label: "Dashboard", icon: "dashboard", path: "/dashboard" },
  { label: "Explore", icon: "travel_explore", path: "/explore" },
  { label: "My Trips", icon: "explore", path: "/trips" },
  { label: "Plan a Trip", icon: "edit_calendar", path: "/trips/new" },
  { label: "Profile", icon: "person", path: "/profile" },
] as const;

/**
 * Fixed left sidebar for the app-shell layout used by the Itinerary Builder.
 * User block is real (useAuth), replacing the mock's hard-coded name.
 */
export default function AppSidebar() {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-low z-50 flex flex-col">
      <div className="px-8 h-20 flex items-center mb-8">
        <Link
          to="/dashboard"
          className="font-headline-md text-headline-md tracking-tight text-premium-navy italic"
        >
          GlobeTrotter
        </Link>
      </div>

      <nav className="flex-1 px-6 space-y-2">
        {SIDEBAR_LINKS.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={
              isActive(link.path)
                ? "flex items-center px-4 py-3 bg-sand-accent text-on-secondary-container font-semibold rounded-xl shadow-sm transition-all"
                : "flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all rounded-xl"
            }
          >
            <span className="material-symbols-outlined mr-4">{link.icon}</span>
            <span className="font-label-lg text-label-lg">{link.label}</span>
          </Link>
        ))}
      </nav>

      <div className="px-6 py-8 border-t border-outline-variant/30">
        <div className="flex items-center gap-4 px-4">
          <div className="w-10 h-10 rounded-full bg-premium-navy flex items-center justify-center shrink-0">
            <span className="font-label-sm text-label-sm text-on-primary">
              {user?.name?.charAt(0).toUpperCase() ?? "?"}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-label-lg text-label-lg text-on-surface truncate">
              {user?.name ?? "Traveler"}
            </p>
            <button
              type="button"
              onClick={signOut}
              className="text-label-sm text-on-surface-variant uppercase tracking-widest hover:text-primary transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
