"""
Unit tests for the §7.2 feasibility maths (B11).

Pure functions, no DB and no network — this is the logic CONTRACTS §8 says
must have exactly one implementation, so it is worth pinning directly.
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import date

from app.services.feasibility import (
    LONG_HOP_KM,
    compute_legs,
    haversine_km,
    travel_gap_days,
)


@dataclass
class FakeCity:
    latitude: float
    longitude: float
    id: uuid.UUID = None  # type: ignore[assignment]

    def __post_init__(self) -> None:
        if self.id is None:
            self.id = uuid.uuid4()


@dataclass
class FakeStop:
    date_start: date
    date_end: date
    city: FakeCity
    id: uuid.UUID = None  # type: ignore[assignment]

    def __post_init__(self) -> None:
        if self.id is None:
            self.id = uuid.uuid4()


PARIS = FakeCity(48.8566, 2.3522)
LONDON = FakeCity(51.5074, -0.1278)
BANGKOK = FakeCity(13.7563, 100.5018)


def test_haversine_known_distance() -> None:
    # Paris <-> London is ~344km great-circle; allow a little slack.
    assert 330 < haversine_km(48.8566, 2.3522, 51.5074, -0.1278) < 360


def test_haversine_zero_for_same_point() -> None:
    assert haversine_km(10.0, 20.0, 10.0, 20.0) == 0.0


def test_travel_gap_days_same_day_is_zero() -> None:
    # Stops may share their boundary day — that day IS the travel day.
    assert travel_gap_days(date(2026, 5, 4), date(2026, 5, 4)) == 0


def test_travel_gap_days_never_negative() -> None:
    assert travel_gap_days(date(2026, 5, 10), date(2026, 5, 4)) == 0


def test_first_stop_has_no_leg() -> None:
    stop = FakeStop(date(2026, 5, 1), date(2026, 5, 3), PARIS)
    leg = compute_legs([stop])[stop.id]
    assert leg.distance_from_previous_km is None
    assert leg.travel_gap_days is None
    assert leg.is_feasible is True


def test_long_hop_with_no_gap_is_infeasible() -> None:
    """Paris -> Bangkok (~9,400km) arriving the same day cannot be done."""
    a = FakeStop(date(2026, 5, 1), date(2026, 5, 3), PARIS)
    b = FakeStop(date(2026, 5, 3), date(2026, 5, 6), BANGKOK)
    leg = compute_legs([a, b])[b.id]
    assert leg.distance_from_previous_km > LONG_HOP_KM
    assert leg.travel_gap_days == 0
    assert leg.is_feasible is False
    assert leg.distance_source == "haversine"


def test_long_hop_with_a_travel_day_is_feasible() -> None:
    """The same hop is fine once there is a day to make it in."""
    a = FakeStop(date(2026, 5, 1), date(2026, 5, 3), PARIS)
    b = FakeStop(date(2026, 5, 5), date(2026, 5, 8), BANGKOK)
    leg = compute_legs([a, b])[b.id]
    assert leg.travel_gap_days == 2
    assert leg.is_feasible is True


def test_short_hop_same_day_is_feasible() -> None:
    """Paris -> London same day is a normal train journey, not a red flag."""
    a = FakeStop(date(2026, 5, 1), date(2026, 5, 3), PARIS)
    b = FakeStop(date(2026, 5, 3), date(2026, 5, 6), LONDON)
    leg = compute_legs([a, b])[b.id]
    assert leg.distance_from_previous_km > LONG_HOP_KM  # ~344km, just over
    assert leg.is_feasible is False


def test_every_stop_gets_a_leg() -> None:
    stops = [
        FakeStop(date(2026, 5, 1), date(2026, 5, 3), PARIS),
        FakeStop(date(2026, 5, 5), date(2026, 5, 7), LONDON),
        FakeStop(date(2026, 5, 9), date(2026, 5, 12), BANGKOK),
    ]
    legs = compute_legs(stops)
    assert len(legs) == 3
    assert all(s.id in legs for s in stops)
