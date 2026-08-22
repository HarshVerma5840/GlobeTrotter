/**
 * Auth state for the whole app (INTEGRATION.md §4).
 *
 * The token itself is owned by api/client.ts — this only tracks *who* is
 * signed in, by asking the server. It never decodes the JWT client-side:
 * a token the server rejects is not a session, whatever its payload says.
 */
import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiError, clearToken, getToken } from "../api/client";
import { api } from "../api/endpoints";
import type { User } from "../types/models";

interface AuthValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["users", "me"],
    queryFn: api.users.me,
    // No token means no request at all — an unauthenticated visitor should
    // not fire a call that is guaranteed to 401.
    enabled: Boolean(getToken()),
    retry: (count, error) =>
      // Retrying a 401 is pointless; the token is bad, not the network.
      error instanceof ApiError && error.isUnauthenticated ? false : count < 2,
    staleTime: 5 * 60 * 1000,
  });

  // signIn/signUp fetch the user and write it straight into the cache with
  // setQueryData, rather than storeToken() + invalidateQueries(). The
  // "users","me" query's `enabled` flag reads getToken() at render time; a
  // token written by storeToken() *just now*, inside this same event
  // handler, hasn't triggered a re-render yet, so invalidateQueries would
  // still see the query as disabled and silently skip refetching it — the
  // caller then navigates while `user` is still null and the route guard
  // bounces straight back to login. Fetching directly sidesteps the race.
  const signIn = useCallback(
    async (email: string, password: string) => {
      await api.auth.login(email, password);
      const user = await api.users.me();
      queryClient.setQueryData(["users", "me"], user);
    },
    [queryClient],
  );

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      // Signup already returns and stores a token (CONTRACTS §3), so there
      // is no follow-up login call — just the same direct user fetch.
      await api.auth.signup({ email, password, name });
      const user = await api.users.me();
      queryClient.setQueryData(["users", "me"], user);
    },
    [queryClient],
  );

  const signOut = useCallback(() => {
    clearToken();
    // Set to null (not just clear()) so `isAuthenticated` flips to false on
    // the SAME render pass, in-app, with no reload — clear() alone left a
    // stale Dashboard on screen until the next navigation picked the change
    // back up, the same enabled-flag-race as signIn/signUp above.
    queryClient.setQueryData(["users", "me"], null);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo<AuthValue>(
    () => ({
      user: data ?? null,
      isLoading: Boolean(getToken()) && isLoading,
      isAuthenticated: Boolean(data),
      signIn,
      signUp,
      signOut,
    }),
    [data, isLoading, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
