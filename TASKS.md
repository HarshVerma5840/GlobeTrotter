# GlobeTrotter — Task Distribution

`ARCHITECTURE.md` and `CONTRACTS.md` are locked for the FastAPI +
PostgreSQL + React stack. Do not deviate from field names, routes, or
thresholds in `CONTRACTS.md` — if a task needs to change one, update
`CONTRACTS.md` first, regenerate the contract (below), and flag it.

## Build order — SEQUENTIAL PHASES (superseding the parallel-track plan)

The team has chosen to build in three phases rather than running tracks in
parallel:

| Phase | What | Status |
|---|---|---|
| **A** | Finish the **entire backend**, all waves | Waves 0–1 done; Wave 3 + B11's Directions path remain |
| **B** | Generate the **entire UI in Stitch**, then port it into React | Not started |
| **C** | **Join** the two | Not started |

**Why this is written down rather than assumed:** the original plan built
frontend and backend in parallel and integrated continuously, which made a
mismatch cheap — it surfaced on day one. Sequential phases defer *all*
mismatches to Phase C, which is also the moment with the least time left to
fix them. The risk isn't lower, it's concentrated.

**`INTEGRATION.md` is the mitigation, and it is mandatory reading before
Phase B.** It freezes the API contract into generated TypeScript types, so
a screen that reads a field the backend doesn't serve fails at
`npm run typecheck` instead of at the demo.

### The one command that keeps the phases honest

After **any** backend route or schema change:

```bash
cd backend && python export_openapi.py && cd ../frontend && npm run gen:types && npm run typecheck
```

Skipping this is how Phase C goes wrong.

### Priority order within a phase

P0 → testing → UX polish → P1 → P2. A flashy feature never displaces a
working core flow.

---

## PHASE A — Backend (all waves)

### Wave 0 — **DONE**
- **B1** [P0] ✅ Scaffold: FastAPI project structure, `pydantic-settings`
  config, SQLAlchemy async engine/session, Alembic init, `GET /health`.
- **B2** [P0] ✅ SQLAlchemy models + first Alembic migration: `User`, `Trip`,
  `Stop`, `City`, `Activity`, `ItineraryActivity` (CONTRACTS §2), including
  the trip-date and stop-overlap checks.
- **B3** [P0] ✅ Auth: `/auth/signup`, `/auth/login`, `/users/me`, JWT
  encode/decode, bcrypt hashing (CONTRACTS §3).
- **B4** [P0] ✅ Shared dependencies: `get_current_user`, `get_owned_trip`
  (CONTRACTS §5) — every later trip-scoped route depends on these, build
  them once, first.
- **B5** [P0] ✅ Seed script: cities + activities with `latitude`/`longitude`
  populated for every row (non-negotiable, CONTRACTS §2/§8) and a real
  spread across all six activity categories.

### Wave 1 (after B1–B4 land) — **DONE**, except where noted below

- **B6** [P0] ✅ Trip/Stop/ItineraryActivity CRUD routes + `PATCH
  /stops/reorder` (batched, not one call per row) — CONTRACTS §4.
- **B7** [P0] ✅ City/Activity search routes with the documented filter
  query params.
- **B8** [P0] ✅ `GET /trips/{id}/budget` aggregation (`GROUP BY` query, not a
  stored/cached field — ARCHITECTURE §5).
- **B9** [P1] ✅ Public share routes (CONTRACTS §6), token-scoped, no auth
  dependency. Publishing mints `share_token` on the owner-only `is_public`
  toggle and never regenerates it, so a shared link survives a
  private/public round trip.
