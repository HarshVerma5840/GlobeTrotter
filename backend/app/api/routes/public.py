"""
Public share routes (B9, CONTRACTS §6).

The read route takes NO auth dependency at all and only ever finds a trip
by `share_token` AND `is_public = true` — never by id (CONTRACTS §5/§6).
A token is unguessable from a trip id, which is the whole point.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.itinerary_activity import ItineraryActivity
from app.models.stop import Stop
from app.models.trip import Trip
from app.models.user import User
from app.schemas.public import PublicTripRead
from app.schemas.trip import TripRead
from app.services.budget import trip_total
from app.services.feasibility import stop_load_options, to_stop_reads

router = APIRouter(prefix="/public/trips", tags=["public"])

# One message for "no such token" and "trip is private" alike: telling the
# two apart would confirm that a token exists, which is exactly what a
# token-guessing probe wants to learn.
NOT_FOUND = HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shared trip not found")


async def _load_shared_trip(db: AsyncSession, token: str) -> Trip:
    result = await db.execute(
        select(Trip).where(Trip.share_token == token, Trip.is_public.is_(True))
    )
    trip = result.scalar_one_or_none()
    if trip is None:
        raise NOT_FOUND
    return trip


@router.get("/{token}", response_model=PublicTripRead)
async def read_public_trip(token: str, db: AsyncSession = Depends(get_db)) -> PublicTripRead:
    """Read-only itinerary for anyone holding the link. No write actions exposed."""
    trip = await _load_shared_trip(db, token)

    stops_result = await db.execute(
        select(Stop)
        .options(*stop_load_options())
        .where(Stop.trip_id == trip.id)
        .order_by(Stop.sequence)
    )
    owner = await db.get(User, trip.user_id)

    return PublicTripRead(
        name=trip.name,
        date_start=trip.date_start,
        date_end=trip.date_end,
        description=trip.description,
        cover_image_url=trip.cover_image_url,
        # First name only — a public page should not publish a full account
        # identity, and never the owner's email.
        owner_name=(owner.name.split(" ")[0] if owner else "A traveller"),
        amount_total=await trip_total(db, trip.id),
        stops=to_stop_reads(list(stops_result.scalars().all())),
    )


@router.post("/{token}/copy", response_model=TripRead, status_code=status.HTTP_201_CREATED)
async def copy_public_trip(
    token: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Trip:
    """
    Duplicate a shared trip under the current user (CONTRACTS §6).

    Requires auth — the frontend sends unauthenticated visitors to
    `/login?redirect=...` first. The copy is a private, independent trip:
    sharing state is deliberately NOT carried over, so copying someone's
    public itinerary never republishes it under a new owner.
    """
    source = await _load_shared_trip(db, token)

    copy = Trip(
        name=f"{source.name} (copy)",
        date_start=source.date_start,
        date_end=source.date_end,
        description=source.description,
        cover_image_url=source.cover_image_url,
        user_id=current_user.id,
        is_public=False,
        share_token=None,
        budget_target=source.budget_target,
    )
    db.add(copy)
    await db.flush()

    stops_result = await db.execute(
        select(Stop)
        .options(selectinload(Stop.itinerary_activities))
        .where(Stop.trip_id == source.id)
        .order_by(Stop.sequence)
    )

    for stop in stops_result.scalars().all():
        new_stop = Stop(
            trip_id=copy.id,
            city_id=stop.city_id,
            sequence=stop.sequence,
            date_start=stop.date_start,
            date_end=stop.date_end,
        )
        db.add(new_stop)
        await db.flush()
        for item in stop.itinerary_activities:
            db.add(
                ItineraryActivity(
                    stop_id=new_stop.id,
                    activity_id=item.activity_id,
                    scheduled_date=item.scheduled_date,
                    scheduled_time=item.scheduled_time,
                    # Carry the price the original trip recorded, not the
                    # catalog's current one — the copy should match what the
                    # viewer actually saw.
                    cost=item.cost,
                    notes=item.notes,
                )
            )

    await db.commit()
    await db.refresh(copy)
    return copy
