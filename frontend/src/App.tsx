/**
 * Routes.
 *
 * `/` is the public landing page and `/login` renders standalone — those two
 * are the whole unauthenticated surface. Everything else is guarded by
 * `RequireAuth`: every write route on the backend requires auth (CONTRACTS
 * §3), and so does the catalogue search behind Explore, so every screen that
 * can read or edit a trip belongs behind the same gate as the Dashboard.
 *
 * The app's own home is `/dashboard`, not `/` — `/` belongs to the marketing
 * page now that it has been brought in from the ExploreScape prototype.
 *
 * Pages using the shared Header/Footer chrome are nested under `Layout`.
 * The Itinerary Builder has its own app-shell (sidebar + topbar), so it's
 * guarded separately and lives outside the Layout route.
 */
import { Navigate, Route, Routes } from "react-router-dom";

import { RequireAuth } from "./auth/RequireAuth";
import Layout from "./components/Layout";
import CreateTrip from "./pages/CreateTrip";
import Dashboard from "./pages/Dashboard";
import ItineraryBuilder from "./pages/ItineraryBuilder";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import MyTrips from "./pages/MyTrips";
import Profile from "./pages/Profile";
import Search from "./pages/Search";

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />

      {/* Shared Header/Footer layout, guarded */}
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/trips/new" element={<CreateTrip />} />
        <Route path="/trips" element={<MyTrips />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/explore" element={<Search />} />
        {/* Activity Search and City Search are two tabs of one screen —
            these keep the contract's URLs working (INTEGRATION.md §5). */}
        <Route path="/activities" element={<Navigate to="/explore?tab=activities" replace />} />
        <Route path="/cities" element={<Navigate to="/explore?tab=cities" replace />} />
        {/* Future pages:
          <Route path="/trips/:id/view" element={<ItineraryView />} />
          <Route path="/trips/:id/budget" element={<Budget />} />
          <Route path="/trips/:id/calendar" element={<Calendar />} />
          <Route path="/share/:token" element={<PublicShare />} />
          <Route path="/auto-plan/:id" element={<AutoPlanWizard />} />
        */}
      </Route>

      {/* App-shell layout (own sidebar + topbar), guarded separately */}
      <Route
        path="/trips/:id"
        element={
          <RequireAuth>
            <ItineraryBuilder />
          </RequireAuth>
        }
      />

      {/* Unknown paths go to the landing page, which is public — so an
          unrecognised URL never bounces a signed-out visitor to login. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
