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

## Start everything

```bash
docker compose up -d
docker compose exec api alembic upgrade head
curl http://localhost:8000/health   # expect {"status":"ok"}
```

Frontend: http://localhost:5173
Backend docs (live OpenAPI contract): http://localhost:8000/docs

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
