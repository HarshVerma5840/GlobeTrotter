# GlobeTrotter — Kickoff Prompts

> ## ⚠️ Build order changed — read this first
>
> The prompts in sections 0–4 below were written for the **original
> parallel-track plan** (Backend, Frontend, Integration, QA all running at
> once). The team now builds in **three sequential phases**:
>
> **A** entire backend → **B** entire UI in Stitch, ported to React → **C** integration.
>
> **Current state:** the Setup prompt (§0) and most of the Backend prompt
> (§1) are already done — Phase A Waves 0–1 have landed. The **Frontend
> Track Prompt (§2) is superseded** by the Phase B prompt below; do not run
> it as written, because it assumes hand-built screens and a frontend
> running concurrently with backend changes.
>
> Use **§5 (Phase A finish)** and **§6 (Phase B)** below. Sections 0–4 are
> kept for reference and for the Integration/QA prompts, which still apply.

---

## 5. Phase A — Finish the backend

```
Read CLAUDE.md, ARCHITECTURE.md, CONTRACTS.md, INTEGRATION.md, and
TASKS.md. Phase A Waves 0-1 are already done and green (114 tests).

Your job is to finish Phase A: TASKS.md Wave 3 (B12 collaborators/votes/
comments, B13 admin analytics, B14 Places-backed city search), plus the
Phase A exit gate in TASKS.md.

Rules:
- CONTRACTS.md is binding. Update it FIRST if a route/field must change.
- B12 widens trip access to collaborators — change it ONLY in
  api/deps.py's assert_trip_access, never inline in a route
  (CONTRACTS §8). assert_trip_owner must stay owner-only so collaborators
  never gain the sharing controls.
- Every new route needs tests in the existing pytest style.
- When done, run BOTH:
    cd backend && python export_openapi.py
    cd ../frontend && npm run gen:types && npm run typecheck
  and commit the regenerated contract/openapi.json and api.d.ts. This is
  non-negotiable — it is what stops Phase C from breaking (INTEGRATION.md §1).

Do not start any UI work. Stop and report what landed.
```

---

## 6. Phase B — Stitch UI, then port to React

```
Read INTEGRATION.md end to end before writing any code — especially §3
(known conflict traps), §5 (screen → route → data map), and §6 (what
survives the port from Stitch).

The backend is finished and its contract is frozen in contract/openapi.json.
The typed client already exists: frontend/src/api/client.ts,
frontend/src/api/endpoints.ts, frontend/src/types/models.ts.

Your job is to port Stitch-generated screens into React.

Hard rules:
- Nothing outside client.ts calls fetch(). Delete any fetch/AJAX code that
  came out of Stitch.
- No URL path string outside endpoints.ts.
- No screen declares its own API shape — import from types/models.ts.
- Backend field names win over Stitch's. Never rename server-side.
- Money is a JSON STRING ("70.00"), not a number — use formatMoney().
- Dates are "YYYY-MM-DD" strings; don't new Date() them casually.
- 401 means log in; 403 means not yours. Never conflate them.
- Every screen handles loading, empty, AND error states — Stitch mocks
  show none of them.

Port ONE screen first, completely, and stop for review before doing the
rest. A systemic porting problem is cheap to fix on screen 1 and expensive
on screen 15.

Run `npm run typecheck` after each screen. It must stay clean.
```

---

## Reference: original parallel-track prompts (superseded)

---

## 0. Setup Prompt (run this first, once)

