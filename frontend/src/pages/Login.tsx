/**
 * Login / Signup (INTEGRATION.md §4, CONTRACTS §3).
 *
 * Exists so the Dashboard's auth guard has somewhere to send people and
 * the flow can be walked end to end. Honours `?redirect=` so signing in
 * returns you to the page you were actually trying to reach.
 */
import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthProvider";

type Mode = "signin" | "signup";

export default function Login() {
  const { isAuthenticated, isLoading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const redirectTo = new URLSearchParams(location.search).get("redirect") || "/";

  // Already signed in (or just signed in) — don't show the form at all.
  if (!isLoading && isAuthenticated) return <Navigate to={redirectTo} replace />;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
      } else {
        await signUp(email, password, name);
      }
      navigate(redirectTo, { replace: true });
    } catch (err) {
      // Surface the server's own message — it distinguishes "bad
      // credentials" from "email already registered" (409), and guessing
      // at a generic string would hide that.
      setError(
        err instanceof ApiError
          ? err.detail
          : "Could not reach the server. Is the API running?",
      );
    } finally {
      setBusy(false);
    }
  }

  const isSignup = mode === "signup";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="h-20 max-w-[1440px] w-full mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin-desktop flex items-center">
        <span className="font-headline-lg text-headline-lg tracking-tighter text-primary">
          GlobeTrotter
        </span>
      </div>

      <main className="flex-1 flex items-center justify-center px-margin-mobile py-12">
        <div className="w-full max-w-md flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h1 className="font-display-xl text-headline-lg md:text-display-xl leading-none text-primary tracking-tight">
              {isSignup ? "Begin" : "Welcome back"}
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              {isSignup
                ? "Create an account to start planning expeditions."
                : "Sign in to reach your itineraries."}
            </p>
          </div>

          <form
            onSubmit={onSubmit}
            className="bg-surface-container-lowest shadow-xl rounded-xl p-6 flex flex-col gap-5"
          >
            {isSignup && (
              <Field label="Name">
                <input
                  className={INPUT}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ada Lovelace"
                  required
                  autoComplete="name"
                />
              </Field>
            )}

            <Field label="Email">
              <input
                className={INPUT}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </Field>

            <Field label="Password">
              <input
                className={INPUT}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                // Mirrors the backend's Pydantic rule so the user finds out
                // here instead of via a 422 round trip (CONTRACTS §3).
                minLength={8}
                autoComplete={isSignup ? "new-password" : "current-password"}
              />
            </Field>

            {error && (
              <p
                role="alert"
                className="font-body-md text-body-md text-on-error-container bg-error-container px-4 py-3 rounded-lg"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full px-8 py-3 bg-primary text-on-primary font-label-lg text-label-lg rounded-lg hover:bg-premium-navy transition-all uppercase disabled:opacity-50 h-[48px]"
            >
              {busy ? "Working…" : isSignup ? "Create account" : "Sign in"}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode(isSignup ? "signin" : "signup");
                setError(null);
              }}
              className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
            >
              {isSignup ? "Already have an account? Sign in" : "New here? Create an account"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

const INPUT =
  "w-full bg-sand-accent text-on-surface font-body-md text-body-md py-3 px-4 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/50";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
        {label}
      </span>
      {children}
    </label>
  );
}
