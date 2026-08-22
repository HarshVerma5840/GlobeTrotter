"""User/auth request+response models (CONTRACTS §2, §3)."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.core.security import BCRYPT_MAX_BYTES
from app.models.user import UserRole


class UserCreate(BaseModel):
    """POST /auth/signup body (CONTRACTS §3)."""

    email: EmailStr
    password: str = Field(min_length=8)
    name: str = Field(min_length=1, max_length=255)

    @field_validator("password")
    @classmethod
    def _within_bcrypt_limit(cls, value: str) -> str:
        if len(value.encode("utf-8")) > BCRYPT_MAX_BYTES:
            raise ValueError(f"Password must be at most {BCRYPT_MAX_BYTES} bytes.")
        return value


class CityBrief(BaseModel):
    """Enough of a City to render a saved-destination chip on the profile."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    country: str


class UserRead(BaseModel):
    """
    Public shape of a user. Deliberately has no `hashed_password` field,
    so a digest can never leak through a response model by accident.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    name: str
    language: str
    role: UserRole
    created_at: datetime
    saved_cities: List[CityBrief] = []


class UserUpdate(BaseModel):
    """PATCH /users/me body (CONTRACTS §3): name, language, saved_city_ids."""

    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    language: Optional[str] = Field(default=None, min_length=2, max_length=10)
    saved_city_ids: Optional[List[uuid.UUID]] = None


class Token(BaseModel):
    """CONTRACTS §3 response shape: {access_token, token_type: "bearer"}."""

    access_token: str
    token_type: str = "bearer"
