import { useState } from "react";

const NAV_LINKS = [
  { label: "Home", path: "home", href: "/" },
  { label: "Explore", path: "explore", href: "#" },
  { label: "My Trips", path: "my-trips", href: "#" },
  { label: "Plan a Trip", path: "plan-a-trip", href: "#" },
  { label: "About", path: "about", href: "#" },
] as const;

export default function Header() {
  const [activePath] = useState("home");
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full z-50 transition-all duration-300 bg-glass-white backdrop-blur-md">
      <div className="h-20 max-w-[1440px] mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin-desktop flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="font-headline-lg text-headline-lg tracking-tighter text-primary">
            GlobeTrotter
          </span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-gutter">
          {NAV_LINKS.map((link) => (
            <a
              key={link.path}
              href={link.href}
              className={
                activePath === link.path
                  ? "transition-colors uppercase text-primary font-bold font-label-lg text-label-lg"
                  : "font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface transition-colors uppercase"
              }
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right side: Sign In + CTA + Avatar */}
        <div className="flex items-center gap-6">
          <a
            className="hidden sm:inline font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface uppercase transition-colors"
            href="#"
          >
            Sign In
          </a>
          <button className="hidden sm:inline-flex px-6 py-3 bg-primary text-on-primary font-label-lg text-label-lg rounded-lg hover:bg-premium-navy transition-all uppercase">
            Plan My Trip
          </button>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary text-[18px]">
              person
            </span>
          </div>

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
            <a
              key={link.path}
              href={link.href}
              className={
                activePath === link.path
                  ? "text-primary font-bold font-label-lg text-label-lg uppercase"
                  : "font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface transition-colors uppercase"
              }
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-outline-variant/20">
            <a
              className="font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface uppercase transition-colors"
              href="#"
            >
              Sign In
            </a>
            <button className="w-full px-6 py-3 bg-primary text-on-primary font-label-lg text-label-lg rounded-lg hover:bg-premium-navy transition-all uppercase">
              Plan My Trip
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
