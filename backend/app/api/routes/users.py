"""GET/PATCH /users/me (CONTRACTS §3)."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.city import City
from app.models.user import User
from app.schemas.user import UserRead, UserUpdate

router = APIRouter(tags=["users"])


@router.get("/users/me", response_model=UserRead)
async def read_me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.patch("/users/me", response_model=UserRead)
async def update_me(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Update name, language, and/or the saved-destinations list."""
    data = payload.model_dump(exclude_unset=True)

    if data.get("name") is not None:
        current_user.name = data["name"]
    if data.get("language") is not None:
        current_user.language = data["language"]
    if data.get("saved_city_ids") is not None:
        result = await db.execute(select(City).where(City.id.in_(data["saved_city_ids"])))
        current_user.saved_cities = list(result.scalars().all())

    await db.commit()
    await db.refresh(current_user, attribute_names=["saved_cities"])
    return current_user
