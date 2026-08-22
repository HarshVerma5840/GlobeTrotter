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
| Map | **react-leaflet** + OpenStreetMap tiles | ~40KB, MIT-licensed, no API key — the only third-party map dependency |
| Styling | **Tailwind CSS** | Fast to build consistent UI under time pressure |
| Backend tests | **pytest** + **httpx** (FastAPI `TestClient`) | Standard |
| Frontend tests | **Vitest** + **React Testing Library** | Standard Vite-native pairing |
| Containers | **Docker** + **Docker Compose v2** | Services: `db`, `api`, `web` — see §1 |
| Node runtime | **Node.js 24 (Active LTS)** | Current Active LTS; newer majors exist but are not yet the safe production/hackathon pick |

**No exceptions beyond this table** — consistent with ARCHITECTURE §8: no
GraphQL layer, no external LLM API, no external routing/directions API, no
Redis/queue/cache layer, no second frontend framework.

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

Docker service names: `db`, `api`, `web`.

Startup command (documented, not improvised per machine):
```
docker compose up -d
docker compose exec api alembic upgrade head
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

### 7.1 Smart Trip Assistant

`POST /trips/{id}/auto-plan`

Request body:
```json
{"budget_target": 1500.00, "pace": "balanced", "interest_categories": ["food", "sightseeing"]}
```
`pace` ∈ `relaxed` (2 activities/day), `balanced` (3/day), `packed` (4/day).
`interest_categories`: 0–3 values from the `Activity.category` enum (§2).

Algorithm (`services/autoplan.py`):
1. Candidate cities not already on the trip, ranked by `popularity`
   descending, filtered so a running `cost_index`-weighted estimate stays
   under `budget_target`.
2. Days per city = `trip.duration_days` ÷ number of candidate cities picked
   (minimum 1 day each); one `Stop` created per city in popularity order.
3. Per stop-day, top-scored `Activity` rows in that city (score = category
   match with `interest_categories` first, then ascending `cost`) until the
   day's activity count hits the `pace` target or the running total would
   exceed `budget_target`.
4. Writes real `Stop` + `ItineraryActivity` rows — **never** a preview-only
   response the user can't then edit with the normal itinerary builder —
   and returns the updated trip with its new stops.

No network call, no LLM API key. If an LLM-backed variant is added later,
it must still conform to this same "request in → real rows out" contract.

### 7.2 Route Map & Feasibility Check

- Distance: Haversine formula on `(city.latitude, city.longitude)` of a stop
  and the stop immediately before it in `sequence` order. Implemented once,
  in `services/feasibility.py`, exposed as `distance_from_previous_km` on
  every `Stop` returned by `GET /trips/{id}/stops` — no other layer
  re-derives distance.
- Feasibility rule (pinned so it's identical everywhere it's checked):
  `is_feasible = false` when `distance_from_previous_km > 300` **and**
  `travel_gap_days < 1`. This is a deliberately simple, generous heuristic
  threshold, not a routing engine, and must not be presented in the UI as a
  guarantee.
- `TripMap.tsx` reads `stop.city.{name, latitude, longitude}` and
  `stop.{sequence, is_feasible}` off the same stops response the Itinerary
  Builder already fetches — no new endpoint.
- Map rendering mode is an integration-owned decision made once venue
  connectivity is known: online mode uses `react-leaflet` + OpenStreetMap
  tiles; offline-safe fallback renders pins via an equirectangular lat/lng
  projection onto a static bundled SVG world outline. The feasibility
  highlight logic above is identical in both modes — only pin/tile
  rendering differs.

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
- The Haversine formula and the `300km`/`1 day` feasibility thresholds
  (§7.2) are the one implementation, in `services/feasibility.py` — the
  frontend never recomputes distance itself, it only displays what the API
  returns. If the threshold needs tuning during demo prep, change it here
  first, then in that one backend function.
- The Smart Trip Assistant (§7.1) only ever writes real, persisted `Stop`/
  `ItineraryActivity` rows — never a client-side-only preview.
- Every trip-scoped route depends on `get_owned_trip` (§5) — no route
  re-implements the ownership check inline; a new route without that
  dependency is a bug, not a style choice.
