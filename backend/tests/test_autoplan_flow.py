"""
End-to-end tests for the Smart Trip Assistant (B10, CONTRACTS §7.1).

These run with GROQ_API_KEY unset, so they exercise the deterministic
fallback — which is the point. CONTRACTS §8 and QA's Q9 both make the
"works with no LLM" path P0: a dead API key must degrade the feature, never
break the request.
"""
from __future__ import annotations

from decimal import Decimal

import pytest
import pytest_asyncio

from app.models.activity import Activity, ActivityCategory
from app.models.city import City
from app.services import autoplan as autoplan_service

pytestmark = pytest.mark.asyncio


async def auth_headers(client, email="auto@example.com"):
    await client.post(
        "/auth/signup", json={"email": email, "password": "hunter2hunter2", "name": "Auto Planner"}
    )
    resp = await client.post("/auth/login", data={"username": email, "password": "hunter2hunter2"})
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


@pytest_asyncio.fixture
async def rich_catalog(db_session):
    """Three cities, each with activities spanning several categories."""
    cities = [
        City(name="Paris", country="France", latitude=48.86, longitude=2.35, popularity=95, cost_index=1.4),
        City(name="Rome", country="Italy", latitude=41.90, longitude=12.50, popularity=90, cost_index=1.2),
        City(name="Lisbon", country="Portugal", latitude=38.72, longitude=-9.14, popularity=85, cost_index=0.9),
    ]
    db_session.add_all(cities)
    await db_session.flush()

    for city in cities:
        db_session.add_all(
            [
                Activity(
                    name=f"{city.name} museum",
                    city_id=city.id,
                    category=ActivityCategory.sightseeing,
                    cost=Decimal("20.00"),
                ),
                Activity(
                    name=f"{city.name} food tour",
                    city_id=city.id,
                    category=ActivityCategory.food,
                    cost=Decimal("35.00"),
                ),
                Activity(
                    name=f"{city.name} kayak",
                    city_id=city.id,
                    category=ActivityCategory.adventure,
                    cost=Decimal("60.00"),
                ),
                Activity(
                    name=f"{city.name} walk",
                    city_id=city.id,
                    category=ActivityCategory.sightseeing,
                    cost=Decimal("0.00"),
                ),
            ]
        )
    await db_session.commit()
    return cities


async def make_trip(client, headers, **overrides):
    body = {"name": "Grand Tour", "date_start": "2026-09-01", "date_end": "2026-09-09", **overrides}
    return (await client.post("/trips", json=body, headers=headers)).json()


@pytest.fixture(autouse=True)
def _no_groq_key(monkeypatch):
    """Force the fallback path — no network is touched by this module."""
    monkeypatch.setattr(autoplan_service.settings, "groq_api_key", None)


async def test_autoplan_fills_an_empty_trip_without_groq(client, rich_catalog):
    headers = await auth_headers(client)
    trip = await make_trip(client, headers)

    resp = await client.post(
        f"/trips/{trip['id']}/auto-plan",
        json={"pace": "balanced", "interest_categories": ["food"]},
        headers=headers,
    )
    assert resp.status_code == 200
    body = resp.json()

    # A dead/absent API key degrades cleverness, never availability.
    assert body["source"] == "fallback"
    assert body["stops_created"] >= 1
    assert body["activities_created"] >= 1
    assert len(body["stops"]) == body["stops_created"]


async def test_autoplan_writes_real_editable_rows_not_a_preview(client, rich_catalog):
    """CONTRACTS §8: the assistant only ever persists real rows."""
    headers = await auth_headers(client)
    trip = await make_trip(client, headers)
    await client.post(f"/trips/{trip['id']}/auto-plan", json={}, headers=headers)

    # Re-read through the ordinary itinerary route the builder uses.
    stops = (await client.get(f"/trips/{trip['id']}/stops", headers=headers)).json()
    assert stops, "auto-plan produced no persisted stops"
    assert any(s["itinerary_activities"] for s in stops)

    # And they are editable with the normal CRUD routes.
    resp = await client.patch(
        f"/stops/{stops[0]['id']}", json={"date_end": stops[0]["date_end"]}, headers=headers
    )
    assert resp.status_code == 200


