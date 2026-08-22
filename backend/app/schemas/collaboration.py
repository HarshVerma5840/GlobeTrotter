"""Collaboration request/response models (B12, CONTRACTS §7.3)."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class CollaboratorRead(BaseModel):
    """
    A collaborator as shown on the trip.

    Deliberately not `UserRead`: that carries `role`, `language`, and the
    user's saved cities, none of which a fellow collaborator needs to see.
    Email is included because it's how you identify who you invited.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    email: EmailStr


class CollaboratorAdd(BaseModel):
    """
    POST /trips/{id}/collaborators — invite by email.

    Email rather than user id: the owner knows who they're inviting by
    address, and exposing a user-id lookup would let anyone enumerate
    accounts.
    """

    email: EmailStr


class VoteWrite(BaseModel):
    """POST /itinerary-activities/{id}/vote — CONTRACTS §7.3."""

    value: Literal["up", "down"]


class VoteRead(BaseModel):
    itinerary_activity_id: uuid.UUID
    vote_score: int
    my_vote: Literal["up", "down"] | None = None


class CommentCreate(BaseModel):
    body: str = Field(min_length=1, max_length=4000)


class CommentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    trip_id: uuid.UUID
    user_id: uuid.UUID
    body: str
    created_at: datetime
    author_name: str
