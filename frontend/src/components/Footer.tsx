/**
 * The one GlobeTrotter footer — landing page and app both.
 *
 * Warm beige surface, black/secondary type. Travel language only: there is
 * no "protocol", no on-chain anything, and no crypto vocabulary anywhere in
 * this product.
 */
const FOOTER_LINKS = {
  explore: [
    { label: "Destinations", href: "#" },
    { label: "Experiences", href: "#" },
    { label: "Journals", href: "#" },
  ],
  plan: [
    { label: "Itineraries", href: "#" },
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
      <span className="font-label-lg text-label-lg text-editorial-primary uppercase">
        {title}
      </span>
      <nav className="flex flex-col gap-4">
        {links.map((link) => (
          <a
            key={link.label}
            className="font-body-md text-body-md text-editorial-secondary hover:text-editorial-primary transition-colors"
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
    <footer className="w-full bg-editorial-surface pt-24 pb-12 border-t border-editorial-border">
      <div className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
        {/* Top grid: brand + link columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-20">
          {/* Brand block */}
          <div className="flex flex-col gap-content-v-gap">
            <span className="font-headline-md text-headline-md text-editorial-primary">
              GlobeTrotter
            </span>
            <p className="font-body-md text-body-md text-editorial-secondary max-w-xs">
              The art of travel refined for the intellectually curious.
            </p>
          </div>

          <FooterLinkColumn title="Explore" links={FOOTER_LINKS.explore} />
          <FooterLinkColumn title="Plan" links={FOOTER_LINKS.plan} />
          <FooterLinkColumn title="Company" links={FOOTER_LINKS.company} />
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-editorial-border flex flex-col md:flex-row justify-between items-center gap-6">
          <span className="font-label-sm text-label-sm text-editorial-secondary">
            © 2024 GlobeTrotter. All rights reserved.
          </span>
          <div className="flex gap-8">
            <a
              className="font-label-sm text-label-sm text-editorial-secondary hover:text-editorial-primary uppercase transition-colors"
              href="#"
            >
              Privacy
            </a>
            <a
              className="font-label-sm text-label-sm text-editorial-secondary hover:text-editorial-primary uppercase transition-colors"
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
