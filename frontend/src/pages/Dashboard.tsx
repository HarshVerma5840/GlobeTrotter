import HeroSection from "../components/dashboard/HeroSection";
import ExperienceGrid from "../components/dashboard/ExperienceGrid";

/**
 * Dashboard / Home — the "Curated Expeditions" explore page.
 *
 * This is the main page derived from the Stitch HTML mockup. It composes
 * the hero section (title + search + filters) and the experience grid
 * (sidebar + cards + CTA). Header and Footer are rendered by the Layout
 * component in the router.
 */
export default function Dashboard() {
  return (
    <div className="flex flex-col w-full bg-background min-h-screen">
      <HeroSection />
      <ExperienceGrid />
    </div>
  );
}
