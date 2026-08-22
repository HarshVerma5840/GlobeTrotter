"""
B2 — the two Stop date rules CONTRACTS §2 assigns to the service layer:
"within the parent trip's range" (cross-table) and "must not overlap"
(cross-row). Neither can be a plain SQL CHECK.
"""
import uuid
from datetime import date

import pytest

from app.core.errors import DomainValidationError
from app.models import Stop, Trip
from app.services.stops import (
    overlaps,
    validate_no_overlap,
    validate_scheduled_date,
    validate_stop,
    validate_within_trip,
)

TRIP = Trip(name="T", date_start=date(2026, 5, 1), date_end=date(2026, 5, 31))


def _stop(start, end, stop_id=None):
    return Stop(
        id=stop_id or uuid.uuid4(),
        sequence=1,
        date_start=start,
        date_end=end,
    )


# --- within parent trip range ---

def test_stop_inside_trip_range_is_ok():
    validate_within_trip(TRIP, date(2026, 5, 2), date(2026, 5, 6))


@pytest.mark.parametrize(
    "start,end",
    [
        (date(2026, 4, 30), date(2026, 5, 6)),  # starts before trip
        (date(2026, 5, 28), date(2026, 6, 2)),  # ends after trip
        (date(2026, 4, 1), date(2026, 4, 5)),   # entirely outside
    ],
)
def test_stop_outside_trip_range_is_rejected(start, end):
    with pytest.raises(DomainValidationError):
        validate_within_trip(TRIP, start, end)


def test_stop_may_span_the_whole_trip():
    validate_within_trip(TRIP, TRIP.date_start, TRIP.date_end)


def test_stop_end_before_start_is_rejected():
    with pytest.raises(DomainValidationError):
        validate_within_trip(TRIP, date(2026, 5, 10), date(2026, 5, 2))


# --- non-overlap ---

def test_clearly_separated_stops_do_not_overlap():
    assert not overlaps(date(2026, 5, 1), date(2026, 5, 5), date(2026, 5, 8), date(2026, 5, 10))


def test_touching_stops_share_the_travel_day_and_are_allowed():
    """
    CONTRACTS §2 clarification: sharing exactly one boundary day is the
    travel day and must stay legal — §7.2's feasibility rule triggers on
    travel_gap_days < 1, which is unreachable if this were rejected.
    """
    assert not overlaps(date(2026, 5, 1), date(2026, 5, 5), date(2026, 5, 5), date(2026, 5, 9))


def test_genuine_multi_day_overlap_is_detected():
    assert overlaps(date(2026, 5, 1), date(2026, 5, 6), date(2026, 5, 4), date(2026, 5, 9))


def test_fully_contained_stop_overlaps():
    assert overlaps(date(2026, 5, 1), date(2026, 5, 20), date(2026, 5, 5), date(2026, 5, 9))


def test_validate_no_overlap_rejects_colliding_stop():
    existing = [_stop(date(2026, 5, 1), date(2026, 5, 6))]
    with pytest.raises(DomainValidationError):
        validate_no_overlap(existing, date(2026, 5, 4), date(2026, 5, 9))


def test_editing_a_stop_does_not_collide_with_its_own_old_dates():
    sid = uuid.uuid4()
    existing = [_stop(date(2026, 5, 1), date(2026, 5, 6), stop_id=sid)]
    validate_no_overlap(existing, date(2026, 5, 2), date(2026, 5, 5), exclude_stop_id=sid)


def test_validate_stop_applies_both_rules():
    existing = [_stop(date(2026, 5, 1), date(2026, 5, 6))]
    validate_stop(TRIP, existing, date(2026, 5, 7), date(2026, 5, 10))
    with pytest.raises(DomainValidationError):
        validate_stop(TRIP, existing, date(2026, 5, 3), date(2026, 5, 10))
    with pytest.raises(DomainValidationError):
        validate_stop(TRIP, existing, date(2026, 6, 1), date(2026, 6, 3))


# --- itinerary activity scheduled_date ---

def test_scheduled_date_must_sit_inside_its_stop():
    stop = _stop(date(2026, 5, 4), date(2026, 5, 8))
    validate_scheduled_date(stop, date(2026, 5, 4))
    validate_scheduled_date(stop, date(2026, 5, 8))
    with pytest.raises(DomainValidationError):
        validate_scheduled_date(stop, date(2026, 5, 3))
    with pytest.raises(DomainValidationError):
        validate_scheduled_date(stop, date(2026, 5, 9))
