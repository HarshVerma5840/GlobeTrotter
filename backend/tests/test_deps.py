"""
B4 — the shared dependencies in app/api/deps.py (CONTRACTS §5).

These are tested directly rather than through a trip route, because the
trip routes are B6 (Wave 1) and these must be correct before any of them
are written. A throwaway route is mounted to prove the HTTP status codes
too, since 401-vs-403-vs-404 is the part CONTRACTS §3 is strict about.
"""
import uuid
from datetime import date

import pytest
from fastapi import Depends, HTTPException

from app.api.deps import get_owned_trip, require_catalog_manager
from app.models import Trip, User, UserRole


async def _user(db, email, role=UserRole.user):
    user = User(email=email, hashed_password="x", name=email, role=role)
    db.add(user)
    await db.flush()
    return user


async def _trip(db, owner):
    trip = Trip(
        name="T", date_start=date(2026, 5, 1), date_end=date(2026, 5, 30), user_id=owner.id
    )
    db.add(trip)
    await db.flush()
    return trip


# --- get_owned_trip ---

async def test_owner_gets_their_trip(db_session):
    owner = await _user(db_session, "owner@x.com")
    trip = await _trip(db_session, owner)
    got = await get_owned_trip(trip_id=trip.id, current_user=owner, db=db_session)
    assert got.id == trip.id


async def test_another_user_gets_403(db_session):
    """The core security property QA's Q2 checks: no cross-user trip access."""
    owner = await _user(db_session, "owner@x.com")
    intruder = await _user(db_session, "intruder@x.com")
    trip = await _trip(db_session, owner)

    with pytest.raises(HTTPException) as exc:
        await get_owned_trip(trip_id=trip.id, current_user=intruder, db=db_session)
    assert exc.value.status_code == 403


async def test_missing_trip_gets_404_not_403(db_session):
    """404 before 403, so trip ids can't be probed for existence."""
    user = await _user(db_session, "u@x.com")
    with pytest.raises(HTTPException) as exc:
        await get_owned_trip(trip_id=uuid.uuid4(), current_user=user, db=db_session)
    assert exc.value.status_code == 404


# --- require_catalog_manager ---

@pytest.mark.parametrize(
    "role,allowed",
    [(UserRole.user, False), (UserRole.catalog_manager, True), (UserRole.admin, True)],
)
async def test_catalog_write_role_gate(db_session, role, allowed):
    user = await _user(db_session, f"{role.value}@x.com", role=role)
    if allowed:
        assert await require_catalog_manager(current_user=user) is user
    else:
        with pytest.raises(HTTPException) as exc:
            await require_catalog_manager(current_user=user)
        assert exc.value.status_code == 403


# --- wired through a real route, for the status codes ---

async def _register(client, email):
    """Sign up through the real API so the password hash is genuine."""
    await client.post(
        "/auth/signup", json={"email": email, "password": "hunter2hunter2", "name": email}
    )
    token = (
        await client.post(
            "/auth/login", data={"username": email, "password": "hunter2hunter2"}
        )
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


async def test_dependency_returns_correct_http_codes(client, db_session):
    """401 (no token) vs 403 (not yours) vs 404 (no such trip), over real HTTP."""
    from sqlalchemy import select

    from app.main import app

    # A probe route, not a real GlobeTrotter route — it exists only to
    # exercise get_owned_trip through the full FastAPI dependency stack.
    if not any(getattr(r, "path", None) == "/_test/trips/{trip_id}" for r in app.router.routes):
        @app.get("/_test/trips/{trip_id}")
        async def _probe(trip: Trip = Depends(get_owned_trip)):
            return {"id": str(trip.id)}

    owner_headers = await _register(client, "owner2@x.com")
    other_headers = await _register(client, "other2@x.com")

    owner = (
        await db_session.execute(select(User).where(User.email == "owner2@x.com"))
    ).scalar_one()
    trip = await _trip(db_session, owner)
    await db_session.commit()

    assert (await client.get(f"/_test/trips/{trip.id}")).status_code == 401
    assert (await client.get(f"/_test/trips/{trip.id}", headers=other_headers)).status_code == 403
    assert (
        await client.get(f"/_test/trips/{uuid.uuid4()}", headers=owner_headers)
    ).status_code == 404

    ok = await client.get(f"/_test/trips/{trip.id}", headers=owner_headers)
    assert ok.status_code == 200
    assert ok.json()["id"] == str(trip.id)
