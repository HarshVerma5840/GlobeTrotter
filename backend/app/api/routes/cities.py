"""City catalog search + catalog_manager writes (B7, CONTRACTS §4)."""
from __future__ import annotations

import uuid
from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_catalog_manager
from app.db.session import get_db
from app.models.city import City
from app.models.user import User
from app.schemas.city import CityCreate, CityRead, CityUpdate

router = APIRouter(prefix="/cities", tags=["cities"])


@router.get("", response_model=List[CityRead])
async def search_cities(
    q: Optional[str] = Query(default=None, description="Case-insensitive match on city or country"),
    country: Optional[str] = None,
    cost_max: Optional[float] = Query(default=None, ge=0),
    sort: Literal["popularity", "cost", "name"] = "popularity",
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    _: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[City]:
    """
    Query params are exactly those documented in CONTRACTS §4 — `q`,
    `country`, `cost_max`, `sort`. `limit`/`offset` are added for paging;
    they are additive and change no documented behaviour.
    """
    stmt = select(City)

    if q:
        # ilike on both name and country so "japan" finds Tokyo.
        pattern = f"%{q}%"
        stmt = stmt.where(City.name.ilike(pattern) | City.country.ilike(pattern))
    if country:
        stmt = stmt.where(City.country.ilike(country))
    if cost_max is not None:
        # Cities with no cost_index are excluded rather than assumed cheap —
        # an unknown price should not sneak past a budget filter.
        stmt = stmt.where(City.cost_index.is_not(None), City.cost_index <= cost_max)

    if sort == "popularity":
        stmt = stmt.order_by(City.popularity.desc().nullslast(), City.name)
    elif sort == "cost":
        stmt = stmt.order_by(City.cost_index.asc().nullslast(), City.name)
    else:
        stmt = stmt.order_by(City.name)

    result = await db.execute(stmt.limit(limit).offset(offset))
    return list(result.scalars().all())


@router.get("/{city_id}", response_model=CityRead)
async def read_city(
    city_id: uuid.UUID,
    _: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> City:
    city = await db.get(City, city_id)
    if city is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="City not found")
    return city


@router.post("", response_model=CityRead, status_code=status.HTTP_201_CREATED)
async def create_city(
    payload: CityCreate,
    _: User = Depends(require_catalog_manager),
    db: AsyncSession = Depends(get_db),
) -> City:
    """Catalog write — gated to catalog_manager/admin (CONTRACTS §5)."""
    city = City(**payload.model_dump())
    db.add(city)
    await db.commit()
    await db.refresh(city)
    return city


@router.patch("/{city_id}", response_model=CityRead)
async def update_city(
    city_id: uuid.UUID,
    payload: CityUpdate,
    _: User = Depends(require_catalog_manager),
    db: AsyncSession = Depends(get_db),
) -> City:
    city = await db.get(City, city_id)
    if city is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="City not found")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(city, key, value)

    await db.commit()
    await db.refresh(city)
    return city
