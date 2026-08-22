# GlobeTrotter — Architecture

Source of truth for system structure. Any change to models, routes, ports, or
env vars must be reflected in `CONTRACTS.md` first (see hackathon-engineering
rule), then here.

**Stack decision (superseding the earlier Odoo-native draft):** the team is
building a standalone application — **FastAPI + SQLAlchemy + PostgreSQL**
backend, **React + TypeScript** frontend — not an installed Odoo addon. This
was the deliberate choice over MongoDB-based MERN because the problem
statement explicitly requires demonstrating "proper use of relational
databases" for trip/stop/activity/expense data; Postgres satisfies that
directly, MongoDB does not without fighting the tool. Exact versions are
pinned in `CONTRACTS.md` §0.

## 1. Problem Recap

GlobeTrotter is a personalized multi-city trip planner. A user creates a
trip, builds an itinerary of city "stops" with dates, attaches activities to
each stop, gets an automatic cost breakdown, views the plan as a calendar/
timeline, and can share a read-only public link. 13 screens are specified;
screen 13 (Admin/Analytics) is explicitly marked optional in the source doc.

Beyond the 13 specified screens, this build adds two differentiator
features — a one-click itinerary auto-generator and a visual route map with
feasibility checking — plus a lighter-weight collaborative-planning bonus.
These directly answer the "personalized, intelligent, and collaborative
platform" language in the source doc's own Overall Vision, which the 13
screens alone don't fully deliver on. Full rationale and build notes are in
**Section 9**.

## 2. Why This Stack, and the Trade-off It Creates

FastAPI + Postgres gives real relational modeling, automatic OpenAPI docs
that double as a living contract, and Pydantic validation for free. React
gives full control over UI/UX. The trade-off, stated plainly so nobody is
surprised mid-build: **there is no free lunch on frontend views.** An
Odoo-native build gets kanban/calendar/graph/pivot screens for zero custom
code; this stack does not. Every one of the 13 screens is a hand-built React
page. Budget frontend time accordingly — this is a larger frontend lift than
a framework-native build, and the wave plan in `TASKS.md` reflects that by
giving frontend more P0 slots than backend.

| Screen in spec | Backend piece | Frontend piece |
|---|---|---|
| Login/Signup | `/auth/signup`, `/auth/login` (JWT) | Login/Signup pages, token stored client-side |
| Dashboard/Home | `/trips` (recent), `/cities?sort=popularity` | Dashboard page: recent trips + popular cities + "Plan New Trip" |
| Create Trip | `POST /trips` | Create Trip form |
| My Trips (list) | `GET /trips` | Trip card grid/list, edit/view/delete actions |
| Itinerary Builder | `/trips/{id}/stops`, `/stops/{id}`, `/stops/reorder`, `/itinerary-activities` | **Custom component #1**: drag-reorder stop list + activity picker (dnd-kit) |
| Itinerary View | same read endpoints as builder | Read-only render of the same data, grouped by stop/day |
| City Search | `GET /cities?q=&country=&cost_max=` | Search bar + result list/grid |
| Activity Search | `GET /activities?city_id=&category=&cost_max=` | Filter UI + result grid |
| Trip Budget & Cost Breakdown | `GET /trips/{id}/budget` (aggregated) | **Chart component** (Recharts) pie/bar |
| Trip Calendar/Timeline | stop + itinerary-activity read endpoints | **Custom component**: calendar/timeline (react-big-calendar) |
| Shared/Public Itinerary | `GET /public/trips/{token}`, `POST /public/trips/{token}/copy` | Public read-only route, no auth required to view |
| User Profile/Settings | `GET/PATCH /users/me` | Profile form |
| Admin/Analytics (optional, P2) | `GET /admin/analytics` (role-gated aggregates) | Admin page with tables/charts |
| *Smart Trip Assistant* (added, §9.1) | `POST /trips/{id}/auto-plan` — Groq LLM proposal, validated against the DB, deterministic fallback | Wizard modal/page: budget, pace, interests, preferences |
| *Route Map & Feasibility Check* (added, §9.2) | Google Directions API (primary) + Haversine (fallback) feasibility fields on stop read endpoints | **Custom component #2**: map (`@react-google-maps/api`) |

## 3. Repo Layout

Monorepo, two apps + shared docs:

