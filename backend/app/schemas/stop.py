"""Stop request/response models (CONTRACTS §2, §4, §7.2)."""
from __future__ import annotations

import uuid
from datetime import date
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.city import CityRead
from app.schemas.itinerary_activity import ItineraryActivityRead


class StopCreate(BaseModel):
    """POST /trips/{id}/stops.

    `sequence` is optional: omit it and the route appends the stop to the
    end of the trip, which is what the Itinerary Builder does for every
    "add city" click. The cross-row date rules (CONTRACTS §2) are checked
    in services/stops.py at write time, not here.
    """

    city_id: uuid.UUID
    date_start: date
    date_end: date
    sequence: Optional[int] = Field(default=None, ge=0)


class StopUpdate(BaseModel):
    city_id: Optional[uuid.UUID] = None
    date_start: Optional[date] = None
    date_end: Optional[date] = None
    sequence: Optional[int] = Field(default=None, ge=0)


class StopReorderItem(BaseModel):
    id: uuid.UUID
    sequence: int = Field(ge=0)


class StopRead(BaseModel):
    """
    Stop as returned by the API.

    The last five fields are computed per request by services/feasibility.py
    (CONTRACTS §7.2) — they are NOT columns. The frontend displays them and
    never recomputes any of them itself (CONTRACTS §8).
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    trip_id: uuid.UUID
    city_id: uuid.UUID
    sequence: int
    date_start: date
    date_end: date
    city: Optional[CityRead] = None
    itinerary_activities: List[ItineraryActivityRead] = []

    # --- computed at request time (CONTRACTS §7.2), all None on the first stop ---
    distance_from_previous_km: Optional[float] = None
    travel_duration_hours: Optional[float] = None
    distance_source: Optional[Literal["directions", "haversine"]] = None
    travel_gap_days: Optional[int] = None
    is_feasible: bool = True
