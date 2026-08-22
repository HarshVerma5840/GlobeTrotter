"""ItineraryActivity request/response models (CONTRACTS §2, §4)."""
from __future__ import annotations

import uuid
from datetime import date
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.activity import ActivityRead


class ItineraryActivityCreate(BaseModel):
    """POST /stops/{id}/activities (CONTRACTS §4).

    `cost` is optional on the way in: when omitted the route copies
    `Activity.cost` at insert time (CONTRACTS §2). Passing it explicitly
    lets a user record what they actually expect to pay for this trip.
    """

    activity_id: uuid.UUID
    scheduled_date: date
    scheduled_time: Optional[float] = Field(default=None, ge=0, lt=24)
    cost: Optional[Decimal] = Field(default=None, ge=0, max_digits=10, decimal_places=2)
    notes: Optional[str] = None


class ItineraryActivityUpdate(BaseModel):
    scheduled_date: Optional[date] = None
    scheduled_time: Optional[float] = Field(default=None, ge=0, lt=24)
    cost: Optional[Decimal] = Field(default=None, ge=0, max_digits=10, decimal_places=2)
    notes: Optional[str] = None


class ItineraryActivityRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    stop_id: uuid.UUID
    activity_id: uuid.UUID
    scheduled_date: date
    scheduled_time: Optional[float] = None
    cost: Optional[Decimal] = None
    notes: Optional[str] = None
    activity: Optional[ActivityRead] = None
