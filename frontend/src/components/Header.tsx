/**
 * The one GlobeTrotter header — landing page and app both.
 *
 * It renders in two states off the same markup: signed out it offers
 * SIGN IN, signed in it offers SIGN OUT plus the avatar. That split is why
 * the ported ExploreScape landing header was folded into this file rather
 * than kept as a second component: two headers drift, and the wordmark
 * changing between the marketing page and the app is exactly the kind of
 * seam §26's brand test is meant to catch.
 *
 * Glass over warm ivory — never a coloured bar.
 */
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { useAuth } from "../auth/AuthProvider";
import { InertButton } from "./Inert";

const PENDING = "This screen hasn't been ported from Stitch yet.";

/**
 * Nav links. "About" is the only one still without a screen behind it, so
 * it renders inert (visible, disabled, with a tooltip) — INTEGRATION.md §6
 * treats a link to a 404 as worse than a disabled control (Inert.tsx).
 */
const NAV_LINKS = [
  { label: "Home", path: "/", href: "/" },
  { label: "Explore", path: "/explore", href: "/explore" },
  { label: "My Trips", path: "/trips", href: "/trips" },
  { label: "Plan a Trip", path: "/trips/new", href: "/trips/new" },
  { label: "About", path: "/about", href: null },
] as const;

export default function Header() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated, signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const linkClass = (path: string) =>
    isActive(path)
      ? "transition-colors uppercase text-editorial-primary font-bold font-label-lg text-label-lg"
      : "font-label-lg text-label-lg text-editorial-secondary hover:text-editorial-primary transition-colors uppercase";

  /* Signed-out visitors get sent through login first, then on to the page
     they actually pressed — the guard would bounce them there anyway. */
  const planTripHref = isAuthenticated
    ? "/trips/new"
    : `/login?redirect=${encodeURIComponent("/trips/new")}`;

  return (
    <header className="fixed top-0 w-full z-50 transition-all duration-300 bg-glass-white backdrop-blur-md border-b border-editorial-border/40">
      <div className="h-20 max-w-[1440px] mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin-desktop flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-headline-lg text-headline-lg tracking-tighter text-editorial-primary">
            GlobeTrotter
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-gutter">
          {NAV_LINKS.map((link) =>
            link.href ? (
              <Link key={link.path} to={link.href} className={linkClass(link.path)}>
                {link.label}
              </Link>
            ) : (
              <InertButton
                key={link.path}
                reason={PENDING}
                className={`bg-transparent ${linkClass(link.path)}`}
              >
                {link.label}
              </InertButton>
            ),
          )}
        </nav>

        {/* Right side: Sign In/Out + CTA + Avatar */}
        <div className="flex items-center gap-6">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={signOut}
              className="hidden sm:inline font-label-lg text-label-lg text-editorial-secondary hover:text-editorial-primary uppercase transition-colors"
            >
              Sign Out
            </button>
          ) : (
            <Link
              to="/login"
              className="hidden sm:inline font-label-lg text-label-lg text-editorial-secondary hover:text-editorial-primary uppercase transition-colors"
            >
              Sign In
            </Link>
          )}

          <Link
            to={planTripHref}
            className="hidden sm:inline-flex px-6 py-3 bg-editorial-primary text-white font-label-lg text-label-lg rounded-control hover:bg-black transition-all uppercase"
          >
            Plan My Trip
          </Link>

          <Link
            to={isAuthenticated ? "/profile" : "/login"}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-editorial-primary text-white hover:bg-black"
            title={isAuthenticated ? user?.email : "Sign in"}
            aria-label={isAuthenticated ? "Your profile" : "Sign in"}
          >
            {isAuthenticated ? (
              <span className="font-label-sm text-label-sm">
                {user?.name?.charAt(0).toUpperCase() ?? "?"}
              </span>
            ) : (
              <span className="material-symbols-outlined text-[18px]">person</span>
            )}
          </Link>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden ml-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation"
          >
            <span className="material-symbols-outlined text-editorial-primary text-[28px]">
              {mobileOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileOpen && (
        <nav className="lg:hidden bg-editorial-card border-t border-editorial-border px-margin-mobile py-6 flex flex-col gap-4">
          {NAV_LINKS.map((link) =>
            link.href ? (
              <Link
                key={link.path}
                to={link.href}
                className={linkClass(link.path)}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ) : (
              <InertButton
                key={link.path}
                reason={PENDING}
                className={`bg-transparent text-left ${linkClass(link.path)}`}
              >
                {link.label}
              </InertButton>
            ),
          )}
          <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-editorial-border">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  signOut();
                }}
                className="font-label-lg text-label-lg text-editorial-secondary hover:text-editorial-primary uppercase transition-colors text-left"
              >
                Sign Out
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="font-label-lg text-label-lg text-editorial-secondary hover:text-editorial-primary uppercase transition-colors"
              >
                Sign In
              </Link>
            )}
            <Link
              to={planTripHref}
              className="w-full px-6 py-3 bg-editorial-primary text-white font-label-lg text-label-lg rounded-control hover:bg-black transition-all uppercase text-center"
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
