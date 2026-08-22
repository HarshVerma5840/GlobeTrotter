"""POST /trips/{id}/auto-plan — Smart Trip Assistant (B10, CONTRACTS §7.1)."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_owned_trip
from app.db.session import get_db
from app.models.stop import Stop
from app.models.trip import Trip
from app.schemas.autoplan import AutoPlanRequest, AutoPlanResponse
from app.services.autoplan import generate_plan
from app.services.feasibility import stop_load_options, to_stop_reads

router = APIRouter(tags=["autoplan"])


@router.post("/trips/{trip_id}/auto-plan", response_model=AutoPlanResponse)
async def auto_plan(
    payload: AutoPlanRequest,
    trip: Trip = Depends(get_owned_trip),
    db: AsyncSession = Depends(get_db),
) -> AutoPlanResponse:
    """
    Fill the trip with a real, editable draft itinerary.

    Always returns a usable plan: if Groq is unreachable or its output fails
    DB validation, the deterministic scorer covers the gap (CONTRACTS §7.1).
    The response echoes the full stop list so the frontend can drop the user
    straight into the Itinerary Builder without a second round trip.
    """
    result = await generate_plan(db, trip, payload)

    stops_result = await db.execute(
        select(Stop)
        .options(*stop_load_options())
        .where(Stop.trip_id == trip.id)
        .order_by(Stop.sequence)
    )

    return AutoPlanResponse(
        trip_id=trip.id,
        source=result.source,
        stops_created=result.stops_created,
        activities_created=result.activities_created,
        estimated_total=result.estimated_total,
        stops=to_stop_reads(list(stops_result.scalars().all())),
    )
