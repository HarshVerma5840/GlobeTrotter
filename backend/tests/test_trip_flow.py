"""
End-to-end tests for the Wave 1 routes (B6/B7/B8/B9).

This file walks the demo critical path QA's Q1 checklist describes:
signup -> create trip -> add stops -> add activities -> budget -> share ->
public view -> copy. If this file goes red, the demo is broken.
"""
from __future__ import annotations

from decimal import Decimal

import pytest
import pytest_asyncio

from app.models.activity import Activity, ActivityCategory
from app.models.city import City

pytestmark = pytest.mark.asyncio


async def auth_headers(client, email="planner@example.com"):
    await client.post(
        "/auth/signup", json={"email": email, "password": "hunter2hunter2", "name": "Ada Planner"}
    )
    resp = await client.post("/auth/login", data={"username": email, "password": "hunter2hunter2"})
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


@pytest_asyncio.fixture
async def catalog(db_session):
    """Two far-apart cities with priced activities across several categories."""
    paris = City(name="Paris", country="France", latitude=48.8566, longitude=2.3522, popularity=90)
    bangkok = City(
        name="Bangkok", country="Thailand", latitude=13.7563, longitude=100.5018, popularity=80
    )
    db_session.add_all([paris, bangkok])
    await db_session.flush()

    acts = [
        Activity(
            name="Louvre", city_id=paris.id, category=ActivityCategory.sightseeing, cost=Decimal("22.00")
        ),
        Activity(
            name="Bistro dinner", city_id=paris.id, category=ActivityCategory.food, cost=Decimal("48.00")
        ),
        Activity(
            name="Grand Palace",
            city_id=bangkok.id,
            category=ActivityCategory.sightseeing,
            cost=Decimal("15.00"),
        ),
    ]
    db_session.add_all(acts)
    await db_session.commit()
    return {"paris": paris, "bangkok": bangkok, "acts": acts}


async def make_trip(client, headers, **overrides):
    body = {"name": "Euro-Asia", "date_start": "2026-06-01", "date_end": "2026-06-14", **overrides}
    return (await client.post("/trips", json=body, headers=headers)).json()


# --- trips ----------------------------------------------------------------


async def test_create_and_list_trip(client):
    headers = await auth_headers(client)
    trip = await make_trip(client, headers)
    assert trip["name"] == "Euro-Asia"
    assert trip["is_public"] is False and trip["share_token"] is None

    listed = await client.get("/trips", headers=headers)
    assert [t["id"] for t in listed.json()] == [trip["id"]]


async def test_trip_rejects_inverted_dates(client):
    headers = await auth_headers(client)
    resp = await client.post(
        "/trips",
        json={"name": "Nope", "date_start": "2026-06-10", "date_end": "2026-06-01"},
        headers=headers,
    )
    assert resp.status_code == 422


async def test_another_user_cannot_see_your_trip(client):
    owner = await auth_headers(client, "owner@example.com")
    trip = await make_trip(client, owner)

    intruder = await auth_headers(client, "intruder@example.com")
    assert (await client.get(f"/trips/{trip['id']}", headers=intruder)).status_code == 403
    assert (await client.get("/trips", headers=intruder)).json() == []


# --- stops ----------------------------------------------------------------


async def test_add_stops_and_compute_feasibility(client, catalog):
    headers = await auth_headers(client)
    trip = await make_trip(client, headers)

    first = await client.post(
        f"/trips/{trip['id']}/stops",
        json={
            "city_id": str(catalog["paris"].id),
            "date_start": "2026-06-01",
            "date_end": "2026-06-04",
        },
        headers=headers,
    )
    assert first.status_code == 201
    assert first.json()["sequence"] == 0
    assert first.json()["is_feasible"] is True
    assert first.json()["distance_from_previous_km"] is None

    # Paris -> Bangkok the very next day: ~9,400km with no travel day.
    second = await client.post(
        f"/trips/{trip['id']}/stops",
        json={
            "city_id": str(catalog["bangkok"].id),
            "date_start": "2026-06-05",
            "date_end": "2026-06-09",
        },
        headers=headers,
    )
    body = second.json()
    assert body["sequence"] == 1
    assert body["distance_from_previous_km"] > 9000
    assert body["distance_source"] == "haversine"
    assert body["travel_gap_days"] == 1
    assert body["is_feasible"] is True  # one clear day is enough under the pinned rule


async def test_stop_outside_trip_range_is_rejected(client, catalog):
    headers = await auth_headers(client)
    trip = await make_trip(client, headers)
    resp = await client.post(
        f"/trips/{trip['id']}/stops",
        json={
            "city_id": str(catalog["paris"].id),
            "date_start": "2026-07-01",
            "date_end": "2026-07-03",
        },
        headers=headers,
    )
    assert resp.status_code == 422


