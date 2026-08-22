import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { useAuth } from "../auth/AuthProvider";

/** All four are real, built routes — matches AppSidebar.tsx's link set. */
const NAV_LINKS = [
  { label: "Dashboard", path: "/" },
  { label: "My Trips", path: "/trips" },
  { label: "Plan a Trip", path: "/trips/new" },
  { label: "Profile", path: "/profile" },
] as const;

export default function Header() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const linkClass = (path: string) =>
    isActive(path)
      ? "transition-colors uppercase text-primary font-bold font-label-lg text-label-lg"
      : "font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface transition-colors uppercase";

  return (
    <header className="fixed top-0 w-full z-50 transition-all duration-300 bg-glass-white backdrop-blur-md">
      <div className="h-20 max-w-[1440px] mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin-desktop flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-headline-lg text-headline-lg tracking-tighter text-primary">
            GlobeTrotter
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-gutter">
          {NAV_LINKS.map((link) => (
            <Link key={link.path} to={link.path} className={linkClass(link.path)}>
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side: Sign Out + CTA + Avatar */}
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={signOut}
            className="hidden sm:inline font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface uppercase transition-colors"
          >
            Sign Out
          </button>
          <Link
            to="/trips/new"
            className="hidden sm:inline-flex px-6 py-3 bg-primary text-on-primary font-label-lg text-label-lg rounded-lg hover:bg-premium-navy transition-all uppercase"
          >
            Plan My Trip
          </Link>
          <Link
            to="/profile"
            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center"
            title={user?.email}
          >
            <span className="font-label-sm text-label-sm text-on-primary">
              {user?.name?.charAt(0).toUpperCase() ?? "?"}
            </span>
          </Link>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden ml-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation"
          >
            <span className="material-symbols-outlined text-primary text-[28px]">
              {mobileOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileOpen && (
        <nav className="lg:hidden bg-surface-container-lowest border-t border-outline-variant/20 px-margin-mobile py-6 flex flex-col gap-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={linkClass(link.path)}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-outline-variant/20">
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                signOut();
              }}
              className="font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface uppercase transition-colors text-left"
            >
              Sign Out
            </button>
            <Link
              to="/trips/new"
              className="w-full px-6 py-3 bg-primary text-on-primary font-label-lg text-label-lg rounded-lg hover:bg-premium-navy transition-all uppercase text-center"
              onClick={() => setMobileOpen(false)}
            >
              Plan My Trip
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
