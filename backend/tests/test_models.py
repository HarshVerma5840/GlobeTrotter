"""B2 — model/constraint coverage for CONTRACTS §2."""
from datetime import date
from decimal import Decimal

import pytest
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError

from app.models import Activity, ActivityCategory, City, ItineraryActivity, Stop, Trip, User


async def _user(db, email="a@b.com"):
    user = User(email=email, hashed_password="x", name="A")
    db.add(user)
    await db.flush()
    return user


async def _city(db, name="Paris"):
    city = City(name=name, country="France", latitude=48.8566, longitude=2.3522)
    db.add(city)
    await db.flush()
    return city


async def _trip(db, user, start=date(2026, 5, 1), end=date(2026, 5, 30)):
    trip = Trip(name="T", date_start=start, date_end=end, user_id=user.id)
    db.add(trip)
    await db.flush()
    return trip


async def test_trip_rejects_end_before_start(db_session):
    """CONTRACTS §2: date_end >= date_start is a real DB check constraint."""
    user = await _user(db_session)
    db_session.add(
        Trip(name="Bad", date_start=date(2026, 5, 10), date_end=date(2026, 5, 1), user_id=user.id)
    )
    with pytest.raises(IntegrityError):
        await db_session.flush()


async def test_trip_accepts_same_day_start_and_end(db_session):
    user = await _user(db_session)
    await _trip(db_session, user, date(2026, 5, 1), date(2026, 5, 1))


async def test_stop_rejects_end_before_start(db_session):
    user = await _user(db_session)
    city = await _city(db_session)
    trip = await _trip(db_session, user)
    db_session.add(
        Stop(
            trip_id=trip.id,
            city_id=city.id,
            sequence=1,
            date_start=date(2026, 5, 10),
            date_end=date(2026, 5, 2),
        )
    )
    with pytest.raises(IntegrityError):
        await db_session.flush()


async def test_city_requires_coordinates(db_session):
    """CONTRACTS §2/§8: latitude/longitude are non-negotiable, not nullable."""
    db_session.add(City(name="Nowhere", country="X", latitude=None, longitude=None))
    with pytest.raises(IntegrityError):
        await db_session.flush()


async def test_deleting_trip_cascades_to_stops_and_activities(db_session):
    """CONTRACTS §2: Stop and ItineraryActivity are ON DELETE CASCADE."""
    user = await _user(db_session)
    city = await _city(db_session)
    trip = await _trip(db_session, user)

    stop = Stop(
        trip_id=trip.id,
        city_id=city.id,
        sequence=1,
        date_start=date(2026, 5, 1),
        date_end=date(2026, 5, 5),
    )
    db_session.add(stop)
    await db_session.flush()

    activity = Activity(
        name="Louvre", city_id=city.id, category=ActivityCategory.sightseeing, cost=Decimal("22.00")
    )
    db_session.add(activity)
    await db_session.flush()

    db_session.add(
        ItineraryActivity(
            stop_id=stop.id,
            activity_id=activity.id,
            scheduled_date=date(2026, 5, 2),
            cost=Decimal("22.00"),
        )
    )
    await db_session.flush()

    await db_session.delete(trip)
    await db_session.flush()

    assert (await db_session.execute(select(Stop))).scalars().all() == []
    assert (await db_session.execute(select(ItineraryActivity))).scalars().all() == []
    # Catalog rows are shared reference data and must survive a trip delete.
    assert (await db_session.execute(select(Activity))).scalars().first() is not None


async def test_enums_persist_contract_values(db_session):
    """Stored strings must be the literal CONTRACTS §2 values, not enum member names."""
    user = await _user(db_session)
    city = await _city(db_session)
    db_session.add(Activity(name="Street food", city_id=city.id, category=ActivityCategory.food))
    await db_session.flush()

    role = (
        await db_session.execute(text("SELECT role FROM users WHERE email = :e"), {"e": user.email})
    ).scalar()
    category = (await db_session.execute(text("SELECT category FROM activities"))).scalar()
    assert role == "user"
    assert category == "food"


async def test_money_columns_round_trip_as_decimal(db_session):
    """CONTRACTS §8: money is Numeric(10,2), never Float."""
    city = await _city(db_session)
    db_session.add(
        Activity(name="Tour", city_id=city.id, category=ActivityCategory.other, cost=Decimal("19.99"))
    )
    await db_session.flush()
    db_session.expunge_all()
    cost = (await db_session.execute(select(Activity.cost))).scalar()
    assert cost == Decimal("19.99")
    assert isinstance(cost, Decimal)


async def test_email_is_unique(db_session):
    await _user(db_session, "dup@x.com")
    # _user() flushes internally, so the collision raises inside this call.
    with pytest.raises(IntegrityError):
        await _user(db_session, "dup@x.com")


async def test_ids_are_uuids(db_session):
    """CONTRACTS §2 allows UUID or serial PKs; this build uses UUID."""
    import uuid

    user = await _user(db_session)
    assert isinstance(user.id, uuid.UUID)
