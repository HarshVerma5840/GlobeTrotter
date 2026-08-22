"""Budget response model (CONTRACTS §4, ARCHITECTURE §5)."""
from __future__ import annotations

import uuid
from decimal import Decimal
from typing import Dict, Optional

from pydantic import BaseModel

from app.models.activity import ActivityCategory


class BudgetRead(BaseModel):
    """
    GET /trips/{id}/budget.

    Every figure here is computed at request time from a GROUP BY over
    ItineraryActivity.cost — none of it is a stored column (ARCHITECTURE §5).
    """

    trip_id: uuid.UUID
    duration_days: int
    amount_by_category: Dict[ActivityCategory, Decimal]
    amount_total: Decimal
    amount_per_day: Decimal
    budget_target: Optional[Decimal] = None
    # None when no budget_target is set — "no target" is not the same as
    # "under target", so this stays null rather than defaulting to False.
    is_over_budget: Optional[bool] = None
