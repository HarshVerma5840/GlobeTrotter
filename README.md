# GlobeTrotter

Odoo-hackathon travel planner. Backend: FastAPI + SQLAlchemy + PostgreSQL.
Frontend: React + TypeScript. Full design in `ARCHITECTURE.md`, the binding
schema/route/env contract in `CONTRACTS.md`, task ownership in `TASKS.md`,
and ready-to-use kickoff prompts per track in `PROMPTS.md`. Read those
before writing code — this README is just the startup sequence.

## First-time setup

```bash
cp .env.example .env
# then fill in POSTGRES_PASSWORD, JWT_SECRET_KEY, GOOGLE_MAPS_API_KEY,
# VITE_GOOGLE_MAPS_API_KEY, GROQ_API_KEY in .env (never commit that file)
```

## Start everything

```bash
docker compose up -d
docker compose exec api alembic upgrade head
curl http://localhost:8000/health   # expect {"status":"ok"}
```

Frontend: http://localhost:5173
Backend docs (live OpenAPI contract): http://localhost:8000/docs

## Notes

- The app must boot and every non-map/non-assistant route must work even
  with `GOOGLE_MAPS_API_KEY`/`GROQ_API_KEY` unset — see ARCHITECTURE.md §8
  and CONTRACTS.md §7.1/§7.2 for the required fallback behavior.
- `VITE_GOOGLE_MAPS_API_KEY` must be a browser-restricted key (HTTP
  referrer restriction in Google Cloud Console) — never the same key as
  `GOOGLE_MAPS_API_KEY`, which is used server-side only.
