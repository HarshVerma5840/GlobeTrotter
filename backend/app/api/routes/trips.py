"""Trip CRUD (B6, CONTRACTS §4)."""
from __future__ import annotations

import secrets
from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import assert_trip_owner, get_current_user, get_owned_trip
from app.core.errors import DomainValidationError
from app.db.session import get_db
from app.models.collaboration import trip_collaborators
from app.models.stop import Stop
from app.models.trip import Trip
from app.models.user import User
from app.schemas.trip import TripCreate, TripDetailRead, TripRead, TripUpdate
from app.services.feasibility import stop_load_options, to_stop_reads

router = APIRouter(prefix="/trips", tags=["trips"])

SHARE_TOKEN_BYTES = 32


@router.get("", response_model=List[TripRead])
async def list_trips(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[Trip]:
    """
    Trips owned by OR shared with the current user (CONTRACTS §4), most
    recent departure first.
    """
    result = await db.execute(
        select(Trip)
        .outerjoin(trip_collaborators, trip_collaborators.c.trip_id == Trip.id)
        .where(
            (Trip.user_id == current_user.id)
            | (trip_collaborators.c.user_id == current_user.id)
        )
        # A trip with several collaborators would otherwise come back once
        # per join row.
        .distinct()
        .order_by(Trip.date_start.desc())
    )
    return list(result.scalars().all())


@router.post("", response_model=TripRead, status_code=status.HTTP_201_CREATED)
async def create_trip(
    payload: TripCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Trip:
    # user_id comes from the token, never from the body — a client cannot
    # create a trip under someone else's account.
    trip = Trip(**payload.model_dump(), user_id=current_user.id)
    db.add(trip)
    await db.commit()
    await db.refresh(trip)
    return trip


@router.get("/{trip_id}", response_model=TripDetailRead)
async def read_trip(
    trip: Trip = Depends(get_owned_trip),
    db: AsyncSession = Depends(get_db),
) -> TripDetailRead:
    """A trip plus its ordered stops, with the §7.2 computed fields."""
    result = await db.execute(
        select(Stop)
        .options(*stop_load_options())
        .where(Stop.trip_id == trip.id)
        .order_by(Stop.sequence)
    )
    # Built from TripRead rather than model_validate(trip) on purpose:
    # validating the ORM object directly would make Pydantic touch the
    # lazy `trip.stops` relationship, which raises MissingGreenlet under
    # async SQLAlchemy. The stops come from the eager query above instead.
    return TripDetailRead(
        **TripRead.model_validate(trip).model_dump(),
        stops=to_stop_reads(list(result.scalars().all())),
    )


@router.patch("/{trip_id}", response_model=TripRead)
async def update_trip(
    payload: TripUpdate,
    trip: Trip = Depends(get_owned_trip),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Trip:
    """
    Update a trip.

    Toggling `is_public` is owner-only (CONTRACTS §5) and mints the share
    token on first publish. The token is never regenerated on later
    publishes (CONTRACTS §2), so a link already shared with someone keeps
    working after a private/public round trip.
    """
    data = payload.model_dump(exclude_unset=True)

    if "is_public" in data:
        assert_trip_owner(trip, current_user)
        trip.is_public = data.pop("is_public")
        if trip.is_public and trip.share_token is None:
            trip.share_token = secrets.token_urlsafe(SHARE_TOKEN_BYTES)

    for key, value in data.items():
        setattr(trip, key, value)

    # Re-check the date order after a partial update — PATCHing only
    # date_end could otherwise invert a previously valid range and fail at
    # the DB constraint as a 500 instead of a clean 422.
    if trip.date_end < trip.date_start:
        raise DomainValidationError("date_end must be on or after date_start.")

    await db.commit()
    await db.refresh(trip)
    return trip


# response_model=None: see the note in itinerary_activities.py — with
# `from __future__ import annotations`, a bare `-> None` reads as a body.
@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
async def delete_trip(
    trip: Trip = Depends(get_owned_trip),
    db: AsyncSession = Depends(get_db),
) -> None:
    # Stops and their itinerary activities go with it via ON DELETE CASCADE.
    await db.delete(trip)
    await db.commit()
