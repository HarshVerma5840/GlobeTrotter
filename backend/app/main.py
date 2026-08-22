"""
FastAPI app entrypoint. This is the ONLY real feature code in the
bootstrap pass — every model, schema, and non-health route below this
point is a placeholder for Backend track's Wave 0/1 tasks (TASKS.md).
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import (
    activities,
    auth,
    autoplan,
    budget,
    cities,
    health,
    itinerary_activities,
    public,
    stops,
    trips,
    users,
)
from app.core.config import settings
from app.core.errors import DomainValidationError

app = FastAPI(title="GlobeTrotter API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(trips.router)
# stops must be included before any other router that could claim
# /stops/{stop_id} — its literal /stops/reorder path is declared first
# inside the module for the same reason (see stops.py docstring).
app.include_router(stops.router)
app.include_router(itinerary_activities.router)
app.include_router(cities.router)
app.include_router(activities.router)
app.include_router(budget.router)
app.include_router(autoplan.router)
app.include_router(public.router)


@app.exception_handler(DomainValidationError)
async def domain_validation_handler(_: Request, exc: DomainValidationError) -> JSONResponse:
    # Business-rule violations (CONTRACTS §2 stop rules) surface as 422.
    return JSONResponse(status_code=422, content={"detail": str(exc)})
