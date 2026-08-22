"""
B5 — seed catalog invariants (CONTRACTS §2/§8).

The two properties asserted here are the ones that silently break other
tracks if they regress: missing coordinates kill the route map and the
feasibility check, and a category gap makes the budget breakdown and the
Smart Trip Assistant's interest filter look broken.
"""
from decimal import Decimal

from sqlalchemy import select

from app.models import Activity, ActivityCategory, City
from app.seed import CATALOG, seed

ALL_CATEGORIES = {c.value for c in ActivityCategory}


def test_every_seed_city_has_coordinates():
    """CONTRACTS §8: non-negotiable, checked before anything touches a DB."""
    for entry in CATALOG:
        assert isinstance(entry["latitude"], float), entry["name"]
        assert isinstance(entry["longitude"], float), entry["name"]
        assert -90 <= entry["latitude"] <= 90, entry["name"]
        assert -180 <= entry["longitude"] <= 180, entry["name"]


def test_seed_uses_only_contract_categories():
    for entry in CATALOG:
        for _, category, _, _ in entry["activities"]:
            assert category in ALL_CATEGORIES, f"{entry['name']}: bad category {category}"


def test_every_city_covers_all_six_categories():
    """A 'real spread across all six categories', per B5 — in every city."""
    for entry in CATALOG:
        covered = {category for _, category, _, _ in entry["activities"]}
        assert covered == ALL_CATEGORIES, f"{entry['name']} missing {ALL_CATEGORIES - covered}"


def test_seed_city_names_are_unique():
    keys = [(e["name"], e["country"]) for e in CATALOG]
    assert len(keys) == len(set(keys))


def test_catalog_spans_multiple_continents():
    """B11's feasibility check needs genuinely long-haul pairs to flag."""
    longitudes = [e["longitude"] for e in CATALOG]
    assert max(longitudes) - min(longitudes) > 180


async def test_seed_populates_the_database(db_session):
    cities_added, activities_added = await seed(db_session)
    assert cities_added == len(CATALOG)
    assert activities_added == sum(len(e["activities"]) for e in CATALOG)

    cities = (await db_session.execute(select(City))).scalars().all()
    assert len(cities) == len(CATALOG)
    for city in cities:
        assert city.latitude is not None and city.longitude is not None


async def test_seed_is_idempotent(db_session):
    """Re-running must add nothing — the startup sequence may run it twice."""
    await seed(db_session)
    cities_added, activities_added = await seed(db_session)
    assert (cities_added, activities_added) == (0, 0)

    count = len((await db_session.execute(select(City))).scalars().all())
    assert count == len(CATALOG)


async def test_seeded_activities_cover_all_categories_in_db(db_session):
    await seed(db_session)
    stored = {
        c for c in (await db_session.execute(select(Activity.category))).scalars()
    }
    assert {c.value for c in stored} == ALL_CATEGORIES


async def test_seeded_costs_are_decimal_not_float(db_session):
    """CONTRACTS §8: money is Numeric(10,2)."""
    await seed(db_session)
    cost = (await db_session.execute(select(Activity.cost))).scalar()
    assert isinstance(cost, Decimal)