```
You're bootstrapping the GlobeTrotter hackathon repo. Load the
hackathon-engineering skill if it's available to you, then read
ARCHITECTURE.md, CONTRACTS.md, and TASKS.md at the repo root — they are
the binding source of truth for schema, routes, ports, env vars, and task
ownership. Do not invent anything that conflicts with them.

Your job right now is ONLY to lay the skeleton every other track builds
inside — not to implement any feature logic. Specifically:

1. Create this top-level layout (empty placeholder files/dirs are fine
   where noted):
   backend/app/ (empty __init__.py files for: core, db, models, schemas,
     api/routes, services), backend/alembic/, backend/tests/,
     backend/pyproject.toml with FastAPI, SQLAlchemy[asyncio], asyncpg,
     alembic, pydantic-settings, python-jose, passlib[bcrypt], pytest,
     httpx as dependencies (exact versions per CONTRACTS.md §0),
     backend/Dockerfile.
   frontend/ — a Vite + React + TypeScript scaffold (`npm create vite@latest`
     equivalent), with Tailwind configured, and empty src/pages/ and
     src/components/ and src/api/ and src/types/ directories per
     ARCHITECTURE.md §3, frontend/Dockerfile.
2. Root docker-compose.yml with exactly the three services in
   CONTRACTS.md §0/§1 (db, api, web) and .env.example with every variable
   in CONTRACTS.md §1, correct names and defaults — not approximations.
3. A README.md with the exact startup sequence from CONTRACTS.md §1
   (docker compose up, alembic upgrade head, curl /health).
4. A backend `GET /health` endpoint that returns 200 once it can reach the
   DB — this is the one piece of real code in this pass, since every other
   track's first task depends on it existing to test against.
5. Commit this skeleton (`git init` if not already, meaningful commit
   message) so Backend, Frontend, Integration, and QA can each start their
   Wave 0 tasks from TASKS.md immediately after.

Do not implement any model, route, or page beyond what's listed above —
that's every other track's job, starting the moment this lands. Stop and
tell me what you did when this is committed.
```

---

## 1. Backend Track Prompt

```
You own the Backend track for the GlobeTrotter hackathon project. Load the
hackathon-engineering skill if available. Before writing anything, read
ARCHITECTURE.md, CONTRACTS.md, and TASKS.md at the repo root in full —
CONTRACTS.md is the binding schema/route/env contract, ARCHITECTURE.md is
the system design, TASKS.md has your exact task list under "## Backend
track". Do not invent fields, routes, or env vars that conflict with
CONTRACTS.md. If something you need to build requires changing it, update
CONTRACTS.md first and clearly flag the change (what changed, why, who
else it affects) before writing code against it.

You work only inside backend/ — never touch frontend/ files. Repo skeleton
should already exist (backend/app/, alembic/, pyproject.toml,
Dockerfile) — if it doesn't yet, stop and say so rather than improvising a
different layout.

Do Backend Wave 0 first, in this order, and don't start Wave 1 until all
of Wave 0 is done and you've said so:
- B1: FastAPI app skeleton, pydantic-settings config reading the exact
  env vars in CONTRACTS.md §1, async SQLAlchemy engine/session, Alembic
  initialized, GET /health.
- B2: SQLAlchemy models for User, Trip, Stop, City, Activity,
  ItineraryActivity exactly per CONTRACTS.md §2 (field names, types,
  constraints — including the trip date_end >= date_start check and the
  stop non-overlap rule), plus the first Alembic migration.
- B3: Auth — POST /auth/signup, POST /auth/login (OAuth2 password flow),
  GET /users/me, JWT encode/decode per CONTRACTS.md §3, bcrypt password
  hashing via passlib. Never log or store a plaintext password.
- B4: Shared dependencies get_current_user and get_owned_trip per
  CONTRACTS.md §5 — every later trip-scoped route must depend on these,
  so get them right and don't let any route reimplement the ownership
  check inline.
- B5: Seed script populating cities and activities, with latitude/
  longitude on every city (non-negotiable per CONTRACTS.md §2/§8) and a
  real spread across all six activity categories.

After Wave 0 is done and confirmed working (health check passes,
migration applies cleanly, signup/login round-trips a token), move to
Wave 1 (B6–B11) in TASKS.md. Note B10 (Smart Trip Assistant) and B11
(feasibility) now integrate real external services — Groq for
recommendations, Google Directions for routing — per CONTRACTS.md §7.1/
§7.2. Build the deterministic/Haversine fallback path in each FIRST, then
the external-API path on top of it, not the other way around: the
fallback is what keeps the feature alive if GROQ_API_KEY or
GOOGLE_MAPS_API_KEY is missing or a call fails, and CONTRACTS.md §8 makes
that non-negotiable, not a nice-to-have. Then Wave 3/P2 (B12–B14) only if
P0/P1 across all tracks are demo-solid — check TASKS.md's own priority
note before starting P2 work.

Write backend tests (pytest + httpx TestClient) for every route as you
build it, not as an afterthought. Report back after each numbered task
(B1, B2, ...) with what you built and any CONTRACTS.md deviations.
```

