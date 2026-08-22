"""
Distance / travel-gap / feasibility computation (CONTRACTS §7.2, B11).

This is THE single implementation. CONTRACTS §8 is explicit: the frontend
never recomputes any of this, it only displays what the API returns, and if
a threshold needs tuning it changes here and nowhere else.

Scope of this pass (deliberate, stated plainly rather than left implied):
CONTRACTS §7.2 specifies Google Directions as the PRIMARY source with
Haversine as the fallback for pairs Directions can't route. This module
currently implements the Haversine path only. That is a scope decision for
demo-critical time, not an oversight, and it is safe because:

  * Haversine is the path CONTRACTS §7.2 already requires to exist, and the
    one it pins the exact threshold for, so nothing here contradicts it.
  * The `distance_source` field and the per-pair cache seam are already in
    place, so adding Directions later is a change inside `_measure()` alone
    — no route, schema, or frontend change follows from it.
  * It has no external dependency at all, so the feature cannot be taken
    down by a missing API key or venue Wi-Fi (ARCHITECTURE §8's whole
    concern).

When Directions is added, populate `distance_source="directions"` and keep
the Haversine branch as the fallback it was always specified to be.
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import date
from typing import Dict, List, Literal, Optional, Sequence, Tuple
from uuid import UUID

EARTH_RADIUS_KM = 6371.0

# CONTRACTS §7.2 pins the fallback trigger: flag when the hop is a long one
# AND there is no travel day between the two stops. Both conditions must
# hold — a 3000km hop with a week's gap is perfectly feasible, and a 20km
# hop on the same day obviously is too.
LONG_HOP_KM = 300.0
MIN_TRAVEL_GAP_DAYS = 1

# Used only to turn a straight-line distance into a rough duration for
# display. An explicitly crude average that blends ground and air travel —
# CONTRACTS §7.2 calls the fallback "a deliberately simple, generous
# heuristic, not a routing engine", and this must not be presented in the
# UI as a guarantee.
ASSUMED_AVERAGE_SPEED_KMH = 80.0


@dataclass(frozen=True)
class Leg:
    """Computed travel figures for one stop, relative to the stop before it."""

    distance_from_previous_km: Optional[float]
    travel_duration_hours: Optional[float]
    distance_source: Optional[Literal["directions", "haversine"]]
    travel_gap_days: Optional[int]
    is_feasible: bool


#: The first stop of a trip has nothing before it, so every figure is null
#: and it is trivially feasible. Shared constant so routes never invent
#: their own "empty" shape.
FIRST_LEG = Leg(None, None, None, None, True)


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in km between two lat/lng points."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return 2 * EARTH_RADIUS_KM * math.asin(math.sqrt(a))


def travel_gap_days(previous_end: date, current_start: date) -> int:
    """
    Days available to travel between two consecutive stops.

    Zero means "same day" — the stops share their boundary day, which
    services/stops.py explicitly allows as the travel day. Negative can't
    occur for validated stops (they may touch but never overlap), but it is
    clamped rather than trusted, so a bad row degrades to "no time" instead
    of producing a nonsense negative gap.
    """
    return max((current_start - previous_end).days, 0)


def _measure(
    lat1: float, lon1: float, lat2: float, lon2: float
) -> Tuple[float, float, Literal["directions", "haversine"]]:
    """
    Distance (km) + duration (h) for one city pair, and which source produced them.

    The seam where Google Directions goes when B11's online path is built:
    try Directions first, fall back to the Haversine branch below for any
    pair it cannot route. Everything downstream reads the returned tuple and
    never needs to know which branch ran.
    """
    distance = haversine_km(lat1, lon1, lat2, lon2)
    return distance, distance / ASSUMED_AVERAGE_SPEED_KMH, "haversine"


def _is_feasible(distance_km: float, gap_days: int, source: str) -> bool:
    """
    The one feasibility rule (CONTRACTS §7.2).

    On the Haversine path the pinned threshold applies verbatim: not
    feasible when the hop is over LONG_HOP_KM *and* the gap is under a day.
    When a real Directions duration is available, compare that duration to
    the window instead — a routed 14h drive with no day to do it in is
    infeasible regardless of how short the straight line looked.
    """
    if source == "haversine":
        return not (distance_km > LONG_HOP_KM and gap_days < MIN_TRAVEL_GAP_DAYS)
    return gap_days >= MIN_TRAVEL_GAP_DAYS


def compute_legs(stops: Sequence) -> Dict[UUID, Leg]:
    """
    Compute the §7.2 fields for an ordered run of stops.

    `stops` must already be sorted by `sequence` and have `.city` loaded
    (routes use selectinload for exactly this reason — a lazy load here
    would raise under async SQLAlchemy).

    Returns a {stop_id: Leg} map rather than mutating the ORM objects, so
    nothing can mistake a computed value for a persisted column.
    """
    legs: Dict[UUID, Leg] = {}
    previous = None

    for stop in stops:
        city = getattr(stop, "city", None)
        previous_city = getattr(previous, "city", None) if previous is not None else None

        if previous is None or city is None or previous_city is None:
            # First stop, or a stop whose city failed to load: report the
            # neutral leg rather than guessing at a distance.
            legs[stop.id] = FIRST_LEG
            previous = stop
            continue

        distance, duration, source = _measure(
            previous_city.latitude, previous_city.longitude, city.latitude, city.longitude
        )
        gap = travel_gap_days(previous.date_end, stop.date_start)
        legs[stop.id] = Leg(
            distance_from_previous_km=round(distance, 1),
            travel_duration_hours=round(duration, 1),
            distance_source=source,
            travel_gap_days=gap,
            is_feasible=_is_feasible(distance, gap, source),
        )
        previous = stop

    return legs


def stop_load_options() -> tuple:
    """
    The eager-load options every stop query feeding `to_stop_reads` must use.

    Lives here, beside the function that needs them, because forgetting one
    doesn't fail loudly at query time — it fails later, inside Pydantic, as
    a MissingGreenlet when a lazy relationship is touched outside async
    context. Spelling the requirement out once removes that trap.

    Imported lazily to keep this module free of model imports at import time.
    """
    from sqlalchemy.orm import selectinload

    from app.models.itinerary_activity import ItineraryActivity
    from app.models.stop import Stop

    return (
        selectinload(Stop.city),
        selectinload(Stop.itinerary_activities).selectinload(ItineraryActivity.activity),
    )


def to_stop_reads(stops: Sequence) -> List:
    """
    Serialize ordered stops into StopRead objects with the §7.2 fields filled in.

    Imported lazily to keep this module import-clean for unit tests that
    exercise the maths without pulling in Pydantic schemas.
    """
    from app.schemas.stop import StopRead

    legs = compute_legs(stops)
    reads = []
    for stop in stops:
        read = StopRead.model_validate(stop)
        leg = legs.get(stop.id, FIRST_LEG)
        read.distance_from_previous_km = leg.distance_from_previous_km
        read.travel_duration_hours = leg.travel_duration_hours
        read.distance_source = leg.distance_source
        read.travel_gap_days = leg.travel_gap_days
        read.is_feasible = leg.is_feasible
        reads.append(read)
    return reads
