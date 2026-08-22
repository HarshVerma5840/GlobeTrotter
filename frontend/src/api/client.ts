/**
 * The one HTTP boundary in the app.
 *
 * Every request to the backend goes through here. Nothing else in the
 * codebase calls `fetch` — that rule is what makes the Stitch integration
 * mechanical: generated markup contributes layout and styling, and its
 * data comes from `endpoints.ts` (which is built on this file), so there
 * is exactly one place where auth, base URL, and error shape are decided.
 *
 * See INTEGRATION.md §3.
 */
import type { Token } from "../types/models";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

/** Where the access token lives. One key, one place (INTEGRATION.md §4). */
const TOKEN_KEY = "globetrotter.access_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * A failed request, normalized.
 *
 * The backend distinguishes 401 (who are you?) from 403 (we know, you may
 * not) and never conflates them — CONTRACTS §3. The UI must preserve that:
 * 401 means send the user to login, 403 means show "not yours", and they
 * are not interchangeable.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly detail: string,
    readonly body?: unknown,
  ) {
    super(detail);
    this.name = "ApiError";
  }

  get isUnauthenticated(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  /** A business-rule rejection (overlapping stops, dates outside the trip, ...). */
  get isValidation(): boolean {
    return this.status === 422;
  }
}

/**
 * FastAPI returns `{"detail": ...}` on every error, but `detail` is a
 * string for HTTPException and an array of field errors for a Pydantic
 * 422. Flatten both into one readable message so screens can render
 * `error.detail` without type-checking it.
 */
function extractDetail(status: number, body: unknown): string {
  if (typeof body === "object" && body !== null && "detail" in body) {
    const detail = (body as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          if (typeof item !== "object" || item === null) return String(item);
          const e = item as { loc?: unknown[]; msg?: string };
          const field = Array.isArray(e.loc) ? e.loc.slice(1).join(".") : "";
          return field ? `${field}: ${e.msg ?? "invalid"}` : (e.msg ?? "invalid");
        })
        .join("; ");
    }
  }
  return `Request failed (${status})`;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  /** JSON body. Omit for GET/DELETE. */
  json?: unknown;
  /** Form-encoded body — only /auth/login uses this (OAuth2 password flow). */
  form?: Record<string, string>;
  /** Skip the Authorization header. Public share routes take no auth. */
  anonymous?: boolean;
  signal?: AbortSignal;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", json, form, anonymous = false, signal } = options;

  const headers: Record<string, string> = {};
  const token = anonymous ? null : getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let body: string | undefined;
  if (form) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    body = new URLSearchParams(form).toString();
  } else if (json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  }

  const response = await fetch(`${BASE_URL}${path}`, { method, headers, body, signal });

  if (response.status === 204) {
    // DELETE routes return no content — resolving to undefined is correct,
    // and calling .json() here would throw.
    return undefined as T;
  }

  const text = await response.text();
  const parsed: unknown = text ? JSON.parse(text) : null;

  if (!response.ok) {
    // An expired token should not leave the app in a half-authenticated
    // state where every later call also 401s.
    if (response.status === 401) clearToken();
    throw new ApiError(response.status, extractDetail(response.status, parsed), parsed);
  }

  return parsed as T;
}

/** Build a query string, dropping empty/undefined params so filters stay optional. */
export function query(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function storeToken(token: Token): Token {
  setToken(token.access_token);
  return token;
}
