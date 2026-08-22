"""
FastAPI app entrypoint. This is the ONLY real feature code in the
bootstrap pass — every model, schema, and non-health route below this
point is a placeholder for Backend track's Wave 0/1 tasks (TASKS.md).
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import auth, health, users
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


@app.exception_handler(DomainValidationError)
async def domain_validation_handler(_: Request, exc: DomainValidationError) -> JSONResponse:
    # Business-rule violations (CONTRACTS §2 stop rules) surface as 422.
    return JSONResponse(status_code=422, content={"detail": str(exc)})
