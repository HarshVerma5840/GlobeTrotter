/**
 * Bootstrap placeholder only. Every real page (Login, Dashboard, Create
 * Trip, Itinerary Builder, ...) is Frontend track's Wave 0/1 work —
 * see TASKS.md "## Frontend track" and ARCHITECTURE.md §3 for where
 * each one lives under src/pages/.
 */
export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold text-slate-800">GlobeTrotter</h1>
        <p className="text-slate-500">
          Skeleton booted. Pages land here per TASKS.md Frontend track.
        </p>
      </div>
    </div>
  );
}
