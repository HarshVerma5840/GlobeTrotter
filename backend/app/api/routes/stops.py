"""
Stop routes (B6, CONTRACTS §4) plus the batched reorder.

Route-ordering note: `PATCH /stops/reorder` is declared BEFORE
`PATCH /stops/{stop_id}`. FastAPI matches in declaration order, and while
`stop_id` is UUID-typed (so "reorder" would 422 rather than silently
mis-route), relying on that would be fragile — declaring the literal path
first makes the intent explicit.
"""
from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import assert_trip_access, get_current_user, get_owned_stop, get_owned_trip
from app.core.errors import DomainValidationError
from app.db.session import get_db
from app.models.city import City
from app.models.itinerary_activity import ItineraryActivity
from app.models.stop import Stop
from app.models.trip import Trip
from app.models.user import User
from app.schemas.itinerary_activity import ItineraryActivityCreate, ItineraryActivityRead
from app.schemas.stop import StopCreate, StopRead, StopReorderItem, StopUpdate
from app.services.feasibility import stop_load_options, to_stop_reads
from app.services.stops import validate_scheduled_date, validate_stop

router = APIRouter(tags=["stops"])


async def _load_trip_stops(db: AsyncSession, trip_id) -> List[Stop]:
    result = await db.execute(
        select(Stop)
        .options(*stop_load_options())
        .where(Stop.trip_id == trip_id)
        .order_by(Stop.sequence)
    )
    return list(result.scalars().all())


# --------------------------------------------------------------------------
# Batched reorder — declared first, see module docstring
# --------------------------------------------------------------------------


@router.patch("/stops/reorder", response_model=List[StopRead])
async def reorder_stops(
    payload: List[StopReorderItem],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[StopRead]:
    """
    Apply a whole new ordering in ONE request (CONTRACTS §4: batched, never
    one call per row) — a drag-reorder in the builder is a single write.

    Every stop must belong to the same trip, and that trip must be one the
    caller may touch. Both are checked before anything is mutated, so a
    partially-authorized batch changes nothing at all.
    """
    if not payload:
        return []

    ids = [item.id for item in payload]
    if len(set(ids)) != len(ids):
        raise DomainValidationError("Duplicate stop ids in reorder payload.")

    result = await db.execute(
        select(Stop).options(selectinload(Stop.trip)).where(Stop.id.in_(ids))
    )
    stops = {stop.id: stop for stop in result.scalars().all()}

    missing = [str(i) for i in ids if i not in stops]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown stop id(s): {', '.join(missing)}",
        )

    trip_ids = {stop.trip_id for stop in stops.values()}
    if len(trip_ids) > 1:
        raise DomainValidationError("All stops in a reorder must belong to the same trip.")

    trip = next(iter(stops.values())).trip
    assert_trip_access(trip, current_user)

    for item in payload:
        stops[item.id].sequence = item.sequence

    await db.commit()
    return to_stop_reads(await _load_trip_stops(db, trip.id))


# --------------------------------------------------------------------------
# Trip-scoped stop collection
# --------------------------------------------------------------------------


@router.get("/trips/{trip_id}/stops", response_model=List[StopRead])
async def list_stops(
    trip: Trip = Depends(get_owned_trip),
    db: AsyncSession = Depends(get_db),
) -> List[StopRead]:
    return to_stop_reads(await _load_trip_stops(db, trip.id))


