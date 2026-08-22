const FOOTER_LINKS = {
  explore: [
    { label: "Destinations", href: "#" },
    { label: "Experiences", href: "#" },
    { label: "Journals", href: "#" },
  ],
  plan: [
    { label: "Itineraries", href: "#" },
    { label: "Concierge", href: "#" },
    { label: "Travel Guides", href: "#" },
  ],
  company: [
    { label: "Our Story", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Press", href: "#" },
  ],
} as const;

function FooterLinkColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { label: string; href: string }[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <span className="font-label-lg text-label-lg text-primary uppercase">
        {title}
      </span>
      <nav className="flex flex-col gap-4">
        {links.map((link) => (
          <a
            key={link.label}
            className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors"
            href={link.href}
          >
            {link.label}
          </a>
        ))}
      </nav>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="w-full bg-surface-container-low pt-section-v-gap pb-12 border-t border-outline-variant/10">
      <div className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
        {/* Top grid: brand + link columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-section-v-gap">
          {/* Brand block */}
          <div className="flex flex-col gap-content-v-gap">
            <span className="font-headline-md text-headline-md text-primary">
              GlobeTrotter
            </span>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-xs">
              The art of travel refined for the intellectually curious.
            </p>
          </div>

          <FooterLinkColumn title="Explore" links={FOOTER_LINKS.explore} />
          <FooterLinkColumn title="Plan" links={FOOTER_LINKS.plan} />
          <FooterLinkColumn title="Company" links={FOOTER_LINKS.company} />
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-outline-variant flex flex-col md:flex-row justify-between items-center gap-6">
          <span className="font-label-sm text-label-sm text-on-secondary-fixed-variant">
            © 2024 GlobeTrotter. All rights reserved.
          </span>
          <div className="flex gap-8">
            <a
              className="font-label-sm text-label-sm text-on-secondary-fixed-variant hover:text-on-surface uppercase transition-colors"
              href="#"
            >
              Privacy
            </a>
            <a
              className="font-label-sm text-label-sm text-on-secondary-fixed-variant hover:text-on-surface uppercase transition-colors"
              href="#"
            >
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
