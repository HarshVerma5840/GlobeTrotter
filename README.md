# GlobeTrotter

Odoo-hackathon travel planner. Backend: FastAPI + SQLAlchemy + PostgreSQL.
Frontend: React + TypeScript, with screens generated in **Stitch**.

| Doc | What it's for |
|---|---|
| `ARCHITECTURE.md` | System design and rationale |
| `CONTRACTS.md` | **Binding** schema / route / env contract |
| `INTEGRATION.md` | Build order + how backend and UI join without conflicts |
| `TASKS.md` | Phase plan and current status |
| `PROMPTS.md` | Ready-to-use kickoff prompts per phase |

Read those before writing code — this README is just the commands.

## Build order

Three sequential phases: **A** entire backend → **B** entire UI in Stitch,
ported to React → **C** integration. **Phase A is complete** (137 tests passing, real PostgreSQL migrations & catalog seed verified, OpenAPI contract & TypeScript types generated).
**Anyone about to write UI must read `INTEGRATION.md` first** — it is what
keeps Phase C mechanical instead of a scramble.

## First-time setup

```bash
cp .env.example .env
# then fill in POSTGRES_PASSWORD, JWT_SECRET_KEY, GOOGLE_MAPS_API_KEY,
# VITE_GOOGLE_MAPS_API_KEY, GROQ_API_KEY in .env (never commit that file)
```

## Start everything (Docker)

```bash
docker compose up -d
docker compose exec api alembic upgrade head
curl http://localhost:8000/health   # expect {"status":"ok"}
```

Frontend: http://localhost:5173
Backend docs (live OpenAPI contract): http://localhost:8000/docs

## Start everything (local, no Docker — what this repo has been run with)

Needs a local PostgreSQL already running and `.env` filled in at the repo
root (`DATABASE_URL` pointing at it).

```bash
# Terminal 1 — backend
cd backend
pip install -e .          # first time only
alembic upgrade head       # applies the schema — safe to re-run
python -m app.seed         # idempotent catalog seed (cities/activities)
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000

# Terminal 2 — frontend
cd frontend
npm install                # first time only
npm run dev
```

Frontend: http://localhost:5173 · Backend: http://localhost:8000/health
should return `{"status":"ok"}`.

No seeded login exists — create an account from `/login` ("New here?
Create an account"), or via the API directly:

```bash
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"YourPassword1","name":"Your Name"}'
```

## After ANY backend route or schema change

Both steps, in this order — this is the whole anti-drift mechanism
(`INTEGRATION.md` §1):

```bash
cd backend && python export_openapi.py && cd ../frontend && npm run gen:types && npm run typecheck
```

## Backend tests

```bash
cd backend && python -m pytest
```

## Notes

- The app must boot and every non-map/non-assistant route must work even
  with `GOOGLE_MAPS_API_KEY`/`GROQ_API_KEY` unset — see ARCHITECTURE.md §8
  and CONTRACTS.md §7.1/§7.2 for the required fallback behavior.
- `VITE_GOOGLE_MAPS_API_KEY` must be a browser-restricted key (HTTP
  referrer restriction in Google Cloud Console) — never the same key as
  `GOOGLE_MAPS_API_KEY`, which is used server-side only.