async def test_overlapping_stops_are_rejected(client, catalog):
    headers = await auth_headers(client)
    trip = await make_trip(client, headers)
    payload = {
        "city_id": str(catalog["paris"].id),
        "date_start": "2026-06-01",
        "date_end": "2026-06-05",
    }
    assert (
        await client.post(f"/trips/{trip['id']}/stops", json=payload, headers=headers)
    ).status_code == 201

    clash = await client.post(
        f"/trips/{trip['id']}/stops",
        json={
            "city_id": str(catalog["bangkok"].id),
            "date_start": "2026-06-03",
            "date_end": "2026-06-08",
        },
        headers=headers,
    )
    assert clash.status_code == 422


async def test_reorder_is_one_batched_request(client, catalog):
    headers = await auth_headers(client)
    trip = await make_trip(client, headers)
    a = (
        await client.post(
            f"/trips/{trip['id']}/stops",
            json={
                "city_id": str(catalog["paris"].id),
                "date_start": "2026-06-01",
                "date_end": "2026-06-04",
            },
            headers=headers,
        )
    ).json()
    b = (
        await client.post(
            f"/trips/{trip['id']}/stops",
            json={
                "city_id": str(catalog["bangkok"].id),
                "date_start": "2026-06-06",
                "date_end": "2026-06-09",
            },
            headers=headers,
        )
    ).json()

    resp = await client.patch(
        "/stops/reorder",
        json=[{"id": a["id"], "sequence": 1}, {"id": b["id"], "sequence": 0}],
        headers=headers,
    )
    assert resp.status_code == 200
    assert [s["id"] for s in resp.json()] == [b["id"], a["id"]]


async def test_reorder_refuses_someone_elses_stop(client, catalog):
    owner = await auth_headers(client, "owner2@example.com")
    trip = await make_trip(client, owner)
    stop = (
        await client.post(
            f"/trips/{trip['id']}/stops",
            json={
                "city_id": str(catalog["paris"].id),
                "date_start": "2026-06-01",
                "date_end": "2026-06-04",
            },
            headers=owner,
        )
    ).json()

    intruder = await auth_headers(client, "intruder2@example.com")
    resp = await client.patch(
        "/stops/reorder", json=[{"id": stop["id"], "sequence": 5}], headers=intruder
    )
    assert resp.status_code == 403


# --- itinerary activities + budget ---------------------------------------


async def test_activity_cost_snapshots_and_budget_aggregates(client, catalog, db_session):
    headers = await auth_headers(client)
    trip = await make_trip(client, headers, budget_target="100.00")
    stop = (
        await client.post(
            f"/trips/{trip['id']}/stops",
            json={
                "city_id": str(catalog["paris"].id),
                "date_start": "2026-06-01",
                "date_end": "2026-06-02",
            },
            headers=headers,
        )
    ).json()

    louvre, bistro = catalog["acts"][0], catalog["acts"][1]
    for activity in (louvre, bistro):
        resp = await client.post(
            f"/stops/{stop['id']}/activities",
            json={"activity_id": str(activity.id), "scheduled_date": "2026-06-01"},
            headers=headers,
        )
        assert resp.status_code == 201

    budget = (await client.get(f"/trips/{trip['id']}/budget", headers=headers)).json()
    assert Decimal(budget["amount_total"]) == Decimal("70.00")  # 22 + 48
    assert Decimal(budget["amount_by_category"]["sightseeing"]) == Decimal("22.00")
    assert Decimal(budget["amount_by_category"]["food"]) == Decimal("48.00")
    assert Decimal(budget["amount_by_category"]["adventure"]) == Decimal("0.00")
    assert budget["duration_days"] == 14
    assert budget["is_over_budget"] is False

    # Re-pricing the catalog must NOT rewrite the planned trip (CONTRACTS §2).
    louvre.cost = Decimal("999.00")
    await db_session.commit()
    after = (await client.get(f"/trips/{trip['id']}/budget", headers=headers)).json()
    assert Decimal(after["amount_total"]) == Decimal("70.00")


async def test_budget_is_null_flagged_without_a_target(client, catalog):
    headers = await auth_headers(client)
    trip = await make_trip(client, headers)
    budget = (await client.get(f"/trips/{trip['id']}/budget", headers=headers)).json()
    assert budget["budget_target"] is None
    # "no target" is not "under target".
    assert budget["is_over_budget"] is None
    assert Decimal(budget["amount_total"]) == Decimal("0.00")


async def test_activity_outside_stop_dates_is_rejected(client, catalog):
    headers = await auth_headers(client)
    trip = await make_trip(client, headers)
    stop = (
        await client.post(
            f"/trips/{trip['id']}/stops",
            json={
                "city_id": str(catalog["paris"].id),
                "date_start": "2026-06-01",
                "date_end": "2026-06-02",
            },
            headers=headers,
        )
    ).json()
    resp = await client.post(
        f"/stops/{stop['id']}/activities",
        json={"activity_id": str(catalog["acts"][0].id), "scheduled_date": "2026-06-09"},
        headers=headers,
    )
    assert resp.status_code == 422


# --- catalog search (B7) --------------------------------------------------


