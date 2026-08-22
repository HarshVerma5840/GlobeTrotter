# GlobeTrotter — Task Distribution

Parallel work starts now: problem understood, `ARCHITECTURE.md` and
`CONTRACTS.md` locked for the FastAPI + PostgreSQL + React stack, ownership
boundaries defined below. Do not deviate from field names, routes, or
thresholds in `CONTRACTS.md` — if a task needs to change one, update
`CONTRACTS.md` first and flag it to the other tracks before writing code.

Four tracks: **Backend**, **Frontend**, **Integration**, **QA**. Note this
stack shifts more of the total work onto Frontend than an Odoo-native build
would have — there is no free kanban/calendar/graph view here, every screen
is hand-built React (ARCHITECTURE §2) — so Frontend has more P0 slots below
than Backend. Tasks with no "Blocked by" line start immediately, in
parallel, right now.

## How the waves work

**Wave 0** is five independent workstreams starting simultaneously — the
actual parallelism. **Wave 1** is the first integration checkpoint (backend
models/auth must exist for frontend to hit real endpoints instead of a
contract on paper). Waves 2–3 are P1/P2 and only start once P0 is
demo-solid, per the skill's priority order: P0 → testing → UX polish → P1 → P2.

---

## Backend track

### Wave 0 (start now, no blockers)
- **B1** [P0] Scaffold: FastAPI project structure, `pydantic-settings`
  config, SQLAlchemy async engine/session, Alembic init, `GET /health`.
- **B2** [P0] SQLAlchemy models + first Alembic migration: `User`, `Trip`,
  `Stop`, `City`, `Activity`, `ItineraryActivity` (CONTRACTS §2), including
  the trip-date and stop-overlap checks.
- **B3** [P0] Auth: `/auth/signup`, `/auth/login`, `/users/me`, JWT
  encode/decode, bcrypt hashing (CONTRACTS §3).
- **B4** [P0] Shared dependencies: `get_current_user`, `get_owned_trip`
  (CONTRACTS §5) — every later trip-scoped route depends on these, build
  them once, first.
- **B5** [P0] Seed script: cities + activities with `latitude`/`longitude`
  populated for every row (non-negotiable, CONTRACTS §2/§8) and a real
  spread across all six activity categories.

### Wave 1 (after B1–B4 land)
- **B6** [P0] Trip/Stop/ItineraryActivity CRUD routes + `PATCH
  /stops/reorder` (batched, not one call per row) — CONTRACTS §4.
- **B7** [P0] City/Activity search routes with the documented filter
  query params.
- **B8** [P0] `GET /trips/{id}/budget` aggregation (`GROUP BY` query, not a
  stored/cached field — ARCHITECTURE §5).
- **B9** [P1] Public share routes (CONTRACTS §6), token-scoped, no auth
  dependency.
- **B10** [P1] Smart Trip Assistant: `services/autoplan.py` — Groq client
  call + prompt template (grounded in real DB candidates), DB-validation
  step, deterministic fallback (build the fallback first, it's the safety
  net), `POST /trips/{id}/auto-plan` (CONTRACTS §7.1). Requires
  `GROQ_API_KEY` to exercise the LLM path — must still work without it.
- **B11** [P1] `services/feasibility.py` — Google Directions API call
  (server-side, `GOOGLE_MAPS_API_KEY`) as primary distance/duration
  source, Haversine as fallback for any city pair Directions can't route,
  per-city-pair result caching, and the computed fields exposed on stop
  responses (CONTRACTS §7.2).
- **B14** [P2] Places-backed city search: `GET /cities/places-search`,
  `POST /cities/from-place` upserting a `City` row keyed on
  `google_place_id` (CONTRACTS §7.4) — polish on top of the P0 City Search
  screen, which must work on local catalog data alone first.

### Wave 3 (P2, only if P0+P1 are demo-solid)
- **B12** [P2] `trip_collaborators`, `ItineraryVote`, `Comment` tables +
  their routes (CONTRACTS §7.3), plus the `get_owned_trip` update to
  include collaborators.
- **B13** [P2] `GET /admin/analytics` aggregate endpoint, `role=admin`
  gated.

## Frontend track

### Wave 0 (start now — scaffold and build UI shells against the
CONTRACTS route list; wire to real data once Backend Wave 0 lands)
- **F1** [P0] Project scaffold: Vite + React + TS, Tailwind, router, typed
  API client with JWT attach/refresh-on-401, React Query provider.
- **F2** [P0] Login/Signup pages.
- **F3** [P0] Dashboard page: recent trips, popular cities, "Plan New
  Trip" entry point.
- **F4** [P0] Create Trip page + My Trips list/grid (edit/view/delete).
- **F5** [P0] City Search + Activity Search pages (filter UI matching
  CONTRACTS §4 query params).

### Wave 1
- **F6** [P0] **Itinerary Builder** — the largest single frontend task:
  stop list with drag-reorder (`@dnd-kit`), city/date pickers, activity
  picker per stop. Talks only to the documented REST routes via the typed
  client/React Query hooks — no ad hoc `fetch()` calls scattered in
  components.
- **F7** [P0] Itinerary View (read-only render, grouped by stop/day).
- **F8** [P0] Budget page (Recharts pie/bar on the `/budget` response).

### Wave 2 (P1)
- **F9** [P1] Trip Calendar/Timeline page (`react-big-calendar`).
- **F10** [P1] Public Share page — unauthenticated route, read-only,
  "Copy Trip" prompts login if needed (paired with B9).
