"""PATCH/DELETE /itinerary-activities/{id} (B6, CONTRACTS §4)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_owned_itinerary_activity
from app.db.session import get_db
from app.models.itinerary_activity import ItineraryActivity
from app.schemas.itinerary_activity import ItineraryActivityRead, ItineraryActivityUpdate
from app.services.stops import validate_scheduled_date

router = APIRouter(prefix="/itinerary-activities", tags=["itinerary-activities"])


@router.patch("/{itinerary_activity_id}", response_model=ItineraryActivityRead)
async def update_itinerary_activity(
    payload: ItineraryActivityUpdate,
    item: ItineraryActivity = Depends(get_owned_itinerary_activity),
    db: AsyncSession = Depends(get_db),
) -> ItineraryActivity:
    data = payload.model_dump(exclude_unset=True)

    if "scheduled_date" in data:
        # Rescheduling must stay inside the parent stop's range (CONTRACTS §2).
        validate_scheduled_date(item.stop, data["scheduled_date"])

    for key, value in data.items():
        setattr(item, key, value)

    await db.commit()
    await db.refresh(item, attribute_names=["activity"])
    return item


# response_model=None is required, not decorative: this module uses
# `from __future__ import annotations`, so FastAPI sees the `-> None`
# return annotation as the string "None", resolves it to NoneType, and
# treats it as a response body — which a 204 may not have.
@router.delete(
    "/{itinerary_activity_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_model=None,
)
async def delete_itinerary_activity(
    item: ItineraryActivity = Depends(get_owned_itinerary_activity),
    db: AsyncSession = Depends(get_db),
) -> None:
    await db.delete(item)
    await db.commit()