@router.post("/trips/{trip_id}/stops", response_model=StopRead, status_code=status.HTTP_201_CREATED)
async def create_stop(
    payload: StopCreate,
    trip: Trip = Depends(get_owned_trip),
    db: AsyncSession = Depends(get_db),
) -> StopRead:
    """
    Add a city leg. Both cross-row date rules run before the insert
    (services/stops.py) rather than being re-derived here.
    """
    if await db.get(City, payload.city_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="City not found")

    existing = await _load_trip_stops(db, trip.id)
    validate_stop(trip, existing, payload.date_start, payload.date_end)

    sequence = payload.sequence
    if sequence is None:
        # Append by default — what "add city" in the builder means.
        sequence = max((s.sequence for s in existing), default=-1) + 1

    stop = Stop(
        trip_id=trip.id,
        city_id=payload.city_id,
        sequence=sequence,
        date_start=payload.date_start,
        date_end=payload.date_end,
    )
    db.add(stop)
    await db.commit()

    # Re-read the whole run: this stop's computed leg depends on the stop
    # before it, which a refresh of this row alone would not give us.
    stops = await _load_trip_stops(db, trip.id)
    return next(read for read in to_stop_reads(stops) if read.id == stop.id)


# --------------------------------------------------------------------------
# Single stop
# --------------------------------------------------------------------------


@router.patch("/stops/{stop_id}", response_model=StopRead)
async def update_stop(
    payload: StopUpdate,
    stop: Stop = Depends(get_owned_stop),
    db: AsyncSession = Depends(get_db),
) -> StopRead:
    data = payload.model_dump(exclude_unset=True)

    new_start = data.get("date_start", stop.date_start)
    new_end = data.get("date_end", stop.date_end)

    if "city_id" in data and await db.get(City, data["city_id"]) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="City not found")

    if "date_start" in data or "date_end" in data:
        existing = await _load_trip_stops(db, stop.trip_id)
        # exclude_stop_id keeps a stop from colliding with its own old dates.
        validate_stop(stop.trip, existing, new_start, new_end, exclude_stop_id=stop.id)

    for key, value in data.items():
        setattr(stop, key, value)

    await db.commit()
    stops = await _load_trip_stops(db, stop.trip_id)
    return next(read for read in to_stop_reads(stops) if read.id == stop.id)


# response_model=None: see the note in itinerary_activities.py.
@router.delete("/stops/{stop_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
async def delete_stop(
    stop: Stop = Depends(get_owned_stop),
    db: AsyncSession = Depends(get_db),
) -> None:
    # Itinerary activities cascade with the stop (CONTRACTS §2).
    await db.delete(stop)
    await db.commit()


# --------------------------------------------------------------------------
# Activities attached to a stop
# --------------------------------------------------------------------------


@router.get("/stops/{stop_id}/activities", response_model=List[ItineraryActivityRead])
async def list_stop_activities(
    stop: Stop = Depends(get_owned_stop),
    db: AsyncSession = Depends(get_db),
) -> List[ItineraryActivity]:
    result = await db.execute(
        select(ItineraryActivity)
        .options(selectinload(ItineraryActivity.activity))
        .where(ItineraryActivity.stop_id == stop.id)
        .order_by(ItineraryActivity.scheduled_date, ItineraryActivity.scheduled_time)
    )
    return list(result.scalars().all())


@router.post(
    "/stops/{stop_id}/activities",
    response_model=ItineraryActivityRead,
    status_code=status.HTTP_201_CREATED,
)
async def add_stop_activity(
    payload: ItineraryActivityCreate,
    stop: Stop = Depends(get_owned_stop),
    db: AsyncSession = Depends(get_db),
) -> ItineraryActivity:
    """
    Schedule a catalog activity on this stop.

    `cost` defaults from `Activity.cost` at insert time and is independent
    from then on (CONTRACTS §2), so re-pricing the catalog later never
    rewrites a planned trip's numbers.
    """
    from app.models.activity import Activity

    activity = await db.get(Activity, payload.activity_id)
    if activity is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")

    validate_scheduled_date(stop, payload.scheduled_date)

    item = ItineraryActivity(
        stop_id=stop.id,
        activity_id=activity.id,
        scheduled_date=payload.scheduled_date,
        scheduled_time=payload.scheduled_time,
        cost=payload.cost if payload.cost is not None else activity.cost,
        notes=payload.notes,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item, attribute_names=["activity"])
    return item
