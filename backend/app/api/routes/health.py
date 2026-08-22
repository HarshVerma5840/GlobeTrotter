"""GET /health — the one real endpoint in the bootstrap skeleton.

Every other track's Wave 0 depends on this existing and returning 200
once the database is reachable (CONTRACTS.md §1, ARCHITECTURE.md §7).
"""
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db

router = APIRouter(tags=["health"])


@router.get("/health")
async def health(db: AsyncSession = Depends(get_db)) -> dict:
    await db.execute(text("SELECT 1"))
    return {"status": "ok"}
