import { Link, useLocation } from "react-router-dom";

const SIDEBAR_LINKS = [
  { label: "Dashboard", icon: "dashboard", path: "/" },
  { label: "My Trips", icon: "explore", path: "/trips" },
  { label: "Plan a Trip", icon: "edit_calendar", path: "/trips/new" },
  { label: "Search", icon: "search", path: "/search" },
] as const;

/**
 * Fixed left sidebar for the app-shell layout used by the Itinerary Builder.
 * Shows GlobeTrotter branding, nav links, and a user profile section.
 */
export default function AppSidebar() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-low z-50 flex flex-col">
      {/* Logo */}
      <div className="px-8 h-20 flex items-center mb-8">
        <Link
          to="/"
          className="font-headline-md text-headline-md tracking-tight text-premium-navy italic"
        >
          GlobeTrotter
        </Link>
      </div>

      {/* Navigation */}
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

      {/* User profile */}
      <div className="px-6 py-8 border-t border-outline-variant/30">
        <div className="flex items-center gap-4 px-4">
          <div className="w-10 h-10 rounded-full bg-premium-navy flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary text-[20px]">
              person
            </span>
          </div>
          <div>
            <p className="font-label-lg text-label-lg text-on-surface">
              Julian Thorne
            </p>
            <p className="text-label-sm text-on-surface-variant uppercase tracking-widest">
              Explorer
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
