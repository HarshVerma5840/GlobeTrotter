"""
Stop date rules from CONTRACTS §2.

Two of the three Stop date rules cannot be plain SQL CHECK constraints:

  * "within the parent trip's range" is cross-TABLE (stops -> trips)
  * "stops must not overlap in date" is cross-ROW

CONTRACTS §2 therefore specifies both as service-layer checks at write
time. They live here, once, so B6's routes call them rather than
re-implementing date math per handler.
"""
from __future__ import annotations

import uuid
from datetime import date
from typing import Iterable, Optional

from app.core.errors import DomainValidationError
from app.models.stop import Stop
from app.models.trip import Trip


def validate_within_trip(trip: Trip, date_start: date, date_end: date) -> None:
    """A stop's dates must sit inside its parent trip's range (CONTRACTS §2)."""
    if date_end < date_start:
        raise DomainValidationError("Stop date_end must be on or after date_start.")
    if date_start < trip.date_start or date_end > trip.date_end:
        raise DomainValidationError(
            f"Stop dates {date_start}..{date_end} fall outside the trip's "
            f"range {trip.date_start}..{trip.date_end}."
        )


def overlaps(a_start: date, a_end: date, b_start: date, b_end: date) -> bool:
    """
    True when two inclusive date ranges overlap by a full day or more.

    Deliberately strict (`<`, not `<=`): two consecutive stops may SHARE a
    single boundary day, because that is the travel day — you leave city A
    and reach city B on the same date. CONTRACTS §7.2 depends on this being
    legal: its feasibility rule triggers on `travel_gap_days < 1`, a case
    unreachable if touching stops were rejected. See CONTRACTS §2.
    """
    return a_start < b_end and b_start < a_end


def validate_no_overlap(
    existing: Iterable[Stop],
    date_start: date,
    date_end: date,
    exclude_stop_id: Optional[uuid.UUID] = None,
) -> None:
    """Reject a stop that overlaps any other stop on the same trip (CONTRACTS §2)."""
    for stop in existing:
        if exclude_stop_id is not None and stop.id == exclude_stop_id:
            continue  # editing a stop must not collide with its own old dates
        if overlaps(date_start, date_end, stop.date_start, stop.date_end):
            raise DomainValidationError(
                f"Stop dates {date_start}..{date_end} overlap existing stop "
                f"{stop.id} ({stop.date_start}..{stop.date_end})."
            )


def validate_stop(
    trip: Trip,
    existing: Iterable[Stop],
    date_start: date,
    date_end: date,
    exclude_stop_id: Optional[uuid.UUID] = None,
) -> None:
    """Both write-time Stop rules in one call — what B6's routes should use."""
    validate_within_trip(trip, date_start, date_end)
    validate_no_overlap(existing, date_start, date_end, exclude_stop_id)


def validate_scheduled_date(stop: Stop, scheduled_date: date) -> None:
    """ItineraryActivity.scheduled_date must fall within its stop's range (CONTRACTS §2)."""
    if not (stop.date_start <= scheduled_date <= stop.date_end):
        raise DomainValidationError(
            f"scheduled_date {scheduled_date} is outside stop "
            f"{stop.date_start}..{stop.date_end}."
        )
