"""
GET /admin/analytics (B13, CONTRACTS §4) — `role=admin` only.

Platform-wide aggregates for the optional Admin/Analytics screen. Every
figure is computed live; nothing here is stored or cached, same reasoning
as the budget endpoint (ARCHITECTURE §5).

Deliberately aggregate-only: this returns counts and rankings, never a
list of individual users' trips. An analytics screen does not need to read
anybody's itinerary, and not returning it means a compromised admin
account leaks statistics rather than everyone's travel plans.
"""
from __future__ import annotations

from decimal import Decimal
from typing import Dict, List

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.db.session import get_db
from app.models.activity import Activity, ActivityCategory
from app.models.city import City
from app.models.itinerary_activity import ItineraryActivity
from app.models.stop import Stop
from app.models.trip import Trip
from app.models.user import User

router = APIRouter(prefix="/admin", tags=["admin"])


class PopularCity(BaseModel):
    city_id: str
    name: str
    country: str
    trip_count: int


class AdminAnalytics(BaseModel):
    total_users: int
    total_trips: int
    total_stops: int
    total_itinerary_activities: int
    public_trips: int
    catalog_cities: int
    catalog_activities: int
    average_stops_per_trip: float
    total_planned_spend: Decimal
    spend_by_category: Dict[ActivityCategory, Decimal]
    most_popular_cities: List[PopularCity]


@router.get("/analytics", response_model=AdminAnalytics)
async def analytics(
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminAnalytics:
    async def count(model) -> int:
        return int((await db.execute(select(func.count()).select_from(model))).scalar_one())

    total_users = await count(User)
    total_trips = await count(Trip)
    total_stops = await count(Stop)
    total_items = await count(ItineraryActivity)
    catalog_cities = await count(City)
    catalog_activities = await count(Activity)

    public_trips = int(
        (
            await db.execute(
                select(func.count()).select_from(Trip).where(Trip.is_public.is_(True))
            )
        ).scalar_one()
    )

    spend_rows = await db.execute(
        select(Activity.category, func.coalesce(func.sum(ItineraryActivity.cost), 0))
        .select_from(ItineraryActivity)
        .join(Activity, ItineraryActivity.activity_id == Activity.id)
        .group_by(Activity.category)
    )
    # All six categories always present, so a chart has stable slices —
    # same contract as the per-trip budget response.
    by_category: Dict[ActivityCategory, Decimal] = {c: Decimal("0.00") for c in ActivityCategory}
    for category, total in spend_rows.all():
        key = category if isinstance(category, ActivityCategory) else ActivityCategory(category)
        by_category[key] = Decimal(total).quantize(Decimal("0.01"))

    popular = await db.execute(
        select(City.id, City.name, City.country, func.count(Stop.id).label("n"))
        .join(Stop, Stop.city_id == City.id)
        .group_by(City.id, City.name, City.country)
        .order_by(func.count(Stop.id).desc(), City.name)
        .limit(10)
    )

    return AdminAnalytics(
        total_users=total_users,
        total_trips=total_trips,
        total_stops=total_stops,
        total_itinerary_activities=total_items,
        public_trips=public_trips,
        catalog_cities=catalog_cities,
        catalog_activities=catalog_activities,
        # Guard the divisor: a fresh platform has zero trips.
        average_stops_per_trip=round(total_stops / total_trips, 2) if total_trips else 0.0,
        total_planned_spend=sum(by_category.values(), Decimal("0.00")),
        spend_by_category=by_category,
        most_popular_cities=[
            PopularCity(city_id=str(cid), name=name, country=country, trip_count=int(n))
            for cid, name, country, n in popular.all()
        ],
    )