async def test_city_search_filters(client, catalog):
    headers = await auth_headers(client)
    assert len((await client.get("/cities", headers=headers)).json()) == 2

    by_q = await client.get("/cities?q=thai", headers=headers)
    assert [c["name"] for c in by_q.json()] == ["Bangkok"]

    ordered = await client.get("/cities?sort=popularity", headers=headers)
    assert [c["name"] for c in ordered.json()] == ["Paris", "Bangkok"]


async def test_activity_search_filters(client, catalog):
    headers = await auth_headers(client)
    by_cat = await client.get(
        f"/activities?city_id={catalog['paris'].id}&category=food", headers=headers
    )
    assert [a["name"] for a in by_cat.json()] == ["Bistro dinner"]

    cheap = await client.get("/activities?cost_max=20", headers=headers)
    assert [a["name"] for a in cheap.json()] == ["Grand Palace"]

    assert (await client.get("/activities?category=not-a-category", headers=headers)).status_code == 422


async def test_catalog_write_requires_catalog_manager(client):
    headers = await auth_headers(client)
    resp = await client.post(
        "/cities",
        json={"name": "Oslo", "country": "Norway", "latitude": 59.91, "longitude": 10.75},
        headers=headers,
    )
    assert resp.status_code == 403


async def test_catalog_search_requires_auth(client):
    assert (await client.get("/cities")).status_code == 401


# --- public sharing (B9) --------------------------------------------------


async def test_share_publish_view_and_copy(client, catalog):
    headers = await auth_headers(client, "sharer@example.com")
    trip = await make_trip(client, headers)
    stop = (
        await client.post(
            f"/trips/{trip['id']}/stops",
            json={
                "city_id": str(catalog["paris"].id),
                "date_start": "2026-06-01",
                "date_end": "2026-06-03",
            },
            headers=headers,
        )
    ).json()
    await client.post(
        f"/stops/{stop['id']}/activities",
        json={"activity_id": str(catalog["acts"][0].id), "scheduled_date": "2026-06-01"},
        headers=headers,
    )

    published = (
        await client.patch(f"/trips/{trip['id']}", json={"is_public": True}, headers=headers)
    ).json()
    token = published["share_token"]
    assert token

    # No auth needed to read.
    public = await client.get(f"/public/trips/{token}")
    assert public.status_code == 200
    body = public.json()
    assert body["name"] == "Euro-Asia"
    assert Decimal(body["amount_total"]) == Decimal("22.00")
    assert len(body["stops"]) == 1
    # Internal ids and the owner's full identity stay private.
    assert "id" not in body and "user_id" not in body and "share_token" not in body
    assert body["owner_name"] == "Ada"

    # Republishing keeps the same token, so shared links never rot.
    await client.patch(f"/trips/{trip['id']}", json={"is_public": False}, headers=headers)
    assert (await client.get(f"/public/trips/{token}")).status_code == 404
    again = (
        await client.patch(f"/trips/{trip['id']}", json={"is_public": True}, headers=headers)
    ).json()
    assert again["share_token"] == token

    # A different user copies it into their own account.
    copier = await auth_headers(client, "copier@example.com")
    copy = await client.post(f"/public/trips/{token}/copy", headers=copier)
    assert copy.status_code == 201
    copied = copy.json()
    assert copied["name"] == "Euro-Asia (copy)"
    assert copied["id"] != trip["id"]
    # The copy is private and carries no share token of its own.
    assert copied["is_public"] is False and copied["share_token"] is None

    detail = (await client.get(f"/trips/{copied['id']}", headers=copier)).json()
    assert len(detail["stops"]) == 1
    assert len(detail["stops"][0]["itinerary_activities"]) == 1


async def test_unknown_or_private_token_is_404(client):
    headers = await auth_headers(client, "private@example.com")
    trip = await make_trip(client, headers)
    assert (await client.get("/public/trips/made-up-token")).status_code == 404
    # A real trip that was never published is equally invisible.
    assert (await client.get(f"/public/trips/{trip['id']}")).status_code == 404


async def test_copy_requires_login(client, catalog):
    headers = await auth_headers(client, "sharer2@example.com")
    trip = await make_trip(client, headers)
    token = (
        await client.patch(f"/trips/{trip['id']}", json={"is_public": True}, headers=headers)
    ).json()["share_token"]
    assert (await client.post(f"/public/trips/{token}/copy")).status_code == 401


# --- deletion cascades ----------------------------------------------------


async def test_deleting_a_trip_removes_its_stops(client, catalog):
    headers = await auth_headers(client)
    trip = await make_trip(client, headers)
    await client.post(
        f"/trips/{trip['id']}/stops",
        json={
            "city_id": str(catalog["paris"].id),
            "date_start": "2026-06-01",
            "date_end": "2026-06-03",
        },
        headers=headers,
    )
    assert (await client.delete(f"/trips/{trip['id']}", headers=headers)).status_code == 204
    assert (await client.get(f"/trips/{trip['id']}", headers=headers)).status_code == 404