```
globetrotter/
  backend/
    app/
      main.py
      core/
        config.py           # env var loading (pydantic-settings)
        security.py           # password hashing, JWT encode/decode
      db/
        session.py             # SQLAlchemy engine/session
        base.py                  # declarative base
      models/                     # SQLAlchemy ORM classes
        user.py
        trip.py
        stop.py
        city.py
        activity.py
        itinerary_activity.py
        collaborator.py           # trip_collaborators join table (§9.3)
        vote.py                    # itinerary_vote (§9.3)
        comment.py                  # trip_comment (§9.3, replaces Odoo chatter)
      schemas/                       # Pydantic request/response models, 1:1 with models/
      api/
        deps.py                       # get_db, get_current_user dependencies
        routes/
          auth.py
          trips.py
          stops.py
          itinerary_activities.py
          cities.py
          activities.py
          budget.py
          autoplan.py                 # §9.1
          public.py                    # §4 share routes
          collaborators.py              # §9.3
          votes.py                       # §9.3
          comments.py                     # §9.3
          admin.py                         # P2
      services/
        budget.py                         # cost aggregation query logic
        feasibility.py                     # Haversine + threshold, §9.2 — single implementation
        autoplan.py                         # scoring algorithm, §9.1
    alembic/                                 # migrations
    tests/                                    # pytest
    pyproject.toml (or requirements.txt)
    Dockerfile
  frontend/
    src/
      pages/
        Login.tsx  Signup.tsx  Dashboard.tsx  CreateTrip.tsx  MyTrips.tsx
        ItineraryBuilder.tsx  ItineraryView.tsx  CitySearch.tsx
        ActivitySearch.tsx  Budget.tsx  Calendar.tsx  PublicShare.tsx
        Profile.tsx  Admin.tsx  AutoPlanWizard.tsx
      components/
        TripMap.tsx              # custom component #2, §9.2
        StopList.tsx              # drag/reorder, dnd-kit, part of custom component #1
        ActivityPicker.tsx
        BudgetChart.tsx            # Recharts
        CalendarView.tsx             # react-big-calendar wrapper
      api/
        client.ts                     # THE one fetch boundary: JWT, base URL, error shape
        endpoints.ts                   # one function per backend route
        hooks/                          # React Query hooks per resource
      types/
        api.d.ts                        # AUTO-GENERATED from contract/openapi.json — never edit
        models.ts                        # friendly aliases (Trip, Stop, Budget, ...)
    package.json
    vite.config.ts
    Dockerfile
  contract/
    openapi.json                        # frozen, committed snapshot of the live API
  docker-compose.yml
  .env.example
  ARCHITECTURE.md
  CONTRACTS.md
  INTEGRATION.md                        # build order + the anti-drift contract pipeline
  TASKS.md
```

### 3.1 The contract pipeline (build-order dependent)

The team builds in three sequential phases — entire backend, then the
entire UI in **Stitch**, then integration — rather than running frontend
and backend in parallel. That defers every shape mismatch to the last
phase, so the contract is frozen and machine-checked instead of agreed on
paper:

```
backend/app/**  →  contract/openapi.json  →  frontend/src/types/api.d.ts
                   (python export_openapi.py)   (npm run gen:types)
```

A field the backend doesn't return cannot exist in the frontend's types, so
a screen reading it fails `npm run typecheck` rather than at the demo.
**`INTEGRATION.md` is the full rulebook and is mandatory reading before any
UI work.**

## 4. Data Model (see CONTRACTS.md §2 for exact field list)

```
User (1) ──< Trip (N)                      [owner: user_id]
User (N) >── Trip (N)                      [trip_collaborators join table, §9.3]
User (1) >── City (N)                      [user_saved_cities join table]
Trip (1) ──< Stop (N) ──< ItineraryActivity (N) >── Activity (1)
                 │                                        │
                 └── City (1) ───────────────────────────┘
User (1) ──< ItineraryVote (N) >── ItineraryActivity (1)  [§9.3]
Trip (1) ──< Comment (N) >── User (1)                      [§9.3]
```

- `Trip` holds trip-level metadata; budget totals are **not** stored columns
  — see §5, this is a deliberate difference from an Odoo-style computed-
  stored field.
- `Stop` is one city leg of a trip, ordered by `sequence`, with its own
  date range (multi-city date math lives here, not on the trip).
