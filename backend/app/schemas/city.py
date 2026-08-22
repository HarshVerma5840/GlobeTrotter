"""City request/response models (CONTRACTS §2, §4)."""
from __future__ import annotations

import uuid
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class CityRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    country: str
    cost_index: Optional[float] = None
    popularity: Optional[int] = None
    image_url: Optional[str] = None
    latitude: float
    longitude: float
    google_place_id: Optional[str] = None


class CityCreate(BaseModel):
    """POST /cities — catalog_manager only (CONTRACTS §4/§5).

    latitude/longitude are required, not optional: CONTRACTS §2 makes them
    non-negotiable because the route map and the distance calc are silently
    useless without them.
    """

    name: str = Field(min_length=1, max_length=255)
    country: str = Field(min_length=1, max_length=255)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    cost_index: Optional[float] = Field(default=None, ge=0)
    popularity: Optional[int] = Field(default=None, ge=0)
    image_url: Optional[str] = Field(default=None, max_length=1024)
    google_place_id: Optional[str] = Field(default=None, max_length=255)


class CityUpdate(BaseModel):
    """PATCH /cities/{id} — every field optional, but lat/lng may never be nulled."""

    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    country: Optional[str] = Field(default=None, min_length=1, max_length=255)
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)
    cost_index: Optional[float] = Field(default=None, ge=0)
    popularity: Optional[int] = Field(default=None, ge=0)
    image_url: Optional[str] = Field(default=None, max_length=1024)
