/**
 * Landing page — the public front door.
 *
 * Ported from the ExploreScape prototype that lived in
 * `Odoo/ExploreScape-Travel-website-main/index.html`. The hero (layered
 * parallax mountains, headline rising behind the peaks) is kept as designed;
 * the chrome is not — that prototype shipped its own navbar with a blue
 * glass tint and a mint-green footer, and both were dropped in favour of the
 * shared Header/Footer so the wordmark and palette do not change when you
 * cross from the marketing page into the app.
 *
 * This route is public: it is where the auth guard's redirect lands, and
 * where a signed-out visitor arrives. Signed in, the hero CTA points at the
 * dashboard instead of the login screen.
 */
import { Link } from "react-router-dom";

import { useAuth } from "../auth/AuthProvider";
import Footer from "../components/Footer";
import Header from "../components/Header";

/** The three parallax plates, back to front. */
const HERO_LAYERS = [
  { src: "/img/hero-layer-3.png", className: "hero-layer-3", z: "z-[1]" },
  { src: "/img/hero-layer-2.png", className: "hero-layer-2", z: "z-[3]" },
  { src: "/img/hero-layer-1.png", className: "hero-layer-1", z: "z-[4]" },
] as const;

function HeroTitle({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <h3 className="hero-eyebrow font-body-md text-[13px] md:text-[1.5rem] font-normal tracking-[0.5em] md:tracking-[15px] text-white text-center uppercase">
        The Land of Serene Beauty
      </h3>
      <h1
        className="hero-title text-[4rem] sm:text-[7rem] lg:text-[11rem] xl:text-[15rem] font-extrabold uppercase text-white text-center leading-none -mt-2 md:-mt-5 tracking-[0.15em] md:tracking-[0.25em] pl-[0.15em]"
        style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}
      >
        Amazon
      </h1>
    </div>
  );
}

export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="bg-editorial-bg font-body-md text-editorial-primary min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* ── Hero ────────────────────────────────────────────────── */}
        <section
          className="hero-sky relative w-full h-screen overflow-hidden bg-cover bg-no-repeat"
          style={{ backgroundImage: "url('/img/hero-sky.png')", backgroundPosition: "top" }}
        >
          {/*
            The headline is rendered twice on purpose. The first copy sits at
            z-[2] — behind the two front mountain plates — so it rises out of
            the valley partly occluded. The second copy sits above everything
            and fades in once the plates have landed, which is what makes the
            peaks read as being in front of the word rather than painted over
            it.
          */}
          <div className="absolute top-[38%] md:top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-full z-[2]">
            <HeroTitle />
          </div>

          {HERO_LAYERS.map((layer) => (
            <img
              key={layer.src}
              src={layer.src}
              alt=""
              aria-hidden="true"
              className={`${layer.className} ${layer.z} absolute left-0 bottom-[-12%] w-full pointer-events-none select-none`}
            />
          ))}

          <div className="hero-front absolute inset-0 z-10 pointer-events-none">
            <div className="absolute top-[38%] md:top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-full">
              <HeroTitle />
            </div>
          </div>

          {/* Hero CTA, above every plate so it stays clickable. */}
          <div className="absolute bottom-[8%] left-0 w-full z-20 flex flex-col items-center gap-6 px-margin-mobile">
            <p className="max-w-xl text-center font-body-md text-[14px] leading-[1.8] tracking-[0.06em] text-white/75">
              Curated expeditions, refined itineraries, and destinations worth the
              journey — planned end to end, one day at a time.
            </p>
            <Link
              to={isAuthenticated ? "/dashboard" : "/login"}
              className="h-[50px] w-[300px] max-w-full flex items-center justify-center gap-2 rounded-full border border-white/80 text-white/90 uppercase text-[15px] tracking-[0.2em] hover:bg-white hover:text-editorial-primary transition-colors"
            >
              {isAuthenticated ? "Continue Planning" : "Begin Your Journey"}
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>
        </section>

        {/* ── Three ways in ───────────────────────────────────────── */}
        <section className="w-full bg-editorial-bg px-margin-mobile md:px-margin-tablet lg:px-margin-desktop py-24">
          <div className="max-w-[1440px] mx-auto flex flex-col gap-16">
            <div className="flex flex-col gap-4 max-w-2xl">
              <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-editorial-primary">
                Travel, considered
              </h2>
              <p className="font-body-lg text-body-lg text-editorial-secondary">
                Search the catalogue, shape the days, and keep the whole journey in
                one place.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
              {[
                {
                  icon: "travel_explore",
                  title: "Discover",
                  body: "Browse destinations and experiences, filtered down to the ones that fit the trip you have in mind.",
                  to: "/explore",
                  cta: "Explore",
                },
                {
                  icon: "edit_calendar",
                  title: "Plan",
                  body: "Build the itinerary day by day — stops, activities, and the budget that follows from them.",
                  to: "/trips/new",
                  cta: "Plan a trip",
                },
                {
                  icon: "map",
                  title: "Keep",
                  body: "Every journey stays where you left it, ready to pick back up, share, or copy into the next one.",
                  to: "/trips",
                  cta: "My trips",
                },
              ].map((card) => (
                <Link
                  key={card.title}
                  to={isAuthenticated ? card.to : `/login?redirect=${encodeURIComponent(card.to)}`}
                  className="group flex flex-col gap-5 bg-editorial-card border border-editorial-border rounded-card p-8 shadow-editorial hover:border-editorial-primary/40 hover:shadow-editorial-lift transition-all"
                >
                  <span className="material-symbols-outlined text-[28px] text-editorial-secondary">
                    {card.icon}
                  </span>
                  <h3 className="font-headline-md text-headline-md text-editorial-primary leading-none">
                    {card.title}
                  </h3>
                  <p className="font-body-md text-body-md text-editorial-secondary flex-1">
                    {card.body}
                  </p>
                  <span className="font-label-sm text-label-sm uppercase text-editorial-primary flex items-center gap-2">
                    {card.cta}
                    <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
