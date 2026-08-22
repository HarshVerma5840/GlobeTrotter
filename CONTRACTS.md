# GlobeTrotter — Contracts

This is the binding source of truth for schema, routes, ports, and env vars.
Frontend/backend/integration agents must not invent fields, routes, or env
vars that conflict with this file — update this file first, then code.
FastAPI's auto-generated OpenAPI doc at `/docs` is the live, always-current
mirror of §7 once the backend is running — treat a mismatch between this
file and `/docs` as a bug in whichever side is stale, and fix this file
first if the route needs to change.

## 0. Tech Stack & Pinned Versions

Everyone builds against these exact versions — a version mismatch between
laptops is exactly the kind of drift this file exists to prevent.

| Layer | Choice | Why |
|---|---|---|
| Backend framework | **FastAPI** (latest 0.1xx line) | Async, automatic OpenAPI docs double as a living contract, Pydantic validation built in |
| Language (backend) | **Python 3.12** | Mature, broad async-driver (asyncpg/SQLAlchemy) compatibility; newer 3.13/3.14 exist but 3.12 is the safer pin for a time-boxed build |
| ORM | **SQLAlchemy 2.0** (async) | Standard, typed, first-class async support |
| Migrations | **Alembic** | Standard SQLAlchemy migration tool — no hand-written `CREATE TABLE` |
| Validation | **Pydantic v2** | Ships with FastAPI; request/response schemas are the contract |
| Database | **PostgreSQL 16** | Mature, fully supported LTS-grade release with broad driver/tooling support; Postgres 18 exists but 16 is the safer pin under time pressure |
| Auth | **JWT** (python-jose or PyJWT) + **passlib[bcrypt]** for password hashing | Standard, no external auth service |
| Frontend framework | **React 19** + **TypeScript** | Current stable major |
| Build tool | **Vite** | Fast dev server, standard React/TS starter |
| Data fetching | **TanStack Query (React Query)** | Caching/loading/error states for every API call, minimal boilerplate |
| Forms | **React Hook Form** + **Zod** | Client-side validation mirroring backend Pydantic schemas |
| Drag & drop | **@dnd-kit/core** | Actively maintained (react-beautiful-dnd is archived); used by the Itinerary Builder |
| Charts | **Recharts** | Budget breakdown pie/bar |
| Calendar/timeline | **react-big-calendar** | Fully open-source (MIT), no paid-tier ambiguity |
| Map | **Google Maps JavaScript API** via **`@react-google-maps/api`**, plus **Directions API** (real route/distance) and **Places API** (city search/autocomplete) | Team decision, superseding the earlier Leaflet/OSM plan — real routing data instead of a straight-line heuristic. Trade-off, stated plainly: this needs a billed Google Cloud project, an API key, and live internet at demo time — see §1 and ARCHITECTURE §8 for the required fallback |
| AI itinerary generation | **Groq API** (`openai/gpt-oss-20b`, or `openai/gpt-oss-120b` for harder cases) | Team decision, superseding the earlier no-LLM-only plan. Groq's OpenAI-compatible chat-completions endpoint, used for the Smart Trip Assistant's recommendation step — see §7.1 for the mandatory DB-validation and fallback design |
| Styling | **Tailwind CSS** | Fast to build consistent UI under time pressure |
| Backend tests | **pytest** + **httpx** (FastAPI `TestClient`) | Standard |
| Frontend tests | **Vitest** + **React Testing Library** | Standard Vite-native pairing |
| Containers | **Docker** + **Docker Compose v2** | Services: `db`, `api`, `web` — see §1 |
| Node runtime | **Node.js 24 (Active LTS)** | Current Active LTS; newer majors exist but are not yet the safe production/hackathon pick |

**Exceptions to the original "no external services" plan, both explicit team
decisions:** Google Maps (JS API + Directions + Places) and Groq (LLM). Both
require a live API key and internet at demo time — see ARCHITECTURE §8 for
the mandatory fallback behavior when either is unreachable. Everything else
holds: no GraphQL layer, no Redis/queue/cache layer, no second frontend
framework.

## 1. Ports & Environment

