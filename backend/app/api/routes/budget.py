"""GET /trips/{id}/budget (B8, ARCHITECTURE §5)."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_owned_trip
from app.db.session import get_db
from app.models.trip import Trip
from app.schemas.budget import BudgetRead
from app.services.budget import compute_budget

router = APIRouter(tags=["budget"])


@router.get("/trips/{trip_id}/budget", response_model=BudgetRead)
async def read_budget(
    trip: Trip = Depends(get_owned_trip),
    db: AsyncSession = Depends(get_db),
) -> BudgetRead:
    """Live aggregation — never a stored or cached total (ARCHITECTURE §5)."""
    return BudgetRead(**await compute_budget(db, trip))
