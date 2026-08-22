import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import CreateTrip from "./pages/CreateTrip";
import Profile from "./pages/Profile";
import ItineraryBuilder from "./pages/ItineraryBuilder";

/**
 * Root app component with client-side routing.
 *
 * Pages using the shared Header/Footer chrome are nested under Layout.
 * The Itinerary Builder has its own app-shell (sidebar + topbar) so it
 * lives outside the Layout route.
 */
export default function App() {
  return (
    <Routes>
      {/* Shared Header/Footer layout */}
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/trips/new" element={<CreateTrip />} />
        <Route path="/profile" element={<Profile />} />
        {/* Future pages:
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/trips" element={<MyTrips />} />
          <Route path="/trips/:id/view" element={<ItineraryView />} />
          <Route path="/cities" element={<CitySearch />} />
          <Route path="/activities" element={<ActivitySearch />} />
          <Route path="/trips/:id/budget" element={<Budget />} />
          <Route path="/trips/:id/calendar" element={<Calendar />} />
          <Route path="/share/:token" element={<PublicShare />} />
          <Route path="/auto-plan/:id" element={<AutoPlanWizard />} />
        */}
      </Route>

      {/* App-shell layout (own sidebar + topbar) */}
      <Route path="/trips/:id" element={<ItineraryBuilder />} />
    </Routes>
  );
}