- **F11** [P1] Profile/Settings page.
- **F12** [P1] Smart Trip Assistant modal (budget/pace/interests +
  "Plan For Me"), paired with B10.
- **F13** [P1] **Route Map component** (`@react-google-maps/api`) — pins,
  Directions-based polylines (straight line when a pair fell back to
  Haversine), feasibility highlight, reading the fields B11 exposes. Needs
  `VITE_GOOGLE_MAPS_API_KEY` (browser-restricted, separate from the
  backend's key). Build the static-SVG fallback path alongside this, not
  after — CONTRACTS §7.2 makes it mandatory, not optional, since Google
  Maps has no offline mode. Coordinate with Integration (I4) on confirmed
  venue connectivity before assuming the online path will work at demo
  time; the data-fetching half is identical either way, so start now.

### Wave 3 (P2)
- **F14** [P2] Collaborator invite UI, vote buttons, comment thread —
  paired with B12.
- **F15** [P2] Admin dashboard page, paired with B13.
- **F16** [P2] Places search box on City Search (falls back to local-only
  search if no result or the Places call fails) — paired with B14.

## Integration track

### Wave 0 (start now, fully independent of Backend/Frontend)
- **I1** [P0] `docker-compose.yml` (services `db`, `api`, `web`) +
  `.env.example` matching every var in CONTRACTS §1 exactly — names and
  defaults, not approximations, including `GOOGLE_MAPS_API_KEY`,
  `VITE_GOOGLE_MAPS_API_KEY`, `GROQ_API_KEY`, `GROQ_MODEL`.
- **I2** [P0] Health-check script + the documented startup sequence from
  CONTRACTS §1 (including `alembic upgrade head`), written as an actual
  runnable script, not just prose in a README.
- **I2b** [P0] Provision the external services the app now depends on:
  create/confirm a Google Cloud project with billing enabled, enable Maps
  JavaScript API + Directions API + Places API, generate **two** API keys
  (an unrestricted-enough server key and an HTTP-referrer-restricted
  browser key — never the same key in both places), and a Groq API key.
  Drop both into the real `.env` (never into `.env.example` or a commit).
  This is real setup time, not a checkbox — don't leave it until the
  night before the demo.

### Wave 1
- **I3** [P0] Fresh-clone verification: delete local state, `git clone`
  into a clean dir, follow only the documented startup steps, confirm
  `/health` returns 200 and the frontend can call the API (CORS configured
  correctly) with no manual fix-ups.
- **I4** [P1] Confirm venue internet connectivity ahead of the actual demo
  and tell Backend/Frontend which path to rehearse: Google
  Maps+Directions+Groq live, or the offline fallbacks (static SVG map,
  deterministic auto-plan). Unlike the earlier Leaflet/OSM plan, Google
  Maps has no offline mode at all, so this decision carries real risk —
  don't assume the venue's Wi-Fi will cooperate, confirm it.

## QA track

### Wave 0 (start now — draft while other tracks build)
- **Q1** [P0] Write the critical-path E2E checklist: signup → login →
  create trip → add stops/activities (F6/B6) → budget view (F8/B8) →
  calendar (F9) → public share (F10/B9) → copy trip. Draft it against
  CONTRACTS now so it's ready to execute the moment Wave 1 lands.
  This chain **is** the demo — completeness here is not optional.
- **Q2** [P0] Security checklist: a user cannot see another user's trip
  (`get_owned_trip` — B4), public route only serves when
  `is_public=true` and the token matches, `401` vs `403` aren't confused
  anywhere, catalog write blocked for non-`catalog_manager` users.

### Wave 1 (execute once Backend/Frontend Wave 0–1 merge)
- **Q3** [P0] Run Q1 for real against a running instance; log every break.
- **Q4** [P0] Run Q2 for real; log every break.

### Wave 2 (once P1 lands)
- **Q5** [P1] Verify Smart Trip Assistant writes real, persisted, editable
  rows (not a client-only preview — CONTRACTS §8 non-negotiable) within
  `budget_target`, using the live Groq path.
- **Q6** [P1] Verify the feasibility flag triggers on a deliberately bad
  itinerary (e.g., two 5,000km-apart cities on consecutive days) and does
  *not* trigger on a reasonable one, using live Directions results.
- **Q9** [P0, do not skip] Deliberately break both external dependencies —
  unset `GROQ_API_KEY` and confirm auto-plan still produces a usable trip
  via the deterministic fallback; unset/invalidate the Maps key (or block
  the domain) and confirm the route view still renders via the static SVG
  fallback. This is P0 despite living in the P1 wave, because CONTRACTS §8
  makes both fallbacks non-negotiable — a demo where the Wi-Fi drops
  cannot be allowed to take the whole app down with it.

### Wave 3 (once P2 lands, time permitting)
- **Q7** [P2] Verify a collaborator can edit stops/activities but cannot
  change `is_public`, `share_token`, or the collaborator list themselves.
- **Q8** Demo rehearsal: time the full walkthrough, confirm it still works
  end to end after every merge from every track.

---

## What genuinely runs in parallel right now

Wave 0 is five independent workstreams starting simultaneously: B1–B5,
F1–F5, I1–I2, and Q1–Q2. Nobody is blocked at hour zero. The only real
synchronization point is Wave 1 ("backend models/auth exist, now everyone
integrates against them") — keep that checkpoint short, and don't let any
track silently drift from `CONTRACTS.md` while waiting for it. Because this
stack has no free native views, Frontend carries the largest P0 surface
area (F1–F8) — if you have more hands than tracks, put the extra ones on
Frontend first, not Backend.