---

## 2. Frontend Track Prompt

```
You own the Frontend track for the GlobeTrotter hackathon project. Load
the hackathon-engineering skill if available. Before writing anything,
read ARCHITECTURE.md, CONTRACTS.md, and TASKS.md at the repo root in full
— CONTRACTS.md is the binding route/field contract (it doubles as what
the backend's FastAPI /docs will serve once running), ARCHITECTURE.md
section 2 maps every one of the 13 screens plus the two differentiator
features to a route, and TASKS.md has your exact task list under
"## Frontend track". Note ARCHITECTURE.md's stated trade-off: this stack
has no free native views — every screen is a page you build by hand — so
you have more P0 tasks than Backend does. Budget your time accordingly.

You work only inside frontend/ — never touch backend/ files. Repo
skeleton should already exist (Vite + React + TS + Tailwind) — if it
doesn't yet, stop and say so rather than improvising a different setup.

Do Frontend Wave 0 first, in this order:
- F1: typed API client (attaches JWT from storage, handles 401 by
  redirecting to login), React Query provider, router.
- F2: Login/Signup pages, calling the auth routes in CONTRACTS.md §3.
- F3: Dashboard page — recent trips, popular cities, "Plan New Trip".
- F4: Create Trip page, My Trips list/grid (edit/view/delete actions).
- F5: City Search + Activity Search pages, using the exact filter query
  params named in CONTRACTS.md §4.

You can and should build F1–F5 against the route contract even before the
backend endpoints are live — use the documented request/response shapes
from CONTRACTS.md §2–§4 to build with mock data or a thin fetch wrapper,
then swap in real calls once Backend's Wave 0 lands. Don't invent
different field names "for now" — match the contract exactly so the swap
is trivial.

Then Wave 1:
- F6: Itinerary Builder — your largest single task. Stop list with
  drag-reorder (@dnd-kit), city/date pickers, per-stop activity picker.
  Talk only to the documented REST routes through your typed client/React
  Query hooks — no ad hoc fetch() calls scattered through components.
- F7: Itinerary View (read-only render of the same data).
- F8: Budget page (Recharts, reading GET /trips/{id}/budget).

Then Wave 2 (P1: F9–F13) and Wave 3 (P2: F14–F16) only once earlier waves
are demo-solid — see TASKS.md for the full list and the pace/interest/
preferences inputs the Smart Trip Assistant modal (F12) needs. F13 (Route
Map) uses `@react-google-maps/api` and `VITE_GOOGLE_MAPS_API_KEY`, not
Leaflet — build its mandatory static-SVG fallback alongside it, not after
(CONTRACTS.md §7.2 makes that non-negotiable), and coordinate confirmed
venue connectivity with whoever owns Integration before treating the
live-Maps path as the only one that has to work.

Report back after each numbered task with what you built and any
CONTRACTS.md deviations.
```

---

## 3. Integration Track Prompt

