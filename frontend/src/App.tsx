import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import CreateTrip from "./pages/CreateTrip";

/**
 * Root app component with client-side routing.
 *
 * The Dashboard (Curated Expeditions) is the home page. Other pages
 * (Login, My Trips, Itinerary Builder, etc.) will be added as the
 * Frontend track progresses per TASKS.md.
 */
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/trips/new" element={<CreateTrip />} />
        {/* Future pages:
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/trips" element={<MyTrips />} />
          <Route path="/trips/:id" element={<ItineraryBuilder />} />
          <Route path="/trips/:id/view" element={<ItineraryView />} />
          <Route path="/cities" element={<CitySearch />} />
          <Route path="/activities" element={<ActivitySearch />} />
          <Route path="/trips/:id/budget" element={<Budget />} />
          <Route path="/trips/:id/calendar" element={<Calendar />} />
          <Route path="/share/:token" element={<PublicShare />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/auto-plan/:id" element={<AutoPlanWizard />} />
        */}
      </Route>
    </Routes>
  );
}