| Var | Default | Notes |
|---|---|---|
| `POSTGRES_DB` | `globetrotter` | |
| `POSTGRES_USER` | `globetrotter` | |
| `POSTGRES_PASSWORD` | *(set in .env, never committed)* | |
| `DATABASE_URL` | `postgresql+asyncpg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}` | built from the above; always references service name `db`, never `localhost`, inside the compose network |
| `JWT_SECRET_KEY` | *(set in .env, never committed)* | |
| `JWT_ALGORITHM` | `HS256` | |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` (24h) | deliberately simple for a demo — no refresh-token flow required |
| `CORS_ORIGINS` | `http://localhost:5173` | must include the frontend dev URL or the browser blocks every API call |
| `API_PORT` | `8000` | FastAPI/uvicorn |
| `WEB_PORT` | `5173` | Vite dev server |
| `POSTGRES_PORT` | `5432` | |
| `VITE_API_BASE_URL` | `http://localhost:8000` | read by the frontend build |
| `GOOGLE_MAPS_API_KEY` | *(set in .env, never committed)* | server-side key for Directions/Places calls from the backend — **required**, no default; the app must still boot and serve every non-map screen without it (ARCHITECTURE §8) |
| `VITE_GOOGLE_MAPS_API_KEY` | *(set in .env, never committed)* | separate, HTTP-referrer-restricted browser key for `@react-google-maps/api` — **never reuse the server key here**, a browser-exposed key needs its own restriction in Google Cloud Console |
| `GROQ_API_KEY` | *(set in .env, never committed)* | **required** for the Smart Trip Assistant's LLM step — the deterministic fallback (§7.1) still works without it, so absence degrades a feature, it must not crash the app |
| `GROQ_MODEL` | `openai/gpt-oss-20b` | fast default; `openai/gpt-oss-120b` is the documented fallback name for harder prompts — both are current Groq production models, not a preview model (preview models are explicitly not for production use) |

Both new API keys are **required for full functionality** but the backend
must degrade gracefully, not crash, when either is missing or the call
fails — see ARCHITECTURE §8 for exactly what "degrade" means for each.

Docker service names: `db`, `api`, `web`.

Startup command (documented, not improvised per machine):
```
docker compose up -d
docker compose exec api alembic upgrade head
docker compose exec api python -m app.seed   # idempotent catalog seed (B5)
curl http://localhost:8000/health   # expect 200 OK
```

## 2. Data Model

### `User`
| Field | Type | Notes |
|---|---|---|
| `id` | UUID/serial PK | |
| `email` | String, unique, required | |
| `hashed_password` | String, required | bcrypt, never plaintext |
| `name` | String, required | |
| `language` | String, default `en` | |
| `role` | Enum: `user`, `catalog_manager`, `admin` | default `user`; gates catalog writes (§4) and `/admin/analytics` (P2) |
| `created_at` | Timestamp | |

`user_saved_cities` join table: `user_id`, `city_id` — "saved destinations"
on profile.

### `Trip`
| Field | Type | Notes |
|---|---|---|
| `id` | UUID/serial PK | |
| `name` | String, required | |
| `date_start` | Date, required | |
| `date_end` | Date, required | must be >= `date_start` (DB check constraint) |
| `description` | Text | |
| `cover_image_url` | String | optional |
| `user_id` | FK → `User`, required | owner |
| `is_public` | Boolean, default false | |
| `share_token` | String, unique, nullable | generated on first share, never regenerated implicitly |
| `budget_target` | Numeric(10,2), nullable | used by Smart Trip Assistant (§7.1) as a cap, and to flag `amount_total` over target in the budget response |

Budget totals (`amount_by_category`, `amount_total`, `amount_per_day`) are
**not** columns — see ARCHITECTURE §5. They are computed at request time by
`GET /trips/{id}/budget`.

`trip_collaborators` join table (§7.3, bonus): `trip_id`, `user_id`.

### `Stop`
| Field | Type | Notes |
|---|---|---|
| `id` | UUID/serial PK | |
| `trip_id` | FK → `Trip`, required, `ON DELETE CASCADE` | |
| `city_id` | FK → `City`, required | |
| `sequence` | Integer, required | ordering within trip |
| `date_start` | Date, required | |
| `date_end` | Date, required | |

DB constraint: `date_start`/`date_end` must fall within the parent trip's
range; stops on the same trip must not overlap in date (enforced in the
service layer at write time, not a raw SQL constraint, since it's a
cross-row check).

