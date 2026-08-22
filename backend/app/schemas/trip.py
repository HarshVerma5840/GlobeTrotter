"""Trip request/response models (CONTRACTS §2, §4)."""
from __future__ import annotations

import uuid
from datetime import date
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.schemas.stop import StopRead


class TripCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    date_start: date
    date_end: date
    description: Optional[str] = None
    cover_image_url: Optional[str] = Field(default=None, max_length=1024)
    budget_target: Optional[Decimal] = Field(default=None, ge=0, max_digits=10, decimal_places=2)

    @model_validator(mode="after")
    def _dates_ordered(self) -> "TripCreate":
        # Mirrors the ck_trip_dates DB constraint so the caller gets a clean
        # 422 instead of an IntegrityError surfacing as a 500.
        if self.date_end < self.date_start:
            raise ValueError("date_end must be on or after date_start.")
        return self


class TripUpdate(BaseModel):
    """
    PATCH /trips/{id}.

    `is_public` is here, but `share_token` deliberately is NOT: the token is
    server-generated on first share and never regenerated implicitly
    (CONTRACTS §2), so it is not a client-settable field.
    """

    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    date_start: Optional[date] = None
    date_end: Optional[date] = None
    description: Optional[str] = None
    cover_image_url: Optional[str] = Field(default=None, max_length=1024)
    budget_target: Optional[Decimal] = Field(default=None, ge=0, max_digits=10, decimal_places=2)
    is_public: Optional[bool] = None


class TripRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    date_start: date
    date_end: date
    description: Optional[str] = None
    cover_image_url: Optional[str] = None
    user_id: uuid.UUID
    is_public: bool
    share_token: Optional[str] = None
    budget_target: Optional[Decimal] = None


class TripDetailRead(TripRead):
    """A trip plus its ordered stops — what the Itinerary Builder/View loads."""

    stops: List[StopRead] = []
