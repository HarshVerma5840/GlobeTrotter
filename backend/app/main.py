"""
FastAPI app entrypoint. This is the ONLY real feature code in the
bootstrap pass — every model, schema, and non-health route below this
point is a placeholder for Backend track's Wave 0/1 tasks (TASKS.md).
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import health
from app.core.config import settings

app = FastAPI(title="GlobeTrotter API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