- **B10** [P1] ✅ Smart Trip Assistant: `services/autoplan.py` — Groq client
  call + prompt template (grounded in real DB candidates), DB-validation
  step, deterministic fallback (built first, it's the safety net),
  `POST /trips/{id}/auto-plan` (CONTRACTS §7.1). The fallback path is
  covered by tests; the live Groq path still needs a real `GROQ_API_KEY`
  exercised once by hand (feeds QA's Q5).
  Design note: Groq picks *what* (cities/activities), the service computes
  *when* (all date maths) — the model is never asked to produce a date.
  Auto-plan is non-destructive: it fills the days after any existing stop
  rather than clearing hand-built work.
- **B11** [P1] ⚠️ **PARTIAL** `services/feasibility.py` — the Haversine path,
  the pinned threshold, and all five computed fields
  (`distance_from_previous_km`, `travel_duration_hours`, `distance_source`,
  `travel_gap_days`, `is_feasible`) are live on every stop response.
  **Not yet built:** the Google Directions primary path and its per-city-pair
  cache. Deliberate scope call for demo-critical time, not an oversight —
  the fallback CONTRACTS §7.2 requires is the half that has no external
  dependency, so the feature cannot be taken down by a missing key or venue
  Wi-Fi. Adding Directions is a change inside `_measure()` alone: no route,
  schema, or frontend change follows from it. See the module docstring.
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

### Phase A exit gate — all of these before Phase B starts

- [ ] `python -m pytest` green
- [ ] **`alembic upgrade head` run against real PostgreSQL 16** — still
      unverified; the suite runs on in-memory SQLite and the migration was
      hand-authored. Largest untested assumption in the repo (I3).
- [ ] `python export_openapi.py` → `contract/openapi.json` committed
- [ ] `npm run gen:types` → `api.d.ts` regenerated and committed
- [ ] Seed data loads and covers all six categories with real lat/lng
- [ ] Live Groq path exercised once by hand with a real key (Q5)

Freezing the contract here is what lets Phase B proceed without the
backend moving underneath it.

---

## PHASE B — UI in Stitch, then ported to React

Screens are generated in **Stitch** and then ported. Read `INTEGRATION.md`
§5 (screen → route → data map) and §6 (what survives the port) first —
prompt Stitch *from* that table so no screen arrives needing data the API
doesn't serve.

### B-0 — Generate in Stitch
- **S1** [P0] Generate all 15 buildable screens (INTEGRATION.md §5) in one
  consistent visual pass. Screen 16 (Admin) only if B13 gets built.
- **S2** [P0] Check the output against the §5 inventory *before* porting
  anything — a missing or invented screen is far cheaper to catch now.
- **S3** [P0] Settle design tokens: promote recurring Stitch colors/spacing
  into `tailwind.config.js` **once** (INTEGRATION.md §6.1). Two competing
  scales across screens is the main visual-conflict risk.

### B-1 — Port (scaffold already exists)
- **F1** [P0] ✅ **DONE** — typed API client (`src/api/client.ts`), full
  endpoint surface (`src/api/endpoints.ts`), generated types
  (`src/types/api.d.ts` + `models.ts`). Still to add: router + React Query
  provider wiring in `App.tsx`.
- **F1b** [P0] Router + React Query provider + auth guard + the
  `/login?redirect=...` flow.
- **F2** [P0] Login/Signup pages.
- **F3** [P0] Dashboard page: recent trips, popular cities, "Plan New
  Trip" entry point.
- **F4** [P0] Create Trip page + My Trips list/grid (edit/view/delete).
- **F5** [P0] City Search + Activity Search pages (filter UI matching
  CONTRACTS §4 query params).

**Port the first screen alone and review it** before porting the other
fourteen — a systemic problem found on screen 1 is cheap, on screen 15 it
is not (INTEGRATION.md §8).

### B-2 — The demo screens
- **F6** [P0] **Itinerary Builder** — the largest single frontend task:
  stop list with drag-reorder (`@dnd-kit`), city/date pickers, activity
  picker per stop. Reorder sends **one** batched call (`stops.reorder`),
  never one PATCH per row. Talks only through `endpoints.ts` — no ad hoc
  `fetch()` anywhere.
- **F7** [P0] Itinerary View (read-only render, grouped by stop/day).
- **F8** [P0] Budget page (Recharts pie/bar on the `/budget` response).
  Money arrives as **strings** — see INTEGRATION.md §3.1.

### B-3 (P1)
- **F9** [P1] Trip Calendar/Timeline page (`react-big-calendar`).
  `scheduled_time` is a float hour (`14.5` = 14:30), not a time string.
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

### B-4 (P2)
- **F14** [P2] Collaborator invite UI, vote buttons, comment thread —
  paired with B12.
- **F15** [P2] Admin dashboard page, paired with B13.
- **F16** [P2] Places search box on City Search (falls back to local-only
  search if no result or the Places call fails) — paired with B14.

---

## PHASE C — Join backend and frontend

Run the full checklist in **`INTEGRATION.md` §7**. Summary of the gates:

- **C1** [P0] Contract re-export reports *unchanged*; `npm run gen:types`
  produces no diff; `npm run typecheck` and `npm run build` clean.
- **C2** [P0] Full stack up via `docker compose`, migrations applied,
  `/health` 200, seed data loaded.
- **C3** [P0] Walk every screen in a browser with the console open — zero
  CORS errors, zero 404s on API paths, zero unhandled 401/403.
- **C4** [P0] Execute QA Q1 (critical path) and Q2 (security) for real.
- **C5** [P0] Execute Q9 — both external-service fallbacks, keys unset.
- **C6** [P1] Demo rehearsal, timed, end to end (Q8).

---

## Integration track (runs alongside all three phases)

### Wave 0 — **DONE**
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

## Where things stand, and what to watch

**Done:** Phase A Waves 0–1 (B1–B11, with B11 partial), Integration Wave 0,
and the Phase C tooling built early on purpose — the frozen contract,
generated types, and typed API client (`INTEGRATION.md` §1).

**Next:** Phase A Wave 3 (B12–B14) and the Phase A exit gate, then Phase B.

### The three risks this build order creates

1. **Integration is deferred to the end.** That is the deliberate trade for
   a better-looking UI, and `INTEGRATION.md` is the mitigation. It only
   works if the contract is regenerated on every backend change — skipping
   that turns a compile error into a demo-day bug.
2. **Nothing has run against real PostgreSQL.** Tests use in-memory SQLite
   and the migration is hand-authored. Clear this at the Phase A exit gate,
   not during Phase C.
3. **No screen has rendered yet.** The client and types are verified by
   `tsc` only. Port one screen early and review it before committing to
   the other fourteen.

### If you have spare hands

They go on **Phase B porting**, not Backend — the remaining backend work is
all P2 (B12–B14) and none of it is on the demo path. Frontend still carries
the largest P0 surface area, exactly as it did under the parallel plan.
