"""Activity catalog search + catalog_manager writes (B7, CONTRACTS §4)."""
from __future__ import annotations

import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_catalog_manager
from app.db.session import get_db
from app.models.activity import Activity, ActivityCategory
from app.models.city import City
from app.models.user import User
from app.schemas.activity import ActivityCreate, ActivityRead, ActivityUpdate

router = APIRouter(prefix="/activities", tags=["activities"])


@router.get("", response_model=List[ActivityRead])
async def search_activities(
    city_id: Optional[uuid.UUID] = None,
    category: Optional[ActivityCategory] = None,
    cost_max: Optional[float] = Query(default=None, ge=0),
    q: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    _: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[Activity]:
    """
    CONTRACTS §4 documents `city_id`, `category`, `cost_max`. `q`/`limit`/
    `offset` are additive conveniences for the Activity Search screen.

    `category` is typed as the enum, so an unknown value is a clean 422
    rather than a silent empty result set.
    """
    stmt = select(Activity)

    if city_id is not None:
        stmt = stmt.where(Activity.city_id == city_id)
    if category is not None:
        stmt = stmt.where(Activity.category == category)
    if cost_max is not None:
        # Free activities (cost NULL or 0) are always within any budget cap.
        stmt = stmt.where((Activity.cost.is_(None)) | (Activity.cost <= cost_max))
    if q:
        stmt = stmt.where(Activity.name.ilike(f"%{q}%"))

    result = await db.execute(
        stmt.order_by(Activity.cost.asc().nullsfirst(), Activity.name).limit(limit).offset(offset)
    )
    return list(result.scalars().all())


@router.get("/{activity_id}", response_model=ActivityRead)
async def read_activity(
    activity_id: uuid.UUID,
    _: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Activity:
    activity = await db.get(Activity, activity_id)
    if activity is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")
    return activity


@router.post("", response_model=ActivityRead, status_code=status.HTTP_201_CREATED)
async def create_activity(
    payload: ActivityCreate,
    _: User = Depends(require_catalog_manager),
    db: AsyncSession = Depends(get_db),
) -> Activity:
    if await db.get(City, payload.city_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="City not found")

    activity = Activity(**payload.model_dump())
    db.add(activity)
    await db.commit()
    await db.refresh(activity)
    return activity


@router.patch("/{activity_id}", response_model=ActivityRead)
async def update_activity(
    activity_id: uuid.UUID,
    payload: ActivityUpdate,
    _: User = Depends(require_catalog_manager),
    db: AsyncSession = Depends(get_db),
) -> Activity:
    activity = await db.get(Activity, activity_id)
    if activity is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")

    data = payload.model_dump(exclude_unset=True)
    if "city_id" in data and await db.get(City, data["city_id"]) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="City not found")

    for key, value in data.items():
        setattr(activity, key, value)

    await db.commit()
    await db.refresh(activity)
    return activity
