"""Smart Trip Assistant request/response models (CONTRACTS §7.1)."""
from __future__ import annotations

import uuid
from decimal import Decimal
from typing import List, Literal, Optional

from pydantic import BaseModel, Field

from app.models.activity import ActivityCategory
from app.schemas.stop import StopRead

Pace = Literal["relaxed", "balanced", "packed"]

# CONTRACTS §7.1: relaxed 2/day, balanced 3/day, packed 4/day. Pinned here
# so the route, the LLM prompt, and the deterministic fallback all read the
# same numbers instead of each hard-coding their own.
ACTIVITIES_PER_DAY: dict[str, int] = {"relaxed": 2, "balanced": 3, "packed": 4}


class AutoPlanRequest(BaseModel):
    """POST /trips/{id}/auto-plan body."""

    budget_target: Optional[Decimal] = Field(default=None, ge=0, max_digits=10, decimal_places=2)
    pace: Pace = "balanced"
    # 0-3 values from the Activity.category enum (CONTRACTS §7.1).
    interest_categories: List[ActivityCategory] = Field(default_factory=list, max_length=3)
    # Free text passed to the LLM as extra context ONLY — never parsed for
    # structured fields, never trusted for anything the DB-validation step
    # doesn't independently check (CONTRACTS §7.1/§8).
    preferences: Optional[str] = Field(default=None, max_length=1000)


class AutoPlanResponse(BaseModel):
    """
    What the assistant actually wrote.

    `source` records which path produced the plan (CONTRACTS §7.1 asks for
    this to be logged for the demo narrative) — it is diagnostic, not
    user-facing copy.
    """

    trip_id: uuid.UUID
    source: Literal["llm", "fallback", "llm+fallback"]
    stops_created: int
    activities_created: int
    estimated_total: Decimal
    stops: List[StopRead] = []
