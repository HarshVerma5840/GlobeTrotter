/**
 * Routes.
 *
 * `/login` renders standalone (its own minimal header). Every other route
 * is guarded by `RequireAuth` — every write route on the backend requires
 * auth (CONTRACTS §3), so every screen that can create or edit a trip
 * belongs behind the same gate as the Dashboard.
 *
 * Pages using the shared Header/Footer chrome are nested under `Layout`.
 * The Itinerary Builder has its own app-shell (sidebar + topbar), so it's
 * guarded separately and lives outside the Layout route.
 *
 * Screens beyond Dashboard/Login/CreateTrip/MyTrips/Profile/ItineraryBuilder
 * are still to be ported from Stitch (INTEGRATION.md §5) — the header
 * renders those nav items inert rather than linking to a 404 (see
 * components/Header.tsx).
 */
import { Navigate, Route, Routes } from "react-router-dom";

import { RequireAuth } from "./auth/RequireAuth";
import Layout from "./components/Layout";
import CreateTrip from "./pages/CreateTrip";
import Dashboard from "./pages/Dashboard";
import ItineraryBuilder from "./pages/ItineraryBuilder";
import Login from "./pages/Login";
import MyTrips from "./pages/MyTrips";
import Profile from "./pages/Profile";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Shared Header/Footer layout, guarded */}
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/trips/new" element={<CreateTrip />} />
        <Route path="/trips" element={<MyTrips />} />
        <Route path="/profile" element={<Profile />} />
        {/* Future pages:
          <Route path="/trips/:id/view" element={<ItineraryView />} />
          <Route path="/cities" element={<CitySearch />} />
          <Route path="/activities" element={<ActivitySearch />} />
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

      {/* Unknown paths go home; the guard sends signed-out users on to login. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
