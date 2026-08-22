"""Activity (catalog) request/response models (CONTRACTS §2, §4)."""
from __future__ import annotations

import uuid
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.activity import ActivityCategory


class ActivityRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    city_id: uuid.UUID
    category: ActivityCategory
    cost: Optional[Decimal] = None
    duration_hours: Optional[float] = None
    description: Optional[str] = None
    image_url: Optional[str] = None


class ActivityCreate(BaseModel):
    """POST /activities — catalog_manager only (CONTRACTS §4/§5)."""

    name: str = Field(min_length=1, max_length=255)
    city_id: uuid.UUID
    category: ActivityCategory
    cost: Optional[Decimal] = Field(default=None, ge=0, max_digits=10, decimal_places=2)
    duration_hours: Optional[float] = Field(default=None, ge=0)
    description: Optional[str] = None
    image_url: Optional[str] = Field(default=None, max_length=1024)


class ActivityUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    city_id: Optional[uuid.UUID] = None
    category: Optional[ActivityCategory] = None
    cost: Optional[Decimal] = Field(default=None, ge=0, max_digits=10, decimal_places=2)
    duration_hours: Optional[float] = Field(default=None, ge=0)
    description: Optional[str] = None
    image_url: Optional[str] = Field(default=None, max_length=1024)