```
You own the Integration track for the GlobeTrotter hackathon project.
Load the hackathon-engineering skill if available. Read ARCHITECTURE.md,
CONTRACTS.md, and TASKS.md at the repo root in full — CONTRACTS.md §0/§1
has the exact service names, ports, and env vars you must match, no
approximations. Your task list is under "## Integration track" in
TASKS.md.

You touch docker-compose.yml, .env.example, README/startup docs, and CI
config if any — not backend/ or frontend/ feature code, though you may
need to add their Dockerfiles if Setup didn't already.

Wave 0:
- I1: docker-compose.yml with exactly three services — db (postgres per
  CONTRACTS.md §0), api (FastAPI/uvicorn), web (Vite dev server) — and
  .env.example matching every variable in CONTRACTS.md §1 by name and
  default.
- I2: a real, runnable health-check script (not just prose) that runs
  `alembic upgrade head` then confirms GET /health returns 200 — this is
  the exact sequence in CONTRACTS.md §1.
- I2b: provision the real external services — a Google Cloud project with
  billing enabled and Maps JavaScript API + Directions API + Places API
  turned on, two separate API keys (a server key and a browser key
  restricted by HTTP referrer — never the same key in both places), and a
  Groq API key. Put them in the real .env, never in .env.example or a
  commit. Do this now, not the night before the demo.

Wave 1:
- I3: fresh-clone verification — actually delete local state, clone into
  a clean directory, follow only the documented steps, confirm the
  frontend can reach the API (check CORS_ORIGINS is set right) with zero
  manual fix-ups. Log anything that required a manual step; that's a bug
  to fix in the docs or the compose file, not something to just remember
  for next time.
- I4: confirm actual venue internet connectivity ahead of the demo and
  tell Backend/Frontend which path to rehearse — Google Maps/Directions/
  Groq live, or the mandatory offline fallbacks (static SVG map,
  deterministic auto-plan) per CONTRACTS.md §7.1/§7.2. Google Maps has no
  offline mode at all, unlike the earlier Leaflet/OSM plan, so don't
  assume the venue's Wi-Fi will cooperate — confirm it, and make sure both
  fallbacks have actually been tested, not just written, before the
  Route Map component's rendering half is considered done.

Report back after each task with what you built and confirmation the
fresh-clone test actually passed end to end.
```

---

## 4. QA Track Prompt

```
You own the QA track for the GlobeTrotter hackathon project. Load the
hackathon-engineering skill if available. Read ARCHITECTURE.md,
CONTRACTS.md, and TASKS.md at the repo root in full. Your task list is
under "## QA track" in TASKS.md. You don't own any feature code, but you
need read access to both backend/ and frontend/ to test against them.

Wave 0 (start now, before there's anything running yet):
- Q1: write the critical-path E2E checklist as an actual step-by-step
  script — signup, login, create trip, add stops/activities, view budget,
  view calendar, view/generate public share link, copy trip. Base every
  step on the exact routes and fields in CONTRACTS.md so it's ready to
  execute the moment Backend/Frontend Wave 1 lands, not something you
  have to rewrite later.
- Q2: write the security checklist — a user must not be able to see
  another user's trip (test get_owned_trip directly, not just through the
  UI), the public share route must only serve a trip when is_public=true
  and the token matches, a missing/bad token must 401 (never 403, don't
  let the two get confused), catalog writes must be blocked for anyone
  without the catalog_manager role.

Wave 1 (once Backend/Frontend Wave 0–1 are merged and running):
- Q3/Q4: actually run Q1 and Q2 against the live docker-compose stack —
  not against mocks — and log every single break with the exact request/
  response that failed, so whoever owns that route can reproduce it in
  one step.

Wave 2 (once P1 lands): verify the Smart Trip Assistant writes real,
persisted, editable rows within the given budget target (not a preview
that vanishes on refresh), and verify the feasibility flag actually
triggers on a deliberately bad itinerary (e.g. two 5,000km-apart cities on
consecutive days) and does not trigger on a reasonable one.

Wave 3 (once P2 lands, time permitting): verify a collaborator can edit
stops/activities but cannot change is_public, share_token, or the
collaborator list themselves; then do a full timed demo rehearsal and
confirm nothing broke after the last round of merges.

Report every failure with the exact steps to reproduce it, not a summary
— whoever fixes it needs to be able to hit the same failure in one try.
```
