"""
Shared FastAPI dependencies (CONTRACTS §5, ARCHITECTURE §6).

Every identity/ownership check in the app is written ONCE, here. A route
that re-implements one inline is a bug, not a style choice (CONTRACTS §8).
"""
from __future__ import annotations

import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.itinerary_activity import ItineraryActivity
from app.models.stop import Stop
from app.models.trip import Trip
from app.models.user import User, UserRole

# tokenUrl is what the /docs "Authorize" button posts to — keep it in step
# with the POST /auth/login path (CONTRACTS §3).
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Decode the bearer token and load the User.

    CONTRACTS §3: a missing or invalid token is 401 — never 403. 403 is
    reserved for "we know who you are, you just may not touch this".
    """
    subject = decode_access_token(token)
    if subject is None:
        raise CREDENTIALS_EXCEPTION
    try:
        user_id = uuid.UUID(subject)
    except (TypeError, ValueError):
        raise CREDENTIALS_EXCEPTION

    result = await db.execute(
        select(User).options(selectinload(User.saved_cities)).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if user is None:
        # Valid signature, but the user is gone (deleted since the token issued).
        raise CREDENTIALS_EXCEPTION
    return user


async def get_owned_trip(
    trip_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Trip:
    """
    Load a trip the current user is allowed to touch, or refuse.

    CONTRACTS §5/§8: EVERY trip-scoped route depends on this. A route that
    re-implements the ownership check inline is a bug — the whole point is
    that this logic exists in exactly one place.

    Status codes follow CONTRACTS §3's 401-vs-403 rule:
      * unknown/invalid token  -> 401 (raised upstream by get_current_user)
      * trip does not exist    -> 404
      * exists, not yours      -> 403

    404-before-403 is deliberate: answering 403 for a trip id that doesn't
    exist would let anyone probe which trip ids are real.

    Collaborator access (CONTRACTS §7.3) is Wave 3 / B12; when the
    trip_collaborators table lands, widen the check HERE and nowhere else.
    """
    trip = await db.get(Trip, trip_id)
    if trip is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    assert_trip_access(trip, current_user)
    return trip


def assert_trip_access(trip: Trip, current_user: User) -> None:
    """
    The one trip-access rule, extracted so the stop- and activity-scoped
    dependencies below enforce it identically instead of re-deriving it.

    Widen this (and only this) when collaborators land in B12.
    """
    if trip.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this trip.",
        )


def assert_trip_owner(trip: Trip, current_user: User) -> None:
    """
    Stricter than access: the OWNER only, never a collaborator.

    CONTRACTS §5 reserves `is_public`, `share_token`, and the collaborator
    list for the owner. Today access and ownership coincide, but this stays
    a separate call so B12 cannot accidentally hand collaborators the
    sharing controls by widening one check.
    """
    if trip.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the trip owner may change sharing settings.",
        )


async def get_owned_stop(
    stop_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Stop:
    """
    Load a stop on a trip the current user may touch (CONTRACTS §4 routes
    keyed by stop id). Same 404-before-403 reasoning as get_owned_trip.
    """
    result = await db.execute(
        select(Stop).options(selectinload(Stop.trip)).where(Stop.id == stop_id)
    )
    stop = result.scalar_one_or_none()
    if stop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stop not found")
    assert_trip_access(stop.trip, current_user)
    return stop


async def get_owned_itinerary_activity(
    itinerary_activity_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ItineraryActivity:
    """Load an itinerary activity via its stop's trip, applying the same rule."""
    result = await db.execute(
        select(ItineraryActivity)
        .options(selectinload(ItineraryActivity.stop).selectinload(Stop.trip))
        .where(ItineraryActivity.id == itinerary_activity_id)
    )
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Itinerary activity not found"
        )
    assert_trip_access(item.stop.trip, current_user)
    return item


async def require_catalog_manager(current_user: User = Depends(get_current_user)) -> User:
    """
    CONTRACTS §5: City/Activity catalog writes are gated to `catalog_manager`
    (admins included). Same pattern as ownership — declared once, here.
    """
    if current_user.role not in (UserRole.catalog_manager, UserRole.admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Catalog changes require the catalog_manager role.",
        )
    return current_user