**Clarification (Backend, B2) - what "overlap" means:** two consecutive
stops MAY share exactly one boundary day (stop A ends 5 May, stop B starts
5 May); that shared day is the travel day. Only an overlap of a full day or
more is rejected. This is required for consistency with §7.2, whose
feasibility rule triggers on `travel_gap_days < 1` - a case that is
unreachable if touching stops are rejected outright. Implemented once in
`services/stops.py::overlaps` as `a_start < b_end and b_start < a_end`.
Affects **Frontend** (date-picker validation must allow the shared day) and
**QA** (Q1/Q2 fixtures). A stop's own `date_end >= date_start` IS a real SQL
CHECK, on both `trips` and `stops`.

Computed (returned by the API, not stored columns): `distance_from_previous_km`,
`travel_gap_days`, `is_feasible` — see §7.2.

### `City`
| Field | Type | Notes |
|---|---|---|
| `id` | UUID/serial PK | |
| `name` | String, required | |
| `country` | String, required | |
| `cost_index` | Float | relative daily cost index, used as a search filter |
| `popularity` | Integer | for "popular cities" on Dashboard |
| `image_url` | String | optional |
| `latitude` | Float, required | required for map pins (§7.2) and distance calc |
| `longitude` | Float, required | required for map pins (§7.2) and distance calc |
| `google_place_id` | String, unique, nullable | set only for cities created via Places search (§7.4); seed-data cities may leave this null |

Seed data must populate `latitude`/`longitude` for every city — the map and
feasibility check are silently useless without it, so this is not optional.

### `Activity`
| Field | Type | Notes |
|---|---|---|
| `id` | UUID/serial PK | |
| `name` | String, required | |
| `city_id` | FK → `City`, required | |
| `category` | Enum: `sightseeing`, `food`, `adventure`, `transport`, `stay`, `other` | drives budget-breakdown grouping; the only valid values anywhere in the system |
| `cost` | Numeric(10,2) | base/reference cost |
| `duration_hours` | Float | |
| `description` | Text | |
| `image_url` | String | optional |

### `ItineraryActivity`
| Field | Type | Notes |
|---|---|---|
| `id` | UUID/serial PK | |
| `stop_id` | FK → `Stop`, required, `ON DELETE CASCADE` | |
| `activity_id` | FK → `Activity`, required | |
| `scheduled_date` | Date, required | must fall within `stop_id`'s date range |
| `scheduled_time` | Float | hour of day, for calendar ordering |
| `cost` | Numeric(10,2) | copied from `activity.cost` at insert time, then independent |
| `notes` | Text | |

### `ItineraryVote` (§7.3, bonus)
| Field | Type | Notes |
|---|---|---|
| `id` | UUID/serial PK | |
| `itinerary_activity_id` | FK, required, `ON DELETE CASCADE` | |
| `user_id` | FK → `User`, required | |
| `value` | Enum: `up` (+1), `down` (-1) | |

Unique constraint on `(itinerary_activity_id, user_id)` — one vote per user
per activity; changing your mind updates the row, never inserts a second.

### `Comment` (§7.3, bonus)
| Field | Type | Notes |
|---|---|---|
| `id` | UUID/serial PK | |
| `trip_id` | FK → `Trip`, required, `ON DELETE CASCADE` | |
| `user_id` | FK → `User`, required | |
| `body` | Text, required | |
| `created_at` | Timestamp | |

## 3. Auth

- `POST /auth/signup` — `{email, password, name}` → creates `User`
  (bcrypt-hashed password), returns access token.
- `POST /auth/login` — OAuth2 password flow (`email`/`password` form) →
  returns `{access_token, token_type: "bearer"}`.
- `GET /users/me` — requires bearer token, returns current user.
- `PATCH /users/me` — update `name`, `language`, `saved_city_ids`.
- All protected routes require `Authorization: Bearer <token>`; a missing
  or invalid token is `401`, a valid token but insufficient ownership/role
  is `403` — never conflate the two status codes.

**Clarifications (Backend, B3) — two details Frontend must code against:**

