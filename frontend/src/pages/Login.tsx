/**
 * Login / Signup (INTEGRATION.md §4, CONTRACTS §3).
 *
 * The split-screen layout is ported from the ExploreScape prototype that
 * lived in `Odoo/ExploreScape-Travel-website-main/auth.html`: a full-height
 * photographic panel on the left carrying the brand, the form on the right.
 *
 * What did NOT come across is that prototype's form *fields*. It collected
 * phone, city, country and a free-text "additional information" box, and
 * then navigated to index.html without sending any of it anywhere. The
 * signup contract is `{ email, password, name }` (CONTRACTS §3) and
 * types/models.ts is explicit that a screen never invents a field — so the
 * two-column rhythm is kept, filled with first/last name and the credentials
 * that are actually persisted. Asking for a phone number we would silently
 * drop is worse than not asking.
 *
 * Honours `?redirect=` so signing in returns you to the page you were
 * actually trying to reach.
 */
import { useState, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  /* Signed-in users have no business on this screen; `/dashboard` is the
     app's real home, `/` is the public landing page. */
  const redirectTo = new URLSearchParams(location.search).get("redirect") || "/dashboard";

  if (!isLoading && isAuthenticated) return <Navigate to={redirectTo} replace />;

  const isSignup = mode === "signup";

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (isSignup) {
        await signUp(email, password, `${firstName} ${lastName}`.trim());
      } else {
        await signIn(email, password);
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

  function switchMode() {
    setMode(isSignup ? "signin" : "signup");
    setError(null);
  }

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-editorial-bg">
      {/* ── Left: photographic brand panel ──────────────────────────── */}
      <aside
        className="relative w-full md:w-[45%] min-h-[280px] md:min-h-screen bg-cover bg-center flex flex-col justify-center p-10 lg:p-16"
        style={{ backgroundImage: "url('/img/hero-sky.png')" }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(17,17,17,0.65) 0%, rgba(17,17,17,0.25) 100%)",
          }}
        />
        <div className="relative z-10 flex flex-col gap-4">
          <Link
            to="/"
            className="font-headline-lg text-[40px] lg:text-[48px] leading-none text-white tracking-wide hover:opacity-80 transition-opacity"
          >
            GlobeTrotter
          </Link>
          <p className="font-body-md text-[16px] leading-relaxed tracking-[0.06em] text-white/80 max-w-[80%]">
            The art of travel refined for the intellectually curious.
          </p>
        </div>
      </aside>

      {/* ── Right: the form ─────────────────────────────────────────── */}
      <main className="w-full md:w-[55%] bg-editorial-card flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-[500px]">
          <h2 className="font-headline-lg text-[36px] leading-tight text-editorial-primary">
            {isSignup ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="font-body-md text-[14px] text-editorial-secondary mt-2 mb-10">
            {isSignup
              ? "Join GlobeTrotter and start planning your next journey."
              : "Enter your credentials to access your account."}
          </p>

          <form onSubmit={onSubmit} className="flex flex-col gap-6">
            {isSignup && (
              <div className="flex flex-col sm:flex-row gap-4">
                <Field label="First Name" className="flex-1">
                  <input
                    className={INPUT}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First Name"
                    required
                    autoComplete="given-name"
                  />
                </Field>
                <Field label="Last Name" className="flex-1">
                  <input
                    className={INPUT}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last Name"
                    required
                    autoComplete="family-name"
                  />
                </Field>
              </div>
            )}

            <Field label="Email Address" icon="mail">
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

            <Field label="Password" icon="lock">
              <input
                className={INPUT}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignup ? "At least 8 characters" : "Enter your password"}
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
                className="font-body-md text-[14px] text-on-error-container bg-error-container px-4 py-3 rounded-control"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="mt-2 w-full py-4 bg-editorial-primary text-white rounded-control font-label-lg text-[14px] font-semibold uppercase tracking-[0.15em] flex items-center justify-center gap-3 hover:bg-black hover:shadow-editorial-lift transition-all disabled:opacity-50"
            >
              {busy ? "Working…" : isSignup ? "Register" : "Sign In"}
              {!busy && (
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              )}
            </button>
          </form>

          <p className="mt-8 text-center font-body-md text-[14px] text-editorial-secondary">
            {isSignup ? "Already have an account? " : "Don't have an account? "}
            <button
              type="button"
              onClick={switchMode}
              className="font-semibold text-editorial-primary underline underline-offset-4 hover:text-editorial-secondary transition-colors"
            >
              {isSignup ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}

const INPUT =
  "w-full px-4 py-3 rounded-control border border-editorial-border bg-editorial-bg/60 text-editorial-primary font-body-md text-[14px] placeholder:text-editorial-muted focus:outline-none focus:border-editorial-primary focus:bg-editorial-card focus:shadow-editorial transition-all";

function Field({
  label,
  icon,
  className = "",
  children,
}: {
  label: string;
  icon?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-2 ${className}`}>
      <span className="flex items-center gap-1.5 font-label-sm text-[12px] font-semibold uppercase tracking-[0.1em] text-editorial-secondary">
        {icon && (
          <span className="material-symbols-outlined text-[16px] text-editorial-muted">
            {icon}
          </span>
        )}
        {label}
      </span>
      {children}
    </label>
  );
}
