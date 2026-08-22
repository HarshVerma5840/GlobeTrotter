interface TravelStatsProps {
  stats: { value: number; label: string }[];
}

export default function TravelStats({ stats }: TravelStatsProps) {
  return (
    <section className="border-y border-outline-variant/20 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
      {stats.map((stat, idx) => (
        <div
          key={stat.label}
          className={`flex flex-col items-center justify-center group cursor-pointer ${
            idx > 0 ? "md:border-l md:border-outline-variant/20" : ""
          }`}
        >
          <span className="font-headline-lg text-6xl text-primary mb-2 group-hover:scale-105 transition-transform">
            {stat.value}
          </span>
          <span className="font-label-sm tracking-widest text-on-surface-variant uppercase">
            {stat.label}
          </span>
        </div>
      ))}
    </section>
  );
}
