"""Public (unauthenticated) share response models (CONTRACTS §6)."""
from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel

from app.schemas.stop import StopRead


class PublicTripRead(BaseModel):
    """
    Read-only trip served by GET /public/trips/{token}.

    Deliberately NOT TripRead: this response carries no `id`, no `user_id`,
    and no `share_token`. A public viewer gets the itinerary, never the
    internal ids that would let them probe authenticated routes, and never
    a token they could reshare beyond the one they already hold.
    """

    name: str
    date_start: date
    date_end: date
    description: Optional[str] = None
    cover_image_url: Optional[str] = None
    owner_name: str
    amount_total: Decimal
    stops: List[StopRead] = []
