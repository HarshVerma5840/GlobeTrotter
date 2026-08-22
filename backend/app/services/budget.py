"""
Trip budget aggregation (B8, ARCHITECTURE §5, CONTRACTS §4).

One GROUP BY query over ItineraryActivity.cost, joined to Activity for the
category. Recomputed live on every request — deliberately not stored and
not cached, which removes the entire class of "stale computed field" bugs
(ARCHITECTURE §5).

Money stays Decimal end to end (CONTRACTS §8: never Float), so rounding
never silently drifts through the aggregation.
"""
from __future__ import annotations

import uuid
from decimal import ROUND_HALF_UP, Decimal
from typing import Dict, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity import Activity, ActivityCategory
from app.models.itinerary_activity import ItineraryActivity
from app.models.stop import Stop
from app.models.trip import Trip

CENTS = Decimal("0.01")


def _money(value: Decimal) -> Decimal:
    """Quantize to 2dp with half-up rounding — matches Numeric(10,2) storage."""
    return value.quantize(CENTS, rounding=ROUND_HALF_UP)


def duration_days(trip: Trip) -> int:
    """
    Trip length in days, inclusive of both end dates.

    A single-day trip is 1 day, not 0 — which also keeps it safe as the
    divisor for amount_per_day.
    """
    return (trip.date_end - trip.date_start).days + 1


async def compute_budget(db: AsyncSession, trip: Trip) -> Dict:
    """
    Aggregate a trip's costs by activity category.

    Returns the plain dict BudgetRead is built from. Categories with no
    spend are included with a 0.00 total: the budget chart needs a stable
    set of slices, and an absent key would make the frontend guess.
    """
    result = await db.execute(
        select(Activity.category, func.coalesce(func.sum(ItineraryActivity.cost), 0))
        .select_from(ItineraryActivity)
        .join(Stop, ItineraryActivity.stop_id == Stop.id)
        .join(Activity, ItineraryActivity.activity_id == Activity.id)
        .where(Stop.trip_id == trip.id)
        .group_by(Activity.category)
    )

    by_category: Dict[ActivityCategory, Decimal] = {c: Decimal("0.00") for c in ActivityCategory}
    for category, total in result.all():
        # SQLAlchemy hands back the enum for a native enum column and the
        # raw string for a non-native one; normalize so the response key is
        # always the enum member.
        key = category if isinstance(category, ActivityCategory) else ActivityCategory(category)
        by_category[key] = _money(Decimal(total))

    amount_total = _money(sum(by_category.values(), Decimal("0.00")))
    days = duration_days(trip)
    amount_per_day = _money(amount_total / Decimal(days))

    budget_target: Optional[Decimal] = (
        Decimal(trip.budget_target) if trip.budget_target is not None else None
    )
    # Null, not False, when no target is set: "no target" and "under target"
    # are different states and the UI renders them differently.
    is_over_budget = None if budget_target is None else amount_total > budget_target

    return {
        "trip_id": trip.id,
        "duration_days": days,
        "amount_by_category": by_category,
        "amount_total": amount_total,
        "amount_per_day": amount_per_day,
        "budget_target": budget_target,
        "is_over_budget": is_over_budget,
    }


async def trip_total(db: AsyncSession, trip_id: uuid.UUID) -> Decimal:
    """Just the total — used by the public share response (CONTRACTS §6)."""
    result = await db.execute(
        select(func.coalesce(func.sum(ItineraryActivity.cost), 0))
        .select_from(ItineraryActivity)
        .join(Stop, ItineraryActivity.stop_id == Stop.id)
        .where(Stop.trip_id == trip_id)
    )
    return _money(Decimal(result.scalar_one()))