- `ItineraryActivity` is the join row between a stop and an activity — it
  carries the scheduled date/time and the cost actually charged to this
  trip (defaults from `Activity.cost` at insert time, then independent, so
  editing a catalog activity's reference price never silently changes a
  past trip's numbers).
- `City` and `Activity` are shared reference/catalog data — searchable by
  every user, writable only by a `catalog_manager` role (enforced in the
  route dependency, since there's no ORM-level record-rule engine here —
  see §6).

## 5. Budget Computation

Unlike an ORM with native computed-stored fields, plain SQLAlchemy has no
free equivalent — so budget totals are **computed at request time**, not
stored. `GET /trips/{id}/budget` runs one `GROUP BY Activity.category`
aggregate query over `ItineraryActivity.cost` (joined to `Activity` for the
category) for that trip, returning `amount_by_category`, `amount_total`,
`amount_per_day` (`amount_total / duration_days`), and — if `budget_target`
is set — `is_over_budget`. This is intentionally recomputed live rather than
cached/stored: trip-sized data volumes make this cheap, and it removes an
entire class of "stale computed field" bugs a stored-and-recomputed-on-write
approach would risk introducing under hackathon time pressure.

## 6. Security

There is no ORM-level record-rule engine here (that was an Odoo-specific
convenience) — every ownership check is written by hand, once, in a shared
FastAPI dependency, not repeated ad hoc per route:

- `get_current_user` dependency: decodes the JWT, loads the `User`, raises
  401 if missing/invalid/expired.
- `get_owned_trip(trip_id)` dependency: loads the `Trip`, raises 403 unless
  `trip.user_id == current_user.id` or `current_user.id` is in the trip's
  collaborators (§9.3). Every trip-scoped route (`stops`, `itinerary
  activities`, `budget`, `auto-plan`) depends on this — never re-implements
  the check inline.
- Only the trip's `user_id` (never a collaborator) may change
  `is_public`, `share_token`, or the collaborator list itself — enforced
  as an explicit extra check in those specific route handlers.
- Public share routes (`/public/trips/{token}`) take no auth dependency at
  all and only ever read a trip where `is_public = true`, by token, never
  by id — a token is never guessable from a trip id.
- Passwords: hashed with bcrypt via `passlib`, never stored or logged in
  plaintext. JWTs are short-lived access tokens (see CONTRACTS §1 for
  expiry); no refresh-token flow is required for a hackathon demo — a
  short-but-not-too-short expiry (e.g. 24h) is a deliberate simplification.
- `City`/`Activity` catalog writes gated to a `catalog_manager` role check
  in the dependency layer, same pattern as ownership.

## 7. Integration / Deployment

- `docker-compose.yml` with three services: `db` (postgres), `api`
  (FastAPI/uvicorn), `web` (React, Vite dev server for the hackathon demo —
  swap for an nginx-served static build only if there's time to spare, it
  is not required for the demo to work).
- Single `.env` at repo root; all three services read from it (see
  CONTRACTS §1 for the exact var list).
- Health check: `GET /health` on the API service (plain 200 OK once the DB
  connection succeeds) gates "startup is reproducible."
- Migrations: Alembic, run as part of the documented startup sequence —
  never manual `CREATE TABLE`, so a fresh clone reaches the same schema
  every time.
- Fresh-clone path: `git clone` → `cp .env.example .env` → `docker compose
  up` → Alembic migrations run → API reachable at `/health` → frontend
  reachable and able to call it (CORS origin must include the frontend's
  dev URL — see CONTRACTS §1).

## 8. What Deliberately Is Not Custom-Built

No separate REST framework debate (Flask/Django) — FastAPI's async support
and automatic OpenAPI docs are the reason it's chosen over both. No GraphQL
layer — plain REST is sufficient for this shape of data and is faster to
contract-test. No Redis/queue/cache layer beyond the small route-result
cache described in CONTRACTS §7.2 — trip-sized data volumes don't need one,
and adding a general-purpose cache layer would be exactly the "unnecessary
infrastructure" the hackathon-engineering skill warns against.

**Superseded decision, stated plainly:** the two differentiator features
originally avoided external services entirely, on purpose, so a flaky demo
network or an invalid API key could never break the app. The team has since
chosen to use **Groq** (LLM) for the Smart Trip Assistant and **Google
Maps/Directions/Places** for the route map, trading that safety for a
materially stronger feature (real routing data instead of a straight-line
heuristic; genuinely AI-generated recommendations instead of only a scoring
formula). That trade-off is only acceptable because both integrations carry
a **mandatory, tested fallback** — the deterministic scorer for the
assistant, Haversine + a static SVG map for the route view (CONTRACTS
§7.1/§7.2) — so a dead API key or a venue with no internet degrades a
feature instead of breaking the demo. Neither fallback is optional polish;
building and testing both is P0 work, not P2.

## 9. Differentiator Features (Innovation)

These are additions beyond the 13 specified screens. Each is scored against
the four things asked for: useful, easy to use, attractive to watch, and
realistically winnable in hackathon time — plus its API/schema impact (full
route and field list lives in `CONTRACTS.md` §7).

### 9.1 Smart Trip Assistant — one-click itinerary auto-fill (P1, flagship)

**What it is:** on an empty or partially-built trip, a "Plan For Me" action
(modal or dedicated page) takes a target budget, a pace (relaxed/balanced/
packed), and up to three interest categories, and calls
`POST /trips/{id}/auto-plan`. The backend picks cities and activities from
the existing catalog and writes real `Stop`/`ItineraryActivity` rows — the
user lands back on the itinerary builder with a complete, editable draft
instead of a blank page.

- **Unique:** none of the 13 spec'd screens generate a plan — they only let
  a user build one by hand. This is the single feature most likely to make
  a judge say "oh, that's clever" in the first 30 seconds.
- **Useful:** removes the blank-page problem, which is the actual point of
  friction in trip planning (per the source doc's own vision statement).
- **Easy to use:** one button, three inputs, one click — the output is a
  normal itinerary edited with tools the user already knows from the
  Itinerary Builder screen.
- **How it actually generates a plan (team decision):** the request (trip
  dates, budget, pace, interests, free-text preferences) plus the real
  candidate `City`/`Activity` rows already in the DB are sent to **Groq**
  (`GROQ_MODEL`, CONTRACTS §1) as the grounding context — never an
  open-ended prompt that could invent a city or activity that doesn't
  exist. The response is validated against the DB (any id Groq returns that
  isn't in the candidate set is dropped, not guessed at) before anything is
  written. Full pipeline diagram and the exact request/response shape are
  in CONTRACTS §7.1.
- **Demo-safe despite the external dependency:** if Groq is unreachable,
  times out, or its validated output leaves gaps, the same deterministic
  weighted-score algorithm over `City.popularity`/`cost_index` and
  `Activity.category`/`cost` that was the original design fills in the
  rest. The user always gets a usable plan; a dead API key degrades the
  feature's cleverness, not its availability.
- **Build cost:** one route, one Groq client call + prompt template, one
  DB-validation step, the deterministic fallback (already needed to exist
  regardless), one Pydantic request/response schema pair, one frontend
  modal.

### 9.2 Route Map & Feasibility Check (P1, flagship)

**What it is:** the itinerary view gains a map panel plotting every stop in
sequence with a connecting line, each pin showing city name and dates. If
two consecutive stops are far apart with too little date gap between them
to plausibly travel, that connecting line is flagged instead of the user
discovering it's impossible after booking something.

- **Unique:** nothing in the 13 screens visualizes geography or catches an
  impossible transition. This is the single most visually attractive screen
  in the app and doubles as an actual planning safeguard.
- **Useful:** catches a real, common trip-planning mistake automatically.
- **Easy to use:** read-only, always in sync with the itinerary — no extra
  data entry, no extra screen to learn.
- **How it actually computes feasibility (team decision):** real
  drive/transit time and distance from **Google Directions API**
  (server-side call, `GOOGLE_MAPS_API_KEY`) between each consecutive pair
  of stop cities — genuinely better than a straight-line guess. Directions
  can't route a flight, so any city pair it can't handle (long-haul,
  intercontinental) falls back to the original Haversine-distance
  heuristic. Both paths feed the same `is_feasible` field; results are
  cached per city-pair since Directions is billed per call (CONTRACTS
  §7.2).
- **Build cost/risk:** one React component (`TripMap.tsx`,
  `@react-google-maps/api`) fed by `latitude`/`longitude` plus the computed
  distance/duration/feasibility fields on the stop response — no new
  endpoint shape beyond what the stop list already returns. The real risk,
  and it's a bigger one than the original Leaflet/OSM plan: Google Maps
  needs a **billed** Google Cloud project, a valid API key, and live
  internet with no offline mode at all. The mandatory fallback (CONTRACTS
  §7.2) is a static SVG lat/lng projection, computed entirely client-side,
  used whenever the Maps API key is missing/invalid or the venue has no
  connectivity — Integration must confirm venue connectivity ahead of time
  and this fallback must actually be built and demo-tested, not assumed
  away.

### 9.3 Collaborative Co-Planning (P2, bonus — only after P0/P1 are solid)

**What it is:** a trip owner can add collaborators (existing users) who get
edit access to stops/activities on that trip, plus a lightweight up/down
vote on each proposed activity and a simple comment thread per trip.

- **Unique/useful:** directly answers the source doc's "share trip plans
  within a community" / "collaborative platform" vision language, which the
  13 screens address only as one-way public *viewing*, never joint
  *editing*.
- **Easy to use:** voting is one click; commenting is a plain threaded list,
  no new UI pattern to learn.
- **Why P2, not a flagship:** it's the one feature that meaningfully
  changes the security model (§6) and needs its own tables
  (`trip_collaborators`, `itinerary_vote`, `comment`). Build it only after
  the P0 critical path and the two P1 flagships are demo-solid.