1. **The login form field is `username`, not `email`.** `POST /auth/login`
   is a real OAuth2 password flow, and the OAuth2 spec fixes that field
   name; the user's email address is what goes in it. So the request is
   `Content-Type: application/x-www-form-urlencoded` with
   `username=<the email>&password=<password>` — **not** a JSON body, and
   **not** a field literally called `email`. Signup, by contrast, IS JSON.
   Keeping the standard flow means /docs' "Authorize" button works, which
   is worth having during the demo. Affects **Frontend** (`api/client.ts`
   login call) and **QA** (Q1 fixtures).
2. **Duplicate signup email returns `409 Conflict`** (not 400/422) with
   `{"detail": "An account with that email already exists."}`. Login
   failure returns `401` with one generic message for both "no such
   email" and "wrong password", so the endpoint can't be used to
   enumerate registered accounts — Frontend must not try to distinguish
   them. Affects **Frontend** (signup/login error copy), **QA** (Q2).

Password rules (Backend choice, not previously specified): minimum 8
characters, maximum 72 **bytes** — the latter because bcrypt silently
truncates beyond 72 bytes, so it is rejected with `422` rather than
accepted and quietly weakened.

## 4. Core REST Routes

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/trips` | GET | required | trips owned by or shared with current user |
| `/trips` | POST | required | create trip, `user_id` = current user |
| `/trips/{id}` | GET/PATCH/DELETE | required, owner-or-collaborator (see §6) | only owner may PATCH `is_public`/`share_token`/collaborators |
| `/trips/{id}/stops` | GET/POST | required, owner-or-collaborator | |
| `/stops/{id}` | PATCH/DELETE | required, owner-or-collaborator | |
| `/stops/reorder` | PATCH | required, owner-or-collaborator | body: `[{id, sequence}]`, batched — never one request per row |
| `/stops/{id}/activities` | GET/POST | required, owner-or-collaborator | creates `ItineraryActivity` |
| `/itinerary-activities/{id}` | PATCH/DELETE | required, owner-or-collaborator | |
| `/cities` | GET | required | query params: `q`, `country`, `cost_max`, `sort` |
| `/activities` | GET | required | query params: `city_id`, `category`, `cost_max` |
| `/cities`, `/activities` | POST/PATCH | required, `role=catalog_manager` | |
| `/trips/{id}/budget` | GET | required, owner-or-collaborator | see ARCHITECTURE §5 |
| `/trips/{id}/collaborators` | GET/POST | required, owner-or-collaborator for GET; owner-only for POST | |
| `/trips/{id}/collaborators/{user_id}` | DELETE | required, owner-only | |
| `/itinerary-activities/{id}/vote` | POST | required, owner-or-collaborator | body: `{value: "up" \| "down"}` |
| `/trips/{id}/comments` | GET/POST | required, owner-or-collaborator | threaded discussion |
| `/admin/analytics` | GET | required, `role=admin` | aggregates only |
| `/health` | GET | none | plain `{"status": "ok"}` once DB connects |

## 5. Security / Access (implementation, see ARCHITECTURE §6 for rationale)

- `get_current_user` dependency on every protected route.
- `get_owned_trip(trip_id)` dependency on every trip-scoped route: 403
  unless `trip.user_id == user.id` or `user.id` in `trip_collaborators`.
- `is_public`, `share_token`, and `trip_collaborators` writes additionally
  require `trip.user_id == user.id` — a collaborator can edit stops/
  activities but never these three things.
- `catalog_manager` role check on `City`/`Activity` writes.
- Public routes (§7 below) take **no** auth dependency and only ever
  filter by `share_token` + `is_public = true` — never by trip id.

## 6. Public Sharing Routes

| Route | Method | Auth | Behavior |
|---|---|---|---|
| `/public/trips/{token}` | GET | none | 404 if token invalid or `is_public=false`; else returns read-only trip + ordered stops + activities + total cost. No write actions exposed. |
| `/public/trips/{token}/copy` | POST | required | duplicates the trip tree under the current user; frontend redirects unauthenticated visitors to `/login?redirect=...` first. |

## 7. Differentiator Feature Contracts

### 7.1 Smart Trip Assistant (Groq-backed, with DB validation and a hard fallback)

`POST /trips/{id}/auto-plan`

Request body:
```json
{
  "budget_target": 1500.00,
  "pace": "balanced",
  "interest_categories": ["food", "sightseeing"],
  "preferences": "prefer walkable old towns, avoid long transit days"
}
```
`pace` ∈ `relaxed` (2 activities/day), `balanced` (3/day), `packed` (4/day).
`interest_categories`: 0–3 values from the `Activity.category` enum (§2).
`preferences`: optional free text, passed to the LLM as extra context only —
never parsed for structured fields, never trusted for anything the
validation step (below) doesn't independently check.

Pipeline (`services/autoplan.py`), matching the flow the team specified:

```
User submits: trip dates + budget_target + pace + interest_categories + preferences
        │
        ▼
