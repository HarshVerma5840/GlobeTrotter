/**
 * Route guard (INTEGRATION.md §4).
 *
 * Sends signed-out visitors to `/login?redirect=<where they were going>`,
 * so signing in returns them to the page they actually wanted instead of
 * dumping them on the home screen.
 */
import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

import { useAuth } from "./AuthProvider";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Render nothing rather than bouncing to /login: with a valid token in
    // storage, redirecting mid-check would flash the login screen on every
    // reload.
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
          Loading
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return <>{children}</>;
}