async def test_autoplan_stops_stay_inside_the_trip_and_never_overlap(client, rich_catalog):
    headers = await auth_headers(client)
    trip = await make_trip(client, headers)
    await client.post(f"/trips/{trip['id']}/auto-plan", json={}, headers=headers)

    stops = (await client.get(f"/trips/{trip['id']}/stops", headers=headers)).json()
    for stop in stops:
        assert trip["date_start"] <= stop["date_start"] <= trip["date_end"]
        assert trip["date_start"] <= stop["date_end"] <= trip["date_end"]

    for earlier, later in zip(stops, stops[1:]):
        assert earlier["date_end"] < later["date_start"]
        # Every generated hop gets a real travel day, so nothing it creates
        # trips its own feasibility check.
        assert later["is_feasible"] is True


async def test_autoplan_respects_budget_target(client, rich_catalog):
    headers = await auth_headers(client)
    trip = await make_trip(client, headers)

    resp = await client.post(
        f"/trips/{trip['id']}/auto-plan", json={"budget_target": "40.00"}, headers=headers
    )
    assert Decimal(resp.json()["estimated_total"]) <= Decimal("40.00")

    budget = (await client.get(f"/trips/{trip['id']}/budget", headers=headers)).json()
    assert budget["is_over_budget"] is not True


async def test_pace_changes_how_much_gets_scheduled(client, rich_catalog):
    """relaxed = 2/day, packed = 4/day (CONTRACTS §7.1)."""
    relaxed_headers = await auth_headers(client, "relaxed@example.com")
    relaxed_trip = await make_trip(client, relaxed_headers)
    relaxed = (
        await client.post(
            f"/trips/{relaxed_trip['id']}/auto-plan", json={"pace": "relaxed"}, headers=relaxed_headers
        )
    ).json()

    packed_headers = await auth_headers(client, "packed@example.com")
    packed_trip = await make_trip(client, packed_headers)
    packed = (
        await client.post(
            f"/trips/{packed_trip['id']}/auto-plan", json={"pace": "packed"}, headers=packed_headers
        )
    ).json()

    assert packed["activities_created"] >= relaxed["activities_created"]


async def test_autoplan_is_non_destructive_on_a_partially_built_trip(client, rich_catalog):
    headers = await auth_headers(client)
    trip = await make_trip(client, headers)

    existing = (
        await client.post(
            f"/trips/{trip['id']}/stops",
            json={
                "city_id": str(rich_catalog[0].id),
                "date_start": "2026-09-01",
                "date_end": "2026-09-03",
            },
            headers=headers,
        )
    ).json()

    resp = await client.post(f"/trips/{trip['id']}/auto-plan", json={}, headers=headers)
    assert resp.status_code == 200

    stops = (await client.get(f"/trips/{trip['id']}/stops", headers=headers)).json()
    ids = [s["id"] for s in stops]
    # The hand-built stop survives untouched, and the generated ones sit after it.
    assert existing["id"] in ids
    assert len(ids) > 1
    for stop in stops:
        if stop["id"] != existing["id"]:
            assert stop["date_start"] > existing["date_end"]


async def test_autoplan_on_a_fully_planned_trip_is_a_clean_422(client, rich_catalog):
    headers = await auth_headers(client)
    trip = await make_trip(client, headers, date_start="2026-09-01", date_end="2026-09-03")
    await client.post(
        f"/trips/{trip['id']}/stops",
        json={
            "city_id": str(rich_catalog[0].id),
            "date_start": "2026-09-01",
            "date_end": "2026-09-03",
        },
        headers=headers,
    )

    resp = await client.post(f"/trips/{trip['id']}/auto-plan", json={}, headers=headers)
    # A clear business-rule message, never a 500.
    assert resp.status_code == 422
    assert "already fully planned" in resp.json()["detail"]


async def test_autoplan_on_an_empty_catalog_is_a_clean_422(client):
    headers = await auth_headers(client)
    trip = await make_trip(client, headers)
    resp = await client.post(f"/trips/{trip['id']}/auto-plan", json={}, headers=headers)
    assert resp.status_code == 422
    assert "seed" in resp.json()["detail"]


async def test_autoplan_rejects_more_than_three_interests(client, rich_catalog):
    headers = await auth_headers(client)
    trip = await make_trip(client, headers)
    resp = await client.post(
        f"/trips/{trip['id']}/auto-plan",
        json={"interest_categories": ["food", "sightseeing", "adventure", "stay"]},
        headers=headers,
    )
    assert resp.status_code == 422


async def test_autoplan_refuses_someone_elses_trip(client, rich_catalog):
    owner = await auth_headers(client, "owner3@example.com")
    trip = await make_trip(client, owner)
    intruder = await auth_headers(client, "intruder3@example.com")
    resp = await client.post(f"/trips/{trip['id']}/auto-plan", json={}, headers=intruder)
    assert resp.status_code == 403