FastAPI (POST /trips/{id}/auto-plan)
        │  builds a grounding payload: the trip's date range, and the
        │  actual candidate City/Activity rows already in the DB
        │  (never an open-ended "any city in the world" prompt)
        ▼
Groq API  (chat completion, GROQ_MODEL, JSON-mode/structured output)
        │  returns a proposed selection: which candidate city_ids and
        │  activity_ids to use, per day
        ▼
Validate against the database
        │  every city_id/activity_id the model returned MUST exist in the
        │  candidate set sent to it; any id that doesn't resolve, or any
        │  malformed/unparseable response, is DROPPED — not guessed at,
        │  not retried into a hallucinated fix
        ▼
City + Activity selection (validated subset only)
        │
        ▼
Create itinerary — writes real Stop + ItineraryActivity rows
        │
        ▼
React UI — user lands on the itinerary builder with an editable draft
```

**Fallback (mandatory, not optional):** if `GROQ_API_KEY` is unset, the Groq
call times out, errors, or returns a response where validation drops enough
of the plan to leave a day empty, fall back to the original deterministic
scorer (candidate cities ranked by `popularity`/`cost_index`, activities
ranked by category-match then ascending `cost`, exactly as previously
specified) to fill whatever the LLM didn't cover. The user-visible behavior
must be "you got a plan" in both cases — never a 500, never a half-built
trip with no explanation. Log which path was used (`llm` vs `fallback`) per
call for the demo narrative, not as user-facing text.

In all cases the endpoint writes real, persisted `Stop`/`ItineraryActivity`
rows — **never** a preview-only response the user can't then edit with the
normal itinerary builder.

### 7.2 Route Map & Feasibility Check (Google Maps + Directions, Haversine as fallback only)

> **Implementation status (backend, B11):** the Haversine path, the pinned
> threshold, and all the computed fields below are built and tested. The
> Google Directions primary path and its per-city-pair cache are **not yet
> built** — `distance_source` therefore always reads `haversine` today.
> This is a scope note, not a contract change: the target below still
> stands, and the response shape already matches it, so adding Directions
> changes no route, schema, or frontend code.

- Primary distance/duration source: **Google Directions API**, called
  server-side (never from the browser — keeps `GOOGLE_MAPS_API_KEY` off the
  client) from `services/feasibility.py`, for the city-pair between a stop
  and the stop immediately before it in `sequence` order. Directions API
  only routes driving/walking/bicycling/transit — it has no concept of a
  flight, so any pair it can't route (an intercontinental or otherwise
  unroutable hop) falls back to the **Haversine formula** on
  `(city.latitude, city.longitude)`, same as the original plan. Both paths
  populate the same two fields — `distance_from_previous_km` and
  `travel_duration_hours` — so downstream code never needs to know which
  source produced them; a `distance_source` field (`directions` |
  `haversine`) is included for transparency, display-only.
- Feasibility rule (pinned so it's identical everywhere it's checked):
  `is_feasible = false` when `travel_duration_hours` (from Directions when
  available) or the Haversine-estimated equivalent exceeds the
  `travel_gap_days` window between the two stops. When falling back to
  Haversine, keep the original simple threshold — `distance_from_previous_km
  > 300` **and** `travel_gap_days < 1` — as the trigger. This is a
  deliberately simple, generous heuristic in the fallback path, not a
  routing engine, and must not be presented in the UI as a guarantee.
- **Caching:** Directions API is billed per request — cache the result for
  a given ordered city-pair (e.g. in a small `route_cache` table or an
  in-process TTL cache) so re-fetching the same trip's stops repeatedly
  doesn't re-call the API every page load. Cache key is the ordered pair of
  city ids, not the stop ids, so the cache is shared across trips.
- `TripMap.tsx` renders via `@react-google-maps/api`: markers per stop
  (`stop.city.{name, latitude, longitude}`), a polyline per consecutive
  pair (drawn from the Directions result when available, a straight line
  when falling back to Haversine), and the feasibility highlight from
  `stop.is_feasible`. It reads `VITE_GOOGLE_MAPS_API_KEY` (browser-
  restricted, never the server key) to load the JS API — no other new
  frontend config.
- **Mandatory fallback when Google Maps is unreachable** (no key set, key
  invalid, network blocked at the venue): render the same marker/polyline
  data on a static bundled SVG world outline via an equirectangular
  lat/lng projection, computed entirely client-side with no external
  request. This is not optional polish — Google Maps requires live
  internet and a billed API key with no offline mode, which is a real
  demo-day risk the earlier Leaflet/OSM design didn't carry; Integration
  owns confirming venue connectivity and the fallback must be built and
  tested, not assumed away.

### 7.4 Places-Backed City Search (enhancement)

`GET /cities?q=...` first searches the local `City` table; if the query
looks like it's asking for a place not yet in the catalog, the frontend may
additionally call Google **Places API** (Autocomplete + Place Details) via
`GET /cities/places-search?q=...` (backend-proxied, so the server key is
used, not a browser call to Google). Selecting a Places result calls
`POST /cities/from-place` with the Google `place_id`; the backend upserts a
`City` row (dedup on a unique `google_place_id` column added to `City`,
§2) using the name/country/lat/lng Places returns. This means the city
catalog can grow from real-world search instead of only from seed data —
useful, but explicitly P1/P2 polish on top of the P0 City Search screen,
which must work against local catalog data alone first.

### 7.3 Collaborative Co-Planning (bonus, P2)

- `POST /trips/{id}/collaborators` / `DELETE /trips/{id}/collaborators/{user_id}`
  — owner-only (§5).
- `POST /itinerary-activities/{id}/vote` — body `{value: "up"|"down"}`,
  upserts on the unique `(itinerary_activity_id, user_id)` constraint.
- `GET/POST /trips/{id}/comments` — plain threaded list, owner or
  collaborator only.
- `ItineraryActivity` responses include a computed `vote_score` (sum of
  values) for display only — no ranking/reordering logic depends on it.

## 8. Non-Negotiables

- Dates: all date fields are SQL `Date` (no timezone), consistent across
  `Trip`/`Stop`/`ItineraryActivity` — no mixing `Date` and `Datetime` for
  the same concept.
- Money: every cost field is `Numeric(10,2)` — **never** `Float` — so
  rounding never silently drifts in the budget aggregation. Single-currency
  assumption for the hackathon build; note this explicitly if asked, don't
  silently add multi-currency scope.
- `category` enum values (§2) are the only valid values used anywhere in
  budget-grouping logic, seed data, or frontend filters — update this file
  first before adding one anywhere.
- Distance/duration/feasibility logic (Directions API primary, Haversine
  fallback, thresholds — all §7.2) is the one implementation, in
  `services/feasibility.py` — the frontend never recomputes any of it
  itself, it only displays what the API returns. If a threshold needs
  tuning during demo prep, change it here first, then in that one backend
  function.
- Neither Groq's output (§7.1) nor a Google Places result (§7.4) is ever
  written to the database, or returned to the frontend, without passing
  through the validation step that checks it against real DB rows first —
  an LLM- or third-party-API-sourced id/name is untrusted input, same as
  any other user-facing input.
- The Smart Trip Assistant (§7.1) only ever writes real, persisted `Stop`/
  `ItineraryActivity` rows — never a client-side-only preview. It must
  produce a usable plan even when Groq is unreachable (fallback, §7.1) —
  a third-party AI API being down is not an acceptable reason for the
  feature to fail during a demo.
- The Route Map (§7.2) must render (via the SVG fallback) even when Google
  Maps is unreachable — same reasoning.
- Every trip-scoped route depends on `get_owned_trip` (§5) — no route
  re-implements the ownership check inline; a new route without that
  dependency is a bug, not a style choice.
